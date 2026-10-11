package com.nhom5.backend.service;

import com.nhom5.backend.dto.order.OrderDetailResponse;
import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.OrderItem;
import com.nhom5.backend.entity.OrderStatusHistory;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ProductImageRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Phần dùng chung cho đơn hàng giữa người bán (SellerOrderService) và khách (CustomerOrderService):
 * huỷ đơn + hoàn tồn kho, dựng khuôn Order (detail). Gọi trong transaction của service.
 */
@Component
@RequiredArgsConstructor
public class OrderSupport {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;

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
