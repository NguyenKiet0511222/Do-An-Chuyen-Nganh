package com.nhom5.backend.controller;

import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Sổ địa chỉ (api.md 4.2): thêm / sửa / xoá / đặt mặc định, chỉ trên địa chỉ của mình. */
class AddressFlowTest extends ApiTestSupport {

    private static final String BASE = "/api/users/me/addresses";

    @Test
    void firstAddressIsDefault_setDefaultMovesFlag_deleteDefaultPromotesOldest() throws Exception {
        String token = login(registerCustomer(), "secret123");

        long first = readLong(callJson(post(BASE), token, addressJson("Nguyễn A", null))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isDefault").value(true)), "$.data.id");
        long second = readLong(callJson(post(BASE), token, addressJson("Nguyễn B", null))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isDefault").value(false)), "$.data.id");
        long third = readLong(callJson(post(BASE), token, addressJson("Nguyễn C", true))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isDefault").value(true)), "$.data.id");

        // Tạo với isDefault=true -> địa chỉ đầu mất cờ; danh sách xếp mặc định lên đầu
        call(get(BASE), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(3)))
                .andExpect(jsonPath("$.data[0].id").value(third))
                .andExpect(jsonPath("$.data[0].isDefault").value(true))
                .andExpect(jsonPath("$.data[1].isDefault").value(false))
                .andExpect(jsonPath("$.data[2].isDefault").value(false));

        call(patch(BASE + "/" + second + "/default"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isDefault").value(true));
        call(get(BASE + "/" + third), token).andExpect(jsonPath("$.data.isDefault").value(false));

        // Xoá địa chỉ mặc định (second) -> địa chỉ cũ nhất còn lại (first) được đôn lên
        call(delete(BASE + "/" + second), token).andExpect(status().isOk());
        call(get(BASE), token)
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].id").value(first))
                .andExpect(jsonPath("$.data[0].isDefault").value(true));

        // Xoá nốt
        call(delete(BASE + "/" + first), token).andExpect(status().isOk());
        call(delete(BASE + "/" + third), token).andExpect(status().isOk());
        call(get(BASE), token).andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void updateChangesFieldsAndCanPromoteDefault() throws Exception {
        String token = login(registerCustomer(), "secret123");
        long first = readLong(callJson(post(BASE), token, addressJson("Nguyễn A", null)), "$.data.id");
        long second = readLong(callJson(post(BASE), token, addressJson("Nguyễn B", null)), "$.data.id");

        callJson(put(BASE + "/" + second), token, addressJson("Nguyễn B sửa", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.receiverName").value("Nguyễn B sửa"))
                .andExpect(jsonPath("$.data.isDefault").value(true));
        call(get(BASE + "/" + first), token).andExpect(jsonPath("$.data.isDefault").value(false));

        // isDefault=false trên địa chỉ đang mặc định -> giữ nguyên mặc định
        callJson(put(BASE + "/" + second), token, addressJson("Nguyễn B", false))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isDefault").value(true));
    }

    @Test
    void otherUsersAddressIs404ForEveryWrite() throws Exception {
        String tokenA = login(registerCustomer(), "secret123");
        String tokenB = login(registerCustomer(), "secret123");
        long ofA = readLong(callJson(post(BASE), tokenA, addressJson("Nguyễn A", null)), "$.data.id");

        callJson(put(BASE + "/" + ofA), tokenB, addressJson("Hack", null)).andExpect(status().isNotFound());
        call(delete(BASE + "/" + ofA), tokenB).andExpect(status().isNotFound());
        call(patch(BASE + "/" + ofA + "/default"), tokenB).andExpect(status().isNotFound());
        // Vẫn nguyên vẹn
        call(get(BASE + "/" + ofA), tokenA)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.receiverName").value("Nguyễn A"));
    }

    @Test
    void validationErrorsReturn400WithFieldMap() throws Exception {
        String token = login(registerCustomer(), "secret123");
        callJson(post(BASE), token, "{\"receiverName\":\"\",\"phone\":\"abc\",\"province\":\"Hà Nội\",\"district\":\"Đống Đa\",\"street\":\"1 A\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.receiverName").isString())
                .andExpect(jsonPath("$.data.phone").isString());
        mockMvc.perform(get(BASE)).andExpect(status().isUnauthorized());
    }

    private static String addressJson(String receiverName, Boolean isDefault) {
        return "{\"receiverName\":\"" + receiverName + "\",\"phone\":\"0912345678\",\"province\":\"Hà Nội\","
                + "\"district\":\"Đống Đa\",\"ward\":\"Láng Hạ\",\"street\":\"12 Nguyễn Chí Thanh\""
                + (isDefault == null ? "" : ",\"isDefault\":" + isDefault) + "}";
    }
}
