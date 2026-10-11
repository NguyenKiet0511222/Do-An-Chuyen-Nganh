package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Product;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Checkout + đơn của khách (api.md 3.4, 3.5, 4.6): tách đơn theo shop, trừ/hoàn tồn kho, huỷ đơn. */
class CheckoutFlowTest extends ApiTestSupport {

    private static final long SHIPPING_FEE = 20_000L;
    private static final String ORDER_CODE = "DH-\\d{4}-\\d{5,}";

    /** Khách mới có 1 địa chỉ mặc định; trả về token. */
    private String customerWithAddress() throws Exception {
        String token = login(registerCustomer(), "secret123");
        callJson(post("/api/users/me/addresses"), token,
                "{\"receiverName\":\"Trần Thị Mai\",\"phone\":\"0912345678\",\"province\":\"Hà Nội\","
                        + "\"district\":\"Đống Đa\",\"ward\":\"Láng Hạ\",\"street\":\"12 Nguyễn Chí Thanh\"}")
                .andExpect(status().isCreated());
        return token;
    }

    private long addressId(String token) throws Exception {
        return readLong(call(get("/api/users/me/addresses"), token), "$.data[0].id");
    }

    private ResultActions addToCart(String token, Product p, int qty) throws Exception {
        return callJson(post("/api/cart/items"), token, "{\"productId\":" + p.getId() + ",\"quantity\":" + qty + "}")
                .andExpect(status().isCreated());
    }

    private int stock(Product p) {
        return productRepository.findById(p.getId()).orElseThrow().getStockQuantity();
    }

    @Test
    void checkoutSplitsPerShop_deductsStock_clearsCart_visibleToCustomerAndSeller() throws Exception {
        String token = customerWithAddress();
        Product tamAn = approvedProduct(SELLER_EMAIL, 10);          // 35.000/kg
        Product caoLanh = approvedProduct(OTHER_SELLER_EMAIL, 10);
        addToCart(token, tamAn, 2);
        addToCart(token, caoLanh, 1);

        ResultActions res = callJson(post("/api/orders/checkout"), token,
                "{\"addressId\":" + addressId(token) + ",\"note\":\"Gọi trước 10 phút\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.orders", hasSize(2)))
                .andExpect(jsonPath("$.data.checkoutGroupId").isString())
                .andExpect(jsonPath("$.data.orders[0].orderCode", matchesPattern(ORDER_CODE)))
                .andExpect(jsonPath("$.data.orders[0].shop.shopName").value("Vườn rau Tâm An"))
                .andExpect(jsonPath("$.data.orders[0].status").value("PENDING"))
                .andExpect(jsonPath("$.data.orders[0].subtotal").value(70_000))
                .andExpect(jsonPath("$.data.orders[0].total").value(70_000 + SHIPPING_FEE))
                .andExpect(jsonPath("$.data.orders[0].itemCount").value(1))
                .andExpect(jsonPath("$.data.orders[1].shop.shopName").value("HTX Xoài Cao Lãnh"))
                .andExpect(jsonPath("$.data.grandTotal").value(70_000 + 35_000 + 2 * SHIPPING_FEE));
        long orderId = readLong(res, "$.data.orders[0].id");
        String groupId = read(res, "$.data.checkoutGroupId");

        assertEquals(8, stock(tamAn));
        assertEquals(9, stock(caoLanh));
        call(get("/api/cart"), token).andExpect(jsonPath("$.data.totalItems").value(0));

