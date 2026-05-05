package com.sungkyul.cafeteria.home.service;

import com.sungkyul.cafeteria.home.dto.HomeResponse;
import com.sungkyul.cafeteria.menu.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HomeService {

    private final MenuService menuService;

    @Transactional(readOnly = true)
    public HomeResponse getHome(String slot) {
        return new HomeResponse(
                menuService.getTodayMenus(null, slot),
                menuService.getBestOfWeek()
        );
    }
}
