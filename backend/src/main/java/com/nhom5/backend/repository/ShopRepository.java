package com.nhom5.backend.repository;

import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.ShopStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {

    Optional<Shop> findByUserId(Long userId);

    /** Lấy shop của nhiều user một lần (tránh N+1 khi liệt kê user cho admin). */
    List<Shop> findByUserIdIn(Collection<Long> userIds);

    boolean existsByUserId(Long userId);

    long countByStatus(ShopStatus status);

    /** Trang shop công khai: chỉ shop ACTIVE. */
    Optional<Shop> findByIdAndStatus(Long id, ShopStatus status);

    /** GET /admin/shops — tìm kiếm với mọi tham số tuỳ chọn. */
    @Query("""
            SELECT s FROM Shop s
            WHERE (:status IS NULL OR s.status = :status)
              AND (:province IS NULL OR s.province = :province)
              AND (:keyword IS NULL
                   OR LOWER(s.shopName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(s.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Shop> search(@Param("status") ShopStatus status,
                      @Param("province") String province,
                      @Param("keyword") String keyword,
                      Pageable pageable);
}
