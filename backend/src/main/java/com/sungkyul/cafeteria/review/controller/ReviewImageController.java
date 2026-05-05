package com.sungkyul.cafeteria.review.controller;

import com.cloudinary.Cloudinary;
import com.sungkyul.cafeteria.review.dto.UploadSignatureResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewImageController {

    private final Cloudinary cloudinary;

    @GetMapping("/upload-signature")
    public UploadSignatureResponse getUploadSignature() {
        long timestamp = System.currentTimeMillis() / 1000;

        // resource_type·max_file_size는 signed upload 서명 대상 파라미터가 아님
        Map<String, Object> params = new HashMap<>();
        params.put("timestamp", timestamp);
        params.put("folder", "reviews");
        params.put("allowed_formats", "jpg,jpeg,png,webp");

        String signature = cloudinary.apiSignRequest(params, cloudinary.config.apiSecret);

        return new UploadSignatureResponse(
                signature,
                timestamp,
                cloudinary.config.apiKey,
                cloudinary.config.cloudName,
                "reviews",
                "jpg,jpeg,png,webp",
                5_242_880,
                "image"
        );
    }
}
