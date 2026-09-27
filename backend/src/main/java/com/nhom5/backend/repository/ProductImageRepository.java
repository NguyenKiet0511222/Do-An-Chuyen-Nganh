package com.nhom5.backend.repository;

import com.nhom5.backend.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    /**
     * Lấy ảnh đại diện cho danh sách sản phẩm (dùng cho GET /api/products).
     * Sắp theo: sản phẩm -> ảnh chính trước (isPrimary DESC) -> displayOrder tăng dần.
     * Ở tầng service chỉ cần lấy dòng ĐẦU TIÊN của mỗi productId.
     */
    @Query("""
            SELECT img FROM ProductImage img
            WHERE img.product.id IN :productIds
            ORDER BY img.product.id ASC, img.primary DESC, img.displayOrder ASC
            """)
    List<ProductImage> findForPrimaryPick(@Param("productIds") List<Long> productIds);
}
