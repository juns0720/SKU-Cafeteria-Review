ALTER TABLE users
    ADD COLUMN custom_nickname VARCHAR(12),
    ADD CONSTRAINT uk_users_custom_nickname UNIQUE (custom_nickname);
