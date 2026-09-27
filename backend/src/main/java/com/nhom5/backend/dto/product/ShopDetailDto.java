package com.nhom5.backend.dto.product;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Thông tin chi tiết gian hàng")
public record ShopDetailDto(
        @Schema(description = "Mã cửa hàng", example = "3")
        Long id,

        @Schema(description = "Tên cửa hàng", example = "Vườn rau Tâm An")
        String shopName,

        @Schema(description = "Tỉnh / Thành phố", example = "Lâm Đồng")
        String province,

        @Schema(description = "Điểm đánh giá trung bình", example = "4.8")
        BigDecimal ratingAvg,

        @Schema(description = "Số lượt đánh giá", example = "56")
        Integer ratingCount,

        @Schema(description = "Đường dẫn ảnh đại diện logo", example = "/uploads/shops/3/logo.jpg")
        String logoUrl
) {}
