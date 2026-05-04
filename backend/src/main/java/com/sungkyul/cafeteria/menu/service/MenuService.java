package com.sungkyul.cafeteria.menu.service;

import com.sungkyul.cafeteria.menu.domain.MenuTier;
import com.sungkyul.cafeteria.menu.dto.MenuAggregateProjection;
import com.sungkyul.cafeteria.menu.dto.MenuResponse;
import com.sungkyul.cafeteria.menu.dto.TodayMenuResponse;
import com.sungkyul.cafeteria.menu.dto.WeeklyMenuResponse;
import com.sungkyul.cafeteria.menu.entity.MenuDate;
import com.sungkyul.cafeteria.menu.repository.HolidayRepository;
import com.sungkyul.cafeteria.menu.repository.MenuDateRepository;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuRepository menuRepository;
    private final MenuDateRepository menuDateRepository;
    private final HolidayRepository holidayRepository;

    @Transactional(readOnly = true)
    public List<MenuResponse> getBestOfWeek() {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);
        return menuRepository.findBestOfWeek(monday, sunday, 3, PageRequest.of(0, 5))
                .stream()
                .map(menu -> MenuResponse.from(menu, null, monday))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getCorners() {
        return menuRepository.findDistinctCorners();
    }

    @Transactional(readOnly = true)
    public List<MenuResponse> getMenus(String sort, String corner, String scope) {
        LocalDate today = LocalDate.now();
        List<MenuResponse> responses = menuRepository.findAggregated(corner).stream()
                .filter(p -> "all".equalsIgnoreCase(scope) || p.reviewCount() > 0)
                .map(p -> toResponse(p, p.latestServedDate(), today))
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
                .map(md -> MenuResponse.from(md.getMenu(), md.getServedDate(), today))
                .toList();

        boolean isHoliday = responses.isEmpty() && holidayRepository.existsByHolidayDate(today);
        return new TodayMenuResponse(today, responses, isHoliday);
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
            days.get(key).add(MenuResponse.from(md.getMenu(), md.getServedDate(), monday));
        }

        // 이번 주 휴일 조회 → 빈 날짜 중 실제 휴일인 요일 키 수집
        Set<LocalDate> holidayDatesInWeek = new HashSet<>(
                holidayRepository.findByHolidayDateBetween(monday, friday)
                        .stream()
                        .map(h -> h.getHolidayDate())
                        .toList()
        );

        Set<String> holidayDays = new HashSet<>();
        for (int i = 0; i < keys.length; i++) {
            LocalDate dayDate = monday.plusDays(i);
            if (holidayDatesInWeek.contains(dayDate) && days.get(keys[i]).isEmpty()) {
                holidayDays.add(keys[i]);
            }
        }

        return new WeeklyMenuResponse(monday, friday, days, holidayDays);
    }

    @Transactional(readOnly = true)
    public MenuResponse getMenuDetail(Long menuId) {
        MenuAggregateProjection proj = menuRepository.findAggregatedById(menuId)
                .orElseThrow(() -> new EntityNotFoundException("메뉴를 찾을 수 없습니다"));
        return toResponse(proj, proj.latestServedDate(), LocalDate.now());
    }

    private MenuResponse toResponse(MenuAggregateProjection proj, LocalDate servedDate, LocalDate referenceDate) {
        boolean isNew = MenuResponse.isNewForWeek(proj.firstSeenAt(), referenceDate);
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
