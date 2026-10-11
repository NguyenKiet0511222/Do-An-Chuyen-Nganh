package com.nhom5.backend.repository;

import com.nhom5.backend.entity.ProductReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductReviewHistoryRepository extends JpaRepository<ProductReviewHistory, Long> {

    /** Lịch sử theo thứ tự thời gian, kèm người thao tác (LEFT JOIN vì actor có thể null). */
    @Query("""
            SELECT h FROM ProductReviewHistory h
            LEFT JOIN FETCH h.actor a
            WHERE h.product.id = :productId
            ORDER BY h.id ASC
            """)
    List<ProductReviewHistory> findByProductId(@Param("productId") Long productId);

    /** Gọi trước khi xoá sản phẩm. */
    void deleteByProductId(Long productId);
}
