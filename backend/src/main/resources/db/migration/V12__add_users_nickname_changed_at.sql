ALTER TABLE users ADD COLUMN nickname_changed_at TIMESTAMP;

UPDATE users SET nickname_changed_at = created_at WHERE is_nickname_set = true;
