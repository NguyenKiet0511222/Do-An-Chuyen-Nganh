package com.nhom5.backend.entity.enums;

/**
 * Trạng thái đơn hàng (api.md mục 3.5): PENDING = Chờ xác nhận, CONFIRMED = Đã xác nhận,
 * PROCESSING = Đang chuẩn bị, SHIPPING = Đang giao, DELIVERED = Hoàn thành, CANCELLED = Đã huỷ.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    SHIPPING,
    DELIVERED,
    CANCELLED
}
