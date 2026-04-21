package com.sungkyul.cafeteria.user.entity;

import com.sungkyul.cafeteria.user.domain.NicknameCooldownException;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class NicknameCooldownTest {

    @Test
    void first_change_succeeds_without_cooldown() {
        User user = User.builder()
                .googleId("g1")
                .email("a@b.com")
                .nickname("기존닉네임")
                .build();

        assertThatNoException().isThrownBy(() -> user.changeNickname("새닉네임", "새닉네임"));
        assertThat(user.getNickname()).isEqualTo("새닉네임");
        assertThat(user.getNicknameNormalized()).isEqualTo("새닉네임");
        assertThat(user.getNicknameChangedAt()).isNotNull();
    }

    @Test
    void second_change_inside_cooldown_throws_exception() {
        User user = User.builder()
                .googleId("g2")
                .email("a@b.com")
                .nickname("기존닉네임")
                .build();

        user.changeNickname("첫번째닉네임", "첫번째닉네임");

        assertThatThrownBy(() -> user.changeNickname("두번째닉네임", "두번째닉네임"))
                .isInstanceOf(NicknameCooldownException.class)
                .hasMessageContaining("30일");
    }

    @Test
    void cooldown_exception_contains_next_change_at() {
        User user = User.builder()
                .googleId("g3")
                .email("a@b.com")
                .nickname("기존닉네임")
                .build();
        user.changeNickname("첫번째닉네임", "첫번째닉네임");

        NicknameCooldownException ex = catchThrowableOfType(
                () -> user.changeNickname("두번째닉네임", "두번째닉네임"),
                NicknameCooldownException.class
        );

        assertThat(ex.getNextChangeAt()).isAfter(LocalDateTime.now());
    }

    @Test
    void change_succeeds_after_cooldown_expires() throws Exception {
        User user = User.builder()
                .googleId("g4")
                .email("a@b.com")
                .nickname("기존닉네임")
                .build();
        user.changeNickname("첫번째닉네임", "첫번째닉네임");

        Field field = User.class.getDeclaredField("nicknameChangedAt");
        field.setAccessible(true);
        field.set(user, LocalDateTime.now().minusDays(31));

        assertThatNoException().isThrownBy(() -> user.changeNickname("두번째닉네임", "두번째닉네임"));
        assertThat(user.getNickname()).isEqualTo("두번째닉네임");
    }
}
