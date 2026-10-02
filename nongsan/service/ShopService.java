package com.nongsan.service;

import com.nongsan.dto.common.PageResponse;
import com.nongsan.dto.product.ProductListItemDto;
import com.nongsan.dto.shop.ShopPageDto;
import com.nongsan.dto.shop.ShopPublicDto;
import com.nongsan.entity.Product;
import com.nongsan.entity.Shop;
import com.nongsan.entity.enums.ProductStatus;
import com.nongsan.entity.enums.ShopStatus;
import com.nongsan.exception.ResourceNotFoundException;
import com.nongsan.mapper.ProductMapper;
import com.nongsan.repository.ProductRepository;
import com.nongsan.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * api.md mục 4.4 - GET /api/shops/{id}: trang shop công khai + sản phẩm của shop (phân trang).
 *
 * Quy tắc nghiệp vụ áp dụng (mục 3.2):
 * - "Trang công khai chỉ trả sản phẩm APPROVED thuộc shop ACTIVE."
 * -> Nếu shop không tồn tại hoặc không ACTIVE, coi như không tìm thấy (404),
 *    để không lộ thông tin shop đang PENDING_VERIFICATION / LOCKED ra ngoài.
 */
@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public ShopPageDto getPublicShopPage(Long shopId, Pageable pageable) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy shop"));

        if (shop.getStatus() != ShopStatus.ACTIVE) {
            throw new ResourceNotFoundException("Không tìm thấy shop");
        }

        Page<Product> productPage = productRepository
                .findByShop_IdAndStatus(shopId, ProductStatus.APPROVED, pageable);
        Page<ProductListItemDto> dtoPage = productPage.map(productMapper::toListItemDto);

        return ShopPageDto.builder()
                .shop(toShopPublicDto(shop))
                .products(PageResponse.from(dtoPage))
                .build();
    }

    private ShopPublicDto toShopPublicDto(Shop shop) {
        return ShopPublicDto.builder()
                .id(shop.getId())
                .shopName(shop.getShopName())
                .description(shop.getDescription())
                .province(shop.getProvince())
                .address(shop.getAddress())
                .phone(shop.getPhone())
                .logoUrl(shop.getLogoUrl())
                .ratingAvg(shop.getRatingAvg())
                .ratingCount(shop.getRatingCount())
                .build();
    }
}
