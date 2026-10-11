package com.nhom5.backend.dto.order;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentMethod;
import com.nhom5.backend.entity.enums.PaymentStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 1 dòng trong danh sách đơn (GET /seller/orders, GET /orders) — kèm tóm tắt sản phẩm để hiển thị ngay trên bảng.
 * {@code shop} để khách biết đơn thuộc shop nào (1 đơn = 1 shop).
 */
public record OrderSummaryResponse(
        Long id,
        String orderCode,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        OrderCustomerDto customer,
        ShopBrief shop,
        String receiverName,
        String phone,
        List<ItemBrief> items,
        int itemCount,
        Long subtotal,
        Long shippingFee,
        Long total,
        LocalDateTime createdAt
) {

    public record ItemBrief(Long productId, String productName, String unit, Integer quantity) {
    }

    public record ShopBrief(Long id, String shopName) {
        public static ShopBrief from(Shop s) {
            return new ShopBrief(s.getId(), s.getShopName());
        }
    }

    public static OrderSummaryResponse from(Order o) {
        List<ItemBrief> items = o.getItems().stream()
                .map(i -> new ItemBrief(i.getProduct().getId(), i.getProductName(), i.getUnit(), i.getQuantity()))
                .toList();
        return new OrderSummaryResponse(
                o.getId(),
                o.getOrderCode(),
                o.getStatus(),
                o.getPaymentMethod(),
                o.getPaymentStatus(),
                OrderCustomerDto.from(o.getUser()),
                ShopBrief.from(o.getShop()),
                o.getReceiverName(),
                o.getPhone(),
                items,
                items.size(),
                o.getSubtotal(),
                o.getShippingFee(),
                o.getTotal(),
                o.getCreatedAt());
    }
}
