package com.nhom5.backend.entity;

import com.nhom5.backend.entity.enums.ShopStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "shops", uniqueConstraints = @UniqueConstraint(name = "uk_shops_user", columnNames = "user_id"))
public class Shop extends BaseEntity {

    /** 1 user ↔ 1 shop. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Nationalized
    @Column(name = "shop_name", nullable = false, length = 150)
    private String shopName;

    @Nationalized
    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Nationalized
    @Column(name = "province", length = 100)
    private String province;

    @Nationalized
    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    @Nationalized
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ShopStatus status = ShopStatus.PENDING_VERIFICATION;

    @Column(name = "rating_avg", nullable = false, precision = 2, scale = 1)
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Integer ratingCount = 0;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
}