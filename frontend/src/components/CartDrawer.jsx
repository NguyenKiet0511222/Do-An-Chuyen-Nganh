import { useState } from "react";
import { useCart } from "../context/useCart";
import { orderApi } from "../services/api";
import { X, Trash2, Plus, Minus, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalAmount,
    totalCount
  } = useCart();

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  if (!isCartOpen) return null;

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const handleCheckout = async () => {
    const res = await orderApi.createOrder({ items: cart, totalAmount });
    setOrderId(res.orderId);
    setOrderSuccess(true);
    setTimeout(() => {
      clearCart();
      setOrderSuccess(false);
      setOrderId(null);
      setIsCartOpen(false);
    }, 2800);
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
          {orderSuccess ? (
            <div className="order-success-view">
              <CheckCircle size={56} className="success-icon" />
              <h3>Đặt Hàng Thành Công!</h3>
              <p>
                Đơn hàng nông sản chuẩn kiểm định AI của bạn đang được nông trại đóng gói
                và chuyển đến trong 2 giờ.
              </p>
              <div className="order-receipt-chip">
                Mã đơn hàng: #AGRI-{orderId || "888999"}
              </div>
            </div>
          ) : cart.length === 0 ? (
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
                <div key={item.product.id} className="cart-item-row">
                  <img
                    src={item.product.image || item.product.primaryImageUrl || "/placeholder.jpg"}
                    alt={item.product.name}
                    className="cart-item-thumb"
                  />
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.product.name}</h4>
                    <span className="cart-item-grade">
                      {item.product.aiGrade ||
                        (item.product.aiOverallLabel === "FRESH"
                          ? "Tươi sạch AI"
                          : item.product.aiOverallLabel === "UNCERTAIN"
                          ? "Cần kiểm tra"
                          : "Chuẩn VietGAP")}
                    </span>
                    <span className="cart-item-price">
                      {formatPrice(item.product.price)} / {item.product.unit || "kg"}
                    </span>

                    <div className="cart-qty-actions">
                      <div className="qty-stepper">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          aria-label="Giảm số lượng"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          aria-label="Tăng số lượng"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="item-remove-btn"
                        onClick={() => removeFromCart(item.product.id)}
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
        {!orderSuccess && cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row">
              <span>Tạm tính:</span>
              <span className="summary-total">{formatPrice(totalAmount)}</span>
            </div>
            <p className="shipping-notice">
              Miễn phí vận chuyển cho đơn nông sản từ 250.000đ
            </p>
            <button
              type="button"
              className="checkout-btn"
              onClick={handleCheckout}
            >
              <span>Xác nhận đặt hàng</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
