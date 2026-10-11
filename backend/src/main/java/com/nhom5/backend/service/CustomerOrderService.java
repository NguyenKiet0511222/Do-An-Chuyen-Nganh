package com.nhom5.backend.service;

import com.nhom5.backend.config.AppProperties;
import com.nhom5.backend.dto.order.CheckoutRequest;
import com.nhom5.backend.dto.order.CheckoutResponse;
import com.nhom5.backend.dto.order.OrderCancelRequest;
import com.nhom5.backend.dto.order.OrderDetailResponse;
import com.nhom5.backend.dto.order.OrderSummaryResponse;
import com.nhom5.backend.dto.response.FieldError;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Address;
import com.nhom5.backend.entity.CartItem;
import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.OrderItem;
import com.nhom5.backend.entity.OrderStatusHistory;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentMethod;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.AddressRepository;
import com.nhom5.backend.repository.CartItemRepository;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.util.OrderCodes;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

/** Đặt hàng và đơn của khách (api.md mục 3.4, 3.5, 4.6). userId luôn lấy từ JWT. */
@Service
@RequiredArgsConstructor
@Transactional
public class CustomerOrderService {

    /** Khách chỉ được huỷ khi shop chưa chuẩn bị hàng (bảng 3.5). */
    private static final Set<OrderStatus> CUSTOMER_CANCELLABLE = EnumSet.of(OrderStatus.PENDING, OrderStatus.CONFIRMED);

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderSupport orderSupport;
    private final AppProperties appProperties;

