package com.nhom5.backend.entity;

import com.nhom5.backend.entity.enums.AiLabel;
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

/** Dòng sản phẩm trong đơn — tên, đơn vị, giá, nhãn AI là snapshot lúc đặt hàng. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "order_items")
public class OrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Nationalized
    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Nationalized
    @Column(name = "unit", nullable = false, length = 20)
    private String unit;

    /** Đơn giá VND tại thời điểm đặt. */
    @Column(name = "price", nullable = false)
    private Long price;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "subtotal", nullable = false)
    private Long subtotal;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_label_snapshot", length = 20)
    private AiLabel aiLabelSnapshot;
}
