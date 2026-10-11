package com.nhom5.backend.dto.admin;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** PATCH /admin/products/review-bulk — duyệt / từ chối nhiều sản phẩm PENDING một lượt (api.md mục 4.9). */
public record ProductReviewBulkRequest(
        @NotEmpty(message = "Vui lòng chọn ít nhất 1 sản phẩm")
        List<Long> productIds,

        @NotNull(message = "Vui lòng chọn thao tác APPROVE hoặc REJECT")
        Action action,

        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        String reason
) {

    public enum Action {
        APPROVE,
        REJECT
    }
}
