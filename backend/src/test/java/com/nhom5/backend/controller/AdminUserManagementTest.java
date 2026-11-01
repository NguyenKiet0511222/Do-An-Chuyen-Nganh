package com.nhom5.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Admin khoá / mở khoá, đổi cấp tài khoản, tạo admin (api.md mục 3.1, 4.9). */
class AdminUserManagementTest extends ApiTestSupport {

    @Test
    void lockBlocksExistingTokenImmediatelyAndUnlockRestores() throws Exception {
        String admin = adminToken();
        String email = registerCustomer();
        String customerToken = login(email, "secret123");
        long userId = userRepository.findByEmail(email).orElseThrow().getId();
        String base = "/api/admin/users/" + userId + "/status";

        call(get("/api/auth/me"), customerToken).andExpect(status().isOk());

        callJson(patch(base), admin, "{\"action\":\"LOCK\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("LOCKED"));
        // Token cũ vẫn còn hạn nhưng bị chặn ngay
        call(get("/api/auth/me"), customerToken)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Tài khoản đã bị khoá, liên hệ quản trị viên"));
        call(get("/api/cart"), customerToken).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isForbidden());
        callJson(patch(base), admin, "{\"action\":\"LOCK\"}").andExpect(status().isConflict());

        callJson(patch(base), admin, "{\"action\":\"UNLOCK\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
        call(get("/api/auth/me"), customerToken).andExpect(status().isOk());
        callJson(patch(base), admin, "{\"action\":\"UNLOCK\"}").andExpect(status().isConflict());
    }

    @Test
    void cannotLockSelfAndValidatesInput() throws Exception {
        String admin = adminToken();
        long adminId = userRepository.findByEmail(ADMIN_EMAIL).orElseThrow().getId();

        callJson(patch("/api/admin/users/" + adminId + "/status"), admin, "{\"action\":\"LOCK\"}")
                .andExpect(status().isConflict());
        callJson(patch("/api/admin/users/" + adminId + "/status"), admin, "{}")
                .andExpect(status().isBadRequest());
        callJson(patch("/api/admin/users/" + adminId + "/status"), admin, "{\"action\":\"BAN\"}")
                .andExpect(status().isBadRequest());
        callJson(patch("/api/admin/users/99999999/status"), admin, "{\"action\":\"LOCK\"}")
                .andExpect(status().isNotFound());
        callJson(patch("/api/admin/users/" + adminId + "/status"), sellerToken(), "{\"action\":\"UNLOCK\"}")
                .andExpect(status().isForbidden());
    }

    @Test
    void changeTier() throws Exception {
        String admin = adminToken();
        String email = registerCustomer();
        long userId = userRepository.findByEmail(email).orElseThrow().getId();

        callJson(patch("/api/admin/users/" + userId + "/tier"), admin, "{\"tier\":\"PREMIUM\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accountTier").value("PREMIUM"));
        call(get("/api/admin/users/" + userId), admin)
                .andExpect(jsonPath("$.data.accountTier").value("PREMIUM"));
        callJson(patch("/api/admin/users/" + userId + "/tier"), admin, "{\"tier\":\"GOLD\"}")
                .andExpect(status().isBadRequest());
        callJson(patch("/api/admin/users/" + userId + "/tier"), admin, "{\"tier\":\"STANDARD\"}")
                .andExpect(jsonPath("$.data.accountTier").value("STANDARD"));
    }

    @Test
    void createAdmin() throws Exception {
        String admin = adminToken();
        String email = "Admin2-" + UUID.randomUUID().toString().substring(0, 8) + "@Test.com";

        callJson(post("/api/admin/users"), admin,
                "{\"fullName\":\"Admin Hai\",\"email\":\"" + email + "\",\"password\":\"secret123\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.email").value(email.toLowerCase()))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());

        String newAdminToken = login(email.toLowerCase(), "secret123");
        call(get("/api/admin/users"), newAdminToken).andExpect(status().isOk());

        callJson(post("/api/admin/users"), admin,
                "{\"fullName\":\"Trùng\",\"email\":\"" + email.toUpperCase() + "\",\"password\":\"secret123\"}")
                .andExpect(status().isConflict());
        callJson(post("/api/admin/users"), admin, "{\"fullName\":\"\",\"email\":\"sai\",\"password\":\"1\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.email").exists())
                .andExpect(jsonPath("$.data.password").exists());
    }
}
