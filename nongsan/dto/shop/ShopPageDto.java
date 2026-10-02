package com.nongsan.dto.shop;

import com.nongsan.dto.common.PageResponse;
import com.nongsan.dto.product.ProductListItemDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Payload trả về cho GET /api/shops/{id}:
 * thông tin shop công khai + danh sách sản phẩm APPROVED của shop (phân trang).
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPageDto {
    private ShopPublicDto shop;
    private PageResponse<ProductListItemDto> products;
}
