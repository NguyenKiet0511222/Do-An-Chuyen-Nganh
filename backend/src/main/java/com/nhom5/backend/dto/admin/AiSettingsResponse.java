package com.nhom5.backend.dto.admin;

/**
 * GET / PUT /admin/ai/settings. 2 ngưỡng đọc từ bảng settings (thiếu thì mặc định app.ai.*);
 * modelVersion + aiOnline lấy từ GET /health của AI service (aiOnline = trả lời được và đã nạp model).
 */
public record AiSettingsResponse(
        double autoAcceptThreshold,
        double reviewThreshold,
        String modelVersion,
        boolean aiOnline
) {
}
