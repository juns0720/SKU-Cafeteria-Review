CREATE TABLE holidays (
    id          BIGSERIAL PRIMARY KEY,
    holiday_date DATE NOT NULL UNIQUE
);
