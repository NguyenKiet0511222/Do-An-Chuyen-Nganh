package com.nhom5.backend.dto.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * PATCH /admin/products/{id}/review (api.md mục 4.9, quy tắc mục 3.2).
 * APPROVE / REJECT / NEED_INFO: chỉ từ PENDING (REJECT, NEED_INFO bắt buộc reason).
 * HIDE: APPROVED -> HIDDEN (hidden_by = ADMIN). UNHIDE: HIDDEN -> APPROVED (admin bỏ ẩn được cả hàng người bán tự ẩn).
 */
public record ProductReviewRequest(
        @NotNull(message = "Vui lòng chọn thao tác APPROVE, REJECT, NEED_INFO, HIDE hoặc UNHIDE")
        Action action,

        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        String reason
) {

    public enum Action {
        APPROVE,
        REJECT,
        NEED_INFO,
        HIDE,
        UNHIDE
    }
}
