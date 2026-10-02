package com.nhom5.backend.dto.product;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Thông tin chi tiết danh mục")
public record CategoryDto(
        @Schema(description = "Mã danh mục", example = "5")
        Long id,

        @Schema(description = "Tên danh mục", example = "Củ quả")
        String name,

        @Schema(description = "Slug", example = "cu-qua")
        String slug,

        @Schema(description = "Mã danh mục cha (nếu có)", example = "1")
        Long parentId,

        @Schema(description = "Mô tả", example = "Các loại củ quả")
        String description,

        @Schema(description = "Ảnh đại diện", example = "/uploads/categories/5.jpg")
        String imageUrl,

        @Schema(description = "Thứ tự hiển thị", example = "1")
        Integer displayOrder,

        @Schema(description = "Đang hoạt động", example = "true")
        Boolean isActive,

        @Schema(description = "Từ khóa AI", example = "tomato,potato")
        String aiProduceKeys,

        @Schema(description = "Số lượng sản phẩm", example = "10")
        Integer productCount,

        @Schema(description = "Danh mục con")
        List<CategoryDto> children
) {}
