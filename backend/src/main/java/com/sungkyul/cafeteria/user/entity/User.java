package com.sungkyul.cafeteria.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Google OAuth2 고유 식별자 */
    @Column(unique = true, nullable = false)
    private String googleId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String nickname;

    /** Google 프로필 이미지 URL (없을 수 있음) */
    @Column
    private String profileImage;

    /** 사용자 지정 닉네임 (2~12자, UNIQUE, nullable) */
    @Column(unique = true, length = 12)
    private String customNickname;

    /** 계정 생성 시각 (DB 삽입 시 자동 설정) */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Google 프로필 정보 갱신 (로그인 시 호출) */
    public void updateProfile(String nickname, String profileImage) {
        this.nickname = nickname;
        this.profileImage = profileImage;
    }

    public void updateCustomNickname(String customNickname) {
        this.customNickname = customNickname;
    }
}
