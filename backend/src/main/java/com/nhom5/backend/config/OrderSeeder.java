package com.nhom5.backend.config;

import com.nhom5.backend.entity.Order;
import com.nhom5.backend.entity.OrderItem;
import com.nhom5.backend.entity.OrderStatusHistory;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AccountTier;
import com.nhom5.backend.entity.enums.AuthProvider;
import com.nhom5.backend.entity.enums.OrderStatus;
import com.nhom5.backend.entity.enums.PaymentStatus;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.UserStatus;
import com.nhom5.backend.repository.OrderRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Seed khách mẫu + vài đơn hàng cho shop "Vườn rau Tâm An" (seller@nongsan.local) để test API đơn của người bán
 * khi chưa có luồng checkout (tuần 5). Chạy sau ProductSeeder, chỉ khi bảng orders đang trống.
 * Khách mẫu: customer@nongsan.local / Customer@123.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@org.springframework.core.annotation.Order(3)
public class OrderSeeder implements ApplicationRunner {

    private static final long SHIPPING_FEE = 20_000L;

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (orderRepository.count() > 0) {
            return;
        }
        User seller = userRepository.findByEmail("seller@nongsan.local").orElse(null);
        Shop shop = seller == null ? null : shopRepository.findByUserId(seller.getId()).orElse(null);
        if (shop == null) {
            return;
        }
        List<Product> products = productRepository.findByShopIdAndStatusOrderByIdAsc(shop.getId(), ProductStatus.APPROVED);
        if (products.size() < 2) {
            return;
        }
        User customer = userRepository.findByEmail("customer@nongsan.local").orElseGet(() -> userRepository.save(
                User.builder()
                        .fullName("Trần Thị Mai")
                        .email("customer@nongsan.local")
                        .phone("0987654321")
                        .passwordHash(passwordEncoder.encode("Customer@123"))
                        .provider(AuthProvider.LOCAL)
                        .role(Role.CUSTOMER)
                        .status(UserStatus.ACTIVE)
                        .accountTier(AccountTier.STANDARD)
                        .active(true)
                        .build()));

        Product p1 = products.get(0);
        Product p2 = products.get(1);
        Product p3 = products.get(products.size() > 2 ? 2 : 0);
        int year = LocalDateTime.now().getYear();

        orderRepository.saveAll(List.of(
                build(year, 1, customer, seller, shop, OrderStatus.PENDING, "Gọi trước 10 phút", p1, 2, p2, 1),
                build(year, 2, customer, seller, shop, OrderStatus.PENDING, null, p3, 1, null, 0),
                build(year, 3, customer, seller, shop, OrderStatus.CONFIRMED, null, p2, 3, null, 0),
                build(year, 4, customer, seller, shop, OrderStatus.SHIPPING, null, p1, 1, p3, 2),
                build(year, 5, customer, seller, shop, OrderStatus.DELIVERED, null, p2, 2, null, 0),
                build(year, 6, customer, seller, shop, OrderStatus.CANCELLED, null, p1, 1, null, 0)));
        log.info("Đã seed 6 đơn hàng mẫu cho shop {}", shop.getShopName());
    }

    /** Tạo đơn ở trạng thái target kèm lịch sử đi qua từng bước (không trừ tồn kho — chỉ là dữ liệu mẫu). */
    private Order build(int year, int seq, User customer, User seller, Shop shop, OrderStatus target, String note,
                        Product a, int qtyA, Product b, int qtyB) {
        Order order = Order.builder()
                .orderCode(String.format("DH-%d-%05d", year, seq))
                .checkoutGroupId(UUID.randomUUID().toString())
                .user(customer)
                .shop(shop)
                .receiverName(customer.getFullName())
                .phone(customer.getPhone())
                .shippingAddress("Số 12, ngõ 45 Nguyễn Chí Thanh, Đống Đa, Hà Nội")
                .note(note)
                .shippingFee(SHIPPING_FEE)
                .build();
        addItem(order, a, qtyA);
        if (b != null) {
            addItem(order, b, qtyB);
        }
        long subtotal = order.getItems().stream().mapToLong(OrderItem::getSubtotal).sum();
        order.setSubtotal(subtotal);
        order.setTotal(subtotal + SHIPPING_FEE);

        LocalDateTime now = LocalDateTime.now();
        order.addHistory(history(null, OrderStatus.PENDING, customer, null));
        List<OrderStatus> path = switch (target) {
            case CONFIRMED -> List.of(OrderStatus.CONFIRMED);
            case SHIPPING -> List.of(OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPING);
            case DELIVERED -> List.of(OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPING,
                    OrderStatus.DELIVERED);
            case CANCELLED -> List.of(OrderStatus.CANCELLED);
            default -> List.of();
        };
        OrderStatus previous = OrderStatus.PENDING;
        for (OrderStatus next : path) {
            String historyNote = next == OrderStatus.CANCELLED ? "Khách đổi ý, không mua nữa" : null;
            order.addHistory(history(previous, next, seller, historyNote));
            previous = next;
        }
        order.setStatus(target);
        if (path.contains(OrderStatus.CONFIRMED)) order.setConfirmedAt(now);
        if (target == OrderStatus.DELIVERED) {
            order.setDeliveredAt(now);
            order.setPaymentStatus(PaymentStatus.PAID);
        }
        if (target == OrderStatus.CANCELLED) {
            order.setCancelledAt(now);
            order.setCancelReason("Khách đổi ý, không mua nữa");
        }
        return order;
    }

    private static void addItem(Order order, Product product, int quantity) {
        order.addItem(OrderItem.builder()
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .price(product.getPrice())
                .quantity(quantity)
                .subtotal(product.getPrice() * quantity)
                .aiLabelSnapshot(product.getAiOverallLabel())
                .build());
    }

    private static OrderStatusHistory history(OrderStatus from, OrderStatus to, User by, String note) {
        return OrderStatusHistory.builder().fromStatus(from).toStatus(to).changedBy(by).note(note).build();
    }
}
