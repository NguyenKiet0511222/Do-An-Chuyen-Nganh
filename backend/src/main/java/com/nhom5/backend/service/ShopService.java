package com.nhom5.backend.service;

import com.nhom5.backend.dto.product.ProductListItemDto;
import com.nhom5.backend.dto.product.ShopDetailDto;
import com.nhom5.backend.dto.product.ShopPublicPageDto;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public ShopPublicPageDto getShopPublicPage(Long shopId, int page, int size) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy cửa hàng"));

        if (shop.getStatus() != ShopStatus.ACTIVE) {
            throw AppException.forbidden("Cửa hàng không hoạt động");
        }

        ShopDetailDto shopDetail = new ShopDetailDto(
                shop.getId(),
                shop.getShopName(),
                shop.getProvince(),
                shop.getRatingAvg(),
                shop.getRatingCount(),
                shop.getLogoUrl()
        );

        PageResponse<ProductListItemDto> products = productService.searchPublicProducts(
                null, null, shopId, null, null, null, null, "newest", page, size);

        return new ShopPublicPageDto(shopDetail, products);
    }
}
