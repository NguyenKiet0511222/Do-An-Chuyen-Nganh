package com.nhom5.backend.repository;

import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import com.nhom5.backend.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

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

    // ---------- Admin kiểm định AI (docs/1910.md mục 2, 7.2) ----------
    // Điều kiện hàng chờ: ảnh :queueStatus (PENDING_REVIEW) chỉ tính khi sản phẩm thuộc :queueProductStatuses
    // (PENDING / APPROVED / HIDDEN); kết quả đã kiểm định thì luôn lấy để tra lịch sử.

    /**
     * GET /admin/ai/results — label lọc theo nhãn hiển thị (finalLabel ?? label); from/to lọc createdAt trong [from, to).
     * Fetch sẵn ảnh -> sản phẩm -> shop / danh mục và người kiểm định để map DTO không phát sinh N+1.
     */
    @Query(value = """
            SELECT a FROM AiResult a
            JOIN FETCH a.productImage i
            JOIN FETCH i.product p
            JOIN FETCH p.shop s
            JOIN FETCH p.category c
            LEFT JOIN FETCH a.reviewedBy rb
            WHERE a.source = :source
              AND a.reviewStatus IN :statuses
              AND (a.reviewStatus <> :queueStatus OR p.status IN :queueProductStatuses)
              AND (:label IS NULL OR a.finalLabel = :label OR (a.finalLabel IS NULL AND a.label = :label))
              AND (:shopId IS NULL OR s.id = :shopId)
              AND (:produce IS NULL OR a.produce = :produce)
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt < :to)
            """,
            countQuery = """
            SELECT COUNT(a) FROM AiResult a
            JOIN a.productImage i
            JOIN i.product p
            WHERE a.source = :source
              AND a.reviewStatus IN :statuses
              AND (a.reviewStatus <> :queueStatus OR p.status IN :queueProductStatuses)
              AND (:label IS NULL OR a.finalLabel = :label OR (a.finalLabel IS NULL AND a.label = :label))
              AND (:shopId IS NULL OR p.shop.id = :shopId)
              AND (:produce IS NULL OR a.produce = :produce)
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt < :to)
            """)
    Page<AiResult> searchForAdmin(@Param("source") AiSource source,
                                  @Param("statuses") Collection<AiReviewStatus> statuses,
                                  @Param("queueStatus") AiReviewStatus queueStatus,
                                  @Param("queueProductStatuses") Collection<ProductStatus> queueProductStatuses,
                                  @Param("label") AiLabel label,
                                  @Param("shopId") Long shopId,
                                  @Param("produce") String produce,
                                  @Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to,
                                  Pageable pageable);

    /** GET /admin/ai/results/{id} và PATCH review — cùng các fetch như danh sách. */
    @Query("""
            SELECT a FROM AiResult a
            JOIN FETCH a.productImage i
            JOIN FETCH i.product p
            JOIN FETCH p.shop s
            JOIN FETCH p.category c
            LEFT JOIN FETCH a.reviewedBy rb
            WHERE a.id = :id
              AND a.source = :source
            """)
    Optional<AiResult> findDetailForAdmin(@Param("id") Long id, @Param("source") AiSource source);

    /** PATCH /admin/ai/results/accept-bulk — ảnh trong hàng chờ có nhãn :label và confidence ≥ :minConfidence. */
    @Query("""
            SELECT a FROM AiResult a
            JOIN FETCH a.productImage i
            JOIN FETCH i.product p
            WHERE a.source = :source
              AND a.reviewStatus = :queueStatus
              AND p.status IN :queueProductStatuses
              AND a.label = :label
              AND a.confidence >= :minConfidence
            ORDER BY a.id ASC
            """)
    List<AiResult> findQueueByLabelAndMinConfidence(@Param("source") AiSource source,
                                                    @Param("queueStatus") AiReviewStatus queueStatus,
                                                    @Param("queueProductStatuses") Collection<ProductStatus> queueProductStatuses,
                                                    @Param("label") AiLabel label,
                                                    @Param("minConfidence") BigDecimal minConfidence);

    /** Số ảnh đang chờ kiểm định hiện tại (badge menu, pendingReview) — không lọc ngày. */
    @Query("""
            SELECT COUNT(a) FROM AiResult a
            WHERE a.source = :source
              AND a.reviewStatus = :queueStatus
              AND a.productImage.product.status IN :queueProductStatuses
            """)
    long countQueue(@Param("source") AiSource source,
                    @Param("queueStatus") AiReviewStatus queueStatus,
                    @Param("queueProductStatuses") Collection<ProductStatus> queueProductStatuses);

    /** Thống kê: mỗi dòng [finalLabel (có thể null), label, Long] — nhãn hiển thị = finalLabel ?? label, gộp ở service. */
    @Query("""
            SELECT a.finalLabel, a.label, COUNT(a) FROM AiResult a
            WHERE a.source = :source
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt < :to)
            GROUP BY a.finalLabel, a.label
            """)
    List<Object[]> countByLabelsBetween(@Param("source") AiSource source,
                                        @Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to);

    /** Thống kê: mỗi dòng [AiReviewStatus, Long]. */
    @Query("""
            SELECT a.reviewStatus, COUNT(a) FROM AiResult a
            WHERE a.source = :source
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt < :to)
            GROUP BY a.reviewStatus
            """)
    List<Object[]> countByReviewStatusBetween(@Param("source") AiSource source,
                                              @Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    /** Confidence trung bình, bỏ qua ảnh AI lỗi (model_version null). Không có dòng nào -> null. */
    @Query("""
            SELECT AVG(a.confidence) FROM AiResult a
            WHERE a.source = :source
              AND a.modelVersion IS NOT NULL
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt < :to)
            """)
    Double averageConfidenceBetween(@Param("source") AiSource source,
                                    @Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);

    /** Số ảnh không có kết quả AI (AI tắt / lỗi -> model_version null). */
    @Query("""
            SELECT COUNT(a) FROM AiResult a
            WHERE a.source = :source
              AND a.modelVersion IS NULL
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt < :to)
            """)
    long countAiUnavailableBetween(@Param("source") AiSource source,
                                   @Param("from") LocalDateTime from,
                                   @Param("to") LocalDateTime to);
}
