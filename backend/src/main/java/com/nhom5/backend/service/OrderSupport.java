package com.nhom5.backend.service;

import com.nhom5.backend.dto.order.OrderDetailResponse;
import com.nhom5.backend.dto.order.OrderStatusUpdateRequest;
import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.OrderItem;
import com.nhom5.backend.entity.OrderStatusHistory;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ProductImageRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Phần dùng chung cho đơn hàng giữa người bán (SellerOrderService), admin (AdminOrderService) và khách
 * (CustomerOrderService): chuyển trạng thái, huỷ đơn + hoàn tồn kho, dựng khuôn Order (detail).
 * Gọi trong transaction của service.
 */
@Component
@RequiredArgsConstructor
public class OrderSupport {

    /**
     * Bảng 3.5 — các bước người bán và admin được chuyển (2 bên giống nhau). SHIPPING không được huỷ.
     * Frontend chép bảng này ở utils/orderStatus.js — sửa ở đây thì sửa cả bên đó.
     */
    public static final Map<OrderStatus, Set<OrderStatus>> STAFF_TRANSITIONS = Map.of(
            OrderStatus.PENDING, EnumSet.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, EnumSet.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING, EnumSet.of(OrderStatus.SHIPPING, OrderStatus.CANCELLED),
            OrderStatus.SHIPPING, EnumSet.of(OrderStatus.DELIVERED));

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;

    /**
     * Chuyển trạng thái theo bảng 3.5 (STAFF_TRANSITIONS) và ghi order_status_history.
     * CANCELLED: bắt buộc cancelReason, hoàn tồn kho. DELIVERED: thanh toán PAID, cộng số đã bán.
     */
    public void applyStaffTransition(Order order, Long actorUserId, OrderStatusUpdateRequest request) {
        OrderStatus from = order.getStatus();
        OrderStatus to = request.status();
        if (!STAFF_TRANSITIONS.getOrDefault(from, Set.of()).contains(to)) {
            throw AppException.conflict("Chuyển trạng thái không hợp lệ (" + from + " -> " + to + ")");
        }

        if (to == OrderStatus.CANCELLED) {
            cancel(order, actorUserId, request.cancelReason(), request.note());
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        switch (to) {
            case CONFIRMED -> order.setConfirmedAt(now);
            case DELIVERED -> {
                order.setDeliveredAt(now);
                order.setPaymentStatus(PaymentStatus.PAID);
                for (OrderItem item : order.getItems()) {
                    Product p = item.getProduct();
                    p.setSoldCount(p.getSoldCount() + item.getQuantity());
                }
            }
            default -> {
                // PROCESSING, SHIPPING: chỉ đổi trạng thái
            }
        }
        order.setStatus(to);
        order.addHistory(OrderStatusHistory.builder()
                .fromStatus(from)
                .toStatus(to)
                .changedBy(userRepository.getReferenceById(actorUserId))
                .note(trimToNull(request.note()))
                .build());
    }

    /**
     * Huỷ đơn (mục 3.5): bắt buộc cancelReason, hoàn tồn kho từng dòng, ghi lịch sử.
     * Caller tự kiểm tra trạng thái hiện tại có được huỷ hay không.
     *
     * @param note ghi chú lịch sử; null -> dùng cancelReason
     */
    public void cancel(Order order, Long actorUserId, String cancelReason, String note) {
        String reason = trimToNull(cancelReason);
        if (reason == null) {
            throw AppException.badRequest("Vui lòng nhập lý do huỷ đơn");
        }
        OrderStatus from = order.getStatus();
        order.setCancelReason(reason);
        order.setCancelledAt(LocalDateTime.now());
        order.setStatus(OrderStatus.CANCELLED);
        for (OrderItem item : order.getItems()) {
            productRepository.restoreStock(item.getProduct().getId(), item.getQuantity());
        }
        String historyNote = trimToNull(note);
        order.addHistory(OrderStatusHistory.builder()
                .fromStatus(from)
                .toStatus(OrderStatus.CANCELLED)
                .changedBy(userRepository.getReferenceById(actorUserId))
                .note(historyNote == null ? reason : historyNote)
                .build());
    }

    /** Khuôn "Order (detail)" mục 4.6, kèm ảnh chính của từng sản phẩm. */
    public OrderDetailResponse toDetail(Order order) {
        List<Long> productIds = order.getItems().stream().map(i -> i.getProduct().getId()).distinct().toList();
        Map<Long, String> images = new LinkedHashMap<>();
        if (!productIds.isEmpty()) {
            for (ProductImage img : productImageRepository.findForPrimaryPick(productIds)) {
                images.putIfAbsent(img.getProduct().getId(), img.getUrl());
            }
        }
        return OrderDetailResponse.from(order, images);
    }

    public static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
