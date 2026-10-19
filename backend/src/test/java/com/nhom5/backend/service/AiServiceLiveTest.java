package com.nhom5.backend.service;

import com.jayway.jsonpath.JsonPath;
import com.nhom5.backend.dto.ai.AiHealth;
import com.nhom5.backend.dto.ai.AiPrediction;
import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.repository.AiResultRepository;
import com.nhom5.backend.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm tra thật backend ↔ AI service Python (model MobileNetV2 thật, không mock) — chỉ chạy khi có {@code -Dai.live=true},
 * build / CI bình thường bỏ qua. Ảnh táo tự vẽ bằng Java2D (repo không có dataset) nên chỉ khẳng định kết quả
 * đúng hợp đồng, không khẳng định nhãn cụ thể. DB H2 riêng để không đụng DB của các test khác.
 */
// Chạy: bật AI service (cd ai && uvicorn ai.main:app --port 8000) rồi mvnw.cmd test -Dtest=AiServiceLiveTest "-Dai.live=true" (PowerShell phải bọc ngoặc kép)
@EnabledIfSystemProperty(named = "ai.live", matches = "true")
@SpringBootTest(properties = {
        "app.ai.enabled=true",
        "app.ai.base-url=http://localhost:8000",
        "spring.datasource.url=jdbc:h2:mem:nongsan_ai_live_test;MODE=MSSQLServer;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiServiceLiveTest {

    private static final String SELLER_EMAIL = "seller@nongsan.local";
    private static final String SELLER_PASSWORD = "Seller@123";
    private static final String ADMIN_EMAIL = "admin@nongsan.local";
    private static final String ADMIN_PASSWORD = "Admin@123";

    @Autowired
    private AiServiceClient aiServiceClient;
    @Autowired
    private AiResultRepository aiResultRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthReportsModelLoaded() {
        Optional<AiHealth> health = aiServiceClient.health();

        assertThat(health).as("AI service phải chạy ở localhost:8000").isPresent();
        assertThat(health.get().isReady()).as("model_loaded").isTrue();
        assertThat(health.get().modelVersion()).isNotBlank();
    }

    @Test
    void classifyPngReturnsPredictionMatchingContract() throws IOException {
        AiPrediction p = aiServiceClient.classify(produceImage("png"), "apple.png", MediaType.IMAGE_PNG_VALUE)
                .orElseThrow(() -> new AssertionError("AI service không trả kết quả cho ảnh PNG hợp lệ"));

        assertSanePrediction(p);
    }

    @Test
    void classifyJpegWithVietnameseFilename() throws IOException {
        // Người bán thường tải ảnh JPG tên tiếng Việt: filename không ASCII không được làm hỏng multipart
        AiPrediction p = aiServiceClient.classify(produceImage("jpg"), "táo đỏ Đà Lạt.jpg", MediaType.IMAGE_JPEG_VALUE)
                .orElseThrow(() -> new AssertionError("AI service không trả kết quả cho ảnh JPG tên tiếng Việt"));

        assertSanePrediction(p);
    }

    @Test
    void sellerUploadStoresRealAiResult() throws Exception {
        String token = login(SELLER_EMAIL, SELLER_PASSWORD);
        long fruitCategoryId = categoryRepository.findBySlug("trai-cay").orElseThrow().getId();
        String json = "{\"name\":\"Táo test AI thật\",\"categoryId\":" + fruitCategoryId + ",\"description\":\"Mô tả test\","
                + "\"price\":50000,\"unit\":\"kg\",\"stockQuantity\":20,\"origin\":\"Đà Lạt\"}";
        long productId = readLong(callJson(post("/api/seller/products"), token, json)
                .andExpect(status().isCreated()), "$.data.id");

        MockMultipartFile file = new MockMultipartFile("files", "táo đỏ.png", MediaType.IMAGE_PNG_VALUE,
                produceImage("png"));
        ResultActions upload = call(multipart("/api/seller/products/" + productId + "/images").file(file), token)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.images", hasSize(1)))
                .andExpect(jsonPath("$.data.images[0].ai.produce").isString());

        AiResult stored = aiResultRepository.findById(readLong(upload, "$.data.images[0].ai.id")).orElseThrow();
        assertThat(stored.getModelVersion()).as("model_version phải lưu khi AI trả lời").isNotBlank();
        assertThat(stored.getInferenceMs()).isNotNull().isNotNegative();
        assertThat(stored.getProduce()).isNotBlank();
        assertThat(stored.getConfidence()).isGreaterThan(BigDecimal.ZERO);
        assertThat(stored.getNote()).as("ảnh phải được AI gắn nhãn, không rơi vào nhánh AI lỗi / tắt")
                .isNotEqualTo(ProductAiLabeler.NOTE_AI_UNAVAILABLE)
                .isNotEqualTo(ProductAiLabeler.NOTE_AI_DISABLED);
    }

    @Test
    void adminTryModelAndSettingsSeeLiveAi() throws Exception {
        String token = login(ADMIN_EMAIL, ADMIN_PASSWORD);

        call(get("/api/admin/ai/settings"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.aiOnline").value(true))
                .andExpect(jsonPath("$.data.modelVersion").isString());

        MockMultipartFile file = new MockMultipartFile("file", "apple.png", MediaType.IMAGE_PNG_VALUE, produceImage("png"));
        call(multipart("/api/admin/ai/classify").file(file), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.label").isString())
                .andExpect(jsonPath("$.data.top", hasSize(3)))
                .andExpect(jsonPath("$.data.modelVersion").isString());
    }

    /** Đúng hợp đồng CLAUDE.md mục 7: label = {produce_type}_{condition}, confidence 0..1 khớp all_scores, đúng model đang chạy. */
    private void assertSanePrediction(AiPrediction p) {
        assertThat(p.condition()).isIn(AiPrediction.CONDITION_FRESH, AiPrediction.CONDITION_ROTTEN);
        assertThat(p.label()).isEqualTo(p.produceType() + "_" + p.condition());
        assertThat(p.confidence()).isGreaterThan(0.0).isLessThanOrEqualTo(1.0);
        assertThat(p.allScores()).containsEntry(p.label(), p.confidence());
        assertThat(p.allScores().values().stream().mapToDouble(Double::doubleValue).sum()).isCloseTo(1.0, within(0.01));
        assertThat(p.allScores().values()).allSatisfy(score -> assertThat(score).isLessThanOrEqualTo(p.confidence()));
        assertThat(p.modelVersion()).isNotBlank()
                .isEqualTo(aiServiceClient.health().map(AiHealth::modelVersion).orElse(null));
    }

    /** Ảnh 256×256 vẽ quả táo đỏ có cuống + lá (đủ để model thật giải mã và phân loại). */
    private static byte[] produceImage(String format) throws IOException {
        BufferedImage img = new BufferedImage(256, 256, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(new Color(245, 245, 240));
        g.fillRect(0, 0, 256, 256);
        g.setColor(new Color(200, 30, 35));
        g.fillOval(48, 60, 160, 160);
        g.setColor(new Color(235, 90, 90));
        g.fillOval(80, 85, 40, 40);
        g.setColor(new Color(90, 60, 30));
        g.fillRect(124, 30, 8, 40);
        g.setColor(new Color(60, 150, 50));
        g.fillOval(132, 36, 44, 24);
        g.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        assertThat(ImageIO.write(img, format, out)).as("ImageIO ghi được " + format).isTrue();
        return out.toByteArray();
    }

    // ---------- Giống ApiTestSupport (lớp đó package-private trong controller nên không kế thừa được) ----------

    private String login(String email, String password) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return JsonPath.read(body, "$.data.accessToken");
    }

    private ResultActions call(AbstractMockHttpServletRequestBuilder<?> request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private ResultActions callJson(AbstractMockHttpServletRequestBuilder<?> request, String token, String json)
            throws Exception {
        return call(request.contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private static long readLong(ResultActions result, String jsonPath) throws Exception {
        Number n = JsonPath.read(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8), jsonPath);
        return n.longValue();
    }
}
