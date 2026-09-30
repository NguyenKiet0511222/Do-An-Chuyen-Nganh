package com.nhom5.backend.dto.seller;

import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.ProductStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** 1 dòng của GET /seller/ai/results — có product.id để frontend dẫn tới trang sửa sản phẩm ("Thay ảnh"). */
public record SellerAiResultResponse(
        Long id,
        ProductRef product,
        Long imageId,
        String imageUrl,
        String produce,
        AiLabel label,
        BigDecimal confidence,
        AiLabel finalLabel,
        AiReviewStatus reviewStatus,
        String note,
        LocalDateTime reviewedAt,
        LocalDateTime createdAt
) {

    public record ProductRef(Long id, String name, ProductStatus status) {
    }

    public static SellerAiResultResponse from(AiResult r) {
        Product p = r.getProductImage().getProduct();
        return new SellerAiResultResponse(
                r.getId(),
                new ProductRef(p.getId(), p.getName(), p.getStatus()),
                r.getProductImage().getId(),
                r.getImageUrl(),
                r.getProduce(),
                r.getLabel(),
                r.getConfidence(),
                r.getFinalLabel(),
                r.getReviewStatus(),
                r.getNote(),
                r.getReviewedAt(),
                r.getCreatedAt());
    }
}
