package com.nhom5.backend.dto.product;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Thông tin tóm tắt gian hàng")
public record ShopBriefDto(
        @Schema(description = "Mã cửa hàng", example = "3")
        Long id,

        @Schema(description = "Tên cửa hàng", example = "Vườn rau Tâm An")
        String shopName,

        @Schema(description = "Tỉnh / Thành phố", example = "Lâm Đồng")
        String province
) {}
