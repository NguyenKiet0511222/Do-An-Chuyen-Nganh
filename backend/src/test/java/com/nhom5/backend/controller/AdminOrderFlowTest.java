package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.Product;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Admin quản lý đơn toàn sàn (api.md mục 3.5, 4.9). */
class AdminOrderFlowTest extends ApiTestSupport {

    @Test
    void listFiltersAndDetail() throws Exception {
        String admin = adminToken();
        Product product = approvedProduct(SELLER_EMAIL, 20);
        Order order = orderFor(product, 2);
        Long shopId = product.getShop().getId();

        call(get("/api/admin/orders").param("keyword", order.getOrderCode().toLowerCase()), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].orderCode").value(order.getOrderCode()))
                .andExpect(jsonPath("$.data.content[0].shop.id").value(shopId.intValue()))
                .andExpect(jsonPath("$.data.content[0].customer.fullName").value("Khách Test"));

        call(get("/api/admin/orders").param("status", "PENDING,CONFIRMED").param("shopId", shopId.toString())
                .param("paymentMethod", "COD").param("size", "100"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].id", hasItem(order.getId().intValue())))
                .andExpect(jsonPath("$.data.content[*].status", not(hasItem("DELIVERED"))));

        // Shop khác không lẫn đơn này
        Long otherShopId = shopOf(OTHER_SELLER_EMAIL).getId();
        call(get("/api/admin/orders").param("shopId", otherShopId.toString()).param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem(order.getId().intValue()))));

        String today = LocalDate.now().toString();
        String yesterday = LocalDate.now().minusDays(1).toString();
        call(get("/api/admin/orders").param("to", yesterday).param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem(order.getId().intValue()))));
        call(get("/api/admin/orders").param("from", today).param("to", yesterday), admin)
                .andExpect(status().isBadRequest());
        call(get("/api/admin/orders").param("status", "REFUNDED"), admin).andExpect(status().isBadRequest());

        call(get("/api/admin/orders/" + order.getId()), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderCode").value(order.getOrderCode()))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.history", hasSize(1)));
        call(get("/api/admin/orders/99999999"), admin).andExpect(status().isNotFound());
    }

    @Test
    void adminMovesOrderThroughLifecycle() throws Exception {
        String admin = adminToken();
        Product product = approvedProduct(OTHER_SELLER_EMAIL, 10);
        Order order = orderFor(product, 3);
        String base = "/api/admin/orders/" + order.getId() + "/status";

        callJson(patch(base), admin, "{\"status\":\"SHIPPING\"}").andExpect(status().isConflict());
        callJson(patch(base), admin, "{\"status\":\"CONFIRMED\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.history[1].changedBy",
                        not(product.getShop().getShopName())));
        callJson(patch(base), admin, "{\"status\":\"PROCESSING\"}").andExpect(status().isOk());
        callJson(patch(base), admin, "{\"status\":\"SHIPPING\",\"note\":\"GHN123\"}").andExpect(status().isOk());
        callJson(patch(base), admin, "{\"status\":\"DELIVERED\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"));
        assertEquals(3, productRepository.findById(product.getId()).orElseThrow().getSoldCount());
    }

    @Test
    void cancelRequiresReasonRestoresStockAndNeedsAdmin() throws Exception {
        String admin = adminToken();
        Product product = approvedProduct(SELLER_EMAIL, 10);
        Order order = orderFor(product, 4);
        String base = "/api/admin/orders/" + order.getId() + "/status";

        callJson(patch(base), admin, "{\"status\":\"CANCELLED\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("lý do")));
        callJson(patch(base), admin, "{\"status\":\"CANCELLED\",\"cancelReason\":\"Khách báo đặt nhầm\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.cancelReason").value("Khách báo đặt nhầm"));
        // orderFor không trừ kho -> huỷ cộng thêm 4
        assertEquals(14, productRepository.findById(product.getId()).orElseThrow().getStockQuantity());

        call(get("/api/admin/orders"), sellerToken()).andExpect(status().isForbidden());
    }
}
