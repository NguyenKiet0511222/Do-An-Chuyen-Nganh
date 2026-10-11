package com.nhom5.backend.controller;

import com.nhom5.backend.dto.request.AddressRequest;
import com.nhom5.backend.dto.response.AddressResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Sổ địa chỉ của tôi (api.md mục 4.2). Thay cho /api/addresses/user/{userId} cũ — ai đăng nhập cũng xem được địa chỉ người khác.
 * Mọi thao tác chỉ trên địa chỉ của chính mình; địa chỉ người khác trả 404.
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
        return ApiResponse.ok(addressService.listMine(userId(jwt)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết một địa chỉ của tôi")
    public ApiResponse<AddressResponse> detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok(addressService.getMine(userId(jwt), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Thêm địa chỉ (địa chỉ đầu tiên tự thành mặc định)")
    public ApiResponse<AddressResponse> create(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody AddressRequest request) {
        return ApiResponse.ok(addressService.create(userId(jwt), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Sửa địa chỉ của tôi")
    public ApiResponse<AddressResponse> update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                               @Valid @RequestBody AddressRequest request) {
        return ApiResponse.ok(addressService.update(userId(jwt), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá địa chỉ (xoá địa chỉ mặc định thì địa chỉ cũ nhất còn lại thành mặc định)")
    public ApiResponse<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        addressService.delete(userId(jwt), id);
        return ApiResponse.ok("Đã xoá địa chỉ", null);
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Đặt làm địa chỉ mặc định")
    public ApiResponse<AddressResponse> setDefault(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok(addressService.setDefault(userId(jwt), id));
    }

    private static Long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
