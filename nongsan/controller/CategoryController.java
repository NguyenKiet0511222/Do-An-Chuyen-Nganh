package com.nongsan.controller;

import com.nongsan.dto.category.CategoryTreeDto;
import com.nongsan.dto.common.ApiResponse;
import com.nongsan.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * api.md mục 4.3 - Danh mục công khai.
 * Quyền: 🌐 công khai (xem ma trận mục 1.5: GET /api/categories/**).
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * GET /api/categories
     * Trả về cây danh mục đang hoạt động (cha -> children[]).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryTreeDto>>> getCategoryTree() {
        List<CategoryTreeDto> tree = categoryService.getActiveCategoryTree();
        return ResponseEntity.ok(ApiResponse.ok(tree));
    }
}
