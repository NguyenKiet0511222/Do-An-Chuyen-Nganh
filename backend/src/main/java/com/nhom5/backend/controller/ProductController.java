package com.nhom5.backend.controller;

import com.nhom5.backend.dto.product.ProductDetailDto;
import com.nhom5.backend.dto.product.ProductListItemDto;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Mục 4.4 api.md — Sản phẩm công khai.
 * Đường dẫn GET /api/products/** là công khai (mục 1.5, SecurityConfig).
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product API", description = "API sản phẩm công khai: tra cứu, lọc đa tiêu chí, phân trang và xem chi tiết (Mục 4.4 api.md)")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(
            summary = "Danh sách sản phẩm công khai",
            description = "Lấy danh sách sản phẩm đã duyệt (APPROVED) từ các gian hàng đang hoạt động (ACTIVE). " +
                          "Hỗ trợ tìm kiếm từ khóa, lọc theo danh mục (kể cả danh mục con), shop, khoảng giá, xuất xứ, nhãn AI, và sắp xếp theo nhiều tiêu chí."
    )
    public ApiResponse<PageResponse<ProductListItemDto>> list(
            @Parameter(description = "Từ khóa tìm kiếm theo tên sản phẩm (không phân biệt hoa thường)", example = "cà chua")
            @RequestParam(required = false) String keyword,

            @Parameter(description = "Mã danh mục (lấy cả sản phẩm thuộc danh mục con)", example = "5")
            @RequestParam(required = false) Long categoryId,

            @Parameter(description = "Mã cửa hàng", example = "3")
            @RequestParam(required = false) Long shopId,

            @Parameter(description = "Giá bán tối thiểu (VND)", example = "20000")
            @RequestParam(required = false) Long minPrice,

            @Parameter(description = "Giá bán tối đa (VND)", example = "100000")
            @RequestParam(required = false) Long maxPrice,

            @Parameter(description = "Xuất xứ sản phẩm", example = "Lâm Đồng")
            @RequestParam(required = false) String origin,

            @Parameter(description = "Lọc theo nhãn tổng thể do AI đánh giá (FRESH, ROTTEN, UNCERTAIN)", example = "FRESH")
            @RequestParam(required = false) AiLabel aiLabel,

            @Parameter(description = "Tiêu chí sắp xếp: newest (mới nhất), priceAsc (giá tăng dần), priceDesc (giá giảm dần), bestSelling (bán chạy), rating (đánh giá cao)", example = "newest")
            @RequestParam(defaultValue = "newest") String sort,

            @Parameter(description = "Số trang (bắt đầu từ 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Số lượng sản phẩm trên một trang (mặc định 12, tối đa 100)", example = "12")
            @RequestParam(defaultValue = "12") int size) {

        PageResponse<ProductListItemDto> result = productService.searchPublicProducts(
                keyword, categoryId, shopId, minPrice, maxPrice, origin, aiLabel, sort, page, size);
        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Chi tiết sản phẩm công khai",
            description = "Lấy đầy đủ thông tin chi tiết của 1 sản phẩm: mô tả, xuất xứ, danh sách ảnh kèm nhãn phân loại AI của từng ảnh, và thông tin gian hàng bán."
    )
    public ApiResponse<ProductDetailDto> detail(
            @Parameter(description = "Mã định danh sản phẩm (Product ID)", example = "1")
            @PathVariable Long id) {

        ProductDetailDto detail = productService.getPublicProductDetail(id);
        return ApiResponse.success(detail);
    }
}
