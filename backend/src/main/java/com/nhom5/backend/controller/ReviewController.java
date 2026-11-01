package com.nhom5.backend.controller;

import com.nhom5.backend.dto.product.ReviewRequest;
import com.nhom5.backend.dto.product.ReviewResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Đánh giá sản phẩm (api.md mục 3.6, 4.4): GET công khai, POST cần đăng nhập (SecurityConfig). */
@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
@Tag(name = "Đánh giá sản phẩm", description = "Xem đánh giá (công khai), gửi đánh giá sau khi nhận hàng")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    @Operation(summary = "Đánh giá của sản phẩm (mới nhất trước)")
    public ApiResponse<PageResponse<ReviewResponse>> list(@PathVariable Long productId,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(reviewService.list(productId, page, size));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Gửi đánh giá", description = "Chỉ khi đơn của mình đã DELIVERED và có sản phẩm này; mỗi (sản phẩm, đơn) 1 lần")
    public ApiResponse<ReviewResponse> create(@AuthenticationPrincipal Jwt jwt, @PathVariable Long productId,
                                              @Valid @RequestBody ReviewRequest request) {
        return ApiResponse.ok("Cảm ơn bạn đã đánh giá",
                reviewService.create(Long.parseLong(jwt.getSubject()), productId, request));
    }
}
