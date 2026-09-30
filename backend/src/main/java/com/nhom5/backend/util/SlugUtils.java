package com.nhom5.backend.util;

import java.text.Normalizer;
import java.util.Locale;

/** Tạo slug URL từ tên tiếng Việt: "Cà chua bi Đà Lạt" -> "ca-chua-bi-da-lat". */
public final class SlugUtils {

    private static final int MAX_BASE_LENGTH = 200;

    private SlugUtils() {
    }

    public static String slugify(String input) {
        if (input == null) {
            return "";
        }
        // "đ/Đ" không tách dấu được bằng Normalizer nên thay tay trước
        String text = input.replace('đ', 'd').replace('Đ', 'D');
        text = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        text = text.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (text.length() > MAX_BASE_LENGTH) {
            text = text.substring(0, MAX_BASE_LENGTH).replaceAll("-+$", "");
        }
        return text;
    }
}
