package com.nhom5.backend.dto.admin;

import com.nhom5.backend.dto.product.CategoryBriefDto;
import com.nhom5.backend.dto.seller.SellerProductDetailResponse;
import com.nhom5.backend.dto.seller.SellerProductImageResponse;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.ProductReviewHistory;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.HiddenBy;
import com.nhom5.backend.entity.enums.ProductReviewAction;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.ShopStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * GET /admin/products/{id} (api.md mục 4.9): chi tiết + ảnh + AI từng ảnh + shop (số sản phẩm đã duyệt / từ chối)
 * + lịch sử duyệt. Ảnh dùng chung khuôn với người bán (SellerProductImageResponse).
 */
public record AdminProductDetailResponse(
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
        ShopInfo shop,
        List<SellerProductImageResponse> images,
        List<ReviewHistoryDto> reviewHistory,
        LocalDateTime approvedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public record ShopInfo(Long id, String shopName, String phone, ShopStatus status, ProductCounts productCounts) {
        public static ShopInfo from(Shop s, long approved, long rejected) {
            return new ShopInfo(s.getId(), s.getShopName(), s.getPhone(), s.getStatus(),
                    new ProductCounts(approved, rejected));
        }
    }

    public record ProductCounts(long approved, long rejected) {
    }

    public record ReviewHistoryDto(Long id, ProductReviewAction action, ProductStatus fromStatus,
                                   ProductStatus toStatus, String actorName, Role actorRole, String reason,
                                   LocalDateTime createdAt) {
        public static ReviewHistoryDto from(ProductReviewHistory h) {
            return new ReviewHistoryDto(h.getId(), h.getAction(), h.getFromStatus(), h.getToStatus(),
                    h.getActor() == null ? null : h.getActor().getFullName(),
                    h.getActor() == null ? null : h.getActor().getRole(),
                    h.getReason(), h.getCreatedAt());
        }
    }

    public static AdminProductDetailResponse from(Product p, ShopInfo shop, List<ProductReviewHistory> history) {
        List<SellerProductImageResponse> images = p.getImages().stream()
                .sorted(Comparator.comparing(ProductImage::getDisplayOrder))
                .map(SellerProductImageResponse::from)
                .toList();
        return new AdminProductDetailResponse(
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
                SellerProductDetailResponse.primaryImageUrl(p),
                new CategoryBriefDto(p.getCategory().getId(), p.getCategory().getName()),
                shop,
                images,
                history.stream().map(ReviewHistoryDto::from).toList(),
                p.getApprovedAt(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }
}
