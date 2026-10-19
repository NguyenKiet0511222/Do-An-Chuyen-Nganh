package com.nhom5.backend.dto.ai;

/**
 * 2 ngưỡng tin cậy đang áp dụng (docs/1910.md mục 1): AI = tươi và confidence từ {@code autoAccept} trở lên
 * -> tự chấp nhận; confidence dưới {@code review} -> UNCERTAIN; còn lại vào hàng chờ admin.
 */
public record AiThresholds(double autoAccept, double review) {
}
