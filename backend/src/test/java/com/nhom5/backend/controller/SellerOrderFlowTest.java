package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.OrderItem;
import com.nhom5.backend.entity.OrderStatusHistory;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

/** Đơn hàng của shop (mục 3.5, 4.8). Đơn được tạo thẳng qua repository vì checkout làm ở tuần 5. */
class SellerOrderFlowTest extends ApiTestSupport {

    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ShopRepository shopRepository;
    @Autowired
    private UserRepository userRepository;

    @Test
    void fullLifecycleUntilDelivered() throws Exception {
        String token = sellerToken();
        Product product = sellerProduct(50);
        int soldBefore = product.getSoldCount();
        Order order = createOrder(product, 3);
        String base = "/api/seller/orders/" + order.getId();

        call(get("/api/seller/orders").param("status", "PENDING").param("size", "100"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].orderCode", hasItem(order.getOrderCode())));

        call(get(base), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.customer.fullName").value("Khách Test"))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].quantity").value(3))
                .andExpect(jsonPath("$.data.total").value(product.getPrice() * 3 + 20000))
                .andExpect(jsonPath("$.data.history", hasSize(1)));

        // Nhảy cóc -> 409
        callJson(patch(base + "/status"), token, "{\"status\":\"SHIPPING\"}").andExpect(status().isConflict());

        callJson(patch(base + "/status"), token, "{\"status\":\"CONFIRMED\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.confirmedAt").exists())
                .andExpect(jsonPath("$.data.history[1].changedBy").value("Vườn rau Tâm An"));
        callJson(patch(base + "/status"), token, "{\"status\":\"PROCESSING\"}")
                .andExpect(jsonPath("$.data.status").value("PROCESSING"));
        callJson(patch(base + "/status"), token, "{\"status\":\"SHIPPING\",\"note\":\"Mã vận đơn GHN123\"}")
                .andExpect(jsonPath("$.data.status").value("SHIPPING"))
                .andExpect(jsonPath("$.data.history[3].note").value("Mã vận đơn GHN123"));

        // Đang giao không được huỷ
        callJson(patch(base + "/status"), token, "{\"status\":\"CANCELLED\",\"cancelReason\":\"x\"}")
                .andExpect(status().isConflict());

