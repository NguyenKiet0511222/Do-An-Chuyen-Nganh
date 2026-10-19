package com.nhom5.backend.dto.admin;

import jakarta.validation.constraints.NotNull;

/** PUT /admin/ai/settings — điều kiện 0 &lt; reviewThreshold &lt; autoAcceptThreshold ≤ 1 kiểm tra ở AiSettingsService (sai -> 400). */
public record AiSettingsRequest(
        @NotNull(message = "Vui lòng nhập ngưỡng tự chấp nhận")
        Double autoAcceptThreshold,

        @NotNull(message = "Vui lòng nhập ngưỡng kiểm định")
        Double reviewThreshold
) {
}
