package com.nhom5.backend.controller;

import com.nhom5.backend.dto.request.UpdateProfileRequest;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.AvatarResponse;
import com.nhom5.backend.dto.response.UserResponse;
import com.nhom5.backend.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Hồ sơ cá nhân (api.md mục 4.2) — mọi user đã đăng nhập. Sổ địa chỉ ở AddressController. */
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@Tag(name = "Hồ sơ", description = "Xem / sửa hồ sơ, đổi ảnh đại diện")
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    @Operation(summary = "Hồ sơ của tôi (cùng khuôn user của /auth/me)")
    public ApiResponse<UserResponse> get(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(userProfileService.get(currentUserId(jwt)));
    }

    @PutMapping
    @Operation(summary = "Sửa họ tên, số điện thoại")
    public ApiResponse<UserResponse> update(@AuthenticationPrincipal Jwt jwt,
                                            @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok("Đã cập nhật hồ sơ", userProfileService.update(currentUserId(jwt), request));
    }

    @PutMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Đổi ảnh đại diện (multipart field \"file\", JPG/PNG/WEBP ≤ 5 MB)")
    public ApiResponse<AvatarResponse> updateAvatar(@AuthenticationPrincipal Jwt jwt,
                                                    @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(userProfileService.updateAvatar(currentUserId(jwt), file));
    }

    private static Long currentUserId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
