package com.nhom5.backend.service;

import com.nhom5.backend.dto.admin.ShopStatusRequest;
import com.nhom5.backend.dto.seller.ShopResponse;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Admin xác minh / khoá / mở khoá shop (api.md mục 3.1, 4.9). */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminShopService {

    private final ShopRepository shopRepository;

    /**
     * VERIFY: PENDING_VERIFICATION -> ACTIVE và chủ shop thành SELLER (người bán phải đăng nhập lại để JWT mang role mới).
     * LOCK: ACTIVE -> LOCKED. UNLOCK: LOCKED -> ACTIVE. Chuyển khác -> 409.
     */
    public ShopResponse changeStatus(Long shopId, ShopStatusRequest request) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy shop #" + shopId));

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

    private static void requireStatus(Shop shop, ShopStatus expected, String actionName) {
        if (shop.getStatus() != expected) {
            throw AppException.conflict("Không thể " + actionName + " shop đang ở trạng thái " + shop.getStatus());
        }
    }
}
