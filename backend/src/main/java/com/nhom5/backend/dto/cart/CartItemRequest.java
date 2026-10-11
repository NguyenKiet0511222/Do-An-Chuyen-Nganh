package com.nhom5.backend.dto.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Body của POST /cart/items (api.md mục 4.5) — sản phẩm đã có trong giỏ thì cộng dồn. */
public record CartItemRequest(
        @NotNull(message = "Vui lòng chọn sản phẩm")
        Long productId,

        @NotNull(message = "Vui lòng nhập số lượng")
        @Min(value = 1, message = "Số lượng tối thiểu là 1")
        Integer quantity
) {
}
