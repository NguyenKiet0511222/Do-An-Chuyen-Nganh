package com.nhom5.backend.service;

import com.nhom5.backend.config.AppProperties;
import com.nhom5.backend.dto.cart.CartItemRequest;
import com.nhom5.backend.dto.cart.CartResponse;
import com.nhom5.backend.entity.CartItem;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.CartItemRepository;
import com.nhom5.backend.repository.ProductImageRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Giỏ hàng (api.md mục 3.4, 4.5). Chỉ thêm được sản phẩm APPROVED của shop ACTIVE, số lượng ≤ tồn kho.
 * Sản phẩm về sau hết bán / hết hàng vẫn giữ trong giỏ (frontend dựa vào stockQuantity để cảnh báo), checkout sẽ chặn.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @Transactional(readOnly = true)
    public CartResponse get(Long userId) {
        return toResponse(cartItemRepository.findByUserIdWithProduct(userId));
    }

    /** Đã có trong giỏ -> cộng dồn (vẫn phải ≤ tồn kho). */
    public CartResponse addItem(Long userId, CartItemRequest request) {
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy sản phẩm"));
        requireSellable(product);

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, product.getId()).orElse(null);
        int newQuantity = (item == null ? 0 : item.getQuantity()) + request.quantity();
        requireStock(product, newQuantity);
        if (item == null) {
            cartItemRepository.save(CartItem.builder()
                    .user(userRepository.getReferenceById(userId))
                    .product(product)
                    .quantity(newQuantity)
                    .build());
        } else {
            item.setQuantity(newQuantity);
        }
        cartItemRepository.flush();
        return get(userId);
    }

    /** quantity = 0 -> xoá dòng. */
    public CartResponse updateQuantity(Long userId, Long itemId, int quantity) {
        CartItem item = requireMine(userId, itemId);
        if (quantity == 0) {
            cartItemRepository.delete(item);
        } else {
            requireStock(item.getProduct(), quantity);
            item.setQuantity(quantity);
        }
        cartItemRepository.flush();
        return get(userId);
    }

    public CartResponse removeItem(Long userId, Long itemId) {
        cartItemRepository.delete(requireMine(userId, itemId));
        cartItemRepository.flush();
        return get(userId);
    }

    public void clear(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    // ---------- helpers ----------

    private CartItem requireMine(Long userId, Long itemId) {
        return cartItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy sản phẩm trong giỏ"));
    }

    private static void requireSellable(Product p) {
        if (p.getStatus() != ProductStatus.APPROVED || p.getShop().getStatus() != ShopStatus.ACTIVE) {
            throw AppException.conflict("Sản phẩm hiện không còn bán");
        }
    }

    private static void requireStock(Product p, int quantity) {
        if (quantity > p.getStockQuantity()) {
            throw AppException.conflict("Chỉ còn " + p.getStockQuantity() + " " + p.getUnit());
        }
    }

    /** Nhóm theo shop theo đúng thứ tự query (shop id tăng dần), ảnh chính lấy 1 lượt cho mọi sản phẩm. */
    CartResponse toResponse(List<CartItem> items) {
        Map<Long, String> images = primaryImages(items.stream().map(c -> c.getProduct().getId()).distinct().toList());
        long shippingFee = appProperties.order().shippingFeeFlat();

        Map<Long, List<CartItem>> byShop = new LinkedHashMap<>();
        for (CartItem c : items) {
            byShop.computeIfAbsent(c.getProduct().getShop().getId(), k -> new ArrayList<>()).add(c);
        }
        List<CartResponse.Group> groups = new ArrayList<>();
        long grandTotal = 0;
        for (List<CartItem> group : byShop.values()) {
            List<CartResponse.Item> lines = group.stream()
                    .map(c -> CartResponse.Item.from(c, images.get(c.getProduct().getId())))
                    .toList();
            long subtotal = lines.stream().mapToLong(CartResponse.Item::subtotal).sum();
            groups.add(new CartResponse.Group(CartResponse.ShopBrief.from(group.get(0).getProduct().getShop()),
                    lines, subtotal, shippingFee));
            grandTotal += subtotal + shippingFee;
        }
        return new CartResponse(groups, grandTotal, items.size());
    }

    private Map<Long, String> primaryImages(List<Long> productIds) {
        Map<Long, String> images = new LinkedHashMap<>();
        if (!productIds.isEmpty()) {
            for (ProductImage img : productImageRepository.findForPrimaryPick(productIds)) {
                images.putIfAbsent(img.getProduct().getId(), img.getUrl());
            }
        }
        return images;
    }
}
