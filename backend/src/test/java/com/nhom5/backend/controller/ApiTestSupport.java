package com.nhom5.backend.controller;

import com.jayway.jsonpath.JsonPath;
import com.nhom5.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Hỗ trợ chung cho test API cần đăng nhập (H2, dữ liệu seed: admin, seller@nongsan.local, caolanh@nongsan.local).
 * Các test dùng chung 1 DB trong cùng context -> mỗi test tự tạo dữ liệu riêng, không khẳng định trên tổng số toàn cục.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class ApiTestSupport {

    protected static final String ADMIN_EMAIL = "admin@nongsan.local";
    protected static final String ADMIN_PASSWORD = "Admin@123";
    protected static final String SELLER_EMAIL = "seller@nongsan.local";
    protected static final String OTHER_SELLER_EMAIL = "caolanh@nongsan.local";
    protected static final String SELLER_PASSWORD = "Seller@123";

    /** Chỉ cần chữ ký đầu file đúng PNG — FileStorageService kiểm tra magic bytes, không giải mã ảnh. */
    protected static final byte[] PNG_BYTES = {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D, 'I', 'H', 'D', 'R'};

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected CategoryRepository categoryRepository;

    protected String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return JsonPath.read(body, "$.data.accessToken");
    }

    protected String sellerToken() throws Exception {
        return login(SELLER_EMAIL, SELLER_PASSWORD);
    }

    protected String adminToken() throws Exception {
        return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    /** Đăng ký 1 khách mới (email ngẫu nhiên) và trả về email. */
    protected String registerCustomer() throws Exception {
        String email = "kh-" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Khách Test\",\"email\":\"" + email
                                + "\",\"password\":\"secret123\",\"confirmPassword\":\"secret123\"}"))
                .andExpect(status().isCreated());
        return email;
    }

    protected ResultActions call(AbstractMockHttpServletRequestBuilder<?> request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    protected ResultActions callJson(AbstractMockHttpServletRequestBuilder<?> request, String token, String json) throws Exception {
        return call(request.contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    protected static <T> T read(ResultActions result, String jsonPath) throws Exception {
        return JsonPath.read(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8), jsonPath);
    }

    protected static long readLong(ResultActions result, String jsonPath) throws Exception {
        Number n = read(result, jsonPath);
        return n.longValue();
    }

    protected static MockMultipartFile png(String field) {
        return new MockMultipartFile(field, "anh.png", MediaType.IMAGE_PNG_VALUE, PNG_BYTES);
    }

    /** Danh mục "Củ quả" do ProductSeeder tạo. */
    protected Long categoryId() {
        return categoryRepository.findBySlug("cu-qua").orElseThrow().getId();
    }

    /** JSON tạo / sửa sản phẩm hợp lệ. */
    protected String productJson(String name, long price, int stock) {
        return productJson(name, price, stock, "kg");
    }

    protected String productJson(String name, long price, int stock, String unit) {
        return "{\"name\":\"" + name + "\",\"categoryId\":" + categoryId() + ",\"description\":\"Mô tả test\",\"price\":"
                + price + ",\"unit\":\"" + unit + "\",\"stockQuantity\":" + stock + ",\"origin\":\"Đà Lạt\"}";
    }
}
