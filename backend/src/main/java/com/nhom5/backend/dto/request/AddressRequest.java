package com.nhom5.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body của POST /users/me/addresses và PUT /users/me/addresses/{id} (api.md mục 4.2). */
public record AddressRequest(
        @NotBlank(message = "Vui lòng nhập tên người nhận")
        @Size(max = 100, message = "Tên người nhận tối đa 100 ký tự")
        String receiverName,

        @NotBlank(message = "Vui lòng nhập số điện thoại")
        @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại gồm 9 đến 11 chữ số")
        String phone,

        @NotBlank(message = "Vui lòng nhập tỉnh/thành")
        @Size(max = 100, message = "Tỉnh/thành tối đa 100 ký tự")
        String province,

        @NotBlank(message = "Vui lòng nhập quận/huyện")
        @Size(max = 100, message = "Quận/huyện tối đa 100 ký tự")
        String district,

        @Size(max = 100, message = "Phường/xã tối đa 100 ký tự")
        String ward,

        @NotBlank(message = "Vui lòng nhập số nhà, tên đường")
        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String street,

        /** true = đặt làm mặc định luôn (bỏ cờ các địa chỉ khác). null/false = giữ nguyên. */
        Boolean isDefault
) {
}
