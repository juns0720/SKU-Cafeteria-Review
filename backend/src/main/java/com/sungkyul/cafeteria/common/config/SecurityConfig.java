package com.sungkyul.cafeteria.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Spring Security 필터 체인 설정.
     * JWT 필터는 이후 단계에서 추가 예정.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // REST API이므로 CSRF 불필요
                .csrf(AbstractHttpConfigurer::disable)
                // JWT 기반 무상태 세션
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // CORS 설정 적용
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 현재 단계에서는 전체 허용 (이후 JWT 필터 추가 후 세분화 예정)
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }

    /**
     * CORS 설정 빈.
     * 프론트엔드 개발 서버(Vite 기본 포트 5173) 허용.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 허용 오리진: 로컬 프론트엔드 (배포 후 Vercel 도메인 추가 필요)
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        // 모든 HTTP 메서드 허용
        config.setAllowedMethods(List.of("*"));
        // 모든 요청 헤더 허용 (Authorization 헤더 포함)
        config.setAllowedHeaders(List.of("*"));
        // 쿠키·인증 정보 포함 요청 허용
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
