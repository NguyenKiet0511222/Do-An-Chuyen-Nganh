package com.nongsan.repository;

import com.nongsan.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Danh mục gốc (cha) đang hoạt động, sắp theo display_order - api.md 4.3
    List<Category> findByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();

    // Danh mục con đang hoạt động của 1 danh mục cha
    List<Category> findByParent_IdAndIsActiveTrueOrderByDisplayOrderAsc(Long parentId);
}
