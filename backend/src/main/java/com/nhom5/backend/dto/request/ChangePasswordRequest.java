package com.nhom5.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** PUT /api/auth/change-password (api.md mục 4.1) — chỉ tài khoản có mật khẩu (provider LOCAL). */
public record ChangePasswordRequest(
		@NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
		String currentPassword,

		@NotBlank(message = "Mật khẩu mới không được để trống")
		@Size(min = 6, max = 72, message = "Mật khẩu từ 6 đến 72 ký tự")
		String newPassword,

		@NotBlank(message = "Vui lòng nhập lại mật khẩu mới")
		String confirmPassword) {
}
