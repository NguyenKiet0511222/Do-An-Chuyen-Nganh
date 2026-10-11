package com.nhom5.backend.controller;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Admin duyệt sản phẩm (api.md 3.2, 4.9): vòng đời PENDING -> REJECTED -> PENDING -> APPROVED -> HIDDEN -> APPROVED, lịch sử, bulk. */
class AdminProductReviewFlowTest extends ApiTestSupport {

    private static final String BASE = "/api/admin/products";

    /** Sản phẩm có ảnh, đã gửi duyệt (PENDING). */
    private long pendingProduct(String sellerToken, String name) throws Exception {
        long id = createProduct(sellerToken, name, 30_000, 10);
        uploadImage(sellerToken, id).andExpect(status().isCreated());
        call(post("/api/seller/products/" + id + "/submit"), sellerToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));
        return id;
    }

    @Test
    void rejectNeedsReason_thenResubmitApproveHideUnhide_withFullHistory() throws Exception {
        String seller = sellerToken();
        String admin = adminToken();
        long id = pendingProduct(seller, "Rau muống test duyệt");

        // Lịch sử đã có dòng SUBMIT của người bán; chi tiết kèm shop + ảnh + AI
        call(get(BASE + "/" + id), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.shop.shopName").value("Vườn rau Tâm An"))
                .andExpect(jsonPath("$.data.shop.productCounts.approved").isNumber())
                .andExpect(jsonPath("$.data.images", hasSize(1)))
                .andExpect(jsonPath("$.data.images[0].ai.reviewStatus").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.data.reviewHistory", hasSize(1)))
                .andExpect(jsonPath("$.data.reviewHistory[0].action").value("SUBMIT"))
                .andExpect(jsonPath("$.data.reviewHistory[0].toStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.reviewHistory[0].actorRole").value("SELLER"));

        // Từ chối thiếu lý do -> 400, không đổi trạng thái
        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"REJECT\"}")
                .andExpect(status().isBadRequest());
        call(get(BASE + "/" + id), admin).andExpect(jsonPath("$.data.status").value("PENDING"));

        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"REJECT\",\"reason\":\"Ảnh mờ, chụp lại\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectReason").value("Ảnh mờ, chụp lại"))
                .andExpect(jsonPath("$.data.reviewHistory", hasSize(2)))
                .andExpect(jsonPath("$.data.reviewHistory[1].action").value("REJECT"))
                .andExpect(jsonPath("$.data.reviewHistory[1].reason").value("Ảnh mờ, chụp lại"))
                .andExpect(jsonPath("$.data.reviewHistory[1].actorRole").value("ADMIN"));
        // Người bán thấy lý do, gửi duyệt lại
        call(get("/api/seller/products/" + id), seller)
                .andExpect(jsonPath("$.data.rejectReason").value("Ảnh mờ, chụp lại"));
        call(post("/api/seller/products/" + id + "/submit"), seller).andExpect(status().isOk());

        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"APPROVE\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.approvedAt").isString())
                .andExpect(jsonPath("$.data.rejectReason").doesNotExist());
        // Đã duyệt -> hiện trên trang công khai
        mockMvc.perform(get("/api/products/" + id)).andExpect(status().isOk());

        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"HIDE\",\"reason\":\"Khiếu nại\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("HIDDEN"))
                .andExpect(jsonPath("$.data.hiddenBy").value("ADMIN"));
        mockMvc.perform(get("/api/products/" + id)).andExpect(status().isNotFound());
        // Người bán không tự bỏ ẩn được hàng do admin ẩn
        callJson(patch("/api/seller/products/" + id + "/visibility"), seller, "{\"hidden\":false}")
                .andExpect(status().isForbidden());

        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"UNHIDE\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.hiddenBy").doesNotExist())
                .andExpect(jsonPath("$.data.reviewHistory", hasSize(6)))
                .andExpect(jsonPath("$.data.reviewHistory[5].action").value("UNHIDE"))
                .andExpect(jsonPath("$.data.reviewHistory[5].fromStatus").value("HIDDEN"))
                .andExpect(jsonPath("$.data.reviewHistory[5].toStatus").value("APPROVED"));

        // Sai trạng thái -> 409
        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"APPROVE\"}").andExpect(status().isConflict());
        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"UNHIDE\"}").andExpect(status().isConflict());
        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"FOO\"}").andExpect(status().isBadRequest());
        callJson(patch(BASE + "/999999/review"), admin, "{\"action\":\"APPROVE\"}").andExpect(status().isNotFound());
    }

    @Test
    void needInfoRequiresReasonAndSellerCanResubmit() throws Exception {
        String seller = sellerToken();
        String admin = adminToken();
        long id = pendingProduct(seller, "Cà rốt test bổ sung");

        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"NEED_INFO\"}")
                .andExpect(status().isBadRequest());
        callJson(patch(BASE + "/" + id + "/review"), admin, "{\"action\":\"NEED_INFO\",\"reason\":\"Thêm ảnh cận\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("NEED_INFO"))
                .andExpect(jsonPath("$.data.rejectReason").value("Thêm ảnh cận"));
        uploadImage(seller, id).andExpect(status().isCreated());
        call(post("/api/seller/products/" + id + "/submit"), seller)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void listFiltersByStatusDateShopAndAiLabel() throws Exception {
        String admin = adminToken();
        long id = pendingProduct(sellerToken(), "Bí xanh test lọc");
        long tamAnShop = shopOf(SELLER_EMAIL).getId();
        String today = LocalDate.now().toString();

        call(get(BASE).param("status", "PENDING").param("size", "100"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) id)))
                .andExpect(jsonPath("$.data.content[*].status", not(hasItem("APPROVED"))))
                .andExpect(jsonPath("$.data.content[0].shop.shopName").isString());
        call(get(BASE).param("status", "APPROVED,HIDDEN").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) id))));
        call(get(BASE).param("from", today).param("to", today).param("shopId", String.valueOf(tamAnShop))
                        .param("aiLabel", "UNCERTAIN").param("keyword", "bí xanh").param("size", "100"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) id)));
        call(get(BASE).param("from", today).param("to", LocalDate.now().minusDays(1).toString()), admin)
                .andExpect(status().isBadRequest());
        call(get(BASE).param("status", "FOO"), admin).andExpect(status().isBadRequest());

        // Không phải admin -> 403
        call(get(BASE), sellerToken()).andExpect(status().isForbidden());
        callJson(patch(BASE + "/" + id + "/review"), login(registerCustomer(), "secret123"), "{\"action\":\"APPROVE\"}")
                .andExpect(status().isForbidden());
    }

    @Test
    void bulkReviewIsPartialSuccess() throws Exception {
        String seller = sellerToken();
        String admin = adminToken();
        long pending1 = pendingProduct(seller, "Bulk 1");
        long pending2 = pendingProduct(seller, "Bulk 2");
        long draft = createProduct(seller, "Bulk nháp", 10_000, 1);

        callJson(patch(BASE + "/review-bulk"), admin,
                "{\"productIds\":[" + pending1 + "," + pending2 + "," + draft + ",999999],\"action\":\"APPROVE\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.succeeded").value(2))
                .andExpect(jsonPath("$.data.failed", hasSize(2)))
                .andExpect(jsonPath("$.data.failed[0].productId").value(draft))
                .andExpect(jsonPath("$.data.failed[1].productId").value(999999));
        call(get(BASE + "/" + pending1), admin).andExpect(jsonPath("$.data.status").value("APPROVED"));
        call(get(BASE + "/" + pending2), admin).andExpect(jsonPath("$.data.status").value("APPROVED"));
        call(get(BASE + "/" + draft), admin).andExpect(jsonPath("$.data.status").value("DRAFT"));

        // Bulk REJECT thiếu lý do -> từng sản phẩm lỗi 400 -> failed hết
        long pending3 = pendingProduct(seller, "Bulk 3");
        callJson(patch(BASE + "/review-bulk"), admin, "{\"productIds\":[" + pending3 + "],\"action\":\"REJECT\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.succeeded").value(0))
                .andExpect(jsonPath("$.data.failed[0].productId").value(pending3));
        callJson(patch(BASE + "/review-bulk"), admin, "{\"productIds\":[],\"action\":\"APPROVE\"}")
                .andExpect(status().isBadRequest());
    }
}
