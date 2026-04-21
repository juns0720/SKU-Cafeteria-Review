package com.sungkyul.cafeteria.user.domain;

public record NicknameValidationResult(
        String displayNickname,
        String lookupKey,
        NicknameAvailabilityReason reason,
        String message
) {

    public static NicknameValidationResult valid(String displayNickname, String lookupKey) {
        return new NicknameValidationResult(
                displayNickname,
                lookupKey,
                NicknameAvailabilityReason.OK,
                "사용 가능한 닉네임이에요"
        );
    }

    public static NicknameValidationResult invalid(
            String displayNickname,
            String lookupKey,
            NicknameAvailabilityReason reason,
            String message
    ) {
        return new NicknameValidationResult(displayNickname, lookupKey, reason, message);
    }

    public boolean isValid() {
        return reason == NicknameAvailabilityReason.OK;
    }
}
