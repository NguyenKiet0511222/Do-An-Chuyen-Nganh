package com.nhom5.backend.entity;

import com.nhom5.backend.entity.enums.ProductReviewAction;
import com.nhom5.backend.entity.enums.ProductStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;

/**
 * Lịch sử duyệt sản phẩm (bảng product_review_history, script 06): mỗi lần người bán gửi duyệt hoặc admin
 * duyệt / từ chối / yêu cầu bổ sung / ẩn / bỏ ẩn ghi 1 dòng. Trả về trong GET /admin/products/{id}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_review_history")
public class ProductReviewHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Người thao tác (người bán khi SUBMIT, admin các thao tác còn lại). Null nếu tài khoản đã xoá. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private ProductReviewAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private ProductStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    private ProductStatus toStatus;

    /** Lý do từ chối / yêu cầu bổ sung / ẩn. */
    @Nationalized
    @Column(name = "reason", length = 500)
    private String reason;
}
