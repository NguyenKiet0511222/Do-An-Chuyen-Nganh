package com.nongsan.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * api.md mục 4.4 - trường "shop" rút gọn trong Product (list item): { id, shopName, province }
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopRefDto {
    private Long id;
    private String shopName;
    private String province;
}
