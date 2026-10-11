package com.nhom5.backend.dto.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Body của PUT /cart/items/{id} — quantity = 0 nghĩa là xoá dòng. */
public record CartQuantityRequest(
        @NotNull(message = "Vui lòng nhập số lượng")
        @Min(value = 0, message = "Số lượng không được âm")
        Integer quantity
) {
}
