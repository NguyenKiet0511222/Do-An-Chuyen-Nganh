package com.nhom5.backend.controller;

import com.nhom5.backend.dto.admin.AdminAiClassifyResponse;
import com.nhom5.backend.dto.admin.AdminAiResultResponse;
import com.nhom5.backend.dto.admin.AiAcceptBulkRequest;
import com.nhom5.backend.dto.admin.AiAcceptBulkResponse;
import com.nhom5.backend.dto.admin.AiReviewRequest;
import com.nhom5.backend.dto.admin.AiSettingsRequest;
import com.nhom5.backend.dto.admin.AiSettingsResponse;
import com.nhom5.backend.dto.admin.AiStatisticsResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.service.AdminAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

/** Admin kiểm định AI (docs/1910.md mục 7.2). Chỉ ADMIN (SecurityConfig: /api/admin/**). */
@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
@Tag(name = "Admin - Kiểm định AI", description = "Hàng chờ kiểm định nhãn AI của ảnh sản phẩm, thử mô hình, ngưỡng tin cậy, thống kê")
public class AdminAiController {

    private final AdminAiService adminAiService;

    @GetMapping("/results")
    @Operation(summary = "Hàng chờ / tra cứu kết quả AI của ảnh sản phẩm",
            description = "Ảnh PENDING_REVIEW chỉ hiện khi sản phẩm đã gửi duyệt (PENDING / APPROVED / HIDDEN); "
                    + "kết quả đã kiểm định lọc xem được ở mọi trạng thái sản phẩm")
    public ApiResponse<PageResponse<AdminAiResultResponse>> list(
            @Parameter(description = "Một hoặc nhiều trạng thái kiểm định cách nhau dấu phẩy. Mặc định PENDING_REVIEW")
            @RequestParam(required = false) String reviewStatus,
            @Parameter(description = "Nhãn hiển thị (finalLabel ?? label)")
            @RequestParam(required = false) AiLabel label,
            @RequestParam(required = false) Long shopId,
            @Parameter(description = "Loại nông sản AI nhận ra, ví dụ mango")
            @RequestParam(required = false) String produce,
            @Parameter(description = "Từ ngày tạo (yyyy-MM-dd), bao gồm")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Đến ngày tạo (yyyy-MM-dd), bao gồm")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "oldest (mặc định, chờ lâu nhất trước) | newest")
            @RequestParam(defaultValue = "oldest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(adminAiService.list(reviewStatus, label, shopId, produce, from, to, sort, page, size));
    }

    @GetMapping("/results/{id}")
    @Operation(summary = "Chi tiết 1 kết quả AI (kèm sản phẩm, shop, người kiểm định)")
    public ApiResponse<AdminAiResultResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(adminAiService.get(id));
    }

    @PatchMapping("/results/{id}/review")
    @Operation(summary = "Kiểm định 1 ảnh: chấp nhận / sửa nhãn / yêu cầu chụp lại",
            description = "Chỉ ảnh PENDING_REVIEW hoặc AUTO_ACCEPTED (đã kiểm định -> 409). ACCEPT ảnh UNCERTAIN -> 400. "
                    + "CORRECT bắt buộc finalLabel FRESH | ROTTEN (trùng nhãn AI = ACCEPT). RETAKE bắt buộc note; "
                    + "sản phẩm PENDING -> NEED_INFO, trạng thái khác chỉ đánh dấu ảnh")
    public ApiResponse<AdminAiResultResponse> review(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                     @Valid @RequestBody AiReviewRequest request) {
        return ApiResponse.ok(adminAiService.review(currentUserId(jwt), id, request));
    }

    @PatchMapping("/results/accept-bulk")
    @Operation(summary = "Chấp nhận mọi ảnh trong hàng chờ có nhãn FRESH và độ tin cậy ≥ minConfidence (0.5–1)")
    public ApiResponse<AiAcceptBulkResponse> acceptBulk(@AuthenticationPrincipal Jwt jwt,
                                                        @Valid @RequestBody AiAcceptBulkRequest request) {
        return ApiResponse.ok(adminAiService.acceptBulk(currentUserId(jwt), request));
    }

    @PostMapping(value = "/classify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Thử mô hình: gửi 1 ảnh (field \"file\" hoặc \"image\", JPG/PNG/WEBP ≤ 5 MB), không lưu",
            description = "Trả nhãn, loại nông sản, độ tin cậy và 3 lớp điểm cao nhất. AI tắt / lỗi -> 503")
    public ApiResponse<AdminAiClassifyResponse> classify(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return ApiResponse.ok(adminAiService.classify(file != null ? file : image));
    }

    @GetMapping("/settings")
    @Operation(summary = "Ngưỡng tin cậy đang áp dụng + phiên bản model + AI có đang chạy không")
    public ApiResponse<AiSettingsResponse> settings() {
        return ApiResponse.ok(adminAiService.getSettings());
    }

    @PutMapping("/settings")
    @Operation(summary = "Đổi ngưỡng tin cậy (0 < reviewThreshold < autoAcceptThreshold ≤ 1)",
            description = "Áp cho ảnh tải lên sau đó, không gắn lại nhãn ảnh cũ")
    public ApiResponse<AiSettingsResponse> updateSettings(@Valid @RequestBody AiSettingsRequest request) {
        return ApiResponse.ok("Đã lưu ngưỡng tin cậy", adminAiService.updateSettings(request));
    }

    @GetMapping("/statistics")
    @Operation(summary = "Thống kê kết quả AI theo khoảng ngày tạo",
            description = "byLabel theo nhãn hiển thị; avgConfidence bỏ qua ảnh AI lỗi; pendingReview là số đang chờ hiện tại (không lọc ngày)")
    public ApiResponse<AiStatisticsResponse> statistics(
            @Parameter(description = "Từ ngày (yyyy-MM-dd), bao gồm. Bỏ trống = từ đầu")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Đến ngày (yyyy-MM-dd), bao gồm. Bỏ trống = tới nay")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(adminAiService.statistics(from, to));
    }

    private static Long currentUserId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
