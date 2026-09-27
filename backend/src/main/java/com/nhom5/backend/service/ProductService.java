package com.nhom5.backend.service;

import com.nhom5.backend.dto.product.ProductDetailDto;
import com.nhom5.backend.dto.product.ProductListItemDto;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.enums.AiLabel;

public interface ProductService {

    /**
     * GET /api/products — mục 4.4 api.md.
     * Tìm kiếm, lọc và phân trang danh sách sản phẩm APPROVED của các shop ACTIVE.
     */
    PageResponse<ProductListItemDto> searchPublicProducts(
            String keyword,
            Long categoryId,
            Long shopId,
            Long minPrice,
            Long maxPrice,
            String origin,
            AiLabel aiLabel,
            String sort,
            int page,
            int size
    );

    /**
     * GET /api/products/{id} — mục 4.4 api.md.
     * Lấy chi tiết sản phẩm công khai kèm ảnh, nhãn AI và thông tin shop.
     * Ném AppException.notFound nếu không tìm thấy hoặc sản phẩm/shop không đủ điều kiện công khai.
     */
    ProductDetailDto getPublicProductDetail(Long id);
}
