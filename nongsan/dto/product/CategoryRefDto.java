package com.nongsan.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * api.md mục 4.4 - trường "category" rút gọn trong Product (list item): { id, name }
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRefDto {
    private Long id;
    private String name;
}
