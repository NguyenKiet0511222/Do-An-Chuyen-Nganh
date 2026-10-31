package com.nhom5.backend.dto.admin;

import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.entity.enums.UserStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 1 dòng GET /admin/shops và chi tiết GET /admin/shops/{id} (api.md mục 4.9) — kèm chủ shop + số liệu. */
public record AdminShopResponse(
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
        LocalDateTime createdAt,
        Owner owner,
        ProductCounts productCounts,
        long orderCount
) {

    public record Owner(Long id, String fullName, String email, String phone, UserStatus status) {
        static Owner from(User u) {
            return new Owner(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getStatus());
        }
    }

    public record ProductCounts(long approved, long pending, long rejected) {
    }

    public static AdminShopResponse from(Shop shop, ProductCounts productCounts, long orderCount) {
        return new AdminShopResponse(
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
                shop.getCreatedAt(),
                Owner.from(shop.getUser()),
                productCounts,
                orderCount);
    }
}
