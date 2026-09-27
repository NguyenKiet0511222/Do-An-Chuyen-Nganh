import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, Package, Truck, FileText, Check } from "lucide-react";
import "./OrderDetailPage.css";

// Fallback mock data matching wireframe
const MOCK_ORDER = {
  id: "DH-2026-00001",
  status: "COMPLETED",
  statusText: "Hoàn thành",
  shopName: "Vườn rau Tâm An",
  orderDate: "12/09/2026 09:14",
  customer: {
    name: "Trần Thị Mai",
    phone: "0912 345 678",
    address: "Số 12, ngõ 45 Nguyễn Chí Thanh, Láng Thượng, Đống Đa, Hà Nội",
    note: "Gọi trước 10 phút"
  },
  payment: {
    method: "COD",
    status: "Đã thanh toán"
  },
  history: [
    { status: "Giao thành công, đã thu COD", time: "13/09 15:20" },
    { status: "Đang giao (GHN 1A2B3C4D)", time: "12/09 14:02" },
    { status: "Shop đang chuẩn bị hàng", time: "12/09 10:30" },
    { status: "Shop đã xác nhận", time: "12/09 09:40" },
    { status: "Bạn đã đặt hàng", time: "12/09 09:14" }
  ],
  items: [
    {
      id: 1,
      name: "Cà chua bi Đà Lạt",
      aiLabel: "Tươi",
      qty: 2,
      unit: "kg",
      price: 45000,
      reviewed: true,
      rating: 5
    },
    {
      id: 2,
      name: "Rau muống hữu cơ",
      aiLabel: "",
      qty: 2,
      unit: "bó",
      price: 12000,
      reviewed: false,
      rating: 0
    }
  ],
  subtotal: 114000,
  shippingFee: 20000,
  total: 134000
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order] = useState(MOCK_ORDER);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [rating, setRating] = useState(4);
  const [reviewText, setReviewText] = useState("");

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  const currentStep = 5; // 1: Đặt hàng, 2: Đã xác nhận, 3: Đang chuẩn bị, 4: Đang giao, 5: Hoàn thành

  return (
    <div className="order-detail-page page-container">
      {/* Breadcrumbs */}
      <div className="breadcrumb-container">
        <Link to="/my-orders" className="breadcrumb-link">Đơn hàng của tôi</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{id || order.id}</span>
      </div>

      <div className="od-header-card">
        <div className="od-header-top">
          <div className="od-title-group">
            <h2 className="od-id">Đơn hàng {id || order.id}</h2>
            <span className="od-status-badge">{order.statusText}</span>
            <span className="od-shop-date">
              &middot; {order.shopName} &middot; Đặt {order.orderDate}
            </span>
          </div>
          <div className="od-actions">
            <button className="btn-outline-disabled" disabled>Huỷ đơn</button>
            <button className="btn-outline">Mua lại</button>
          </div>
        </div>

        {/* Timeline */}
        <div className="od-timeline-container">
          <div className="timeline-track">
            <div className="timeline-progress" style={{ width: "100%" }}></div>
            
            <div className={`timeline-step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-icon"><FileText size={16} /></div>
              <span className="step-label">Đặt hàng</span>
            </div>
            <div className={`timeline-step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-icon"><Check size={16} /></div>
              <span className="step-label">Đã xác nhận</span>
            </div>
            <div className={`timeline-step ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-icon"><Package size={16} /></div>
              <span className="step-label">Đang chuẩn bị</span>
            </div>
            <div className={`timeline-step ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-icon"><Truck size={16} /></div>
              <span className="step-label">Đang giao</span>
            </div>
            <div className={`timeline-step ${currentStep >= 5 ? 'active' : ''}`}>
              <div className="step-icon"><CheckCircle size={16} /></div>
              <span className="step-label">Hoàn thành</span>
            </div>
          </div>
        </div>
      </div>

      <div className="od-layout-grid">
        {/* Left Column */}
        <div className="od-left-col">
          <div className="od-card">
            <h3 className="od-card-title">Sản phẩm ({order.items.length})</h3>
            <table className="od-table">
              <thead>
                <tr>
                  <th className="th-product">Sản phẩm</th>
                  <th className="th-qty">SL</th>
                  <th className="th-price">Đơn giá</th>
                  <th className="th-total">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td className="td-product">
                      <div className="od-product-info">
                        <div className="od-product-img-placeholder">
                          <div className="cross-line"></div>
                          <div className="cross-line-2"></div>
                        </div>
                        <div className="od-product-details">
                          <p className="od-product-name">{item.name}</p>
                          {item.aiLabel && (
                            <span className="od-ai-label">AI lúc mua: {item.aiLabel}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="td-qty">{item.qty} {item.unit}</td>
                    <td className="td-price">{formatPrice(item.price)}</td>
                    <td className="td-total">
                      <div className="od-total-cell">
                        <span>{formatPrice(item.price * item.qty)}</span>
                        {item.reviewed ? (
                          <span className="badge-reviewed">Đã đánh giá ★{item.rating}</span>
                        ) : (
                          <button 
                            className="btn-review"
                            onClick={() => setReviewingItem(item)}
                          >
                            Đánh giá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="od-summary">
              <div className="summary-row">
                <span>Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              <div className="summary-row total">
                <span>Tổng thanh toán</span>
                <span className="total-val">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Write Review Box */}
          {reviewingItem && (
            <div className="od-card review-box">
              <h3 className="od-card-title">Viết đánh giá: {reviewingItem.name}</h3>
              <div className="form-group">
                <label>Chấm điểm</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      className={`star ${star <= rating ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Nhận xét</label>
                <textarea 
                  className="form-textarea" 
                  rows="3" 
                  placeholder="Sản phẩm có tươi như mô tả không?..."
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                ></textarea>
              </div>
              <button 
                className="btn-solid-dark"
                onClick={() => {
                  alert("Đã gửi đánh giá");
                  setReviewingItem(null);
                }}
              >
                Gửi đánh giá
              </button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="od-right-col">
          <div className="od-card">
            <h3 className="od-card-title">Giao đến</h3>
            <p className="od-customer-name">
              <strong>{order.customer.name}</strong> - {order.customer.phone}
            </p>
            <p className="od-customer-text">{order.customer.address}</p>
            {order.customer.note && (
              <p className="od-customer-text note">Ghi chú: {order.customer.note}</p>
            )}
          </div>

          <div className="od-card">
            <h3 className="od-card-title">Thanh toán</h3>
            <div className="payment-row">
              <span>Phương thức</span>
              <strong>{order.payment.method}</strong>
            </div>
            <div className="payment-row">
              <span>Trạng thái</span>
              <span className="payment-badge">{order.payment.status}</span>
            </div>
          </div>

          <div className="od-card">
            <h3 className="od-card-title">Lịch sử</h3>
            <div className="history-timeline">
              {order.history.map((h, idx) => (
                <div key={idx} className={`history-item ${idx === 0 ? 'latest' : ''}`}>
                  <div className="history-dot"></div>
                  <div className="history-content">
                    <p className="history-status">{h.status}</p>
                    <p className="history-time">{h.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
