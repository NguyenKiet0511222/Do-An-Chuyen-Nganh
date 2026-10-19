package com.nhom5.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * Kết quả POST {app.ai.base-url}/classify của AI service (CLAUDE.md mục 7) — JSON snake_case:
 * {@code { "label": "apple_fresh", "produce_type": "apple", "condition": "fresh", "confidence": 0.9312,
 * "all_scores": {...}, "model_version": "mobilenetv2-pt-v1" }}. confidence là 0..1, không phải %.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiPrediction(
        String label,
        @JsonProperty("produce_type") String produceType,
        String condition,
        Double confidence,
        @JsonProperty("all_scores") Map<String, Double> allScores,
        @JsonProperty("model_version") String modelVersion
) {

    public static final String CONDITION_FRESH = "fresh";
    public static final String CONDITION_ROTTEN = "rotten";

    public boolean isRotten() {
        return CONDITION_ROTTEN.equalsIgnoreCase(condition);
    }
}
