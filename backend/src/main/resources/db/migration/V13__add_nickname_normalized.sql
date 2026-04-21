ALTER TABLE users
    ADD COLUMN nickname_normalized VARCHAR(255);

UPDATE users
SET nickname_normalized = LOWER(BTRIM(REGEXP_REPLACE(nickname, '\s+', ' ', 'g')))
WHERE is_nickname_set = true;

CREATE UNIQUE INDEX uk_users_nickname_normalized
    ON users (nickname_normalized)
    WHERE nickname_normalized IS NOT NULL;
