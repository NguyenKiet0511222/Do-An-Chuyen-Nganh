package com.nhom5.backend.dto.admin;

import com.nhom5.backend.entity.enums.AiLabel;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * PATCH /admin/ai/results/{id}/review (docs/1910.md mục 3, 6, 7.2). Chỉ kiểm định được ảnh PENDING_REVIEW hoặc
 * AUTO_ACCEPTED (đã kiểm định -> 409).
 * <ul>
 *   <li>ACCEPT: giữ nhãn AI. Nhãn UNCERTAIN -> 400 (phải chọn Tươi / Hỏng bằng CORRECT).</li>
 *   <li>CORRECT: bắt buộc finalLabel FRESH | ROTTEN; trùng nhãn AI thì tính như ACCEPT.</li>
 *   <li>RETAKE: bắt buộc note; sản phẩm đang PENDING -> NEED_INFO, trạng thái khác chỉ đánh dấu ảnh.</li>
 * </ul>
 * note (tuỳ chọn với ACCEPT / CORRECT) được nối sau ghi chú của AI: "{ghi chú AI} | Admin: {note}".
 */
public record AiReviewRequest(
        @NotNull(message = "Vui lòng chọn thao tác ACCEPT, CORRECT hoặc RETAKE")
        Action action,

        AiLabel finalLabel,

        @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
        String note
) {

    public enum Action {
        ACCEPT,
        CORRECT,
        RETAKE
    }
}
