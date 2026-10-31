package com.nhom5.backend.dto.ai;

import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.enums.AiLabel;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 1 lượt kiểm tra nhanh của khách Premium (POST /ai/classify, GET /ai/history — api.md mục 4.7).
 * label: FRESH | ROTTEN | UNCERTAIN (dưới ngưỡng review); confidence 0..1, không phải %.
 */
public record QuickCheckResponse(
        Long id,
        String imageUrl,
        String produce,
        AiLabel label,
        BigDecimal confidence,
        String modelVersion,
        Integer inferenceMs,
        LocalDateTime createdAt
) {

    public static QuickCheckResponse from(AiResult r) {
        return new QuickCheckResponse(r.getId(), r.getImageUrl(), r.getProduce(), r.getLabel(), r.getConfidence(),
                r.getModelVersion(), r.getInferenceMs(), r.getCreatedAt());
    }
}
