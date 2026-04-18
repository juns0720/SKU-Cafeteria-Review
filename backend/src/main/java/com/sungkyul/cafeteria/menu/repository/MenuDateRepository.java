package com.sungkyul.cafeteria.menu.repository;

import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.entity.MenuDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MenuDateRepository extends JpaRepository<MenuDate, Long> {

    /** 특정 날짜에 제공되는 메뉴 조회 — menu 페치 조인으로 N+1 방지 */
    @Query("SELECT md FROM MenuDate md JOIN FETCH md.menu WHERE md.servedDate = :date")
    List<MenuDate> findByServedDateFetchMenu(@Param("date") LocalDate date);

    /** 날짜 범위로 메뉴 조회 — menu 페치 조인으로 N+1 방지 */
    @Query("SELECT md FROM MenuDate md JOIN FETCH md.menu WHERE md.servedDate BETWEEN :start AND :end")
    List<MenuDate> findByServedDateBetweenFetchMenu(@Param("start") LocalDate start, @Param("end") LocalDate end);

    /** 크롤러 중복 삽입 방지용 */
    boolean existsByMenuAndServedDate(Menu menu, LocalDate servedDate);

    /** 메뉴의 가장 최근 제공일 */
    @Query("SELECT MAX(md.servedDate) FROM MenuDate md WHERE md.menu.id = :menuId")
    Optional<LocalDate> findLatestServedDateByMenuId(@Param("menuId") Long menuId);
}
