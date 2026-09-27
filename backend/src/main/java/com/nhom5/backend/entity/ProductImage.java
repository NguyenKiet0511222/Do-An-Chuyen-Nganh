package com.nhom5.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product_images")
public class ProductImage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "url", nullable = false, length = 500)
    private String url;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean primary = false;

    /** 1 ảnh sản phẩm <-> 1 kết quả AI mới nhất. Phía sở hữu FK là AiResult (product_image_id). */
    @OneToOne(mappedBy = "productImage", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private AiResult aiResult;

    public Boolean isPrimary() {
        return primary;
    }

    public void setAiResult(AiResult aiResult) {
        this.aiResult = aiResult;
        if (aiResult != null) {
            aiResult.setProductImage(this);
        }
    }
}
