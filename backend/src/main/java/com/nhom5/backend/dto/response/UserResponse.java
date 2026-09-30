package com.nhom5.backend.dto.response;

import java.time.LocalDateTime;

import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;

/**
 * Thông tin người dùng trả ra ngoài (login, google, /auth/me) — không bao giờ lộ password_hash.
 * shopId / shopStatus = null nếu chưa đăng ký bán hàng; frontend dựa vào đây để biết shop đang chờ xác minh hay đã hoạt động.
 */
public record UserResponse(
		Long id,
		String fullName,
		String email,
		String phone,
		String role,
		String accountTier,
		String provider,
		String avatarUrl,
		boolean active,
		LocalDateTime createdAt,
		Long shopId,
		String shopStatus) {

	public static UserResponse from(User user, Shop shop) {
		return new UserResponse(
				user.getId(),
				user.getFullName(),
				user.getEmail(),
				user.getPhone(),
				user.getRole().name(),
				user.getAccountTier() == null ? null : user.getAccountTier().name(),
				user.getProvider().name(),
				user.getAvatarUrl(),
				user.isActive(),
				user.getCreatedAt(),
				shop == null ? null : shop.getId(),
				shop == null ? null : shop.getStatus().name());
	}
}
