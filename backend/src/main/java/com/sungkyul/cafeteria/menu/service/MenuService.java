package com.sungkyul.cafeteria.menu.service;

import com.sungkyul.cafeteria.menu.domain.MenuTier;
import com.sungkyul.cafeteria.menu.dto.MenuAggregateProjection;
import com.sungkyul.cafeteria.menu.dto.MenuResponse;
import com.sungkyul.cafeteria.menu.dto.TodayMenuResponse;
import com.sungkyul.cafeteria.menu.dto.WeeklyMenuResponse;
import com.sungkyul.cafeteria.menu.entity.MenuDate;
import com.sungkyul.cafeteria.menu.repository.MenuDateRepository;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

import org.springframework.data.domain.PageRequest;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;
    private final MenuDateRepository menuDateRepository;

    @Transactional(readOnly = true)
    public List<MenuResponse> getBestOfWeek() {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);
        return menuRepository.findBestOfWeek(monday, sunday, 3, PageRequest.of(0, 5))
                .stream()
                .map(MenuResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getCorners() {
        return menuRepository.findDistinctCorners();
    }

    @Transactional(readOnly = true)
    public List<MenuResponse> getMenus(String sort, String corner, String scope) {
        List<MenuResponse> responses = menuRepository.findAggregated(corner).stream()
                .filter(p -> "all".equalsIgnoreCase(scope) || p.reviewCount() > 0)
                .map(p -> toResponse(p, p.latestServedDate()))
                .collect(Collectors.toCollection(ArrayList::new));

        Comparator<MenuResponse> comparator = switch (sort != null ? sort : "") {
            case "rating"      -> Comparator.comparingDouble(
                                       (MenuResponse r) -> r.averageRating() != null ? r.averageRating() : 0.0
                                  ).reversed();
            case "reviewCount" -> Comparator.comparingLong(MenuResponse::reviewCount).reversed();
            default            -> Comparator.comparing(
                                       MenuResponse::servedDate,
                                       Comparator.nullsLast(Comparator.reverseOrder())
                                  );
        };

        responses.sort(comparator);
        return responses;
    }

    @Transactional(readOnly = true)
    public TodayMenuResponse getTodayMenus(String corner, String slot) {
        LocalDate today = LocalDate.now();
        String resolvedSlot = (slot == null || slot.isBlank()) ? "LUNCH" : slot.toUpperCase();
        List<MenuDate> menuDates = menuDateRepository.findByServedDateAndMealSlotFetchMenu(today, resolvedSlot);

        List<MenuResponse> responses = menuDates.stream()
                .filter(md -> corner == null || corner.isBlank() || Objects.equals(md.getMenu().getCorner(), corner))
                .map(md -> MenuResponse.from(md.getMenu(), md.getServedDate()))
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
        for (String key : keys) days.put(key, new ArrayList<>());

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
            days.get(key).add(MenuResponse.from(md.getMenu(), md.getServedDate()));
        }

        return new WeeklyMenuResponse(monday, friday, days);
    }

    @Transactional(readOnly = true)
    public MenuResponse getMenuDetail(Long menuId) {
        MenuAggregateProjection proj = menuRepository.findAggregatedById(menuId)
                .orElseThrow(() -> new EntityNotFoundException("메뉴를 찾을 수 없습니다"));
        return toResponse(proj, proj.latestServedDate());
    }

    private MenuResponse toResponse(MenuAggregateProjection proj, LocalDate servedDate) {
        boolean isNew = proj.firstSeenAt() != null
                && !proj.firstSeenAt().isBefore(LocalDate.now().minusDays(7));
        return new MenuResponse(
                proj.id(),
                proj.name(),
                proj.corner(),
                servedDate,
                proj.averageRating(),
                proj.reviewCount(),
                MenuTier.of(proj.averageRating(), proj.reviewCount() != null ? proj.reviewCount() : 0L),
                isNew,
                proj.firstSeenAt(),
                proj.avgTaste(),
                proj.avgAmount(),
                proj.avgValue(),
                proj.averageRating()
        );
    }
}
