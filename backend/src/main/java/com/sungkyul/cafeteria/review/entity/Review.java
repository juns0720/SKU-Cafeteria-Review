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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;

    @Min(1) @Max(5)
    @Column(name = "taste_rating", nullable = false)
    private int tasteRating;

    @Min(1) @Max(5)
    @Column(name = "amount_rating", nullable = false)
    private int amountRating;

    @Min(1) @Max(5)
    @Column(name = "value_rating", nullable = false)
    private int valueRating;

    @Size(max = 500)
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Size(max = 500)
    @Column(length = 500)
    private String comment;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public double overallRating() {
        return (tasteRating + amountRating + valueRating) / 3.0;
    }

    public void update(int tasteRating, int amountRating, int valueRating, String comment, String imageUrl) {
        this.tasteRating = tasteRating;
        this.amountRating = amountRating;
        this.valueRating = valueRating;
        this.comment = comment;
        this.imageUrl = imageUrl;
    }
}
