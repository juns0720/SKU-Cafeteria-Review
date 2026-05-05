package com.sungkyul.cafeteria.review.repository;

import com.sungkyul.cafeteria.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** 특정 메뉴의 리뷰 목록 (페이징, 최신순 정렬은 호출 측에서 Pageable로 지정) */
    @Query(
            value = "SELECT r FROM Review r JOIN FETCH r.user WHERE r.menu.id = :menuId",
            countQuery = "SELECT COUNT(r) FROM Review r WHERE r.menu.id = :menuId"
    )
    Page<Review> findByMenuIdWithUser(@Param("menuId") Long menuId, Pageable pageable);

    /** 특정 사용자가 작성한 전체 리뷰 목록 (마이페이지) */
    @Query("""
            SELECT r FROM Review r
            JOIN FETCH r.menu
            WHERE r.user.id = :userId
            ORDER BY r.createdAt DESC
            """)
    List<Review> findByUserIdWithMenuOrderByCreatedAtDesc(@Param("userId") Long userId);

    /** 사용자 + 메뉴 조합으로 단건 조회 (수정/삭제 시 소유권 확인) */
    Optional<Review> findByUserIdAndMenuId(Long userId, Long menuId);

    @Query("""
            SELECT r FROM Review r
            JOIN FETCH r.user
            JOIN FETCH r.menu
            WHERE r.id = :reviewId
            """)
    Optional<Review> findByIdWithUserAndMenu(@Param("reviewId") Long reviewId);

    /** 1인 1메뉴 1리뷰 중복 작성 여부 확인 */
    boolean existsByUserIdAndMenuId(Long userId, Long menuId);

    /** 특정 사용자의 리뷰 수 (BadgeTier 계산용) */
    long countByUserId(Long userId);

    /** 특정 사용자가 쓴 리뷰들의 overall 평균 (프로필 통계용, 리뷰 없으면 null) */
    @Query("SELECT AVG((r.tasteRating + r.amountRating + r.valueRating) / 3.0) FROM Review r WHERE r.user.id = :userId")
    Double findAvgOverallByUserId(@Param("userId") Long userId);

    /** 여러 사용자의 리뷰 수 배치 조회 — [userId, count] 쌍 반환 */
    @Query("SELECT r.user.id, COUNT(r) FROM Review r WHERE r.user.id IN :userIds GROUP BY r.user.id")
    List<Object[]> countGroupByUserIdIn(@Param("userIds") Collection<Long> userIds);

    /** 최근 리뷰 N건 (warmup 용도 — 리뷰 entity·인덱스 plan 사전 로드) */
    List<Review> findTop10ByOrderByCreatedAtDesc();

    /** 메뉴별 3축 평균 + 리뷰 수 집계 (집계 캐시 갱신용) */
    @Query("""
        SELECT new com.sungkyul.cafeteria.review.repository.MenuStatAgg(
            AVG(r.tasteRating), AVG(r.amountRating), AVG(r.valueRating), COUNT(r)
        )
        FROM Review r WHERE r.menu.id = :menuId
    """)
    MenuStatAgg aggregateByMenuId(@Param("menuId") Long menuId);
}
