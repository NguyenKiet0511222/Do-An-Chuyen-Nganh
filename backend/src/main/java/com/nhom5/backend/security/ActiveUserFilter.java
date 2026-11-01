package com.nhom5.backend.security;

import java.io.IOException;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import com.nhom5.backend.entity.User;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Chặn tài khoản đã bị admin khoá ngay ở request kế tiếp, không chờ JWT hết hạn (api.md mục 3.1):
 * LOCKED -> 403, user không còn tồn tại -> 401. Chỉ chạy khi request có JWT hợp lệ (1 truy vấn theo khoá chính).
 * Không đánh dấu @Component để Spring Boot không tự đăng ký thêm 1 lần ngoài chuỗi security — tạo trong SecurityConfig.
 */
public class ActiveUserFilter extends OncePerRequestFilter {

	private final UserRepository userRepository;
	private final RestAuthenticationHandler restAuthenticationHandler;

	public ActiveUserFilter(UserRepository userRepository, RestAuthenticationHandler restAuthenticationHandler) {
		this.userRepository = userRepository;
		this.restAuthenticationHandler = restAuthenticationHandler;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth instanceof JwtAuthenticationToken jwtAuth) {
			User user = parseUserId(jwtAuth.getToken().getSubject())
					.flatMap(userRepository::findById)
					.orElse(null);
			if (user == null) {
				reject(request, response, AppException.unauthorized("Tài khoản không còn tồn tại, vui lòng đăng nhập lại"));
				return;
			}
			if (!user.isActive()) {
				reject(request, response, AppException.forbidden("Tài khoản đã bị khoá, liên hệ quản trị viên"));
				return;
			}
		}
		chain.doFilter(request, response);
	}

	private void reject(HttpServletRequest request, HttpServletResponse response, AppException exception) {
		SecurityContextHolder.clearContext();
		restAuthenticationHandler.reject(request, response, exception);
	}

	private static Optional<Long> parseUserId(String subject) {
		try {
			return Optional.of(Long.parseLong(subject));
		} catch (NumberFormatException e) {
			return Optional.empty();
		}
	}
}
