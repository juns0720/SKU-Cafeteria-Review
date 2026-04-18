-- V2: menus 테이블 재구조화
-- 변경 전: menus(name, corner, served_date), UNIQUE(name, corner, served_date)
-- 변경 후: menus(name, corner), UNIQUE(name, corner) + menu_dates(menu_id, served_date)

-- Step 1: menu_dates 테이블 생성
CREATE TABLE menu_dates (
    id          BIGSERIAL PRIMARY KEY,
    menu_id     BIGINT NOT NULL,
    served_date DATE   NOT NULL,
    CONSTRAINT fk_menu_date_menu FOREIGN KEY (menu_id) REFERENCES menus (id),
    CONSTRAINT uk_menu_date UNIQUE (menu_id, served_date)
);

-- Step 2: 각 (name, corner)의 대표 id(MIN)를 기준으로 served_date를 menu_dates로 이관
INSERT INTO menu_dates (menu_id, served_date)
SELECT canonical.min_id, m.served_date
FROM menus m
JOIN (
    SELECT name, corner, MIN(id) AS min_id
    FROM menus
    GROUP BY name, corner
) canonical ON m.name = canonical.name AND m.corner = canonical.corner;

-- Step 3: reviews.menu_id를 대표 id로 갱신 (중복 메뉴를 하나로 병합)
UPDATE reviews r
SET menu_id = canonical.min_id
FROM menus m
JOIN (
    SELECT name, corner, MIN(id) AS min_id
    FROM menus
    GROUP BY name, corner
) canonical ON m.name = canonical.name AND m.corner = canonical.corner
WHERE r.menu_id = m.id
  AND r.menu_id != canonical.min_id;

-- Step 4: 대표 id가 아닌 중복 메뉴 행 삭제
DELETE FROM menus
WHERE id NOT IN (
    SELECT MIN(id) FROM menus GROUP BY name, corner
);

-- Step 5: served_date 컬럼 및 기존 UNIQUE 제약 제거
ALTER TABLE menus DROP CONSTRAINT uk_menu_name_corner_date;
ALTER TABLE menus DROP COLUMN served_date;

-- Step 6: 새 UNIQUE 제약 추가
ALTER TABLE menus ADD CONSTRAINT uk_menu_name_corner UNIQUE (name, corner);
