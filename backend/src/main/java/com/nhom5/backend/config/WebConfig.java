package com.nhom5.backend.config;

import com.nhom5.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Phục vụ ảnh đã upload tại GET /uploads/** (công khai, xem SecurityConfig) — api.md mục 6. */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final FileStorageService fileStorageService;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = fileStorageService.getRoot().toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location.endsWith("/") ? location : location + "/");
    }
}
