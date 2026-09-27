package com.nhom5.backend.dto.response;

import org.springframework.data.domain.Page;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Khớp mục 1.3 api.md: { content, page, size, totalElements, totalPages }.
 */
@Schema(description = "Phản hồi phân trang chuẩn theo api.md mục 1.3")
public record PageResponse<T>(
        @Schema(description = "Danh sách bản ghi trang hiện tại")
        List<T> content,

        @Schema(description = "Chỉ số trang hiện tại (bắt đầu từ 0)", example = "0")
        int page,

        @Schema(description = "Số lượng bản ghi trên một trang", example = "12")
        int size,

        @Schema(description = "Tổng số bản ghi thỏa điều kiện", example = "248")
        long totalElements,

        @Schema(description = "Tổng số trang", example = "21")
        int totalPages
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
