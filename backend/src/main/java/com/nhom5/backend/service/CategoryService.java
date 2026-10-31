package com.nhom5.backend.service;

import com.nhom5.backend.dto.admin.CategoryRequest;
import com.nhom5.backend.dto.product.CategoryDto;
import com.nhom5.backend.entity.Category;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.CategoryRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Danh mục (api.md mục 4.3): cây công khai (chỉ danh mục đang bật) và quản trị của admin (kể cả danh mục ẩn).
 * Cây 2 cấp: parent = null là danh mục cha.
 */
@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final Comparator<Category> BY_DISPLAY_ORDER =
            Comparator.comparing(Category::getDisplayOrder).thenComparing(Category::getId);

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
        return mapToDto(requireCategory(id));
    }

    // ---------- Admin ----------

    /** GET /admin/categories — toàn bộ cây kể cả danh mục ẩn; productCount đếm mọi trạng thái sản phẩm. */
    @Transactional(readOnly = true)
    public List<CategoryDto> getAdminCategoryTree() {
        return categoryRepository.findByParentIsNullOrderByDisplayOrderAsc().stream()
                .map(this::mapToAdminDto)
                .toList();
    }

    /** Slug sinh từ tên (trùng thì thêm -2, -3...), giữ nguyên khi đổi tên để URL không đổi. */
    @Transactional
    public CategoryDto create(CategoryRequest request) {
        Category category = Category.builder()
                .slug(uniqueSlug(request.name()))
                .displayOrder(request.displayOrder() == null ? 0 : request.displayOrder())
                .active(request.isActive() == null || request.isActive())
                .build();
        applyFields(category, request);
        category.setParent(resolveParent(null, request.parentId()));
        return mapToAdminDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto update(Long id, CategoryRequest request) {
        Category category = requireCategory(id);
        Category parent = resolveParent(category, request.parentId());
        if (parent != null && categoryRepository.existsByParentId(id)) {
            throw AppException.badRequest("Danh mục đang có danh mục con nên không thể trở thành danh mục con (cây chỉ 2 cấp)");
        }
        applyFields(category, request);
        category.setParent(parent);
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }
        if (request.isActive() != null) {
            category.setActive(request.isActive());
        }
        return mapToAdminDto(category);
    }

    /** Chỉ xoá khi không còn danh mục con và chưa có sản phẩm nào; ngược lại 409 — dùng isActive=false để ẩn. */
    @Transactional
    public void delete(Long id) {
        Category category = requireCategory(id);
        if (categoryRepository.existsByParentId(id)) {
            throw AppException.conflict("Danh mục còn danh mục con, không xoá được — xoá danh mục con trước hoặc đặt isActive=false để ẩn");
        }
        if (productRepository.existsByCategoryId(id)) {
            throw AppException.conflict("Danh mục đang có sản phẩm, không xoá được — đặt isActive=false để ẩn");
        }
        categoryRepository.delete(category);
    }

    // ---------- helpers ----------

    private Category requireCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy danh mục"));
    }

    private static void applyFields(Category category, CategoryRequest request) {
        category.setName(request.name().trim());
        category.setDescription(trimToNull(request.description()));
        category.setImageUrl(trimToNull(request.imageUrl()));
        category.setAiProduceKeys(normalizeProduceKeys(request.aiProduceKeys()));
    }

    /** Cha phải tồn tại, là danh mục gốc và không phải chính nó (cây 2 cấp). */
    private Category resolveParent(Category self, Long parentId) {
        if (parentId == null) {
            return null;
        }
        if (self != null && parentId.equals(self.getId())) {
            throw AppException.badRequest("Danh mục không thể là cha của chính nó");
        }
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> AppException.badRequest("Danh mục cha #" + parentId + " không tồn tại"));
        if (parent.getParent() != null) {
            throw AppException.badRequest("Danh mục cha phải là danh mục gốc (cây chỉ 2 cấp)");
        }
        return parent;
    }

    private String uniqueSlug(String name) {
        String base = SlugUtils.slugify(name);
        if (base.isEmpty()) {
            base = "danh-muc";
        }
        String slug = base;
        for (int i = 2; categoryRepository.existsBySlug(slug); i++) {
            slug = base + "-" + i;
        }
        return slug;
    }

    /** " Tomato, potato ,," -> "tomato,potato"; rỗng -> null (bỏ qua luật danh mục khi gắn nhãn AI). */
    private static String normalizeProduceKeys(String keys) {
        if (keys == null) {
            return null;
        }
        String normalized = Arrays.stream(keys.split(","))
                .map(k -> k.trim().toLowerCase(Locale.ROOT))
                .filter(k -> !k.isEmpty())
                .distinct()
                .collect(Collectors.joining(","));
        return normalized.isEmpty() ? null : normalized;
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
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
        return toDto(category, productCount, children);
    }

    private CategoryDto mapToAdminDto(Category category) {
        int productCount = productRepository.countAllProductsByCategoryId(category.getId());
        List<CategoryDto> children = category.getParent() != null ? null
                : category.getChildren().stream().sorted(BY_DISPLAY_ORDER).map(this::mapToAdminDto).toList();
        return toDto(category, productCount, children);
    }

    private static CategoryDto toDto(Category category, int productCount, List<CategoryDto> children) {
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
