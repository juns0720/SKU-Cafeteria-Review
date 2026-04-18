package com.sungkyul.cafeteria.review.dto;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long menuId,
        String menuName,
        String userNickname,
        String userProfileImage,
        int taste,
        int amount,
        int value,
        double overall,
        String comment,
        String imageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean isMine
) {}
