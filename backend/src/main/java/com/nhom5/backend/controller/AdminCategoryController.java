package com.nhom5.backend.controller;

import com.nhom5.backend.dto.admin.CategoryRequest;
import com.nhom5.backend.dto.product.CategoryDto;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Quản trị danh mục (api.md mục 4.3) — chỉ ADMIN (SecurityConfig chặn /api/admin/**). */
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@Tag(name = "Admin - Danh mục", description = "Cây danh mục kể cả danh mục ẩn, tạo / sửa / xoá")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Toàn bộ cây danh mục (kể cả ẩn)", description = "productCount đếm mọi trạng thái sản phẩm")
    public ApiResponse<List<CategoryDto>> tree() {
        return ApiResponse.ok(categoryService.getAdminCategoryTree());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo danh mục", description = "parentId null = danh mục cha; cha phải là danh mục gốc (cây 2 cấp)")
    public ApiResponse<CategoryDto> create(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(categoryService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Sửa danh mục", description = "Slug giữ nguyên khi đổi tên. Đặt isActive=false để ẩn")
    public ApiResponse<CategoryDto> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá danh mục", description = "Chỉ khi không có danh mục con và chưa có sản phẩm, ngược lại 409")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ApiResponse.ok("Đã xoá danh mục", null);
    }
}
