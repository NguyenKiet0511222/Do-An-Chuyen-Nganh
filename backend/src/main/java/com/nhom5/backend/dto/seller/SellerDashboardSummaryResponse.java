package com.nhom5.backend.dto.seller;

import java.util.Map;

/**
 * GET /seller/dashboard/summary.
 * productsByStatus luôn đủ 6 khoá DRAFT..HIDDEN (0 nếu không có) để frontend không phải kiểm tra null.
 */
public record SellerDashboardSummaryResponse(
        long todayRevenue,
        long pendingOrders,
        Map<String, Long> productsByStatus,
        AiFlags aiFlags
) {

    /**
     * Số ảnh sản phẩm cần chú ý: đang chờ admin kiểm định, bị yêu cầu chụp lại,
     * và có nhãn hiển thị ROTTEN.
     */
    public record AiFlags(long pendingReview, long retakeRequested, long rotten) {
    }
}
