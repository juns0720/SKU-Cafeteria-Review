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
}
