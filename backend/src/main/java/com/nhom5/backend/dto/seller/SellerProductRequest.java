package com.nhom5.backend.dto.seller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Body tạo / sửa sản phẩm: POST /seller/products, PUT /seller/products/{id} (api.md mục 4.8). */
public record SellerProductRequest(
        @NotBlank(message = "Vui lòng nhập tên sản phẩm")
        @Size(min = 3, max = 200, message = "Tên sản phẩm từ 3 đến 200 ký tự")
        String name,

        @NotNull(message = "Vui lòng chọn danh mục")
        Long categoryId,

        @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
        String description,

        @NotNull(message = "Vui lòng nhập giá bán")
        @Positive(message = "Giá bán phải lớn hơn 0")
        @Max(value = 1_000_000_000L, message = "Giá bán không hợp lệ")
        Long price,

        @NotBlank(message = "Vui lòng nhập đơn vị tính")
        @Size(max = 20, message = "Đơn vị tính tối đa 20 ký tự")
        String unit,

        @NotNull(message = "Vui lòng nhập tồn kho")
        @Min(value = 0, message = "Tồn kho không được âm")
        @Max(value = 1_000_000, message = "Tồn kho không hợp lệ")
        Integer stockQuantity,

        @Size(max = 150, message = "Xuất xứ tối đa 150 ký tự")
        String origin
) {
}
