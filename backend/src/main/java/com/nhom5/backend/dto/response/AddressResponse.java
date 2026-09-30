package com.nhom5.backend.dto.response;

import com.nhom5.backend.entity.Address;

/** Address JSON theo api.md mục 4.2. */
public record AddressResponse(
        Long id,
        String receiverName,
        String phone,
        String province,
        String district,
        String ward,
        String street,
        Boolean isDefault
) {

    public static AddressResponse from(Address a) {
        return new AddressResponse(a.getId(), a.getReceiverName(), a.getPhone(), a.getProvince(),
                a.getDistrict(), a.getWard(), a.getStreet(), a.getDefaultAddress());
    }
}
