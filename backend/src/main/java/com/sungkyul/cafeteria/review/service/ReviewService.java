package com.sungkyul.cafeteria.review.service;

import com.sungkyul.cafeteria.review.dto.ReviewResponse;
import com.sungkyul.cafeteria.review.entity.Review;
import com.sungkyul.cafeteria.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviews(Long menuId, int page, int size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return reviewRepository.findByMenuId(menuId, pageable)
                .map(review -> toResponse(review, currentUserId));
    }

    private ReviewResponse toResponse(Review review, Long currentUserId) {
        boolean isMine = currentUserId != null
                && currentUserId.equals(review.getUser().getId());

        return new ReviewResponse(
                review.getId(),
                review.getMenu().getId(),
                review.getMenu().getName(),
                review.getUser().getNickname(),
                review.getUser().getProfileImage(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt(),
                isMine
        );
    }
}
