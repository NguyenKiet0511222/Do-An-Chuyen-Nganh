package com.nhom5.backend.dto.seller;

import com.nhom5.backend.dto.product.CategoryBriefDto;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.HiddenBy;
import com.nhom5.backend.entity.enums.ProductStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 1 dòng trong danh sách sản phẩm của shop (GET /seller/products), cũng trả về sau khi đổi tồn kho / ẩn-hiện. */
public record SellerProductResponse(
        Long id,
        String name,
        String slug,
        Long price,
        String unit,
        Integer stockQuantity,
        Integer soldCount,
        ProductStatus status,
        HiddenBy hiddenBy,
        String rejectReason,
        AiLabel aiOverallLabel,
        BigDecimal aiOverallConfidence,
        String primaryImageUrl,
        CategoryBriefDto category,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static SellerProductResponse from(Product p, String primaryImageUrl) {
        return new SellerProductResponse(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getPrice(),
                p.getUnit(),
                p.getStockQuantity(),
                p.getSoldCount(),
                p.getStatus(),
                p.getHiddenBy(),
                p.getRejectReason(),
                p.getAiOverallLabel(),
                p.getAiOverallConfidence(),
                primaryImageUrl,
                new CategoryBriefDto(p.getCategory().getId(), p.getCategory().getName()),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}
