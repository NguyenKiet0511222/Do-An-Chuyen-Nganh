package com.nhom5.backend.dto.admin;

/**
 * GET /admin/dashboard/summary (api.md mục 4.9). Ngày tính theo giờ server.
 * <ul>
 *   <li>todayRevenue: tổng tiền đơn DELIVERED có delivered_at trong hôm nay (toàn sàn).</li>
 *   <li>revenueChangePct: % thay đổi so với hôm qua, làm tròn 1 chữ số; hôm qua = 0 -> null (không so được).</li>
 *   <li>newOrdersToday: số đơn đặt trong hôm nay; pendingOrders: số đơn đang PENDING.</li>
 *   <li>aiPendingReview: số ảnh trong hàng chờ kiểm định AI (cùng điều kiện badge menu);
 *       aiRottenFlags: số ảnh trong hàng chờ bị AI gắn ROTTEN.</li>
 *   <li>pendingShops: shop chờ xác minh; totalShops: shop đang ACTIVE; totalCustomers: tài khoản role CUSTOMER.</li>
 * </ul>
 */
public record AdminDashboardSummaryResponse(
        long todayRevenue,
        Double revenueChangePct,
        long newOrdersToday,
        long pendingOrders,
        long pendingProducts,
        long aiPendingReview,
        long aiRottenFlags,
        long pendingShops,
        long totalCustomers,
        long totalShops
) {
}
