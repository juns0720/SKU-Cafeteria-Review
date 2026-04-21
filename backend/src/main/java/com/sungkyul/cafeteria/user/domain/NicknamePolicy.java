package com.sungkyul.cafeteria.user.domain;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class NicknamePolicy {

    public static final int MIN_LENGTH = 2;
    public static final int MAX_LENGTH = 12;

    private static final Pattern CONTROL_PATTERN = Pattern.compile("[\\u0000-\\u001F\\u007F-\\u009F]");
    private static final Pattern FORMAT_PATTERN = Pattern.compile("\\p{Cf}");
    private static final Pattern SPACE_PATTERN = Pattern.compile("\\s+");
    private static final Pattern FILTER_STRIP_PATTERN = Pattern.compile("[^\\p{L}\\p{N}]+");

    private static final Set<String> RESERVED_TERMS = Set.of(
            "admin",
            "administrator",
            "official",
            "operator",
            "system",
            "공식",
            "관리자",
            "시스템",
            "운영자"
    );

    private static final List<String> BLOCKED_TERMS = List.of(
            "fuck",
            "shit",
            "bitch",
            "dick",
            "개새끼",
            "걸레",
            "느금",
            "병신",
            "보지",
            "븅신",
            "섹스",
            "시발",
            "씨발",
            "애미",
            "자지",
            "존나",
            "좆",
            "지랄",
            "창녀",
            "ㅅㅂ"
    );

    private NicknamePolicy() {
    }

    public static NicknameValidationResult validate(String rawNickname) {
        String displayNickname = normalizeDisplay(rawNickname);
        String lookupKey = toLookupKey(displayNickname);

        if (displayNickname.isBlank()) {
            return NicknameValidationResult.invalid(
                    displayNickname,
                    lookupKey,
                    NicknameAvailabilityReason.INVALID_FORMAT,
                    "닉네임을 입력해주세요"
            );
        }

        int length = displayNickname.codePointCount(0, displayNickname.length());
        if (length < MIN_LENGTH) {
            return NicknameValidationResult.invalid(
                    displayNickname,
                    lookupKey,
                    NicknameAvailabilityReason.TOO_SHORT,
                    "닉네임은 2자 이상이어야 해요"
            );
        }

        if (length > MAX_LENGTH) {
            return NicknameValidationResult.invalid(
                    displayNickname,
                    lookupKey,
                    NicknameAvailabilityReason.TOO_LONG,
                    "닉네임은 12자 이하로 입력해주세요"
            );
        }

        String filterKey = toFilterKey(displayNickname);
        if (filterKey.isBlank()) {
            return NicknameValidationResult.invalid(
                    displayNickname,
                    lookupKey,
                    NicknameAvailabilityReason.INVALID_FORMAT,
                    "보이지 않는 문자만으로는 닉네임을 만들 수 없어요"
            );
        }

        if (RESERVED_TERMS.contains(filterKey)) {
            return NicknameValidationResult.invalid(
                    displayNickname,
                    lookupKey,
                    NicknameAvailabilityReason.RESERVED,
                    "사용할 수 없는 닉네임입니다"
            );
        }

        boolean blocked = BLOCKED_TERMS.stream().anyMatch(filterKey::contains);
        if (blocked) {
            return NicknameValidationResult.invalid(
                    displayNickname,
                    lookupKey,
                    NicknameAvailabilityReason.PROFANITY,
                    "부적절한 표현은 사용할 수 없어요"
            );
        }

        return NicknameValidationResult.valid(displayNickname, lookupKey);
    }

    public static String normalizeDisplay(String rawNickname) {
        if (rawNickname == null) {
            return "";
        }

        String normalized = Normalizer.normalize(rawNickname, Normalizer.Form.NFC);
        normalized = CONTROL_PATTERN.matcher(normalized).replaceAll(" ");
        normalized = FORMAT_PATTERN.matcher(normalized).replaceAll("");
        normalized = SPACE_PATTERN.matcher(normalized).replaceAll(" ");
        return normalized.trim();
    }

    public static String toLookupKey(String displayNickname) {
        return normalizeDisplay(displayNickname).toLowerCase(Locale.ROOT);
    }

    public static String toFilterKey(String displayNickname) {
        String normalized = normalizeDisplay(displayNickname).toLowerCase(Locale.ROOT);
        return FILTER_STRIP_PATTERN.matcher(normalized).replaceAll("");
    }
}
