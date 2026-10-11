package com.nhom5.backend.entity.enums;

/** Thao tác ghi vào product_review_history: SUBMIT do người bán, còn lại do admin (api.md mục 3.2, 4.9). */
public enum ProductReviewAction {
    SUBMIT,
    APPROVE,
    REJECT,
    NEED_INFO,
    HIDE,
    UNHIDE
}
