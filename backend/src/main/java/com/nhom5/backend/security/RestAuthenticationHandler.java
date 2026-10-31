package com.nhom5.backend.security;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;

import com.nhom5.backend.exception.AppException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Chuyển lỗi 401 (chưa đăng nhập / token sai) và 403 (không đủ quyền) phát sinh ở tầng filter
 * sang GlobalExceptionHandler, để body luôn là ApiResponse JSON thay vì rỗng.
 */
@Component
public class RestAuthenticationHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

	private final HandlerExceptionResolver resolver;

	public RestAuthenticationHandler(@Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
		this.resolver = resolver;
	}

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException authException) {
		resolver.resolveException(request, response, null, authException);
	}

	@Override
	public void handle(HttpServletRequest request, HttpServletResponse response,
			AccessDeniedException accessDeniedException) {
		resolver.resolveException(request, response, null, accessDeniedException);
	}

	/** Trả lỗi nghiệp vụ từ tầng filter (vd tài khoản bị khoá) theo khuôn ApiResponse của GlobalExceptionHandler. */
	public void reject(HttpServletRequest request, HttpServletResponse response, AppException exception) {
		resolver.resolveException(request, response, null, exception);
	}
}
