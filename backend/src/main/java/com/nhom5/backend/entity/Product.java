package com.nhom5.backend.entity;

import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.HiddenBy;
import com.nhom5.backend.entity.enums.ProductStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "products", uniqueConstraints = @UniqueConstraint(name = "uk_products_slug", columnNames = "slug"))
public class Product extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Nationalized
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "slug", nullable = false, length = 250, unique = true)
    private String slug;

    @Nationalized
    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    /** VND, số nguyên. */
    @Column(name = "price", nullable = false)
    private Long price;

    @Nationalized
    @Column(name = "unit", nullable = false, length = 20)
    private String unit;

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Nationalized
    @Column(name = "origin", length = 150)
    private String origin;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ProductStatus status = ProductStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "hidden_by", length = 10)
    private HiddenBy hiddenBy;

    @Nationalized
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** Xấu nhất trong các ảnh: có ROTTEN -> ROTTEN; không ROTTEN nhưng có UNCERTAIN -> UNCERTAIN; còn lại FRESH. */
    @Enumerated(EnumType.STRING)
    @Column(name = "ai_overall_label", length = 20)
    private AiLabel aiOverallLabel;

    @Column(name = "ai_overall_confidence", precision = 5, scale = 4)
    private BigDecimal aiOverallConfidence;

    @Column(name = "sold_count", nullable = false)
    @Builder.Default
    private Integer soldCount = 0;

    @Column(name = "rating_avg", nullable = false, precision = 2, scale = 1)
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Integer ratingCount = 0;

    @Column(name = "approved_at", columnDefinition = "DATETIME2")
    private LocalDateTime approvedAt;

    /** Xoá sản phẩm -> xoá ảnh (cascade, orphanRemoval). */
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();
}
