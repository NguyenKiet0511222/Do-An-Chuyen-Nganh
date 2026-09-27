package com.nhom5.backend.service.impl;

import com.nhom5.backend.dto.product.AiInfoDto;
import com.nhom5.backend.dto.product.CategoryBriefDto;
import com.nhom5.backend.dto.product.ProductDetailDto;
import com.nhom5.backend.dto.product.ProductImageDto;
import com.nhom5.backend.dto.product.ProductListItemDto;
import com.nhom5.backend.dto.product.ShopBriefDto;
import com.nhom5.backend.dto.product.ShopDetailDto;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ProductImageRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 100;

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;

    @Override
    public PageResponse<ProductListItemDto> searchPublicProducts(
            String keyword,
            Long categoryId,
            Long shopId,
            Long minPrice,
            Long maxPrice,
            String origin,
            AiLabel aiLabel,
            String sort,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(safePage(page), safeSize(size), resolveSort(sort));

        var productPage = productRepository.searchPublicProducts(
                normalize(keyword), categoryId, shopId, minPrice, maxPrice, normalize(origin), aiLabel, pageable);

        List<Long> ids = productPage.getContent().stream().map(Product::getId).toList();
        Map<Long, String> primaryImageByProductId = resolvePrimaryImages(ids);

        List<ProductListItemDto> items = productPage.getContent().stream()
                .map(p -> toListItemDto(p, primaryImageByProductId.get(p.getId())))
                .toList();

        return PageResponse.from(new PageImpl<>(items, pageable, productPage.getTotalElements()));
    }

    @Override
    public ProductDetailDto getPublicProductDetail(Long id) {
        Product product = productRepository.findPublicDetailById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy sản phẩm hoặc sản phẩm chưa được mở bán"));
        return toDetailDto(product);
    }

    // ---------- helpers ----------

    private int safePage(int page) {
        return Math.max(page, 0);
    }

    private int safeSize(int size) {
        if (size <= 0) return DEFAULT_PAGE_SIZE;
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    /**
     * sort = newest (mặc định) | priceAsc | priceDesc | bestSelling | rating (mục 4.4 api.md).
     */
    private Sort resolveSort(String sort) {
        String key = sort == null ? "newest" : sort.trim();
        Sort primary = switch (key) {
            case "priceAsc" -> Sort.by(Sort.Direction.ASC, "price");
            case "priceDesc" -> Sort.by(Sort.Direction.DESC, "price");
            case "bestSelling" -> Sort.by(Sort.Direction.DESC, "soldCount");
            case "rating" -> Sort.by(Sort.Direction.DESC, "ratingAvg");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        // Sắp phụ theo id giảm dần để phân trang ổn định khi nhiều bản ghi trùng giá trị sắp xếp chính
        return primary.and(Sort.by(Sort.Direction.DESC, "id"));
    }

    /**
     * Với mỗi productId: ưu tiên ảnh isPrimary = true; nếu không có, lấy ảnh displayOrder nhỏ nhất.
     */
    private Map<Long, String> resolvePrimaryImages(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) return Map.of();
        Map<Long, String> result = new LinkedHashMap<>();
        for (ProductImage img : productImageRepository.findForPrimaryPick(productIds)) {
            result.putIfAbsent(img.getProduct().getId(), img.getUrl());
        }
        return result;
    }

    private ProductListItemDto toListItemDto(Product p, String primaryImageUrl) {
        return new ProductListItemDto(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getPrice(),
                p.getUnit(),
                primaryImageUrl,
                p.getAiOverallLabel(),
                p.getAiOverallConfidence(),
                p.getRatingAvg(),
                p.getRatingCount(),
                p.getSoldCount(),
                p.getStockQuantity(),
                new CategoryBriefDto(p.getCategory().getId(), p.getCategory().getName()),
                new ShopBriefDto(p.getShop().getId(), p.getShop().getShopName(), p.getShop().getProvince())
        );
    }

    private ProductDetailDto toDetailDto(Product p) {
        List<ProductImageDto> images = p.getImages().stream()
                .sorted(Comparator.comparing(ProductImage::getDisplayOrder))
                .map(this::toImageDto)
                .toList();

        String primaryImageUrl = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.isPrimary()))
                .map(ProductImageDto::url)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0).url());

        var shop = p.getShop();
        ShopDetailDto shopDto = new ShopDetailDto(
                shop.getId(),
                shop.getShopName(),
                shop.getProvince(),
                shop.getRatingAvg(),
                shop.getRatingCount(),
                shop.getLogoUrl()
        );

        return new ProductDetailDto(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getPrice(),
                p.getUnit(),
                primaryImageUrl,
                p.getAiOverallLabel(),
                p.getAiOverallConfidence(),
                p.getRatingAvg(),
                p.getRatingCount(),
                p.getSoldCount(),
                p.getStockQuantity(),
                p.getDescription(),
                p.getOrigin(),
                p.getStatus(),
                images,
                shopDto
        );
    }

    private ProductImageDto toImageDto(ProductImage img) {
        AiInfoDto ai = img.getAiResult() == null ? null : new AiInfoDto(
                img.getAiResult().getLabel(),
                img.getAiResult().getConfidence(),
                img.getAiResult().getFinalLabel(),
                img.getAiResult().getReviewStatus()
        );
        return new ProductImageDto(img.getId(), img.getUrl(), img.getPrimary(), img.getDisplayOrder(), ai);
    }
}
