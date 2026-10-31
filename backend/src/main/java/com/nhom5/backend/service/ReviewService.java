package com.nhom5.backend.service;

import com.nhom5.backend.dto.product.ReviewRequest;
import com.nhom5.backend.dto.product.ReviewResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.Review;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.ReviewRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/** Đánh giá sản phẩm (api.md mục 3.6, 4.4). */
@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    /** Mới nhất trước. Sản phẩm không tồn tại -> 404. */
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> list(Long productId, int page, int size) {
        if (!productRepository.existsById(productId)) {
            throw AppException.notFound("Không tìm thấy sản phẩm");
        }
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return PageResponse.from(reviewRepository.findByProduct(productId, pageable).map(ReviewResponse::from));
    }

    /**
     * Chỉ chủ đơn, đơn DELIVERED và có sản phẩm này; mỗi (sản phẩm, đơn) 1 lần -> ngược lại 409.
     * Đơn của người khác coi như không có (409 như chưa mua, không lộ đơn tồn tại).
     */
    public ReviewResponse create(Long userId, Long productId, ReviewRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy sản phẩm"));
        Order order = orderRepository.findByIdAndUserId(request.orderId(), userId)
                .filter(o -> o.getItems().stream().anyMatch(i -> i.getProduct().getId().equals(productId)))
                .orElseThrow(() -> AppException.conflict("Bạn chưa mua sản phẩm này trong đơn #" + request.orderId()));
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw AppException.conflict("Chỉ đánh giá được khi đơn hàng đã giao thành công");
        }
        if (reviewRepository.existsByProductIdAndUserIdAndOrderId(productId, userId, order.getId())) {
            throw AppException.conflict("Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi");
        }

        Review review = reviewRepository.saveAndFlush(Review.builder()
                .product(product)
                .user(userRepository.getReferenceById(userId))
                .order(order)
                .rating(request.rating())
                .comment(request.comment() == null || request.comment().isBlank() ? null : request.comment().trim())
                .build());

        recomputeRatings(product);
        return ReviewResponse.from(review);
    }

    /** Tính lại rating_avg (1 chữ số) / rating_count của sản phẩm và shop từ bảng reviews. */
    private void recomputeRatings(Product product) {
        Object[] ofProduct = firstRow(reviewRepository.ratingOfProduct(product.getId()));
        product.setRatingAvg(roundAvg(ofProduct[0]));
        product.setRatingCount(((Long) ofProduct[1]).intValue());

        Shop shop = product.getShop();
        Object[] ofShop = firstRow(reviewRepository.ratingOfShop(shop.getId()));
        shop.setRatingAvg(roundAvg(ofShop[0]));
        shop.setRatingCount(((Long) ofShop[1]).intValue());
    }

    private static Object[] firstRow(List<Object[]> rows) {
        return rows.isEmpty() ? new Object[]{null, 0L} : rows.get(0);
    }

    private static BigDecimal roundAvg(Object avg) {
        return avg == null ? BigDecimal.ZERO
                : BigDecimal.valueOf(((Number) avg).doubleValue()).setScale(1, RoundingMode.HALF_UP);
    }
}
