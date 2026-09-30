package com.nhom5.backend.repository;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Chỉ lấy đơn thuộc shop của người bán đang đăng nhập — đơn shop khác coi như không tồn tại. */
    Optional<Order> findByIdAndShopId(Long id, Long shopId);

    /**
     * GET /seller/orders (mục 4.8). allStatuses = true -> bỏ qua lọc trạng thái
     * (tránh truyền danh sách rỗng vào IN). from/to null = không giới hạn.
     */
    @Query(value = """
            SELECT o FROM Order o
            JOIN FETCH o.user u
            WHERE o.shop.id = :shopId
              AND (:allStatuses = true OR o.status IN :statuses)
              AND (:from IS NULL OR o.createdAt >= :from)
              AND (:to IS NULL OR o.createdAt < :to)
            """,
            countQuery = """
            SELECT COUNT(o) FROM Order o
            WHERE o.shop.id = :shopId
              AND (:allStatuses = true OR o.status IN :statuses)
              AND (:from IS NULL OR o.createdAt >= :from)
              AND (:to IS NULL OR o.createdAt < :to)
            """)
    Page<Order> searchByShop(@Param("shopId") Long shopId,
                             @Param("allStatuses") boolean allStatuses,
                             @Param("statuses") Collection<OrderStatus> statuses,
                             @Param("from") LocalDateTime from,
                             @Param("to") LocalDateTime to,
                             Pageable pageable);

    long countByShopIdAndStatus(Long shopId, OrderStatus status);

    /** Doanh thu = tổng tiền các đơn đã giao trong khoảng [start, end) theo delivered_at. */
    @Query("""
            SELECT COALESCE(SUM(o.total), 0) FROM Order o
            WHERE o.shop.id = :shopId
              AND o.status = :status
              AND o.deliveredAt >= :start AND o.deliveredAt < :end
            """)
    long sumTotalByShopAndStatusBetween(@Param("shopId") Long shopId,
                                        @Param("status") OrderStatus status,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);
}
