package com.sungkyul.cafeteria.home.dto;

import com.sungkyul.cafeteria.menu.dto.MenuResponse;
import com.sungkyul.cafeteria.menu.dto.TodayMenuResponse;

import java.util.List;

public record HomeResponse(
        TodayMenuResponse today,
        List<MenuResponse> bestMenus
) {}
