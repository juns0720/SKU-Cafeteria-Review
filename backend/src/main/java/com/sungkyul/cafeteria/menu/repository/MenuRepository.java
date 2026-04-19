package com.sungkyul.cafeteria.menu.repository;

import com.sungkyul.cafeteria.menu.dto.MenuAggregateProjection;
import com.sungkyul.cafeteria.menu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MenuRepository extends JpaRepository<Menu, Long> {

    /** 크롤러 upsert용 — (name, corner) 기준으로 메뉴 조회 */
    Optional<Menu> findByNameAndCorner(String name, String corner);

    /**
     * 전체 메뉴 집계 조회 (N+1 해결).
     * corner가 null이면 전체, non-null이면 해당 코너만.
     * firstSeenAt = MIN(served_date), latestServedDate = MAX(served_date),
     * averageRating = AVG(3축 평균), reviewCount = 리뷰 수.
     */
    @Query("""
        SELECT new com.sungkyul.cafeteria.menu.dto.MenuAggregateProjection(
            m.id, m.name, m.corner,
            (SELECT MIN(md.servedDate) FROM MenuDate md WHERE md.menu = m),
            (SELECT MAX(md.servedDate) FROM MenuDate md WHERE md.menu = m),
            (SELECT AVG((r.tasteRating + r.amountRating + r.valueRating) / 3.0) FROM Review r WHERE r.menu = m),
            (SELECT COUNT(r) FROM Review r WHERE r.menu = m)
        )
        FROM Menu m
        WHERE (:corner IS NULL OR m.corner = :corner)
    """)
    List<MenuAggregateProjection> findAggregated(@Param("corner") String corner);

    /** 단건 메뉴 집계 조회 — getMenuDetail 용 */
    @Query("""
        SELECT new com.sungkyul.cafeteria.menu.dto.MenuAggregateProjection(
            m.id, m.name, m.corner,
            (SELECT MIN(md.servedDate) FROM MenuDate md WHERE md.menu = m),
            (SELECT MAX(md.servedDate) FROM MenuDate md WHERE md.menu = m),
            (SELECT AVG((r.tasteRating + r.amountRating + r.valueRating) / 3.0) FROM Review r WHERE r.menu = m),
            (SELECT COUNT(r) FROM Review r WHERE r.menu = m)
        )
        FROM Menu m
        WHERE m.id = :menuId
    """)
    Optional<MenuAggregateProjection> findAggregatedById(@Param("menuId") Long menuId);

    /** 존재하는 코너 목록 (FE CornerTabs 용) */
    @Query("SELECT DISTINCT m.corner FROM Menu m ORDER BY m.corner")
    List<String> findDistinctCorners();
}
