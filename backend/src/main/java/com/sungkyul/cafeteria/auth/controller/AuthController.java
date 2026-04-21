package com.sungkyul.cafeteria.auth.controller;

import com.sungkyul.cafeteria.auth.dto.LoginRequest;
import com.sungkyul.cafeteria.auth.dto.LoginResponse;
import com.sungkyul.cafeteria.auth.dto.NicknameAvailabilityResponse;
import com.sungkyul.cafeteria.auth.dto.NicknameRequest;
import com.sungkyul.cafeteria.auth.dto.UserResponse;
import com.sungkyul.cafeteria.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> googleLogin(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.idToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(authService.getMe(userId));
    }

    @GetMapping("/me/nickname/availability")
    public ResponseEntity<NicknameAvailabilityResponse> nicknameAvailability(
            @RequestParam String nickname,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(authService.checkNicknameAvailability(userId, nickname));
    }

    @PatchMapping("/me/nickname")
    public ResponseEntity<Void> updateNickname(
            @Valid @RequestBody NicknameRequest request,
            Authentication authentication
    ) {
        Long userId = (Long) authentication.getPrincipal();
        authService.updateNickname(userId, request.nickname());
        return ResponseEntity.ok().build();
    }
}
