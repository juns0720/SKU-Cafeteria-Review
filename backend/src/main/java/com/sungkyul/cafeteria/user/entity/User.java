package com.sungkyul.cafeteria.user.entity;

import com.sungkyul.cafeteria.user.domain.NicknameCooldownException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
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

    @Column(unique = true, nullable = false)
    private String googleId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "nickname_normalized")
    private String nicknameNormalized;

    @Column
    private String profileImage;

    @Column(nullable = false)
    @Builder.Default
    private boolean isNicknameSet = false;

    @Column(name = "avatar_color", nullable = false, length = 7)
    @Builder.Default
    private String avatarColor = "#EF8A3D";

    @Column(name = "nickname_changed_at")
    private LocalDateTime nicknameChangedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public void updateProfile(String nickname, String profileImage) {
        this.profileImage = profileImage;
        if (!this.isNicknameSet) {
            this.nickname = nickname;
            this.nicknameNormalized = null;
        }
    }

    public void changeNickname(String nickname, String nicknameNormalized) {
        if (nicknameChangedAt != null) {
            LocalDateTime cooldownEnd = nicknameChangedAt.plusDays(30);
            if (LocalDateTime.now().isBefore(cooldownEnd)) {
                throw new NicknameCooldownException(cooldownEnd);
            }
        }
        this.nickname = nickname;
        this.nicknameNormalized = nicknameNormalized;
        this.isNicknameSet = true;
        this.nicknameChangedAt = LocalDateTime.now();
    }

    public void syncNicknameNormalization(String nicknameNormalized) {
        if (this.isNicknameSet) {
            this.nicknameNormalized = nicknameNormalized;
        }
    }
}
