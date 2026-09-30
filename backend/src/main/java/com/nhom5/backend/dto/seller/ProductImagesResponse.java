package com.nhom5.backend.dto.seller;

import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.ProductStatus;

import java.math.BigDecimal;
import java.util.List;

/**
 * Kết quả các thao tác ảnh (upload / xoá / đặt ảnh chính): trả TOÀN BỘ ảnh hiện tại của sản phẩm
 * + nhãn AI tổng hợp + trạng thái (sửa ảnh của sản phẩm đã duyệt sẽ chuyển về PENDING).
 */
public record ProductImagesResponse(
        Long productId,
        ProductStatus status,
        List<SellerProductImageResponse> images,
        AiLabel aiOverallLabel,
        BigDecimal aiOverallConfidence
) {

    public static ProductImagesResponse from(Product p) {
        List<SellerProductImageResponse> images = SellerProductDetailResponse.sortedImages(p).stream()
                .map(SellerProductImageResponse::from)
                .toList();
        return new ProductImagesResponse(p.getId(), p.getStatus(), images, p.getAiOverallLabel(),
                p.getAiOverallConfidence());
    }
}
