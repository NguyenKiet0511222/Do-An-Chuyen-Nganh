package com.nhom5.backend.dto.product;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Thông tin tóm tắt danh mục")
public record CategoryBriefDto(
        @Schema(description = "Mã danh mục", example = "5")
        Long id,

        @Schema(description = "Tên danh mục", example = "Củ quả")
        String name
) {}
