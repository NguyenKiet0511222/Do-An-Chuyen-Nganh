package com.nhom5.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.nhom5.backend.dto.request.ChangePasswordRequest;
import com.nhom5.backend.dto.request.GoogleLoginRequest;
import com.nhom5.backend.dto.request.LoginRequest;
import com.nhom5.backend.dto.request.RegisterRequest;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.AuthResponse;
import com.nhom5.backend.dto.response.RegisterResponse;
import com.nhom5.backend.dto.response.UserResponse;
import com.nhom5.backend.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Các endpoint /api/auth/** — register/login/google mở công khai, me cần JWT (xem SecurityConfig). */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Đăng ký, đăng nhập, đăng nhập Google, thông tin tài khoản")
public class AuthController {

	private final AuthService authService;

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Đăng ký tài khoản khách hàng bằng email/mật khẩu")
	public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
		return ApiResponse.ok("Đăng ký thành công", authService.register(request));
	}

	@PostMapping("/login")
	@Operation(summary = "Đăng nhập bằng email/mật khẩu, nhận JWT")
	public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		return ApiResponse.ok(authService.login(request));
	}

	@PostMapping("/google")
	@Operation(summary = "Đăng nhập bằng Google ID token, nhận JWT (tự tạo tài khoản nếu email mới)")
	public ApiResponse<AuthResponse> google(@Valid @RequestBody GoogleLoginRequest request) {
		return ApiResponse.ok(authService.loginWithGoogle(request));
	}

	@GetMapping("/me")
	@Operation(summary = "Thông tin tài khoản đang đăng nhập (cần Bearer token)")
	public ApiResponse<UserResponse> me(@AuthenticationPrincipal Jwt jwt) {
		return ApiResponse.ok(authService.me(Long.parseLong(jwt.getSubject())));
	}

	@PutMapping("/change-password")
	@Operation(summary = "Đổi mật khẩu (cần Bearer token, chỉ tài khoản có mật khẩu)")
	public ApiResponse<Void> changePassword(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody ChangePasswordRequest request) {
		authService.changePassword(Long.parseLong(jwt.getSubject()), request);
		return ApiResponse.ok("Đã đổi mật khẩu", null);
	}
}
