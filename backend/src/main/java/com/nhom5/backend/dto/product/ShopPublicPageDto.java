package com.nhom5.backend.dto.product;

import com.nhom5.backend.dto.response.PageResponse;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Trang shop công khai kèm danh sách sản phẩm")
public record ShopPublicPageDto(
        @Schema(description = "Thông tin chi tiết shop")
        ShopDetailDto shop,

        @Schema(description = "Danh sách sản phẩm của shop (phân trang)")
        PageResponse<ProductListItemDto> products
) {}
