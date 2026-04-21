package com.sungkyul.cafeteria.auth.dto;

import com.sungkyul.cafeteria.user.domain.NicknameAvailabilityReason;

public record NicknameAvailabilityResponse(
        String normalizedNickname,
        boolean available,
        NicknameAvailabilityReason reason,
        String message
) {
}
