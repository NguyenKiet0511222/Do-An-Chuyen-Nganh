package com.nhom5.backend.service;

import com.nhom5.backend.dto.admin.AdminDashboardSummaryResponse;
import com.nhom5.backend.dto.admin.AdminProductResponse;
import com.nhom5.backend.dto.admin.RevenuePointResponse;
import com.nhom5.backend.dto.order.OrderSummaryResponse;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.AiResultRepository;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Số liệu tổng quan toàn sàn cho admin (api.md mục 4.9). Ngày tính theo giờ server. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    static final int MAX_REVENUE_DAYS = 90;
    static final int MAX_LIST_LIMIT = 20;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final AiResultRepository aiResultRepository;
    private final AdminProductService adminProductService;

    public AdminDashboardSummaryResponse summary() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);
        long todayRevenue = orderRepository.sumTotalByStatusBetween(OrderStatus.DELIVERED, startOfToday, startOfTomorrow);
        long yesterdayRevenue = orderRepository.sumTotalByStatusBetween(OrderStatus.DELIVERED,
                startOfToday.minusDays(1), startOfToday);

        return new AdminDashboardSummaryResponse(
                todayRevenue,
                changePct(todayRevenue, yesterdayRevenue),
                orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startOfToday, startOfTomorrow),
                orderRepository.countByStatus(OrderStatus.PENDING),
                productRepository.countByStatus(ProductStatus.PENDING),
                aiResultRepository.countQueue(AiSource.PRODUCT_IMAGE, AiReviewStatus.PENDING_REVIEW,
                        AdminAiService.QUEUE_PRODUCT_STATUSES),
                aiResultRepository.countQueueByLabel(AiSource.PRODUCT_IMAGE, AiReviewStatus.PENDING_REVIEW,
                        AdminAiService.QUEUE_PRODUCT_STATUSES, AiLabel.ROTTEN),
                shopRepository.countByStatus(ShopStatus.PENDING_VERIFICATION),
                userRepository.countByRole(Role.CUSTOMER),
                shopRepository.countByStatus(ShopStatus.ACTIVE));
    }

    /** days ngày gần nhất tính cả hôm nay (1–90), ngày không có đơn vẫn có điểm với revenue = 0. */
    public List<RevenuePointResponse> revenue(int days) {
        if (days < 1 || days > MAX_REVENUE_DAYS) {
            throw AppException.badRequest("Số ngày phải từ 1 đến " + MAX_REVENUE_DAYS);
        }
        LocalDate today = LocalDate.now();
        LocalDate firstDay = today.minusDays(days - 1L);

        // Gom theo ngày ở Java để không phụ thuộc hàm ngày khác nhau giữa H2 (test) và SQL Server
        Map<LocalDate, long[]> byDay = new TreeMap<>();
        for (LocalDate d = firstDay; !d.isAfter(today); d = d.plusDays(1)) {
            byDay.put(d, new long[2]);
        }
        for (Object[] row : orderRepository.findDeliveredAmountsBetween(OrderStatus.DELIVERED,
                firstDay.atStartOfDay(), today.plusDays(1).atStartOfDay())) {
            long[] point = byDay.get(((LocalDateTime) row[0]).toLocalDate());
            if (point != null) {
                point[0] += (Long) row[1];
                point[1]++;
            }
        }

        List<RevenuePointResponse> result = new ArrayList<>(byDay.size());
        byDay.forEach((date, point) -> result.add(new RevenuePointResponse(date, point[0], point[1])));
        return result;
    }

    /** Đơn mới nhất toàn sàn (khuôn rút gọn như GET /admin/orders). */
    public List<OrderSummaryResponse> recentOrders(int limit) {
        var pageable = QueryParams.pageable(0, requireLimit(limit), Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return orderRepository.findAll(pageable).getContent().stream().map(OrderSummaryResponse::from).toList();
    }

    /** Sản phẩm đang chờ duyệt, kèm nhãn AI tổng hợp (khuôn như GET /admin/products). */
    public List<AdminProductResponse> pendingProducts(int limit) {
        return adminProductService.search(ProductStatus.PENDING.name(), null, null, null, null, null, null,
                0, requireLimit(limit)).content();
    }

    private static int requireLimit(int limit) {
        if (limit < 1 || limit > MAX_LIST_LIMIT) {
            throw AppException.badRequest("limit phải từ 1 đến " + MAX_LIST_LIMIT);
        }
        return limit;
    }

    private static Double changePct(long today, long yesterday) {
        if (yesterday == 0) {
            return null;
        }
        return BigDecimal.valueOf((today - yesterday) * 100.0 / yesterday)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
