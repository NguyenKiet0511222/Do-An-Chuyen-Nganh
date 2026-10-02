package com.nongsan.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * api.md mục 4.4 - "shop: { ..., ratingAvg, ratingCount, logoUrl }" mở rộng
 * thành thông tin đầy đủ cho trang shop công khai GET /api/shops/{id}.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPublicDto {

    private Long id;
    private String shopName;
    private String description;
    private String province;
    private String address;
    private String phone;
    private String logoUrl;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
}
