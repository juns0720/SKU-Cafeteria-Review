package com.sungkyul.cafeteria.common.exception;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setValidator(validator)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void returns_400_for_illegal_argument_exception() throws Exception {
        mockMvc.perform(get("/test/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("잘못된 요청입니다"));
    }

    @Test
    void returns_403_for_access_denied_exception() throws Exception {
        mockMvc.perform(get("/test/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("권한이 없습니다"));
    }

    @Test
    void returns_400_for_validation_exception() throws Exception {
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "taste": 0
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("taste는 1 이상이어야 합니다"));
    }

    @Test
    void returns_409_for_nickname_constraint_violation() throws Exception {
        mockMvc.perform(get("/test/nickname-conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("이미 사용 중인 닉네임입니다"));
    }

    @RestController
    static class TestController {

        @GetMapping("/test/bad-request")
        void badRequest() {
            throw new IllegalArgumentException("잘못된 요청입니다");
        }

        @GetMapping("/test/forbidden")
        void forbidden() {
            throw new AccessDeniedException("리뷰 수정 권한이 없습니다");
        }

        @GetMapping("/test/nickname-conflict")
        void nicknameConflict() {
            throw new DataIntegrityViolationException(
                    "duplicate key value violates unique constraint \"uk_users_nickname_normalized\""
            );
        }

        @PostMapping("/test/validation")
        void validate(@Valid @RequestBody RatingRequest request) {
        }
    }

    record RatingRequest(
            @Min(value = 1, message = "taste는 1 이상이어야 합니다")
            int taste
    ) {
    }
}
