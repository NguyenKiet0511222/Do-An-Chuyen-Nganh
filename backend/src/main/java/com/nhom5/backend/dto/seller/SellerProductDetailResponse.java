package com.nhom5.backend.dto.seller;

import com.nhom5.backend.dto.product.CategoryBriefDto;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.HiddenBy;
import com.nhom5.backend.entity.enums.ProductStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/** Chi tiết sản phẩm cho form sửa của người bán (GET/POST/PUT /seller/products...). */
public record SellerProductDetailResponse(
        Long id,
        String name,
        String slug,
        String description,
        Long price,
        String unit,
        Integer stockQuantity,
        String origin,
        Integer soldCount,
        BigDecimal ratingAvg,
        Integer ratingCount,
        ProductStatus status,
        HiddenBy hiddenBy,
        String rejectReason,
        AiLabel aiOverallLabel,
        BigDecimal aiOverallConfidence,
        String primaryImageUrl,
        CategoryBriefDto category,
        List<SellerProductImageResponse> images,
        LocalDateTime approvedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static SellerProductDetailResponse from(Product p) {
        List<SellerProductImageResponse> images = sortedImages(p).stream()
                .map(SellerProductImageResponse::from)
                .toList();
        return new SellerProductDetailResponse(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getDescription(),
                p.getPrice(),
                p.getUnit(),
                p.getStockQuantity(),
                p.getOrigin(),
                p.getSoldCount(),
                p.getRatingAvg(),
                p.getRatingCount(),
                p.getStatus(),
                p.getHiddenBy(),
                p.getRejectReason(),
                p.getAiOverallLabel(),
                p.getAiOverallConfidence(),
                primaryImageUrl(p),
                new CategoryBriefDto(p.getCategory().getId(), p.getCategory().getName()),
                images,
                p.getApprovedAt(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }

    static List<ProductImage> sortedImages(Product p) {
        return p.getImages().stream()
                .sorted(Comparator.comparing(ProductImage::getDisplayOrder).thenComparing(ProductImage::getId,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    /** Ảnh chính; không có thì lấy ảnh đầu tiên theo displayOrder. */
    public static String primaryImageUrl(Product p) {
        List<ProductImage> images = sortedImages(p);
        return images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getPrimary()))
                .map(ProductImage::getUrl)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0).getUrl());
    }
}
