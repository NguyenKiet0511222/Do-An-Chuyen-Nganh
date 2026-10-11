package com.nhom5.backend.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body của PATCH /orders/{id}/cancel (api.md mục 4.6) — khách huỷ bắt buộc có lý do. */
public record OrderCancelRequest(
        @NotBlank(message = "Vui lòng nhập lý do huỷ đơn")
        @Size(max = 500, message = "Lý do huỷ tối đa 500 ký tự")
        String cancelReason
) {
}
