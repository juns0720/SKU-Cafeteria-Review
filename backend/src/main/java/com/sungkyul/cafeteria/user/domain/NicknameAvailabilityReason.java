package com.sungkyul.cafeteria.user.domain;

public enum NicknameAvailabilityReason {
    OK,
    TOO_SHORT,
    TOO_LONG,
    TAKEN,
    PROFANITY,
    RESERVED,
    INVALID_FORMAT
}
