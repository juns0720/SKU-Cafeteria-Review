# Phase D — 사진 업로드

> **역할**: Cloudinary presigned upload + 리뷰 이미지 UX. 진행 상태는 [`99-progress.md`](./99-progress.md).
> **선행**: BE-A-3c(`image_url` 컬럼), Phase C 완료.
> **독립성**: Phase C 이후 언제든 붙일 수 있지만, C 끝에 추가하는 것을 권장(업로드 UX가 FE-C-6 모달 위에서 동작).

---

## BE-D-1a · Cloudinary 설정 빈

### 수정 `backend/build.gradle`
```gradle
implementation 'com.cloudinary:cloudinary-http44:1.36.0'
```

### 수정 `backend/src/main/resources/application.yml`
```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME:}
  api-key: ${CLOUDINARY_API_KEY:}
  api-secret: ${CLOUDINARY_API_SECRET:}
```

### 신규 `common/config/CloudinaryConfig.java`
```java
@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary(
        @Value("${cloudinary.cloud-name}") String cloudName,
        @Value("${cloudinary.api-key}") String apiKey,
        @Value("${cloudinary.api-secret}") String apiSecret
    ) {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret,
            "secure", true
        ));
    }
}
```

**검증**: `./gradlew bootRun` 기동 시 Cloudinary 빈 생성 성공 (빈 값이어도 기동은 성공)

---

## BE-D-1b · `GET /reviews/upload-signature` 엔드포인트

### 신규 `review/controller/ReviewImageController.java`
```java
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewImageController {

    private final Cloudinary cloudinary;

    @GetMapping("/upload-signature")
    public UploadSignatureResponse getUploadSignature() {
        long timestamp = System.currentTimeMillis() / 1000;
        Map<String, Object> params = new HashMap<>();
        params.put("timestamp", timestamp);
        params.put("folder", "reviews");
        params.put("allowed_formats", "jpg,jpeg,png,webp");
        params.put("max_file_size", 5_242_880);  // 5MB
        params.put("resource_type", "image");

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
```

### 신규 `review/dto/UploadSignatureResponse.java`
```java
public record UploadSignatureResponse(
    String signature,
    long timestamp,
    String apiKey,
    String cloudName,
    String folder,
    String allowedFormats,
    long maxFileSize,
    String resourceType
) {}
```

### 수정 `common/config/SecurityConfig.java`
- `/api/v1/reviews/upload-signature` → authenticated 유지 (기본 /reviews/** GET permitAll에서 덮어쓰기 필요)
  ```java
  .requestMatchers(HttpMethod.GET, "/api/v1/reviews/upload-signature").authenticated()
  .requestMatchers(HttpMethod.GET, "/api/v1/reviews/**").permitAll()
  ```

### ⚠️ 서명에 파라미터를 묶는 이유
Cloudinary는 **서명된 파라미터만 신뢰**한다. `allowed_formats`, `max_file_size`를 서명에 포함하면 클라이언트가 값을 바꿔도 서명 불일치로 거부된다. 프론트 선검증(UX용)은 별도로 한다.

**검증**
- Postman으로 서명 발급 → curl로 정상 이미지 업로드 → 200
- 6MB 파일 업로드 시도 → Cloudinary가 거부(400)
- PDF 업로드 시도 → allowed_formats 위반으로 거부
- 인증 없이 `/upload-signature` 호출 → 401

**의존성**: BE-D-1a

---

## BE-D-2 · Railway 환경변수 등록 + 재배포

### 환경변수 등록 (Railway UI)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### 배포
- main 머지 → 자동 재배포 → `GET /reviews/upload-signature` 헬스체크

**검증**: 실제 Cloudinary 계정으로 업로드 end-to-end 확인

---

## FE-D-3 · 업로드 UX

### 신규 `frontend/src/api/upload.js`
```js
export async function getUploadSignature() {
  const { data } = await client.get('/reviews/upload-signature');
  return data;
}

export async function uploadToCloudinary(file, sig) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sig.apiKey);
  fd.append('timestamp', sig.timestamp);
  fd.append('signature', sig.signature);
  fd.append('folder', sig.folder);
  fd.append('allowed_formats', sig.allowedFormats);
  fd.append('max_file_size', sig.maxFileSize);
  fd.append('resource_type', sig.resourceType);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) throw new Error('업로드 실패');
  return res.json(); // { secure_url, public_id, ... }
}
```

### 수정 `frontend/src/components/MenuDetailModal.jsx`
- ReviewForm에 파일 input 추가
- 선검증 (UX용, 서버 서명이 최종 방어선):
  - 5MB 초과 → 에러 메시지
  - `type.startsWith('image/')` 아니면 거부
- 썸네일 프리뷰 (URL.createObjectURL)
- 업로드 스피너 (업로드 중 등록 버튼 비활성)
- (선택) canvas로 긴 변 1080px 리사이즈
- 업로드 실패 → 이미지 없이 리뷰 등록 가능 (폴백, 사용자에게 Toast로 알림)

### 수정 `frontend/src/components/ReviewItem.jsx`
- `imageUrl`이 있으면 썸네일 (`<img>` 64px × 64px rounded)
- 썸네일 클릭 → 라이트박스 (`createPortal`로 풀스크린 오버레이 + 이미지)

**뷰포트 검증**: 375/768/1280
- 모바일: 모달 내 첨부 input 터치 가능
- 라이트박스: 풀스크린, 탭/ESC로 닫기

**검증 시나리오**:
1. 정상 이미지 첨부 → 썸네일 프리뷰 → 등록 → ReviewItem에 썸네일 → 클릭 시 라이트박스
2. 6MB 파일 → 클라이언트 에러 Toast
3. PDF → 클라이언트 에러 Toast
4. 업로드 중 → 스피너, 등록 버튼 비활성
5. 네트워크 실패 → Toast "이미지 없이 등록할까요?" + 폴백 경로

**의존성**: BE-D-1b, BE-D-2, FE-C-6
