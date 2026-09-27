package com.nhom5.backend.config;

import com.nhom5.backend.entity.AiResult;
import com.nhom5.backend.entity.Category;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.ProductImage;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AccountTier;
import com.nhom5.backend.entity.enums.AiLabel;
import com.nhom5.backend.entity.enums.AiReviewStatus;
import com.nhom5.backend.entity.enums.AiSource;
import com.nhom5.backend.entity.enums.AuthProvider;
import com.nhom5.backend.entity.enums.ProductStatus;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.ShopStatus;
import com.nhom5.backend.entity.enums.UserStatus;
import com.nhom5.backend.repository.CategoryRepository;
import com.nhom5.backend.repository.ProductRepository;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Seed dữ liệu mẫu ban đầu: Danh mục, Shop, Sản phẩm (kèm ảnh và nhãn AI) để test
 * GET /api/products và GET /api/products/{id} (khớp mục 4.4 api.md) ngay sau khi start server.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2) // chạy sau AdminSeeder
public class ProductSeeder implements ApplicationRunner {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (productRepository.count() > 0) {
            return;
        }

        log.info("Bắt đầu seed dữ liệu mẫu cho Category, Shop, Product, ProductImage và AiResult...");

        // 1. Tạo Category
        Category rootVeg = Category.builder()
                .name("Rau củ")
                .slug("rau-cu")
                .description("Rau củ tươi sạch từ nông trại đạt chuẩn VietGAP")
                .imageUrl("https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300")
                .displayOrder(1)
                .active(true)
                .build();
        categoryRepository.save(rootVeg);

        Category catCuQua = Category.builder()
                .name("Củ quả")
                .slug("cu-qua")
                .parent(rootVeg)
                .description("Các loại củ quả tươi ngon")
                .imageUrl("https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300")
                .displayOrder(1)
                .active(true)
                .aiProduceKeys("tomato,potato,carrot")
                .build();
        categoryRepository.save(catCuQua);

        Category catRauLa = Category.builder()
                .name("Rau lá")
                .slug("rau-la")
                .parent(rootVeg)
                .description("Các loại rau ăn lá xanh tươi mỗi ngày")
                .imageUrl("https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300")
                .displayOrder(2)
                .active(true)
                .aiProduceKeys("cabbage,lettuce")
                .build();
        categoryRepository.save(catRauLa);

        Category rootFruit = Category.builder()
                .name("Trái cây")
                .slug("trai-cay")
                .description("Trái cây đặc sản nhiệt đới theo mùa")
                .imageUrl("https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300")
                .displayOrder(2)
                .active(true)
                .aiProduceKeys("mango,apple,banana,orange,strawberry")
                .build();
        categoryRepository.save(rootFruit);

        // 2. Tạo User & Shop
        User sellerUser = userRepository.findByEmail("seller@nongsan.local").orElseGet(() -> {
            User u = User.builder()
                    .fullName("Nguyễn Văn Tâm")
                    .email("seller@nongsan.local")
                    .phone("0901234567")
                    .passwordHash(passwordEncoder.encode("Seller@123"))
                    .provider(AuthProvider.LOCAL)
                    .role(Role.SELLER)
                    .status(UserStatus.ACTIVE)
                    .accountTier(AccountTier.STANDARD)
                    .active(true)
                    .build();
            return userRepository.save(u);
        });

        Shop shopTamAn = shopRepository.findByUserId(sellerUser.getId()).orElseGet(() -> {
            Shop s = Shop.builder()
                    .user(sellerUser)
                    .shopName("Vườn rau Tâm An")
                    .description("Chuyên cung cấp nông sản sạch Đà Lạt chuẩn VietGAP trực tiếp từ nông trại.")
                    .province("Lâm Đồng")
                    .address("Đường Mimosa, Phường 10, TP. Đà Lạt")
                    .phone("0901234567")
                    .logoUrl("https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=200")
                    .status(ShopStatus.ACTIVE)
                    .ratingAvg(new BigDecimal("4.8"))
                    .ratingCount(56)
                    .verifiedAt(LocalDateTime.now().minusMonths(3))
                    .build();
            return shopRepository.save(s);
        });

        User seller2 = userRepository.findByEmail("caolanh@nongsan.local").orElseGet(() -> {
            User u = User.builder()
                    .fullName("Lê Văn Cao")
                    .email("caolanh@nongsan.local")
                    .phone("0912345678")
                    .passwordHash(passwordEncoder.encode("Seller@123"))
                    .provider(AuthProvider.LOCAL)
                    .role(Role.SELLER)
                    .status(UserStatus.ACTIVE)
                    .accountTier(AccountTier.STANDARD)
                    .active(true)
                    .build();
            return userRepository.save(u);
        });

