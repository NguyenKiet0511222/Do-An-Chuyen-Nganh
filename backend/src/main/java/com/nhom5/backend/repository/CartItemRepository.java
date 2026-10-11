package com.nhom5.backend.repository;

import com.nhom5.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /** Giỏ của 1 user kèm sản phẩm + shop, xếp theo shop để nhóm (mục 4.5) rồi theo thứ tự thêm vào. */
    @Query("""
            SELECT c FROM CartItem c
            JOIN FETCH c.product p
            JOIN FETCH p.shop s
            WHERE c.user.id = :userId
            ORDER BY s.id ASC, c.id ASC
            """)
    List<CartItem> findByUserIdWithProduct(@Param("userId") Long userId);

    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

    Optional<CartItem> findByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);

    /** Gọi trước khi xoá sản phẩm (sản phẩm đang nằm trong giỏ ai đó). */
    void deleteByProductId(Long productId);
}
