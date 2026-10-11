package com.nhom5.backend.dto.order;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.enums.OrderStatus;

import java.util.List;

/** Kết quả POST /orders/checkout (api.md mục 4.6): mỗi shop một đơn, chung checkoutGroupId. */
public record CheckoutResponse(String checkoutGroupId, List<OrderBrief> orders, long grandTotal) {

    public record OrderBrief(Long id, String orderCode, OrderSummaryResponse.ShopBrief shop, OrderStatus status,
                             Long subtotal, Long shippingFee, Long total, int itemCount) {
        public static OrderBrief from(Order o) {
            return new OrderBrief(o.getId(), o.getOrderCode(), OrderSummaryResponse.ShopBrief.from(o.getShop()),
                    o.getStatus(), o.getSubtotal(), o.getShippingFee(), o.getTotal(), o.getItems().size());
        }
    }

    public static CheckoutResponse from(String groupId, List<Order> orders) {
        return new CheckoutResponse(groupId,
                orders.stream().map(OrderBrief::from).toList(),
                orders.stream().mapToLong(Order::getTotal).sum());
    }
}
