package com.nhom5.backend.controller;

import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.seller.LogoResponse;
import com.nhom5.backend.dto.seller.ShopRequest;
import com.nhom5.backend.dto.seller.ShopResponse;
import com.nhom5.backend.service.SellerShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Đăng ký bán hàng + hồ sơ shop (api.md mục 4.8).
 * /register mở cho mọi user đã đăng nhập; các API còn lại cần role SELLER (SecurityConfig).
 */
@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
@Tag(name = "Seller - Shop", description = "Đăng ký bán hàng, xem / sửa thông tin shop, đổi logo")
public class SellerShopController {

    private final SellerShopService sellerShopService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Đăng ký bán hàng — tạo shop chờ admin xác minh",
            description = "User vẫn là CUSTOMER cho tới khi admin VERIFY; sau đó phải đăng nhập lại để có role SELLER")
    public ApiResponse<ShopResponse> register(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ShopRequest request) {
        return ApiResponse.ok("Đăng ký bán hàng thành công, vui lòng chờ quản trị viên xác minh",
                sellerShopService.register(currentUserId(jwt), request));
    }

    @GetMapping("/shop")
    @Operation(summary = "Thông tin shop của tôi")
    public ApiResponse<ShopResponse> getShop(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(sellerShopService.getMyShop(currentUserId(jwt)));
    }

    @PutMapping("/shop")
    @Operation(summary = "Sửa thông tin shop (tên, giới thiệu, tỉnh/thành, địa chỉ lấy hàng, SĐT)")
    public ApiResponse<ShopResponse> updateShop(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ShopRequest request) {
        return ApiResponse.ok(sellerShopService.updateMyShop(currentUserId(jwt), request));
    }

    @PutMapping(value = "/shop/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Đổi logo shop (multipart field \"file\", JPG/PNG/WEBP ≤ 5 MB)")
    public ApiResponse<LogoResponse> updateLogo(@AuthenticationPrincipal Jwt jwt, @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(sellerShopService.updateLogo(currentUserId(jwt), file));
    }

    private static Long currentUserId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
