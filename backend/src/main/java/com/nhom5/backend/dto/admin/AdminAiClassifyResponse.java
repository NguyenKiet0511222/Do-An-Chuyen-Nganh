package com.nhom5.backend.dto.admin;

import com.nhom5.backend.dto.ai.AiPrediction;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * POST /admin/ai/classify — "Thử mô hình" của admin, không lưu (docs/1910.md mục 6, 7.2).
 * top = 3 lớp điểm cao nhất trong all_scores; inferenceMs đo ở backend (gồm cả thời gian gửi ảnh sang AI service).
 */
public record AdminAiClassifyResponse(
        String label,
        String produce,
        String condition,
        Double confidence,
        List<TopScore> top,
        String modelVersion,
        int inferenceMs
) {

    public static final int TOP_SIZE = 3;

    public record TopScore(String label, Double score) {
    }

    public static AdminAiClassifyResponse from(AiPrediction p, int inferenceMs) {
        return new AdminAiClassifyResponse(
                p.label(),
                p.produceType().trim().toLowerCase(Locale.ROOT),
                p.condition().trim().toLowerCase(Locale.ROOT),
                p.confidence(),
                topScores(p),
                p.modelVersion(),
                inferenceMs);
    }

    /** all_scores giảm dần lấy 3 lớp đầu; AI không trả all_scores thì chỉ có lớp được chọn. */
    private static List<TopScore> topScores(AiPrediction p) {
        Map<String, Double> scores = p.allScores();
        if (scores == null || scores.isEmpty()) {
            return List.of(new TopScore(p.label(), p.confidence()));
        }
        return scores.entrySet().stream()
                .filter(e -> e.getKey() != null && e.getValue() != null)
                .sorted(Map.Entry.<String, Double>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(TOP_SIZE)
                .map(e -> new TopScore(e.getKey(), e.getValue()))
                .toList();
    }
}
