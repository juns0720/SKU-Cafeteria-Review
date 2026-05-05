package com.sungkyul.cafeteria.common.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PingController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/ping-db")
    public String pingDb() {
        jdbcTemplate.queryForObject("select 1", Integer.class);
        return "ok";
    }
}
