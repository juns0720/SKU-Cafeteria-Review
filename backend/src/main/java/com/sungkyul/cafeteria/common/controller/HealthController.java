package com.sungkyul.cafeteria.common.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * 서버 상태 확인용 엔드포인트.
 * 인증 없이 접근 가능하며 배포 환경 점검에 활용한다.
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    /** 현재 활성 프로파일 (환경변수 미설정 시 "unknown" 반환) */
    @Value("${spring.profiles.active:unknown}")
    private String activeProfile;

    /**
     * GET /api/v1/health
     *
     * @return 서버 상태, 현재 시각(ISO 8601), 활성 프로파일
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "ok",
                "timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "profile", activeProfile
        );
    }
}
