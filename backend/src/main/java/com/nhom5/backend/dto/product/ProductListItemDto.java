package com.nhom5.backend.dto.product;

import com.nhom5.backend.entity.enums.AiLabel;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Sản phẩm trong danh sách công khai (Mục 4.4 api.md)")
public record ProductListItemDto(
        @Schema(description = "Mã sản phẩm", example = "1187")
        Long id,

        @Schema(description = "Tên sản phẩm", example = "Cà chua bi Đà Lạt")
        String name,

        @Schema(description = "Slug định danh URL", example = "ca-chua-bi-da-lat")
        String slug,

        @Schema(description = "Giá bán (VND)", example = "45000")
        Long price,

        @Schema(description = "Đơn vị tính", example = "kg")
        String unit,

        @Schema(description = "Ảnh đại diện chính", example = "/uploads/products/1187/a.jpg")
        String primaryImageUrl,

        @Schema(description = "Nhãn AI tổng hợp của sản phẩm", example = "FRESH")
        AiLabel aiOverallLabel,

        @Schema(description = "Độ tin cậy AI trung bình", example = "0.9200")
        BigDecimal aiOverallConfidence,

        @Schema(description = "Điểm đánh giá trung bình", example = "4.6")
        BigDecimal ratingAvg,

        @Schema(description = "Số lượt đánh giá", example = "18")
        Integer ratingCount,

        @Schema(description = "Số lượng đã bán", example = "214")
        Integer soldCount,

        @Schema(description = "Số lượng tồn kho", example = "120")
        Integer stockQuantity,

        @Schema(description = "Danh mục sản phẩm")
        CategoryBriefDto category,

        @Schema(description = "Gian hàng bán sản phẩm")
        ShopBriefDto shop
) {}
