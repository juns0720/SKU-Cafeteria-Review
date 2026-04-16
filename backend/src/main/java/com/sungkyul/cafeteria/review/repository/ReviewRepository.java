package com.sungkyul.cafeteria.review.repository;

import com.sungkyul.cafeteria.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** 특정 메뉴의 리뷰 목록 (페이징, 최신순 정렬은 호출 측에서 Pageable로 지정) */
    Page<Review> findByMenuId(Long menuId, Pageable pageable);

    /** 특정 사용자가 작성한 전체 리뷰 목록 (마이페이지) */
    List<Review> findByUserId(Long userId);

    /** 사용자 + 메뉴 조합으로 단건 조회 (수정/삭제 시 소유권 확인) */
    Optional<Review> findByUserIdAndMenuId(Long userId, Long menuId);

    /** 1인 1메뉴 1리뷰 중복 작성 여부 확인 */
    boolean existsByUserIdAndMenuId(Long userId, Long menuId);
}
