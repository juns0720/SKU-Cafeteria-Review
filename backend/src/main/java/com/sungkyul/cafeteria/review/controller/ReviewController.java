package com.sungkyul.cafeteria.review.controller;

import com.sungkyul.cafeteria.review.dto.ReviewRequest;
import java.util.List;
import com.sungkyul.cafeteria.review.dto.ReviewResponse;
import com.sungkyul.cafeteria.review.dto.ReviewUpdateRequest;
import com.sungkyul.cafeteria.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

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

    @GetMapping("/me")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(reviewService.getMyReviews(userId));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();
        reviewService.deleteReview(userId, reviewId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewUpdateRequest request,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(reviewService.updateReview(userId, reviewId, request));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();
        ReviewResponse response = reviewService.createReview(userId, request);
        return ResponseEntity.created(URI.create("/api/v1/reviews/" + response.id())).body(response);
    }
}
