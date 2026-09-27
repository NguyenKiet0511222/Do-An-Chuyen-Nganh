package com.nhom5.backend.repository;

import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.entity.enums.ShopStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * GET /api/products (mục 4.4) — mọi tham số lọc đều tuỳ chọn (null = bỏ qua điều kiện đó).
     * categoryId khớp chính danh mục đó HOẶC danh mục cha của nó (cây 2 cấp -> gồm cả danh mục con).
     */
    @Query(value = """
            SELECT p FROM Product p
            JOIN FETCH p.shop s
            JOIN FETCH p.category c
            WHERE p.status = :status
              AND s.status = :shopStatus
              AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:categoryId IS NULL OR c.id = :categoryId OR c.parent.id = :categoryId)
              AND (:shopId IS NULL OR s.id = :shopId)
              AND (:minPrice IS NULL OR p.price >= :minPrice)
              AND (:maxPrice IS NULL OR p.price <= :maxPrice)
              AND (:origin IS NULL OR LOWER(p.origin) LIKE LOWER(CONCAT('%', :origin, '%')))
              AND (:aiLabel IS NULL OR p.aiOverallLabel = :aiLabel)
            """,
            countQuery = """
            SELECT COUNT(p) FROM Product p
            JOIN p.shop s
            JOIN p.category c
            WHERE p.status = :status
              AND s.status = :shopStatus
              AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:categoryId IS NULL OR c.id = :categoryId OR c.parent.id = :categoryId)
              AND (:shopId IS NULL OR s.id = :shopId)
              AND (:minPrice IS NULL OR p.price >= :minPrice)
              AND (:maxPrice IS NULL OR p.price <= :maxPrice)
              AND (:origin IS NULL OR LOWER(p.origin) LIKE LOWER(CONCAT('%', :origin, '%')))
              AND (:aiLabel IS NULL OR p.aiOverallLabel = :aiLabel)
            """)
    Page<Product> searchByStatus(@Param("status") ProductStatus status,
                                 @Param("shopStatus") ShopStatus shopStatus,
                                 @Param("keyword") String keyword,
                                 @Param("categoryId") Long categoryId,
                                 @Param("shopId") Long shopId,
                                 @Param("minPrice") Long minPrice,
                                 @Param("maxPrice") Long maxPrice,
                                 @Param("origin") String origin,
                                 @Param("aiLabel") AiLabel aiLabel,
                                 Pageable pageable);

    /** Trang công khai: luôn cố định APPROVED + ACTIVE. */
    default Page<Product> searchPublicProducts(String keyword, Long categoryId, Long shopId,
                                                Long minPrice, Long maxPrice, String origin,
                                                AiLabel aiLabel, Pageable pageable) {
        return searchByStatus(ProductStatus.APPROVED, ShopStatus.ACTIVE,
                keyword, categoryId, shopId, minPrice, maxPrice, origin, aiLabel, pageable);
    }

    /**
     * GET /api/products/{id} — chi tiết công khai, kèm ảnh + nhãn AI từng ảnh, chỉ khi
     * sản phẩm APPROVED và shop ACTIVE. DISTINCT để tránh trùng dòng do fetch join ảnh.
     */
    @Query("""
            SELECT DISTINCT p FROM Product p
            JOIN FETCH p.shop s
            JOIN FETCH p.category c
            LEFT JOIN FETCH p.images img
            LEFT JOIN FETCH img.aiResult ar
            WHERE p.id = :id
              AND p.status = :status
              AND s.status = :shopStatus
            """)
    Optional<Product> findDetailByIdAndStatus(@Param("id") Long id,
                                              @Param("status") ProductStatus status,
                                              @Param("shopStatus") ShopStatus shopStatus);

    default Optional<Product> findPublicDetailById(Long id) {
        return findDetailByIdAndStatus(id, ProductStatus.APPROVED, ShopStatus.ACTIVE);
    }
}
