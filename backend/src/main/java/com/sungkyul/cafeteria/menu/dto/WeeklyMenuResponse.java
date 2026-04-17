package com.sungkyul.cafeteria.menu.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record WeeklyMenuResponse(
        LocalDate weekStart,
        LocalDate weekEnd,
        Map<String, List<MenuResponse>> days
) {}
