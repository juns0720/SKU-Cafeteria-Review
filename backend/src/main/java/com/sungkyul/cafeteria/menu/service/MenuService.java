package com.sungkyul.cafeteria.menu.service;

import com.sungkyul.cafeteria.menu.dto.MenuResponse;
import com.sungkyul.cafeteria.menu.dto.TodayMenuResponse;
import com.sungkyul.cafeteria.menu.dto.WeeklyMenuResponse;
import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.entity.MenuDate;
import com.sungkyul.cafeteria.menu.repository.MenuDateRepository;
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
    private final MenuDateRepository menuDateRepository;

    @Transactional(readOnly = true)
    public List<MenuResponse> getMenus(String sort) {
        List<MenuResponse> responses = menuRepository.findMenusWithReviews().stream()
                .map(menu -> toResponse(menu,
                        menuDateRepository.findLatestServedDateByMenuId(menu.getId()).orElse(null)))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        Comparator<MenuResponse> comparator = switch (sort != null ? sort : "") {
            case "rating"       -> Comparator.comparingDouble(
                                        (MenuResponse r) -> r.averageRating() != null ? r.averageRating() : 0.0
                                   ).reversed();
            case "reviewCount"  -> Comparator.comparingLong(MenuResponse::reviewCount).reversed();
            default             -> Comparator.comparing(
                                        MenuResponse::servedDate,
                                        Comparator.nullsLast(Comparator.reverseOrder())
                                   );
        };

        responses.sort(comparator);
        return responses;
    }

    @Transactional(readOnly = true)
    public TodayMenuResponse getTodayMenus() {
        LocalDate today = LocalDate.now();
        List<MenuDate> menuDates = menuDateRepository.findByServedDateFetchMenu(today);

        List<MenuResponse> responses = menuDates.stream()
                .map(md -> toResponse(md.getMenu(), md.getServedDate()))
                .toList();

        return new TodayMenuResponse(today, responses);
    }

    @Transactional(readOnly = true)
    public WeeklyMenuResponse getWeeklyMenus(LocalDate date) {
        LocalDate base = (date != null) ? date : LocalDate.now();
        LocalDate monday = base.with(DayOfWeek.MONDAY);
        LocalDate friday = monday.plusDays(4);

        List<MenuDate> menuDates = menuDateRepository.findByServedDateBetweenFetchMenu(monday, friday);

        Map<String, List<MenuResponse>> days = new LinkedHashMap<>();
        String[] keys = {"MON", "TUE", "WED", "THU", "FRI"};
        for (String key : keys) {
            days.put(key, new ArrayList<>());
        }

        for (MenuDate md : menuDates) {
            String key = switch (md.getServedDate().getDayOfWeek()) {
                case MONDAY    -> "MON";
                case TUESDAY   -> "TUE";
                case WEDNESDAY -> "WED";
                case THURSDAY  -> "THU";
                case FRIDAY    -> "FRI";
                default        -> null;
            };
            if (key == null) continue;
            days.get(key).add(toResponse(md.getMenu(), md.getServedDate()));
        }

        return new WeeklyMenuResponse(monday, friday, days);
    }

    @Transactional(readOnly = true)
    public MenuResponse getMenuDetail(Long menuId) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new EntityNotFoundException("메뉴를 찾을 수 없습니다"));

        LocalDate latestDate = menuDateRepository.findLatestServedDateByMenuId(menuId).orElse(null);
        return toResponse(menu, latestDate);
    }

    private MenuResponse toResponse(Menu menu, LocalDate servedDate) {
        return new MenuResponse(
                menu.getId(),
                menu.getName(),
                menu.getCorner(),
                servedDate,
                menuRepository.findAverageRatingByMenuId(menu.getId()),
                menuRepository.countReviewsByMenuId(menu.getId())
        );
    }
}
