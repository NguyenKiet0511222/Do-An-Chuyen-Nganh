package com.nongsan.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * api.md mục 4.3 - "Category JSON":
 * { id, name, slug, parentId, description, imageUrl, displayOrder,
 *   isActive, aiProduceKeys, productCount, children: [] }
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeDto {

    private Long id;
    private String name;
    private String slug;
    private Long parentId;
    private String description;
    private String imageUrl;
    private Integer displayOrder;
    private Boolean isActive;
    private String aiProduceKeys;
    private Long productCount;

    @Builder.Default
    private List<CategoryTreeDto> children = new ArrayList<>();
}
