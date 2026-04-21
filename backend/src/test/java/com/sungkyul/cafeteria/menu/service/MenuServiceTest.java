package com.sungkyul.cafeteria.menu.service;

import com.sungkyul.cafeteria.menu.dto.TodayMenuResponse;
import com.sungkyul.cafeteria.menu.dto.WeeklyMenuResponse;
import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.entity.MenuDate;
import com.sungkyul.cafeteria.menu.repository.MenuDateRepository;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
    }
}
