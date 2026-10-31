package com.nhom5.backend.service;

import com.nhom5.backend.dto.order.OrderDetailResponse;
import com.nhom5.backend.dto.order.OrderStatusUpdateRequest;
import com.nhom5.backend.dto.order.OrderSummaryResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/** Đơn hàng của shop (api.md mục 3.5, 4.8): xem danh sách, chi tiết và chuyển trạng thái từng bước. */
@Service
@RequiredArgsConstructor
@Transactional
public class SellerOrderService {

    private final SellerShopService sellerShopService;
    private final OrderRepository orderRepository;
    private final OrderSupport orderSupport;

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
        return orderSupport.toDetail(requireOwnOrder(userId, orderId));
    }

    /** Chuyển trạng thái theo bảng 3.5 (OrderSupport.STAFF_TRANSITIONS), ghi order_status_history. */
    public OrderDetailResponse changeStatus(Long userId, Long orderId, OrderStatusUpdateRequest request) {
        Order order = requireOwnOrder(userId, orderId);
        orderSupport.applyStaffTransition(order, userId, request);
        orderRepository.flush();
        return orderSupport.toDetail(order);
    }

    // ---------- helpers ----------

    private Order requireOwnOrder(Long userId, Long orderId) {
        Shop shop = sellerShopService.requireShop(userId);
        return orderRepository.findByIdAndShopId(orderId, shop.getId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn hàng #" + orderId));
    }
}
