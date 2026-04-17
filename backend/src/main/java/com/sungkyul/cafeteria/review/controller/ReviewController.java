package com.sungkyul.cafeteria.review.controller;

import com.sungkyul.cafeteria.review.dto.ReviewResponse;
import com.sungkyul.cafeteria.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> getReviews(
            @RequestParam Long menuId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        Long currentUserId = (authentication != null)
                ? (Long) authentication.getPrincipal()
                : null;
        return ResponseEntity.ok(reviewService.getReviews(menuId, page, size, currentUserId));
    }
}
