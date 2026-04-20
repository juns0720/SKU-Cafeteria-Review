package com.sungkyul.cafeteria.user.domain;

import java.time.LocalDateTime;

public class NicknameCooldownException extends RuntimeException {

    private final LocalDateTime nextChangeAt;

    public NicknameCooldownException(LocalDateTime nextChangeAt) {
        super("닉네임은 30일에 한 번만 변경할 수 있습니다");
        this.nextChangeAt = nextChangeAt;
    }

    public LocalDateTime getNextChangeAt() {
        return nextChangeAt;
    }
}
