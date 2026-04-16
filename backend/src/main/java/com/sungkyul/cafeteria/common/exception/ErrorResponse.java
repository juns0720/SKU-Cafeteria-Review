package com.sungkyul.cafeteria.common.exception;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 공통 에러 응답 형식.
 * 모든 예외 처리 결과는 이 레코드로 직렬화되어 반환된다.
 *
 * @param status    HTTP 상태 코드
 * @param message   클라이언트에 노출할 오류 메시지
 * @param timestamp 오류 발생 시각 (ISO 8601)
 */
public record ErrorResponse(int status, String message, String timestamp) {

    /** 현재 시각을 자동으로 채워 ErrorResponse 인스턴스를 생성한다. */
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(
                status,
                message,
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
    }
}
