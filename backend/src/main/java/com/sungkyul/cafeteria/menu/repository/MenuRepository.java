package com.sungkyul.cafeteria.menu.repository;

import com.sungkyul.cafeteria.menu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MenuRepository extends JpaRepository<Menu, Long> {

    /** 특정 날짜의 전체 메뉴 조회 (오늘의 학식 화면) */
    List<Menu> findByServedDate(LocalDate servedDate);

    /** 날짜 범위로 메뉴 조회 (주간 식단표) */
    List<Menu> findByServedDateBetween(LocalDate start, LocalDate end);

    /** 크롤링 중복 삽입 방지용 존재 확인 */
    Optional<Menu> findByNameAndServedDateAndCorner(String name, LocalDate servedDate, String corner);

    /** 특정 메뉴의 평균 별점 (리뷰가 없으면 null) */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.menu.id = :menuId")
    Double findAverageRatingByMenuId(@Param("menuId") Long menuId);

    /** 특정 메뉴의 리뷰 수 */
    @Query("SELECT COUNT(r) FROM Review r WHERE r.menu.id = :menuId")
    Long countReviewsByMenuId(@Param("menuId") Long menuId);

    /** 리뷰가 1개 이상 있는 메뉴 전체 조회 */
    @Query("SELECT m FROM Menu m WHERE (SELECT COUNT(r) FROM Review r WHERE r.menu = m) > 0")
    List<Menu> findMenusWithReviews();
}
