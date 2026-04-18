-- V1 Baseline: 기존 스키마 캡처 (2026-04-18)
-- 새 DB에서 처음 실행될 때 전체 스키마를 생성한다.
-- 기존 dev/prod DB는 baseline-on-migrate=true 로 인해 이 스크립트를 실행하지 않고
-- flyway_schema_history에 V1이 이미 적용된 것으로 표시된다.

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    google_id     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    nickname      VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_users_google_id UNIQUE (google_id)
);

CREATE TABLE IF NOT EXISTS menus (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    corner      VARCHAR(255) NOT NULL,
    served_date DATE         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_menu_name_corner_date UNIQUE (name, corner, served_date)
);

CREATE TABLE IF NOT EXISTS reviews (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL,
    menu_id    BIGINT       NOT NULL,
    rating     INT          NOT NULL,
    comment    VARCHAR(500),
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_review_menu FOREIGN KEY (menu_id) REFERENCES menus (id),
    CONSTRAINT uk_review_user_menu UNIQUE (user_id, menu_id)
);
