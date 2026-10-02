package com.nongsan.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * api.md mục 1.2 - phần tử trong mảng "errors" của response lỗi.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiErrorItem {
    private String field;
    private String message;
}
