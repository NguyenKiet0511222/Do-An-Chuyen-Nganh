package com.nhom5.backend.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình riêng của hệ thống, map từ prefix "app.*" trong application.properties.
 * Cần thêm cấu hình mới thì thêm field ở đây thay vì rải @Value khắp nơi.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Ai ai, Cors cors, Google google, Admin admin, Upload upload) {

	/** Cấu hình JWT do backend tự phát hành (HS256). */
	public record Jwt(String secret, long expirationMinutes) {
	}

	/** Cấu hình gọi sang AI service (Python FastAPI). */
	public record Ai(String baseUrl, double autoAcceptThreshold) {
	}

	/** Danh sách origin frontend được phép gọi API. */
	public record Cors(List<String> allowedOrigins) {
	}

	/** OAuth Client ID trên Google Cloud Console — dùng để xác minh ID token khi đăng nhập Google. */
	public record Google(String clientId) {
	}

	/** Tài khoản ADMIN được tạo tự động khi khởi động nếu hệ thống chưa có ADMIN nào. */
	public record Admin(String email, String password, String fullName) {
	}

	/** Thư mục lưu file upload (ảnh sản phẩm, logo...), phục vụ công khai tại /uploads/** (api.md mục 6). */
	public record Upload(String dir) {
	}
}
