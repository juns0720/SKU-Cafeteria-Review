package com.sungkyul.cafeteria.menu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "menus",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_menu_name_corner", columnNames = {"name", "corner"})
        }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String corner;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 집계 캐시 (V8, recomputeMenuStats 로 갱신)
    @Column(name = "avg_taste")
    private Double avgTaste;

    @Column(name = "avg_amount")
    private Double avgAmount;

    @Column(name = "avg_value")
    private Double avgValue;

    @Column(name = "avg_overall")
    private Double avgOverall;

    @Column(name = "review_count", nullable = false)
    @Builder.Default
    private int reviewCount = 0;

    public void applyStats(Double avgT, Double avgA, Double avgV, long count) {
        this.avgTaste   = avgT;
        this.avgAmount  = avgA;
        this.avgValue   = avgV;
        this.avgOverall = (avgT == null) ? null : (avgT + avgA + avgV) / 3.0;
        this.reviewCount = (int) count;
    }
}
