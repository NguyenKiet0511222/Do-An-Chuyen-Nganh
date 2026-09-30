package com.nhom5.backend.repository;

import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AiResultRepository extends JpaRepository<AiResult, Long> {

    /** GET /seller/ai/results — kết quả AI của ảnh sản phẩm thuộc shop, lọc tuỳ chọn theo reviewStatus. */
    @Query(value = """
            SELECT a FROM AiResult a
            JOIN FETCH a.productImage i
            JOIN FETCH i.product p
            WHERE a.source = :source
              AND p.shop.id = :shopId
              AND (:allStatuses = true OR a.reviewStatus IN :statuses)
            """,
            countQuery = """
            SELECT COUNT(a) FROM AiResult a
            WHERE a.source = :source
              AND a.productImage.product.shop.id = :shopId
              AND (:allStatuses = true OR a.reviewStatus IN :statuses)
            """)
    Page<AiResult> searchByShop(@Param("source") AiSource source,
                                @Param("shopId") Long shopId,
                                @Param("allStatuses") boolean allStatuses,
                                @Param("statuses") Collection<AiReviewStatus> statuses,
                                Pageable pageable);

    /** Đếm theo reviewStatus cho dashboard: mỗi dòng [AiReviewStatus, Long]. */
    @Query("""
            SELECT a.reviewStatus, COUNT(a) FROM AiResult a
            WHERE a.productImage.product.shop.id = :shopId
            GROUP BY a.reviewStatus
            """)
    List<Object[]> countByReviewStatusForShop(@Param("shopId") Long shopId);

    /** Số ảnh có nhãn hiển thị (finalLabel ?? label) bằng :label. */
    @Query("""
            SELECT COUNT(a) FROM AiResult a
            WHERE a.productImage.product.shop.id = :shopId
              AND (a.finalLabel = :label OR (a.finalLabel IS NULL AND a.label = :label))
            """)
    long countByDisplayLabelForShop(@Param("shopId") Long shopId, @Param("label") AiLabel label);
}
