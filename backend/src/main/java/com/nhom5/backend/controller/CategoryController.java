package com.nhom5.backend.controller;

import com.nhom5.backend.dto.product.CategoryDto;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Danh mục công khai (api.md mục 4.3). Quản trị danh mục ở AdminCategoryController. */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category API", description = "Tra cứu danh mục sản phẩm")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Lấy cây danh mục", description = "Lấy danh sách các danh mục đang hoạt động dưới dạng cây (cha -> con)")
    public ApiResponse<List<CategoryDto>> getActiveCategories() {
        return ApiResponse.ok(categoryService.getActiveCategoryTree());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết danh mục", description = "Lấy thông tin chi tiết của một danh mục theo ID")
    public ApiResponse<CategoryDto> getCategoryById(@PathVariable Long id) {
        return ApiResponse.ok(categoryService.getCategoryById(id));
    }
}
