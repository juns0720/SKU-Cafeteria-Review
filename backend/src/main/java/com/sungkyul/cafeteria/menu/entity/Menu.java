package com.sungkyul.cafeteria.menu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "menus",
        uniqueConstraints = {
                // 같은 날짜·코너에 동일 메뉴명이 중복 등록되지 않도록
                @UniqueConstraint(
                        name = "uk_menu_name_corner_date",
                        columnNames = {"name", "corner", "served_date"}
                )
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

    /** 메뉴명 (예: 된장찌개) */
    @Column(nullable = false)
    private String name;

    /** 코너명 (예: 한식, 양식, 일품) */
    @Column(nullable = false)
    private String corner;

    /** 제공 날짜 */
    @Column(nullable = false)
    private LocalDate servedDate;

    /** 메뉴 데이터 삽입 시각 (크롤링 일시 추적용) */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
