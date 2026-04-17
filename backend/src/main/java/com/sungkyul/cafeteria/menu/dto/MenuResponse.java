package com.sungkyul.cafeteria.menu.dto;

import java.time.LocalDate;

public record MenuResponse(
        Long id,
        String name,
        String corner,
        LocalDate servedDate,
        Double averageRating,
        Long reviewCount
) {}
