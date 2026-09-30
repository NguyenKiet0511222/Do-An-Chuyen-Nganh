package com.nhom5.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nhom5.backend.security.RestAuthenticationHandler;

import lombok.RequiredArgsConstructor;

/**
 * Cấu hình bảo mật: API stateless, xác thực bằng JWT Bearer, phân quyền theo prefix URL.
 * Vai trò: CUSTOMER, SELLER, ADMIN — đọc từ claim "role" trong JWT (xem JwtService).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // cho phép @PreAuthorize("hasRole('ADMIN')") ở service/controller
@RequiredArgsConstructor
public class SecurityConfig {

	private final AppProperties appProperties;
	private final RestAuthenticationHandler restAuthenticationHandler;

	/** Đường dẫn mở công khai, không cần token. /api/auth/me KHÔNG nằm trong này. */
	private static final String[] PUBLIC_ENDPOINTS = {
			"/api/health",
			"/api/auth/register",
			"/api/auth/login",
			"/api/auth/google",
			"/api-docs/**",
			"/v3/api-docs/**",
			"/swagger-ui",
			"/swagger-ui/**",
			"/swagger-ui.html"
	};

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable()) // API stateless dùng JWT, không cần CSRF
				.cors(Customizer.withDefaults())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(PUBLIC_ENDPOINTS).permitAll()
						// Khách vãng lai xem được sản phẩm & danh mục
						.requestMatchers(HttpMethod.GET, "/api/products/**", "/api/categories/**").permitAll()
						// Ảnh upload (sản phẩm, logo) hiển thị công khai
						.requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						// Đăng ký bán hàng: user còn là CUSTOMER cho tới khi admin xác minh shop
						.requestMatchers(HttpMethod.POST, "/api/seller/register").authenticated()
						.requestMatchers("/api/seller/**").hasAnyRole("SELLER", "ADMIN")
						.anyRequest().authenticated())
				// 401 / 403 trả JSON dạng ApiResponse thay vì body rỗng
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint(restAuthenticationHandler)
						.accessDeniedHandler(restAuthenticationHandler))
				.oauth2ResourceServer(oauth2 -> oauth2
						.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
						.authenticationEntryPoint(restAuthenticationHandler)
						.accessDeniedHandler(restAuthenticationHandler));
		return http.build();
	}

	/** Đọc claim "role": "ADMIN" trong JWT thành authority ROLE_ADMIN để dùng với hasRole(). */
	private JwtAuthenticationConverter jwtAuthenticationConverter() {
		JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
		authoritiesConverter.setAuthoritiesClaimName("role");
		authoritiesConverter.setAuthorityPrefix("ROLE_");

		JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
		converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
		return converter;
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(appProperties.cors().allowedOrigins());
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
