package com.nhom5.backend.controller;

import com.nhom5.backend.dto.admin.AdminShopResponse;
import com.nhom5.backend.dto.admin.ShopStatusRequest;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.dto.seller.ShopResponse;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.service.AdminShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Quản lý shop của admin (api.md mục 4.9). */
@RestController
@RequestMapping("/api/admin/shops")
@RequiredArgsConstructor
@Tag(name = "Admin - Shop", description = "Danh sách, chi tiết, xác minh, khoá, mở khoá shop")
public class AdminShopController {

    private final AdminShopService adminShopService;

    @GetMapping
    @Operation(summary = "Danh sách shop (lọc status, keyword theo tên shop / email chủ shop, province)",
            description = "Kèm chủ shop, productCounts { approved, pending, rejected }, orderCount")
    public ApiResponse<PageResponse<AdminShopResponse>> list(
            @RequestParam(required = false) ShopStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String province,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(adminShopService.search(status, keyword, province, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết shop + chủ shop")
    public ApiResponse<AdminShopResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(adminShopService.get(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Xác minh / khoá / mở khoá shop",
            description = "VERIFY: shop ACTIVE + chủ shop thành SELLER (phải đăng nhập lại để nhận quyền mới)")
    public ApiResponse<ShopResponse> changeStatus(@PathVariable Long id, @Valid @RequestBody ShopStatusRequest request) {
        return ApiResponse.ok(adminShopService.changeStatus(id, request));
    }
}
