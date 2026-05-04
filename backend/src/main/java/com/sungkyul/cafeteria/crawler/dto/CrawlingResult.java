package com.sungkyul.cafeteria.crawler.dto;

public record CrawlingResult(int savedCount, int skippedCount, int holidayCount, String errorMessage) {

    public static CrawlingResult success(int savedCount, int skippedCount, int holidayCount) {
        return new CrawlingResult(savedCount, skippedCount, holidayCount, null);
    }

    public static CrawlingResult failure(String errorMessage) {
        return new CrawlingResult(0, 0, 0, errorMessage);
    }
}
