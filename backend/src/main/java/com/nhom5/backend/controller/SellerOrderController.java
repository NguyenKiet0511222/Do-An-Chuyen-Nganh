package com.nhom5.backend.controller;

import com.nhom5.backend.dto.order.OrderDetailResponse;
import com.nhom5.backend.dto.order.OrderStatusUpdateRequest;
import com.nhom5.backend.dto.order.OrderSummaryResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.service.SellerOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** Đơn hàng của shop (api.md mục 4.8) — chỉ thấy đơn thuộc shop mình. */
@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
@Tag(name = "Seller - Đơn hàng", description = "Danh sách, chi tiết, chuyển trạng thái đơn của shop")
public class SellerOrderController {

    private final SellerOrderService sellerOrderService;

    @GetMapping
    @Operation(summary = "Danh sách đơn của shop (mới nhất trước)")
    public ApiResponse<PageResponse<OrderSummaryResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Một hoặc nhiều trạng thái cách nhau dấu phẩy. Bỏ trống = tất cả")
            @RequestParam(required = false) String status,
            @Parameter(description = "Từ ngày đặt (yyyy-MM-dd), bao gồm")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Đến ngày đặt (yyyy-MM-dd), bao gồm")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(sellerOrderService.list(currentUserId(jwt), status, from, to, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết đơn (sản phẩm, khách, lịch sử trạng thái)")
    public ApiResponse<OrderDetailResponse> detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok(sellerOrderService.get(currentUserId(jwt), id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Chuyển trạng thái đơn theo bảng 3.5",
            description = "PENDING→CONFIRMED→PROCESSING→SHIPPING→DELIVERED. Huỷ (từ PENDING/CONFIRMED/PROCESSING) bắt buộc cancelReason")
    public ApiResponse<OrderDetailResponse> changeStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                         @Valid @RequestBody OrderStatusUpdateRequest request) {
        return ApiResponse.ok(sellerOrderService.changeStatus(currentUserId(jwt), id, request));
    }

    private static Long currentUserId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
