import { useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    totalAmount,
    totalCount
  } = useCart();

  if (!isCartOpen) return null;

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  const handleGoToCart = () => {
    setIsCartOpen(false);
    navigate("/cart");
  };

  return (
    <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
      <div
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        {/* Drawer Header */}
        <div className="cart-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} className="text-emerald" />
            <h2 id="cart-heading">Giỏ Hàng Nông Sản</h2>
            <span className="cart-count-badge">({totalCount})</span>
          </div>
          <button
            type="button"
            className="close-drawer-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Đóng giỏ hàng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty-view">
              <ShoppingBag size={48} className="empty-cart-icon" />
              <p>Giỏ hàng nông sản của bạn đang trống</p>
              <button
                type="button"
                className="shop-now-btn"
                onClick={() => setIsCartOpen(false)}
              >
                Khám phá nông sản tươi ngay
              </button>
            </div>
          ) : (
            <div className="cart-item-list">
              {cart.map((item) => (
                <div key={item.id || item.product?.id} className="cart-item-row">
                  <img
                    src={item.product?.primaryImageUrl || item.product?.image || item.product?.imageUrl || "https://placehold.co/100x100?text=No+Image"}
                    alt={item.product?.name}
                    className="cart-item-thumb"
                  />
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.product?.name}</h4>
                    {item.shop && (
                      <span className="cart-item-shop" style={{ fontSize: 11, color: "#6b7280" }}>
                        {item.shop.shopName}
                      </span>
                    )}
                    <span className="cart-item-price">
                      {formatPrice(item.product?.price)} / {item.product?.unit || "kg"}
                    </span>

                    <div className="cart-qty-actions">
                      <div className="qty-stepper">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label="Giảm số lượng"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          aria-label="Tăng số lượng"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="item-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row">
              <span>Tạm tính ({totalCount} sản phẩm):</span>
              <span className="summary-total">{formatPrice(totalAmount)}</span>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                type="button"
                className="btn-outline"
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                onClick={handleGoToCart}
              >
                Xem giỏ hàng
              </button>
              <button
                type="button"
                className="checkout-btn"
                style={{ flex: 1.5 }}
                onClick={handleCheckout}
              >
                <span>Thanh toán</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
