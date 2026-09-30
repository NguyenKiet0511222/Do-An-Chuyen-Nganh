package com.nhom5.backend.service;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhom5.backend.dto.request.GoogleLoginRequest;
import com.nhom5.backend.dto.request.LoginRequest;
import com.nhom5.backend.dto.request.RegisterRequest;
import com.nhom5.backend.dto.response.AuthResponse;
import com.nhom5.backend.dto.response.RegisterResponse;
import com.nhom5.backend.dto.response.UserResponse;
import com.nhom5.backend.entity.enums.AuthProvider;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.security.GoogleTokenVerifier;
import com.nhom5.backend.security.JwtService;

import lombok.RequiredArgsConstructor;

/** Nghiệp vụ đăng ký / đăng nhập / đăng nhập Google / thông tin tài khoản hiện tại. */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

	private static final String BAD_CREDENTIALS = "Email hoặc mật khẩu không đúng";

	private final UserRepository userRepository;
	private final ShopRepository shopRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final GoogleTokenVerifier googleTokenVerifier;

	/** Đăng ký bằng email/mật khẩu — luôn tạo CUSTOMER. Người bán đăng ký shop bằng API riêng (tuần 4). */
	public RegisterResponse register(RegisterRequest request) {
		if (!request.password().equals(request.confirmPassword())) {
			throw AppException.badRequest("Mật khẩu xác nhận không khớp");
		}
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmail(email)) {
			throw AppException.badRequest("Email đã được đăng ký");
		}

		User user = new User();
		user.setFullName(request.fullName().trim());
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(request.password()));
		user.setProvider(AuthProvider.LOCAL);
		user.setRole(Role.CUSTOMER);
		return new RegisterResponse(userRepository.save(user).getId());
	}

	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(normalizeEmail(request.email()))
				.orElseThrow(() -> AppException.unauthorized(BAD_CREDENTIALS));
		if (user.getPasswordHash() == null) {
			throw AppException.unauthorized("Tài khoản này đăng nhập bằng Google, vui lòng dùng nút Google");
		}
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			throw AppException.unauthorized(BAD_CREDENTIALS);
		}
		ensureActive(user);
		return buildAuthResponse(user);
	}

	/** Email chưa có → tạo tài khoản GOOGLE; email đã có (kể cả LOCAL) → đăng nhập và liên kết Google id. */
	public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
		Jwt idToken = googleTokenVerifier.verify(request.idToken());
		String email = normalizeEmail(idToken.getClaimAsString("email"));
		if (email == null || !Boolean.TRUE.equals(idToken.getClaimAsBoolean("email_verified"))) {
			throw AppException.unauthorized("Tài khoản Google chưa xác minh email");
		}

		User user = userRepository.findByEmail(email).orElseGet(() -> createGoogleUser(idToken, email));
		if (user.getProviderId() == null) {
			user.setProviderId(idToken.getSubject());
		}
		if (user.getAvatarUrl() == null) {
			user.setAvatarUrl(idToken.getClaimAsString("picture"));
		}
		ensureActive(user);
		return buildAuthResponse(user);
	}

	@Transactional(readOnly = true)
	public UserResponse me(Long userId) {
		return userRepository.findById(userId)
				.map(this::toUserResponse)
				.orElseThrow(() -> AppException.unauthorized("Tài khoản không còn tồn tại"));
	}

	private UserResponse toUserResponse(User user) {
		return UserResponse.from(user, shopRepository.findByUserId(user.getId()).orElse(null));
	}

	private User createGoogleUser(Jwt idToken, String email) {
		User user = new User();
		String name = idToken.getClaimAsString("name");
		user.setFullName(name == null || name.isBlank() ? email : name);
		user.setEmail(email);
		user.setProvider(AuthProvider.GOOGLE);
		user.setProviderId(idToken.getSubject());
		user.setAvatarUrl(idToken.getClaimAsString("picture"));
		user.setRole(Role.CUSTOMER);
		return userRepository.save(user);
	}

	private AuthResponse buildAuthResponse(User user) {
		return AuthResponse.bearer(jwtService.generateToken(user), jwtService.expiresInSeconds(),
				toUserResponse(user));
	}

	private static void ensureActive(User user) {
		if (!user.isActive()) {
			throw AppException.forbidden("Tài khoản đã bị khoá, liên hệ quản trị viên");
		}
	}

	private static String normalizeEmail(String email) {
		return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
	}
}
