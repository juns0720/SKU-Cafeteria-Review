package com.sungkyul.cafeteria.menu.service;

import com.sungkyul.cafeteria.menu.dto.MenuAggregateProjection;
import com.sungkyul.cafeteria.menu.dto.TodayMenuResponse;
import com.sungkyul.cafeteria.menu.dto.WeeklyMenuResponse;
import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.entity.MenuDate;
import com.sungkyul.cafeteria.menu.repository.HolidayRepository;
import com.sungkyul.cafeteria.menu.repository.MenuDateRepository;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class MenuServiceTest {

    @InjectMocks
    MenuService menuService;

    @Mock
    MenuRepository menuRepository;

    @Mock
    MenuDateRepository menuDateRepository;

    @Mock
    HolidayRepository holidayRepository;

    @Test
    void getTodayMenus_리뷰없는메뉴도_포함한다() {
        LocalDate today = LocalDate.now();
        Menu menu = Menu.builder()
                .id(1L)
                .name("비빔밥")
                .corner("한식")
                .firstSeenAt(today)
                .lastSeenAt(today)
                .reviewCount(0)
                .build();
        MenuDate menuDate = MenuDate.builder()
                .id(10L)
                .menu(menu)
                .servedDate(today)
                .mealSlot("LUNCH")
                .build();

        given(menuDateRepository.findByServedDateAndMealSlotFetchMenu(today, "LUNCH"))
                .willReturn(List.of(menuDate));

        TodayMenuResponse response = menuService.getTodayMenus(null, "LUNCH");

        assertThat(response.menus()).hasSize(1);
        assertThat(response.menus().get(0).name()).isEqualTo("비빔밥");
        assertThat(response.menus().get(0).reviewCount()).isZero();
        assertThat(response.menus().get(0).avgOverall()).isNull();
        assertThat(response.menus().get(0).isNew()).isTrue();
    }

    @Test
    void getTodayMenus_지난주에처음등장한메뉴는_new가아니다() {
        LocalDate today = LocalDate.now();
        LocalDate previousSunday = today.with(DayOfWeek.MONDAY).minusDays(1);
        Menu menu = Menu.builder()
                .id(9L)
                .name("냉모밀")
                .corner("일품")
                .firstSeenAt(previousSunday)
                .lastSeenAt(today)
                .reviewCount(0)
                .build();
        MenuDate menuDate = MenuDate.builder()
                .id(19L)
                .menu(menu)
                .servedDate(today)
                .mealSlot("LUNCH")
                .build();

        given(menuDateRepository.findByServedDateAndMealSlotFetchMenu(today, "LUNCH"))
                .willReturn(List.of(menuDate));

        TodayMenuResponse response = menuService.getTodayMenus(null, "LUNCH");

        assertThat(response.menus()).hasSize(1);
        assertThat(response.menus().get(0).isNew()).isFalse();
    }

    @Test
    void getWeeklyMenus_리뷰없는메뉴도_포함한다() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Menu menu = Menu.builder()
                .id(2L)
                .name("돈까스")
                .corner("양식")
                .firstSeenAt(monday)
                .lastSeenAt(monday)
                .reviewCount(0)
                .build();
        MenuDate menuDate = MenuDate.builder()
                .id(20L)
                .menu(menu)
                .servedDate(monday.plusDays(1))
                .mealSlot("LUNCH")
                .build();

        given(menuDateRepository.findByServedDateBetweenFetchMenu(monday, monday.plusDays(4)))
                .willReturn(List.of(menuDate));

        WeeklyMenuResponse response = menuService.getWeeklyMenus(monday);

        assertThat(response.days().get("TUE")).hasSize(1);
        assertThat(response.days().get("TUE").get(0).name()).isEqualTo("돈까스");
        assertThat(response.days().get("TUE").get(0).reviewCount()).isZero();
        assertThat(response.days().get("TUE").get(0).avgOverall()).isNull();
        assertThat(response.days().get("TUE").get(0).isNew()).isTrue();
    }

    @Test
    void getWeeklyMenus_이전주에처음등장한메뉴는_new가아니다() {
        LocalDate monday = LocalDate.of(2026, 4, 20);
        Menu menu = Menu.builder()
                .id(3L)
                .name("라면")
                .corner("분식")
                .firstSeenAt(monday.minusDays(1))
                .lastSeenAt(monday.plusDays(1))
                .reviewCount(0)
                .build();
        MenuDate menuDate = MenuDate.builder()
                .id(30L)
                .menu(menu)
                .servedDate(monday.plusDays(1))
                .mealSlot("LUNCH")
                .build();

        given(menuDateRepository.findByServedDateBetweenFetchMenu(monday, monday.plusDays(4)))
                .willReturn(List.of(menuDate));

        WeeklyMenuResponse response = menuService.getWeeklyMenus(monday);

        assertThat(response.days().get("TUE")).hasSize(1);
        assertThat(response.days().get("TUE").get(0).isNew()).isFalse();
    }

    @Test
    void getMenus_이번주에처음등장한메뉴만_new다() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        MenuAggregateProjection currentWeekMenu = new MenuAggregateProjection(
                1L,
                "비빔밥",
                "한식",
                weekStart,
                today,
                4.2,
                3L,
                4.0,
                4.0,
                4.5
        );
        MenuAggregateProjection previousWeekMenu = new MenuAggregateProjection(
                2L,
                "돈까스",
                "양식",
                weekStart.minusDays(1),
                today.minusDays(1),
                4.0,
                2L,
                4.0,
                4.0,
                4.0
        );

        given(menuRepository.findAggregated(null))
                .willReturn(List.of(currentWeekMenu, previousWeekMenu));

        var response = menuService.getMenus(null, null, "all");

        assertThat(response).hasSize(2);
        assertThat(response).extracting(menuResponse -> menuResponse.isNew())
                .containsExactly(true, false);
    }
}
