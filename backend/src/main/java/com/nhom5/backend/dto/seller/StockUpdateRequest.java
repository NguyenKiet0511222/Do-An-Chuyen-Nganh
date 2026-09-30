package com.nhom5.backend.dto.seller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** PATCH /seller/products/{id}/stock — sửa tồn kho không cần duyệt lại. */
public record StockUpdateRequest(
        @NotNull(message = "Vui lòng nhập tồn kho")
        @Min(value = 0, message = "Tồn kho không được âm")
        @Max(value = 1_000_000, message = "Tồn kho không hợp lệ")
        Integer stockQuantity
) {
}
