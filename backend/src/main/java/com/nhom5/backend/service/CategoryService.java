package com.nhom5.backend.service;

import com.nhom5.backend.dto.product.CategoryDto;
import com.nhom5.backend.entity.Category;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.CategoryRepository;
import com.nhom5.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getActiveCategoryTree() {
        List<Category> rootCategories = categoryRepository.findByParentIsNullOrderByDisplayOrderAsc();
        return rootCategories.stream()
                .filter(Category::getActive)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy danh mục"));
        return mapToDto(category);
    }

    private CategoryDto mapToDto(Category category) {
        int productCount = productRepository.countActiveProductsByCategoryId(category.getId());
        List<CategoryDto> children = null;
        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            children = category.getChildren().stream()
                    .filter(Category::getActive)
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getParent() != null ? category.getParent().getId() : null,
                category.getDescription(),
                category.getImageUrl(),
                category.getDisplayOrder(),
                category.getActive(),
                category.getAiProduceKeys(),
                productCount,
                children
        );
    }
}
