package com.nhom5.backend.controller;

import com.nhom5.backend.dto.product.CategoryDto;
import com.nhom5.backend.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category API", description = "Quản lý và tra cứu danh mục sản phẩm")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Lấy cây danh mục", description = "Lấy danh sách các danh mục đang hoạt động dưới dạng cây (cha -> con)")
    public ResponseEntity<List<CategoryDto>> getActiveCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategoryTree());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết danh mục", description = "Lấy thông tin chi tiết của một danh mục theo ID")
    public ResponseEntity<CategoryDto> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }
}