        Shop shopCaoLanh = shopRepository.findByUserId(seller2.getId()).orElseGet(() -> {
            Shop s = Shop.builder()
                    .user(seller2)
                    .shopName("HTX Xoài Cao Lãnh")
                    .description("Hợp tác xã nông sản sạch Đồng Tháp, chuyên xoài Cát Chu xuất khẩu.")
                    .province("Đồng Tháp")
                    .address("Xã Mỹ Xương, Huyện Cao Lãnh, Đồng Tháp")
                    .phone("0912345678")
                    .logoUrl("https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=200")
                    .status(ShopStatus.ACTIVE)
                    .ratingAvg(new BigDecimal("4.7"))
                    .ratingCount(32)
                    .verifiedAt(LocalDateTime.now().minusMonths(2))
                    .build();
            return shopRepository.save(s);
        });

        // 3. Tạo Sản phẩm 1: Cà chua bi Đà Lạt (APPROVED)
        Product p1 = Product.builder()
                .shop(shopTamAn)
                .category(catCuQua)
                .name("Cà chua bi Đà Lạt")
                .slug("ca-chua-bi-da-lat")
                .description("Cà chua bi tươi ngon thu hoạch từ vườn Đà Lạt đạt chuẩn VietGAP, quả mọng nước, vị ngọt thanh tự nhiên.")
                .price(45000L)
                .unit("kg")
                .stockQuantity(120)
                .origin("Lâm Đồng")
                .status(ProductStatus.APPROVED)
                .aiOverallLabel(AiLabel.FRESH)
                .aiOverallConfidence(new BigDecimal("0.9200"))
                .soldCount(214)
                .ratingAvg(new BigDecimal("4.6"))
                .ratingCount(18)
                .approvedAt(LocalDateTime.now().minusDays(5))
                .build();
        productRepository.save(p1);

        ProductImage img1_1 = ProductImage.builder()
                .product(p1)
                .url("https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600")
                .primary(true)
                .displayOrder(1)
                .build();

        AiResult ai1_1 = AiResult.builder()
                .source(AiSource.PRODUCT_IMAGE)
                .productImage(img1_1)
                .imageUrl(img1_1.getUrl())
                .produce("tomato")
                .label(AiLabel.FRESH)
                .confidence(new BigDecimal("0.9200"))
                .finalLabel(AiLabel.FRESH)
                .reviewStatus(AiReviewStatus.AUTO_ACCEPTED)
                .modelVersion("mobilenetv2_v1")
                .build();
        img1_1.setAiResult(ai1_1);

        ProductImage img1_2 = ProductImage.builder()
                .product(p1)
                .url("https://images.unsplash.com/photo-1546470427-0d4db154ceb7?w=600")
                .primary(false)
                .displayOrder(2)
                .build();

        AiResult ai1_2 = AiResult.builder()
                .source(AiSource.PRODUCT_IMAGE)
                .productImage(img1_2)
                .imageUrl(img1_2.getUrl())
                .produce("tomato")
                .label(AiLabel.FRESH)
                .confidence(new BigDecimal("0.9100"))
                .finalLabel(AiLabel.FRESH)
                .reviewStatus(AiReviewStatus.AUTO_ACCEPTED)
                .modelVersion("mobilenetv2_v1")
                .build();
        img1_2.setAiResult(ai1_2);

        p1.getImages().addAll(List.of(img1_1, img1_2));
        productRepository.save(p1);

        // 4. Tạo Sản phẩm 2: Xoài Cát Chu Cao Lãnh (APPROVED)
        Product p2 = Product.builder()
                .shop(shopCaoLanh)
                .category(rootFruit)
                .name("Xoài Cát Chu Cao Lãnh")
                .slug("xoai-cat-chu-cao-lanh")
                .description("Xoài Cát Chu Cao Lãnh da vàng óng ả, thịt dày, ngọt đậm đà, mùi thơm quyến rũ.")
                .price(65000L)
                .unit("kg")
                .stockQuantity(80)
                .origin("Đồng Tháp")
                .status(ProductStatus.APPROVED)
                .aiOverallLabel(AiLabel.FRESH)
                .aiOverallConfidence(new BigDecimal("0.9500"))
                .soldCount(156)
                .ratingAvg(new BigDecimal("4.9"))
                .ratingCount(28)
                .approvedAt(LocalDateTime.now().minusDays(3))
                .build();
        productRepository.save(p2);

