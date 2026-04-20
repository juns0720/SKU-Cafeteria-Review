-- V9: menu_dates.meal_slot 추가 + UNIQUE 재정의
-- 선행 조건: V8 적용 완료

-- ─── 1) meal_slot 컬럼 추가 (기존 행은 LUNCH로 채워짐) ────────────
ALTER TABLE menu_dates
    ADD COLUMN meal_slot VARCHAR(10) NOT NULL DEFAULT 'LUNCH';

ALTER TABLE menu_dates
    ADD CONSTRAINT menu_dates_meal_slot_chk
    CHECK (meal_slot IN ('LUNCH', 'DINNER'));

-- ─── 2) 기존 UNIQUE(menu_id, served_date) 제거 ───────────────────
-- 제약명: V2__restructure_menus.sql 에서 uk_menu_date 로 생성됨
ALTER TABLE menu_dates DROP CONSTRAINT uk_menu_date;

-- ─── 3) 새 UNIQUE(menu_id, served_date, meal_slot) 추가 ──────────
ALTER TABLE menu_dates
    ADD CONSTRAINT uk_menu_dates_menu_date_slot
    UNIQUE (menu_id, served_date, meal_slot);

-- ─── 4) 조회 인덱스 ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_menu_dates_date_slot
    ON menu_dates (served_date, meal_slot);
