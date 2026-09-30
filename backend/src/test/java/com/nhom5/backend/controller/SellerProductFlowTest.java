package com.nhom5.backend.controller;

import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.enums.HiddenBy;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Sản phẩm của người bán (mục 3.2, 4.8): tạo nháp, ảnh, gửi duyệt, khoá khi PENDING, duyệt lại, ẩn-hiện, tồn kho, xoá. */
class SellerProductFlowTest extends ApiTestSupport {

    @Autowired
    private ProductRepository productRepository;

    @Test
    void createValidatesInput() throws Exception {
        String token = sellerToken();
        callJson(post("/api/seller/products"), token, "{\"name\":\"A\",\"price\":0,\"stockQuantity\":-1}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.name").exists())
                .andExpect(jsonPath("$.data.price").exists())
                .andExpect(jsonPath("$.data.stockQuantity").exists())
                .andExpect(jsonPath("$.data.categoryId").exists())
                .andExpect(jsonPath("$.data.unit").exists());

        callJson(post("/api/seller/products"), token, productJson("Cà rốt", 30000, 5).replace(
                        "\"categoryId\":" + categoryId(), "\"categoryId\":999999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Danh mục")));

        callJson(post("/api/seller/products"), token, "{bad json")
                .andExpect(status().isBadRequest());
    }

    @Test
    void draftImagesSubmitThenLockedWhilePending() throws Exception {
        String token = sellerToken();
        long id = createProduct(token, "Cải thảo test", 25000, 40);

        // Chưa có ảnh -> chưa gửi duyệt được
        call(post("/api/seller/products/" + id + "/submit"), token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ít nhất 1 ảnh")));

        // Ảnh đầu tiên: thành ảnh chính, AI chưa tích hợp -> UNCERTAIN chờ admin
        ResultActions first = uploadImage(token, id)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.images", hasSize(1)))
                .andExpect(jsonPath("$.data.images[0].isPrimary").value(true))
                .andExpect(jsonPath("$.data.images[0].url", startsWith("/uploads/products/" + id + "/")))
                .andExpect(jsonPath("$.data.images[0].ai.label").value("UNCERTAIN"))
                .andExpect(jsonPath("$.data.images[0].ai.reviewStatus").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.data.aiOverallLabel").value("UNCERTAIN"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));
        long firstImageId = readLong(first, "$.data.images[0].id");

        // Ảnh thứ 2 (field "file") không thay ảnh chính; đặt ảnh 2 làm ảnh chính
        ResultActions second = call(multipart("/api/seller/products/" + id + "/images").file(png("file")), token)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.images", hasSize(2)))
                .andExpect(jsonPath("$.data.images[1].isPrimary").value(false));
        long secondImageId = readLong(second, "$.data.images[1].id");
        call(patch("/api/seller/products/" + id + "/images/" + secondImageId + "/primary"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.images[0].isPrimary").value(false))
                .andExpect(jsonPath("$.data.images[1].isPrimary").value(true));

        // Sai định dạng / vượt 5 ảnh -> 400
        MockMultipartFile text = new MockMultipartFile("files", "a.txt", MediaType.TEXT_PLAIN_VALUE, "x".getBytes());
        call(multipart("/api/seller/products/" + id + "/images").file(text), token)
                .andExpect(status().isBadRequest());
        call(multipart("/api/seller/products/" + id + "/images")
                .file(png("files")).file(png("files")).file(png("files")).file(png("files")), token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("tối đa 5 ảnh")));
        call(multipart("/api/seller/products/" + id + "/images"), token).andExpect(status().isBadRequest());

        // Xoá ảnh chính -> ảnh còn lại thành ảnh chính
        call(delete("/api/seller/products/" + id + "/images/" + secondImageId), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.images", hasSize(1)))
                .andExpect(jsonPath("$.data.images[0].id").value(firstImageId))
                .andExpect(jsonPath("$.data.images[0].isPrimary").value(true));

        call(post("/api/seller/products/" + id + "/submit"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // Đang PENDING: khoá sửa + ảnh, chỉ sửa được tồn kho; gửi duyệt lại -> 409
        callJson(put("/api/seller/products/" + id), token, productJson("Cải thảo test", 26000, 40))
                .andExpect(status().isConflict());
        uploadImage(token, id).andExpect(status().isConflict());
        call(delete("/api/seller/products/" + id + "/images/" + firstImageId), token).andExpect(status().isConflict());
        call(post("/api/seller/products/" + id + "/submit"), token).andExpect(status().isConflict());
        callJson(patch("/api/seller/products/" + id + "/stock"), token, "{\"stockQuantity\":7}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stockQuantity").value(7))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
        callJson(patch("/api/seller/products/" + id + "/stock"), token, "{\"stockQuantity\":-1}")
                .andExpect(status().isBadRequest());

        // Danh sách: lọc 1 hoặc nhiều trạng thái, giá trị lạ -> 400
        call(get("/api/seller/products").param("status", "PENDING").param("size", "100"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) id)))
                .andExpect(jsonPath("$.data.content[*].status", not(hasItem("APPROVED"))));
        call(get("/api/seller/products").param("status", "REJECTED,NEED_INFO").param("size", "100"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[*].id", not(hasItem((int) id))));
        call(get("/api/seller/products").param("status", "FOO"), token).andExpect(status().isBadRequest());
        call(get("/api/seller/products").param("keyword", "cải thảo test"), token)
                .andExpect(jsonPath("$.data.content[0].id").value(id))
                .andExpect(jsonPath("$.data.content[0].primaryImageUrl", startsWith("/uploads/products/")))
                .andExpect(jsonPath("$.data.content[0].category.name").value("Củ quả"));
    }

    @Test
    void approvedProductEditRulesAndVisibility() throws Exception {
        String token = sellerToken();
        long id = createProduct(token, "Bí đỏ test", 18000, 30);
        uploadImage(token, id).andExpect(status().isCreated());
        setStatus(id, ProductStatus.APPROVED, null);

        // Chỉ đổi tồn kho qua PUT -> vẫn APPROVED
        callJson(put("/api/seller/products/" + id), token, productJson("Bí đỏ test", 18000, 99))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.stockQuantity").value(99));

        // Ẩn -> HIDDEN (SELLER), bỏ ẩn -> APPROVED
        callJson(patch("/api/seller/products/" + id + "/visibility"), token, "{\"hidden\":true}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("HIDDEN"))
                .andExpect(jsonPath("$.data.hiddenBy").value("SELLER"));
        callJson(patch("/api/seller/products/" + id + "/visibility"), token, "{\"hidden\":false}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.hiddenBy").doesNotExist());
        callJson(patch("/api/seller/products/" + id + "/visibility"), token, "{\"hidden\":false}")
                .andExpect(status().isConflict());
        callJson(patch("/api/seller/products/" + id + "/visibility"), token, "{}")
                .andExpect(status().isBadRequest());

        // Admin ẩn -> người bán không tự bỏ ẩn được
        setStatus(id, ProductStatus.HIDDEN, HiddenBy.ADMIN);
        callJson(patch("/api/seller/products/" + id + "/visibility"), token, "{\"hidden\":false}")
                .andExpect(status().isForbidden());

        // Đổi đơn vị (không phải tồn kho) của sản phẩm đã duyệt -> về PENDING
        setStatus(id, ProductStatus.APPROVED, null);
        callJson(put("/api/seller/products/" + id), token, productJson("Bí đỏ test", 18000, 99, "trái"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.unit").value("trái"));

        // Sản phẩm DRAFT không ẩn được
        long draft = createProduct(token, "Nháp không ẩn", 10000, 1);
        callJson(patch("/api/seller/products/" + draft + "/visibility"), token, "{\"hidden\":true}")
                .andExpect(status().isConflict());
    }

    @Test
    void rejectedProductShowsReasonAndCanBeResubmitted() throws Exception {
        String token = sellerToken();
        long id = createProduct(token, "Nấm rơm test", 60000, 12);
        uploadImage(token, id);
        Product p = productRepository.findById(id).orElseThrow();
        p.setStatus(ProductStatus.REJECTED);
        p.setRejectReason("Ảnh có dấu hiệu hỏng");
        productRepository.save(p);

        call(get("/api/seller/products/" + id), token)
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.rejectReason").value("Ảnh có dấu hiệu hỏng"));
        call(get("/api/seller/products").param("status", "REJECTED,NEED_INFO").param("size", "100"), token)
                .andExpect(jsonPath("$.data.content[*].id", hasItem((int) id)));

        // Sửa khi REJECTED giữ nguyên trạng thái; gửi duyệt -> PENDING và xoá lý do
        callJson(put("/api/seller/products/" + id), token, productJson("Nấm rơm tươi test", 60000, 12))
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
        call(post("/api/seller/products/" + id + "/submit"), token)
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.rejectReason").doesNotExist());
    }

    @Test
    void cannotSeeOrTouchOtherShopsProducts() throws Exception {
        long id = createProduct(sellerToken(), "Sản phẩm riêng Tâm An", 10000, 1);
        String other = login(OTHER_SELLER_EMAIL, SELLER_PASSWORD);
        call(get("/api/seller/products/" + id), other).andExpect(status().isNotFound());
        callJson(patch("/api/seller/products/" + id + "/stock"), other, "{\"stockQuantity\":1}")
                .andExpect(status().isNotFound());
        call(delete("/api/seller/products/" + id), other).andExpect(status().isNotFound());

        String customer = login(registerCustomer(), "secret123");
        call(get("/api/seller/products"), customer).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/seller/products")).andExpect(status().isUnauthorized());
    }

    @Test
    void deleteProductWithoutOrders() throws Exception {
        String token = sellerToken();
        long id = createProduct(token, "Sản phẩm sẽ xoá", 10000, 1);
        uploadImage(token, id);
        call(delete("/api/seller/products/" + id), token).andExpect(status().isOk());
        call(get("/api/seller/products/" + id), token).andExpect(status().isNotFound());
    }

    // ---------- helpers ----------

    private long createProduct(String token, String name, long price, int stock) throws Exception {
        return readLong(callJson(post("/api/seller/products"), token, productJson(name, price, stock))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.slug").isString()), "$.data.id");
    }

    private ResultActions uploadImage(String token, long productId) throws Exception {
        return call(multipart("/api/seller/products/" + productId + "/images").file(png("files")), token);
    }

    /** Giả lập thao tác của admin (API duyệt sản phẩm làm ở tuần 6). */
    private void setStatus(long id, ProductStatus status, HiddenBy hiddenBy) {
        Product p = productRepository.findById(id).orElseThrow();
        p.setStatus(status);
        p.setHiddenBy(hiddenBy);
        productRepository.save(p);
    }
}
