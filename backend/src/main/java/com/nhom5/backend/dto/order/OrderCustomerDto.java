package com.nhom5.backend.dto.order;

import com.nhom5.backend.entity.User;

/** Người đặt đơn (tài khoản), khác với người nhận (receiverName/phone trên đơn). */
public record OrderCustomerDto(Long id, String fullName, String phone) {

    public static OrderCustomerDto from(User user) {
        return new OrderCustomerDto(user.getId(), user.getFullName(), user.getPhone());
    }
}
