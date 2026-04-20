package com.sungkyul.cafeteria.user.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BadgeTierTest {

    @Test
    void 리뷰0건_NONE() {
        assertThat(BadgeTier.of(0)).isEqualTo(BadgeTier.NONE);
    }

    @Test
    void 리뷰1건_BRONZE() {
        assertThat(BadgeTier.of(1)).isEqualTo(BadgeTier.BRONZE);
    }

    @Test
    void 리뷰4건_BRONZE() {
        assertThat(BadgeTier.of(4)).isEqualTo(BadgeTier.BRONZE);
    }

    @Test
    void 리뷰5건_SILVER() {
        assertThat(BadgeTier.of(5)).isEqualTo(BadgeTier.SILVER);
    }

    @Test
    void 리뷰29건_SILVER() {
        assertThat(BadgeTier.of(29)).isEqualTo(BadgeTier.SILVER);
    }

    @Test
    void 리뷰30건_GOLD() {
        assertThat(BadgeTier.of(30)).isEqualTo(BadgeTier.GOLD);
    }
}
