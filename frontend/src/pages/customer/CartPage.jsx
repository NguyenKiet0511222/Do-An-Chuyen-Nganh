import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Store, AlertTriangle } from "lucide-react";

export default function CartPage() {
  const { cart, groups, removeFromCart, updateQuantity, totalAmount, totalCount, grandTotal } = useCart();
  const navigate = useNavigate();

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0);
  };

  const totalShippingFee = (groups || []).reduce((sum, g) => sum + (g.shippingFee || 20000), 0);
  const displayGrandTotal = grandTotal || (totalAmount + totalShippingFee);

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
        <div className="empty-cart-view" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ margin: "0 auto 20px", width: "90px", height: "90px", borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={48} color="#9CA3AF" />
          </div>
          <h2>Giỏ hàng trống</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
          <Link to="/products" className="btn-primary">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Left Column: Cart Items grouped by Shop */}
          <div className="cart-items-column">
            {(groups && groups.length > 0 ? groups : [{ shop: { id: 1, shopName: "Cửa hàng nông sản" }, items: cart, subtotal: totalAmount, shippingFee: 20000 }]).map((group, groupIdx) => (
              <div key={group.shop?.id || groupIdx} className="cart-shop-group" style={{ marginBottom: "24px", background: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                <div className="shop-group-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#1f2937" }}>
                    <Store size={18} color="#16a34a" />
                    <span>{group.shop?.shopName || "Nông trại"}</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    Phí vận chuyển: <strong>{formatPrice(group.shippingFee || 20000)}</strong>
                  </span>
                </div>

                <div className="cart-table-header" style={{ padding: "10px 16px", background: "#fafafa", fontSize: "13px", color: "#6b7280" }}>
                  <div className="col-product">Sản phẩm</div>
                  <div className="col-price">Đơn giá</div>
                  <div className="col-qty">Số lượng</div>
                  <div className="col-total">Thành tiền</div>
                  <div className="col-action"></div>
                </div>

                <div className="cart-items-list" style={{ padding: "0 16px" }}>
                  {(group.items || []).map((item) => {
                    const isOutOfStock = item.product?.stockQuantity != null && item.product.stockQuantity < item.quantity;
                    return (
                      <div key={item.id || item.product?.id} className="cart-item-row-large" style={{ padding: "16px 0", borderBottom: "1px solid #f3f4f6" }}>
                        <div className="col-product cart-item-details">
                          <img
                            src={item.product?.primaryImageUrl || item.product?.image || item.product?.imageUrl || "https://placehold.co/100x100?text=No+Image"}
                            alt={item.product?.name}
                            className="cart-item-img"
                          />
                          <div className="cart-item-info-text">
                            <h3 className="cart-item-title">{item.product?.name}</h3>
                            <span className="cart-item-grade-badge">
                              Đơn vị: {item.product?.unit || "kg"}
                            </span>
                            {isOutOfStock && (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                                <AlertTriangle size={14} />
                                <span>Kho chỉ còn {item.product.stockQuantity} {item.product.unit || "kg"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-price">
                          <span className="cart-item-price-val">{formatPrice(item.product?.price)}</span>
                        </div>

                        <div className="col-qty">
                          <div className="quantity-stepper">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                              <Minus size={14} />
                            </button>
                            <input type="number" value={item.quantity} readOnly />
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="col-total">
                          <span className="cart-item-total-val">
                            {formatPrice(item.subtotal || (item.product?.price * item.quantity))}
                          </span>
                        </div>

                        <div className="col-action">
                          <button 
                            className="btn-remove-item"
                            onClick={() => removeFromCart(item.id)}
                            title="Xóa khỏi giỏ"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
                <span>Tổng phí vận chuyển ({groups.length || 1} shop):</span>
                <span>{formatPrice(totalShippingFee)}</span>
              </div>
              
              <div className="summary-divider"></div>
              
              <div className="summary-row total">
                <span>Tổng thanh toán:</span>
                <span className="total-amount">
                  {formatPrice(displayGrandTotal)}
                </span>
              </div>
              
              <p className="shipping-note" style={{ fontSize: "12px", color: "#6b7280" }}>
                * Đơn hàng sẽ được tách theo từng người bán tương ứng (20.000đ/đơn shop).
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
