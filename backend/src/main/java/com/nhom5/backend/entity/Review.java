package com.nhom5.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;

/**
 * Đánh giá sản phẩm (bảng reviews, script 08 — api.md mục 3.6): khách có đơn DELIVERED chứa sản phẩm
 * mới được đánh giá, mỗi (sản phẩm, khách, đơn) 1 lần. Lưu xong tính lại rating của sản phẩm và shop.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reviews", uniqueConstraints = @UniqueConstraint(name = "uk_reviews_product_user_order",
        columnNames = {"product_id", "user_id", "order_id"}))
public class Review extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** 1–5 sao (cột TINYINT). */
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Nationalized
    @Column(name = "comment", length = 1000)
    private String comment;
}
