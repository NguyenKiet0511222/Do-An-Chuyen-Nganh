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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Gắn nhãn AI cho ảnh sản phẩm + tính nhãn tổng hợp của sản phẩm (api.md mục 3.2, 3.3; docs/1910.md mục 1).
 *
 * <p>Mỗi ảnh mới gửi sang AI service ({@link AiServiceClient}, POST /classify) rồi áp bảng quy tắc
 * — xét từ trên xuống, gặp dòng đầu tiên khớp thì dừng:</p>
 * <ol>
 *   <li>AI tắt / lỗi / timeout / 503 -> UNCERTAIN, confidence 0, chờ admin.</li>
 *   <li>Loại nông sản AI nhận ra không thuộc {@code aiProduceKeys} của danh mục (trống thì lấy của danh mục cha,
 *       cả hai trống thì bỏ qua dòng này) -> UNCERTAIN, chờ admin. Bù cho việc model không có lớp "không nhận ra".</li>
 *   <li>confidence dưới ngưỡng kiểm định (mặc định 0.70) -> UNCERTAIN, chờ admin.</li>
 *   <li>AI thấy hỏng -> ROTTEN, chờ admin (ảnh hỏng luôn có người xem, dù AI chắc chắn).</li>
 *   <li>Tươi nhưng confidence dưới ngưỡng tự chấp nhận (mặc định 0.90) -> FRESH, chờ admin.</li>
 *   <li>Tươi, confidence từ ngưỡng tự chấp nhận trở lên -> FRESH, AUTO_ACCEPTED.</li>
 * </ol>
 * <p>Dòng 2–6 lưu produce, confidence, model_version, inference_ms. Ngưỡng lấy từ {@link AiSettingsService};
 * đổi ngưỡng không gắn lại nhãn ảnh cũ.</p>
 */
@Component
@RequiredArgsConstructor
public class ProductAiLabeler {

    public static final String NOTE_AI_DISABLED = "AI đang tắt — chờ admin kiểm định";
    public static final String NOTE_AI_UNAVAILABLE = "AI không phản hồi — chờ admin kiểm định";
    private static final int MAX_NOTE_LENGTH = 500;

    private final AiServiceClient aiServiceClient;
    private final AiSettingsService aiSettingsService;

    /** Gắn nhãn 1 ảnh vừa tải lên. Tải nhiều ảnh trong 1 request thì dùng {@link #newBatch()}. */
    public AiResult labelNewImage(ProductImage image, MultipartFile file) {
        return newBatch().label(image, file);
    }

    /**
     * Lô ảnh của 1 lần tải: ngưỡng đọc 1 lần cho cả lô; 1 ảnh gọi AI lỗi thì các ảnh sau KHÔNG gọi AI nữa
     * mà vào thẳng hàng chờ admin (docs/1910.md mục 6 — tránh 5 ảnh × 5s timeout = 25s).
     */
    public Batch newBatch() {
        return new Batch();
    }

    /** Dùng trong 1 request, không chia sẻ giữa các luồng. */
    public final class Batch {

        private AiThresholds thresholds;
        private boolean aiUnavailable;

        private Batch() {
        }

        /** {@code image.getProduct()} phải đã gán (danh mục dùng cho dòng 2 của bảng quy tắc). */
        public AiResult label(ProductImage image, MultipartFile file) {
            if (!aiServiceClient.isEnabled()) {
                return withoutAi(image, NOTE_AI_DISABLED);
            }
            if (aiUnavailable) {
                return withoutAi(image, NOTE_AI_UNAVAILABLE);
            }
            byte[] bytes = readBytes(file);
            long start = System.nanoTime();
            Optional<AiPrediction> prediction = aiServiceClient.classify(bytes, file.getOriginalFilename(),
                    file.getContentType());
            int inferenceMs = (int) TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
            if (prediction.isEmpty()) {
                aiUnavailable = true;
                return withoutAi(image, NOTE_AI_UNAVAILABLE);
            }
            if (thresholds == null) {
                thresholds = aiSettingsService.current();
            }
            return applyRules(image, prediction.get(), inferenceMs, thresholds);
        }
    }

    /**
     * Nhãn tổng hợp = xấu nhất trong các ảnh (dùng finalLabel ?? label): có ROTTEN -> ROTTEN,
     * không ROTTEN nhưng có UNCERTAIN -> UNCERTAIN, còn lại FRESH. Confidence = trung bình. Không có ảnh -> null.
     */
    public void recomputeOverall(Product product) {
        List<AiResult> results = product.getImages().stream()
                .map(ProductImage::getAiResult)
                .filter(Objects::nonNull)
                .toList();
        if (results.isEmpty()) {
            product.setAiOverallLabel(null);
            product.setAiOverallConfidence(null);
            return;
        }
        List<AiLabel> labels = results.stream()
                .map(r -> r.getFinalLabel() != null ? r.getFinalLabel() : r.getLabel())
                .toList();
        AiLabel overall = labels.contains(AiLabel.ROTTEN) ? AiLabel.ROTTEN
                : labels.contains(AiLabel.UNCERTAIN) ? AiLabel.UNCERTAIN
                : AiLabel.FRESH;
        BigDecimal sum = results.stream()
                .map(r -> r.getConfidence() == null ? BigDecimal.ZERO : r.getConfidence())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        product.setAiOverallLabel(overall);
        product.setAiOverallConfidence(sum.divide(BigDecimal.valueOf(results.size()), 4, RoundingMode.HALF_UP));
    }

