package com.nongsan.repository;

import com.nongsan.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    Optional<ProductImage> findFirstByProduct_IdAndIsPrimaryTrue(Long productId);

    Optional<ProductImage> findFirstByProduct_IdOrderByDisplayOrderAsc(Long productId);
}
