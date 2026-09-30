package com.nhom5.backend.controller;

import com.nhom5.backend.dto.response.AddressResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Sổ địa chỉ của tôi (api.md mục 4.2). Thay cho /api/addresses/user/{userId} cũ — ai đăng nhập cũng xem được địa chỉ người khác.
 * Thêm / sửa / xoá / đặt mặc định làm cùng luồng checkout (tuần 5).
 */
@RestController
@RequestMapping("/api/users/me/addresses")
@RequiredArgsConstructor
@Tag(name = "Sổ địa chỉ", description = "Địa chỉ giao hàng của người đang đăng nhập")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    @Operation(summary = "Danh sách địa chỉ của tôi (mặc định lên đầu)")
    public ApiResponse<List<AddressResponse>> list(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(addressService.listMine(Long.parseLong(jwt.getSubject())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết một địa chỉ của tôi")
    public ApiResponse<AddressResponse> detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok(addressService.getMine(Long.parseLong(jwt.getSubject()), id));
    }
}
