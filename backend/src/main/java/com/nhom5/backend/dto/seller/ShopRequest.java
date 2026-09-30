package com.nhom5.backend.dto.seller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body của POST /seller/register và PUT /seller/shop (api.md mục 4.8). */
public record ShopRequest(
        @NotBlank(message = "Vui lòng nhập tên shop")
        @Size(min = 3, max = 150, message = "Tên shop từ 3 đến 150 ký tự")
        String shopName,

        @Size(max = 2000, message = "Giới thiệu shop tối đa 2000 ký tự")
        String description,

        @NotBlank(message = "Vui lòng nhập tỉnh/thành")
        @Size(max = 100, message = "Tỉnh/thành tối đa 100 ký tự")
        String province,

        @NotBlank(message = "Vui lòng nhập địa chỉ lấy hàng")
        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address,

        @NotBlank(message = "Vui lòng nhập số điện thoại")
        @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại gồm 9 đến 11 chữ số")
        String phone
) {
}
