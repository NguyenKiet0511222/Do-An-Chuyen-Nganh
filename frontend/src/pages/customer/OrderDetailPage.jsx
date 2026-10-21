import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Package, Truck, FileText, Check, AlertCircle, XCircle } from "lucide-react";
import { orderApi, resolveAssetUrl } from "../../services/api";
import { handleImageError } from "../../utils/format";
import AiQualityBadge from "../../components/AiQualityBadge";
import "./OrderDetailPage.css";

const STATUS_TEXT = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang chuẩn bị",
  SHIPPING: "Đang giao hàng",
  DELIVERED: "Hoàn thành",
  CANCELLED: "Đã huỷ"
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0).replace("₫", "đ");
  };

  const loadOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getById(id);
      setOrder(data);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", err);
      setError(err.response?.data?.message || err.message || "Không tìm thấy đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrderDetail();
    }
  }, [id]);

  const handleCancelOrder = async () => {
    const reason = window.prompt("Vui lòng nhập lý do huỷ đơn hàng:");
    if (!reason || !reason.trim()) {
      if (reason !== null) alert("Cần nhập lý do để huỷ đơn.");
      return;
    }

    try {
      await orderApi.cancel(order.id, reason.trim());
      alert("Đã huỷ đơn hàng.");
      loadOrderDetail();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Không thể huỷ đơn hàng";
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="order-detail-page page-container" style={{ padding: "60px", textAlign: "center" }}>
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-page page-container" style={{ padding: "60px 20px", textAlign: "center" }}>
        <AlertCircle size={48} color="#dc2626" style={{ margin: "0 auto 16px" }} />
        <h2>{error || "Không tìm thấy đơn hàng"}</h2>
        <div style={{ marginTop: "20px" }}>
          <button className="btn-primary" onClick={() => navigate("/my-orders")}>
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  const getStep = (status) => {
    switch (status) {
      case "PENDING": return 1;
      case "CONFIRMED": return 2;
      case "PROCESSING": return 3;
      case "SHIPPING": return 4;
      case "DELIVERED": return 5;
      default: return 0;
    }
  };

  const currentStep = getStep(order.status);
  const isCancelled = order.status === "CANCELLED";
  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";

  return (
    <div className="order-detail-page page-container">
      {/* Breadcrumbs */}
      <div className="breadcrumb-container">
        <Link to="/my-orders" className="breadcrumb-link">Đơn hàng của tôi</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{order.orderCode || order.id}</span>
      </div>

      <div className="od-header-card">
        <div className="od-header-top">
          <div className="od-title-group">
            <h2 className="od-id">Đơn hàng {order.orderCode}</h2>
            <span className={`od-status-badge status-${order.status?.toLowerCase()}`}>
              {STATUS_TEXT[order.status] || order.status}
            </span>
            <span className="od-shop-date">
              &middot; Shop: <strong>{order.shop?.shopName}</strong> &middot; Đặt {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}
            </span>
          </div>
          <div className="od-actions">
            {canCancel && (
              <button
                className="btn-outline"
                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                onClick={handleCancelOrder}
              >
                Huỷ đơn
              </button>
            )}
            <Link to="/products" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Mua thêm
            </Link>
          </div>
        </div>

        {/* Timeline */}
        {isCancelled ? (
          <div style={{ padding: "16px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca", marginTop: "16px", display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c" }}>
            <XCircle size={24} />
            <div>
              <strong>Đơn hàng đã bị huỷ</strong>
              {order.cancelReason && <div style={{ fontSize: "13px", marginTop: "2px" }}>Lý do: {order.cancelReason}</div>}
            </div>
          </div>
        ) : (
          <div className="od-timeline-container">
            <div className="timeline-track">
              <div className="timeline-progress" style={{ width: `${Math.min(100, Math.max(10, (currentStep - 1) * 25))}%` }}></div>
              
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
        )}
      </div>

      <div className="od-layout-grid">
        {/* Left Column: Items */}
        <div className="od-left-col">
          <div className="od-card">
            <h3 className="od-card-title">Sản phẩm ({order.items?.length || 0})</h3>
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
                {(order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="td-product">
                      <div className="od-product-info">
                        <img
                          src={resolveAssetUrl(item.imageUrl) || "https://placehold.co/100x100?text=No+Image"}
                          onError={handleImageError}
                          alt={item.productName}
                          style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                        />
                        <div className="od-product-details">
                          <p className="od-product-name">{item.productName}</p>
                          {/* Nhãn AI lúc đặt hàng (aiLabelSnapshot) — cùng kiểu badge với thẻ sản phẩm */}
                          <AiQualityBadge label={item.aiLabelSnapshot} className="od-ai-label" />
                        </div>
                      </div>
                    </td>
                    <td className="td-qty">{item.quantity} {item.unit || "kg"}</td>
                    <td className="td-price">{formatPrice(item.price)}</td>
                    <td className="td-total">
                      <div className="od-total-cell">
                        <span>{formatPrice(item.subtotal || item.price * item.quantity)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lịch sử trạng thái */}
          {order.history && order.history.length > 0 && (
            <div className="od-card" style={{ marginTop: "20px" }}>
              <h3 className="od-card-title">Lịch sử xử lý đơn</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {order.history.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", paddingBottom: "8px", borderBottom: "1px dashed #e5e7eb" }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{STATUS_TEXT[h.toStatus] || h.toStatus}</span>
                      {h.changedBy && <span style={{ color: "#6b7280" }}> (bởi {h.changedBy})</span>}
                      {h.note && <div style={{ color: "#4b5563", marginTop: "2px" }}>{h.note}</div>}
                    </div>
                    <span style={{ color: "#9ca3af" }}>
                      {h.createdAt ? new Date(h.createdAt).toLocaleString("vi-VN") : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer Info & Cost Breakdown */}
        <div className="od-right-col">
          <div className="od-card">
            <h3 className="od-card-title">Địa chỉ nhận hàng</h3>
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              <div><strong>{order.receiverName}</strong> &middot; {order.phone}</div>
              <div style={{ color: "#4b5563", marginTop: "4px" }}>{order.shippingAddress}</div>
              {order.note && (
                <div style={{ marginTop: "8px", padding: "8px", background: "#f9fafb", borderRadius: "4px", fontSize: "13px" }}>
                  <strong>Ghi chú:</strong> {order.note}
                </div>
              )}
            </div>
          </div>

          <div className="od-card" style={{ marginTop: "20px" }}>
            <h3 className="od-card-title">Thanh toán</h3>
            <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Phương thức:</span>
                <strong>{order.paymentMethod} (COD)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Trạng thái:</span>
                <strong style={{ color: order.paymentStatus === "PAID" ? "#16a34a" : "#d97706" }}>
                  {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                </strong>
              </div>
              <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tiền hàng:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Phí vận chuyển:</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 700, marginTop: "8px", color: "#16a34a" }}>
                <span>Tổng thanh toán:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
