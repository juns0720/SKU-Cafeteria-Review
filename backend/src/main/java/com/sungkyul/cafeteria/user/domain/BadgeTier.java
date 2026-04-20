package com.sungkyul.cafeteria.user.domain;

public enum BadgeTier {
    NONE, BRONZE, SILVER, GOLD;

    public static BadgeTier of(long reviewCount) {
        if (reviewCount >= 30) return GOLD;
        if (reviewCount >= 5)  return SILVER;
        if (reviewCount >= 1)  return BRONZE;
        return NONE;
    }
}
