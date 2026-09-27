package com.nhom5.backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/products — Lấy danh sách sản phẩm công khai thành công, đúng hợp đồng api.md 4.4")
    void testListPublicProducts_Success() throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("OK"))
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(12))
                .andExpect(jsonPath("$.data.totalElements").value(greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(4))))
                // Kiểm tra cấu trúc item theo mục 4.4 api.md
                .andExpect(jsonPath("$.data.content[0].id").isNumber())
                .andExpect(jsonPath("$.data.content[0].name").isString())
                .andExpect(jsonPath("$.data.content[0].slug").isString())
                .andExpect(jsonPath("$.data.content[0].price").isNumber())
                .andExpect(jsonPath("$.data.content[0].unit").isString())
                .andExpect(jsonPath("$.data.content[0].category.id").isNumber())
                .andExpect(jsonPath("$.data.content[0].category.name").isString())
                .andExpect(jsonPath("$.data.content[0].shop.id").isNumber())
                .andExpect(jsonPath("$.data.content[0].shop.shopName").isString())
                // Sản phẩm chưa duyệt (PENDING) không được phép xuất hiện
                .andExpect(jsonPath("$.data.content[*].name", not(hasItem(containsString("Chờ duyệt")))));
    }

    @Test
    @DisplayName("GET /api/products?keyword=... — Lọc theo từ khóa tên sản phẩm")
    void testListProducts_FilterByKeyword() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("keyword", "Cà chua")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Cà chua bi Đà Lạt"));
    }

    @Test
    @DisplayName("GET /api/products?minPrice=...&maxPrice=... — Lọc theo khoảng giá")
    void testListProducts_FilterByPriceRange() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("minPrice", "50000")
                        .param("maxPrice", "100000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[*].name", hasItem("Xoài Cát Chu Cao Lãnh")))
                .andExpect(jsonPath("$.data.content[*].name", not(hasItem("Cà chua bi Đà Lạt"))));
    }

    @Test
    @DisplayName("GET /api/products?sort=priceAsc — Sắp xếp theo giá tăng dần")
    void testListProducts_SortByPriceAsc() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("sort", "priceAsc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].price").value(lessThanOrEqualTo(35000)));
    }

    @Test
    @DisplayName("GET /api/products/{id} — Lấy chi tiết sản phẩm thành công, kèm ảnh và nhãn AI")
    void testGetProductDetail_Success() throws Exception {
        // Lấy id của Cà chua bi Đà Lạt từ danh sách
        String listResponse = mockMvc.perform(get("/api/products?keyword=Cà chua"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Lấy ID đầu tiên
        int idStart = listResponse.indexOf("\"id\":") + 5;
        int idEnd = listResponse.indexOf(",", idStart);
        String idStr = listResponse.substring(idStart, idEnd).trim();
        long productId = Long.parseLong(idStr);

        mockMvc.perform(get("/api/products/" + productId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("OK"))
                .andExpect(jsonPath("$.data.id").value(productId))
                .andExpect(jsonPath("$.data.name").value("Cà chua bi Đà Lạt"))
                .andExpect(jsonPath("$.data.origin").value("Lâm Đồng"))
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.description").isNotEmpty())
                .andExpect(jsonPath("$.data.images", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.images[0].url").isNotEmpty())
                .andExpect(jsonPath("$.data.images[0].ai.label").value("FRESH"))
                .andExpect(jsonPath("$.data.images[0].ai.reviewStatus").value("AUTO_ACCEPTED"))
                .andExpect(jsonPath("$.data.shop.shopName").value("Vườn rau Tâm An"))
                .andExpect(jsonPath("$.data.shop.province").value("Lâm Đồng"));
    }

    @Test
    @DisplayName("GET /api/products/{id} — Không tìm thấy sản phẩm trả về 404")
    void testGetProductDetail_NotFound() throws Exception {
        mockMvc.perform(get("/api/products/999999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Không tìm thấy sản phẩm")));
    }

    @Test
    @DisplayName("GET /api/products?aiLabel=INVALID — Tham số sai kiểu trả về 400 Bad Request")
    void testListProducts_InvalidParamType() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("aiLabel", "INVALID_LABEL")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
