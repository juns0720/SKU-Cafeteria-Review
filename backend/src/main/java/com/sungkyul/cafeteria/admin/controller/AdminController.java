package com.sungkyul.cafeteria.admin.controller;

import com.sungkyul.cafeteria.crawler.dto.CrawlingResult;
import com.sungkyul.cafeteria.crawler.service.MenuCrawlerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    @Value("${cron.secret}")
    private String cronSecret;

    private final MenuCrawlerService menuCrawlerService;

    /** 수동 크롤링 트리거 (JWT 또는 X-Cron-Secret 헤더 인증) */
    @PostMapping("/crawl")
    public ResponseEntity<Map<String, Object>> crawl(
            @RequestHeader(value = "X-Cron-Secret", required = false) String secret) {
        if (secret != null && !cronSecret.equals(secret)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        CrawlingResult result = menuCrawlerService.crawlAndSave();
        if (result.errorMessage() != null) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "크롤링 실패",
                    "error", result.errorMessage()
            ));
        }
        return ResponseEntity.ok(Map.of(
                "message", "크롤링 완료",
                "savedCount", result.savedCount(),
                "skippedCount", result.skippedCount(),
                "holidayCount", result.holidayCount()
        ));
    }

    /** 파싱 디버깅용 raw HTML 반환 (JWT 또는 X-Cron-Secret 헤더 인증) */
    @GetMapping("/crawl/debug")
    public ResponseEntity<String> debugHtml(
            @RequestHeader(value = "X-Cron-Secret", required = false) String secret) {
        if (secret != null && !cronSecret.equals(secret)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return ResponseEntity.ok(menuCrawlerService.debugHtml());
    }
}
