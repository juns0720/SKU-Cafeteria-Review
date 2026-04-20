package com.sungkyul.cafeteria.auth.service;

import com.sungkyul.cafeteria.auth.dto.LoginResponse;
import com.sungkyul.cafeteria.auth.dto.UserResponse;
import com.sungkyul.cafeteria.auth.jwt.JwtProvider;
import com.sungkyul.cafeteria.review.repository.ReviewRepository;
import com.sungkyul.cafeteria.user.domain.BadgeTier;
import com.sungkyul.cafeteria.user.entity.User;
import com.sungkyul.cafeteria.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final RestTemplate restTemplate;
    private final ReviewRepository reviewRepository;

    private static final String GOOGLE_TOKENINFO_URL =
            "https://oauth2.googleapis.com/tokeninfo?id_token=";

    @SuppressWarnings("unchecked")
    public Map<String, Object> verifyGoogleToken(String idToken) {
        try {
            Map<String, Object> response = restTemplate.getForObject(
                    GOOGLE_TOKENINFO_URL + idToken, Map.class);
            if (response == null || !response.containsKey("sub")) {
                throw new IllegalArgumentException("유효하지 않은 Google 토큰입니다");
            }
            return response;
        } catch (RestClientException e) {
            throw new IllegalArgumentException("유효하지 않은 Google 토큰입니다");
        }
    }

    @Transactional
    public LoginResponse login(String idToken) {
        Map<String, Object> googleInfo = verifyGoogleToken(idToken);

        String googleId = (String) googleInfo.get("sub");
        String email = (String) googleInfo.get("email");
        String name = (String) googleInfo.get("name");
        String picture = (String) googleInfo.get("picture");

        User user = userRepository.findByGoogleId(googleId)
                .map(existing -> {
                    existing.updateProfile(name, picture);
                    return existing;
                })
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .googleId(googleId)
                                .email(email)
                                .nickname(name)
                                .profileImage(picture)
                                .build()
                ));

        String accessToken = jwtProvider.generateAccessToken(user.getId());
        String refreshToken = jwtProvider.generateRefreshToken(user.getId());

        return new LoginResponse(
                accessToken, refreshToken,
                user.getId(), user.getNickname(),
                user.getEmail(), user.getProfileImage(),
                user.isNicknameSet()
        );
    }

    @Transactional
    public void updateNickname(Long userId, String nickname) {
        if (userRepository.existsByNicknameAndIdNot(nickname, userId)) {
            throw new IllegalStateException("이미 사용 중인 닉네임입니다");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));
        user.changeNickname(nickname);
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다"));

        long count = reviewRepository.countByUserId(userId);
        Double avgRating = reviewRepository.findAvgOverallByUserId(userId);
        BadgeTier tier = BadgeTier.of(count);
        int next = nextTarget(count);
        int remaining = Math.max(0, next - (int) count);

        return new UserResponse(
                user.getId(), user.getGoogleId(),
                user.getEmail(), user.getNickname(), user.getProfileImage(),
                user.isNicknameSet(),
                user.getAvatarColor(),
                count, avgRating,
                0L,   // badgeCount: 메뉴 메달 연동은 별도 트랙
                tier, next, remaining
        );
    }

    private int nextTarget(long count) {
        if (count < 5)  return 5;
        if (count < 30) return 30;
        return 100;
    }
}
