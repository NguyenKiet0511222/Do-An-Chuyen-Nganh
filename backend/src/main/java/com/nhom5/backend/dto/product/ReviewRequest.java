package com.nhom5.backend.dto.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** POST /products/{id}/reviews (api.md mục 3.6, 4.4): { "orderId": 5011, "rating": 5, "comment": "Rất tươi" }. */
public record ReviewRequest(
        @NotNull(message = "Vui lòng chọn đơn hàng đã mua sản phẩm")
        Long orderId,

        @NotNull(message = "Vui lòng chọn số sao")
        @Min(value = 1, message = "Số sao từ 1 đến 5")
        @Max(value = 5, message = "Số sao từ 1 đến 5")
        Integer rating,

        @Size(max = 1000, message = "Nhận xét tối đa 1000 ký tự")
        String comment
) {
}
