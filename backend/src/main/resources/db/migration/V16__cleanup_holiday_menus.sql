-- 휴일 안내 문구가 메뉴명으로 저장된 데이터 정리
-- menu_dates 먼저 삭제 (FK 제약)
DELETE FROM menu_dates
WHERE menu_id IN (
    SELECT id FROM menus
    WHERE name LIKE '%휴일%'
       OR name LIKE '%휴무%'
       OR name LIKE '%휴관%'
       OR name LIKE '%공휴일%'
       OR name LIKE '%방학%'
       OR name LIKE '%운영안함%'
       OR name LIKE '%운영하지%'
       OR name LIKE '%없습니다%'
       OR name LIKE '%쉽니다%'
       OR name LIKE '%점검중%'
);

DELETE FROM menus
WHERE name LIKE '%휴일%'
   OR name LIKE '%휴무%'
   OR name LIKE '%휴관%'
   OR name LIKE '%공휴일%'
   OR name LIKE '%방학%'
   OR name LIKE '%운영안함%'
   OR name LIKE '%운영하지%'
   OR name LIKE '%없습니다%'
   OR name LIKE '%쉽니다%'
   OR name LIKE '%점검중%';
