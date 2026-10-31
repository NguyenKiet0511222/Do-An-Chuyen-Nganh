package com.nhom5.backend.controller;

import com.nhom5.backend.dto.admin.AdminUserResponse;
import com.nhom5.backend.dto.admin.CreateAdminRequest;
import com.nhom5.backend.dto.admin.UserStatusRequest;
import com.nhom5.backend.dto.admin.UserTierRequest;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.UserStatus;
import com.nhom5.backend.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Quản lý người dùng (api.md mục 4.9) — chỉ ADMIN (SecurityConfig chặn /api/admin/**). */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin - Người dùng", description = "Tra cứu, khoá / mở khoá, đổi cấp tài khoản, tạo admin")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "Danh sách người dùng (lọc role, status, keyword theo tên/email/SĐT)")
    public ApiResponse<PageResponse<AdminUserResponse>> list(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(adminUserService.search(role, status, keyword, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết một người dùng")
    public ApiResponse<AdminUserResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(adminUserService.get(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Khoá / mở khoá tài khoản",
            description = "Không tự khoá chính mình. Tài khoản bị khoá nhận 403 ở mọi request kể cả khi token còn hạn")
    public ApiResponse<AdminUserResponse> changeStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                       @Valid @RequestBody UserStatusRequest request) {
        return ApiResponse.ok(adminUserService.changeStatus(Long.parseLong(jwt.getSubject()), id, request));
    }

    @PatchMapping("/{id}/tier")
    @Operation(summary = "Gán cấp tài khoản STANDARD / PREMIUM (demo tính năng Premium)")
    public ApiResponse<AdminUserResponse> changeTier(@PathVariable Long id, @Valid @RequestBody UserTierRequest request) {
        return ApiResponse.ok(adminUserService.changeTier(id, request));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo thêm tài khoản ADMIN")
    public ApiResponse<AdminUserResponse> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        return ApiResponse.ok(adminUserService.createAdmin(request));
    }
}
