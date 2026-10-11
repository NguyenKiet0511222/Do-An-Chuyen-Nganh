package com.nhom5.backend.dto.admin;

import com.nhom5.backend.dto.product.CategoryBriefDto;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.HiddenBy;
import com.nhom5.backend.entity.enums.ProductStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 1 dòng GET /admin/products (api.md mục 4.9) — như dòng của người bán nhưng kèm shop. */
public record AdminProductResponse(
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
        ShopBrief shop,
        LocalDateTime approvedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public record ShopBrief(Long id, String shopName) {
    }

    public static AdminProductResponse from(Product p, String primaryImageUrl) {
        return new AdminProductResponse(
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
                new ShopBrief(p.getShop().getId(), p.getShop().getShopName()),
                p.getApprovedAt(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}