        call(get("/api/orders").param("status", "PENDING"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[*].shop.shopName", hasItem("Vườn rau Tâm An")));
        call(get("/api/orders/" + orderId), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkoutGroupId").value(groupId))
                .andExpect(jsonPath("$.data.receiverName").value("Trần Thị Mai"))
                .andExpect(jsonPath("$.data.shippingAddress").value("12 Nguyễn Chí Thanh, Láng Hạ, Đống Đa, Hà Nội"))
                .andExpect(jsonPath("$.data.note").value("Gọi trước 10 phút"))
                .andExpect(jsonPath("$.data.paymentMethod").value("COD"))
                .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"))
                .andExpect(jsonPath("$.data.items[0].productName").value(tamAn.getName()))
                .andExpect(jsonPath("$.data.items[0].price").value(35_000))
                .andExpect(jsonPath("$.data.history", hasSize(1)))
                .andExpect(jsonPath("$.data.history[0].toStatus").value("PENDING"));

        // Người bán Tâm An thấy đơn này trong shop mình
        call(get("/api/seller/orders/" + orderId), sellerToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.customer.fullName").value("Khách Test"));
        // Khách khác không thấy
        call(get("/api/orders/" + orderId), login(registerCustomer(), "secret123")).andExpect(status().isNotFound());
    }

    @Test
    void checkoutSubsetOnlyRemovesSelectedItems() throws Exception {
        String token = customerWithAddress();
        Product a = approvedProduct(SELLER_EMAIL, 10);
        Product b = approvedProduct(SELLER_EMAIL, 10);
        long itemA = readLong(addToCart(token, a, 1), "$.data.groups[0].items[0].id");
        addToCart(token, b, 1);

        callJson(post("/api/orders/checkout"), token,
                "{\"addressId\":" + addressId(token) + ",\"cartItemIds\":[" + itemA + "]}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.orders", hasSize(1)))
                .andExpect(jsonPath("$.data.orders[0].itemCount").value(1));
        call(get("/api/cart"), token)
                .andExpect(jsonPath("$.data.totalItems").value(1))
                .andExpect(jsonPath("$.data.groups[0].items[0].product.id").value(b.getId()));
        assertEquals(9, stock(a));
        assertEquals(10, stock(b));

        // id không thuộc giỏ -> 404; giỏ rỗng -> 400; địa chỉ người khác -> 404
        callJson(post("/api/orders/checkout"), token,
                "{\"addressId\":" + addressId(token) + ",\"cartItemIds\":[999999]}")
                .andExpect(status().isNotFound());
        String other = customerWithAddress();
        callJson(post("/api/orders/checkout"), other, "{\"addressId\":" + addressId(token) + "}")
                .andExpect(status().isNotFound());
        callJson(post("/api/orders/checkout"), other, "{\"addressId\":" + addressId(other) + "}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Giỏ hàng trống"));
    }

    @Test
    void shortStockReturns409WithErrorsAndRollsBack() throws Exception {
        String token = customerWithAddress();
        Product enough = approvedProduct(SELLER_EMAIL, 10);
        Product scarce = approvedProduct(SELLER_EMAIL, 3);
        addToCart(token, enough, 2);
        addToCart(token, scarce, 3);
        // Người khác mua trước 2 -> còn 1 (giỏ của khách vẫn ghi 3)
        productRepository.findById(scarce.getId()).ifPresent(p -> {
            p.setStockQuantity(1);
            productRepository.save(p);
        });

        callJson(post("/api/orders/checkout"), token, "{\"addressId\":" + addressId(token) + "}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Một số sản phẩm không đủ hàng"))
                .andExpect(jsonPath("$.errors", hasSize(1)))
                .andExpect(jsonPath("$.errors[0].field").value("productId:" + scarce.getId()))
                .andExpect(jsonPath("$.errors[0].message").value("Chỉ còn 1 kg"));

        // Rollback: sản phẩm đủ hàng đã bị trừ trong transaction cũng được trả lại, giỏ còn nguyên, không có đơn
        assertEquals(10, stock(enough));
        assertEquals(1, stock(scarce));
        call(get("/api/cart"), token).andExpect(jsonPath("$.data.totalItems").value(2));
        call(get("/api/orders"), token).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void customerCancelRestoresStock_thenCannotCancelAgainOrAfterShipping() throws Exception {
        String token = customerWithAddress();
        Product p = approvedProduct(SELLER_EMAIL, 10);
        addToCart(token, p, 4);
        long orderId = readLong(callJson(post("/api/orders/checkout"), token,
                "{\"addressId\":" + addressId(token) + "}"), "$.data.orders[0].id");
        assertEquals(6, stock(p));

        callJson(patch("/api/orders/" + orderId + "/cancel"), token, "{\"cancelReason\":\"\"}")
                .andExpect(status().isBadRequest());
        callJson(patch("/api/orders/" + orderId + "/cancel"), token, "{\"cancelReason\":\"Đổi ý\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.cancelReason").value("Đổi ý"))
                .andExpect(jsonPath("$.data.history", hasSize(2)))
                .andExpect(jsonPath("$.data.history[1].toStatus").value("CANCELLED"))
                .andExpect(jsonPath("$.data.history[1].note").value("Đổi ý"));
        assertEquals(10, stock(p));
        callJson(patch("/api/orders/" + orderId + "/cancel"), token, "{\"cancelReason\":\"Lần 2\"}")
                .andExpect(status().isConflict());

        // Đơn khác: seller đưa tới SHIPPING -> khách không huỷ được nữa
        addToCart(token, p, 1);
        long shipped = readLong(callJson(post("/api/orders/checkout"), token,
                "{\"addressId\":" + addressId(token) + "}"), "$.data.orders[0].id");
        String seller = sellerToken();
        for (String next : List.of("CONFIRMED", "PROCESSING", "SHIPPING")) {
            callJson(patch("/api/seller/orders/" + shipped + "/status"), seller, "{\"status\":\"" + next + "\"}")
                    .andExpect(status().isOk());
        }
        callJson(patch("/api/orders/" + shipped + "/cancel"), token, "{\"cancelReason\":\"Muộn rồi\"}")
                .andExpect(status().isConflict());
        // Khách vẫn huỷ được khi CONFIRMED
        addToCart(token, p, 1);
        long confirmed = readLong(callJson(post("/api/orders/checkout"), token,
                "{\"addressId\":" + addressId(token) + "}"), "$.data.orders[0].id");
        callJson(patch("/api/seller/orders/" + confirmed + "/status"), seller, "{\"status\":\"CONFIRMED\"}")
                .andExpect(status().isOk());
        callJson(patch("/api/orders/" + confirmed + "/cancel"), token, "{\"cancelReason\":\"Đổi ý\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }
}
