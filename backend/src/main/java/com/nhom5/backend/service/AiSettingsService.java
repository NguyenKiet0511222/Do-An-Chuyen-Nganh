package com.nhom5.backend.service;

import com.nhom5.backend.config.AppProperties;
import com.nhom5.backend.dto.ai.AiThresholds;
import com.nhom5.backend.entity.Setting;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.SettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Ngưỡng tin cậy AI đang áp dụng (docs/1910.md mục 1, 4).
 *
 * <p>Đọc từ bảng {@code settings} (admin đổi trên web qua PUT /api/admin/ai/settings, không cần restart).
 * Bảng trống / thiếu dòng / giá trị hỏng thì dùng mặc định {@code app.ai.auto-accept-threshold} /
 * {@code app.ai.review-threshold}; cặp ghép ra sai điều kiện review &lt; autoAccept thì dùng cả 2 mặc định. ProductAiLabeler đọc {@link #current()} mỗi lần tải ảnh nên ngưỡng mới áp
 * cho lần tải sau; đổi ngưỡng không gắn lại nhãn ảnh cũ.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AiSettingsService {

    public static final String KEY_AUTO_ACCEPT_THRESHOLD = "ai.auto_accept_threshold";
    public static final String KEY_REVIEW_THRESHOLD = "ai.review_threshold";

    private final AppProperties appProperties;
    private final SettingRepository settingRepository;

    @Transactional(readOnly = true)
    public AiThresholds current() {
        AppProperties.Ai ai = appProperties.ai();
        Map<String, String> values = settingRepository
                .findAllById(List.of(KEY_AUTO_ACCEPT_THRESHOLD, KEY_REVIEW_THRESHOLD)).stream()
                .collect(Collectors.toMap(Setting::getKey, Setting::getValue));
        double autoAccept = parse(KEY_AUTO_ACCEPT_THRESHOLD, values.get(KEY_AUTO_ACCEPT_THRESHOLD),
                ai.autoAcceptThreshold());
        double review = parse(KEY_REVIEW_THRESHOLD, values.get(KEY_REVIEW_THRESHOLD), ai.reviewThreshold());
        // Mặc định ghép từng khoá có thể ra cặp sai (vd lưu 0.65 / 0.60 rồi dòng review bị xoá -> 0.65 / 0.70):
        // khi đó dải "FRESH · chờ admin" biến mất -> dùng cả 2 mặc định cùng lúc, không trộn.
        if (!(review < autoAccept)) {
            log.warn("Cặp ngưỡng trong settings không hợp lệ (review {} >= autoAccept {}), dùng cả 2 mặc định {} / {}",
                    review, autoAccept, ai.reviewThreshold(), ai.autoAcceptThreshold());
            return new AiThresholds(ai.autoAcceptThreshold(), ai.reviewThreshold());
        }
        return new AiThresholds(autoAccept, review);
    }

    /** Lưu 2 ngưỡng (thêm dòng nếu chưa có). Điều kiện: 0 &lt; review &lt; autoAccept ≤ 1, sai -> 400. */
    public AiThresholds update(double autoAccept, double review) {
        if (!(autoAccept <= 1)) {
            throw AppException.badRequest("Ngưỡng tự chấp nhận tối đa là 1");
        }
        if (!(review > 0)) {
            throw AppException.badRequest("Ngưỡng kiểm định phải lớn hơn 0");
        }
        if (!(review < autoAccept)) {
            throw AppException.badRequest("Ngưỡng kiểm định phải nhỏ hơn ngưỡng tự chấp nhận");
        }
        // save() với khoá có sẵn = merge: chưa có dòng thì INSERT, có rồi thì UPDATE
        settingRepository.save(new Setting(KEY_AUTO_ACCEPT_THRESHOLD, BigDecimal.valueOf(autoAccept).toPlainString()));
        settingRepository.save(new Setting(KEY_REVIEW_THRESHOLD, BigDecimal.valueOf(review).toPlainString()));
        return new AiThresholds(autoAccept, review);
    }

    /** Thiếu, không phải số hoặc ngoài (0, 1] -> giá trị mặc định (giá trị hỏng thì log cảnh báo). */
    private static double parse(String key, String raw, double fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
        try {
            double value = Double.parseDouble(raw.trim());
            if (value > 0 && value <= 1) {
                return value;
            }
        } catch (NumberFormatException ignored) {
            // rơi xuống cảnh báo bên dưới
        }
        log.warn("Giá trị settings {} = \"{}\" không hợp lệ, dùng mặc định {}", key, raw, fallback);
        return fallback;
    }
}
