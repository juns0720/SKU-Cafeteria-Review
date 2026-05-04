package com.sungkyul.cafeteria.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ReviewRequest(
        @NotNull Long menuId,
        @NotNull @Min(1) @Max(5) Integer tasteRating,
        @NotNull @Min(1) @Max(5) Integer amountRating,
        @NotNull @Min(1) @Max(5) Integer valueRating,
        @Size(max = 500) String comment,
        @Size(max = 3, message = "사진은 최대 3장까지 첨부할 수 있습니다") List<String> photoUrls
) {}
