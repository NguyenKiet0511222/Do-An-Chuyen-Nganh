package com.nhom5.backend.util;

import com.nhom5.backend.exception.AppException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

/** Chuẩn hoá tham số query dùng chung cho các API danh sách (api.md mục 1.3). */
public final class QueryParams {

    public static final int DEFAULT_PAGE_SIZE = 12;
    public static final int MAX_PAGE_SIZE = 100;

    private QueryParams() {
    }

    /**
     * Tách "REJECTED,NEED_INFO" thành tập enum. Rỗng/null -> tập rỗng (= không lọc).
     * Giá trị lạ -> 400 để frontend biết gửi sai thay vì âm thầm trả rỗng.
     */
    public static <E extends Enum<E>> Set<E> parseEnumList(String csv, Class<E> type, String paramName) {
        Set<E> result = EnumSet.noneOf(type);
        if (csv == null || csv.isBlank()) {
            return result;
        }
        for (String raw : csv.split(",")) {
            String value = raw.trim().toUpperCase(Locale.ROOT);
            if (value.isEmpty()) {
                continue;
            }
            try {
                result.add(Enum.valueOf(type, value));
            } catch (IllegalArgumentException e) {
                throw AppException.badRequest("Giá trị không hợp lệ cho tham số " + paramName + ": " + raw.trim());
            }
        }
        return result;
    }

    /** Chuỗi rỗng/khoảng trắng -> null để câu JPQL bỏ qua điều kiện. */
    public static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** page bắt đầu từ 0; size mặc định 12, tối đa 100. */
    public static Pageable pageable(int page, int size, Sort sort) {
        int safeSize = size <= 0 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
        return PageRequest.of(Math.max(page, 0), safeSize, sort);
    }
}
