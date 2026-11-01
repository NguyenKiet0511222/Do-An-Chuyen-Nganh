package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AuthProvider;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Hồ sơ + đổi mật khẩu (mục 4.1, 4.2), đánh giá sản phẩm (mục 3.6), trang shop / danh mục công khai (mục 4.3, 4.4). */
class AccountAndReviewFlowTest extends ApiTestSupport {

    @Test
    void profileUpdateAndAvatar() throws Exception {
        String email = registerCustomer();
        String token = login(email, "secret123");

        call(get("/api/users/me"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"));

        callJson(put("/api/users/me"), token, "{\"fullName\":\" Trần Thị Mai \",\"phone\":\"0912345678\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Trần Thị Mai"))
                .andExpect(jsonPath("$.data.phone").value("0912345678"));
        callJson(put("/api/users/me"), token, "{\"fullName\":\"Mai\",\"phone\":\"\"}")
                .andExpect(jsonPath("$.data.phone").doesNotExist());
        callJson(put("/api/users/me"), token, "{\"fullName\":\"M\",\"phone\":\"12ab\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.fullName").exists())
                .andExpect(jsonPath("$.data.phone").exists());

        call(multipart(HttpMethod.PUT, "/api/users/me/avatar").file(png("file")), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl", startsWith("/uploads/avatars/")));
        call(get("/api/auth/me"), token).andExpect(jsonPath("$.data.avatarUrl", startsWith("/uploads/avatars/")));

        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void changePassword() throws Exception {
        String email = registerCustomer();
        String token = login(email, "secret123");

        callJson(put("/api/auth/change-password"), token,
                "{\"currentPassword\":\"sai-mat-khau\",\"newPassword\":\"newpass123\",\"confirmPassword\":\"newpass123\"}")
                .andExpect(status().isBadRequest());
        callJson(put("/api/auth/change-password"), token,
                "{\"currentPassword\":\"secret123\",\"newPassword\":\"newpass123\",\"confirmPassword\":\"khac123456\"}")
                .andExpect(status().isBadRequest());
        callJson(put("/api/auth/change-password"), token,
                "{\"currentPassword\":\"secret123\",\"newPassword\":\"secret123\",\"confirmPassword\":\"secret123\"}")
                .andExpect(status().isBadRequest());
        callJson(put("/api/auth/change-password"), token,
                "{\"currentPassword\":\"secret123\",\"newPassword\":\"newpass123\",\"confirmPassword\":\"newpass123\"}")
                .andExpect(status().isOk());

        login(email, "newpass123");
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"secret123\"}"))
                .andExpect(status().isUnauthorized());

        // Tài khoản chỉ đăng nhập Google: không có mật khẩu để đổi
        User google = userRepository.findByEmail(email).orElseThrow();
        google.setPasswordHash(null);
        google.setProvider(AuthProvider.GOOGLE);
        userRepository.save(google);
        callJson(put("/api/auth/change-password"), token,
                "{\"currentPassword\":\"x\",\"newPassword\":\"newpass123\",\"confirmPassword\":\"newpass123\"}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void reviewOnlyAfterDeliveredOnceAndUpdatesRatings() throws Exception {
        String admin = adminToken();
        Product product = approvedProduct(SELLER_EMAIL, 10);
        Order order = orderFor(product, 1);
        String customerEmail = order.getUser().getEmail();
        String customer = login(customerEmail, "secret123");
        String reviewUrl = "/api/products/" + product.getId() + "/reviews";
        String body = "{\"orderId\":" + order.getId() + ",\"rating\":4,\"comment\":\"Rau tươi\"}";

        // Chưa giao -> 409
        callJson(post(reviewUrl), customer, body).andExpect(status().isConflict());

        for (String s : new String[]{"CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"}) {
            callJson(patch("/api/admin/orders/" + order.getId() + "/status"), admin, "{\"status\":\"" + s + "\"}")
                    .andExpect(status().isOk());
        }

        callJson(post(reviewUrl), customer, "{\"orderId\":" + order.getId() + ",\"rating\":6}")
                .andExpect(status().isBadRequest());
        callJson(post(reviewUrl), customer, body)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.rating").value(4))
                .andExpect(jsonPath("$.data.user.fullName").value("Khách Test"));
        callJson(post(reviewUrl), customer, body).andExpect(status().isConflict());

        // Người khác không đánh giá bằng đơn này được
        String stranger = login(registerCustomer(), "secret123");
        callJson(post(reviewUrl), stranger, body).andExpect(status().isConflict());
        // Đơn không chứa sản phẩm khác
        Product other = approvedProduct(SELLER_EMAIL, 5);
        callJson(post("/api/products/" + other.getId() + "/reviews"), customer, body).andExpect(status().isConflict());

        Product reloaded = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(1, reloaded.getRatingCount());
        assertEquals(0, reloaded.getRatingAvg().compareTo(new java.math.BigDecimal("4.0")));

        // GET công khai, không cần token
        mockMvc.perform(get(reviewUrl))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].comment").value("Rau tươi"))
                .andExpect(jsonPath("$.data.content[0].user.email").doesNotExist());
        mockMvc.perform(get("/api/products/99999999/reviews")).andExpect(status().isNotFound());
        mockMvc.perform(post(reviewUrl).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicShopAndCategoriesAreWrappedInApiResponse() throws Exception {
        Long shopId = shopOf(SELLER_EMAIL).getId();
        mockMvc.perform(get("/api/shops/" + shopId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.shop.id").value(shopId.intValue()))
                .andExpect(jsonPath("$.data.shop.description").hasJsonPath())
                .andExpect(jsonPath("$.data.products.content").isArray());
        mockMvc.perform(get("/api/shops/99999999")).andExpect(status().isNotFound());
        // Endpoint cũ trả entity đã gỡ
        mockMvc.perform(get("/api/shops/user/1")).andExpect(status().isNotFound());

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        // Danh mục ẩn không hiện ở cây công khai
        String name = "Ẩn " + UUID.randomUUID().toString().substring(0, 4);
        long hiddenId = readLong(callJson(post("/api/admin/categories"), adminToken(),
                "{\"name\":\"" + name + "\",\"isActive\":false}").andExpect(status().isCreated()), "$.data.id");
        mockMvc.perform(get("/api/categories"))
                .andExpect(jsonPath("$.data[?(@.id == " + hiddenId + ")]", hasSize(0)));
    }
}
