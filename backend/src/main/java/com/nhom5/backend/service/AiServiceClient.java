package com.nhom5.backend.service;

import com.nhom5.backend.config.AppProperties;
import com.nhom5.backend.dto.ai.AiHealth;
import com.nhom5.backend.dto.ai.AiPrediction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Optional;

/**
 * Client gọi AI service Python (CLAUDE.md mục 7): {@code POST /classify} (multipart field "image") và {@code GET /health}.
 *
 * <p>Nguyên tắc "AI không được chặn tiến độ web": lỗi gì (tắt, timeout, 4xx/5xx, 503 chưa nạp model,
 * JSON sai hợp đồng) cũng chỉ log 1 dòng cảnh báo và trả {@link Optional#empty()} — nơi gọi tự đưa ảnh
 * vào hàng chờ admin. {@code app.ai.enabled=false} thì trả rỗng ngay, không gọi mạng.</p>
 */
@Slf4j
@Service
public class AiServiceClient {

    private static final int DEFAULT_TIMEOUT_MS = 5000;
    /** Kết nối tới cổng đóng trên Windows mất ~2s mới báo lỗi -> không chờ kết nối lâu hơn mức này. */
    private static final int MAX_CONNECT_TIMEOUT_MS = 2000;
    private static final int MAX_LOG_MESSAGE_LENGTH = 200;

    private final boolean enabled;
    private final RestClient restClient;

    public AiServiceClient(AppProperties appProperties) {
        AppProperties.Ai ai = appProperties.ai();
        this.enabled = ai.enabled();
        int timeoutMs = ai.timeoutMs() > 0 ? ai.timeoutMs() : DEFAULT_TIMEOUT_MS;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(Math.min(MAX_CONNECT_TIMEOUT_MS, timeoutMs)));
        requestFactory.setReadTimeout(Duration.ofMillis(timeoutMs));

        // Dùng RestClient.builder() tĩnh, không phụ thuộc bean RestClient.Builder tự cấu hình
        RestClient.Builder builder = RestClient.builder().requestFactory(requestFactory);
        if (ai.baseUrl() != null && !ai.baseUrl().isBlank()) {
            builder.baseUrl(ai.baseUrl().trim());
        }
        this.restClient = builder.build();
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Phân loại 1 ảnh. Part "image" phải có filename + content-type ảnh (FastAPI trả 400 nếu không phải image/*).
     *
     * @return kết quả hợp lệ theo hợp đồng, hoặc rỗng nếu AI tắt / lỗi / trả dữ liệu sai
     */
    public Optional<AiPrediction> classify(byte[] bytes, String filename, String contentType) {
        if (!enabled) {
            return Optional.empty();
        }
        try {
            // Tự dựng part thay vì MultipartBodyBuilder: class đó cần reactive-streams (không có trong webmvc)
            HttpHeaders partHeaders = new HttpHeaders();
            partHeaders.setContentDisposition(ContentDisposition.formData()
                    .name("image")
                    .filename(filename == null || filename.isBlank() ? "image" : filename)
                    .build());
            partHeaders.setContentType(contentType == null || contentType.isBlank()
                    ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType));
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new HttpEntity<>(new ByteArrayResource(bytes), partHeaders));

            AiPrediction prediction = restClient.post()
                    .uri("/classify")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(AiPrediction.class);
            return validate(prediction);
        } catch (RuntimeException e) {
            log.warn("AI service không phản hồi (POST /classify): {}", shortMessage(e));
            return Optional.empty();
        }
    }

    /** Trạng thái AI service + phiên bản model đang chạy; rỗng nếu AI tắt hoặc không gọi được. */
    public Optional<AiHealth> health() {
        if (!enabled) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(restClient.get().uri("/health").retrieve().body(AiHealth.class));
        } catch (RuntimeException e) {
            log.warn("AI service không phản hồi (GET /health): {}", shortMessage(e));
            return Optional.empty();
        }
    }

    /** Chặn kết quả sai hợp đồng (thiếu nhãn, condition lạ, confidence ngoài 0..1) -> coi như AI lỗi. */
    private static Optional<AiPrediction> validate(AiPrediction p) {
        boolean valid = p != null
                && p.label() != null && !p.label().isBlank()
                && p.produceType() != null && !p.produceType().isBlank()
                && (AiPrediction.CONDITION_FRESH.equalsIgnoreCase(p.condition())
                        || AiPrediction.CONDITION_ROTTEN.equalsIgnoreCase(p.condition()))
                && p.confidence() != null && p.confidence() >= 0 && p.confidence() <= 1;
        if (!valid) {
            log.warn("AI service trả kết quả sai hợp đồng: {}", p == null ? "rỗng"
                    : "label=" + p.label() + ", produce_type=" + p.produceType()
                            + ", condition=" + p.condition() + ", confidence=" + p.confidence());
            return Optional.empty();
        }
        return Optional.of(p);
    }

    /** Thông báo lỗi gọn trên 1 dòng kèm nguyên nhân gốc (vd "Read timed out"), không in stack trace mỗi lần AI tắt. */
    private static String shortMessage(Exception e) {
        String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        Throwable root = NestedExceptionUtils.getMostSpecificCause(e);
        if (root != e && root.getMessage() != null && !message.contains(root.getMessage())) {
            message += " (" + root.getMessage() + ")";
        }
        message = message.replaceAll("\\s+", " ").trim();
        return message.length() > MAX_LOG_MESSAGE_LENGTH ? message.substring(0, MAX_LOG_MESSAGE_LENGTH) + "…" : message;
    }
}