    /**
     * Tạo đơn từ giỏ: trừ tồn kho từng dòng (UPDATE có điều kiện) — thiếu bất kỳ dòng nào thì 409 kèm danh sách và
     * rollback toàn bộ; đủ hàng thì nhóm theo shop, mỗi shop 1 đơn chung checkoutGroupId, snapshot giá/tên, xoá dòng giỏ.
     */
    public CheckoutResponse checkout(Long userId, CheckoutRequest request) {
        Address address = addressRepository.findByIdAndUserId(request.addressId(), userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy địa chỉ"));
        List<CartItem> items = selectCartItems(userId, request.cartItemIds());

        List<FieldError> errors = new ArrayList<>();
        for (CartItem item : items) {
            Product p = item.getProduct();
            String field = "productId:" + p.getId();
            if (p.getStatus() != ProductStatus.APPROVED || p.getShop().getStatus() != ShopStatus.ACTIVE) {
                errors.add(new FieldError(field, "Sản phẩm không còn bán"));
            } else if (productRepository.deductStock(p.getId(), item.getQuantity()) == 0) {
                errors.add(new FieldError(field, "Chỉ còn " + productRepository.findStockById(p.getId()) + " " + p.getUnit()));
            }
        }
        if (!errors.isEmpty()) {
            throw AppException.conflict("Một số sản phẩm không đủ hàng", errors); // rollback các UPDATE đã chạy
        }

        String groupId = UUID.randomUUID().toString();
        long shippingFee = appProperties.order().shippingFeeFlat();
        User customer = userRepository.getReferenceById(userId);
        String shippingAddress = formatAddress(address);
        PaymentMethod paymentMethod = request.paymentMethod() == null ? PaymentMethod.COD : request.paymentMethod();

        Map<Long, List<CartItem>> byShop = new LinkedHashMap<>(); // giữ thứ tự shop như trong giỏ
        for (CartItem c : items) {
            byShop.computeIfAbsent(c.getProduct().getShop().getId(), k -> new ArrayList<>()).add(c);
        }

        List<Order> orders = new ArrayList<>();
        for (List<CartItem> group : byShop.values()) {
            Order order = Order.builder()
                    .orderCode(OrderCodes.tempCode())
                    .checkoutGroupId(groupId)
                    .user(customer)
                    .shop(group.get(0).getProduct().getShop())
                    .paymentMethod(paymentMethod)
                    .receiverName(address.getReceiverName())
                    .phone(address.getPhone())
                    .shippingAddress(shippingAddress)
                    .note(OrderSupport.trimToNull(request.note()))
                    .shippingFee(shippingFee)
                    .build();
            for (CartItem c : group) {
                Product p = c.getProduct();
                order.addItem(OrderItem.builder()
                        .product(p)
                        .productName(p.getName())
                        .unit(p.getUnit())
                        .price(p.getPrice())
                        .quantity(c.getQuantity())
                        .subtotal(p.getPrice() * c.getQuantity())
                        .aiLabelSnapshot(p.getAiOverallLabel())
                        .build());
            }
            long subtotal = order.getItems().stream().mapToLong(OrderItem::getSubtotal).sum();
            order.setSubtotal(subtotal);
            order.setTotal(subtotal + shippingFee);
            order.addHistory(OrderStatusHistory.builder()
                    .fromStatus(null)
                    .toStatus(OrderStatus.PENDING)
                    .changedBy(customer)
                    .build());
            orderRepository.saveAndFlush(order);            // có id
            order.setOrderCode(OrderCodes.fromId(order.getId()));
            orders.add(order);
        }
        cartItemRepository.deleteAllInBatch(items);
        orderRepository.flush();
        return CheckoutResponse.from(groupId, orders);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> list(Long userId, String statusCsv, int page, int size) {
        Set<OrderStatus> statuses = QueryParams.parseEnumList(statusCsv, OrderStatus.class, "status");
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<Order> orders = orderRepository.searchByUser(userId, statuses.isEmpty(),
                statuses.isEmpty() ? EnumSet.allOf(OrderStatus.class) : statuses, pageable);
        List<OrderSummaryResponse> content = orders.getContent().stream().map(OrderSummaryResponse::from).toList();
        return PageResponse.from(new PageImpl<>(content, pageable, orders.getTotalElements()));
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse get(Long userId, Long orderId) {
        return orderSupport.toDetail(requireOwnOrder(userId, orderId));
    }

    /** Huỷ khi PENDING / CONFIRMED; hoàn tồn kho và ghi lịch sử (OrderSupport). */
    public OrderDetailResponse cancel(Long userId, Long orderId, OrderCancelRequest request) {
        Order order = requireOwnOrder(userId, orderId);
        if (!CUSTOMER_CANCELLABLE.contains(order.getStatus())) {
            throw AppException.conflict("Chuyển trạng thái không hợp lệ (" + order.getStatus() + " -> CANCELLED)");
        }
        orderSupport.cancel(order, userId, request.cancelReason(), null);
        orderRepository.flush();
        return orderSupport.toDetail(order);
    }

    // ---------- helpers ----------

    private Order requireOwnOrder(Long userId, Long orderId) {
        return orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn hàng #" + orderId));
    }

    /** cartItemIds rỗng = cả giỏ; id không thuộc giỏ của mình -> 404. */
    private List<CartItem> selectCartItems(Long userId, List<Long> cartItemIds) {
        List<CartItem> all = cartItemRepository.findByUserIdWithProduct(userId);
        List<CartItem> selected = all;
        if (cartItemIds != null && !cartItemIds.isEmpty()) {
            Set<Long> wanted = new HashSet<>(cartItemIds);
            selected = all.stream().filter(c -> wanted.contains(c.getId())).toList();
            if (selected.size() < wanted.size()) {
                Set<Long> found = new HashSet<>(selected.stream().map(CartItem::getId).toList());
                Long missing = wanted.stream().filter(id -> !found.contains(id)).findFirst().orElse(null);
                throw AppException.notFound("Không tìm thấy sản phẩm trong giỏ #" + missing);
            }
        }
        if (selected.isEmpty()) {
            throw AppException.badRequest("Giỏ hàng trống");
        }
        return selected;
    }

    private static String formatAddress(Address a) {
        return String.join(", ", Stream.of(a.getStreet(), a.getWard(), a.getDistrict(), a.getProvince())
                .filter(s -> s != null && !s.isBlank())
                .toList());
    }
}
