package com.nhom5.backend.repository;

import com.nhom5.backend.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByProductIdAndUserIdAndOrderId(Long productId, Long userId, Long orderId);

    /** GET /products/{id}/reviews — kèm người đánh giá (tránh N+1). */
    @Query(value = """
            SELECT r FROM Review r
            JOIN FETCH r.user u
            WHERE r.product.id = :productId
            """,
            countQuery = "SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Page<Review> findByProduct(@Param("productId") Long productId, Pageable pageable);

    /** 1 dòng [AVG(rating) (Double, null nếu chưa có), COUNT] của 1 sản phẩm — tính lại products.rating_avg / rating_count. */
    @Query("SELECT AVG(r.rating), COUNT(r) FROM Review r WHERE r.product.id = :productId")
    List<Object[]> ratingOfProduct(@Param("productId") Long productId);

    /** Như trên trên mọi sản phẩm của shop — tính lại shops.rating_avg / rating_count. */
    @Query("SELECT AVG(r.rating), COUNT(r) FROM Review r WHERE r.product.shop.id = :shopId")
    List<Object[]> ratingOfShop(@Param("shopId") Long shopId);
}
