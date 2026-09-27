package com.nhom5.backend.dto.product;

import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Thông tin kết quả AI kiểm định chất lượng nông sản cho từng ảnh")
public record AiInfoDto(
        @Schema(description = "Nhãn ban đầu AI dự đoán", example = "FRESH")
        AiLabel label,

        @Schema(description = "Độ tin cậy của AI (0.0000 - 1.0000)", example = "0.9200")
        BigDecimal confidence,

        @Schema(description = "Nhãn cuối cùng sau khi admin duyệt (nếu có)", example = "FRESH")
        AiLabel finalLabel,

        @Schema(description = "Trạng thái kiểm định", example = "AUTO_ACCEPTED")
        AiReviewStatus reviewStatus
) {}
