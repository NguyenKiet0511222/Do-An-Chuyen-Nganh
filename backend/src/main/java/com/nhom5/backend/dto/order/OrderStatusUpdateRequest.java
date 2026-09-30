package com.nhom5.backend.dto.order;

import com.nhom5.backend.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * PATCH /seller/orders/{id}/status: { "status": "CONFIRMED", "note": "..." }.
 * Huỷ đơn bắt buộc cancelReason: { "status": "CANCELLED", "cancelReason": "..." } (api.md mục 3.5).
 */
public record OrderStatusUpdateRequest(
        @NotNull(message = "Vui lòng chọn trạng thái mới")
        OrderStatus status,

        @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
        String note,

        @Size(max = 500, message = "Lý do huỷ tối đa 500 ký tự")
        String cancelReason
) {
}
