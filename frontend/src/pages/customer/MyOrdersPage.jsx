import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./MyOrdersPage.css";

const MOCK_ORDERS = [
  {
    id: "DH-2026-00002",
    date: "12/09/2026 09:14",
    status: "DELIVERING",
    shop: { id: 2, name: "HTX Xoài Cao Lãnh" },
    items: [
      {
        id: 2,
        name: "Xoài Cát Chu Cao Lãnh",
        image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=150",
        price: 215000,
        quantity: 1,
      }
    ],
    total: 215000,
    shippingFee: 0,
    paymentMethod: "COD",
    paymentStatus: "Chưa thanh toán",
    checkoutGroupId: "DH-2026-00001"
  },
  {
    id: "DH-2026-00001",
    date: "12/09/2026 09:14",
    deliveryDate: "Giao 13/09",
    status: "COMPLETED",
    shop: { id: 1, name: "Vườn rau Tâm An" },
    items: [
      {
        id: 1,
        name: "Cà chua bi Đà Lạt",
        image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=150",
        price: 45000,
        quantity: 1,
      },
      {
        id: 3,
        name: "Rau cải xanh",
        image: "https://images.unsplash.com/photo-1522184216316-3c25379f9760?w=150",
        price: 89000,
        quantity: 1,
      }
    ],
    total: 134000,
    shippingFee: 0,
    paymentMethod: "COD",
    paymentStatus: "Đã thanh toán",
    checkoutGroupId: "DH-2026-00002"
  },
  {
    id: "DH-2026-00003",
    date: "13/09/2026 16:45",
    status: "PENDING",
    shop: { id: 1, name: "Vườn rau Tâm An" },
    items: [
      {
        id: 4,
        name: "Khoai tây vàng Đà Lạt",
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=150",
        price: 160000,
        quantity: 1,
      }
    ],
    total: 160000,
    shippingFee: 0,
    paymentMethod: "COD",
    paymentStatus: "Chưa thanh toán"
  }
];

const TABS = [
  { id: "ALL", label: "Tất cả" },
  { id: "PENDING", label: "Chờ xác nhận" },
  { id: "PROCESSING", label: "Đang chuẩn bị" },
  { id: "DELIVERING", label: "Đang giao" },
  { id: "COMPLETED", label: "Hoàn thành" },
  { id: "CANCELLED", label: "Đã huỷ" }
];

const STATUS_MAP = {
  PENDING: "Chờ xác nhận",
  PROCESSING: "Đang chuẩn bị",
  DELIVERING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ"
};

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [activeTab, setActiveTab] = useState("ALL");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0).replace("₫", "đ");
  };

  // Tính số lượng đơn cho từng tab
  const tabCounts = useMemo(() => {
    const counts = { ALL: orders.length };
    TABS.forEach(t => {
      if (t.id !== "ALL") counts[t.id] = 0;
    });
    orders.forEach(order => {
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = orders.filter(order => {
    if (activeTab === "ALL") return true;
    return order.status === activeTab;
  });

  const handleCancelOrder = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn huỷ đơn hàng này?")) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "CANCELLED" } : o));
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  return (
    <div className="my-orders-page page-container">
      {/* Breadcrumbs matching wireframe */}
      <div className="breadcrumb-container">
        <span className="breadcrumb-link">Tài khoản</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Đơn hàng của tôi</span>
      </div>

      {/* Tabs */}
      <div className="orders-tabs">
        {TABS.map(tab => {
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              className={`order-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label} {count !== undefined && count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>Không có đơn hàng nào.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-row-wrapper">
              <div className="order-row-card">
                {/* Left Section: Info */}
              <div className="order-sec-info">
                <div className="order-id-line">
                  <span className="order-id-text">{order.id}</span>
                  <span className={`status-badge status-${order.status.toLowerCase()}`}>
                    {STATUS_MAP[order.status]}
                  </span>
                </div>
                <div className="order-shop-date">
                  {order.shop.name} &middot; Đặt {order.date} 
                  {order.deliveryDate && ` \u00B7 ${order.deliveryDate}`}
                </div>
                {order.checkoutGroupId && (
                  <div className="checkout-group-badge">
                    Cùng lần đặt với {order.checkoutGroupId}
                  </div>
                )}
              </div>

              {/* Middle Section: Items */}
              <div className="order-sec-items">
                <div className="item-thumbnails">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <img key={idx} src={item.image} alt={item.name} className="thumbnail-img" />
                  ))}
                </div>
                <span className="item-count-text">
                  {order.items.reduce((acc, it) => acc + it.quantity, 0)} sản phẩm
                </span>
              </div>

              {/* Right Section: Price & Actions */}
              <div className="order-sec-actions">
                <div className="order-price-box">
                  <div className="order-total-price">{formatPrice(order.total + order.shippingFee)}</div>
                  <div className="order-payment-info">
                    {order.paymentMethod} &middot; {order.paymentStatus}
                  </div>
                </div>
                <div className="order-buttons">
                  {order.status === "COMPLETED" ? (
                    <button className="btn-action-outline" onClick={() => toggleExpand(order.id)}>Đánh giá / Xem</button>
                  ) : order.status === "PENDING" ? (
                    <>
                      <button className="btn-action-outline" onClick={() => toggleExpand(order.id)}>Xem</button>
                      <button className="btn-action-outline" onClick={() => handleCancelOrder(order.id)}>Huỷ đơn</button>
                    </>
                  ) : order.status === "DELIVERING" ? (
                    <button className="btn-action-outline" onClick={() => navigate(`/my-orders/${order.id}`)}>Xem chi tiết</button>
                  ) : (
                    <button className="btn-action-outline" onClick={() => toggleExpand(order.id)}>Xem chi tiết</button>
                  )}
                </div>
              </div>
              </div>

              {/* Expanded details */}
              {expandedOrderId === order.id && (
                <div className="order-expanded-details">
                  <h4 className="expanded-title">Chi tiết sản phẩm</h4>
                  <div className="expanded-items-list">
                    {order.items.map(item => (
                      <div key={item.id} className="expanded-item-row">
                        <img src={item.image} alt={item.name} className="expanded-item-img" />
                        <div className="expanded-item-info">
                          <p className="expanded-item-name">{item.name}</p>
                          <p className="expanded-item-qty">Số lượng: {item.quantity}</p>
                        </div>
                        <div className="expanded-item-price">
                          {formatPrice(item.price * item.quantity)}
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
      <div className="pagination-container">
        <span className="pagination-text">Hiển thị 1–3 / 7</span>
        <button className="page-btn"><ChevronLeft size={16} /></button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
