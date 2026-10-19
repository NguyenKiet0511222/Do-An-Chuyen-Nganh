package com.nhom5.backend.controller;

import com.nhom5.backend.dto.ai.AiPrediction;
import com.nhom5.backend.service.AiServiceClient;
import com.nhom5.backend.service.ProductAiLabeler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.AdditionalMatchers.aryEq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Người bán tải ảnh khi AI bật (docs/1910.md mục 1, 6). AiServiceClient được mock nên không cần chạy AI service.
 * Bean mock tạo context Spring riêng -> dùng DB H2 riêng để không xoá / seed lại DB của các test khác.
 */
@TestPropertySource(properties =
        "spring.datasource.url=jdbc:h2:mem:nongsan_ai_flow_test;MODE=MSSQLServer;DB_CLOSE_DELAY=-1")
class SellerProductAiFlowTest extends ApiTestSupport {

    @MockitoBean
    private AiServiceClient aiServiceClient;

    @BeforeEach
    void aiEnabled() {
        when(aiServiceClient.isEnabled()).thenReturn(true);
    }

    @Test
    void freshFruitAboveThreshold_isAutoAccepted() throws Exception {
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(new AiPrediction(
                "apple_fresh", "apple", "fresh", 0.95, Map.of("apple_fresh", 0.95), "mobilenetv2-pt-v1")));
        String token = sellerToken();
        long id = createFruitProduct(token, "Táo đỏ test AI");

        uploadImage(token, id)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.images[0].ai.label").value("FRESH"))
                .andExpect(jsonPath("$.data.images[0].ai.reviewStatus").value("AUTO_ACCEPTED"))
                .andExpect(jsonPath("$.data.images[0].ai.produce").value("apple"))
                .andExpect(jsonPath("$.data.images[0].ai.confidence").value(0.95))
                .andExpect(jsonPath("$.data.images[0].ai.note").doesNotExist())
                .andExpect(jsonPath("$.data.aiOverallLabel").value("FRESH"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));

        // AI nhận đúng bytes + tên + content-type của ảnh người bán tải lên
        verify(aiServiceClient).classify(aryEq(PNG_BYTES), eq("anh.png"), eq("image/png"));
    }

    @Test
    void aiFailureOnFirstImage_restOfUploadSkipsAi() throws Exception {
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.empty());
        String token = sellerToken();
        long id = createFruitProduct(token, "Xoài test AI lỗi");

        call(multipart("/api/seller/products/" + id + "/images").file(png("files")).file(png("files")), token)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.images", hasSize(2)))
                .andExpect(jsonPath("$.data.images[*].ai.label", everyItem(is("UNCERTAIN"))))
                .andExpect(jsonPath("$.data.images[*].ai.reviewStatus", everyItem(is("PENDING_REVIEW"))))
                .andExpect(jsonPath("$.data.images[*].ai.note", everyItem(is(ProductAiLabeler.NOTE_AI_UNAVAILABLE))))
                .andExpect(jsonPath("$.data.aiOverallLabel").value("UNCERTAIN"));

        // Ảnh 1 lỗi -> ảnh 2 không gọi AI nữa (tránh mỗi ảnh chờ 5s timeout)
        verify(aiServiceClient, times(1)).classify(any(), any(), any());

        // Chỉ bỏ qua trong cùng lần tải: AI trả lời lại thì lần tải sau gọi AI bình thường
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(new AiPrediction(
                "mango_fresh", "mango", "fresh", 0.95, Map.of("mango_fresh", 0.95), "mobilenetv2-pt-v1")));
        uploadImage(token, id)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.images", hasSize(3)))
                .andExpect(jsonPath("$.data.images[2].ai.label").value("FRESH"))
                .andExpect(jsonPath("$.data.images[2].ai.reviewStatus").value("AUTO_ACCEPTED"));
        verify(aiServiceClient, times(2)).classify(any(), any(), any());

        // AI lỗi không chặn người bán gửi duyệt
        call(post("/api/seller/products/" + id + "/submit"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    /** Tạo sản phẩm DRAFT trong danh mục "Trái cây" (aiProduceKeys gồm apple, mango...). */
    private long createFruitProduct(String token, String name) throws Exception {
        long fruitCategoryId = categoryRepository.findBySlug("trai-cay").orElseThrow().getId();
        String json = productJson(name, 50_000, 20)
                .replace("\"categoryId\":" + categoryId(), "\"categoryId\":" + fruitCategoryId);
        return readLong(callJson(post("/api/seller/products"), token, json)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.category.name").value("Trái cây")), "$.data.id");
    }
}
