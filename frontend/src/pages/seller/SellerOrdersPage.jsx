import { Box, Typography, Paper, Tabs, Tab, TextField, InputAdornment, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton } from "@mui/material";
import { Search, Download, ClipboardList, CheckCircle, Package, Truck, XCircle, MoreVertical } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

export default function SellerOrdersPage() {
  const [tabValue, setTabValue] = useState(0); 

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const allOrders = [
    { id: "DH-2026-00003", customer: "Lê Văn Nam", phone: "0987 654 321", product: "Khoai tây Đà Lạt ×5", total: "160.000 ₫", payment: "COD", time: "13/09 16:45", status: "Chờ xác nhận" },
    { id: "DH-2026-00006", customer: "Phạm Thu Hà", phone: "0934 999 000", product: "Cà chua bi ×2, Ớt chuông ×1", total: "165.000 ₫", payment: "COD", time: "13/09 18:10", status: "Chờ xác nhận" },
    { id: "DH-2026-00007", customer: "Ngô Minh Tuấn", phone: "0912 456 456", product: "Dâu tây ×1", total: "200.000 ₫", payment: "Momo", time: "14/09 07:45", status: "Chờ xác nhận" },
    { id: "DH-2026-00008", customer: "Vũ Thị Hoa", phone: "0978 111 222", product: "Rau muống ×4, Cà rốt ×2", total: "112.000 ₫", payment: "COD", time: "14/09 08:20", status: "Chờ xác nhận" },
    { id: "DH-2026-00010", customer: "Nguyễn Thị Lan", phone: "0911 222 333", product: "Hành tây ×2", total: "60.000 ₫", payment: "VNPay", time: "12/09 09:15", status: "Đang chuẩn bị" },
    { id: "DH-2026-00011", customer: "Trần Văn B", phone: "0922 333 444", product: "Táo đỏ ×3", total: "150.000 ₫", payment: "COD", time: "12/09 10:20", status: "Đang chuẩn bị" },
    { id: "DH-2026-00012", customer: "Lê Thị C", phone: "0944 555 666", product: "Chuối sứ ×2", total: "40.000 ₫", payment: "COD", time: "11/09 14:00", status: "Đang giao" },
    { id: "DH-2026-00015", customer: "Hoàng Văn D", phone: "0966 777 888", product: "Bưởi da xanh ×1", total: "90.000 ₫", payment: "Momo", time: "10/09 16:30", status: "Hoàn thành" },
    { id: "DH-2026-00018", customer: "Phan Anh", phone: "0988 999 111", product: "Cam sành ×3", total: "120.000 ₫", payment: "COD", time: "09/09 08:00", status: "Đã huỷ" },
  ];

  const tabs = [
    { label: "Chờ xác nhận", filter: "Chờ xác nhận", icon: <ClipboardList size={16} /> },
    { label: "Đang chuẩn bị", filter: "Đang chuẩn bị", icon: <Package size={16} /> },
    { label: "Đang giao", filter: "Đang giao", icon: <Truck size={16} /> },
    { label: "Hoàn thành", filter: "Hoàn thành", icon: <CheckCircle size={16} /> },
    { label: "Đã huỷ", filter: "Đã huỷ", icon: <XCircle size={16} /> },
    { label: "Tất cả", filter: null, icon: <MoreVertical size={16} /> },
  ];

  const filteredOrders = useMemo(() => {
    const currentFilter = tabs[tabValue].filter;
    if (!currentFilter) return allOrders;
    return allOrders.filter(o => o.status === currentFilter);
  }, [tabValue, allOrders]);

  return (
    <Box sx={{ pb: 4, maxWidth: 1200, margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 1.5 }}>
          <ClipboardList size={28} color="#10b981" />
          Quản lý Đơn hàng
        </Typography>
        <Button 
          variant="outlined" 
          color="inherit" 
          startIcon={<Download size={18} />} 
          sx={{ borderRadius: "10px", px: 3, color: "#374151", borderColor: "#d1d5db" }}
        >
          Xuất báo cáo
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e5e7eb", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
        
        <Box sx={{ borderBottom: "1px solid #e5e7eb", bgcolor: "#f9fafb" }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ sx: { bgcolor: "#10b981", height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 } }}
          >
            {tabs.map((tab, idx) => {
              const count = tab.filter 
                ? allOrders.filter(o => o.status === tab.filter).length 
                : allOrders.length;
              return (
                <Tab 
                  key={idx}
                  disableRipple
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {tab.icon}
                      {`${tab.label} (${count})`}
                    </Box>
                  } 
                  sx={{ 
                    textTransform: "none", 
                    fontWeight: 600, 
                    color: tabValue === idx ? "#111827 !important" : "#6b7280",
                    fontSize: 14,
                    px: 3,
                    py: 2.5
                  }} 
                />
              );
            })}
          </Tabs>
        </Box>

        <Box sx={{ p: 3, display: "flex", gap: 2, alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
          <TextField
            placeholder="Tìm mã đơn, tên / SĐT khách..."
            size="small"
            sx={{ flex: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={18} color="#9ca3af" /></InputAdornment>,
            }}
          />
          <TextField select size="small" sx={{ width: 180 }} SelectProps={{ native: true }} defaultValue="7 ngày gần nhất">
            <option value="7 ngày gần nhất">7 ngày gần nhất</option>
            <option value="30 ngày gần nhất">30 ngày gần nhất</option>
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280", py: 2 }}>Mã đơn</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }} align="right">Tổng cộng</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Ngày đặt</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length > 0 ? filteredOrders.map((row) => (
                <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f9fafb" }, transition: "background 0.2s" }}>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6", fontWeight: 700, color: "#111827" }}>{row.id}</TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                    <Typography variant="body2" fontWeight={600} color="#111827">{row.customer}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.phone}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6", color: "#374151" }}>{row.product}</TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                    <Chip 
                      label={row.status} 
                      size="small" 
                      color={
                        row.status === "Hoàn thành" ? "success" : 
                        row.status === "Đang giao" ? "info" : 
                        row.status === "Chờ xác nhận" ? "warning" : 
                        row.status === "Đã huỷ" ? "error" : "default"
                      }
                      sx={{ fontWeight: 600, borderRadius: "6px" }} 
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6", fontWeight: 700, color: "#ef4444" }} align="right">
                    {row.total}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{row.payment}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{row.time}</TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }} align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      {row.status === "Chờ xác nhận" && (
                        <Button size="small" variant="contained" color="primary" sx={{ borderRadius: "8px", textTransform: "none", boxShadow: "none" }}>
                          Xác nhận
                        </Button>
                      )}
                      <Button size="small" variant="outlined" color="inherit" component={Link} to={`/seller/orders/${row.id}`} sx={{ borderRadius: "8px", textTransform: "none", color: "#374151", borderColor: "#d1d5db" }}>
                        Xem
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">Không có đơn hàng nào trong mục này.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
