package com.sungkyul.cafeteria.review.dto;

import com.sungkyul.cafeteria.user.domain.BadgeTier;

import java.time.LocalDateTime;
import java.util.List;

public record ReviewResponse(
        Long id,
        Long menuId,
        String menuName,
        String userNickname,
        String userProfileImage,
        BadgeTier authorBadgeTier,
        int taste,
        int amount,
        int value,
        double overall,
        String comment,
        List<String> photoUrls,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean isMine
) {}
