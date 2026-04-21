package com.sungkyul.cafeteria.user.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NicknamePolicyTest {

    @Test
    void normalize_display_trims_collapses_spaces_and_strips_invisible_characters() {
        String normalized = NicknamePolicy.normalizeDisplay("  쨰\u200B  밥\t친구  ");

        assertThat(normalized).isEqualTo("쨰 밥 친구");
        assertThat(NicknamePolicy.toLookupKey(normalized)).isEqualTo("쨰 밥 친구");
    }

    @Test
    void validate_rejects_reserved_names_even_with_spacing() {
        NicknameValidationResult result = NicknamePolicy.validate(" 관 리 자 ");

        assertThat(result.reason()).isEqualTo(NicknameAvailabilityReason.RESERVED);
        assertThat(result.message()).isEqualTo("사용할 수 없는 닉네임입니다");
    }

    @Test
    void validate_rejects_profanity_with_punctuation_removed() {
        NicknameValidationResult result = NicknamePolicy.validate("씨!발");

        assertThat(result.reason()).isEqualTo(NicknameAvailabilityReason.PROFANITY);
        assertThat(result.message()).isEqualTo("부적절한 표현은 사용할 수 없어요");
    }

    @Test
    void validate_rejects_invisible_only_value() {
        NicknameValidationResult result = NicknamePolicy.validate("\u200B\u2060");

        assertThat(result.reason()).isEqualTo(NicknameAvailabilityReason.INVALID_FORMAT);
        assertThat(result.message()).isEqualTo("닉네임을 입력해주세요");
    }

    @Test
    void validate_accepts_case_preserving_nickname_and_lowercases_lookup_key() {
        NicknameValidationResult result = NicknamePolicy.validate("  Alice  ");

        assertThat(result.isValid()).isTrue();
        assertThat(result.displayNickname()).isEqualTo("Alice");
        assertThat(result.lookupKey()).isEqualTo("alice");
    }
}
