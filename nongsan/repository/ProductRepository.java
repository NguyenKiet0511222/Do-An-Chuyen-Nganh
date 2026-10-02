package com.nongsan.repository;

import com.nongsan.entity.Product;
import com.nongsan.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Dùng cho GET /api/shops/{id}: chỉ hiển thị sản phẩm APPROVED của shop (mục 3.2)
    Page<Product> findByShop_IdAndStatus(Long shopId, ProductStatus status, Pageable pageable);

    // Dùng cho GET /api/categories: đếm số sản phẩm APPROVED theo từng danh mục
    long countByCategory_IdAndStatus(Long categoryId, ProductStatus status);
}
