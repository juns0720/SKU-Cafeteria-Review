package com.sungkyul.cafeteria.review.dto;

public record UploadSignatureResponse(
        String signature,
        long timestamp,
        String apiKey,
        String cloudName,
        String folder,
        String allowedFormats,
        long maxFileSize,
        String resourceType
) {}
