package com.nhom5.backend.controller;

import com.nhom5.backend.dto.admin.AdminDashboardSummaryResponse;
import com.nhom5.backend.dto.admin.AdminProductResponse;
import com.nhom5.backend.dto.admin.RevenuePointResponse;
import com.nhom5.backend.dto.order.OrderSummaryResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Tổng quan toàn sàn cho admin (api.md mục 4.9) — chỉ ADMIN (SecurityConfig chặn /api/admin/**). */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin - Tổng quan", description = "Số liệu dashboard, biểu đồ doanh thu, đơn mới, sản phẩm chờ duyệt")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/summary")
    @Operation(summary = "Số liệu tổng quan hôm nay (doanh thu, đơn, sản phẩm / ảnh AI / shop chờ xử lý)")
    public ApiResponse<AdminDashboardSummaryResponse> summary() {
        return ApiResponse.ok(adminDashboardService.summary());
    }

    @GetMapping("/revenue")
    @Operation(summary = "Doanh thu theo ngày (đơn DELIVERED theo delivered_at)",
            description = "days ngày gần nhất tính cả hôm nay (1–90), ngày không có đơn trả revenue = 0")
    public ApiResponse<List<RevenuePointResponse>> revenue(@RequestParam(defaultValue = "7") int days) {
        return ApiResponse.ok(adminDashboardService.revenue(days));
    }

    @GetMapping("/recent-orders")
    @Operation(summary = "Đơn mới nhất toàn sàn (limit 1–20)")
    public ApiResponse<List<OrderSummaryResponse>> recentOrders(@RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.ok(adminDashboardService.recentOrders(limit));
    }

    @GetMapping("/pending-products")
    @Operation(summary = "Sản phẩm chờ duyệt kèm nhãn AI (limit 1–20)")
    public ApiResponse<List<AdminProductResponse>> pendingProducts(@RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.ok(adminDashboardService.pendingProducts(limit));
    }
}
