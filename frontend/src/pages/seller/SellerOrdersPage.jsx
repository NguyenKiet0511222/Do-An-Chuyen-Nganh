import { Box, Typography, Paper, Tabs, Tab, TextField, InputAdornment, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Pagination } from "@mui/material";
import { Search, Download, AlertCircle, Package, Truck, DollarSign, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

const DEFAULT_ORDERS = [
  { id: "DH-2026-00003", customer: "Lê Văn Nam", phone: "0987 654 321", product: "Khoai tây Đà Lạt", count: 5, total: "160.000", payment: "COD", time: "13/09 16:45", status: "Chờ xác nhận" },
  { id: "DH-2026-00006", customer: "Phạm Thu Hà", phone: "0934 999 000", product: "Cà chua bi ×2, Ớt chuông", count: 1, total: "165.000", payment: "COD", time: "13/09 18:10", status: "Chờ xác nhận" },
  { id: "DH-2026-00007", customer: "Ngô Minh Tuấn", phone: "0912 456 456", product: "Dâu tây", count: 1, total: "200.000", payment: "COD", time: "14/09 07:45", status: "Chờ xác nhận" },
  { id: "DH-2026-00008", customer: "Vũ Thị Hoa", phone: "0978 111 222", product: "Rau muống ×4, Cà rốt", count: 2, total: "112.000", payment: "COD", time: "14/09 08:20", status: "Chờ xác nhận" },
  { id: "DH-2026-00010", customer: "Nguyễn Thị Lan", phone: "0911 222 333", product: "Hành tây", count: 2, total: "60.000", payment: "COD", time: "12/09 09:15", status: "Đang chuẩn bị" },
  { id: "DH-2026-00011", customer: "Trần Văn B", phone: "0922 333 444", product: "Táo đỏ", count: 3, total: "150.000", payment: "COD", time: "12/09 10:20", status: "Đang chuẩn bị" },
  { id: "DH-2026-00012", customer: "Lê Thị C", phone: "0944 555 666", product: "Chuối sứ", count: 2, total: "40.000", payment: "COD", time: "11/09 14:00", status: "Đang giao" }
];

export default function SellerOrdersPage() {
  const [tabValue, setTabValue] = useState(0); 
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [ordersList, setOrdersList] = useState(() => {
    try {
      const stored = localStorage.getItem("customer_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fromCustomer = parsed.map(o => ({
            id: o.id,
            customer: o.customer?.fullName || "Khách đặt online",
            phone: o.customer?.phone || "0912 345 678",
            product: (o.items || []).map(it => it.name).join(", ") || "Nông sản tươi",
            count: (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
            total: Number(o.total || 0).toLocaleString("vi-VN"),
            payment: o.paymentMethod || "COD",
            time: o.date || "Vừa xong",
            status: o.status === "PENDING" ? "Chờ xác nhận" : o.status === "PROCESSING" ? "Đang chuẩn bị" : o.status === "DELIVERING" ? "Đang giao" : "Hoàn thành"
          }));
          const existingIds = new Set(fromCustomer.map(x => x.id));
          return [...fromCustomer, ...DEFAULT_ORDERS.filter(x => !existingIds.has(x.id))];
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_ORDERS;
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
  };

  const tabs = [
    { label: "Chờ xác nhận", filter: "Chờ xác nhận", activeColor: "#059669", badgeBg: "#d1fae5", badgeColor: "#065f46" },
    { label: "Đang chuẩn bị", filter: "Đang chuẩn bị", activeColor: "#0f172a", badgeBg: "#f1f5f9", badgeColor: "#475569" },
    { label: "Đang giao", filter: "Đang giao", activeColor: "#0f172a", badgeBg: "#f1f5f9", badgeColor: "#475569" },
    { label: "Hoàn thành", filter: "Hoàn thành", activeColor: "#0f172a", badgeBg: "#f1f5f9", badgeColor: "#475569" },
    { label: "Đã huỷ", filter: "Đã huỷ", activeColor: "#0f172a", badgeBg: "#f1f5f9", badgeColor: "#475569" },
    { label: "Tất cả", filter: null, activeColor: "#0f172a" },
  ];

  const handleConfirmOrder = (id) => {
    setOrdersList(prev => prev.map(o => o.id === id ? { ...o, status: "Đang chuẩn bị" } : o));
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

  const filteredOrders = useMemo(() => {
    let result = ordersList;
    const currentFilter = tabs[tabValue].filter;
    if (currentFilter) {
      result = result.filter(o => o.status === currentFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.customer.toLowerCase().includes(q) || 
        o.phone.includes(q) ||
        o.product.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tabValue, ordersList, searchQuery]);

  const pendingCount = ordersList.filter(o => o.status === "Chờ xác nhận").length;
  const preparingCount = ordersList.filter(o => o.status === "Đang chuẩn bị").length;
  const deliveringCount = ordersList.filter(o => o.status === "Đang giao").length;

  return (
    <Box sx={{ pb: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "flex-end" }, justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Đơn hàng của shop
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Theo dõi, tiếp nhận đơn mới và quản lý quy trình đóng gói vận chuyển
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, bgcolor: "#ecfdf5", color: "#047857", fontSize: 12, fontWeight: 600, borderRadius: 2, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <CheckCircle2 size={16} /> Tự động đồng bộ AI Verified
          </Box>
        </Box>
      </Box>

      {/* Quick Summary Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.7)", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Cần xác nhận ngay</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#059669" }}>{pendingCount}</Typography>
                <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: "#fffbeb", color: "#d97706", fontSize: 11, fontWeight: 600 }}>Gấp trong 24h</Box>
              </Box>
            </Box>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={20} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.7)", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Đang chuẩn bị gói</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{preparingCount}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>đơn hàng</Typography>
              </Box>
            </Box>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={20} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.7)", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Đang giao hàng</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{deliveringCount}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>Đang luân chuyển</Typography>
              </Box>
            </Box>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={20} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.7)", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Tổng số đơn hàng</Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: 0.5 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{ordersList.length}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>đơn</Typography>
              </Box>
            </Box>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#f0fdfa", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={20} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Table Paper */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        
        {/* Tabs Bar */}
        <Box sx={{ borderBottom: "1px solid #f1f5f9", px: 1 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ sx: { bgcolor: tabs[tabValue].activeColor, height: 2 } }}
          >
            {tabs.map((tab, idx) => {
              const count = tab.filter ? ordersList.filter(o => o.status === tab.filter).length : ordersList.length;
              return (
                <Tab 
                  key={idx}
                  disableRipple
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {tab.label}
                      <Box sx={{ px: 1, py: 0.25, borderRadius: 10, fontSize: 11, fontWeight: 600, bgcolor: tab.badgeBg || "#f1f5f9", color: tab.badgeColor || "#475569" }}>
                        {count}
                      </Box>
                    </Box>
                  } 
                  sx={{ 
                    textTransform: "none", 
                    fontWeight: tabValue === idx ? 700 : 500, 
                    color: tabValue === idx ? `${tab.activeColor} !important` : "#64748b",
                    fontSize: 13,
                    px: 3,
                    py: 2.5,
                    minHeight: "auto"
                  }} 
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Action Toolbar */}
        <Box sx={{ p: 2.5, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, flex: 1, minWidth: 280 }}>
            <TextField
              placeholder="Tìm theo mã đơn, tên khách, số điện thoại..."
              size="small"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              sx={{ width: { xs: "100%", sm: 360 }, "& .MuiOutlinedInput-root": { bgcolor: "rgba(248, 250, 252, 0.5)", borderRadius: 2, "& fieldset": { borderColor: "#e2e8f0" } } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search size={16} color="#94a3b8" /></InputAdornment>,
              }}
            />
          </Box>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(248, 250, 252, 0.75)", borderTop: "1px solid #f1f5f9" }}>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", py: 1.5, pl: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Mã đơn</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Tổng</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Thanh toán</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Đặt lúc</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9", pr: 4 }} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length > 0 ? filteredOrders.map((row) => {
                const isConfirmed = row.status !== "Chờ xác nhận";
                return (
                <TableRow key={row.id} sx={{ transition: "background 0.2s", "&:hover": { bgcolor: "rgba(248, 250, 252, 0.8)", "& .order-id": { color: "#047857" } } }}>
                  <TableCell sx={{ borderBottom: "1px solid #f1f5f9", py: 2, pl: 4 }}>
                    <Typography className="order-id" sx={{ fontWeight: 700, color: "#0f172a", fontSize: 13, transition: "color 0.2s" }}>{row.id}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{row.customer}</Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 11, mt: 0.25 }}>{row.phone}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{ color: "#1e293b", fontSize: 13, fontWeight: 500 }}>
                      {row.product} <Box component="span" sx={{ fontSize: 11, fontWeight: 700, color: "#047857", bgcolor: "#ecfdf5", px: 0.75, py: 0.25, borderRadius: 1, ml: 0.5 }}>×{row.count}</Box>
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                    <Typography sx={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                      {row.total} <Box component="span" sx={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>đ</Box>
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                    <Box sx={{ display: "inline-flex", px: 1, py: 0.25, borderRadius: 1, fontSize: 11, fontWeight: 600, bgcolor: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0" }}>
                      {row.payment}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f1f5f9", color: "#64748b", fontSize: 11 }}>{row.time}</TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f1f5f9", pr: 4 }} align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      {row.status === "Chờ xác nhận" ? (
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => handleConfirmOrder(row.id)}
                          sx={{ 
                            bgcolor: "#059669", 
                            color: "#fff",
                            "&:hover": { bgcolor: "#047857" }, 
                            textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2, minWidth: "auto", 
                            boxShadow: "0 1px 2px rgba(16, 185, 129, 0.2)"
                          }}
                        >
                          Xác nhận
                        </Button>
                      ) : (
                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: 11, fontWeight: 600, bgcolor: "#f1f5f9", color: "#475569" }}>
                          {row.status}
                        </Box>
                      )}
                      <Button component={Link} to={`/seller/orders/${row.id}`} variant="text" size="small" sx={{ color: "#475569", "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" }, textTransform: "none", fontWeight: 600, borderRadius: 2, minWidth: "auto", px: 1.5 }}>
                        Xem
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">Không tìm thấy đơn hàng nào.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination Block */}
        <Box sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "rgba(248, 250, 252, 0.5)" }}>
          <Typography sx={{ fontSize: 11, color: "#64748b" }}>
            Hiển thị <Box component="span" sx={{ fontWeight: 600, color: "#334155" }}>1-{filteredOrders.length}</Box> của <Box component="span" sx={{ fontWeight: 600, color: "#334155" }}>{ordersList.length}</Box> đơn hàng
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
