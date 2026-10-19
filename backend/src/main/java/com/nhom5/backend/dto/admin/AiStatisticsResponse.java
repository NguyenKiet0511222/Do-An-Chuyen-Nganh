package com.nhom5.backend.dto.admin;

import java.math.BigDecimal;
import java.util.Map;

/**
 * GET /admin/ai/statistics?from=&amp;to= — chỉ tính kết quả AI của ảnh sản phẩm, lọc theo ngày tạo (from/to bỏ trống = mọi lúc).
 * <ul>
 *   <li>totalClassified: mọi ảnh trong khoảng (kể cả ảnh AI lỗi) = tổng byLabel = tổng byReviewStatus.</li>
 *   <li>byLabel: theo nhãn hiển thị (finalLabel ?? label), đủ 3 khoá FRESH / ROTTEN / UNCERTAIN.</li>
 *   <li>byReviewStatus: đủ 5 trạng thái kiểm định.</li>
 *   <li>avgConfidence: bỏ qua ảnh AI lỗi; null nếu không có ảnh nào.</li>
 *   <li>pendingReview: số đang chờ hiện tại theo điều kiện hàng chờ (docs/1910.md mục 2), KHÔNG lọc ngày.</li>
 *   <li>correctedByAdmin: số ảnh CORRECTED; aiUnavailable: số ảnh AI tắt / lỗi (không có model_version).</li>
 * </ul>
 */
public record AiStatisticsResponse(
        long totalClassified,
        Map<String, Long> byLabel,
        Map<String, Long> byReviewStatus,
        BigDecimal avgConfidence,
        long pendingReview,
        long correctedByAdmin,
        long aiUnavailable
) {
}
