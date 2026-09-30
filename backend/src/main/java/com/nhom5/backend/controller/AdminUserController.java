package com.nhom5.backend.controller;

import com.nhom5.backend.dto.admin.AdminUserResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.UserStatus;
import com.nhom5.backend.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Quản lý người dùng (api.md mục 4.9) — chỉ ADMIN (SecurityConfig chặn /api/admin/**). */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin - Người dùng", description = "Tra cứu tài khoản khách hàng / người bán / admin")
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
}
