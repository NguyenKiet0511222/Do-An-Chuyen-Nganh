import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Grid,
  InputAdornment,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { Search, FileSpreadsheet } from "lucide-react";
import WireframeNoteBox from "./components/WireframeNoteBox";
import { ADMIN_ORDERS } from "../../data/adminMockData";

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0); // 0 = Tất cả (1.204)
  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [toastMsg, setToastMsg] = useState("");

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case "Hoàn thành":
        return <Chip size="small" label={status} sx={{ bgcolor: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 11 }} />;
      case "Đang giao":
        return <Chip size="small" label={status} variant="outlined" sx={{ borderColor: "#64748b", color: "#1e293b", fontSize: 11 }} />;
      case "Đang chuẩn bị":
        return <Chip size="small" label={status} variant="outlined" sx={{ borderColor: "#64748b", color: "#1e293b", fontSize: 11 }} />;
      case "Chờ xác nhận":
        return <Chip size="small" label={status} variant="outlined" sx={{ borderStyle: "dashed", borderColor: "#64748b", color: "#475569", fontSize: 11 }} />;
      case "Đã huỷ":
        return <Chip size="small" label={status} sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontSize: 11 }} />;
      case "Hoàn tiền":
        return <Chip size="small" label={status} sx={{ bgcolor: "#fef3c7", color: "#92400e", fontSize: 11 }} />;
      default:
        return <Chip size="small" label={status} variant="outlined" sx={{ fontSize: 11 }} />;
    }
  };

  const filteredOrders = ADMIN_ORDERS.filter((order) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.seller.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (sellerFilter !== "all" && !order.seller.includes(sellerFilter)) return false;
    if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) return false;
    return true;
  });

  const wireframeNotes = [
    "1. Tìm kiếm: theo mã đơn, tên hoặc số điện thoại khách hàng.",
    "2. Khoảng ngày: bộ lọc mặc định 30 ngày gần nhất để bảng không quá dài.",
    "3. Cột người bán: vì mỗi đơn có thể chứa sản phẩm của nhiều người bán, đơn nhiều người bán hiển thị \"+n\".",
    "4. Trạng thái: Chờ xác nhận -> Đang chuẩn bị -> Đang giao -> Hoàn thành; Đã huỷ / Hoàn tiền là nhánh riêng. Hoàn thành hiển thị nền tối để dễ quét."
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator="/" sx={{ mb: 1, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Đơn hàng
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          Danh sách đơn hàng
        </Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2, color: "#0f172a" }}>
        Quản lý đơn hàng
      </Typography>

      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: 13.5,
              fontWeight: 600,
              minWidth: 90
            }
          }}
        >
          <Tab label="Tất cả (1.204)" />
          <Tab label="Chờ xác nhận (23)" />
          <Tab label="Đang chuẩn bị (41)" />
          <Tab label="Đang giao (58)" />
          <Tab label="Hoàn thành" />
          <Tab label="Đã huỷ" />
          <Tab label="Hoàn tiền (2)" />
        </Tabs>
      </Box>

      {/* Filter Bar matching wireframe */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm theo mã đơn, tên / SĐT khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94a3b8" />
                    </InputAdornment>
                  ),
                  sx: { fontSize: 13 }
                }
              }}
            />
          </Grid>

          {/* Seller Filter */}
          <Grid item xs={6} md={2}>
            <Select
              size="small"
              fullWidth
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="all">Người bán: Tất cả</MenuItem>
              <MenuItem value="Vườn rau Tâm An">Vườn rau Tâm An</MenuItem>
              <MenuItem value="HTX Xoài Cao Lãnh">HTX Xoài Cao Lãnh</MenuItem>
              <MenuItem value="Nông trại Ba Vì">Nông trại Ba Vì</MenuItem>
              <MenuItem value="Đặc sản Tây Bắc">Đặc sản Tây Bắc</MenuItem>
            </Select>
          </Grid>

          {/* Payment Filter */}
          <Grid item xs={6} md={2}>
            <Select
              size="small"
              fullWidth
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="all">Thanh toán: Tất cả</MenuItem>
              <MenuItem value="Chuyển khoản">Chuyển khoản</MenuItem>
              <MenuItem value="COD">COD</MenuItem>
              <MenuItem value="Ví điện tử">Ví điện tử</MenuItem>
            </Select>
          </Grid>

          {/* Date Range Display */}
          <Grid item xs={6} md={2.5}>
            <TextField
              size="small"
              fullWidth
              disabled
              value="01/09/2026 – 12/09/2026"
              slotProps={{
                input: {
                  sx: { fontSize: 12.5, bgcolor: "#f8fafc" }
                }
              }}
            />
          </Grid>

          {/* Export Excel Button */}
          <Grid item xs={6} md={1.5}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<FileSpreadsheet size={16} />}
              onClick={() => setToastMsg("Đang xuất danh sách đơn hàng sang file Excel...")}
              sx={{ textTransform: "none", fontSize: 13, borderColor: "#cbd5e1", color: "#334155" }}
            >
              Xuất Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <Table sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 700, fontSize: 12.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Người bán</TableCell>
              <TableCell align="center">Số SP</TableCell>
              <TableCell align="right">Tổng tiền</TableCell>
              <TableCell>Thanh toán</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Ngày đặt</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow
                key={order.id}
                hover
                sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}
              >
                <TableCell
                  sx={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  {order.id}
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>{order.customer}</TableCell>
                <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{order.seller}</TableCell>
                <TableCell align="center" sx={{ fontSize: 13 }}>{order.itemCount}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>
                  {order.total.toLocaleString("vi-VN")} đ
                </TableCell>
                <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{order.paymentMethod}</TableCell>
                <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                <TableCell align="right" sx={{ fontSize: 12, color: "text.secondary" }}>
                  {order.date}
                </TableCell>
                <TableCell align="center">
                  <Link
                    component={RouterLink}
                    to={`/admin/orders/${order.id}`}
                    underline="hover"
                    sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}
                  >
                    Xem
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Pagination Footer */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
          Hiển thị 1–8 / 1.204
        </Typography>
        <Pagination count={151} page={1} shape="rounded" size="small" />
      </Box>



      {/* Toast */}
      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={3000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
