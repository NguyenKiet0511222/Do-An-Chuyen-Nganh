package com.nhom5.backend.service;

import com.nhom5.backend.dto.ai.AiPrediction;
import com.nhom5.backend.dto.ai.QuickCheckResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AccountTier;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.AiResultRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
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
import java.util.Locale;
import java.util.concurrent.TimeUnit;

/**
 * Kiểm tra nhanh chất lượng nông sản của khách Premium (api.md mục 3.3, 4.7).
 * Lưu vào ai_results với source = QUICK_CHECK + user_id, không gắn sản phẩm, không vào hàng chờ admin.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerAiService {

    /** Chống spam mô hình (api.md mục 3.3). */
    static final int DAILY_LIMIT = 20;
    static final String PREMIUM_REQUIRED = "Tính năng dành cho tài khoản Premium";

    private final AiResultRepository aiResultRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;
    private final AiSettingsService aiSettingsService;
    private final FileStorageService fileStorageService;

    /**
     * Không mở transaction để không giữ kết nối DB khi chờ AI (như AdminAiService.classify).
     * Thứ tự: Premium -> ảnh hợp lệ -> còn lượt -> gọi AI (lỗi -> 503, không lưu gì) -> lưu ảnh + kết quả.
     * Nhãn: confidence dưới ngưỡng review -> UNCERTAIN, ngược lại theo condition của model.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public QuickCheckResponse classify(Long userId, MultipartFile file) {
        User user = requirePremium(userId);
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("Vui lòng chọn 1 ảnh (field \"file\" hoặc \"image\")");
        }
        fileStorageService.validateImage(file);
        long usedToday = aiResultRepository.countBySourceAndUserIdAndCreatedAtGreaterThanEqual(
                AiSource.QUICK_CHECK, userId, LocalDate.now().atStartOfDay());
        if (usedToday >= DAILY_LIMIT) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã dùng hết " + DAILY_LIMIT + " lượt kiểm tra hôm nay, vui lòng quay lại ngày mai");
        }

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

        BigDecimal confidence = BigDecimal.valueOf(prediction.confidence()).setScale(4, RoundingMode.HALF_UP);
        AiLabel label = confidence.doubleValue() < aiSettingsService.current().review() ? AiLabel.UNCERTAIN
                : prediction.isRotten() ? AiLabel.ROTTEN : AiLabel.FRESH;

        String imageUrl = fileStorageService.storeImage(file, "ai");
        try {
            AiResult saved = aiResultRepository.save(AiResult.builder()
                    .source(AiSource.QUICK_CHECK)
                    .user(user)
                    .imageUrl(imageUrl)
                    .produce(prediction.produceType() == null ? null : prediction.produceType().toLowerCase(Locale.ROOT))
                    .label(label)
                    .confidence(confidence)
                    .modelVersion(prediction.modelVersion())
                    .reviewStatus(AiReviewStatus.AUTO_ACCEPTED)
                    .inferenceMs(inferenceMs)
                    .build());
            return QuickCheckResponse.from(saved);
        } catch (RuntimeException e) {
            fileStorageService.deleteQuietly(imageUrl);
            throw e;
        }
    }

    /** Lịch sử của chính mình, mới nhất trước. */
    public PageResponse<QuickCheckResponse> history(Long userId, int page, int size) {
        requirePremium(userId);
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return PageResponse.from(aiResultRepository.findBySourceAndUserId(AiSource.QUICK_CHECK, userId, pageable)
                .map(QuickCheckResponse::from));
    }

    public QuickCheckResponse historyDetail(Long userId, Long id) {
        requirePremium(userId);
        return aiResultRepository.findByIdAndSourceAndUserId(id, AiSource.QUICK_CHECK, userId)
                .map(QuickCheckResponse::from)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy lượt kiểm tra #" + id));
    }

    /** Đọc cấp tài khoản từ DB (JWT không mang tier) nên admin đổi cấp là có hiệu lực ngay. */
    private User requirePremium(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("Tài khoản không còn tồn tại"));
        if (user.getAccountTier() != AccountTier.PREMIUM) {
            throw AppException.forbidden(PREMIUM_REQUIRED);
        }
        return user;
    }
}
