package com.sungkyul.cafeteria.review.service;

import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import com.sungkyul.cafeteria.review.repository.MenuStatAgg;
import com.sungkyul.cafeteria.review.dto.ReviewRequest;
import com.sungkyul.cafeteria.user.domain.BadgeTier;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
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
import org.springframework.security.access.AccessDeniedException;
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
        Page<Review> reviewPage = reviewRepository.findByMenuId(menuId, pageable);

        Set<Long> userIds = reviewPage.getContent().stream()
                .map(r -> r.getUser().getId())
                .collect(Collectors.toSet());
        Map<Long, Long> countMap = batchCountByUserIds(userIds);

        return reviewPage.map(review -> {
            BadgeTier tier = BadgeTier.of(countMap.getOrDefault(review.getUser().getId(), 0L));
            return toResponse(review, currentUserId, tier);
        });
    }

    @Transactional
    public ReviewResponse createReview(Long userId, ReviewRequest request) {
        Menu menu = menuRepository.findById(request.menuId())
                .orElseThrow(() -> new EntityNotFoundException("메뉴를 찾을 수 없습니다"));

        if (reviewRepository.existsByUserIdAndMenuId(userId, request.menuId())) {
            throw new IllegalStateException("이미 리뷰를 작성하셨습니다");
        }

        User user = userRepository.getReferenceById(userId);

        List<String> photos = resolvePhotoUrls(request.photoUrls());
        Review review = Review.builder()
                .user(user)
                .menu(menu)
                .tasteRating(request.tasteRating())
                .amountRating(request.amountRating())
                .valueRating(request.valueRating())
                .comment(request.comment())
                .photoUrls(photos.toArray(new String[0]))
                .build();

        Review saved = reviewRepository.save(review);
        recomputeMenuStats(menu.getId());
        BadgeTier tier = BadgeTier.of(reviewRepository.countByUserId(userId));
        return toResponse(saved, userId, tier);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(Long userId) {
        List<Review> reviews = reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        BadgeTier tier = BadgeTier.of(reviews.size());
        return reviews.stream()
                .map(review -> toResponse(review, userId, tier))
                .toList();
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다"));

        if (!review.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("리뷰 삭제 권한이 없습니다");
        }

        Long menuId = review.getMenu().getId();
        reviewRepository.delete(review);
        recomputeMenuStats(menuId);
    }

    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, ReviewUpdateRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("리뷰를 찾을 수 없습니다"));

        if (!review.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("리뷰 수정 권한이 없습니다");
        }

        List<String> photos = resolvePhotoUrls(request.photoUrls());
        review.update(request.tasteRating(), request.amountRating(), request.valueRating(), request.comment(), photos);
        recomputeMenuStats(review.getMenu().getId());
        BadgeTier tier = BadgeTier.of(reviewRepository.countByUserId(userId));
        return toResponse(review, userId, tier);
    }

    private Map<Long, Long> batchCountByUserIds(Set<Long> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return reviewRepository.countGroupByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));
    }

    private List<String> resolvePhotoUrls(List<String> photoUrls) {
        if (photoUrls != null && !photoUrls.isEmpty()) return photoUrls;
        return List.of();
    }

    private void recomputeMenuStats(Long menuId) {
        MenuStatAgg agg = reviewRepository.aggregateByMenuId(menuId);
        Menu menu = menuRepository.findById(menuId).orElseThrow();
        menu.applyStats(agg.avgT(), agg.avgA(), agg.avgV(), agg.count());
    }

    private ReviewResponse toResponse(Review review, Long currentUserId, BadgeTier authorBadgeTier) {
        boolean isMine = currentUserId != null
                && currentUserId.equals(review.getUser().getId());

        List<String> photos = review.getPhotoUrls() != null
                ? Arrays.asList(review.getPhotoUrls())
                : List.of();

        return new ReviewResponse(
                review.getId(),
                review.getMenu().getId(),
                review.getMenu().getName(),
                review.getUser().getNickname(),
                review.getUser().getProfileImage(),
                authorBadgeTier,
                review.getTasteRating(),
                review.getAmountRating(),
                review.getValueRating(),
                review.overallRating(),
                review.getComment(),
                photos,
                review.getCreatedAt(),
                review.getUpdatedAt(),
                isMine
        );
    }
}
