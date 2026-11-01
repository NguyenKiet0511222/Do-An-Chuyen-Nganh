package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Order;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Dashboard admin (api.md mục 4.9). DB dùng chung giữa các test -> chỉ so chênh lệch, không so tổng tuyệt đối. */
class AdminDashboardTest extends ApiTestSupport {

    @Test
    void summaryAndRevenueReflectDeliveredOrder() throws Exception {
        String admin = adminToken();
        long revenueBefore = readLong(call(get("/api/admin/dashboard/summary"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pendingProducts").isNumber())
                .andExpect(jsonPath("$.data.aiPendingReview").isNumber())
                .andExpect(jsonPath("$.data.aiRottenFlags").isNumber())
                .andExpect(jsonPath("$.data.pendingShops").isNumber())
                .andExpect(jsonPath("$.data.totalCustomers").isNumber())
                .andExpect(jsonPath("$.data.totalShops").isNumber()), "$.data.todayRevenue");
        long newOrdersBefore = readLong(call(get("/api/admin/dashboard/summary"), admin), "$.data.newOrdersToday");

        Order order = orderFor(approvedProduct(SELLER_EMAIL, 10), 2);
        long newOrdersAfter = readLong(call(get("/api/admin/dashboard/summary"), admin), "$.data.newOrdersToday");
        assertEquals(newOrdersBefore + 1, newOrdersAfter);

        String base = "/api/admin/orders/" + order.getId() + "/status";
        for (String s : new String[]{"CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"}) {
            callJson(patch(base), admin, "{\"status\":\"" + s + "\"}").andExpect(status().isOk());
        }

        long revenueAfter = readLong(call(get("/api/admin/dashboard/summary"), admin), "$.data.todayRevenue");
        assertEquals(revenueBefore + order.getTotal(), revenueAfter);

        var revenue = call(get("/api/admin/dashboard/revenue").param("days", "7"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(7)))
                .andExpect(jsonPath("$.data[6].date").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.data[0].date").value(LocalDate.now().minusDays(6).toString()));
        assertTrue(readLong(revenue, "$.data[6].revenue") >= order.getTotal());
        assertTrue(readLong(revenue, "$.data[6].orders") >= 1);

        call(get("/api/admin/dashboard/revenue"), admin).andExpect(jsonPath("$.data", hasSize(7)));
        call(get("/api/admin/dashboard/revenue").param("days", "0"), admin).andExpect(status().isBadRequest());
        call(get("/api/admin/dashboard/revenue").param("days", "91"), admin).andExpect(status().isBadRequest());
    }

    @Test
    void recentOrdersAndPendingProducts() throws Exception {
        String admin = adminToken();
        Order order = orderFor(approvedProduct(OTHER_SELLER_EMAIL, 5), 1);

        call(get("/api/admin/dashboard/recent-orders").param("limit", "3"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(lessThanOrEqualTo(3))))
                .andExpect(jsonPath("$.data[0].id").value(order.getId().intValue()))
                .andExpect(jsonPath("$.data[0].shop.shopName").isString());

        productInShop(SELLER_EMAIL, com.nhom5.backend.entity.enums.ProductStatus.PENDING, 3);
        call(get("/api/admin/dashboard/pending-products").param("limit", "2"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(lessThanOrEqualTo(2))))
                .andExpect(jsonPath("$.data[0].status").value("PENDING"))
                .andExpect(jsonPath("$.data[0].shop.shopName").isString());

        call(get("/api/admin/dashboard/recent-orders").param("limit", "0"), admin).andExpect(status().isBadRequest());
        call(get("/api/admin/dashboard/summary"), sellerToken()).andExpect(status().isForbidden());
    }
}
