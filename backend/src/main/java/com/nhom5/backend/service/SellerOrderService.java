package com.nhom5.backend.service;

import com.nhom5.backend.dto.order.OrderDetailResponse;
import com.nhom5.backend.dto.order.OrderStatusUpdateRequest;
import com.nhom5.backend.dto.order.OrderSummaryResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.OrderItem;
import com.nhom5.backend.entity.OrderStatusHistory;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.repository.ProductImageRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Đơn hàng của shop (api.md mục 3.5, 4.8): xem danh sách, chi tiết và chuyển trạng thái từng bước. */
@Service
@RequiredArgsConstructor
@Transactional
public class SellerOrderService {

    /** Bảng 3.5 — các bước người bán được phép chuyển. SHIPPING không được huỷ. */
    private static final Map<OrderStatus, Set<OrderStatus>> SELLER_TRANSITIONS = Map.of(
            OrderStatus.PENDING, EnumSet.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, EnumSet.of(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
            OrderStatus.PROCESSING, EnumSet.of(OrderStatus.SHIPPING, OrderStatus.CANCELLED),
            OrderStatus.SHIPPING, EnumSet.of(OrderStatus.DELIVERED));

    private final SellerShopService sellerShopService;
    private final OrderRepository orderRepository;
    private final ProductImageRepository productImageRepository;
    private final UserRepository userRepository;

    /** from / to lọc theo ngày đặt (bao gồm cả 2 đầu). status nhận 1 hoặc nhiều giá trị cách nhau dấu phẩy. */
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> list(Long userId, String statusCsv, LocalDate from, LocalDate to,
                                                   int page, int size) {
        if (from != null && to != null && from.isAfter(to)) {
            throw AppException.badRequest("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
        Shop shop = sellerShopService.requireShop(userId);
        Set<OrderStatus> statuses = QueryParams.parseEnumList(statusCsv, OrderStatus.class, "status");
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

        Page<Order> orders = orderRepository.searchByShop(shop.getId(), statuses.isEmpty(),
                statuses.isEmpty() ? EnumSet.allOf(OrderStatus.class) : statuses,
                from == null ? null : from.atStartOfDay(),
                to == null ? null : to.plusDays(1).atStartOfDay(),
                pageable);

        List<OrderSummaryResponse> content = orders.getContent().stream().map(OrderSummaryResponse::from).toList();
        return PageResponse.from(new PageImpl<>(content, pageable, orders.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse get(Long userId, Long orderId) {
        return toDetail(requireOwnOrder(userId, orderId));
    }

    /**
     * Chuyển trạng thái theo bảng 3.5 và ghi order_status_history.
     * CANCELLED: bắt buộc cancelReason, hoàn tồn kho. DELIVERED: thanh toán PAID, cộng số đã bán.
     */
    public OrderDetailResponse changeStatus(Long userId, Long orderId, OrderStatusUpdateRequest request) {
        Order order = requireOwnOrder(userId, orderId);
        OrderStatus from = order.getStatus();
        OrderStatus to = request.status();
        if (!SELLER_TRANSITIONS.getOrDefault(from, Set.of()).contains(to)) {
            throw AppException.conflict("Chuyển trạng thái không hợp lệ (" + from + " -> " + to + ")");
        }

        LocalDateTime now = LocalDateTime.now();
        String historyNote = trimToNull(request.note());
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
            case CANCELLED -> {
                String reason = trimToNull(request.cancelReason());
                if (reason == null) {
                    throw AppException.badRequest("Vui lòng nhập lý do huỷ đơn");
                }
                order.setCancelReason(reason);
                order.setCancelledAt(now);
                for (OrderItem item : order.getItems()) {
                    Product p = item.getProduct();
                    p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
                }
                if (historyNote == null) {
                    historyNote = reason;
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
                .changedBy(userRepository.getReferenceById(userId))
                .note(historyNote)
                .build());
        orderRepository.flush();
        return toDetail(order);
    }

    // ---------- helpers ----------

    private Order requireOwnOrder(Long userId, Long orderId) {
        Shop shop = sellerShopService.requireShop(userId);
        return orderRepository.findByIdAndShopId(orderId, shop.getId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn hàng #" + orderId));
    }

    private OrderDetailResponse toDetail(Order order) {
        List<Long> productIds = order.getItems().stream().map(i -> i.getProduct().getId()).distinct().toList();
        Map<Long, String> images = new LinkedHashMap<>();
        if (!productIds.isEmpty()) {
            for (ProductImage img : productImageRepository.findForPrimaryPick(productIds)) {
                images.putIfAbsent(img.getProduct().getId(), img.getUrl());
            }
        }
        return OrderDetailResponse.from(order, images);
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
