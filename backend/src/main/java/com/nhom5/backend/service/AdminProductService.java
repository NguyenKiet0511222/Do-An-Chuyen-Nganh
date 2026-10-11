package com.nhom5.backend.service;

import com.nhom5.backend.dto.admin.AdminProductDetailResponse;
import com.nhom5.backend.dto.admin.AdminProductResponse;
import com.nhom5.backend.dto.admin.ProductReviewBulkRequest;
import com.nhom5.backend.dto.admin.ProductReviewBulkResponse;
import com.nhom5.backend.dto.admin.ProductReviewRequest;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.ProductReviewHistory;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.HiddenBy;
import com.nhom5.backend.entity.enums.ProductReviewAction;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ProductImageRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.ProductReviewHistoryRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Admin duyệt sản phẩm (api.md mục 3.2, 4.9): danh sách mọi trạng thái, chi tiết kèm lịch sử, duyệt lẻ / hàng loạt. */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminProductService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductReviewHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminProductResponse> search(String statusCsv, String keyword, Long categoryId, Long shopId,
                                                     AiLabel aiLabel, LocalDate from, LocalDate to,
                                                     int page, int size) {
        if (from != null && to != null && from.isAfter(to)) {
            throw AppException.badRequest("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }
        Set<ProductStatus> statuses = QueryParams.parseEnumList(statusCsv, ProductStatus.class, "status");
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

        Page<Product> products = productRepository.searchForAdmin(statuses.isEmpty(),
                statuses.isEmpty() ? EnumSet.allOf(ProductStatus.class) : statuses,
                QueryParams.normalize(keyword), categoryId, shopId, aiLabel,
                from == null ? null : from.atStartOfDay(),
                to == null ? null : to.plusDays(1).atStartOfDay(),
                pageable);

        Map<Long, String> images = primaryImages(products.getContent().stream().map(Product::getId).toList());
        List<AdminProductResponse> content = products.getContent().stream()
                .map(p -> AdminProductResponse.from(p, images.get(p.getId())))
                .toList();
        return PageResponse.from(new PageImpl<>(content, pageable, products.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public AdminProductDetailResponse get(Long productId) {
        Product p = productRepository.findDetailById(productId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy sản phẩm #" + productId));
        return toDetail(p);
    }

    /**
     * Một thao tác duyệt. Kiểm tra trạng thái + lý do TRƯỚC khi sửa entity để review-bulk gặp lỗi
     * không để lại thay đổi dở dang. Ghi 1 dòng lịch sử.
     */
    public AdminProductDetailResponse review(Long adminId, Long productId, ProductReviewRequest request) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy sản phẩm #" + productId));
        ProductStatus from = p.getStatus();
        String reason = OrderSupport.trimToNull(request.reason());

        switch (request.action()) {
            case APPROVE -> {
                requireStatus(p, ProductStatus.PENDING, "duyệt");
                p.setStatus(ProductStatus.APPROVED);
                p.setApprovedAt(LocalDateTime.now());
                p.setRejectReason(null);
                p.setHiddenBy(null);
            }
            case REJECT -> {
                requireStatus(p, ProductStatus.PENDING, "từ chối");
                requireReason(reason, "Vui lòng nhập lý do từ chối");
                p.setStatus(ProductStatus.REJECTED);
                p.setRejectReason(reason);
            }
            case NEED_INFO -> {
                requireStatus(p, ProductStatus.PENDING, "yêu cầu bổ sung");
                requireReason(reason, "Vui lòng nhập nội dung cần bổ sung");
                p.setStatus(ProductStatus.NEED_INFO);
                p.setRejectReason(reason);
            }
            case HIDE -> {
                requireStatus(p, ProductStatus.APPROVED, "ẩn");
                p.setStatus(ProductStatus.HIDDEN);
                p.setHiddenBy(HiddenBy.ADMIN);
            }
            case UNHIDE -> {
                requireStatus(p, ProductStatus.HIDDEN, "bỏ ẩn");
                p.setStatus(ProductStatus.APPROVED);
                p.setHiddenBy(null);
            }
        }
        historyRepository.save(ProductReviewHistory.builder()
                .product(p)
                .actor(userRepository.getReferenceById(adminId))
                .action(ProductReviewAction.valueOf(request.action().name()))
                .fromStatus(from)
                .toStatus(p.getStatus())
                .reason(reason)
                .build());
        productRepository.flush();
        return get(productId);
    }

    /** Xử lý từng sản phẩm độc lập: lỗi của 1 sản phẩm (sai trạng thái, không tồn tại) không chặn các sản phẩm khác. */
    public ProductReviewBulkResponse reviewBulk(Long adminId, ProductReviewBulkRequest request) {
        ProductReviewRequest single = new ProductReviewRequest(
                ProductReviewRequest.Action.valueOf(request.action().name()), request.reason());
        int succeeded = 0;
        List<ProductReviewBulkResponse.Failure> failed = new ArrayList<>();
        for (Long id : new LinkedHashSet<>(request.productIds())) {
            try {
                review(adminId, id, single);
                succeeded++;
            } catch (AppException ex) {
                failed.add(new ProductReviewBulkResponse.Failure(id, ex.getMessage()));
            }
        }
        return new ProductReviewBulkResponse(succeeded, failed);
    }

    // ---------- helpers ----------

    private AdminProductDetailResponse toDetail(Product p) {
        long approved = productRepository.countByShopIdAndStatus(p.getShop().getId(), ProductStatus.APPROVED);
        long rejected = productRepository.countByShopIdAndStatus(p.getShop().getId(), ProductStatus.REJECTED);
        return AdminProductDetailResponse.from(p,
                AdminProductDetailResponse.ShopInfo.from(p.getShop(), approved, rejected),
                historyRepository.findByProductId(p.getId()));
    }

    private static void requireStatus(Product p, ProductStatus expected, String actionName) {
        if (p.getStatus() != expected) {
            throw AppException.conflict("Không thể " + actionName + " sản phẩm đang ở trạng thái " + p.getStatus());
        }
    }

    private static void requireReason(String reason, String message) {
        if (reason == null) {
            throw AppException.badRequest(message);
        }
    }

    private Map<Long, String> primaryImages(List<Long> productIds) {
        Map<Long, String> result = new LinkedHashMap<>();
        if (!productIds.isEmpty()) {
            for (ProductImage img : productImageRepository.findForPrimaryPick(productIds)) {
                result.putIfAbsent(img.getProduct().getId(), img.getUrl());
            }
        }
        return result;
    }
}
