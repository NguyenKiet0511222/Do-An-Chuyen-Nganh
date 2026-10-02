package com.nongsan.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * api.md mục 4.4 - "Product (list item)".
 * Dùng chung cho GET /api/products và danh sách sản phẩm trong GET /api/shops/{id}.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListItemDto {

    private Long id;
    private String name;
    private String slug;
    private Long price;
    private String unit;
    private String primaryImageUrl;
    private String aiOverallLabel;        // null nếu chưa có kết quả AI
    private BigDecimal aiOverallConfidence;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private Integer soldCount;
    private Integer stockQuantity;
    private CategoryRefDto category;
    private ShopRefDto shop;
}
