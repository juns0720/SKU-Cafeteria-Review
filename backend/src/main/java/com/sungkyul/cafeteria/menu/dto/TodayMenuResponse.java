package com.sungkyul.cafeteria.menu.dto;

import java.time.LocalDate;
import java.util.List;

public record TodayMenuResponse(
        LocalDate date,
        List<MenuResponse> menus
) {}
