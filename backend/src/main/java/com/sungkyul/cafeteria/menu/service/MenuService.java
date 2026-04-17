package com.sungkyul.cafeteria.menu.service;

import com.sungkyul.cafeteria.menu.dto.MenuResponse;
import com.sungkyul.cafeteria.menu.dto.TodayMenuResponse;
import com.sungkyul.cafeteria.menu.dto.WeeklyMenuResponse;
import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;

    @Transactional(readOnly = true)
    public List<MenuResponse> getMenus(String sort) {
        List<MenuResponse> responses = menuRepository.findMenusWithReviews().stream()
                .map(menu -> new MenuResponse(
                        menu.getId(),
                        menu.getName(),
                        menu.getCorner(),
                        menu.getServedDate(),
                        menuRepository.findAverageRatingByMenuId(menu.getId()),
                        menuRepository.countReviewsByMenuId(menu.getId())
                ))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        Comparator<MenuResponse> comparator = switch (sort != null ? sort : "") {
            case "rating"       -> Comparator.comparingDouble(
                                        (MenuResponse r) -> r.averageRating() != null ? r.averageRating() : 0.0
                                   ).reversed();
            case "reviewCount"  -> Comparator.comparingLong(MenuResponse::reviewCount).reversed();
            default             -> Comparator.comparing(MenuResponse::servedDate).reversed();
        };

        responses.sort(comparator);
        return responses;
    }

    @Transactional(readOnly = true)
    public TodayMenuResponse getTodayMenus() {
        LocalDate today = LocalDate.now();
        List<Menu> menus = menuRepository.findByServedDate(today);

        List<MenuResponse> responses = menus.stream()
                .map(menu -> new MenuResponse(
                        menu.getId(),
                        menu.getName(),
                        menu.getCorner(),
                        menu.getServedDate(),
                        menuRepository.findAverageRatingByMenuId(menu.getId()),
                        menuRepository.countReviewsByMenuId(menu.getId())
                ))
                .toList();

        return new TodayMenuResponse(today, responses);
    }

    @Transactional(readOnly = true)
    public WeeklyMenuResponse getWeeklyMenus(LocalDate date) {
        LocalDate base = (date != null) ? date : LocalDate.now();
        LocalDate monday = base.with(DayOfWeek.MONDAY);
        LocalDate friday = monday.plusDays(4);

        List<Menu> menus = menuRepository.findByServedDateBetween(monday, friday);

        Map<String, List<MenuResponse>> days = new LinkedHashMap<>();
        String[] keys = {"MON", "TUE", "WED", "THU", "FRI"};
        for (String key : keys) {
            days.put(key, new ArrayList<>());
        }

        for (Menu menu : menus) {
            String key = switch (menu.getServedDate().getDayOfWeek()) {
                case MONDAY    -> "MON";
                case TUESDAY   -> "TUE";
                case WEDNESDAY -> "WED";
                case THURSDAY  -> "THU";
                case FRIDAY    -> "FRI";
                default        -> null;
            };
            if (key == null) continue;

            days.get(key).add(new MenuResponse(
                    menu.getId(),
                    menu.getName(),
                    menu.getCorner(),
                    menu.getServedDate(),
                    menuRepository.findAverageRatingByMenuId(menu.getId()),
                    menuRepository.countReviewsByMenuId(menu.getId())
            ));
        }

        return new WeeklyMenuResponse(monday, friday, days);
    }

    @Transactional(readOnly = true)
    public MenuResponse getMenuDetail(Long menuId) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new EntityNotFoundException("메뉴를 찾을 수 없습니다"));

        return new MenuResponse(
                menu.getId(),
                menu.getName(),
                menu.getCorner(),
                menu.getServedDate(),
                menuRepository.findAverageRatingByMenuId(menu.getId()),
                menuRepository.countReviewsByMenuId(menu.getId())
        );
    }
}
