package com.nhom5.backend.exception;

import java.util.List;

import org.springframework.http.HttpStatus;

import com.nhom5.backend.dto.response.FieldError;

/**
 * Lỗi nghiệp vụ có mã HTTP đi kèm. Ném từ service, GlobalExceptionHandler sẽ đổi thành ApiResponse.
 * Ví dụ: {@code throw AppException.notFound("Không tìm thấy sản phẩm #" + id);}
 * Có thể kèm danh sách {@code errors} (api.md mục 4.6: 409 "Một số sản phẩm không đủ hàng" liệt kê từng sản phẩm).
 */
public class AppException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private final HttpStatus status;
	private final transient List<FieldError> errors;

	public AppException(HttpStatus status, String message) {
		this(status, message, null);
	}

	public AppException(HttpStatus status, String message, List<FieldError> errors) {
		super(message);
		this.status = status;
		this.errors = errors == null || errors.isEmpty() ? null : List.copyOf(errors);
	}

	public HttpStatus getStatus() {
		return status;
	}

	/** Danh sách lỗi chi tiết (null nếu không có). */
	public List<FieldError> getErrors() {
		return errors;
	}

	public static AppException badRequest(String message) {
		return new AppException(HttpStatus.BAD_REQUEST, message);
	}

	public static AppException unauthorized(String message) {
		return new AppException(HttpStatus.UNAUTHORIZED, message);
	}

	public static AppException forbidden(String message) {
		return new AppException(HttpStatus.FORBIDDEN, message);
	}

	public static AppException notFound(String message) {
		return new AppException(HttpStatus.NOT_FOUND, message);
	}

	public static AppException conflict(String message) {
		return new AppException(HttpStatus.CONFLICT, message);
	}

	/** 409 kèm danh sách lỗi từng mục, ví dụ từng sản phẩm thiếu hàng khi checkout. */
	public static AppException conflict(String message, List<FieldError> errors) {
		return new AppException(HttpStatus.CONFLICT, message, errors);
	}
}
