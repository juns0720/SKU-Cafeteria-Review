-- /reviews/me: WHERE user_id = ? ORDER BY created_at DESC 풀스캔 방지
CREATE INDEX IF NOT EXISTS idx_reviews_user_created_at
    ON reviews (user_id, created_at DESC);
