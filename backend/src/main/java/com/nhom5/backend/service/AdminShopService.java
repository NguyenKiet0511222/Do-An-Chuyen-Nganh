package com.nhom5.backend.service;

import com.nhom5.backend.dto.admin.AdminShopResponse;
import com.nhom5.backend.dto.admin.ShopStatusRequest;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.dto.seller.ShopResponse;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Admin tra cứu và xác minh / khoá / mở khoá shop (api.md mục 3.1, 4.9). */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminShopService {

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    /** GET /admin/shops — mới nhất trước; keyword khớp tên shop hoặc email chủ shop. */
    @Transactional(readOnly = true)
    public PageResponse<AdminShopResponse> search(ShopStatus status, String keyword, String province, int page, int size) {
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<Shop> shops = shopRepository.search(status, QueryParams.normalize(province),
                QueryParams.normalize(keyword), pageable);

        List<Long> ids = shops.getContent().stream().map(Shop::getId).toList();
        Map<Long, Map<ProductStatus, Long>> productCounts = new HashMap<>();
        Map<Long, Long> orderCounts = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : productRepository.countByStatusForShops(ids)) {
                productCounts.computeIfAbsent((Long) row[0], k -> new EnumMap<>(ProductStatus.class))
                        .put((ProductStatus) row[1], (Long) row[2]);
            }
            for (Object[] row : orderRepository.countByShopIds(ids)) {
                orderCounts.put((Long) row[0], (Long) row[1]);
            }
        }

        List<AdminShopResponse> content = shops.getContent().stream()
                .map(s -> AdminShopResponse.from(s,
                        toProductCounts(productCounts.getOrDefault(s.getId(), Map.of())),
                        orderCounts.getOrDefault(s.getId(), 0L)))
                .toList();
        return PageResponse.from(new PageImpl<>(content, pageable, shops.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public AdminShopResponse get(Long shopId) {
        Shop shop = requireShop(shopId);
        Map<ProductStatus, Long> counts = new EnumMap<>(ProductStatus.class);
        for (Object[] row : productRepository.countByStatusForShop(shopId)) {
            counts.put((ProductStatus) row[0], (Long) row[1]);
        }
        return AdminShopResponse.from(shop, toProductCounts(counts), orderRepository.countByShopId(shopId));
    }

    /**
     * VERIFY: PENDING_VERIFICATION -> ACTIVE và chủ shop thành SELLER (người bán phải đăng nhập lại để JWT mang role mới).
     * LOCK: ACTIVE -> LOCKED. UNLOCK: LOCKED -> ACTIVE. Chuyển khác -> 409.
     */
    public ShopResponse changeStatus(Long shopId, ShopStatusRequest request) {
        Shop shop = requireShop(shopId);

        switch (request.action()) {
            case VERIFY -> {
                requireStatus(shop, ShopStatus.PENDING_VERIFICATION, "xác minh");
                shop.setStatus(ShopStatus.ACTIVE);
                shop.setVerifiedAt(LocalDateTime.now());
                User owner = shop.getUser();
                if (owner.getRole() == Role.CUSTOMER) {
                    owner.setRole(Role.SELLER);
                }
            }
            case LOCK -> {
                requireStatus(shop, ShopStatus.ACTIVE, "khoá");
                shop.setStatus(ShopStatus.LOCKED);
            }
            case UNLOCK -> {
                requireStatus(shop, ShopStatus.LOCKED, "mở khoá");
                shop.setStatus(ShopStatus.ACTIVE);
            }
        }
        return ShopResponse.from(shop);
    }

    private Shop requireShop(Long shopId) {
        return shopRepository.findById(shopId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy shop #" + shopId));
    }

    private static AdminShopResponse.ProductCounts toProductCounts(Map<ProductStatus, Long> counts) {
        return new AdminShopResponse.ProductCounts(
                counts.getOrDefault(ProductStatus.APPROVED, 0L),
                counts.getOrDefault(ProductStatus.PENDING, 0L),
                counts.getOrDefault(ProductStatus.REJECTED, 0L));
    }

    private static void requireStatus(Shop shop, ShopStatus expected, String actionName) {
        if (shop.getStatus() != expected) {
            throw AppException.conflict("Không thể " + actionName + " shop đang ở trạng thái " + shop.getStatus());
        }
    }
}
