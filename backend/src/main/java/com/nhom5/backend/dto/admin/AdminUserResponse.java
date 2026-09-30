package com.nhom5.backend.dto.admin;

import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AccountTier;
import com.nhom5.backend.entity.enums.AuthProvider;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.entity.enums.UserStatus;

import java.time.LocalDateTime;

/** 1 dòng của GET /admin/users (api.md mục 4.9) — không bao giờ chứa passwordHash. */
public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role,
        UserStatus status,
        AccountTier accountTier,
        AuthProvider provider,
        LocalDateTime createdAt,
        ShopBrief shop
) {

    public record ShopBrief(Long id, String shopName, ShopStatus status) {
    }

    public static AdminUserResponse from(User user, Shop shop) {
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getAccountTier(),
                user.getProvider(),
                user.getCreatedAt(),
                shop == null ? null : new ShopBrief(shop.getId(), shop.getShopName(), shop.getStatus()));
    }
}
