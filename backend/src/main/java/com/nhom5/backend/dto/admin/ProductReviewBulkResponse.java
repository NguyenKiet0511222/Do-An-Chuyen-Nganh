package com.nhom5.backend.dto.admin;

import java.util.List;

/** Kết quả review-bulk: xử lý từng sản phẩm độc lập, sản phẩm lỗi (sai trạng thái, không tồn tại) không chặn sản phẩm khác. */
public record ProductReviewBulkResponse(int succeeded, List<Failure> failed) {

    public record Failure(Long productId, String message) {
    }
}
