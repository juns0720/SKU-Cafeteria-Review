CREATE INDEX IF NOT EXISTS idx_reviews_menu_created_at
    ON reviews (menu_id, created_at DESC);
