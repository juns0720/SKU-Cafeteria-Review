package com.sungkyul.cafeteria.menu.dto;

import java.time.LocalDate;

public record MenuAggregateProjection(
        Long id,
        String name,
        String corner,
        LocalDate firstSeenAt,
        LocalDate latestServedDate,
        Double averageRating,
        Long reviewCount
) {}
