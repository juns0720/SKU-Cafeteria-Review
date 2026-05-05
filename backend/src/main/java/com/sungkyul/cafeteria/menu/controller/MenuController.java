package com.sungkyul.cafeteria.menu.controller;

import com.sungkyul.cafeteria.menu.dto.MenuResponse;
import com.sungkyul.cafeteria.menu.dto.TodayMenuResponse;
import com.sungkyul.cafeteria.menu.dto.WeeklyMenuResponse;
import com.sungkyul.cafeteria.menu.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<List<MenuResponse>> getMenus(
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String corner,
            @RequestParam(defaultValue = "reviewed") String scope
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).cachePublic())
                .body(menuService.getMenus(sort, corner, scope));
    }

    @GetMapping("/best")
    public ResponseEntity<List<MenuResponse>> getBest() {
        return ResponseEntity.ok(menuService.getBestOfWeek());
    }

    @GetMapping("/corners")
    public ResponseEntity<List<String>> getCorners() {
        return ResponseEntity.ok(menuService.getCorners());
    }

    @GetMapping("/today")
    public ResponseEntity<TodayMenuResponse> getToday(
            @RequestParam(required = false) String corner,
            @RequestParam(defaultValue = "LUNCH") String slot
    ) {
        return ResponseEntity.ok(menuService.getTodayMenus(corner, slot));
    }

    @GetMapping("/weekly")
    public ResponseEntity<WeeklyMenuResponse> getWeekly(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(menuService.getWeeklyMenus(date));
    }

    @GetMapping("/{menuId}")
    public ResponseEntity<MenuResponse> getMenuDetail(@PathVariable Long menuId) {
        return ResponseEntity.ok(menuService.getMenuDetail(menuId));
    }
}
