package com.nhom5.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Luồng mục 3.1: khách đăng ký shop -> admin xác minh -> đăng nhập lại thành SELLER -> quản lý shop. */
class SellerShopFlowTest extends ApiTestSupport {

    private static final String SHOP_JSON = """
            {"shopName":"Vườn dâu Test","description":"Dâu tây sạch","province":"Sơn La",
             "address":"Mộc Châu, Sơn La","phone":"0912000111"}""";

    @Test
    void customerRegistersShopThenAdminVerifiesThenSellerManagesShop() throws Exception {
        String email = registerCustomer();
        String customerToken = login(email, "secret123");

        // Chưa là SELLER -> không vào được khu người bán
        call(get("/api/seller/shop"), customerToken).andExpect(status().isForbidden());

        // Dữ liệu sai -> 400 kèm lỗi theo field
        callJson(post("/api/seller/register"), customerToken, "{\"shopName\":\"A\",\"phone\":\"abc\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.shopName").exists())
                .andExpect(jsonPath("$.data.phone").exists())
                .andExpect(jsonPath("$.data.province").exists());

        ResultActions registered = callJson(post("/api/seller/register"), customerToken, SHOP_JSON)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING_VERIFICATION"))
                .andExpect(jsonPath("$.data.shopName").value("Vườn dâu Test"));
        long shopId = readLong(registered, "$.data.id");

        // Đăng ký lần 2 -> 409
        callJson(post("/api/seller/register"), customerToken, SHOP_JSON).andExpect(status().isConflict());

        // /auth/me cho frontend biết shop đang chờ xác minh
        call(get("/api/auth/me"), customerToken)
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.accountTier").value("STANDARD"))
                .andExpect(jsonPath("$.data.shopId").value(shopId))
                .andExpect(jsonPath("$.data.shopStatus").value("PENDING_VERIFICATION"));

        // Người thường không gọi được API admin
        callJson(patch("/api/admin/shops/" + shopId + "/status"), customerToken, "{\"action\":\"VERIFY\"}")
                .andExpect(status().isForbidden());

        String admin = adminToken();
        callJson(patch("/api/admin/shops/" + shopId + "/status"), admin, "{\"action\":\"LOCK\"}")
                .andExpect(status().isConflict());
        callJson(patch("/api/admin/shops/" + shopId + "/status"), admin, "{\"action\":\"ABC\"}")
                .andExpect(status().isBadRequest());
        callJson(patch("/api/admin/shops/" + shopId + "/status"), admin, "{\"action\":\"VERIFY\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.verifiedAt").exists());
        callJson(patch("/api/admin/shops/" + shopId + "/status"), admin, "{\"action\":\"VERIFY\"}")
                .andExpect(status().isConflict());

        // Token cũ vẫn mang role CUSTOMER -> phải đăng nhập lại
        call(get("/api/seller/shop"), customerToken).andExpect(status().isForbidden());
        String sellerToken = login(email, "secret123");
        call(get("/api/auth/me"), sellerToken)
                .andExpect(jsonPath("$.data.role").value("SELLER"))
                .andExpect(jsonPath("$.data.shopStatus").value("ACTIVE"));

        call(get("/api/seller/shop"), sellerToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(shopId))
                .andExpect(jsonPath("$.data.province").value("Sơn La"));

        callJson(put("/api/seller/shop"), sellerToken, SHOP_JSON.replace("Vườn dâu Test", "Vườn dâu Mộc Châu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.shopName").value("Vườn dâu Mộc Châu"));

        // Logo: ảnh hợp lệ -> URL /uploads/logos/..., phục vụ công khai
        String logoUrl = read(call(multipart(HttpMethod.PUT, "/api/seller/shop/logo").file(png("file")), sellerToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.logoUrl", startsWith("/uploads/logos/"))), "$.data.logoUrl");
        mockMvc.perform(get(logoUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));

        // File không phải ảnh (đuôi .png nhưng nội dung text) -> 400
        MockMultipartFile fake = new MockMultipartFile("file", "fake.png", MediaType.IMAGE_PNG_VALUE, "hello".getBytes());
        call(multipart(HttpMethod.PUT, "/api/seller/shop/logo").file(fake), sellerToken)
                .andExpect(status().isBadRequest());

        // Shop bị khoá: không tạo được sản phẩm mới, mở khoá thì tạo lại được
        callJson(patch("/api/admin/shops/" + shopId + "/status"), admin, "{\"action\":\"LOCK\"}")
                .andExpect(jsonPath("$.data.status").value("LOCKED"));
        callJson(post("/api/seller/products"), sellerToken, productJson("Dâu tây Mộc Châu", 120000, 10))
                .andExpect(status().isForbidden());
        callJson(patch("/api/admin/shops/" + shopId + "/status"), admin, "{\"action\":\"UNLOCK\"}")
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
        callJson(post("/api/seller/products"), sellerToken, productJson("Dâu tây Mộc Châu", 120000, 10))
                .andExpect(status().isCreated());
    }

    @Test
    void adminCannotRegisterShopAndHasNoShop() throws Exception {
        String admin = adminToken();
        callJson(post("/api/seller/register"), admin, SHOP_JSON).andExpect(status().isForbidden());
        call(get("/api/seller/shop"), admin).andExpect(status().isNotFound());
    }

    @Test
    void registerRequiresLogin() throws Exception {
        mockMvc.perform(post("/api/seller/register").contentType(MediaType.APPLICATION_JSON).content(SHOP_JSON))
                .andExpect(status().isUnauthorized());
    }
}
