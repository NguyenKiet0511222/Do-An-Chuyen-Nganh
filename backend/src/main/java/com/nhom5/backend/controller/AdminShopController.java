package com.nhom5.backend.controller;

import com.nhom5.backend.dto.admin.ShopStatusRequest;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.seller.ShopResponse;
import com.nhom5.backend.service.AdminShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Quản lý shop của admin (api.md mục 4.9). Danh sách / chi tiết shop làm ở tuần 6. */
@RestController
@RequestMapping("/api/admin/shops")
@RequiredArgsConstructor
@Tag(name = "Admin - Shop", description = "Xác minh, khoá, mở khoá shop")
public class AdminShopController {

    private final AdminShopService adminShopService;

    @PatchMapping("/{id}/status")
    @Operation(summary = "Xác minh / khoá / mở khoá shop",
            description = "VERIFY: shop ACTIVE + chủ shop thành SELLER (phải đăng nhập lại để nhận quyền mới)")
    public ApiResponse<ShopResponse> changeStatus(@PathVariable Long id, @Valid @RequestBody ShopStatusRequest request) {
        return ApiResponse.ok(adminShopService.changeStatus(id, request));
    }
}
