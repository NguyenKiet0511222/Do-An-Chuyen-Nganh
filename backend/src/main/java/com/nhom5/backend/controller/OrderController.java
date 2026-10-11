package com.nhom5.backend.controller;

import com.nhom5.backend.dto.order.CheckoutRequest;
import com.nhom5.backend.dto.order.CheckoutResponse;
import com.nhom5.backend.dto.order.OrderCancelRequest;
import com.nhom5.backend.dto.order.OrderDetailResponse;
import com.nhom5.backend.dto.order.OrderSummaryResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.service.CustomerOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Đặt hàng và đơn của khách đang đăng nhập (api.md mục 4.6) — chỉ thấy đơn của chính mình. */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Đơn hàng (khách)", description = "Checkout từ giỏ, xem và huỷ đơn của tôi")
public class OrderController {

    private final CustomerOrderService customerOrderService;

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo đơn từ giỏ (tự tách mỗi shop một đơn)",
            description = "cartItemIds bỏ trống = toàn bộ giỏ. Thiếu hàng -> 409 kèm errors[] từng sản phẩm, không tạo đơn nào.")
    public ApiResponse<CheckoutResponse> checkout(@AuthenticationPrincipal Jwt jwt,
                                                  @Valid @RequestBody CheckoutRequest request) {
        return ApiResponse.ok(customerOrderService.checkout(currentUserId(jwt), request));
    }

    @GetMapping
    @Operation(summary = "Đơn của tôi (mới nhất trước)")
    public ApiResponse<PageResponse<OrderSummaryResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Một hoặc nhiều trạng thái cách nhau dấu phẩy. Bỏ trống = tất cả")
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(customerOrderService.list(currentUserId(jwt), status, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết đơn của tôi (sản phẩm, shop, lịch sử trạng thái)")
    public ApiResponse<OrderDetailResponse> detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok(customerOrderService.get(currentUserId(jwt), id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Huỷ đơn (chỉ khi PENDING / CONFIRMED), bắt buộc cancelReason; hoàn tồn kho")
    public ApiResponse<OrderDetailResponse> cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                   @Valid @RequestBody OrderCancelRequest request) {
        return ApiResponse.ok(customerOrderService.cancel(currentUserId(jwt), id, request));
    }

    private static Long currentUserId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
