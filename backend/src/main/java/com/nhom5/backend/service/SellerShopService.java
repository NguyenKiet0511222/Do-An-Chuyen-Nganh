package com.nhom5.backend.service;

import com.nhom5.backend.dto.seller.LogoResponse;
import com.nhom5.backend.dto.seller.ShopRequest;
import com.nhom5.backend.dto.seller.ShopResponse;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Đăng ký bán hàng + hồ sơ shop của người bán (api.md mục 3.1, 4.8).
 * Các service seller khác dùng {@link #requireShop(Long)} để luôn thao tác trong shop của chính mình.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SellerShopService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    /** Tạo shop PENDING_VERIFICATION; user vẫn là CUSTOMER cho tới khi admin VERIFY. */
    public ShopResponse register(Long userId, ShopRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("Tài khoản không còn tồn tại"));
        if (user.getRole() == Role.ADMIN) {
            throw AppException.forbidden("Tài khoản quản trị không thể đăng ký bán hàng");
        }
        if (shopRepository.existsByUserId(userId)) {
            throw AppException.conflict("Tài khoản này đã đăng ký shop");
        }
        Shop shop = Shop.builder()
                .user(user)
                .status(ShopStatus.PENDING_VERIFICATION)
                .build();
        applyRequest(shop, request);
        return ShopResponse.from(shopRepository.save(shop));
    }

    @Transactional(readOnly = true)
    public ShopResponse getMyShop(Long userId) {
        return ShopResponse.from(requireShop(userId));
    }

    public ShopResponse updateMyShop(Long userId, ShopRequest request) {
        Shop shop = requireShop(userId);
        applyRequest(shop, request);
        return ShopResponse.from(shop);
    }

    /** Lưu logo mới rồi xoá file logo cũ (nếu là file đã upload). */
    public LogoResponse updateLogo(Long userId, MultipartFile file) {
        Shop shop = requireShop(userId);
        String oldLogo = shop.getLogoUrl();
        shop.setLogoUrl(fileStorageService.storeImage(file, "logos"));
        fileStorageService.deleteQuietly(oldLogo);
        return new LogoResponse(shop.getLogoUrl());
    }

    /** Shop của người đang đăng nhập; chưa có shop (vd. tài khoản ADMIN) -> 404. */
    @Transactional(readOnly = true)
    public Shop requireShop(Long userId) {
        return shopRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Tài khoản chưa có shop"));
    }

    /** Shop bị khoá vẫn xử lý đơn đang có, nhưng không được đăng / gửi duyệt sản phẩm mới (api.md mục 3.1). */
    public void ensureActive(Shop shop) {
        if (shop.getStatus() != ShopStatus.ACTIVE) {
            throw AppException.forbidden("Shop đang bị khoá hoặc chưa được xác minh, không thể thực hiện thao tác này");
        }
    }

    private static void applyRequest(Shop shop, ShopRequest request) {
        shop.setShopName(request.shopName().trim());
        shop.setDescription(trimToNull(request.description()));
        shop.setProvince(request.province().trim());
        shop.setAddress(request.address().trim());
        shop.setPhone(request.phone().trim());
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
