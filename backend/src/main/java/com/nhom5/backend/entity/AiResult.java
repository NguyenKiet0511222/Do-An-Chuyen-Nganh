package com.nhom5.backend.entity;

import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ai_results")
public class AiResult extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private AiSource source;

    /** null với QUICK_CHECK; unique với PRODUCT_IMAGE (1 ảnh <-> 1 kết quả mới nhất). */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_image_id", unique = true)
    private ProductImage productImage;

    /** Người tải ảnh, null nếu không xác định. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "produce", length = 50)
    private String produce;

    @Enumerated(EnumType.STRING)
    @Column(name = "label", nullable = false, length = 20)
    private AiLabel label;

    @Column(name = "confidence", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal confidence = BigDecimal.ZERO;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 30)
    @Builder.Default
    private AiReviewStatus reviewStatus = AiReviewStatus.AUTO_ACCEPTED;

    /** Nhãn hiển thị = finalLabel ?? label. */
    @Enumerated(EnumType.STRING)
    @Column(name = "final_label", length = 20)
    private AiLabel finalLabel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Nationalized
    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "inference_ms")
    private Integer inferenceMs;
}
