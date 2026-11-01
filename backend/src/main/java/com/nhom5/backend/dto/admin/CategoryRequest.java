package com.nhom5.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * POST / PUT /admin/categories (api.md mục 4.3). parentId null = danh mục cha (cây 2 cấp).
 * aiProduceKeys: các loại nông sản model nhận ra, cách nhau dấu phẩy, vd "tomato,potato" (CLAUDE.md mục 7).
 * displayOrder / isActive bỏ trống: tạo mới dùng 0 / true, sửa thì giữ nguyên.
 */
public record CategoryRequest(
        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 100, message = "Tên danh mục tối đa 100 ký tự")
        String name,

        Long parentId,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        @Size(max = 500, message = "Đường dẫn ảnh tối đa 500 ký tự")
        String imageUrl,

        @PositiveOrZero(message = "Thứ tự hiển thị phải ≥ 0")
        Integer displayOrder,

        Boolean isActive,

        @Size(max = 255, message = "Danh sách loại nông sản AI tối đa 255 ký tự")
        String aiProduceKeys
) {
}
