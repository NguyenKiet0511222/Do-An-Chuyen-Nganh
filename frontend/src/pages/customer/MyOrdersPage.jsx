import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Store, AlertCircle } from "lucide-react";
import { orderApi } from "../../services/api";
import "./MyOrdersPage.css";

const TABS = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING", label: "Chờ xác nhận" },
  { id: "CONFIRMED", label: "Đã xác nhận" },
  { id: "PROCESSING", label: "Đang chuẩn bị" },
  { id: "SHIPPING", label: "Đang giao" },
  { id: "DELIVERED", label: "Hoàn thành" },
  { id: "CANCELLED", label: "Đã huỷ" }
];

const STATUS_MAP = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  DELIVERED: "Hoàn thành",
  CANCELLED: "Đã huỷ"
};

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0).replace("₫", "đ");
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 10
      };
      if (activeTab !== "ALL") {
        params.status = activeTab;
      }
      const data = await orderApi.getMyOrders(params);
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.warn("Lỗi khi tải danh sách đơn hàng:", err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(0);
  };

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt("Vui lòng nhập lý do huỷ đơn hàng:");
    if (!reason || !reason.trim()) {
      if (reason !== null) {
        alert("Cần nhập lý do để huỷ đơn hàng.");
      }
      return;
    }

    try {
      await orderApi.cancel(orderId, reason.trim());
      alert("Đã huỷ đơn hàng thành công.");
      loadOrders();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Không thể huỷ đơn hàng";
      alert(msg);
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="my-orders-page page-container">
      {/* Breadcrumbs */}
      <div className="breadcrumb-container">
        <span className="breadcrumb-link">Tài khoản</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Đơn hàng của tôi</span>
      </div>

      {/* Tabs */}
      <div className="orders-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`order-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {loading ? (
          <div className="empty-state" style={{ padding: "40px", textAlign: "center" }}>
            <p>Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 20px", textAlign: "center" }}>
            <AlertCircle size={48} color="#9ca3af" style={{ margin: "0 auto 12px" }} />
            <h3>Không có đơn hàng nào</h3>
            <p style={{ color: "#6b7280" }}>Chưa có đơn hàng nào trong mục này.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-row-wrapper">
              <div className="order-row-card">
                {/* Left Section: Info */}
                <div className="order-sec-info">
                  <div className="order-id-line">
                    <span className="order-id-text" style={{ fontWeight: 700, color: "#111827" }}>
                      {order.orderCode || `Đơn #${order.id}`}
                    </span>
                    <span className={`status-badge status-${(order.status || "").toLowerCase()}`}>
                      {STATUS_MAP[order.status] || order.status}
                    </span>
                  </div>
                  <div className="order-shop-date" style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <Store size={14} color="#16a34a" />
                    <span>{order.shop?.shopName || "Nông trại"}</span>
                    <span>&middot;</span>
                    <span>{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}</span>
                  </div>
                </div>

                {/* Middle Section: Items */}
                <div className="order-sec-items">
                  <span className="item-count-text" style={{ fontWeight: 500 }}>
                    {order.itemCount || (order.items || []).length} sản phẩm
                  </span>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                    {(order.items || []).map((it) => it.productName).join(", ").slice(0, 50)}...
                  </div>
                </div>

                {/* Right Section: Price & Actions */}
                <div className="order-sec-actions">
                  <div className="order-price-box">
                    <div className="order-total-price" style={{ color: "#16a34a", fontWeight: 700, fontSize: "16px" }}>
                      {formatPrice(order.total)}
                    </div>
                    <div className="order-payment-info" style={{ fontSize: "12px", color: "#6b7280" }}>
                      {order.paymentMethod} &middot; {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </div>
                  </div>
                  <div className="order-buttons" style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-action-outline"
                      onClick={() => navigate(`/my-orders/${order.id}`)}
                    >
                      Chi tiết
                    </button>
                    {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                      <button
                        className="btn-action-outline"
                        style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Huỷ đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedOrderId === order.id && (
                <div className="order-expanded-details" style={{ padding: "16px", background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                  <h4 className="expanded-title" style={{ marginBottom: "12px" }}>Chi tiết sản phẩm</h4>
                  <div className="expanded-items-list">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="expanded-item-row" style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                        <div className="expanded-item-info">
                          <p className="expanded-item-name" style={{ margin: 0, fontWeight: 600 }}>{item.productName}</p>
                          <p className="expanded-item-qty" style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                            Số lượng: {item.quantity} {item.unit || ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
          <span className="pagination-text">Tổng {totalElements} đơn hàng</span>
          <button
            className="page-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
