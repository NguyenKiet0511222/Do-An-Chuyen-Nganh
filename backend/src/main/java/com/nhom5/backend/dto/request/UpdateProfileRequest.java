package com.nhom5.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** PUT /api/users/me (api.md mục 4.2). phone bỏ trống = xoá số điện thoại. Email không đổi được. */
public record UpdateProfileRequest(
        @NotBlank(message = "Họ tên không được để trống")
        @Size(min = 2, max = 100, message = "Họ tên từ 2 đến 100 ký tự")
        String fullName,

        @Pattern(regexp = "^$|^\\d{9,11}$", message = "Số điện thoại gồm 9–11 chữ số")
        String phone
) {
}
