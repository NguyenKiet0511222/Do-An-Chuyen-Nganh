package com.nhom5.backend.dto.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * PATCH /admin/shops/{id}/status (api.md mục 4.9).
 * VERIFY: PENDING_VERIFICATION -> ACTIVE + chủ shop thành SELLER; LOCK: ACTIVE -> LOCKED; UNLOCK: LOCKED -> ACTIVE.
 * reason: ghi chú của admin — hiện chưa có cột lưu (ERD chưa có), chỉ nhận để tương thích hợp đồng.
 */
public record ShopStatusRequest(
        @NotNull(message = "Vui lòng chọn thao tác VERIFY, LOCK hoặc UNLOCK")
        Action action,

        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        String reason
) {

    public enum Action {
        VERIFY,
        LOCK,
        UNLOCK
    }
}
