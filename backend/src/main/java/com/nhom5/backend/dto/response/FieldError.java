package com.nhom5.backend.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Thông tin chi tiết trường dữ liệu bị lỗi")
public record FieldError(
        @Schema(description = "Tên trường bị lỗi", example = "email")
        String field,

        @Schema(description = "Nội dung lỗi chi tiết", example = "Email không đúng định dạng")
        String message
) {}