    /** Dòng 1: không có kết quả AI -> UNCERTAIN, confidence 0, chờ admin kiểm định. */
    private static AiResult withoutAi(ProductImage image, String note) {
        return AiResult.builder()
                .source(AiSource.PRODUCT_IMAGE)
                .imageUrl(image.getUrl())
                .label(AiLabel.UNCERTAIN)
                .confidence(BigDecimal.ZERO)
                .reviewStatus(AiReviewStatus.PENDING_REVIEW)
                .note(note)
                .build();
    }

    /** Dòng 2–6 của bảng quy tắc. */
    private static AiResult applyRules(ProductImage image, AiPrediction prediction, int inferenceMs,
                                       AiThresholds thresholds) {
        BigDecimal confidence = BigDecimal.valueOf(prediction.confidence()).setScale(4, RoundingMode.HALF_UP);
        double value = confidence.doubleValue(); // so ngưỡng trên đúng con số được lưu
        String produce = normalizeKey(prediction.produceType());
        String shown = prediction.label() + " (" + Math.round(value * 100) + "%)";

        AiResult.AiResultBuilder result = AiResult.builder()
                .source(AiSource.PRODUCT_IMAGE)
                .imageUrl(image.getUrl())
                .produce(produce)
                .confidence(confidence)
                .modelVersion(prediction.modelVersion())
                .inferenceMs(inferenceMs);

        Category category = image.getProduct() == null ? null : image.getProduct().getCategory();
        ProduceKeys keys = produceKeysOf(category);
        if (keys != null && !keys.keys().contains(produce)) {
            return pending(result, AiLabel.UNCERTAIN, "AI nhận ra " + shown + " — không thuộc danh mục \""
                    + keys.categoryName() + "\" (" + String.join(", ", keys.keys()) + ")");
        }
        if (value < thresholds.review()) {
            return pending(result, AiLabel.UNCERTAIN, "AI không chắc: " + shown);
        }
        if (prediction.isRotten()) {
            return pending(result, AiLabel.ROTTEN, "AI phát hiện hỏng: " + shown + " — chờ admin xác nhận");
        }
        if (value < thresholds.autoAccept()) {
            return pending(result, AiLabel.FRESH,
                    shown + " — dưới ngưỡng tự chấp nhận " + thresholdPercent(thresholds.autoAccept()) + "%");
        }
        return result.label(AiLabel.FRESH).reviewStatus(AiReviewStatus.AUTO_ACCEPTED).build();
    }

    private static AiResult pending(AiResult.AiResultBuilder result, AiLabel label, String note) {
        String trimmed = note.length() > MAX_NOTE_LENGTH ? note.substring(0, MAX_NOTE_LENGTH) : note;
        return result.label(label).reviewStatus(AiReviewStatus.PENDING_REVIEW).note(trimmed).build();
    }

    /** aiProduceKeys áp cho danh mục: của chính nó, trống thì của danh mục cha; cả hai trống -> null (bỏ qua luật). */
    private static ProduceKeys produceKeysOf(Category category) {
        if (category == null) {
            return null;
        }
        List<String> keys = parseKeys(category.getAiProduceKeys());
        if (!keys.isEmpty()) {
            return new ProduceKeys(category.getName(), keys);
        }
        Category parent = category.getParent();
        if (parent != null) {
            List<String> parentKeys = parseKeys(parent.getAiProduceKeys());
            if (!parentKeys.isEmpty()) {
                return new ProduceKeys(parent.getName(), parentKeys);
            }
        }
        return null;
    }

    /** "Mango, apple,,BANANA" -> [mango, apple, banana]: tách dấu phẩy, bỏ khoảng trắng, chữ thường, bỏ mục rỗng. */
    private static List<String> parseKeys(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(","))
                .map(ProductAiLabeler::normalizeKey)
                .filter(key -> !key.isEmpty())
                .distinct()
                .toList();
    }

    private static String normalizeKey(String key) {
        return key.trim().toLowerCase(Locale.ROOT);
    }

    /** 0.9 -> "90", 0.855 -> "85.5" (ngưỡng admin đặt có thể lẻ, không làm tròn mất). */
    private static String thresholdPercent(double threshold) {
        return BigDecimal.valueOf(threshold).movePointRight(2).setScale(1, RoundingMode.HALF_UP)
                .stripTrailingZeros().toPlainString();
    }

    private static byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Không đọc được ảnh tải lên", e);
        }
    }

    private record ProduceKeys(String categoryName, List<String> keys) {
    }
}
