package com.nongsan.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Cấu hình an ninh tối thiểu để GET /api/categories/** và GET /api/shops/{id}
 * hoạt động công khai đúng ma trận api.md mục 1.5.
 *
 * LƯU Ý: đây mới là phần public-path liên quan tới 2 API trong phạm vi yêu cầu này.
 * Khi code module Auth (mục 4.1) cần bổ sung:
 *  - JwtAuthenticationFilter (đọc Authorization: Bearer, set SecurityContext)
 *  - Đầy đủ các rule còn lại trong ma trận 1.5 (/api/users/me/**, /api/seller/**, /api/admin/**...)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_GET_PATTERNS = {
            "/api/auth/**",
            "/api/categories/**",
            "/api/products/**",
            "/api/shops/*",
            "/uploads/**",
            "/swagger-ui/**",
            "/v3/api-docs/**"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_GET_PATTERNS).permitAll()
                        // TODO: bổ sung .requestMatchers("/api/seller/**").hasRole("SELLER")
                        // TODO: bổ sung .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                );
        return http.build();
    }
}
