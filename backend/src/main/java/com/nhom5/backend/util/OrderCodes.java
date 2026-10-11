package com.nhom5.backend.util;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Mã đơn hàng {@code DH-{yyyy}-{5 chữ số}} (api.md mục 2), ví dụ DH-2026-00007.
 * <p>
 * Số thứ tự lấy từ chính {@code id} (IDENTITY) của đơn nên luôn duy nhất, không cần truy vấn MAX hay khoá:
 * lưu đơn với mã tạm {@link #tempCode()} để có id, rồi đổi sang {@link #fromId(Long)}.
 * OrderSeeder chạy trên bảng trống nên 6 đơn mẫu có id 1..6 = mã 00001..00006, đơn thật bắt đầu từ 00007.
 * Hạn chế chấp nhận được: số không reset theo năm; id vượt 99999 thì mã dài hơn 5 chữ số (vẫn ≤ 20 ký tự).
 */
public final class OrderCodes {

    private OrderCodes() {
    }

    /** Mã tạm thoả NOT NULL + UNIQUE trong lúc chờ DB cấp id (≤ 20 ký tự). */
    public static String tempCode() {
        return "TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public static String fromId(Long id) {
        return String.format("DH-%d-%05d", LocalDate.now().getYear(), id);
    }
}
