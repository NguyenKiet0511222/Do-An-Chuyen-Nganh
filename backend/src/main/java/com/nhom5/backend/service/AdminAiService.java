package com.nhom5.backend.service;

import com.nhom5.backend.dto.admin.AdminAiClassifyResponse;
import com.nhom5.backend.dto.admin.AdminAiResultResponse;
import com.nhom5.backend.dto.admin.AiAcceptBulkRequest;
import com.nhom5.backend.dto.admin.AiAcceptBulkResponse;
import com.nhom5.backend.dto.admin.AiReviewRequest;
import com.nhom5.backend.dto.admin.AiSettingsRequest;
import com.nhom5.backend.dto.admin.AiSettingsResponse;
import com.nhom5.backend.dto.admin.AiStatisticsResponse;
import com.nhom5.backend.dto.ai.AiHealth;
import com.nhom5.backend.dto.ai.AiPrediction;
import com.nhom5.backend.dto.ai.AiThresholds;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductReviewHistory;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import com.nhom5.backend.entity.enums.ProductReviewAction;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.AiResultRepository;
import com.nhom5.backend.repository.ProductReviewHistoryRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Admin kiểm định AI (docs/1910.md mục 2, 3, 5, 6, 7.2): hàng chờ, sửa nhãn, yêu cầu chụp lại, chấp nhận hàng loạt,
 * thử mô hình, ngưỡng tin cậy, thống kê.
 *
 * <p>Hàng chờ = ảnh PENDING_REVIEW của sản phẩm PENDING / APPROVED / HIDDEN — ảnh của sản phẩm người bán còn đang
 * sửa (DRAFT / NEED_INFO / REJECTED) không hiện để admin không kiểm định phí công. Nhãn admin sửa lưu ngay trong
 * ai_results (review_status = CORRECTED, final_label) làm dữ liệu train lại, ghi chú admin nối sau ghi chú AI.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminAiService {

    /** Sản phẩm đã gửi duyệt -> ảnh chờ kiểm định của nó mới vào hàng chờ (docs/1910.md mục 2). */
    static final Set<ProductStatus> QUEUE_PRODUCT_STATUSES =
            EnumSet.of(ProductStatus.PENDING, ProductStatus.APPROVED, ProductStatus.HIDDEN);
    /** Kiểm định được ảnh đang chờ và ảnh AI tự chấp nhận (AI có thể chấp nhận sai); còn lại -> 409. */
    private static final Set<AiReviewStatus> REVIEWABLE =
            EnumSet.of(AiReviewStatus.PENDING_REVIEW, AiReviewStatus.AUTO_ACCEPTED);
    private static final int MAX_TEXT_LENGTH = 500;
    private static final String RETAKE_REASON_PREFIX = "Ảnh cần chụp lại: ";

    private final AiResultRepository aiResultRepository;
    private final ProductReviewHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final ProductAiLabeler productAiLabeler;
    private final AiServiceClient aiServiceClient;
    private final AiSettingsService aiSettingsService;
    private final FileStorageService fileStorageService;

    // ---------- Hàng chờ / tra cứu ----------

    /**
     * reviewStatus nhận nhiều giá trị cách nhau dấu phẩy (mặc định PENDING_REVIEW); label lọc theo nhãn hiển thị;
     * sort: oldest (mặc định — chờ lâu xử lý trước) | newest.
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminAiResultResponse> list(String reviewStatusCsv, AiLabel label, Long shopId, String produce,
                                                    LocalDate from, LocalDate to, String sort, int page, int size) {
        requireValidRange(from, to);
        Set<AiReviewStatus> statuses = QueryParams.parseEnumList(reviewStatusCsv, AiReviewStatus.class, "reviewStatus");
        if (statuses.isEmpty()) {
            statuses = EnumSet.of(AiReviewStatus.PENDING_REVIEW);
        }
        var pageable = QueryParams.pageable(page, size, Sort.by(sortDirection(sort), "createdAt", "id"));
        String normalizedProduce = QueryParams.normalize(produce);

        Page<AiResult> results = aiResultRepository.searchForAdmin(AiSource.PRODUCT_IMAGE, statuses,
                AiReviewStatus.PENDING_REVIEW, QUEUE_PRODUCT_STATUSES, label, shopId,
                normalizedProduce == null ? null : normalizedProduce.toLowerCase(Locale.ROOT),
                startOf(from), endOf(to), pageable);
        return PageResponse.from(results.map(AdminAiResultResponse::from));
    }

    @Transactional(readOnly = true)
    public AdminAiResultResponse get(Long id) {
        return AdminAiResultResponse.from(requireResult(id));
    }

    // ---------- Kiểm định ----------

    /**
     * ACCEPT / CORRECT / RETAKE 1 ảnh (quy tắc ở {@link AiReviewRequest}). Kiểm tra trạng thái + dữ liệu TRƯỚC khi sửa
     * entity. Luôn ghi người / thời điểm kiểm định và tính lại nhãn tổng của sản phẩm.
     */
    public AdminAiResultResponse review(Long adminId, Long id, AiReviewRequest request) {
        AiResult result = requireResult(id);
        if (!REVIEWABLE.contains(result.getReviewStatus())) {
            throw AppException.conflict("Kết quả AI #" + id + " đã được kiểm định (" + result.getReviewStatus() + ")");
        }
        Product product = result.getProductImage().getProduct();
        String note = OrderSupport.trimToNull(request.note());
        User admin = userRepository.getReferenceById(adminId);

        switch (request.action()) {
            case ACCEPT -> {
                requireAcceptable(result);
                result.setReviewStatus(AiReviewStatus.ACCEPTED);
            }
            case CORRECT -> {
                AiLabel finalLabel = request.finalLabel();
                if (finalLabel == null || finalLabel == AiLabel.UNCERTAIN) {
                    throw AppException.badRequest("Vui lòng chọn nhãn đúng: FRESH (tươi) hoặc ROTTEN (hỏng)");
                }
                if (finalLabel == result.getLabel()) {
                    // Trùng nhãn AI -> tính như chấp nhận, không thổi phồng số "admin đã sửa"
                    result.setReviewStatus(AiReviewStatus.ACCEPTED);
                } else {
                    result.setFinalLabel(finalLabel);
                    result.setReviewStatus(AiReviewStatus.CORRECTED);
                }
            }
            case RETAKE -> {
                if (note == null) {
                    throw AppException.badRequest("Vui lòng nhập ghi chú cho người bán (cần chụp lại thế nào)");
                }
                result.setReviewStatus(AiReviewStatus.RETAKE_REQUESTED);
                // Sản phẩm PENDING bị khoá sửa ảnh -> chuyển NEED_INFO để người bán thay ảnh.
                // Trạng thái khác chỉ đánh dấu ảnh (muốn gỡ sản phẩm đang bán thì admin dùng "Ẩn").
                if (product.getStatus() == ProductStatus.PENDING) {
                    requestRetake(product, admin, truncate(RETAKE_REASON_PREFIX + note));
                }
            }
        }
        if (note != null) {
            result.setNote(truncate(result.getNote() == null ? "Admin: " + note
                    : result.getNote() + " | Admin: " + note));
        }
        markReviewed(result, admin);
        productAiLabeler.recomputeOverall(product);
        return AdminAiResultResponse.from(result);
    }

    /** Chấp nhận mọi ảnh trong hàng chờ có nhãn FRESH và confidence ≥ minConfidence; mỗi sản phẩm tính lại nhãn 1 lần. */
    public AiAcceptBulkResponse acceptBulk(Long adminId, AiAcceptBulkRequest request) {
        List<AiResult> results = aiResultRepository.findQueueByLabelAndMinConfidence(AiSource.PRODUCT_IMAGE,
                AiReviewStatus.PENDING_REVIEW, QUEUE_PRODUCT_STATUSES, AiLabel.FRESH, request.minConfidence());
        User admin = userRepository.getReferenceById(adminId);
        Map<Long, Product> products = new LinkedHashMap<>();
        for (AiResult result : results) {
            result.setReviewStatus(AiReviewStatus.ACCEPTED);
            markReviewed(result, admin);
            Product product = result.getProductImage().getProduct();
            products.putIfAbsent(product.getId(), product);
        }
        products.values().forEach(productAiLabeler::recomputeOverall);
        return new AiAcceptBulkResponse(results.size());
    }

    // ---------- Thử mô hình ----------

    /** Gửi 1 ảnh sang AI, không lưu gì. AI tắt / lỗi -> 503. Không mở transaction để không giữ kết nối DB khi chờ AI. */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AdminAiClassifyResponse classify(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("Vui lòng chọn 1 ảnh (field \"file\" hoặc \"image\")");
        }
        fileStorageService.validateImage(file);
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Không đọc được ảnh tải lên", e);
        }
        long start = System.nanoTime();
        AiPrediction prediction = aiServiceClient.classify(bytes, file.getOriginalFilename(), file.getContentType())
                .orElseThrow(() -> new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                        "AI service không phản hồi, thử lại sau"));
        int inferenceMs = (int) TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
        return AdminAiClassifyResponse.from(prediction, inferenceMs);
    }

    // ---------- Ngưỡng ----------

    /** Không mở transaction: gọi GET /health của AI (có thể chờ tới timeout) — AiSettingsService tự mở transaction đọc. */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AiSettingsResponse getSettings() {
        return toSettingsResponse(aiSettingsService.current());
    }

    /** Lưu ngưỡng mới (0 &lt; review &lt; autoAccept ≤ 1); áp cho ảnh tải lên SAU đó, không gắn lại nhãn ảnh cũ. */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AiSettingsResponse updateSettings(AiSettingsRequest request) {
        return toSettingsResponse(aiSettingsService.update(request.autoAcceptThreshold(), request.reviewThreshold()));
    }

    // ---------- Thống kê ----------

    @Transactional(readOnly = true)
    public AiStatisticsResponse statistics(LocalDate from, LocalDate to) {
        requireValidRange(from, to);
        LocalDateTime start = startOf(from);
        LocalDateTime end = endOf(to);

        Map<AiLabel, Long> byLabel = new EnumMap<>(AiLabel.class);
        for (Object[] row : aiResultRepository.countByLabelsBetween(AiSource.PRODUCT_IMAGE, start, end)) {
            AiLabel display = row[0] != null ? (AiLabel) row[0] : (AiLabel) row[1];
            byLabel.merge(display, (Long) row[2], Long::sum);
        }
        Map<AiReviewStatus, Long> byReview = new EnumMap<>(AiReviewStatus.class);
        for (Object[] row : aiResultRepository.countByReviewStatusBetween(AiSource.PRODUCT_IMAGE, start, end)) {
            byReview.put((AiReviewStatus) row[0], (Long) row[1]);
        }
        Double average = aiResultRepository.averageConfidenceBetween(AiSource.PRODUCT_IMAGE, start, end);

        return new AiStatisticsResponse(
                byReview.values().stream().mapToLong(Long::longValue).sum(),
                withAllKeys(byLabel, AiLabel.values()),
                withAllKeys(byReview, AiReviewStatus.values()),
                average == null ? null : BigDecimal.valueOf(average).setScale(4, RoundingMode.HALF_UP),
                aiResultRepository.countQueue(AiSource.PRODUCT_IMAGE, AiReviewStatus.PENDING_REVIEW,
                        QUEUE_PRODUCT_STATUSES),
                byReview.getOrDefault(AiReviewStatus.CORRECTED, 0L),
                aiResultRepository.countAiUnavailableBetween(AiSource.PRODUCT_IMAGE, start, end));
    }

    // ---------- helpers ----------

    /** Chỉ kết quả của ảnh sản phẩm (QUICK_CHECK của khách không thuộc màn này) — không có -> 404. */
    private AiResult requireResult(Long id) {
        return aiResultRepository.findDetailForAdmin(id, AiSource.PRODUCT_IMAGE)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy kết quả AI #" + id));
    }

    private static void requireAcceptable(AiResult result) {
        if (result.getLabel() == AiLabel.UNCERTAIN) {
            throw AppException.badRequest("Ảnh có nhãn KHÔNG CHẮC, không có gì để chấp nhận — hãy chọn Tươi hoặc Hỏng");
        }
    }

    /** PENDING -> NEED_INFO + 1 dòng lịch sử duyệt (như admin bấm "Yêu cầu bổ sung" ở màn duyệt sản phẩm). */
    private void requestRetake(Product product, User admin, String reason) {
        product.setStatus(ProductStatus.NEED_INFO);
        product.setRejectReason(reason);
        historyRepository.save(ProductReviewHistory.builder()
                .product(product)
                .actor(admin)
                .action(ProductReviewAction.NEED_INFO)
                .fromStatus(ProductStatus.PENDING)
                .toStatus(ProductStatus.NEED_INFO)
                .reason(reason)
                .build());
    }

    private static void markReviewed(AiResult result, User admin) {
        result.setReviewedBy(admin);
        result.setReviewedAt(LocalDateTime.now());
    }

    private AiSettingsResponse toSettingsResponse(AiThresholds thresholds) {
        Optional<AiHealth> health = aiServiceClient.health();
        return new AiSettingsResponse(thresholds.autoAccept(), thresholds.review(),
                health.map(AiHealth::modelVersion).orElse(null),
                health.map(AiHealth::isReady).orElse(false));
    }

    private static Sort.Direction sortDirection(String sort) {
        String value = QueryParams.normalize(sort);
        if (value == null || value.equalsIgnoreCase("oldest")) {
            return Sort.Direction.ASC;
        }
        if (value.equalsIgnoreCase("newest")) {
            return Sort.Direction.DESC;
        }
        throw AppException.badRequest("Giá trị không hợp lệ cho tham số sort: " + value + " (oldest | newest)");
    }

    private static void requireValidRange(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw AppException.badRequest("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
    }

    /** from/to tính cả ngày: [from 00:00, to + 1 ngày 00:00). */
    private static LocalDateTime startOf(LocalDate from) {
        return from == null ? null : from.atStartOfDay();
    }

    private static LocalDateTime endOf(LocalDate to) {
        return to == null ? null : to.plusDays(1).atStartOfDay();
    }

    private static <E extends Enum<E>> Map<String, Long> withAllKeys(Map<E, Long> counts, E[] keys) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (E key : keys) {
            result.put(key.name(), counts.getOrDefault(key, 0L));
        }
        return result;
    }

    private static String truncate(String value) {
        return value.length() > MAX_TEXT_LENGTH ? value.substring(0, MAX_TEXT_LENGTH) : value;
    }
}
