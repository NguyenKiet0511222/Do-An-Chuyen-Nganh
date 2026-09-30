package com.nhom5.backend.service;

import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

/**
 * Gắn nhãn AI cho ảnh sản phẩm + tính nhãn tổng hợp của sản phẩm (api.md mục 3.2, 3.3).
 *
 * <p>HIỆN CHƯA GỌI AI SERVICE (chốt với nhóm 30/09/2026): mọi ảnh mới tạo ai_result
 * UNCERTAIN + PENDING_REVIEW để admin kiểm định thủ công — đúng nhánh "AI không phản hồi" của mục 3.3.
 * Khi nối AI (tuần 5) chỉ cần thay {@link #labelNewImage(ProductImage)}: gọi FastAPI, áp ngưỡng settings.</p>
 */
@Component
public class ProductAiLabeler {

    public static final String MANUAL_REVIEW_NOTE = "Chưa tích hợp AI — chờ admin kiểm định thủ công";

    public AiResult labelNewImage(ProductImage image) {
        return AiResult.builder()
                .source(AiSource.PRODUCT_IMAGE)
                .imageUrl(image.getUrl())
                .label(AiLabel.UNCERTAIN)
                .confidence(BigDecimal.ZERO)
                .reviewStatus(AiReviewStatus.PENDING_REVIEW)
                .note(MANUAL_REVIEW_NOTE)
                .build();
    }

    /**
     * Nhãn tổng hợp = xấu nhất trong các ảnh (dùng finalLabel ?? label): có ROTTEN -> ROTTEN,
     * không ROTTEN nhưng có UNCERTAIN -> UNCERTAIN, còn lại FRESH. Confidence = trung bình. Không có ảnh -> null.
     */
    public void recomputeOverall(Product product) {
        List<AiResult> results = product.getImages().stream()
                .map(ProductImage::getAiResult)
                .filter(Objects::nonNull)
                .toList();
        if (results.isEmpty()) {
            product.setAiOverallLabel(null);
            product.setAiOverallConfidence(null);
            return;
        }
        List<AiLabel> labels = results.stream()
                .map(r -> r.getFinalLabel() != null ? r.getFinalLabel() : r.getLabel())
                .toList();
        AiLabel overall = labels.contains(AiLabel.ROTTEN) ? AiLabel.ROTTEN
                : labels.contains(AiLabel.UNCERTAIN) ? AiLabel.UNCERTAIN
                : AiLabel.FRESH;
        BigDecimal sum = results.stream()
                .map(r -> r.getConfidence() == null ? BigDecimal.ZERO : r.getConfidence())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        product.setAiOverallLabel(overall);
        product.setAiOverallConfidence(sum.divide(BigDecimal.valueOf(results.size()), 4, RoundingMode.HALF_UP));
    }
}
