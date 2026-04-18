ALTER TABLE reviews ADD COLUMN taste_rating  INT;
ALTER TABLE reviews ADD COLUMN amount_rating INT;
ALTER TABLE reviews ADD COLUMN value_rating  INT;

ALTER TABLE reviews ADD CONSTRAINT reviews_taste_range
  CHECK (taste_rating  IS NULL OR taste_rating  BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT reviews_amount_range
  CHECK (amount_rating IS NULL OR amount_rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT reviews_value_range
  CHECK (value_rating  IS NULL OR value_rating  BETWEEN 1 AND 5);
