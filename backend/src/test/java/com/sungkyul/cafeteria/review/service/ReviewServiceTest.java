package com.sungkyul.cafeteria.review.service;

import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import com.sungkyul.cafeteria.review.dto.ReviewRequest;
import com.sungkyul.cafeteria.review.dto.ReviewResponse;
import com.sungkyul.cafeteria.review.entity.Review;
import com.sungkyul.cafeteria.review.repository.MenuStatAgg;
import com.sungkyul.cafeteria.review.repository.ReviewRepository;
import com.sungkyul.cafeteria.user.entity.User;
import com.sungkyul.cafeteria.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @InjectMocks ReviewService reviewService;
    @Mock ReviewRepository reviewRepository;
    @Mock MenuRepository menuRepository;
    @Mock UserRepository userRepository;

    @Test
    void createReview_성공_3축_저장() {
        Menu menu = Menu.builder().id(1L).name("김치찌개").corner("한식").build();
        User user = User.builder().id(10L).nickname("테스터").profileImage(null).build();

        given(menuRepository.findById(1L)).willReturn(Optional.of(menu));
        given(reviewRepository.existsByUserIdAndMenuId(10L, 1L)).willReturn(false);
        given(userRepository.getReferenceById(10L)).willReturn(user);
        given(reviewRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        given(reviewRepository.aggregateByMenuId(1L)).willReturn(new MenuStatAgg(5.0, 4.0, 3.0, 1L));
        given(reviewRepository.countByUserId(10L)).willReturn(1L);

        ReviewRequest request = new ReviewRequest(1L, 5, 4, 3, "맛있어요", null);
        ReviewResponse response = reviewService.createReview(10L, request);

        assertThat(response.taste()).isEqualTo(5);
        assertThat(response.amount()).isEqualTo(4);
        assertThat(response.value()).isEqualTo(3);
        assertThat(response.overall()).isEqualTo((5 + 4 + 3) / 3.0);
        assertThat(response.comment()).isEqualTo("맛있어요");
        assertThat(response.isMine()).isTrue();
    }

    @Test
    void createReview_중복작성_예외() {
        Menu menu = Menu.builder().id(1L).name("김치찌개").corner("한식").build();
        given(menuRepository.findById(1L)).willReturn(Optional.of(menu));
        given(reviewRepository.existsByUserIdAndMenuId(10L, 1L)).willReturn(true);

        ReviewRequest request = new ReviewRequest(1L, 5, 5, 5, null, null);
        assertThatThrownBy(() -> reviewService.createReview(10L, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("이미 리뷰를 작성하셨습니다");
    }

    @Test
    void createReview_집계캐시_갱신() {
        Menu menu = Menu.builder().id(1L).name("김치찌개").corner("한식").build();
        User user = User.builder().id(10L).nickname("테스터").profileImage(null).build();

        given(menuRepository.findById(1L)).willReturn(Optional.of(menu));
        given(reviewRepository.existsByUserIdAndMenuId(10L, 1L)).willReturn(false);
        given(userRepository.getReferenceById(10L)).willReturn(user);
        given(reviewRepository.save(any())).willAnswer(inv -> inv.getArgument(0));
        given(reviewRepository.aggregateByMenuId(1L)).willReturn(new MenuStatAgg(5.0, 4.0, 3.0, 1L));

        reviewService.createReview(10L, new ReviewRequest(1L, 5, 4, 3, "맛있어요", null));

        assertThat(menu.getAvgOverall()).isEqualTo((5.0 + 4.0 + 3.0) / 3.0);
        assertThat(menu.getReviewCount()).isEqualTo(1);
    }

    @Test
    void overallRating_3축_평균() {
        Review review = Review.builder()
                .tasteRating(5)
                .amountRating(3)
                .valueRating(4)
                .build();

        assertThat(review.overallRating()).isEqualTo((5 + 3 + 4) / 3.0);
    }

    @Test
    void updateReview_타인리뷰수정시_접근거부예외() {
        User author = User.builder().id(10L).build();
        Menu menu = Menu.builder().id(1L).name("김치찌개").corner("한식").build();
        Review review = Review.builder().id(100L).user(author).menu(menu).build();

        given(reviewRepository.findById(100L)).willReturn(Optional.of(review));

        assertThatThrownBy(() -> reviewService.updateReview(20L, 100L,
                new com.sungkyul.cafeteria.review.dto.ReviewUpdateRequest(5, 4, 3, "수정", null)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("리뷰 수정 권한이 없습니다");
    }
}
