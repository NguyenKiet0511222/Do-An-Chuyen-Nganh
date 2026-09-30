package com.nhom5.backend.dto.order;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.OrderStatusHistory;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentMethod;
import com.nhom5.backend.entity.enums.PaymentStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Chi tiết đơn theo khuôn "Order (detail)" api.md mục 4.6 — dùng cho người bán (và sau này khách/admin). */
public record OrderDetailResponse(
        Long id,
        String orderCode,
        String checkoutGroupId,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        OrderCustomerDto customer,
        ShopInfo shop,
        String receiverName,
        String phone,
        String shippingAddress,
        String note,
        List<Item> items,
        Long subtotal,
        Long shippingFee,
        Long total,
        List<History> history,
        LocalDateTime createdAt,
        LocalDateTime confirmedAt,
        LocalDateTime deliveredAt,
        LocalDateTime cancelledAt,
        String cancelReason
) {

    public record ShopInfo(Long id, String shopName, String phone) {
    }

    public record Item(Long productId, String productName, String unit, Long price, Integer quantity,
                       Long subtotal, AiLabel aiLabelSnapshot, String imageUrl) {
    }

    /** changedBy: tên shop nếu chủ shop đổi, ngược lại là họ tên người thực hiện. */
    public record History(OrderStatus fromStatus, OrderStatus toStatus, String changedBy, String note,
                          LocalDateTime createdAt) {
    }

    /** @param imageByProductId ảnh đại diện hiện tại của từng sản phẩm (có thể thiếu nếu sản phẩm hết ảnh). */
    public static OrderDetailResponse from(Order o, Map<Long, String> imageByProductId) {
        Shop shop = o.getShop();
        List<Item> items = o.getItems().stream()
                .map(i -> new Item(i.getProduct().getId(), i.getProductName(), i.getUnit(), i.getPrice(),
                        i.getQuantity(), i.getSubtotal(), i.getAiLabelSnapshot(),
                        imageByProductId.get(i.getProduct().getId())))
                .toList();
        List<History> history = o.getHistory().stream()
                .map(h -> new History(h.getFromStatus(), h.getToStatus(), changedByName(h, shop), h.getNote(),
                        h.getCreatedAt()))
                .toList();
        return new OrderDetailResponse(
                o.getId(),
                o.getOrderCode(),
                o.getCheckoutGroupId(),
                o.getStatus(),
                o.getPaymentMethod(),
                o.getPaymentStatus(),
                OrderCustomerDto.from(o.getUser()),
                new ShopInfo(shop.getId(), shop.getShopName(), shop.getPhone()),
                o.getReceiverName(),
                o.getPhone(),
                o.getShippingAddress(),
                o.getNote(),
                items,
                o.getSubtotal(),
                o.getShippingFee(),
                o.getTotal(),
                history,
                o.getCreatedAt(),
                o.getConfirmedAt(),
                o.getDeliveredAt(),
                o.getCancelledAt(),
                o.getCancelReason());
    }

    private static String changedByName(OrderStatusHistory h, Shop shop) {
        if (h.getChangedBy() == null) {
            return null;
        }
        return h.getChangedBy().getId().equals(shop.getUser().getId())
                ? shop.getShopName()
                : h.getChangedBy().getFullName();
    }
}
