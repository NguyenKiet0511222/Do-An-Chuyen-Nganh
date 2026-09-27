import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { orderApi } from "../../services/api";
import { MapPin, CreditCard, Truck, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
  const { cart, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    note: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const shippingFee = totalAmount >= 250000 ? 0 : 30000;
      const finalAmount = totalAmount + shippingFee;
      
      const payload = {
        items: cart,
        totalAmount: finalAmount,
        customerInfo: formData,
        paymentMethod
      };
      
      const res = await orderApi.createOrder(payload);
      setOrderId(res.orderId || Math.floor(Math.random() * 900000) + 100000);
      setOrderSuccess(true);
      clearCart();
    } catch (err) {
      console.error("Lỗi đặt hàng", err);
      alert("Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="checkout-success-container">
        <CheckCircle size={64} className="success-icon" />
        <h1>Đặt hàng thành công!</h1>
        <p>Cảm ơn bạn đã mua sắm nông sản sạch. Đơn hàng của bạn đang được xử lý.</p>
        <div className="order-id-box">
          Mã đơn hàng: <strong>#AGRI-{orderId}</strong>
        </div>
        <p className="success-desc">
          Hệ thống sẽ gửi email xác nhận và thông tin vận chuyển đến bạn sớm nhất.
        </p>
        <div className="success-actions">
          <Link to="/" className="btn-secondary">Về trang chủ</Link>
          <Link to="/my-orders" className="btn-primary">Xem đơn hàng của tôi</Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page-container">
        <div className="empty-cart-view">
          <h2>Giỏ hàng trống</h2>
          <p>Bạn không có sản phẩm nào để thanh toán.</p>
          <Link to="/products" className="btn-primary">Quay lại cửa hàng</Link>
        </div>
      </div>
    );
  }

  const shippingFee = totalAmount >= 250000 ? 0 : 30000;
  const finalAmount = totalAmount + shippingFee;

  return (
    <div className="checkout-page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/cart" className="breadcrumb-link">Giỏ hàng</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Thanh toán</span>
      </div>

      <div className="checkout-page-header">
        <h1>Thanh toán đơn hàng</h1>
      </div>

      <form className="checkout-layout" onSubmit={handleSubmit}>
        {/* Left Column: Form Info */}
        <div className="checkout-form-column">
          {/* Shipping Info */}
          <div className="checkout-section">
            <h2 className="section-title"><MapPin size={20}/> Thông tin giao hàng</h2>
            <div className="form-group-row">
              <div className="form-group">
                <label>Họ và tên *</label>
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Nhập họ tên người nhận" 
                  required 
                  value={formData.fullName} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Nhập số điện thoại" 
                  required 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            <div className="form-group">
              <label>Địa chỉ nhận hàng *</label>
              <input 
                type="text" 
                name="address" 
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" 
                required 
                value={formData.address} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label>Ghi chú đơn hàng (Tùy chọn)</label>
              <textarea 
                name="note" 
                placeholder="Lưu ý về giao hàng, thời gian nhận..." 
                rows="3"
                value={formData.note} 
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>

          {/* Shipping Method */}
          <div className="checkout-section">
            <h2 className="section-title"><Truck size={20}/> Phương thức giao hàng</h2>
            <div className="delivery-method-card active">
              <div className="delivery-method-info">
                <input type="radio" checked readOnly />
                <div className="delivery-text">
                  <strong>Giao hàng tiêu chuẩn</strong>
                  <p>Dự kiến giao trong 2-4 giờ tại khu vực nội thành</p>
                </div>
              </div>
              <span className="delivery-fee">{shippingFee === 0 ? "Miễn phí" : "30.000 ₫"}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <h2 className="section-title"><CreditCard size={20}/> Phương thức thanh toán</h2>
            <div className="payment-methods-list">
              <label className={`payment-method-label ${paymentMethod === 'COD' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="COD" 
                  checked={paymentMethod === 'COD'} 
                  onChange={() => setPaymentMethod('COD')}
                />
                <div className="payment-text">
                  <strong>Thanh toán khi nhận hàng (COD)</strong>
                  <p>Thanh toán bằng tiền mặt khi nhận hàng</p>
                </div>
              </label>
              
              <label className={`payment-method-label ${paymentMethod === 'MOMO' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="MOMO" 
                  checked={paymentMethod === 'MOMO'} 
                  onChange={() => setPaymentMethod('MOMO')}
                />
                <div className="payment-text">
                  <strong>Thanh toán qua Ví MoMo</strong>
                  <p>Quét mã QR qua ứng dụng MoMo</p>
                </div>
              </label>

              <label className={`payment-method-label ${paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="VNPAY" 
                  checked={paymentMethod === 'VNPAY'} 
                  onChange={() => setPaymentMethod('VNPAY')}
                />
                <div className="payment-text">
                  <strong>Thanh toán qua VNPAY</strong>
                  <p>Hỗ trợ thẻ ATM, thẻ tín dụng, quét mã QR</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-summary-column">
          <div className="summary-card">
            <h3>Đơn hàng của bạn</h3>
            
            <div className="checkout-items-list">
              {cart.map((item) => (
                <div key={item.product.id} className="checkout-item-row">
                  <img 
                    src={item.product.image || item.product.primaryImageUrl || "/placeholder.jpg"} 
                    alt={item.product.name} 
                    className="checkout-item-img"
                  />
                  <div className="checkout-item-info">
                    <h4>{item.product.name}</h4>
                    <span>SL: {item.quantity}</span>
                  </div>
                  <div className="checkout-item-price">
                    {formatPrice(item.product.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row total">
              <span>Tổng cộng:</span>
              <span className="total-amount">{formatPrice(finalAmount)}</span>
            </div>
            
            <button 
              type="submit" 
              className="btn-place-order"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Đặt Hàng"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
