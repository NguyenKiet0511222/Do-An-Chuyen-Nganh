package com.nhom5.backend.controller;

import com.nhom5.backend.dto.ai.AiHealth;
import com.nhom5.backend.dto.ai.AiPrediction;
import com.nhom5.backend.entity.Setting;
import com.nhom5.backend.repository.AiResultRepository;
import com.nhom5.backend.repository.SettingRepository;
import com.nhom5.backend.service.AiServiceClient;
import com.nhom5.backend.service.AiSettingsService;
import com.nhom5.backend.service.ProductAiLabeler;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalMatchers.aryEq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Admin kiểm định AI (docs/1910.md mục 2, 3, 4, 6, 7.2): hàng chờ chỉ hiện ảnh sản phẩm PENDING / APPROVED / HIDDEN
 * (cũ nhất trước), ACCEPT / CORRECT / RETAKE,
 * accept-bulk, ngưỡng trong bảng settings, thống kê, thử mô hình, phân quyền.
 *
 * <p>AiServiceClient được mock: mặc định {@code isEnabled() = false} nên ảnh mới là UNCERTAIN / PENDING_REVIEW như
 * test profile; test cần kết quả AI thì tự stub. Bean mock tạo context riêng -> dùng DB H2 riêng, nên ngưỡng đổi ở
 * đây không ảnh hưởng test khác; trong lớp này vẫn xoá bảng settings sau mỗi test (về mặc định 0.90 / 0.70).</p>
 */
@TestPropertySource(properties =
        "spring.datasource.url=jdbc:h2:mem:nongsan_admin_ai_test;MODE=MSSQLServer;DB_CLOSE_DELAY=-1")
class AdminAiReviewFlowTest extends ApiTestSupport {

    private static final String BASE = "/api/admin/ai";
    private static final String MODEL_VERSION = "mobilenetv2-pt-v1";
    private static final String TAM_AN_SHOP = "Vườn rau Tâm An";

    @MockitoBean
    private AiServiceClient aiServiceClient;

    @Autowired
    private SettingRepository settingRepository;
    @Autowired
    private AiResultRepository aiResultRepository;

    @AfterEach
    void restoreDefaultThresholds() {
        settingRepository.deleteAll();
    }

