package com.nhom5.backend.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

/**
 * Cấu hình Swagger UI (springdoc). Có nút "Authorize" để dán JWT khi test API cần đăng nhập.
 * Truy cập Swagger UI tại: http://localhost:8080/swagger-ui (tự chuyển sang /swagger-ui/index.html; /swagger-ui.html KHÔNG dùng được)
 */
@Configuration
public class OpenApiConfig {

	public static final String BEARER_SCHEME = "bearerAuth";

	@Value("${app.swagger.server-url:http://localhost:8080}")
	private String serverUrl;

	@Bean
	public OpenAPI openAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("Nhóm 5 - API Sàn nông sản tích hợp AI")
						.description("Sàn giao dịch thương mại nông sản nhiều người bán, tích hợp AI phân loại chất lượng nông sản.")
						.version("v1.0")
						.contact(new Contact().name("Nhóm 5")))
				.servers(List.of(new Server().url(serverUrl).description("Server Mặc định")))
				.addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
				.components(new Components().addSecuritySchemes(BEARER_SCHEME,
						new SecurityScheme()
								.name(BEARER_SCHEME)
								.type(SecurityScheme.Type.HTTP)
								.scheme("bearer")
								.bearerFormat("JWT")
								.description("Nhập accessToken lấy từ API đăng nhập (không cần tiền tố 'Bearer').")));
	}
}
