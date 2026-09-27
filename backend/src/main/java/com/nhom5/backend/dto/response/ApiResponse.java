package com.nhom5.backend.dto.response;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Khuôn JSON chung cho MỌI response của API theo mục 1.2 api.md:
 * <pre>{ "success": true, "message": "OK", "data": {...} }</pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
		boolean success,
		String message,
		T data,
		List<FieldError> errors
) {

	public ApiResponse(boolean success, String message, T data) {
		this(success, message, data, null);
	}

	public static <T> ApiResponse<T> ok(T data) {
		return new ApiResponse<>(true, "OK", data, null);
	}

	public static <T> ApiResponse<T> ok(String message, T data) {
		return new ApiResponse<>(true, message, data, null);
	}

	public static <T> ApiResponse<T> success(T data) {
		return new ApiResponse<>(true, "OK", data, null);
	}

	public static <T> ApiResponse<T> success(String message, T data) {
		return new ApiResponse<>(true, message, data, null);
	}

	public static <T> ApiResponse<T> error(String message) {
		return new ApiResponse<>(false, message, null, null);
	}

	public static <T> ApiResponse<T> error(String message, T data) {
		return new ApiResponse<>(false, message, data, null);
	}

	public static <T> ApiResponse<T> validationErrors(String message, List<FieldError> errors) {
		return new ApiResponse<>(false, message, null, errors);
	}
}
