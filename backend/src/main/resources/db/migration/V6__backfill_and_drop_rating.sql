-- 기존 rating을 3축으로 복사 (이미 설정된 값은 보존)
UPDATE reviews
   SET taste_rating  = COALESCE(taste_rating,  rating),
       amount_rating = COALESCE(amount_rating, rating),
       value_rating  = COALESCE(value_rating,  rating);

-- NOT NULL 승격
ALTER TABLE reviews ALTER COLUMN taste_rating  SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN amount_rating SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN value_rating  SET NOT NULL;

-- CHECK 제약 재정의 (NULL 허용 문구 제거)
ALTER TABLE reviews DROP CONSTRAINT reviews_taste_range;
ALTER TABLE reviews DROP CONSTRAINT reviews_amount_range;
ALTER TABLE reviews DROP CONSTRAINT reviews_value_range;
ALTER TABLE reviews ADD CONSTRAINT reviews_taste_range  CHECK (taste_rating  BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT reviews_amount_range CHECK (amount_rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT reviews_value_range  CHECK (value_rating  BETWEEN 1 AND 5);

-- 기존 rating 제거 (되돌리기 불가!)
ALTER TABLE reviews DROP COLUMN rating;
