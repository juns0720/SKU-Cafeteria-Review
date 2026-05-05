package com.sungkyul.cafeteria.common.controller;

import com.sungkyul.cafeteria.menu.service.MenuService;
import com.sungkyul.cafeteria.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 첫 사용자 요청 전에 DB 커넥션 + Hibernate metadata + 주요 쿼리 plan을 사전에 데우는 endpoint.
 * keep-alive cron이 10분 간격으로 호출하는 것을 전제로 한다. 단계별 try/catch로 fail-soft.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WarmupController {

    private static final Logger log = LoggerFactory.getLogger(WarmupController.class);

    private final JdbcTemplate jdbcTemplate;
    private final MenuService menuService;
    private final ReviewRepository reviewRepository;

    @GetMapping("/warmup")
    public Map<String, Object> warmup() {
        long start = System.currentTimeMillis();
        Map<String, Object> result = new LinkedHashMap<>();

        try {
            jdbcTemplate.queryForObject("select 1", Integer.class);
            result.put("db", "ok");
        } catch (Exception e) {
            log.warn("warmup db failed", e);
            result.put("db", "err");
        }

        try {
            result.put("todayCount", menuService.getTodayMenus(null, "LUNCH").menus().size());
        } catch (Exception e) {
            log.warn("warmup today failed", e);
            result.put("todayCount", -1);
        }

        try {
            result.put("bestCount", menuService.getBestOfWeek().size());
        } catch (Exception e) {
            log.warn("warmup best failed", e);
            result.put("bestCount", -1);
        }

        try {
            result.put("recentReviewCount", reviewRepository.findTop10ByOrderByCreatedAtDesc().size());
        } catch (Exception e) {
            log.warn("warmup reviews failed", e);
            result.put("recentReviewCount", -1);
        }

        result.put("elapsedMs", System.currentTimeMillis() - start);
        return result;
    }
}
