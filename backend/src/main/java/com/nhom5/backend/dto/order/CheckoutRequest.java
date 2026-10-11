package com.nhom5.backend.dto.order;

import com.nhom5.backend.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Body của POST /orders/checkout (api.md mục 4.6). cartItemIds rỗng = toàn bộ giỏ; paymentMethod null = COD. */
public record CheckoutRequest(
        @NotNull(message = "Vui lòng chọn địa chỉ giao hàng")
        Long addressId,

        @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
        String note,

        List<Long> cartItemIds,

        PaymentMethod paymentMethod
) {
}
