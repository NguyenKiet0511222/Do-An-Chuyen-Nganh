package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Address;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.repository.AddressRepository;
import com.nhom5.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Vá lỗ hổng: /api/users từng lộ passwordHash cho mọi user; /api/addresses/user/{id} lộ địa chỉ người khác. */
class UserAddressSecurityTest extends ApiTestSupport {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AddressRepository addressRepository;

    @Test
    void userListIsAdminOnlyAndNeverLeaksPasswordHash() throws Exception {
        String customer = login(registerCustomer(), "secret123");
        call(get("/api/users"), customer).andExpect(status().isNotFound());
        call(get("/api/admin/users"), customer).andExpect(status().isForbidden());

        String body = call(get("/api/admin/users").param("keyword", "nongsan.local").param("size", "100"), adminToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].email").isString())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertFalse(body.contains("password"), "Không được trả passwordHash ra ngoài");

        long sellerId = userRepository.findByEmail(SELLER_EMAIL).orElseThrow().getId();
        call(get("/api/admin/users/" + sellerId), adminToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("SELLER"))
                .andExpect(jsonPath("$.data.shop.shopName").value("Vườn rau Tâm An"));
    }

    @Test
    void addressesOnlyVisibleToOwner() throws Exception {
        String emailA = registerCustomer();
        String emailB = registerCustomer();
        Address addressOfB = addressRepository.save(address(userRepository.findByEmail(emailB).orElseThrow()));
        addressRepository.save(address(userRepository.findByEmail(emailA).orElseThrow()));

        String tokenA = login(emailA, "secret123");
        call(get("/api/addresses/user/" + addressOfB.getUser().getId()), tokenA).andExpect(status().isNotFound());
        call(get("/api/users/me/addresses/" + addressOfB.getId()), tokenA).andExpect(status().isNotFound());
        call(get("/api/users/me/addresses"), tokenA)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].receiverName").value("Người nhận"))
                .andExpect(jsonPath("$.data[0].isDefault").value(true));

        String tokenB = login(emailB, "secret123");
        call(get("/api/users/me/addresses/" + addressOfB.getId()), tokenB)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(addressOfB.getId()));
    }

    private static Address address(User user) {
        return Address.builder()
                .user(user)
                .receiverName("Người nhận")
                .phone("0900000001")
                .province("Hà Nội")
                .district("Đống Đa")
                .ward("Láng Hạ")
                .street("12 Nguyễn Chí Thanh")
                .defaultAddress(true)
                .build();
    }
}
