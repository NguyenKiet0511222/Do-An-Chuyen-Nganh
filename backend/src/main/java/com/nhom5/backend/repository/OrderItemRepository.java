package com.nhom5.backend.repository;

import com.nhom5.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Sản phẩm đã từng nằm trong đơn thì không được xoá (chỉ được ẩn). */
    boolean existsByProductId(Long productId);
}