        ProductImage img2_1 = ProductImage.builder()
                .product(p2)
                .url("https://images.unsplash.com/photo-1553279768-865429fa0078?w=600")
                .primary(true)
                .displayOrder(1)
                .build();
        AiResult ai2_1 = AiResult.builder()
                .source(AiSource.PRODUCT_IMAGE)
                .productImage(img2_1)
                .imageUrl(img2_1.getUrl())
                .produce("mango")
                .label(AiLabel.FRESH)
                .confidence(new BigDecimal("0.9500"))
                .finalLabel(AiLabel.FRESH)
                .reviewStatus(AiReviewStatus.AUTO_ACCEPTED)
                .modelVersion("mobilenetv2_v1")
                .build();
        img2_1.setAiResult(ai2_1);

        p2.getImages().add(img2_1);
        productRepository.save(p2);

        // 5. Tạo Sản phẩm 3: Khoai tây vàng Đà Lạt (APPROVED)
        Product p3 = Product.builder()
                .shop(shopTamAn)
                .category(catCuQua)
                .name("Khoai tây vàng Đà Lạt")
                .slug("khoai-tay-vang-da-lat")
                .description("Khoai tây vàng ruột đặc, dẻo thơm, không mầm, thích hợp chiên xào hoặc nấu súp.")
                .price(35000L)
                .unit("kg")
                .stockQuantity(200)
                .origin("Lâm Đồng")
                .status(ProductStatus.APPROVED)
                .aiOverallLabel(AiLabel.FRESH)
                .aiOverallConfidence(new BigDecimal("0.8800"))
                .soldCount(310)
                .ratingAvg(new BigDecimal("4.5"))
                .ratingCount(40)
                .approvedAt(LocalDateTime.now().minusDays(10))
                .build();
        productRepository.save(p3);

        ProductImage img3_1 = ProductImage.builder()
                .product(p3)
                .url("https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600")
                .primary(true)
                .displayOrder(1)
                .build();
        p3.getImages().add(img3_1);
        productRepository.save(p3);

        // 6. Tạo Sản phẩm 4: Dâu tây giống Nhật Đà Lạt (APPROVED)
        Product p4 = Product.builder()
                .shop(shopTamAn)
                .category(rootFruit)
                .name("Dâu tây giống Nhật Đà Lạt")
                .slug("dau-tay-giong-nhat-da-lat")
                .description("Dâu tây thu hoạch tại vườn thủy canh Đà Lạt, quả đỏ mọng, vị ngọt thơm đặc trưng.")
                .price(180000L)
                .unit("hộp 500g")
                .stockQuantity(50)
                .origin("Lâm Đồng")
                .status(ProductStatus.APPROVED)
                .aiOverallLabel(AiLabel.FRESH)
                .aiOverallConfidence(new BigDecimal("0.9400"))
                .soldCount(95)
                .ratingAvg(new BigDecimal("4.8"))
                .ratingCount(15)
                .approvedAt(LocalDateTime.now().minusDays(2))
                .build();
        productRepository.save(p4);

        ProductImage img4_1 = ProductImage.builder()
                .product(p4)
                .url("https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600")
                .primary(true)
                .displayOrder(1)
                .build();
        p4.getImages().add(img4_1);
        productRepository.save(p4);

        // 7. Tạo Sản phẩm 5: Bắp cải thảo Đà Lạt (PENDING - Chưa duyệt -> Không được xuất hiện ở API public)
        Product p5 = Product.builder()
                .shop(shopTamAn)
                .category(catRauLa)
                .name("Bắp cải thảo Đà Lạt (Chờ duyệt)")
                .slug("bap-cai-thao-da-lat")
                .description("Bắp cải thảo cuốn chắc tay, đang chờ admin kiểm duyệt trước khi mở bán.")
                .price(25000L)
                .unit("kg")
                .stockQuantity(50)
                .origin("Lâm Đồng")
                .status(ProductStatus.PENDING)
                .aiOverallLabel(AiLabel.UNCERTAIN)
                .aiOverallConfidence(new BigDecimal("0.6500"))
                .soldCount(0)
                .ratingAvg(BigDecimal.ZERO)
                .ratingCount(0)
                .build();
        productRepository.save(p5);

        log.info("Hoàn tất seed dữ liệu mẫu sản phẩm công khai!");
    }
}
