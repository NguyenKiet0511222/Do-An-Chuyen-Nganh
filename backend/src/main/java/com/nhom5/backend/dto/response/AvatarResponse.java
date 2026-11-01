package com.nhom5.backend.dto.response;

/** Kết quả PUT /users/me/avatar — URL tương đối "/uploads/avatars/...". */
public record AvatarResponse(String avatarUrl) {
}
