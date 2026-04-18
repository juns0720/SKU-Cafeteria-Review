package com.sungkyul.cafeteria.review.service;

import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import com.sungkyul.cafeteria.review.dto.ReviewRequest;
import java.util.List;
import com.sungkyul.cafeteria.review.dto.ReviewResponse;
import com.sungkyul.cafeteria.review.dto.ReviewUpdateRequest;
import com.sungkyul.cafeteria.review.entity.Review;
import com.sungkyul.cafeteria.review.repository.ReviewRepository;
import com.sungkyul.cafeteria.user.entity.User;
import com.sungkyul.cafeteria.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
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
    private final MenuRepository menuRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviews(Long menuId, int page, int size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return reviewRepository.findByMenuId(menuId, pageable)
                .map(review -> toResponse(review, currentUserId));
    }

    @Transactional
    public ReviewResponse createReview(Long userId, ReviewRequest request) {
        Menu menu = menuRepository.findById(request.menuId())
                .orElseThrow(() -> new EntityNotFoundException("메뉴를 찾을 수 없습니다"));

        if (reviewRepository.existsByUserIdAndMenuId(userId, request.menuId())) {
            throw new IllegalStateException("이미 리뷰를 작성하셨습니다");
        }

        User user = userRepository.getReferenceById(userId);

        Review review = Review.builder()
                .user(user)
                .menu(menu)
                .tasteRating(request.tasteRating())
                .amountRating(request.amountRating())
                .valueRating(request.valueRating())
                .comment(request.comment())
                .imageUrl(request.imageUrl())
                .build();

        Review saved = reviewRepository.save(review);
        return toResponse(saved, userId);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(review -> toResponse(review, userId))
                .toList();
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다"));

        if (!review.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("리뷰 삭제 권한이 없습니다");
        }

        reviewRepository.delete(review);
    }

    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다"));

        if (!review.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("리뷰 수정 권한이 없습니다");
        }

        review.update(request.tasteRating(), request.amountRating(), request.valueRating(), request.comment(), request.imageUrl());
        return toResponse(review, userId);
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
                review.getTasteRating(),
                review.getAmountRating(),
                review.getValueRating(),
                review.overallRating(),
                review.getComment(),
                review.getImageUrl(),
                review.getCreatedAt(),
                review.getUpdatedAt(),
                isMine
        );
    }
}
