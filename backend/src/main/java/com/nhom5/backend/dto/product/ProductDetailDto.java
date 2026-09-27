package com.nhom5.backend.dto.product;

import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.ProductStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Chi tiết sản phẩm công khai đầy đủ (Mục 4.4 api.md)")
public record ProductDetailDto(
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

        @Schema(description = "Mô tả chi tiết sản phẩm", example = "Cà chua bi tươi ngon thu hoạch từ vườn Đà Lạt...")
        String description,

        @Schema(description = "Xuất xứ nông sản", example = "Lâm Đồng")
        String origin,

        @Schema(description = "Trạng thái kiểm duyệt sản phẩm", example = "APPROVED")
        ProductStatus status,

        @Schema(description = "Danh sách ảnh sản phẩm kèm nhãn AI từng ảnh")
        List<ProductImageDto> images,

        @Schema(description = "Thông tin gian hàng")
        ShopDetailDto shop
) {}
