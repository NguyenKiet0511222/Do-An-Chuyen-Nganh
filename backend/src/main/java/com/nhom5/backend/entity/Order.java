package com.nhom5.backend.entity;

import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentMethod;
import com.nhom5.backend.entity.enums.PaymentStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Bảng orders — 1 đơn = 1 shop (checkout nhiều shop tách thành nhiều đơn chung checkout_group_id).
 * Giá, tên sản phẩm được snapshot vào order_items tại thời điểm đặt.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "orders", uniqueConstraints = @UniqueConstraint(name = "uk_orders_code", columnNames = "order_code"))
public class Order extends BaseEntity {

    /** Dạng DH-{yyyy}-{5 chữ số}, ví dụ DH-2026-01187. */
    @Column(name = "order_code", nullable = false, length = 20)
    private String orderCode;

    /** UUID chung cho các đơn tạo ra từ cùng một lần checkout. */
    @Column(name = "checkout_group_id", nullable = false, length = 36)
    private String checkoutGroupId;

    /** Khách đặt đơn. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Nationalized
    @Column(name = "receiver_name", nullable = false, length = 100)
    private String receiverName;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Nationalized
    @Column(name = "shipping_address", nullable = false, length = 500)
    private String shippingAddress;

    /** Ghi chú của khách khi đặt. */
    @Nationalized
    @Column(name = "note", length = 500)
    private String note;

    /** VND. */
    @Column(name = "subtotal", nullable = false)
    private Long subtotal;

    @Column(name = "shipping_fee", nullable = false)
    private Long shippingFee;

    @Column(name = "total", nullable = false)
    private Long total;

    @Nationalized
    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    @BatchSize(size = 50)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    /** Mỗi lần đổi trạng thái ghi 1 dòng (api.md mục 3.5). */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    @Builder.Default
    private List<OrderStatusHistory> history = new ArrayList<>();

    public void addItem(OrderItem item) {
        item.setOrder(this);
        items.add(item);
    }

    public void addHistory(OrderStatusHistory entry) {
        entry.setOrder(this);
        history.add(entry);
    }
}
