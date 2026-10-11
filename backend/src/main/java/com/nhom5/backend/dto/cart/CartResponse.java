package com.nhom5.backend.dto.cart;

import com.nhom5.backend.entity.CartItem;
import com.nhom5.backend.entity.Product;
import com.nhom5.backend.entity.Shop;

import java.util.List;

/** GET /cart (api.md mục 4.5): giỏ nhóm theo shop, mỗi nhóm có phí ship riêng vì checkout tách mỗi shop 1 đơn. */
public record CartResponse(List<Group> groups, long grandTotal, int totalItems) {

    public record Group(ShopBrief shop, List<Item> items, long subtotal, long shippingFee) {
    }

    public record ShopBrief(Long id, String shopName) {
        public static ShopBrief from(Shop s) {
            return new ShopBrief(s.getId(), s.getShopName());
        }
    }

    public record Item(Long id, ProductBrief product, int quantity, long subtotal) {
        public static Item from(CartItem c, String primaryImageUrl) {
            Product p = c.getProduct();
            return new Item(c.getId(), ProductBrief.from(p, primaryImageUrl), c.getQuantity(),
                    p.getPrice() * c.getQuantity());
        }
    }

    /** stockQuantity để frontend cảnh báo khi sản phẩm hết/thiếu hàng (giỏ không tự xoá dòng đó). */
    public record ProductBrief(Long id, String name, Long price, String unit, String primaryImageUrl,
                               Integer stockQuantity) {
        public static ProductBrief from(Product p, String primaryImageUrl) {
            return new ProductBrief(p.getId(), p.getName(), p.getPrice(), p.getUnit(), primaryImageUrl,
                    p.getStockQuantity());
        }
    }
}
