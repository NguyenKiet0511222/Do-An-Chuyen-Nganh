package com.nongsan.service;

import com.nongsan.dto.category.CategoryTreeDto;
import com.nongsan.entity.Category;
import com.nongsan.entity.enums.ProductStatus;
import com.nongsan.repository.CategoryRepository;
import com.nongsan.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * api.md mục 4.3 - GET /api/categories: trả về cây danh mục đang hoạt động (cha -> children[]).
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryTreeDto> getActiveCategoryTree() {
        List<Category> roots = categoryRepository.findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();
        return roots.stream()
                .map(this::toTreeDto)
                .collect(Collectors.toList());
    }

    private CategoryTreeDto toTreeDto(Category category) {
        List<Category> children = categoryRepository
                .findByParent_IdAndIsActiveTrueOrderByDisplayOrderAsc(category.getId());

        long productCount = productRepository
                .countByCategory_IdAndStatus(category.getId(), ProductStatus.APPROVED);

        return CategoryTreeDto.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .displayOrder(category.getDisplayOrder())
                .isActive(category.getIsActive())
                .aiProduceKeys(category.getAiProduceKeys())
                .productCount(productCount)
                .children(children.stream().map(this::toTreeDto).collect(Collectors.toList()))
                .build();
    }
}
