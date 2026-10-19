package com.nhom5.backend.dto.admin;

import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.ProductStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 1 kết quả AI của ảnh sản phẩm cho màn kiểm định (docs/1910.md mục 7.2: GET /admin/ai/results, /{id}, PATCH review).
 * displayLabel = finalLabel ?? label (nhãn đang hiển thị cho khách). reviewedBy null khi chưa ai kiểm định.
 */
public record AdminAiResultResponse(
        Long id,
        String imageUrl,
        String produce,
        AiLabel label,
        BigDecimal confidence,
        AiLabel finalLabel,
        AiLabel displayLabel,
        AiReviewStatus reviewStatus,
        String note,
        String modelVersion,
        Integer inferenceMs,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt,
        Reviewer reviewedBy,
        ProductRef product,
        ShopRef shop
) {

    public record Reviewer(Long id, String fullName) {
    }

    public record ProductRef(Long id, String name, ProductStatus status, String categoryName) {
    }

    public record ShopRef(Long id, String shopName) {
    }

    /** Cần ảnh -> sản phẩm -> shop / danh mục đã nạp (AiResultRepository fetch sẵn) hoặc đang trong transaction. */
    public static AdminAiResultResponse from(AiResult r) {
        Product p = r.getProductImage().getProduct();
        User reviewer = r.getReviewedBy();
        return new AdminAiResultResponse(
                r.getId(),
                r.getImageUrl(),
                r.getProduce(),
                r.getLabel(),
                r.getConfidence(),
                r.getFinalLabel(),
                r.getFinalLabel() != null ? r.getFinalLabel() : r.getLabel(),
                r.getReviewStatus(),
                r.getNote(),
                r.getModelVersion(),
                r.getInferenceMs(),
                r.getCreatedAt(),
                r.getReviewedAt(),
                reviewer == null ? null : new Reviewer(reviewer.getId(), reviewer.getFullName()),
                new ProductRef(p.getId(), p.getName(), p.getStatus(), p.getCategory().getName()),
                new ShopRef(p.getShop().getId(), p.getShop().getShopName()));
    }
}
