package com.nhom5.backend.service;

import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.dto.seller.ProductImagesResponse;
import com.nhom5.backend.dto.seller.SellerProductDetailResponse;
import com.nhom5.backend.dto.seller.SellerProductRequest;
import com.nhom5.backend.dto.seller.SellerProductResponse;
import com.nhom5.backend.entity.Category;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.HiddenBy;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.CategoryRepository;
import com.nhom5.backend.repository.OrderItemRepository;
import com.nhom5.backend.repository.ProductImageRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.util.QueryParams;
import com.nhom5.backend.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Quản lý sản phẩm của người bán (api.md mục 3.2, 4.8). Quy tắc đã chốt với nhóm (30/09/2026):
 * <ul>
 *   <li>PENDING (đang chờ duyệt): khoá sửa, chỉ được cập nhật tồn kho.</li>
 *   <li>APPROVED / HIDDEN: sửa BẤT KỲ field nào trừ tồn kho (kể cả ảnh) -> tự về PENDING duyệt lại.</li>
 *   <li>DRAFT / REJECTED / NEED_INFO: sửa tự do, giữ trạng thái cho tới khi gửi duyệt.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SellerProductService {

    public static final int MAX_IMAGES_PER_PRODUCT = 5;
    private static final Set<ProductStatus> SUBMITTABLE =
            EnumSet.of(ProductStatus.DRAFT, ProductStatus.REJECTED, ProductStatus.NEED_INFO);

    private final SellerShopService sellerShopService;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final FileStorageService fileStorageService;
    private final ProductAiLabeler productAiLabeler;

    // ---------- Đọc ----------

    @Transactional(readOnly = true)
    public PageResponse<SellerProductResponse> list(Long userId, String statusCsv, String keyword, int page, int size) {
        Shop shop = sellerShopService.requireShop(userId);
        Set<ProductStatus> statuses = QueryParams.parseEnumList(statusCsv, ProductStatus.class, "status");
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

        Page<Product> products = productRepository.searchByShop(shop.getId(), statuses.isEmpty(),
                statuses.isEmpty() ? EnumSet.allOf(ProductStatus.class) : statuses,
                QueryParams.normalize(keyword), pageable);

        Map<Long, String> primaryImages = primaryImages(products.getContent().stream().map(Product::getId).toList());
        List<SellerProductResponse> content = products.getContent().stream()
                .map(p -> SellerProductResponse.from(p, primaryImages.get(p.getId())))
                .toList();
        return PageResponse.from(new PageImpl<>(content, pageable, products.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public SellerProductDetailResponse get(Long userId, Long productId) {
        return SellerProductDetailResponse.from(requireOwnProduct(userId, productId));
    }

    // ---------- Tạo / sửa / xoá ----------

    /** Tạo sản phẩm DRAFT. Ảnh upload sau qua /images (cần id sản phẩm). */
    public SellerProductDetailResponse create(Long userId, SellerProductRequest request) {
        Shop shop = sellerShopService.requireShop(userId);
        sellerShopService.ensureActive(shop);

        Product product = Product.builder()
                .shop(shop)
                .slug(uniqueSlug(request.name()))
                .status(ProductStatus.DRAFT)
                .build();
        applyRequest(product, request, requireActiveCategory(request.categoryId()));
        return SellerProductDetailResponse.from(productRepository.save(product));
    }

    public SellerProductDetailResponse update(Long userId, Long productId, SellerProductRequest request) {
        Product product = requireOwnProduct(userId, productId);
        ensureEditable(product);

        Category category = requireActiveCategory(request.categoryId());
        boolean contentChanged = !Objects.equals(product.getName(), request.name().trim())
                || !Objects.equals(product.getCategory().getId(), category.getId())
                || !Objects.equals(product.getDescription(), trimToNull(request.description()))
                || !Objects.equals(product.getPrice(), request.price())
                || !Objects.equals(product.getUnit(), request.unit().trim())
                || !Objects.equals(product.getOrigin(), trimToNull(request.origin()));

        applyRequest(product, request, category);
        if (contentChanged) {
            sendBackToReviewIfPublished(product);
        }
        return SellerProductDetailResponse.from(product);
    }

    /** Chỉ xoá được khi sản phẩm chưa từng nằm trong đơn nào (ngược lại 409 -> dùng ẩn). */
    public void delete(Long userId, Long productId) {
        Product product = requireOwnProduct(userId, productId);
        if (orderItemRepository.existsByProductId(productId)) {
            throw AppException.conflict("Sản phẩm đã có đơn hàng, không thể xoá — hãy dùng chức năng ẩn");
        }
        List<String> imageUrls = product.getImages().stream().map(ProductImage::getUrl).toList();
        productRepository.delete(product);
        imageUrls.forEach(fileStorageService::deleteQuietly);
    }

    // ---------- Ảnh ----------

    /** Upload 1..n ảnh (tổng tối đa 5/sản phẩm). Mỗi ảnh tạo 1 ai_result (hiện: chờ admin kiểm định). */
    public ProductImagesResponse uploadImages(Long userId, Long productId, List<MultipartFile> files) {
        Product product = requireOwnProduct(userId, productId);
        ensureEditable(product);

        List<MultipartFile> validFiles = files == null ? List.of()
                : files.stream().filter(f -> f != null && !f.isEmpty()).toList();
        if (validFiles.isEmpty()) {
            throw AppException.badRequest("Vui lòng chọn ít nhất 1 ảnh");
        }
        int current = product.getImages().size();
        if (current + validFiles.size() > MAX_IMAGES_PER_PRODUCT) {
            throw AppException.badRequest("Mỗi sản phẩm tối đa " + MAX_IMAGES_PER_PRODUCT
                    + " ảnh (hiện có " + current + " ảnh)");
        }
        // Kiểm tra hết trước khi lưu để không bị lưu dở dang một nửa số ảnh
        validFiles.forEach(fileStorageService::validateImage);

        int nextOrder = product.getImages().stream().mapToInt(ProductImage::getDisplayOrder).max().orElse(0) + 1;
        boolean hasPrimary = product.getImages().stream().anyMatch(img -> Boolean.TRUE.equals(img.getPrimary()));
        for (MultipartFile file : validFiles) {
            String url = fileStorageService.storeImage(file, "products/" + product.getId());
            ProductImage image = ProductImage.builder()
                    .product(product)
                    .url(url)
                    .displayOrder(nextOrder++)
                    .primary(!hasPrimary)
                    .build();
            hasPrimary = true;
            image.setAiResult(productAiLabeler.labelNewImage(image));
            product.getImages().add(image);
        }
        productAiLabeler.recomputeOverall(product);
        sendBackToReviewIfPublished(product);
        productRepository.flush(); // cascade lưu ảnh mới để có id trả về
        return ProductImagesResponse.from(product);
    }

    /** Xoá ảnh; nếu xoá ảnh chính thì ảnh đầu tiên còn lại thành ảnh chính. */
    public ProductImagesResponse deleteImage(Long userId, Long productId, Long imageId) {
        Product product = requireOwnProduct(userId, productId);
        ensureEditable(product);
        ProductImage image = requireImage(product, imageId);

        product.getImages().remove(image);
        if (Boolean.TRUE.equals(image.getPrimary())) {
            product.getImages().stream()
                    .min((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()))
                    .ifPresent(first -> first.setPrimary(true));
        }
        productAiLabeler.recomputeOverall(product);
        sendBackToReviewIfPublished(product);
        productRepository.flush();
        fileStorageService.deleteQuietly(image.getUrl());
        return ProductImagesResponse.from(product);
    }

    /** Đổi ảnh đại diện — không đổi nội dung nên không cần duyệt lại. */
    public ProductImagesResponse setPrimaryImage(Long userId, Long productId, Long imageId) {
        Product product = requireOwnProduct(userId, productId);
        ensureEditable(product);
        ProductImage target = requireImage(product, imageId);
        product.getImages().forEach(img -> img.setPrimary(img == target));
        return ProductImagesResponse.from(product);
    }

    // ---------- Trạng thái ----------

    /** DRAFT / REJECTED / NEED_INFO -> PENDING. Điều kiện: ≥ 1 ảnh, giá > 0, tồn kho ≥ 0, có danh mục (mục 3.2). */
    public SellerProductDetailResponse submit(Long userId, Long productId) {
        Product product = requireOwnProduct(userId, productId);
        sellerShopService.ensureActive(product.getShop());
        if (!SUBMITTABLE.contains(product.getStatus())) {
            throw AppException.conflict("Chỉ gửi duyệt được sản phẩm ở trạng thái Nháp, Từ chối hoặc Cần bổ sung");
        }
        List<String> missing = new ArrayList<>();
        if (product.getImages().isEmpty()) missing.add("cần ít nhất 1 ảnh");
        if (product.getPrice() == null || product.getPrice() <= 0) missing.add("giá bán phải lớn hơn 0");
        if (product.getStockQuantity() == null || product.getStockQuantity() < 0) missing.add("tồn kho không được âm");
        if (product.getCategory() == null) missing.add("cần chọn danh mục");
        if (!missing.isEmpty()) {
            throw AppException.badRequest("Chưa đủ điều kiện gửi duyệt: " + String.join(", ", missing));
        }
        product.setStatus(ProductStatus.PENDING);
        product.setRejectReason(null);
        return SellerProductDetailResponse.from(product);
    }

    /** Ẩn: chỉ sản phẩm APPROVED. Bỏ ẩn: chỉ khi chính người bán đã ẩn (hidden_by = SELLER). */
    public SellerProductResponse changeVisibility(Long userId, Long productId, boolean hidden) {
        Product product = requireOwnProduct(userId, productId);
        if (hidden) {
            if (product.getStatus() != ProductStatus.APPROVED) {
                throw AppException.conflict("Chỉ ẩn được sản phẩm đang bán (đã duyệt)");
            }
            product.setStatus(ProductStatus.HIDDEN);
            product.setHiddenBy(HiddenBy.SELLER);
        } else {
            if (product.getStatus() != ProductStatus.HIDDEN) {
                throw AppException.conflict("Sản phẩm không ở trạng thái ẩn");
            }
            if (product.getHiddenBy() == HiddenBy.ADMIN) {
                throw AppException.forbidden("Sản phẩm bị quản trị viên ẩn, bạn không thể tự bỏ ẩn");
            }
            product.setStatus(ProductStatus.APPROVED);
            product.setHiddenBy(null);
        }
        return SellerProductResponse.from(product, SellerProductDetailResponse.primaryImageUrl(product));
    }

    /** Sửa tồn kho ở mọi trạng thái (kể cả PENDING), không cần duyệt lại. */
    public SellerProductResponse updateStock(Long userId, Long productId, int stockQuantity) {
        Product product = requireOwnProduct(userId, productId);
        product.setStockQuantity(stockQuantity);
        return SellerProductResponse.from(product, SellerProductDetailResponse.primaryImageUrl(product));
    }

    // ---------- helpers ----------

    /** Sản phẩm của shop khác trả 404 như không tồn tại (không lộ id của shop khác). */
    private Product requireOwnProduct(Long userId, Long productId) {
        Shop shop = sellerShopService.requireShop(userId);
        return productRepository.findByIdAndShopId(productId, shop.getId())
                .orElseThrow(() -> AppException.notFound("Không tìm thấy sản phẩm #" + productId));
    }

    private static ProductImage requireImage(Product product, Long imageId) {
        return product.getImages().stream()
                .filter(img -> img.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> AppException.notFound("Không tìm thấy ảnh #" + imageId + " của sản phẩm"));
    }

    private static void ensureEditable(Product product) {
        if (product.getStatus() == ProductStatus.PENDING) {
            throw AppException.conflict("Sản phẩm đang chờ duyệt, chỉ có thể cập nhật tồn kho");
        }
    }

    /** Sản phẩm đang bán / đang ẩn bị sửa nội dung -> về PENDING để admin duyệt lại. */
    private static void sendBackToReviewIfPublished(Product product) {
        if (product.getStatus() == ProductStatus.APPROVED || product.getStatus() == ProductStatus.HIDDEN) {
            product.setStatus(ProductStatus.PENDING);
            product.setHiddenBy(null);
            product.setRejectReason(null);
        }
    }

    private Category requireActiveCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .orElseThrow(() -> AppException.badRequest("Danh mục không tồn tại hoặc đã ngừng hoạt động"));
    }

    private static void applyRequest(Product product, SellerProductRequest request, Category category) {
        product.setName(request.name().trim());
        product.setCategory(category);
        product.setDescription(trimToNull(request.description()));
        product.setPrice(request.price());
        product.setUnit(request.unit().trim());
        product.setStockQuantity(request.stockQuantity());
        product.setOrigin(trimToNull(request.origin()));
    }

    /** slug = tên không dấu + hậu tố ngẫu nhiên để không trùng giữa các shop. Giữ nguyên khi đổi tên (URL ổn định). */
    private String uniqueSlug(String name) {
        String base = SlugUtils.slugify(name);
        if (base.isEmpty()) {
            base = "san-pham";
        }
        String slug;
        do {
            slug = base + "-" + Integer.toString(ThreadLocalRandom.current().nextInt(0x100000, 0xFFFFFF), 36);
        } while (productRepository.existsBySlug(slug));
        return slug;
    }

    private Map<Long, String> primaryImages(List<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> result = new LinkedHashMap<>();
        for (ProductImage img : productImageRepository.findForPrimaryPick(productIds)) {
            result.putIfAbsent(img.getProduct().getId(), img.getUrl());
        }
        return result;
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
