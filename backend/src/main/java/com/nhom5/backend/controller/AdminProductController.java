package com.nhom5.backend.controller;

import com.nhom5.backend.dto.admin.AdminProductDetailResponse;
import com.nhom5.backend.dto.admin.AdminProductResponse;
import com.nhom5.backend.dto.admin.ProductReviewBulkRequest;
import com.nhom5.backend.dto.admin.ProductReviewBulkResponse;
import com.nhom5.backend.dto.admin.ProductReviewRequest;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.service.AdminProductService;
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

/** Admin duyệt sản phẩm (api.md mục 4.9). Chỉ ADMIN (SecurityConfig: /api/admin/**). */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@Tag(name = "Admin - Sản phẩm", description = "Danh sách mọi trạng thái, chi tiết kèm lịch sử duyệt, duyệt / từ chối / ẩn")
public class AdminProductController {

    private final AdminProductService adminProductService;

    @GetMapping
    @Operation(summary = "Danh sách sản phẩm mọi shop, mọi trạng thái (mới nhất trước)")
    public ApiResponse<PageResponse<AdminProductResponse>> list(
            @Parameter(description = "Một hoặc nhiều trạng thái cách nhau dấu phẩy. Bỏ trống = tất cả")
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long shopId,
            @RequestParam(required = false) AiLabel aiLabel,
            @Parameter(description = "Từ ngày tạo (yyyy-MM-dd), bao gồm")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Đến ngày tạo (yyyy-MM-dd), bao gồm")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(adminProductService.search(status, keyword, categoryId, shopId, aiLabel, from, to,
                page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm: ảnh + AI từng ảnh, shop (số SP đã duyệt / từ chối), lịch sử duyệt")
    public ApiResponse<AdminProductDetailResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(adminProductService.get(id));
    }

    @PatchMapping("/{id}/review")
    @Operation(summary = "Duyệt / từ chối / yêu cầu bổ sung / ẩn / bỏ ẩn 1 sản phẩm",
            description = "APPROVE, REJECT, NEED_INFO chỉ khi PENDING (REJECT, NEED_INFO bắt buộc reason). "
                    + "HIDE chỉ khi APPROVED; UNHIDE chỉ khi HIDDEN. Sai trạng thái -> 409.")
    public ApiResponse<AdminProductDetailResponse> review(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                          @Valid @RequestBody ProductReviewRequest request) {
        return ApiResponse.ok(adminProductService.review(Long.parseLong(jwt.getSubject()), id, request));
    }

    @PatchMapping("/review-bulk")
    @Operation(summary = "Duyệt / từ chối nhiều sản phẩm PENDING",
            description = "Xử lý từng sản phẩm độc lập; trả về số thành công và danh sách lỗi theo productId")
    public ApiResponse<ProductReviewBulkResponse> reviewBulk(@AuthenticationPrincipal Jwt jwt,
                                                             @Valid @RequestBody ProductReviewBulkRequest request) {
        return ApiResponse.ok(adminProductService.reviewBulk(Long.parseLong(jwt.getSubject()), request));
    }
}
