package com.nhom5.backend.service;

import com.nhom5.backend.dto.ai.AiPrediction;
import com.nhom5.backend.dto.ai.AiThresholds;
import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.Category;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Bảng quy tắc gắn nhãn AI (docs/1910.md mục 1) — test thuần, AI service và ngưỡng đều mock.
 * Danh mục dựng giống ProductSeeder: "Rau củ" (không key) > "Củ quả", "Rau lá"; "Trái cây" là danh mục gốc.
 */
@ExtendWith(MockitoExtension.class)
class ProductAiLabelerTest {

    private static final String MODEL_VERSION = "mobilenetv2-pt-v1";
    private static final byte[] IMAGE_BYTES = {1, 2, 3, 4};
    private static final AiThresholds DEFAULT_THRESHOLDS = new AiThresholds(0.90, 0.70);

    @Mock
    private AiServiceClient aiServiceClient;
    @Mock
    private AiSettingsService aiSettingsService;
    @InjectMocks
    private ProductAiLabeler labeler;

    private final Category rauCu = category("Rau củ", null, null);
    private final Category cuQua = category("Củ quả", rauCu, "tomato,potato,carrot,bellpepper,cucumber");
    private final Category rauLa = category("Rau lá", rauCu, "cabbage,lettuce");
    private final Category traiCay = category("Trái cây", null,
            "mango,apple,banana,orange,strawberry,grape,guava,jujube,pomegranate");

    // ---------- Dòng 1: không có kết quả AI ----------

    @Test
    void row1_aiDisabled_queuesWithoutCallingAi() {
        when(aiServiceClient.isEnabled()).thenReturn(false);

        AiResult r = labeler.labelNewImage(image(traiCay), file());

        assertQueuedWithoutAi(r, ProductAiLabeler.NOTE_AI_DISABLED);
        verify(aiServiceClient, never()).classify(any(), any(), any());
        verifyNoInteractions(aiSettingsService);
    }

    @Test
    void row1_aiFailure_queuesWithFailureNote() {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.empty());

        AiResult r = labeler.labelNewImage(image(traiCay), file());