        callJson(patch(base + "/status"), token, "{\"status\":\"DELIVERED\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERED"))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.data.deliveredAt").exists())
                .andExpect(jsonPath("$.data.history", hasSize(5)));
        assertEquals(soldBefore + 3, productRepository.findById(product.getId()).orElseThrow().getSoldCount());

        // Đã hoàn thành -> không đổi được nữa
        callJson(patch(base + "/status"), token, "{\"status\":\"PENDING\"}").andExpect(status().isConflict());
    }

    @Test
    void cancelRequiresReasonAndRestoresStock() throws Exception {
        String token = sellerToken();
        Product product = sellerProduct(10);
        Order order = createOrder(product, 4);
        String base = "/api/seller/orders/" + order.getId();

        callJson(patch(base + "/status"), token, "{\"status\":\"CANCELLED\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("lý do")));
        callJson(patch(base + "/status"), token, "{\"status\":\"CANCELLED\",\"cancelReason\":\"Hết hàng đợt này\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.cancelReason").value("Hết hàng đợt này"))
                .andExpect(jsonPath("$.data.history[1].note").value("Hết hàng đợt này"));
        assertEquals(14, productRepository.findById(product.getId()).orElseThrow().getStockQuantity());
    }

    @Test
    void validationFiltersAndIsolation() throws Exception {
        String token = sellerToken();
        Order order = createOrder(sellerProduct(5), 1);

        callJson(patch("/api/seller/orders/" + order.getId() + "/status"), token, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.status").exists());
        callJson(patch("/api/seller/orders/" + order.getId() + "/status"), token, "{\"status\":\"NOPE\"}")
                .andExpect(status().isBadRequest());

        String today = LocalDate.now().toString();
        String yesterday = LocalDate.now().minusDays(1).toString();
        call(get("/api/seller/orders").param("from", today).param("to", today).param("size", "100"), token)
                .andExpect(jsonPath("$.data.content[*].id", hasItem(order.getId().intValue())));
        call(get("/api/seller/orders").param("to", yesterday).param("size", "100"), token)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem(order.getId().intValue()))));
        call(get("/api/seller/orders").param("from", today).param("to", yesterday), token)
                .andExpect(status().isBadRequest());
        call(get("/api/seller/orders").param("from", "30-09-2026"), token)
                .andExpect(status().isBadRequest());
        call(get("/api/seller/orders").param("status", "PENDING,CONFIRMED").param("size", "100"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].status", not(hasItem("DELIVERED"))));

        // Shop khác không thấy đơn này
        String other = login(OTHER_SELLER_EMAIL, SELLER_PASSWORD);
        call(get("/api/seller/orders/" + order.getId()), other).andExpect(status().isNotFound());
        callJson(patch("/api/seller/orders/" + order.getId() + "/status"), other, "{\"status\":\"CONFIRMED\"}")
                .andExpect(status().isNotFound());
    }

    @Test
    void dashboardSummaryAndAiResults() throws Exception {
        String token = sellerToken();
        Order order = createOrder(sellerProduct(20), 2);

        long revenueBefore = readLong(call(get("/api/seller/dashboard/summary"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pendingOrders").isNumber())
                .andExpect(jsonPath("$.data.productsByStatus.DRAFT").isNumber())
                .andExpect(jsonPath("$.data.productsByStatus.PENDING").isNumber())
                .andExpect(jsonPath("$.data.productsByStatus.APPROVED").isNumber())
                .andExpect(jsonPath("$.data.productsByStatus.REJECTED").isNumber())
                .andExpect(jsonPath("$.data.productsByStatus.NEED_INFO").isNumber())
                .andExpect(jsonPath("$.data.productsByStatus.HIDDEN").isNumber())
                .andExpect(jsonPath("$.data.aiFlags.pendingReview").isNumber())
                .andExpect(jsonPath("$.data.aiFlags.retakeRequested").isNumber())
                .andExpect(jsonPath("$.data.aiFlags.rotten").isNumber()), "$.data.todayRevenue");

        for (String next : new String[]{"CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"}) {
            callJson(patch("/api/seller/orders/" + order.getId() + "/status"), token, "{\"status\":\"" + next + "\"}")
                    .andExpect(status().isOk());
        }
        call(get("/api/seller/dashboard/summary"), token)
                .andExpect(jsonPath("$.data.todayRevenue").value(revenueBefore + order.getTotal()));

        // Ảnh mới upload -> nằm trong kết quả AI chờ admin, kèm product.id để frontend dẫn tới trang sửa
        call(get("/api/seller/ai/results").param("reviewStatus", "PENDING_REVIEW").param("size", "100"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].reviewStatus", not(hasItem("AUTO_ACCEPTED"))));
        call(get("/api/seller/ai/results"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].product.id").isNumber())
                .andExpect(jsonPath("$.data.content[0].imageUrl").isString());
        call(get("/api/seller/ai/results").param("reviewStatus", "BAD"), token).andExpect(status().isBadRequest());
    }

    // ---------- helpers ----------

    /** Sản phẩm APPROVED mới của shop Tâm An với tồn kho cho trước. */
    private Product sellerProduct(int stock) {
        Shop shop = shopRepository.findByUserId(userRepository.findByEmail(SELLER_EMAIL).orElseThrow().getId())
                .orElseThrow();
        Product source = productRepository.findByShopIdAndStatusOrderByIdAsc(shop.getId(),
                com.nhom5.backend.entity.enums.ProductStatus.APPROVED).get(0);
        Product p = Product.builder()
                .shop(shop)
                .category(source.getCategory())
                .name("SP đơn test " + UUID.randomUUID().toString().substring(0, 6))
                .slug("sp-don-test-" + UUID.randomUUID())
                .price(35_000L)
                .unit("kg")
                .stockQuantity(stock)
                .status(com.nhom5.backend.entity.enums.ProductStatus.APPROVED)
                .build();
        return productRepository.save(p);
    }

    private Order createOrder(Product product, int quantity) throws Exception {
        User customer = userRepository.findByEmail(registerCustomer()).orElseThrow();
        long subtotal = product.getPrice() * quantity;
        Order order = Order.builder()
                .orderCode("DH-T-" + UUID.randomUUID().toString().substring(0, 8))
                .checkoutGroupId(UUID.randomUUID().toString())
                .user(customer)
                .shop(product.getShop())
                .receiverName("Người nhận Test")
                .phone("0900000000")
                .shippingAddress("1 Lê Lợi, Quận 1, TP.HCM")
                .subtotal(subtotal)
                .shippingFee(20_000L)
                .total(subtotal + 20_000L)
                .build();
        order.addItem(OrderItem.builder()
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .price(product.getPrice())
                .quantity(quantity)
                .subtotal(subtotal)
                .build());
        order.addHistory(OrderStatusHistory.builder().toStatus(OrderStatus.PENDING).changedBy(customer).build());
        return orderRepository.save(order);
    }
}
