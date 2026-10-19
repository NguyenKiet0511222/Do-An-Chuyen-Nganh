package com.nhom5.backend.dto.admin;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** PATCH /admin/ai/results/accept-bulk — chấp nhận mọi ảnh trong hàng chờ có nhãn FRESH và confidence ≥ minConfidence. */
public record AiAcceptBulkRequest(
        @NotNull(message = "Vui lòng nhập độ tin cậy tối thiểu")
        @DecimalMin(value = "0.5", message = "Độ tin cậy tối thiểu phải từ 0.5 trở lên")
        @DecimalMax(value = "1.0", message = "Độ tin cậy tối thiểu không được lớn hơn 1")
        BigDecimal minConfidence
) {
}
