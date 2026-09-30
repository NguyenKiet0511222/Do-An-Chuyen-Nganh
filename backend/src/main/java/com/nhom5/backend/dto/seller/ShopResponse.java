package com.nhom5.backend.dto.seller;

import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.ShopStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Thông tin shop trả cho người bán (GET/PUT /seller/shop) và admin (xác minh/khoá shop). */
public record ShopResponse(
        Long id,
        String shopName,
        String description,
        String province,
        String address,
        String phone,
        String logoUrl,
        ShopStatus status,
        BigDecimal ratingAvg,
        Integer ratingCount,
        LocalDateTime verifiedAt,
        LocalDateTime createdAt
) {

    public static ShopResponse from(Shop shop) {
        return new ShopResponse(
                shop.getId(),
                shop.getShopName(),
                shop.getDescription(),
                shop.getProvince(),
                shop.getAddress(),
                shop.getPhone(),
                shop.getLogoUrl(),
                shop.getStatus(),
                shop.getRatingAvg(),
                shop.getRatingCount(),
                shop.getVerifiedAt(),
                shop.getCreatedAt());
    }
}
