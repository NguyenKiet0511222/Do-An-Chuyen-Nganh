package com.nhom5.backend.controller;

import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.dto.seller.SellerAiResultResponse;
import com.nhom5.backend.dto.seller.SellerDashboardSummaryResponse;
import com.nhom5.backend.service.SellerDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Tổng quan shop + kết quả AI của shop (api.md mục 4.8). */
@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
@Tag(name = "Seller - Tổng quan & AI", description = "Số liệu dashboard, kết quả AI của ảnh sản phẩm")
public class SellerDashboardController {

    private final SellerDashboardService sellerDashboardService;

    @GetMapping("/dashboard/summary")
    @Operation(summary = "Số liệu tổng quan: doanh thu hôm nay, đơn chờ xác nhận, sản phẩm theo trạng thái, ảnh cần chú ý")
    public ApiResponse<SellerDashboardSummaryResponse> summary(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(sellerDashboardService.summary(Long.parseLong(jwt.getSubject())));
    }

    @GetMapping("/ai/results")
    @Operation(summary = "Kết quả AI các ảnh sản phẩm của shop (mới nhất trước)")
    public ApiResponse<PageResponse<SellerAiResultResponse>> aiResults(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Một hoặc nhiều reviewStatus cách nhau dấu phẩy, ví dụ RETAKE_REQUESTED. Bỏ trống = tất cả")
            @RequestParam(required = false) String reviewStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(sellerDashboardService.aiResults(Long.parseLong(jwt.getSubject()), reviewStatus, page, size));
    }
}
