package com.nongsan.mapper;

import com.nongsan.dto.product.CategoryRefDto;
import com.nongsan.dto.product.ProductListItemDto;
import com.nongsan.dto.product.ShopRefDto;
import com.nongsan.entity.Product;
import com.nongsan.repository.ProductImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Map Product entity -> Product (list item) theo đúng field api.md mục 4.4.
 */
@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final ProductImageRepository productImageRepository;

    public ProductListItemDto toListItemDto(Product product) {
        String primaryImageUrl = productImageRepository
                .findFirstByProduct_IdAndIsPrimaryTrue(product.getId())
                .map(img -> img.getUrl())
                .orElseGet(() -> productImageRepository
                        .findFirstByProduct_IdOrderByDisplayOrderAsc(product.getId())
                        .map(img -> img.getUrl())
                        .orElse(null));

        return ProductListItemDto.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .price(product.getPrice())
                .unit(product.getUnit())
                .primaryImageUrl(primaryImageUrl)
                .aiOverallLabel(product.getAiOverallLabel() != null ? product.getAiOverallLabel().name() : null)
                .aiOverallConfidence(product.getAiOverallConfidence())
                .ratingAvg(product.getRatingAvg())
                .ratingCount(product.getRatingCount())
                .soldCount(product.getSoldCount())
                .stockQuantity(product.getStockQuantity())
                .category(CategoryRefDto.builder()
                        .id(product.getCategory().getId())
                        .name(product.getCategory().getName())
                        .build())
                .shop(ShopRefDto.builder()
                        .id(product.getShop().getId())
                        .shopName(product.getShop().getShopName())
                        .province(product.getShop().getProvince())
                        .build())
                .build();
    }
}
