package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.repository.ShopRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
@Tag(name = "Shop API", description = "Quản lý và tra cứu thông tin cửa hàng / gian hàng")
public class ShopController {
    private final ShopRepository shopRepository;
    private final com.nhom5.backend.service.ShopService shopService;
    @GetMapping
    @Operation(summary = "Tìm kiếm danh sách cửa hàng", description = "Lọc cửa hàng theo trạng thái, tỉnh thành, từ khóa tên shop hoặc email")
    public ResponseEntity<Page<Shop>> getShops(
            @RequestParam(required = false) ShopStatus status,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Shop> shops = shopRepository.search(status, province, keyword, PageRequest.of(page, size));
        return ResponseEntity.ok(shops);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Trang shop công khai", description = "Lấy thông tin chi tiết cửa hàng + sản phẩm của shop (phân trang)")
    public ResponseEntity<com.nhom5.backend.dto.product.ShopPublicPageDto> getShopPublicPage(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(shopService.getShopPublicPage(id, page, size));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lấy cửa hàng theo User ID", description = "Tìm thông tin shop gắn với tài khoản người dùng")
    public ResponseEntity<Shop> getShopByUserId(@PathVariable Long userId) {
        return shopRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
