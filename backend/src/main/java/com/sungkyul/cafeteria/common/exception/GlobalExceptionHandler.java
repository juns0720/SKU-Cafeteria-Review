package com.sungkyul.cafeteria.common.exception;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 애플리케이션 전역 예외 처리기.
 * 컨트롤러에서 던져진 예외를 잡아 일관된 ErrorResponse 형식으로 반환한다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 처리되지 않은 모든 예외 → 500 Internal Server Error.
     * 민감한 내부 정보가 노출되지 않도록 고정 메시지를 반환한다.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(500, "서버 오류가 발생했습니다"));
    }

    /**
     * 잘못된 인수 → 400 Bad Request.
     * 예외 메시지를 그대로 클라이언트에 전달한다.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(400, e.getMessage()));
    }

    /**
     * JPA 엔티티 조회 실패 → 404 Not Found.
     * 예외 메시지를 그대로 클라이언트에 전달한다.
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException e) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(404, e.getMessage()));
    }

    /**
     * @Valid 유효성 검증 실패 → 400 Bad Request.
     * 여러 필드 오류 중 첫 번째 오류 메시지만 반환한다.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        // 첫 번째 필드 에러 메시지 추출 (없으면 기본 메시지 사용)
        String message = e.getBindingResult().getFieldErrors()
                .stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("유효하지 않은 입력값입니다");

        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.of(400, message));
    }
}
