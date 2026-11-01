package com.nhom5.backend.service;

import com.nhom5.backend.dto.order.OrderDetailResponse;
import com.nhom5.backend.dto.order.OrderStatusUpdateRequest;
import com.nhom5.backend.dto.order.OrderSummaryResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentMethod;
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

/** Admin quản lý mọi đơn của sàn (api.md mục 3.5, 4.9): danh sách, chi tiết, chuyển trạng thái. */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderSupport orderSupport;

    /** from / to lọc theo ngày đặt (bao gồm cả 2 đầu). status nhận 1 hoặc nhiều giá trị cách nhau dấu phẩy. */
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> list(String statusCsv, String keyword, Long shopId,
                                                   PaymentMethod paymentMethod, LocalDate from, LocalDate to,
                                                   int page, int size) {
        if (from != null && to != null && from.isAfter(to)) {
            throw AppException.badRequest("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
        Set<OrderStatus> statuses = QueryParams.parseEnumList(statusCsv, OrderStatus.class, "status");
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

        Page<Order> orders = orderRepository.searchAdmin(statuses.isEmpty(),
                statuses.isEmpty() ? EnumSet.allOf(OrderStatus.class) : statuses,
                QueryParams.normalize(keyword), shopId, paymentMethod,
                from == null ? null : from.atStartOfDay(),
                to == null ? null : to.plusDays(1).atStartOfDay(),
                pageable);

        List<OrderSummaryResponse> content = orders.getContent().stream().map(OrderSummaryResponse::from).toList();
        return PageResponse.from(new PageImpl<>(content, pageable, orders.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse get(Long orderId) {
        return orderSupport.toDetail(requireOrder(orderId));
    }

    /** Admin chuyển được như người bán (bảng 3.5), ghi lịch sử với người thao tác là admin. */
    public OrderDetailResponse changeStatus(Long adminId, Long orderId, OrderStatusUpdateRequest request) {
        Order order = requireOrder(orderId);
        orderSupport.applyStaffTransition(order, adminId, request);
        orderRepository.flush();
        return orderSupport.toDetail(order);
    }

    private Order requireOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn hàng #" + orderId));
    }
}
