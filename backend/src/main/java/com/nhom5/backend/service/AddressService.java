package com.nhom5.backend.service;

import com.nhom5.backend.dto.request.AddressRequest;
import com.nhom5.backend.dto.response.AddressResponse;
import com.nhom5.backend.entity.Address;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.AddressRepository;
import com.nhom5.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Sổ địa chỉ của chính người đang đăng nhập (api.md mục 4.2) — userId luôn lấy từ JWT, không nhận từ URL.
 * Quy tắc mặc định: địa chỉ đầu tiên tự là mặc định; đặt mặc định thì bỏ cờ các địa chỉ khác;
 * xoá địa chỉ mặc định thì đôn địa chỉ cũ nhất còn lại lên.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

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
        return AddressResponse.from(requireMine(userId, addressId));
    }

    @Transactional
    public AddressResponse create(Long userId, AddressRequest request) {
        boolean first = addressRepository.countByUserId(userId) == 0;
        boolean makeDefault = first || Boolean.TRUE.equals(request.isDefault());
        if (makeDefault) {
            clearDefault(userId);
        }
        Address address = Address.builder()
                .user(userRepository.getReferenceById(userId))
                .defaultAddress(makeDefault)
                .build();
        apply(address, request);
        return AddressResponse.from(addressRepository.save(address));
    }

    /** isDefault=false trên địa chỉ đang mặc định thì bỏ qua (muốn đổi mặc định thì đặt cho địa chỉ khác). */
    @Transactional
    public AddressResponse update(Long userId, Long addressId, AddressRequest request) {
        Address address = requireMine(userId, addressId);
        apply(address, request);
        if (Boolean.TRUE.equals(request.isDefault()) && !Boolean.TRUE.equals(address.getDefaultAddress())) {
            clearDefault(userId);
            address.setDefaultAddress(true);
        }
        return AddressResponse.from(address);
    }

    @Transactional
    public void delete(Long userId, Long addressId) {
        Address address = requireMine(userId, addressId);
        boolean wasDefault = Boolean.TRUE.equals(address.getDefaultAddress());
        addressRepository.delete(address);
        addressRepository.flush();
        if (wasDefault) {
            addressRepository.findFirstByUserIdOrderByIdAsc(userId).ifPresent(a -> a.setDefaultAddress(true));
        }
    }

    @Transactional
    public AddressResponse setDefault(Long userId, Long addressId) {
        Address address = requireMine(userId, addressId);
        clearDefault(userId);
        address.setDefaultAddress(true);
        return AddressResponse.from(address);
    }

    // ---------- helpers ----------

    private Address requireMine(Long userId, Long addressId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy địa chỉ"));
    }

    /** Mỗi người chỉ vài địa chỉ nên duyệt danh sách là đủ, không cần bulk UPDATE. */
    private void clearDefault(Long userId) {
        addressRepository.findByUserId(userId).forEach(a -> a.setDefaultAddress(false));
    }

    private static void apply(Address address, AddressRequest r) {
        address.setReceiverName(r.receiverName().trim());
        address.setPhone(r.phone().trim());
        address.setProvince(r.province().trim());
        address.setDistrict(r.district().trim());
        address.setWard(OrderSupport.trimToNull(r.ward()));
        address.setStreet(r.street().trim());
    }
}
