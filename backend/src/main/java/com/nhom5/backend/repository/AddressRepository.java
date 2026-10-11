package com.nhom5.backend.repository;

import com.nhom5.backend.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByUserId(Long userId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);

    Optional<Address> findByUserIdAndDefaultAddressTrue(Long userId);

    long countByUserId(Long userId);

    boolean existsByUserIdAndDefaultAddressTrue(Long userId);

    /** Địa chỉ cũ nhất còn lại — đôn lên mặc định khi xoá địa chỉ mặc định. */
    Optional<Address> findFirstByUserIdOrderByIdAsc(Long userId);
}