    @Test
    void draftImagesAreHiddenFromQueueUntilProductIsSubmitted() throws Exception {
        String seller = sellerToken();
        String admin = adminToken();
        Uploaded img = productWithImage(seller, "Cà chua bi test hàng chờ", "cu-qua", false);
        String shopId = String.valueOf(shopOf(SELLER_EMAIL).getId());
        String today = LocalDate.now().toString();

        // Nháp: người bán còn đang sửa -> không vào hàng chờ, nhưng vẫn xem chi tiết được
        call(get(BASE + "/results").param("shopId", shopId).param("sort", "newest").param("size", "100"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) img.aiId()))));
        call(get(BASE + "/results/" + img.aiId()), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.product.status").value("DRAFT"));

        submit(seller, img.productId());

        call(get(BASE + "/results").param("shopId", shopId).param("from", today).param("to", today)
                        .param("sort", "newest").param("size", "100"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) img.aiId())));
        // Trang đầy -> chạy cả câu đếm (countQuery)
        call(get(BASE + "/results").param("shopId", shopId).param("size", "1"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.size").value(1))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(1)));
        call(get(BASE + "/results/" + img.aiId()), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imageUrl").value(startsWith("/uploads/products/" + img.productId() + "/")))
                .andExpect(jsonPath("$.data.produce").doesNotExist())
                .andExpect(jsonPath("$.data.label").value("UNCERTAIN"))
                .andExpect(jsonPath("$.data.confidence").value(0.0))
                .andExpect(jsonPath("$.data.finalLabel").doesNotExist())
                .andExpect(jsonPath("$.data.displayLabel").value("UNCERTAIN"))
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.data.note").value(ProductAiLabeler.NOTE_AI_DISABLED))
                .andExpect(jsonPath("$.data.createdAt").isString())
                .andExpect(jsonPath("$.data.reviewedAt").doesNotExist())
                .andExpect(jsonPath("$.data.reviewedBy").doesNotExist())
                .andExpect(jsonPath("$.data.product.id").value(img.productId()))
                .andExpect(jsonPath("$.data.product.name").value("Cà chua bi test hàng chờ"))
                .andExpect(jsonPath("$.data.product.status").value("PENDING"))
                .andExpect(jsonPath("$.data.product.categoryName").value("Củ quả"))
                .andExpect(jsonPath("$.data.shop.id").value(Long.parseLong(shopId)))
                .andExpect(jsonPath("$.data.shop.shopName").value(TAM_AN_SHOP));

        // Bộ lọc: nhãn hiển thị, trạng thái kiểm định, loại nông sản
        call(get(BASE + "/results").param("shopId", shopId).param("label", "UNCERTAIN").param("sort", "newest")
                        .param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) img.aiId())));
        call(get(BASE + "/results").param("shopId", shopId).param("label", "FRESH").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) img.aiId()))));
        call(get(BASE + "/results").param("reviewStatus", "ACCEPTED,CORRECTED").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) img.aiId()))));
        call(get(BASE + "/results").param("produce", "tomato").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) img.aiId()))));

        // Tham số sai -> 400; không có -> 404
        call(get(BASE + "/results").param("sort", "random"), admin).andExpect(status().isBadRequest());
        call(get(BASE + "/results").param("reviewStatus", "FOO"), admin).andExpect(status().isBadRequest());
        call(get(BASE + "/results").param("from", today).param("to", LocalDate.now().minusDays(1).toString()), admin)
                .andExpect(status().isBadRequest());
        call(get(BASE + "/results/999999"), admin).andExpect(status().isNotFound());
    }

    @Test
    void correctUncertainImage_updatesProductLabel_andSecondReviewIsConflict() throws Exception {
        String seller = sellerToken();
        String admin = adminToken();
        long adminId = userRepository.findByEmail(ADMIN_EMAIL).orElseThrow().getId();
        Uploaded img = productWithImage(seller, "Khoai tây test sửa nhãn", "cu-qua", true);

        // UNCERTAIN không có gì để chấp nhận; CORRECT phải chọn FRESH / ROTTEN
        review(admin, img.aiId(), "{\"action\":\"ACCEPT\"}").andExpect(status().isBadRequest());
        review(admin, img.aiId(), "{\"action\":\"CORRECT\"}").andExpect(status().isBadRequest());
        review(admin, img.aiId(), "{\"action\":\"CORRECT\",\"finalLabel\":\"UNCERTAIN\"}")
                .andExpect(status().isBadRequest());
        review(admin, img.aiId(), "{\"action\":\"FOO\"}").andExpect(status().isBadRequest());
        review(admin, img.aiId(), "{}").andExpect(status().isBadRequest());
        call(get(BASE + "/results/" + img.aiId()), admin)
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"));

        review(admin, img.aiId(), "{\"action\":\"CORRECT\",\"finalLabel\":\"FRESH\",\"note\":\"Khoai tươi, ảnh rõ\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviewStatus").value("CORRECTED"))
                .andExpect(jsonPath("$.data.label").value("UNCERTAIN"))
                .andExpect(jsonPath("$.data.finalLabel").value("FRESH"))
                .andExpect(jsonPath("$.data.displayLabel").value("FRESH"))
                .andExpect(jsonPath("$.data.note").value(ProductAiLabeler.NOTE_AI_DISABLED + " | Admin: Khoai tươi, ảnh rõ"))
                .andExpect(jsonPath("$.data.reviewedBy.id").value(adminId))
                .andExpect(jsonPath("$.data.reviewedBy.fullName").isString())
                .andExpect(jsonPath("$.data.reviewedAt").isString());

        // Nhãn tổng của sản phẩm tính lại theo nhãn admin sửa
        call(get("/api/admin/products/" + img.productId()), admin)
                .andExpect(jsonPath("$.data.aiOverallLabel").value("FRESH"));

        // Đã kiểm định -> 409, rời hàng chờ nhưng vẫn tra được theo trạng thái
        review(admin, img.aiId(), "{\"action\":\"CORRECT\",\"finalLabel\":\"ROTTEN\"}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Kết quả AI #" + img.aiId() + " đã được kiểm định (CORRECTED)"));
        call(get(BASE + "/results").param("size", "100").param("sort", "newest"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) img.aiId()))));
        call(get(BASE + "/results").param("reviewStatus", "CORRECTED,ACCEPTED").param("label", "FRESH")
                        .param("sort", "newest").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) img.aiId())));

        review(admin, 999999, "{\"action\":\"ACCEPT\"}").andExpect(status().isNotFound());
    }

    @Test
    void correctToAiLabelCountsAsAccept_andAutoAcceptedImageCanStillBeCorrected() throws Exception {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(prediction("mango_rotten", 0.97)));
        String seller = sellerToken();
        String admin = adminToken();

        Uploaded rotten = productWithImage(seller, "Xoài test hỏng", "trai-cay", true);
        call(get(BASE + "/results/" + rotten.aiId()), admin)
                .andExpect(jsonPath("$.data.label").value("ROTTEN"))
                .andExpect(jsonPath("$.data.produce").value("mango"))
                .andExpect(jsonPath("$.data.modelVersion").value(MODEL_VERSION))
                .andExpect(jsonPath("$.data.inferenceMs").isNumber())
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"));
        call(get(BASE + "/results").param("produce", "Mango").param("label", "ROTTEN").param("sort", "newest")
                        .param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) rotten.aiId())));

        // Sửa thành đúng nhãn AI -> tính như chấp nhận, không tăng số "admin đã sửa"
        review(admin, rotten.aiId(), "{\"action\":\"CORRECT\",\"finalLabel\":\"ROTTEN\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviewStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.finalLabel").doesNotExist())
                .andExpect(jsonPath("$.data.displayLabel").value("ROTTEN"));

        // AI tự chấp nhận sai vẫn sửa được
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(prediction("apple_fresh", 0.95)));
        Uploaded fresh = productWithImage(seller, "Táo test tự chấp nhận", "trai-cay", true);
        review(admin, fresh.aiId(), "{\"action\":\"CORRECT\",\"finalLabel\":\"ROTTEN\",\"note\":\"Táo bị dập\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviewStatus").value("CORRECTED"))
                .andExpect(jsonPath("$.data.label").value("FRESH"))
                .andExpect(jsonPath("$.data.displayLabel").value("ROTTEN"))
                .andExpect(jsonPath("$.data.note").value("Admin: Táo bị dập"));
        call(get("/api/seller/products/" + fresh.productId()), seller)
                .andExpect(jsonPath("$.data.aiOverallLabel").value("ROTTEN"));
    }

    @Test
    void retakeOnPendingProduct_movesToNeedInfo_andBlocksResubmitUntilImageReplaced() throws Exception {
        String seller = sellerToken();
        String admin = adminToken();
        Uploaded img = productWithImage(seller, "Ớt chuông test chụp lại", "cu-qua", true);

        review(admin, img.aiId(), "{\"action\":\"RETAKE\"}").andExpect(status().isBadRequest());
        review(admin, img.aiId(), "{\"action\":\"RETAKE\",\"note\":\"   \"}").andExpect(status().isBadRequest());

        review(admin, img.aiId(), "{\"action\":\"RETAKE\",\"note\":\"Ảnh mờ, chụp gần hơn\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviewStatus").value("RETAKE_REQUESTED"))
                .andExpect(jsonPath("$.data.product.status").value("NEED_INFO"))
                .andExpect(jsonPath("$.data.note").value(ProductAiLabeler.NOTE_AI_DISABLED + " | Admin: Ảnh mờ, chụp gần hơn"));

        // Sản phẩm PENDING -> NEED_INFO + 1 dòng lịch sử duyệt do admin
        call(get("/api/admin/products/" + img.productId()), admin)
                .andExpect(jsonPath("$.data.status").value("NEED_INFO"))
                .andExpect(jsonPath("$.data.rejectReason").value("Ảnh cần chụp lại: Ảnh mờ, chụp gần hơn"))
                .andExpect(jsonPath("$.data.reviewHistory", hasSize(2)))
                .andExpect(jsonPath("$.data.reviewHistory[1].action").value("NEED_INFO"))
                .andExpect(jsonPath("$.data.reviewHistory[1].fromStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.reviewHistory[1].toStatus").value("NEED_INFO"))
                .andExpect(jsonPath("$.data.reviewHistory[1].reason").value("Ảnh cần chụp lại: Ảnh mờ, chụp gần hơn"))
                .andExpect(jsonPath("$.data.reviewHistory[1].actorRole").value("ADMIN"));

        // Chưa thay ảnh -> không gửi duyệt lại được
        call(post("/api/seller/products/" + img.productId() + "/submit"), seller)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Chưa đủ điều kiện gửi duyệt: có 1 ảnh admin yêu cầu chụp lại (xoá và tải ảnh mới)"));

        // Xoá ảnh cũ (kết quả AI xoá theo), tải ảnh mới -> gửi duyệt được, ảnh mới vào hàng chờ
        call(delete("/api/seller/products/" + img.productId() + "/images/" + img.imageId()), seller)
                .andExpect(status().isOk());
        call(get(BASE + "/results/" + img.aiId()), admin).andExpect(status().isNotFound());
        long pendingBefore = pendingReview(admin);
        long newAiId = readLong(uploadImage(seller, img.productId()).andExpect(status().isCreated()),
                "$.data.images[0].ai.id");
        // Sản phẩm còn NEED_INFO (lượt của người bán) -> ảnh mới chưa vào hàng chờ, chưa tính vào pendingReview
        call(get(BASE + "/results").param("sort", "newest").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) newAiId))));
        assertEquals(pendingBefore, pendingReview(admin));

        submit(seller, img.productId());
        call(get(BASE + "/results").param("sort", "newest").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) newAiId)));
        assertEquals(pendingBefore + 1, pendingReview(admin));
    }

    @Test
    void queueShowsOnlyPendingApprovedHiddenProducts_andAcceptBulkFollowsTheSameRule() throws Exception {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(prediction("tomato_fresh", 0.85)));
        String seller = sellerToken();
        String admin = adminToken();
        long pendingBefore = pendingReview(admin);

        Uploaded rejected = productWithImage(seller, "Cà chua test hàng chờ bị từ chối", "cu-qua", true);
        reviewProduct(admin, rejected.productId(), "{\"action\":\"REJECT\",\"reason\":\"Sai danh mục\"}");
        Uploaded needInfo = productWithImage(seller, "Cà chua test hàng chờ cần bổ sung", "cu-qua", true);
        reviewProduct(admin, needInfo.productId(), "{\"action\":\"NEED_INFO\",\"reason\":\"Thêm mô tả\"}");
        Uploaded hidden = productWithImage(seller, "Cà chua test hàng chờ đang ẩn", "cu-qua", true);
        reviewProduct(admin, hidden.productId(), "{\"action\":\"APPROVE\"}");
        reviewProduct(admin, hidden.productId(), "{\"action\":\"HIDE\"}");

        // REJECTED / NEED_INFO: lượt của người bán -> ẩn khỏi hàng chờ; HIDDEN (sản phẩm từng bán) vẫn hiện
        call(get(BASE + "/results").param("sort", "newest").param("size", "100"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) rejected.aiId()))))
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) needInfo.aiId()))))
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) hidden.aiId())));
        assertEquals(pendingBefore + 1, pendingReview(admin));
        // Kết quả của sản phẩm ngoài hàng chờ vẫn xem chi tiết được
        call(get(BASE + "/results/" + rejected.aiId()), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.product.status").value("REJECTED"));

        // accept-bulk cũng chỉ lấy ảnh trong hàng chờ
        callJson(patch(BASE + "/results/accept-bulk"), admin, "{\"minConfidence\":0.85}")
                .andExpect(status().isOk());
        call(get(BASE + "/results/" + hidden.aiId()), admin)
                .andExpect(jsonPath("$.data.reviewStatus").value("ACCEPTED"));
        call(get(BASE + "/results/" + rejected.aiId()), admin)
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"));
        call(get(BASE + "/results/" + needInfo.aiId()), admin)
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"));
    }

    @Test
    void queueDefaultsToOldestFirst_andSortNewestReverses() throws Exception {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(prediction("jujube_fresh", 0.8)));
        String seller = sellerToken();
        String admin = adminToken();
        Uploaded older = productWithImage(seller, "Táo tàu test xếp cũ", "trai-cay", true);
        Uploaded newer = productWithImage(seller, "Táo tàu test xếp mới", "trai-cay", true);
        String shopId = String.valueOf(shopOf(SELLER_EMAIL).getId());

        List<Long> defaultOrder = ids(call(get(BASE + "/results").param("shopId", shopId).param("produce", "jujube")
                .param("size", "100"), admin).andExpect(status().isOk()));
        List<Long> newestOrder = ids(call(get(BASE + "/results").param("shopId", shopId).param("produce", "jujube")
                .param("sort", "newest").param("size", "100"), admin).andExpect(status().isOk()));

        // Mặc định cũ nhất trước (ai chờ lâu xử lý trước); sort=newest đảo lại
        assertTrue(defaultOrder.contains(older.aiId()) && defaultOrder.contains(newer.aiId()));
        assertTrue(defaultOrder.indexOf(older.aiId()) < defaultOrder.indexOf(newer.aiId()));
        assertEquals(0, newestOrder.indexOf(newer.aiId()));
        assertTrue(newestOrder.indexOf(newer.aiId()) < newestOrder.indexOf(older.aiId()));
    }

    @Test
    void retakeOnApprovedProduct_onlyMarksTheImage() throws Exception {
        String seller = sellerToken();
        String admin = adminToken();
        Uploaded img = productWithImage(seller, "Bí đỏ test chụp lại đang bán", "cu-qua", true);
        callJson(patch("/api/admin/products/" + img.productId() + "/review"), admin, "{\"action\":\"APPROVE\"}")
                .andExpect(status().isOk());

        // Sản phẩm đang bán vẫn có ảnh chờ kiểm định trong hàng chờ
        call(get(BASE + "/results").param("sort", "newest").param("size", "100"), admin)
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) img.aiId())));

        review(admin, img.aiId(), "{\"action\":\"RETAKE\",\"note\":\"Ảnh bị lóa\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reviewStatus").value("RETAKE_REQUESTED"))
                .andExpect(jsonPath("$.data.product.status").value("APPROVED"));
        call(get("/api/admin/products/" + img.productId()), admin)
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.rejectReason").doesNotExist())
                .andExpect(jsonPath("$.data.reviewHistory", hasSize(2))); // SUBMIT + APPROVE, không thêm dòng
    }

    @Test
    void acceptBulk_onlyAcceptsFreshImagesInQueueAboveMinConfidence() throws Exception {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(
                Optional.of(prediction("tomato_fresh", 0.81)),
                Optional.of(prediction("tomato_fresh", 0.76)),
                Optional.of(prediction("tomato_fresh", 0.85)),
                Optional.of(prediction("tomato_rotten", 0.95)),
                Optional.of(prediction("tomato_fresh", 0.80)),
                Optional.of(prediction("apple_fresh", 0.95)));
        String seller = sellerToken();
        String admin = adminToken();
        Uploaded above = productWithImage(seller, "Cà chua test bulk 81", "cu-qua", true);
        Uploaded below = productWithImage(seller, "Cà chua test bulk 76", "cu-qua", true);
        Uploaded draft = productWithImage(seller, "Cà chua test bulk nháp", "cu-qua", false);
        Uploaded rotten = productWithImage(seller, "Cà chua test bulk hỏng", "cu-qua", true);
        Uploaded exact = productWithImage(seller, "Cà chua test bulk 80", "cu-qua", true);
        Uploaded autoAccepted = productWithImage(seller, "Táo test bulk tự chấp nhận", "trai-cay", true);
        call(get(BASE + "/results/" + autoAccepted.aiId()), admin)
                .andExpect(jsonPath("$.data.reviewStatus").value("AUTO_ACCEPTED"));

        callJson(patch(BASE + "/results/accept-bulk"), admin, "{\"minConfidence\":0.8}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.succeeded", greaterThanOrEqualTo(2)));

        call(get(BASE + "/results/" + above.aiId()), admin)
                .andExpect(jsonPath("$.data.reviewStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.reviewedBy.id").isNumber())
                .andExpect(jsonPath("$.data.reviewedAt").isString());
        call(get(BASE + "/results/" + exact.aiId()), admin)   // đúng bằng ngưỡng cũng được chấp nhận (≥)
                .andExpect(jsonPath("$.data.reviewStatus").value("ACCEPTED"));
        call(get(BASE + "/results/" + autoAccepted.aiId()), admin)   // AI đã tự chấp nhận -> không đụng tới
                .andExpect(jsonPath("$.data.reviewStatus").value("AUTO_ACCEPTED"))
                .andExpect(jsonPath("$.data.reviewedBy").doesNotExist())
                .andExpect(jsonPath("$.data.reviewedAt").doesNotExist());
        call(get(BASE + "/results/" + below.aiId()), admin)
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"));
        call(get(BASE + "/results/" + draft.aiId()), admin)   // sản phẩm nháp không thuộc hàng chờ
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"));
        call(get(BASE + "/results/" + rotten.aiId()), admin)
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"));

        callJson(patch(BASE + "/results/accept-bulk"), admin, "{}").andExpect(status().isBadRequest());
        callJson(patch(BASE + "/results/accept-bulk"), admin, "{\"minConfidence\":0.4}")
                .andExpect(status().isBadRequest());
        callJson(patch(BASE + "/results/accept-bulk"), admin, "{\"minConfidence\":1.5}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void settings_validateAndApplyToNextUploadOnly() throws Exception {
        String admin = adminToken();
        String seller = sellerToken();

        when(aiServiceClient.health()).thenReturn(Optional.of(new AiHealth("ok", true, MODEL_VERSION)));
        call(get(BASE + "/settings"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.autoAcceptThreshold").value(0.9))
                .andExpect(jsonPath("$.data.reviewThreshold").value(0.7))
                .andExpect(jsonPath("$.data.modelVersion").value(MODEL_VERSION))
                .andExpect(jsonPath("$.data.aiOnline").value(true));
        when(aiServiceClient.health()).thenReturn(Optional.of(new AiHealth("ok", false, MODEL_VERSION)));
        call(get(BASE + "/settings"), admin).andExpect(jsonPath("$.data.aiOnline").value(false));
        when(aiServiceClient.health()).thenReturn(Optional.empty());
        call(get(BASE + "/settings"), admin)
                .andExpect(jsonPath("$.data.aiOnline").value(false))
                .andExpect(jsonPath("$.data.modelVersion").doesNotExist());

        // Sai điều kiện 0 < review < autoAccept ≤ 1 -> 400, không lưu
        callJson(put(BASE + "/settings"), admin, "{\"autoAcceptThreshold\":0.8,\"reviewThreshold\":0.8}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ngưỡng kiểm định phải nhỏ hơn ngưỡng tự chấp nhận"));
        callJson(put(BASE + "/settings"), admin, "{\"autoAcceptThreshold\":1.2,\"reviewThreshold\":0.5}")
                .andExpect(status().isBadRequest());
        callJson(put(BASE + "/settings"), admin, "{\"autoAcceptThreshold\":0.9,\"reviewThreshold\":0}")
                .andExpect(status().isBadRequest());
        callJson(put(BASE + "/settings"), admin, "{\"autoAcceptThreshold\":0.9}")
                .andExpect(status().isBadRequest());
        assertEquals(0, settingRepository.count());

        // Ngưỡng mặc định 0.90: táo tươi 0.88 -> chờ admin
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(prediction("apple_fresh", 0.88)));
        long productId = createProductIn(seller, "Táo test đổi ngưỡng", "trai-cay");
        uploadImage(seller, productId)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.images[0].ai.reviewStatus").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.data.images[0].ai.note").value("apple_fresh (88%) — dưới ngưỡng tự chấp nhận 90%"));

        callJson(put(BASE + "/settings"), admin, "{\"autoAcceptThreshold\":0.85,\"reviewThreshold\":0.6}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.autoAcceptThreshold").value(0.85))
                .andExpect(jsonPath("$.data.reviewThreshold").value(0.6));
        call(get(BASE + "/settings"), admin)
                .andExpect(jsonPath("$.data.autoAcceptThreshold").value(0.85))
                .andExpect(jsonPath("$.data.reviewThreshold").value(0.6));
        assertEquals("0.85", settingRepository.findById(AiSettingsService.KEY_AUTO_ACCEPT_THRESHOLD)
                .orElseThrow().getValue());

        // Ảnh tải lên SAU khi đổi ngưỡng áp ngưỡng mới; ảnh cũ giữ nguyên nhãn
        uploadImage(seller, productId)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.images[0].ai.reviewStatus").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.data.images[1].ai.reviewStatus").value("AUTO_ACCEPTED"));
    }

    @Test
    void settings_invalidStoredPair_fallsBackToBothDefaults() throws Exception {
        String admin = adminToken();

        // Dòng review hỏng -> mặc định 0.70, ghép với 0.65 đã lưu thành cặp sai -> dùng cả 2 mặc định, không trộn
        settingRepository.save(new Setting(AiSettingsService.KEY_AUTO_ACCEPT_THRESHOLD, "0.65"));
        settingRepository.save(new Setting(AiSettingsService.KEY_REVIEW_THRESHOLD, "abc"));
        call(get(BASE + "/settings"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.autoAcceptThreshold").value(0.9))
                .andExpect(jsonPath("$.data.reviewThreshold").value(0.7));

        // Thiếu dòng review nhưng ghép với mặc định vẫn hợp lệ -> giữ giá trị đã lưu
        settingRepository.deleteById(AiSettingsService.KEY_REVIEW_THRESHOLD);
        settingRepository.save(new Setting(AiSettingsService.KEY_AUTO_ACCEPT_THRESHOLD, "0.8"));
        call(get(BASE + "/settings"), admin)
                .andExpect(jsonPath("$.data.autoAcceptThreshold").value(0.8))
                .andExpect(jsonPath("$.data.reviewThreshold").value(0.7));
    }

    @Test
    void statistics_countByDisplayLabelAndReviewStatus() throws Exception {
        String seller = sellerToken();
        String admin = adminToken();
        String today = LocalDate.now().toString();

        ResultActions before = stats(admin, today, today)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.byLabel.FRESH").isNumber())
                .andExpect(jsonPath("$.data.byLabel.ROTTEN").isNumber())
                .andExpect(jsonPath("$.data.byLabel.UNCERTAIN").isNumber())
                .andExpect(jsonPath("$.data.byReviewStatus.AUTO_ACCEPTED").isNumber())
                .andExpect(jsonPath("$.data.byReviewStatus.RETAKE_REQUESTED").isNumber());
        long total = readLong(before, "$.data.totalClassified");
        long uncertain = readLong(before, "$.data.byLabel.UNCERTAIN");
        long rotten = readLong(before, "$.data.byLabel.ROTTEN");
        long pendingStatus = readLong(before, "$.data.byReviewStatus.PENDING_REVIEW");
        long pending = readLong(before, "$.data.pendingReview");
        long corrected = readLong(before, "$.data.correctedByAdmin");
        long unavailable = readLong(before, "$.data.aiUnavailable");
        Number avgBefore = read(before, "$.data.avgConfidence"); // ảnh seed tạo hôm nay có model_version
        assertNotNull(avgBefore);

        // 1 ảnh mới (AI tắt) của sản phẩm đã gửi duyệt
        Uploaded img = productWithImage(seller, "Su hào test thống kê", "cu-qua", true);
        ResultActions afterUpload = stats(admin, today, today);
        assertEquals(total + 1, readLong(afterUpload, "$.data.totalClassified"));
        assertEquals(uncertain + 1, readLong(afterUpload, "$.data.byLabel.UNCERTAIN"));
        assertEquals(pendingStatus + 1, readLong(afterUpload, "$.data.byReviewStatus.PENDING_REVIEW"));
        assertEquals(pending + 1, readLong(afterUpload, "$.data.pendingReview"));
        assertEquals(unavailable + 1, readLong(afterUpload, "$.data.aiUnavailable"));
        // Ảnh AI lỗi (confidence 0) không kéo tụt confidence trung bình
        Number avgAfter = read(afterUpload, "$.data.avgConfidence");
        assertEquals(avgBefore.doubleValue(), avgAfter.doubleValue(), 1e-9);

        // Admin sửa thành Hỏng -> đếm theo nhãn hiển thị, rời hàng chờ
        review(admin, img.aiId(), "{\"action\":\"CORRECT\",\"finalLabel\":\"ROTTEN\"}").andExpect(status().isOk());
        ResultActions afterReview = stats(admin, today, today);
        assertEquals(total + 1, readLong(afterReview, "$.data.totalClassified"));
        assertEquals(uncertain, readLong(afterReview, "$.data.byLabel.UNCERTAIN"));
        assertEquals(rotten + 1, readLong(afterReview, "$.data.byLabel.ROTTEN"));
        assertEquals(pending, readLong(afterReview, "$.data.pendingReview"));
        assertEquals(corrected + 1, readLong(afterReview, "$.data.correctedByAdmin"));

        // Khoảng ngày không có dữ liệu: các số theo ngày = 0, pendingReview vẫn là số đang chờ hiện tại
        stats(admin, "2000-01-01", "2000-01-31")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalClassified").value(0))
                .andExpect(jsonPath("$.data.byLabel.FRESH").value(0))
                .andExpect(jsonPath("$.data.avgConfidence").doesNotExist())
                .andExpect(jsonPath("$.data.pendingReview").value(pending));
        // Không lọc ngày: ảnh seed có model_version -> có confidence trung bình
        call(get(BASE + "/statistics"), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avgConfidence").isNumber());
        stats(admin, today, LocalDate.now().minusDays(1).toString()).andExpect(status().isBadRequest());
    }

    @Test
    void classify_returnsTop3WithoutSaving_and503WhenAiDown() throws Exception {
        String admin = adminToken();
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(new AiPrediction(
                "apple_fresh", "apple", "fresh", 0.93,
                Map.of("apple_fresh", 0.93, "apple_rotten", 0.05, "banana_fresh", 0.015, "mango_fresh", 0.005),
                MODEL_VERSION)));
        long savedBefore = aiResultRepository.count();

        call(multipart(BASE + "/classify").file(png("file")), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.label").value("apple_fresh"))
                .andExpect(jsonPath("$.data.produce").value("apple"))
                .andExpect(jsonPath("$.data.condition").value("fresh"))
                .andExpect(jsonPath("$.data.confidence").value(0.93))
                .andExpect(jsonPath("$.data.top", hasSize(3)))
                .andExpect(jsonPath("$.data.top[0].label").value("apple_fresh"))
                .andExpect(jsonPath("$.data.top[0].score").value(0.93))
                .andExpect(jsonPath("$.data.top[1].label").value("apple_rotten"))
                .andExpect(jsonPath("$.data.top[2].label").value("banana_fresh"))
                .andExpect(jsonPath("$.data.modelVersion").value(MODEL_VERSION))
                .andExpect(jsonPath("$.data.inferenceMs").isNumber());
        // Field "image" cũng nhận
        call(multipart(BASE + "/classify").file(png("image")), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.label").value("apple_fresh"));
        verify(aiServiceClient, times(2)).classify(aryEq(PNG_BYTES), eq("anh.png"), eq("image/png"));
        assertEquals(savedBefore, aiResultRepository.count()); // thử mô hình không lưu lịch sử

        // Thiếu ảnh / không phải ảnh -> 400
        call(multipart(BASE + "/classify"), admin).andExpect(status().isBadRequest());
        call(multipart(BASE + "/classify").file(new MockMultipartFile("file", "a.txt", MediaType.TEXT_PLAIN_VALUE,
                "hello".getBytes())), admin)
                .andExpect(status().isBadRequest());

        // AI tắt / lỗi -> 503
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.empty());
        call(multipart(BASE + "/classify").file(png("file")), admin)
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("AI service không phản hồi, thử lại sau"));
    }

    @Test
    void onlyAdminCanUseAiReviewApi() throws Exception {
        String settingsJson = "{\"autoAcceptThreshold\":0.9,\"reviewThreshold\":0.7}";
        for (String token : List.of(sellerToken(), login(registerCustomer(), "secret123"))) {
            call(get(BASE + "/results"), token).andExpect(status().isForbidden());
            call(get(BASE + "/results/1"), token).andExpect(status().isForbidden());
            callJson(patch(BASE + "/results/1/review"), token, "{\"action\":\"ACCEPT\"}")
                    .andExpect(status().isForbidden());
            callJson(patch(BASE + "/results/accept-bulk"), token, "{\"minConfidence\":0.9}")
                    .andExpect(status().isForbidden());
            call(multipart(BASE + "/classify").file(png("file")), token).andExpect(status().isForbidden());
            call(get(BASE + "/settings"), token).andExpect(status().isForbidden());
            callJson(put(BASE + "/settings"), token, settingsJson).andExpect(status().isForbidden());
            call(get(BASE + "/statistics"), token).andExpect(status().isForbidden());
        }
        mockMvc.perform(get(BASE + "/results")).andExpect(status().isUnauthorized());
        assertEquals(0, settingRepository.count());
    }

    // ---------- helpers ----------

    private record Uploaded(long productId, long imageId, long aiId) {
    }

    /** Sản phẩm 1 ảnh trong danh mục (slug seed: cu-qua, trai-cay...); submit = true thì gửi duyệt luôn (PENDING). */
    private Uploaded productWithImage(String sellerToken, String name, String categorySlug, boolean submit)
            throws Exception {
        long productId = createProductIn(sellerToken, name, categorySlug);
        ResultActions upload = uploadImage(sellerToken, productId).andExpect(status().isCreated());
        Uploaded uploaded = new Uploaded(productId, readLong(upload, "$.data.images[0].id"),
                readLong(upload, "$.data.images[0].ai.id"));
        if (submit) {
            submit(sellerToken, productId);
        }
        return uploaded;
    }

    private long createProductIn(String sellerToken, String name, String categorySlug) throws Exception {
        long id = categoryRepository.findBySlug(categorySlug).orElseThrow().getId();
        String json = productJson(name, 50_000, 20).replace("\"categoryId\":" + categoryId(), "\"categoryId\":" + id);
        return readLong(callJson(post("/api/seller/products"), sellerToken, json).andExpect(status().isCreated()),
                "$.data.id");
    }

    private void submit(String sellerToken, long productId) throws Exception {
        call(post("/api/seller/products/" + productId + "/submit"), sellerToken)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    private ResultActions review(String adminToken, long aiId, String json) throws Exception {
        return callJson(patch(BASE + "/results/" + aiId + "/review"), adminToken, json);
    }

    private ResultActions stats(String adminToken, String from, String to) throws Exception {
        return call(get(BASE + "/statistics").param("from", from).param("to", to), adminToken);
    }

    /** Số ảnh đang chờ kiểm định hiện tại (cũng là số trên badge menu "Kiểm định AI"). */
    private long pendingReview(String adminToken) throws Exception {
        return readLong(call(get(BASE + "/statistics"), adminToken).andExpect(status().isOk()), "$.data.pendingReview");
    }

    /** Admin duyệt sản phẩm (APPROVE / REJECT / NEED_INFO / HIDE...). */
    private void reviewProduct(String adminToken, long productId, String json) throws Exception {
        callJson(patch("/api/admin/products/" + productId + "/review"), adminToken, json).andExpect(status().isOk());
    }

    /** Danh sách id kết quả AI trên trang, giữ đúng thứ tự trả về. */
    private static List<Long> ids(ResultActions result) throws Exception {
        List<Number> ids = read(result, "$.data.content[*].id");
        return ids.stream().map(Number::longValue).toList();
    }

    /** "mango_rotten", 0.97 -> produce mango, condition rotten (như AI service trả). */
    private static AiPrediction prediction(String label, double confidence) {
        int cut = label.lastIndexOf('_');
        return new AiPrediction(label, label.substring(0, cut), label.substring(cut + 1), confidence,
                Map.of(label, confidence), MODEL_VERSION);
    }
}
