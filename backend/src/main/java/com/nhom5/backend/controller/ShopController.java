package com.nhom5.backend.controller;

import com.nhom5.backend.dto.product.ShopPublicPageDto;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Trang shop công khai (api.md mục 4.4). Danh sách / tra cứu shop của admin ở AdminShopController
 * (đã gỡ GET /api/shops và /api/shops/user/{userId} cũ vì trả thẳng entity).
 */
@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
@Tag(name = "Shop API", description = "Trang gian hàng công khai")
public class ShopController {

    private final ShopService shopService;

    @GetMapping("/{id}")
    @Operation(summary = "Trang shop công khai", description = "Thông tin shop ACTIVE + sản phẩm đã duyệt của shop (phân trang)")
    public ApiResponse<ShopPublicPageDto> getShopPublicPage(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(shopService.getShopPublicPage(id, page, size));
    }
}
