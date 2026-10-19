package com.nhom5.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Kết quả GET {app.ai.base-url}/health của AI service. Service vẫn chạy khi thiếu model
 * nhưng báo model_loaded=false (khi đó /classify trả 503). model_version là phiên bản model đang chạy.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiHealth(
        String status,
        @JsonProperty("model_loaded") Boolean modelLoaded,
        @JsonProperty("model_version") String modelVersion
) {

    /** AI service trả lời và đã nạp được model -> /classify dùng được. */
    public boolean isReady() {
        return Boolean.TRUE.equals(modelLoaded);
    }
}
