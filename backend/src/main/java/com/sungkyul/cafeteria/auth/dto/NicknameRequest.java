package com.sungkyul.cafeteria.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record NicknameRequest(
        @NotBlank(message = "닉네임을 입력해주세요")
        String nickname
) {
}
