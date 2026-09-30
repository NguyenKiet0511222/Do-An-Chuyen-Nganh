package com.nhom5.backend.service;

import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.dto.seller.SellerAiResultResponse;
import com.nhom5.backend.dto.seller.SellerDashboardSummaryResponse;
import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.repository.AiResultRepository;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Số liệu tổng quan shop + kết quả AI của ảnh sản phẩm (api.md mục 4.8). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerDashboardService {

    private final SellerShopService sellerShopService;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final AiResultRepository aiResultRepository;

    /** todayRevenue = tổng tiền đơn DELIVERED có delivered_at trong hôm nay (giờ server). */
    public SellerDashboardSummaryResponse summary(Long userId) {
        Shop shop = sellerShopService.requireShop(userId);
        Long shopId = shop.getId();

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        long todayRevenue = orderRepository.sumTotalByShopAndStatusBetween(
                shopId, OrderStatus.DELIVERED, startOfToday, startOfToday.plusDays(1));
        long pendingOrders = orderRepository.countByShopIdAndStatus(shopId, OrderStatus.PENDING);

        Map<ProductStatus, Long> byStatus = new EnumMap<>(ProductStatus.class);
        for (Object[] row : productRepository.countByStatusForShop(shopId)) {
            byStatus.put((ProductStatus) row[0], (Long) row[1]);
        }
        Map<String, Long> productsByStatus = new LinkedHashMap<>();
        for (ProductStatus status : ProductStatus.values()) {
            productsByStatus.put(status.name(), byStatus.getOrDefault(status, 0L));
        }

        Map<AiReviewStatus, Long> byReview = new EnumMap<>(AiReviewStatus.class);
        for (Object[] row : aiResultRepository.countByReviewStatusForShop(shopId)) {
            byReview.put((AiReviewStatus) row[0], (Long) row[1]);
        }
        var aiFlags = new SellerDashboardSummaryResponse.AiFlags(
                byReview.getOrDefault(AiReviewStatus.PENDING_REVIEW, 0L),
                byReview.getOrDefault(AiReviewStatus.RETAKE_REQUESTED, 0L),
                aiResultRepository.countByDisplayLabelForShop(shopId, AiLabel.ROTTEN));

        return new SellerDashboardSummaryResponse(todayRevenue, pendingOrders, productsByStatus, aiFlags);
    }

    /** Kết quả AI của ảnh sản phẩm thuộc shop, mới nhất trước; reviewStatus nhận nhiều giá trị cách nhau dấu phẩy. */
    public PageResponse<SellerAiResultResponse> aiResults(Long userId, String reviewStatusCsv, int page, int size) {
        Shop shop = sellerShopService.requireShop(userId);
        Set<AiReviewStatus> statuses = QueryParams.parseEnumList(reviewStatusCsv, AiReviewStatus.class, "reviewStatus");
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));

        Page<AiResult> results = aiResultRepository.searchByShop(AiSource.PRODUCT_IMAGE, shop.getId(),
                statuses.isEmpty(), statuses.isEmpty() ? EnumSet.allOf(AiReviewStatus.class) : statuses, pageable);

        List<SellerAiResultResponse> content = results.getContent().stream().map(SellerAiResultResponse::from).toList();
        return PageResponse.from(new PageImpl<>(content, pageable, results.getTotalElements()));
    }
}
