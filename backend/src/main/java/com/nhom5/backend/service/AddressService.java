package com.nhom5.backend.service;

import com.nhom5.backend.dto.response.AddressResponse;
import com.nhom5.backend.entity.Address;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/** Sổ địa chỉ của chính người đang đăng nhập (api.md mục 4.2) — userId luôn lấy từ JWT, không nhận từ URL. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AddressService {

    private final AddressRepository addressRepository;

    /** Địa chỉ mặc định lên đầu. */
    public List<AddressResponse> listMine(Long userId) {
        return addressRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing((Address a) -> !Boolean.TRUE.equals(a.getDefaultAddress()))
                        .thenComparing(Address::getId))
                .map(AddressResponse::from)
                .toList();
    }

    /** Địa chỉ của người khác trả 404 như không tồn tại. */
    public AddressResponse getMine(Long userId, Long addressId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .map(AddressResponse::from)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy địa chỉ"));
    }
}
