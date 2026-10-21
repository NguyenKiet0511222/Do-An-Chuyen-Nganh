import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { CheckCircle2, TrendingUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getSharedProducts } from "../../data/productStore";
import { sellerApi, resolveAssetUrl } from "../../services/api";

const chartData = [
  { name: 'T2', doanhThu: 4200000, donHang: 24 },
  { name: 'T3', doanhThu: 3800000, donHang: 18 },
  { name: 'T4', doanhThu: 5100000, donHang: 35 },
  { name: 'T5', doanhThu: 4780000, donHang: 29 },
  { name: 'T6', doanhThu: 6890000, donHang: 48 },
  { name: 'T7', doanhThu: 8390000, donHang: 60 },
  { name: 'CN', doanhThu: 10490000, donHang: 75 },
];

export default function SellerDashboardPage() {
  const [confirmedOrders, setConfirmedOrders] = useState({});
  const [summary, setSummary] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);
  const [liveProducts, setLiveProducts] = useState([]);

  useEffect(() => {
    sellerApi.dashboard.getSummary().then(res => {
      if (res) setSummary(res);
    }).catch(err => console.warn("Lỗi tải dashboard summary:", err?.message));

    sellerApi.order.getAll({ size: 10 }).then(res => {
      const items = res?.content || (Array.isArray(res) ? res : []);
      if (items.length > 0) setLiveOrders(items);
    }).catch(err => console.warn(err));

    sellerApi.product.getAll({ size: 20 }).then(res => {
      const items = res?.content || (Array.isArray(res) ? res : []);
      if (items.length > 0) setLiveProducts(items);
    }).catch(err => console.warn(err));
  }, []);

  const products = useMemo(() => getSharedProducts(), []);
  
  // Real stats fallback
  const pendingProducts = products.filter(p => p.status === "PENDING");
  const rejectedProducts = products.filter(p => p.status === "REJECTED" || p.status === "NEED_INFO" || p.aiLabel?.type === "rotten");

  const displayRejectedProducts = liveProducts.length > 0
    ? liveProducts.filter(p => p.status === "REJECTED" || p.status === "NEED_INFO")
    : rejectedProducts;

  // Orders from local storage fallback
  const pendingOrders = useMemo(() => {
    try {
      const stored = localStorage.getItem("customer_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 4);
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [
      { id: "DH-2026-00003", customer: { fullName: "Lê Văn Nam" }, items: [{ name: "Khoai tây Đà Lạt" }], total: 160000, date: "13/09 16:45", status: "PENDING" },
      { id: "DH-2026-00006", customer: { fullName: "Phạm Thu Hà" }, items: [{ name: "Cà chua bi" }, { name: "Ớt chuông" }], total: 165000, date: "13/09 18:10", status: "PENDING" },
      { id: "DH-2026-00007", customer: { fullName: "Ngô Minh Tuấn" }, items: [{ name: "Dâu tây" }], total: 200000, date: "14/09 07:45", status: "PENDING" }
    ];
  }, []);

  const displayPendingOrders = liveOrders.length > 0 
    ? liveOrders.filter(o => o.status === "PENDING").slice(0, 4).map(o => ({
        id: o.orderCode || `DH-${o.id}`,
        rawId: o.id,
        customer: { fullName: o.receiverName || o.customer?.fullName || "Khách hàng" },
        items: (o.items && o.items.length > 0) ? o.items.map(it => ({ name: it.productName })) : [{ name: "Nông sản tươi" }],
        total: o.total || 0,
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "Hôm nay",
        status: o.status
      }))
    : pendingOrders;

  const handleConfirmOrder = async (id, rawId) => {
    setConfirmedOrders(prev => ({ ...prev, [id]: true }));
    if (rawId) {
      try {
        await sellerApi.order.changeStatus(rawId, { status: "CONFIRMED" });
      } catch (err) {
        console.warn("Lỗi xác nhận đơn qua API:", err);
      }
    }
    try {
      const stored = localStorage.getItem("customer_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        const idx = parsed.findIndex(o => o.id === id);
        if (idx !== -1) {
          parsed[idx].status = "PROCESSING";
          localStorage.setItem("customer_orders", JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const cardStyle = {
    bgcolor: "#fff",
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    p: "24px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  };

  const activeRejectedCount = summary 
    ? ((summary.productsByStatus?.REJECTED || 0) + (summary.productsByStatus?.NEED_INFO || 0))
    : displayRejectedProducts.length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "100%" }}>
      {/* Header Info */}
      <Box>
        <Typography sx={{ fontSize: "24px", fontWeight: 700, color: "#111827", mb: "8px", letterSpacing: "-0.02em" }}>
          Tổng quan shop
        </Typography>
        <Typography sx={{ fontSize: "14px", color: "#6B7280" }}>
          Theo dõi hoạt động kinh doanh và kiểm định chất lượng nông sản thời gian thực
        </Typography>
      </Box>

      {/* Main Grid: 12 Columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(12, 1fr)" },
          gap: "24px",
          alignItems: "stretch",
        }}
      >
        {/* Row 1: Status Bar */}
        <Box sx={{ ...cardStyle, gridColumn: { xs: "span 1", lg: "span 12" }, p: "16px 24px", flexDirection: "row", alignItems: "center", gap: "16px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: "#059669", bgcolor: "#ECFDF5", px: "12px", py: "6px", borderRadius: "8px" }}>
            <CheckCircle2 size={16} />
            Đã xác minh
          </Box>
          <Typography sx={{ fontSize: "14px", color: "#6B7280" }}>
            Đang hoạt động · Xác minh ngày <Box component="span" sx={{ color: "#111827", fontWeight: 600 }}>27/9/2026</Box>
          </Typography>
        </Box>

        {/* Row 2: 4 KPI Cards */}
        {/* KPI 1 */}
        <Box sx={{ ...cardStyle, gridColumn: { xs: "span 1", lg: "span 3" } }}>
          <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#4B5563" }}>Doanh thu hôm nay</Typography>
          <Typography sx={{ mt: "16px", fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            {summary?.todayRevenue !== undefined && summary?.todayRevenue !== null 
              ? Number(summary.todayRevenue).toLocaleString('vi-VN') 
              : "1.240.000"} <Box component="span" sx={{ fontSize: "18px", color: "#6B7280" }}>₫</Box>
          </Typography>
          <Box sx={{ mt: "auto", pt: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Typography sx={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#059669", fontWeight: 600 }}>
              <TrendingUp size={16} /> +18.5%
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>so hôm qua</Typography>
          </Box>
        </Box>

        {/* KPI 2 */}
        <Box sx={{ ...cardStyle, gridColumn: { xs: "span 1", lg: "span 3" } }}>
          <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#4B5563" }}>Đơn chờ xác nhận</Typography>
          <Box sx={{ mt: "16px", display: "flex", alignItems: "baseline", gap: "12px" }}>
            <Typography sx={{ fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
              {summary?.pendingOrders ?? displayPendingOrders.filter(o => o.status === "PENDING" && !confirmedOrders[o.id]).length}
            </Typography>
            <Box sx={{ width: "10px", height: "10px", borderRadius: "50%", bgcolor: "#F59E0B" }} />
          </Box>
          <Typography sx={{ mt: "auto", pt: "16px", fontSize: "13px", color: "#6B7280" }}>
            xác nhận trong <Box component="span" sx={{ color: "#D97706", fontWeight: 600 }}>24h</Box>
          </Typography>
        </Box>

        {/* KPI 3 */}
        <Box sx={{ ...cardStyle, gridColumn: { xs: "span 1", lg: "span 3" } }}>
          <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#4B5563" }}>Sản phẩm chờ duyệt</Typography>
          <Typography sx={{ mt: "16px", fontSize: "28px", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
            {summary?.productsByStatus?.PENDING ?? (liveProducts.length > 0 ? liveProducts.filter(p => p.status === 'PENDING').length : pendingProducts.length)}
          </Typography>
          <Typography sx={{ mt: "auto", pt: "16px", fontSize: "13px", color: "#6B7280" }}>
            {(liveProducts.find(p => p.status === 'PENDING') || pendingProducts[0])?.name || "Nông sản mới"}
          </Typography>
        </Box>

        {/* KPI 4 */}
        <Box sx={{ ...cardStyle, gridColumn: { xs: "span 1", lg: "span 3" } }}>
          <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#4B5563" }}>Sản phẩm cần sửa</Typography>
          <Typography sx={{ mt: "16px", fontSize: "28px", fontWeight: 700, color: activeRejectedCount > 0 ? "#DC2626" : "#059669", letterSpacing: "-0.02em" }}>
            {activeRejectedCount}
          </Typography>
          <Typography sx={{ mt: "auto", pt: "16px", fontSize: "13px", color: "#6B7280" }}>
            {activeRejectedCount > 0 ? `${activeRejectedCount} cần cập nhật` : "Tất cả đã đạt chuẩn"}
          </Typography>
        </Box>

        {/* Row 3: Trend Chart (8 columns) + AI Products (4 columns) */}
        <Box sx={{ ...cardStyle, gridColumn: { xs: "span 1", lg: "span 8" } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: "24px" }}>
            <Box>
              <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "12px" }}>
                Xu hướng doanh thu & đơn hàng
                <Box component="span" sx={{ fontSize: "12px", color: "#059669", bgcolor: "#ECFDF5", px: "8px", py: "4px", borderRadius: "16px", fontWeight: 600 }}>
                  +24% tuần này
                </Box>
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#6B7280", mt: "4px" }}>Thống kê hiệu quả bán hàng 7 ngày gần nhất</Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1, minHeight: "300px", pt: 2, display: "flex", flexDirection: "column" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} tickFormatter={(value) => `${value / 1000000}tr`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                  formatter={(value, name) => [name === 'doanhThu' ? `${Number(value).toLocaleString('vi-VN')} đ` : value, name === 'doanhThu' ? 'Doanh thu' : 'Đơn hàng']}
                  labelStyle={{ fontWeight: 700, color: '#111827', marginBottom: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }} formatter={(value) => value === 'doanhThu' ? 'Doanh thu' : 'Đơn hàng'} />
                <Line yAxisId="left" type="monotone" dataKey="doanhThu" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line yAxisId="right" type="monotone" dataKey="donHang" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* AI List Block */}
        <Box sx={{ ...cardStyle, gridColumn: { xs: "span 1", lg: "span 4" }, p: 0, overflow: "hidden" }}>
          {/* Sub-section 1: Products fixing */}
          <Box sx={{ p: "24px", borderBottom: "1px solid #E5E7EB" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: "16px" }}>
              <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                Sản phẩm cần sửa
                <Box sx={{ width: "8px", height: "8px", borderRadius: "50%", bgcolor: activeRejectedCount > 0 ? "#DC2626" : "#059669" }} />
              </Typography>
              <Typography component={Link} to="/seller/products" sx={{ fontSize: "13px", fontWeight: 600, color: "#059669", textDecoration: "none" }}>Xem</Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {displayRejectedProducts.length > 0 ? displayRejectedProducts.slice(0, 2).map(prod => (
                <Box key={prod.id} component={Link} to={`/seller/products/${prod.id}/edit`} sx={{ display: "flex", gap: "12px", p: "12px", bgcolor: "#FEF2F2", borderRadius: "8px", border: "1px solid #FEE2E2", textDecoration: "none", transition: "all 0.2s", "&:hover": { bgcolor: "#fee2e2" } }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: "4px" }}>
                      <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>{prod.name}</Typography>
                      <Box sx={{ fontSize: "11px", fontWeight: 600, bgcolor: "#DC2626", color: "#fff", px: "6px", py: "2px", borderRadius: "4px" }}>Cần sửa</Box>
                    </Box>
                    <Typography sx={{ fontSize: "13px", color: "#991B1B" }}>
                      {prod.rejectReason || "Cần chụp lại ảnh rõ nét để AI kiểm định độ tươi."}
                    </Typography>
                  </Box>
                </Box>
              )) : (
                <Typography sx={{ fontSize: "13px", color: "#059669", py: 1 }}>
                  Hiện không có sản phẩm nào bị từ chối kiểm định.
                </Typography>
              )}
            </Box>
          </Box>

          {/* Sub-section 2: AI Label Stats */}
          <Box sx={{ p: "24px", flex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: "16px" }}>
              <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Nhãn AI (30 ngày)</Typography>
              <Typography sx={{ fontSize: "13px", color: "#6B7280" }}>Độ tin cậy cao</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 500, mb: "16px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}><Box sx={{ width: "10px", height: "10px", borderRadius: "50%", bgcolor: "#059669" }} /> Tươi: <Typography component="span" sx={{ fontWeight: 700, color: "#111827" }}>92%</Typography></Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}><Box sx={{ width: "10px", height: "10px", borderRadius: "50%", bgcolor: "#F59E0B" }} /> K.chắc: <Typography component="span" sx={{ fontWeight: 700, color: "#111827" }}>6%</Typography></Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}><Box sx={{ width: "10px", height: "10px", borderRadius: "50%", bgcolor: "#DC2626" }} /> Hỏng: <Typography component="span" sx={{ fontWeight: 700, color: "#111827" }}>2%</Typography></Box>
            </Box>
            <Box sx={{ width: "100%", height: "8px", display: "flex", borderRadius: "8px", overflow: "hidden" }}>
              <Box sx={{ width: "92%", bgcolor: "#059669" }} />
              <Box sx={{ width: "6%", bgcolor: "#F59E0B" }} />
              <Box sx={{ width: "2%", bgcolor: "#DC2626" }} />
            </Box>
            <Typography sx={{ mt: "16px", fontSize: "13px", color: "#6B7280" }}>
              Tỷ lệ hàng tươi trên 90% giúp shop được ưu tiên gắn huy hiệu <Box component="span" sx={{ fontWeight: 600, color: "#059669" }}>Nông sản sạch AI Verified</Box>.
            </Typography>
          </Box>
        </Box>

        {/* Row 4: New Orders Table (12 columns) */}
        <Box sx={{ ...cardStyle, gridColumn: { xs: "span 1", lg: "span 12" }, p: 0, overflow: "hidden" }}>
          <Box sx={{ p: "24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Đơn mới cần xử lý</Typography>
              <Box sx={{ fontSize: "13px", fontWeight: 600, color: "#059669", bgcolor: "#ECFDF5", px: "12px", py: "4px", borderRadius: "16px" }}>
                {displayPendingOrders.length} đơn
              </Box>
            </Box>
            <Typography component={Link} to="/seller/orders" sx={{ fontSize: "14px", fontWeight: 600, color: "#059669", textDecoration: "none" }}>Xem tất cả</Typography>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ width: "100%", minWidth: "800px", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <Box component="thead" sx={{ bgcolor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <tr>
                  <Box component="th" sx={{ p: "16px 24px", fontWeight: 500, color: "#6B7280" }}>Mã đơn</Box>
                  <Box component="th" sx={{ p: "16px 24px", fontWeight: 500, color: "#6B7280" }}>Khách hàng</Box>
                  <Box component="th" sx={{ p: "16px 24px", fontWeight: 500, color: "#6B7280", textAlign: "center" }}>Sản phẩm</Box>
                  <Box component="th" sx={{ p: "16px 24px", fontWeight: 500, color: "#6B7280" }}>Tổng tiền</Box>
                  <Box component="th" sx={{ p: "16px 24px", fontWeight: 500, color: "#6B7280" }}>Đặt lúc</Box>
                  <Box component="th" sx={{ p: "16px 24px", fontWeight: 500, color: "#6B7280", textAlign: "right" }}>Thao tác</Box>
                </tr>
              </Box>
              <Box component="tbody">
                {displayPendingOrders.map((order) => {
                  const isDone = confirmedOrders[order.id] || order.status !== "PENDING";
                  const customerName = order.customer?.fullName || order.customer?.name || "Khách hàng";
                  const productCount = order.items?.length || 1;
                  const totalStr = Number(order.total || 0).toLocaleString("vi-VN");

                  return (
                    <Box component="tr" key={order.id} sx={{ borderBottom: "1px solid #E5E7EB", "&:last-child": { borderBottom: "none" }, transition: "background 0.2s", "&:hover": { bgcolor: "#F9FAFB" } }}>
                      <Box component="td" sx={{ p: "16px 24px", fontWeight: 600, color: "#111827" }}>
                        <Link to={`/seller/orders/${order.rawId || order.id}`} style={{ textDecoration: 'none', color: '#111827' }}>
                          {order.id}
                        </Link>
                      </Box>
                      <Box component="td" sx={{ p: "16px 24px", color: "#4B5563" }}>{customerName}</Box>
                      <Box component="td" sx={{ p: "16px 24px", textAlign: "center", color: "#6B7280" }}>{productCount}</Box>
                      <Box component="td" sx={{ p: "16px 24px", fontWeight: 600, color: "#111827" }}>{totalStr} ₫</Box>
                      <Box component="td" sx={{ p: "16px 24px", color: "#6B7280" }}>{order.date || "Hôm nay"}</Box>
                      <Box component="td" sx={{ p: "16px 24px", textAlign: "right" }}>
                        <Box 
                          component="button" 
                          onClick={() => handleConfirmOrder(order.id, order.rawId)}
                          disabled={isDone}
                          sx={{ 
                            px: "16px", py: "8px", fontSize: "14px", fontWeight: 600, borderRadius: "8px", 
                            bgcolor: isDone ? "#E5E7EB" : "#059669", 
                            color: isDone ? "#6B7280" : "#fff", 
                            border: "none", cursor: isDone ? "default" : "pointer", 
                            transition: "all 0.2s", "&:hover": { bgcolor: isDone ? "#E5E7EB" : "#047857" } 
                          }}
                        >
                          {isDone ? "Đã xác nhận" : "Xác nhận"}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
