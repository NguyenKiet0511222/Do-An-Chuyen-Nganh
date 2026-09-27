package com.nhom5.backend.dto.product;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Ảnh sản phẩm kèm thông tin AI")
public record ProductImageDto(
        @Schema(description = "Mã ảnh", example = "1")
        Long id,

        @Schema(description = "Đường dẫn ảnh", example = "/uploads/products/1187/a.jpg")
        String url,

        @Schema(description = "Là ảnh đại diện chính", example = "true")
        Boolean isPrimary,

        @Schema(description = "Thứ tự hiển thị", example = "1")
        Integer displayOrder,

        @Schema(description = "Kết quả kiểm định AI")
        AiInfoDto ai
) {}
