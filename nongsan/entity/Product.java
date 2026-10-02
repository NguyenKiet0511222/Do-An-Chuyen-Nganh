package com.nongsan.entity;

import com.nongsan.entity.enums.AiLabel;
import com.nongsan.entity.enums.HiddenBy;
import com.nongsan.entity.enums.ProductStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * api.md mục 2 - bảng products.
 * Chỉ khai báo các cột cần cho GET /api/categories (đếm sản phẩm theo danh mục)
 * và GET /api/shops/{id} (danh sách sản phẩm APPROVED của shop).
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "slug", length = 200, nullable = false, unique = true)
    private String slug;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "price", nullable = false)
    private Long price;

    @Column(name = "unit", length = 20, nullable = false)
    private String unit;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Column(name = "origin", length = 150)
    private String origin;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ProductStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "hidden_by", length = 10)
    private HiddenBy hiddenBy;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_overall_label", length = 20)
    private AiLabel aiOverallLabel;

    @Column(name = "ai_overall_confidence", precision = 5, scale = 4)
    private BigDecimal aiOverallConfidence;

    @Column(name = "sold_count", nullable = false)
    @Builder.Default
    private Integer soldCount = 0;

    @Column(name = "rating_avg", precision = 2, scale = 1)
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Integer ratingCount = 0;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
