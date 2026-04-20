package com.sungkyul.cafeteria.auth.dto;

import com.sungkyul.cafeteria.user.domain.BadgeTier;

public record UserResponse(
        Long id,
        String googleId,
        String email,
        String nickname,
        String profileImage,
        boolean isNicknameSet,

        // 신규
        String avatarColor,
        Long reviewCount,
        Double avgRating,
        Long badgeCount,
        BadgeTier badgeTier,
        Integer nextTarget,
        Integer remaining
) {}
