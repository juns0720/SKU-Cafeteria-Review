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

    /** 사용자가 직접 닉네임을 설정했는지 여부 */
    @Column(nullable = false)
    @Builder.Default
    private boolean isNicknameSet = false;

    /** 아바타 색상 hex (V10, 기본 #EF8A3D) */
    @Column(name = "avatar_color", nullable = false, length = 7)
    @Builder.Default
    private String avatarColor = "#EF8A3D";

    /** 계정 생성 시각 (DB 삽입 시 자동 설정) */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Google 프로필 정보 갱신 (로그인 시 호출) */
    public void updateProfile(String nickname, String profileImage) {
        this.profileImage = profileImage;
        if (!this.isNicknameSet) {
            this.nickname = nickname;
        }
    }

    /** 사용자가 직접 닉네임 변경 */
    public void changeNickname(String nickname) {
        this.nickname = nickname;
        this.isNicknameSet = true;
    }
}
