import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, totalAmount, totalCount } = useCart();
  const navigate = useNavigate();

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0);
  };

  return (
    <div className="cart-page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Giỏ hàng</span>
      </div>

      <div className="cart-page-header">
        <h1>Giỏ hàng của bạn</h1>
        <p>Bạn đang có <strong>{totalCount}</strong> sản phẩm trong giỏ hàng</p>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart-view">
          <img src="/empty-cart.png" alt="Empty Cart" className="empty-cart-img" />
          <h2>Giỏ hàng trống</h2>
          <p>Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
          <Link to="/products" className="btn-primary">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Left Column: Cart Items */}
          <div className="cart-items-column">
            <div className="cart-table-header">
              <div className="col-product">Sản phẩm</div>
              <div className="col-price">Đơn giá</div>
              <div className="col-qty">Số lượng</div>
              <div className="col-total">Thành tiền</div>
              <div className="col-action"></div>
            </div>

            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.product.id} className="cart-item-row-large">
                  <div className="col-product cart-item-details">
                    <img
                      src={item.product.image || item.product.primaryImageUrl || "/placeholder.jpg"}
                      alt={item.product.name}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info-text">
                      <h3 className="cart-item-title">{item.product.name}</h3>
                      <span className="cart-item-grade-badge">
                        {item.product.aiGrade || "Tươi sạch AI"}
                      </span>
                      <p className="cart-item-origin">Xuất xứ: {item.product.origin || "Đà Lạt"}</p>
                    </div>
                  </div>
                  
                  <div className="col-price">
                    <span className="cart-item-price-val">{formatPrice(item.product.price)}</span>
                  </div>

                  <div className="col-qty">
                    <div className="quantity-stepper">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <input type="number" value={item.quantity} readOnly />
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="col-total">
                    <span className="cart-item-total-val">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>

                  <div className="col-action">
                    <button 
                      className="btn-remove-item"
                      onClick={() => removeFromCart(item.product.id)}
                      title="Xóa khỏi giỏ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="cart-summary-column">
            <div className="summary-card">
              <h3>Tóm tắt đơn hàng</h3>
              
              <div className="summary-row">
                <span>Tạm tính ({totalCount} sản phẩm):</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{totalAmount >= 250000 ? "Miễn phí" : "30.000 ₫"}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Tổng cộng:</span>
                <span className="total-amount">
                  {formatPrice(totalAmount + (totalAmount >= 250000 ? 0 : 30000))}
                </span>
              </div>
              
              <p className="shipping-note">
                (Đã bao gồm VAT nếu có)
              </p>

              <button 
                className="btn-checkout-full"
                onClick={() => navigate("/checkout")}
              >
                Tiến hành thanh toán <ArrowRight size={18} />
              </button>
              
              <Link to="/products" className="continue-shopping-link">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
