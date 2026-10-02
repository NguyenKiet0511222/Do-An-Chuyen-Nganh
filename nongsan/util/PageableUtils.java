package com.nongsan.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Chuyển query page/size/sort (api.md mục 1.3) thành Pageable của Spring Data.
 * sort có dạng "field,direction", ví dụ "createdAt,desc".
 */
public final class PageableUtils {

    private static final int DEFAULT_SIZE = 12;
    private static final int MAX_SIZE = 100;

    private PageableUtils() {
    }

    public static Pageable of(Integer page, Integer size, String sort) {
        int safePage = (page == null || page < 0) ? 0 : page;
        int rawSize = (size == null) ? DEFAULT_SIZE : size;
        int safeSize = Math.min(Math.max(rawSize, 1), MAX_SIZE);

        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String property = parts[0].trim();
            Sort.Direction direction = Sort.Direction.DESC;
            if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
                direction = Sort.Direction.ASC;
            }
            sortObj = Sort.by(direction, property);
        }
        return PageRequest.of(safePage, safeSize, sortObj);
    }
}
