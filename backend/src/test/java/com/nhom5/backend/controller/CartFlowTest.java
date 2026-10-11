package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.enums.ProductStatus;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Giỏ hàng (api.md 3.4, 4.5): nhóm theo shop, cộng dồn, chặn vượt tồn kho / sản phẩm chưa duyệt. */
class CartFlowTest extends ApiTestSupport {

    private static final long SHIPPING_FEE = 20_000L;

    @Test
    void addGroupsByShopAccumulatesAndComputesTotals() throws Exception {
        String token = login(registerCustomer(), "secret123");
        Product tamAn = approvedProduct(SELLER_EMAIL, 100);          // 35.000/kg
        Product caoLanh = approvedProduct(OTHER_SELLER_EMAIL, 100);

        callJson(post("/api/cart/items"), token, item(tamAn, 2))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.groups", hasSize(1)))
                .andExpect(jsonPath("$.data.totalItems").value(1));
        // Thêm lại cùng sản phẩm -> cộng dồn thành 3, vẫn 1 dòng
        callJson(post("/api/cart/items"), token, item(tamAn, 1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.groups[0].items[0].quantity").value(3))
                .andExpect(jsonPath("$.data.groups[0].items[0].subtotal").value(105_000));
        callJson(post("/api/cart/items"), token, item(caoLanh, 1)).andExpect(status().isCreated());

        long expectedGrand = 105_000 + SHIPPING_FEE + 35_000 + SHIPPING_FEE;
        call(get("/api/cart"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups", hasSize(2)))
                .andExpect(jsonPath("$.data.groups[0].shop.shopName").value("Vườn rau Tâm An"))
                .andExpect(jsonPath("$.data.groups[0].subtotal").value(105_000))
                .andExpect(jsonPath("$.data.groups[0].shippingFee").value(SHIPPING_FEE))
                .andExpect(jsonPath("$.data.groups[1].shop.shopName").value("HTX Xoài Cao Lãnh"))
                .andExpect(jsonPath("$.data.groups[1].items[0].product.stockQuantity").value(100))
                .andExpect(jsonPath("$.data.grandTotal").value(expectedGrand))
                .andExpect(jsonPath("$.data.totalItems").value(2));
    }

    @Test
    void rejectsUnsellableProductAndOverStock() throws Exception {
        String token = login(registerCustomer(), "secret123");
        Product pending = productInShop(SELLER_EMAIL, ProductStatus.PENDING, 50);
        Product small = approvedProduct(SELLER_EMAIL, 2);

        callJson(post("/api/cart/items"), token, item(pending, 1))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Sản phẩm hiện không còn bán"));
        callJson(post("/api/cart/items"), token, "{\"productId\":999999,\"quantity\":1}")
                .andExpect(status().isNotFound());

        callJson(post("/api/cart/items"), token, item(small, 2)).andExpect(status().isCreated());
        // Cộng dồn 2 + 1 = 3 > tồn 2
        callJson(post("/api/cart/items"), token, item(small, 1))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Chỉ còn 2")));
        long itemId = readLong(call(get("/api/cart"), token), "$.data.groups[0].items[0].id");
        callJson(put("/api/cart/items/" + itemId), token, "{\"quantity\":5}")
                .andExpect(status().isConflict());
        callJson(post("/api/cart/items"), token, "{\"productId\":" + small.getId() + ",\"quantity\":0}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateZeroRemoves_otherUsersItem404_clearEmptiesCart() throws Exception {
        String tokenA = login(registerCustomer(), "secret123");
        String tokenB = login(registerCustomer(), "secret123");
        Product p = approvedProduct(SELLER_EMAIL, 50);
        Product q = approvedProduct(SELLER_EMAIL, 50);

        callJson(post("/api/cart/items"), tokenA, item(p, 2)).andExpect(status().isCreated());
        long itemId = readLong(callJson(post("/api/cart/items"), tokenA, item(q, 1)), "$.data.groups[0].items[1].id");

        // Người khác không thấy / không sửa được dòng của A
        callJson(put("/api/cart/items/" + itemId), tokenB, "{\"quantity\":1}").andExpect(status().isNotFound());
        call(delete("/api/cart/items/" + itemId), tokenB).andExpect(status().isNotFound());
        call(get("/api/cart"), tokenB).andExpect(jsonPath("$.data.totalItems").value(0));

        callJson(put("/api/cart/items/" + itemId), tokenA, "{\"quantity\":4}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups[0].items[1].quantity").value(4));
        callJson(put("/api/cart/items/" + itemId), tokenA, "{\"quantity\":0}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(1));

        call(delete("/api/cart"), tokenA).andExpect(status().isOk());
        call(get("/api/cart"), tokenA)
                .andExpect(jsonPath("$.data.groups", hasSize(0)))
                .andExpect(jsonPath("$.data.grandTotal").value(0));

        mockMvc.perform(get("/api/cart")).andExpect(status().isUnauthorized());
    }

    private static String item(Product p, int quantity) {
        return "{\"productId\":" + p.getId() + ",\"quantity\":" + quantity + "}";
    }
}