        assertQueuedWithoutAi(r, ProductAiLabeler.NOTE_AI_UNAVAILABLE);
        verifyNoInteractions(aiSettingsService);
    }

    @Test
    void row1_afterFirstFailure_restOfBatchSkipsAi() {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.empty());

        ProductAiLabeler.Batch batch = labeler.newBatch();
        List<AiResult> results = List.of(
                batch.label(image(traiCay), file()),
                batch.label(image(traiCay), file()),
                batch.label(image(traiCay), file()));

        verify(aiServiceClient, times(1)).classify(any(), any(), any());
        results.forEach(r -> assertQueuedWithoutAi(r, ProductAiLabeler.NOTE_AI_UNAVAILABLE));
    }

    /** "Bỏ qua AI sau khi lỗi" chỉ trong cùng lần tải — lần tải sau (lô mới, cùng labeler singleton) gọi AI lại. */
    @Test
    void row1_failureDoesNotCarryOverToNextBatch() {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiSettingsService.current()).thenReturn(DEFAULT_THRESHOLDS);
        when(aiServiceClient.classify(any(), any(), any()))
                .thenReturn(Optional.empty(), Optional.of(prediction("apple_fresh", 0.95)));

        ProductAiLabeler.Batch failed = labeler.newBatch();
        assertQueuedWithoutAi(failed.label(image(traiCay), file()), ProductAiLabeler.NOTE_AI_UNAVAILABLE);
        assertQueuedWithoutAi(failed.label(image(traiCay), file()), ProductAiLabeler.NOTE_AI_UNAVAILABLE);

        AiResult next = labeler.newBatch().label(image(traiCay), file());

        assertThat(next.getReviewStatus()).isEqualTo(AiReviewStatus.AUTO_ACCEPTED);
        verify(aiServiceClient, times(2)).classify(any(), any(), any());
    }

    @Test
    void batchKeepsCallingAiWhileItAnswers_andReadsThresholdsOnce() {
        givenAi(prediction("apple_fresh", 0.95));

        ProductAiLabeler.Batch batch = labeler.newBatch();
        batch.label(image(traiCay), file());
        batch.label(image(traiCay), file());

        verify(aiServiceClient, times(2)).classify(any(), any(), any());
        verify(aiSettingsService, times(1)).current();
    }

    @Test
    void sendsUploadedBytesFilenameAndContentType() {
        givenAi(prediction("apple_fresh", 0.95));

        labeler.labelNewImage(image(traiCay), file());

        verify(aiServiceClient).classify(IMAGE_BYTES, "tao.png", "image/png");
    }

    // ---------- Dòng 2: loại nông sản không thuộc danh mục ----------

    @Test
    void row2_produceOutsideCategory_isUncertain() {
        givenAi(prediction("cucumber_fresh", 0.72));

        AiResult r = labeler.labelNewImage(image(rauLa), file());

        assertThat(r.getLabel()).isEqualTo(AiLabel.UNCERTAIN);
        assertThat(r.getReviewStatus()).isEqualTo(AiReviewStatus.PENDING_REVIEW);
        assertThat(r.getNote())
                .isEqualTo("AI nhận ra cucumber_fresh (72%) — không thuộc danh mục \"Rau lá\" (cabbage, lettuce)");
        assertAiDataStored(r, "cucumber", "0.7200");
    }

    @Test
    void row2_isCheckedBeforeLowConfidence() {
        givenAi(prediction("cucumber_rotten", 0.40));

        AiResult r = labeler.labelNewImage(image(rauLa), file());

        assertThat(r.getLabel()).isEqualTo(AiLabel.UNCERTAIN);
        assertThat(r.getNote()).startsWith("AI nhận ra cucumber_rotten (40%) — không thuộc danh mục \"Rau lá\"");
    }

    @Test
    void row2_categoryWithoutKeys_usesParentKeys() {
        Category xoai = category("Xoài", traiCay, "  ");
        givenAi(prediction("mango_fresh", 0.95), prediction("tomato_fresh", 0.95));

        ProductAiLabeler.Batch batch = labeler.newBatch();
        AiResult mango = batch.label(image(xoai), file());
        AiResult tomato = batch.label(image(xoai), file());

        assertThat(mango.getReviewStatus()).isEqualTo(AiReviewStatus.AUTO_ACCEPTED);
        assertThat(tomato.getLabel()).isEqualTo(AiLabel.UNCERTAIN);
        assertThat(tomato.getNote()).isEqualTo("AI nhận ra tomato_fresh (95%) — không thuộc danh mục \"Trái cây\" "
                + "(mango, apple, banana, orange, strawberry, grape, guava, jujube, pomegranate)");
    }

    @Test
    void row2_noKeysOnCategoryOrParent_ruleIsSkipped() {
        Category rauGiaVi = category("Rau gia vị", rauCu, null); // cha "Rau củ" cũng không có key
        Category khac = category("Khác", null, "");
        givenAi(prediction("cucumber_fresh", 0.95));

        ProductAiLabeler.Batch batch = labeler.newBatch();
        assertThat(batch.label(image(rauGiaVi), file()).getReviewStatus()).isEqualTo(AiReviewStatus.AUTO_ACCEPTED);
        assertThat(batch.label(image(khac), file()).getReviewStatus()).isEqualTo(AiReviewStatus.AUTO_ACCEPTED);
    }

    @Test
    void row2_keysAreTrimmedCaseInsensitiveAndIgnoreEmptyTokens() {
        Category messy = category("Trái cây nhập", null, " Mango , APPLE,, ,");
        givenAi(new AiPrediction("Apple_fresh", "Apple", "FRESH", 0.95, Map.of(), MODEL_VERSION),
                prediction("banana_fresh", 0.95));

        ProductAiLabeler.Batch batch = labeler.newBatch();
        AiResult apple = batch.label(image(messy), file());
        AiResult banana = batch.label(image(messy), file());

        assertThat(apple.getReviewStatus()).isEqualTo(AiReviewStatus.AUTO_ACCEPTED);
        assertThat(apple.getProduce()).isEqualTo("apple");
        assertThat(banana.getLabel()).isEqualTo(AiLabel.UNCERTAIN);
        assertThat(banana.getNote()).endsWith("không thuộc danh mục \"Trái cây nhập\" (mango, apple)");
    }

    // ---------- Dòng 3–6 ----------

    @Test
    void row3_lowConfidence_isUncertain() {
        givenAi(prediction("bellpepper_rotten", 0.55));

        AiResult r = labeler.labelNewImage(image(cuQua), file());

        assertThat(r.getLabel()).isEqualTo(AiLabel.UNCERTAIN);
        assertThat(r.getReviewStatus()).isEqualTo(AiReviewStatus.PENDING_REVIEW);
        assertThat(r.getNote()).isEqualTo("AI không chắc: bellpepper_rotten (55%)");
        assertAiDataStored(r, "bellpepper", "0.5500");
    }

    @Test
    void row4_rotten_alwaysQueuedEvenWhenAiIsSure() {
        givenAi(prediction("mango_rotten", 0.97));

        AiResult r = labeler.labelNewImage(image(traiCay), file());

        assertThat(r.getLabel()).isEqualTo(AiLabel.ROTTEN);
        assertThat(r.getReviewStatus()).isEqualTo(AiReviewStatus.PENDING_REVIEW);
        assertThat(r.getNote()).isEqualTo("AI phát hiện hỏng: mango_rotten (97%) — chờ admin xác nhận");
        assertAiDataStored(r, "mango", "0.9700");
    }

    @Test
    void row5_freshBelowAutoAccept_isQueued() {
        givenAi(prediction("tomato_fresh", 0.80));

        AiResult r = labeler.labelNewImage(image(cuQua), file());

        assertThat(r.getLabel()).isEqualTo(AiLabel.FRESH);
        assertThat(r.getReviewStatus()).isEqualTo(AiReviewStatus.PENDING_REVIEW);
        assertThat(r.getNote()).isEqualTo("tomato_fresh (80%) — dưới ngưỡng tự chấp nhận 90%");
        assertAiDataStored(r, "tomato", "0.8000");
    }

    @Test
    void row6_freshAboveAutoAccept_isAutoAccepted() {
        givenAi(prediction("apple_fresh", 0.95));

        AiResult r = labeler.labelNewImage(image(traiCay), file());

        assertThat(r.getLabel()).isEqualTo(AiLabel.FRESH);
        assertThat(r.getReviewStatus()).isEqualTo(AiReviewStatus.AUTO_ACCEPTED);
        assertThat(r.getNote()).isNull();
        assertThat(r.getFinalLabel()).isNull();
        assertAiDataStored(r, "apple", "0.9500");
    }

    /** Đúng bằng ngưỡng kiểm định KHÔNG phải dòng 3; đúng bằng ngưỡng tự chấp nhận LÀ dòng 6. */
    @ParameterizedTest(name = "{0} {1} -> {2} {3}")
    @CsvSource({
            "tomato_fresh,  0.6999, UNCERTAIN, PENDING_REVIEW",
            "tomato_fresh,  0.70,   FRESH,     PENDING_REVIEW",
            "tomato_rotten, 0.70,   ROTTEN,    PENDING_REVIEW",
            "tomato_fresh,  0.8999, FRESH,     PENDING_REVIEW",
            "tomato_fresh,  0.90,   FRESH,     AUTO_ACCEPTED",
            "tomato_rotten, 1.0,    ROTTEN,    PENDING_REVIEW"
    })
    void thresholdBoundaries(String aiLabel, double confidence, AiLabel label, AiReviewStatus status) {
        givenAi(prediction(aiLabel, confidence));

        AiResult r = labeler.labelNewImage(image(cuQua), file());

        assertThat(r.getLabel()).isEqualTo(label);
        assertThat(r.getReviewStatus()).isEqualTo(status);
    }

    @Test
    void thresholdsComeFromSettings() {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiSettingsService.current()).thenReturn(new AiThresholds(0.855, 0.60));
        when(aiServiceClient.classify(any(), any(), any()))
                .thenReturn(Optional.of(prediction("tomato_fresh", 0.65)), Optional.of(prediction("tomato_fresh", 0.86)));

        ProductAiLabeler.Batch batch = labeler.newBatch();
        AiResult belowAutoAccept = batch.label(image(cuQua), file());
        AiResult aboveAutoAccept = batch.label(image(cuQua), file());

        assertThat(belowAutoAccept.getLabel()).isEqualTo(AiLabel.FRESH);
        assertThat(belowAutoAccept.getNote()).isEqualTo("tomato_fresh (65%) — dưới ngưỡng tự chấp nhận 85.5%");
        assertThat(aboveAutoAccept.getReviewStatus()).isEqualTo(AiReviewStatus.AUTO_ACCEPTED);
    }

    // ---------- helpers ----------

    /** AI bật, ngưỡng mặc định 0.90 / 0.70, các lần gọi classify lần lượt trả các kết quả cho trước. */
    private void givenAi(AiPrediction first, AiPrediction... rest) {
        when(aiServiceClient.isEnabled()).thenReturn(true);
        when(aiSettingsService.current()).thenReturn(DEFAULT_THRESHOLDS);
        @SuppressWarnings("unchecked")
        Optional<AiPrediction>[] next = Arrays.stream(rest).map(Optional::of).toArray(Optional[]::new);
        when(aiServiceClient.classify(any(), any(), any())).thenReturn(Optional.of(first), next);
    }

    /** "apple_fresh" -> produce_type "apple", condition "fresh" — giống ai/ai/main.py. */
    private static AiPrediction prediction(String label, double confidence) {
        int cut = label.lastIndexOf('_');
        return new AiPrediction(label, label.substring(0, cut), label.substring(cut + 1), confidence,
                Map.of(label, confidence), MODEL_VERSION);
    }

    private static void assertQueuedWithoutAi(AiResult r, String note) {
        assertThat(r.getSource()).isEqualTo(AiSource.PRODUCT_IMAGE);
        assertThat(r.getLabel()).isEqualTo(AiLabel.UNCERTAIN);
        assertThat(r.getConfidence()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(r.getReviewStatus()).isEqualTo(AiReviewStatus.PENDING_REVIEW);
        assertThat(r.getNote()).isEqualTo(note);
        assertThat(r.getProduce()).isNull();
        assertThat(r.getModelVersion()).isNull();
        assertThat(r.getInferenceMs()).isNull();
    }

    private static void assertAiDataStored(AiResult r, String produce, String confidence) {
        assertThat(r.getSource()).isEqualTo(AiSource.PRODUCT_IMAGE);
        assertThat(r.getImageUrl()).isEqualTo("/uploads/products/1/tao.png");
        assertThat(r.getProduce()).isEqualTo(produce);
        assertThat(r.getConfidence()).isEqualTo(new BigDecimal(confidence)); // đúng scale 4 như cột DECIMAL(5,4)
        assertThat(r.getModelVersion()).isEqualTo(MODEL_VERSION);
        assertThat(r.getInferenceMs()).isNotNull().isGreaterThanOrEqualTo(0);
    }

    private static Category category(String name, Category parent, String aiProduceKeys) {
        return Category.builder().name(name).parent(parent).aiProduceKeys(aiProduceKeys).build();
    }

    private static ProductImage image(Category category) {
        Product product = Product.builder().name("SP test").category(category).build();
        return ProductImage.builder().product(product).url("/uploads/products/1/tao.png").build();
    }

    private static MockMultipartFile file() {
        return new MockMultipartFile("files", "tao.png", "image/png", IMAGE_BYTES);
    }
}
