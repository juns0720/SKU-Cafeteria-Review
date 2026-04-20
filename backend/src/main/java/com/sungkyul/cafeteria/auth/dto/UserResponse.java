package com.sungkyul.cafeteria.auth.dto;

import com.sungkyul.cafeteria.user.domain.BadgeTier;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String googleId,
        String email,
        String nickname,
        String profileImage,
        boolean isNicknameSet,

        String avatarColor,
        Long reviewCount,
        Double avgRating,
        Long badgeCount,
        BadgeTier badgeTier,
        Integer nextTarget,
        Integer remaining,
        LocalDateTime nicknameChangedAt
) {}
