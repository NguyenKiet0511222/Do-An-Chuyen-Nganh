package com.nhom5.backend.dto.order;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentMethod;
import com.nhom5.backend.entity.enums.PaymentStatus;

import java.time.LocalDateTime;
import java.util.List;

/** 1 dòng trong danh sách đơn của shop (GET /seller/orders) — kèm tóm tắt sản phẩm để hiển thị ngay trên bảng. */
public record OrderSummaryResponse(
        Long id,
        String orderCode,
        OrderStatus status,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        OrderCustomerDto customer,
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
