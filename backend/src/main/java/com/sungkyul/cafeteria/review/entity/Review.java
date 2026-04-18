package com.sungkyul.cafeteria.review.entity;

import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "reviews",
        uniqueConstraints = {
                // 1인 1메뉴 1리뷰 제약
                @UniqueConstraint(
                        name = "uk_review_user_menu",
                        columnNames = {"user_id", "menu_id"}
                )
        }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 리뷰 작성자 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 리뷰 대상 메뉴 */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;

    /** 별점 (1~5점 정수) */
    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private int rating;

    /** 3축 별점: 맛·양·가성비 (nullable — V6에서 NOT NULL 승격) */
    @Min(1)
    @Max(5)
    @Column(name = "taste_rating")
    private Integer tasteRating;

    @Min(1)
    @Max(5)
    @Column(name = "amount_rating")
    private Integer amountRating;

    @Min(1)
    @Max(5)
    @Column(name = "value_rating")
    private Integer valueRating;

    /** 3축이 모두 non-null이면 평균, 아니면 기존 rating 반환 */
    public double overallRating() {
        if (tasteRating != null && amountRating != null && valueRating != null) {
            return (tasteRating + amountRating + valueRating) / 3.0;
        }
        return rating;
    }

    /** 코멘트 (최대 500자, 별점만 남길 경우 null 허용) */
    @Size(max = 500)
    @Column(length = 500)
    private String comment;

    /** 리뷰 작성 시각 */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 리뷰 수정 시각 */
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public void update(int rating, String comment) {
        this.rating = rating;
        this.comment = comment;
    }
}
