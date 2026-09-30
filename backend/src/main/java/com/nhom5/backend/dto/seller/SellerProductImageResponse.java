package com.nhom5.backend.dto.seller;

import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;

import java.math.BigDecimal;

/** 1 ảnh sản phẩm kèm kết quả AI (nhãn hiển thị = finalLabel ?? label). */
public record SellerProductImageResponse(
        Long id,
        String url,
        Boolean isPrimary,
        Integer displayOrder,
        Ai ai
) {

    public record Ai(
            Long id,
            String produce,
            AiLabel label,
            BigDecimal confidence,
            AiLabel finalLabel,
            AiReviewStatus reviewStatus,
            String note
    ) {
    }

    public static SellerProductImageResponse from(ProductImage image) {
        AiResult r = image.getAiResult();
        Ai ai = r == null ? null : new Ai(r.getId(), r.getProduce(), r.getLabel(), r.getConfidence(),
                r.getFinalLabel(), r.getReviewStatus(), r.getNote());
        return new SellerProductImageResponse(image.getId(), image.getUrl(), image.getPrimary(),
                image.getDisplayOrder(), ai);
    }
}
