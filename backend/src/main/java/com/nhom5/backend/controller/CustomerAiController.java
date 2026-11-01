package com.nhom5.backend.controller;

import com.nhom5.backend.dto.ai.QuickCheckResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.service.CustomerAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Kiểm tra nhanh chất lượng nông sản cho khách (api.md mục 4.7) — đã đăng nhập + tài khoản PREMIUM
 * (kiểm tra cấp tài khoản trong CustomerAiService, STANDARD -> 403).
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI - Khách hàng (Premium)", description = "Kiểm tra nhanh 1 ảnh nông sản, xem lịch sử kiểm tra")
public class CustomerAiController {

    private final CustomerAiService customerAiService;

    @PostMapping(value = "/classify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Kiểm tra 1 ảnh (field \"file\" hoặc \"image\", JPG/PNG/WEBP ≤ 5 MB)",
            description = "Tối đa 20 lượt / ngày (429). AI tắt / lỗi -> 503. Tài khoản STANDARD -> 403")
    public ApiResponse<QuickCheckResponse> classify(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return ApiResponse.ok(customerAiService.classify(currentUserId(jwt), file != null ? file : image));
    }

    @GetMapping("/history")
    @Operation(summary = "Lịch sử kiểm tra của tôi (mới nhất trước)")
    public ApiResponse<PageResponse<QuickCheckResponse>> history(@AuthenticationPrincipal Jwt jwt,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(customerAiService.history(currentUserId(jwt), page, size));
    }

    @GetMapping("/history/{id}")
    @Operation(summary = "Chi tiết 1 lượt kiểm tra (chỉ của mình)")
    public ApiResponse<QuickCheckResponse> historyDetail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok(customerAiService.historyDetail(currentUserId(jwt), id));
    }

    private static Long currentUserId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
