package com.sungkyul.cafeteria.user.entity;

import com.sungkyul.cafeteria.user.domain.NicknameCooldownException;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

class NicknameCooldownTest {

    @Test
    void 최초_변경은_쿨다운_없이_성공한다() {
        User user = User.builder()
                .googleId("g1").email("a@b.com").nickname("기존닉네임").build();

        assertThatNoException().isThrownBy(() -> user.changeNickname("새닉네임"));
        assertThat(user.getNickname()).isEqualTo("새닉네임");
        assertThat(user.getNicknameChangedAt()).isNotNull();
    }

    @Test
    void 변경_직후_재변경_시도는_NicknameCooldownException을_던진다() {
        User user = User.builder()
                .googleId("g2").email("a@b.com").nickname("기존닉네임").build();

        user.changeNickname("첫번째닉네임");

        assertThatThrownBy(() -> user.changeNickname("두번째닉네임"))
                .isInstanceOf(NicknameCooldownException.class)
                .hasMessageContaining("30일");
    }

    @Test
    void 쿨다운_예외에는_nextChangeAt이_포함된다() {
        User user = User.builder()
                .googleId("g3").email("a@b.com").nickname("기존닉네임").build();
        user.changeNickname("첫번째닉네임");

        NicknameCooldownException ex = catchThrowableOfType(
                () -> user.changeNickname("두번째닉네임"),
                NicknameCooldownException.class
        );

        assertThat(ex.getNextChangeAt()).isAfter(LocalDateTime.now());
    }

    @Test
    void 쿨다운_만료_후_재변경은_성공한다() throws Exception {
        User user = User.builder()
                .googleId("g4").email("a@b.com").nickname("기존닉네임").build();
        user.changeNickname("첫번째닉네임");

        // nicknameChangedAt을 31일 전으로 강제 설정
        Field field = User.class.getDeclaredField("nicknameChangedAt");
        field.setAccessible(true);
        field.set(user, LocalDateTime.now().minusDays(31));

        assertThatNoException().isThrownBy(() -> user.changeNickname("두번째닉네임"));
        assertThat(user.getNickname()).isEqualTo("두번째닉네임");
    }
}
