package com.nongsan.controller;

import com.nongsan.dto.common.ApiResponse;
import com.nongsan.dto.shop.ShopPageDto;
import com.nongsan.service.ShopService;
import com.nongsan.util.PageableUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * api.md mục 4.4 - Trang shop công khai.
 * Quyền: 🌐 công khai (xem ma trận mục 1.5: GET /api/shops/{id}).
 */
@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    /**
     * GET /api/shops/{id}
     * Trả về thông tin shop công khai + danh sách sản phẩm APPROVED của shop (phân trang).
     * Query: page (mặc định 0), size (mặc định 12, tối đa 100), sort (ví dụ "soldCount,desc").
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShopPageDto>> getShopPage(
            @PathVariable Long id,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort
    ) {
        Pageable pageable = PageableUtils.of(page, size, sort);
        ShopPageDto result = shopService.getPublicShopPage(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
