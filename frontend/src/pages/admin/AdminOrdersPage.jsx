import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { Search, RotateCcw } from "lucide-react";
import { adminApi } from "../../services/api";
import { ORDER_STATUS_META } from "../../utils/orderStatus";
import { formatDateTime, formatVnd } from "../../utils/format";

const STATUS_TABS = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xác nhận", value: "PENDING" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang chuẩn bị", value: "PROCESSING" },
  { label: "Đang giao", value: "SHIPPING" },
  { label: "Hoàn thành", value: "DELIVERED" },
  { label: "Đã huỷ", value: "CANCELLED" }
];

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const dateError = fromDate && toDate && fromDate > toDate ? "Từ ngày phải trước hoặc bằng Đến ngày." : null;

  const fetchOrders = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate) {
      return;
    }
    setLoading(true);
    try {
      const activeStatus = STATUS_TABS[tabIndex]?.value || undefined;
      const params = {
        page,
        size: 12,
        status: activeStatus,
        keyword: search.trim() || undefined,
        paymentMethod: paymentFilter !== "all" ? paymentFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined
      };

      const res = await adminApi.order.getAll(params);
      if (res) {
        setOrders(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      }
    } catch (err) {
      console.warn("Lỗi khi tải danh sách đơn hàng:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [tabIndex, page, search, paymentFilter, fromDate, toDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearch("");
    setPaymentFilter("all");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  const renderOrderStatusBadge = (status) => {
    const meta = ORDER_STATUS_META[status] || { label: status, color: "default" };

    if (status === "DELIVERED") {
      return (
        <Chip
          size="small"
          label={meta.label}
          sx={{ bgcolor: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 11 }}
        />
      );
    }
    if (status === "CANCELLED") {
      return (
        <Chip
          size="small"
          label={meta.label}
          sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 600 }}
        />
      );
    }
    if (status === "PENDING") {
      return (
        <Chip
          size="small"
          label={meta.label}
          variant="outlined"
          sx={{ borderStyle: "dashed", borderColor: "#f59e0b", color: "#b45309", fontSize: 11, fontWeight: 600 }}
        />
      );
    }

    return (
      <Chip
        size="small"
        label={meta.label}
        variant="outlined"
        color={meta.color === "default" ? "primary" : meta.color}
        sx={{ fontSize: 11, fontWeight: 500 }}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator="/" sx={{ mb: 1, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Tổng quan
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          Quản lý đơn hàng
        </Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
            Quản lý đơn hàng toàn sàn
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng cộng: {totalElements} đơn hàng
          </Typography>
        </Box>
        {loading && <CircularProgress size={20} />}
      </Box>

      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2.5 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: 13.5,
              fontWeight: 600,
              minWidth: 100
            }
          }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab key={tab.label} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* Filters Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Keyword Search */}
          <Grid item xs={12} sm={6} md={3.5}>
            <TextField
              size="small"
              fullWidth
              placeholder="Mã đơn, tên khách, SĐT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#64748b" />
                  </InputAdornment>
                )
              }}
              sx={{ "& input": { fontSize: 13 } }}
            />
          </Grid>

          {/* Payment Method */}
          <Grid item xs={12} sm={6} md={2.5}>
            <Select
              size="small"
              fullWidth
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(0);
              }}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="all">Phương thức: Tất cả</MenuItem>
              <MenuItem value="COD">COD (Tiền mặt)</MenuItem>
            </Select>
          </Grid>

          {/* From Date */}
          <Grid item xs={12} sm={5} md={2.5}>
            <TextField
              type="date"
              size="small"
              fullWidth
              label="Từ ngày"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                  sx: { fontSize: 13, bgcolor: "#fff", px: 0.5, color: "#475569" }
                },
                htmlInput: {
                  max: toDate || undefined,
                  style: { fontSize: 13, padding: "8.5px 10px" }
                }
              }}
              sx={{
                minWidth: 155,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 1.5
                },
                "& input::-webkit-calendar-picker-indicator": {
                  cursor: "pointer",
                  padding: "2px",
                  opacity: 0.75,
                  "&:hover": { opacity: 1 }
                }
              }}
            />
          </Grid>

          {/* To Date */}
          <Grid item xs={12} sm={5} md={2.5}>
            <TextField
              type="date"
              size="small"
              fullWidth
              label="Đến ngày"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                  sx: { fontSize: 13, bgcolor: "#fff", px: 0.5, color: "#475569" }
                },
                htmlInput: {
                  min: fromDate || undefined,
                  style: { fontSize: 13, padding: "8.5px 10px" }
                }
              }}
              sx={{
                minWidth: 155,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#fff",
                  borderRadius: 1.5
                },
                "& input::-webkit-calendar-picker-indicator": {
                  cursor: "pointer",
                  padding: "2px",
                  opacity: 0.75,
                  "&:hover": { opacity: 1 }
                }
              }}
            />
          </Grid>

          {/* Reset Filters */}
          <Grid item xs={12} sm={2} md={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleResetFilters}
              title="Đặt lại toàn bộ bộ lọc"
              sx={{
                height: 40,
                width: "100%",
                minWidth: 40,
                borderColor: "#cbd5e1",
                color: "#475569",
                textTransform: "none",
                fontSize: 12.5,
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                "&:hover": { bgcolor: "#f1f5f9", borderColor: "#94a3b8" }
              }}
            >
              <RotateCcw size={15} />
              <Box component="span" sx={{ display: { xs: "inline", md: "none", lg: "inline" } }}>
                Đặt lại
              </Box>
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {dateError && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          {dateError}
        </Alert>
      )}

      {/* Orders Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", minWidth: 110 }}>Mã đơn</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, minWidth: 160 }}>Khách hàng / Nhận hàng</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, minWidth: 130 }}>Cửa hàng</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }} align="center">SL mặt hàng</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", minWidth: 120 }} align="right">Tổng thanh toán</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>Thanh toán</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", minWidth: 120 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", minWidth: 140 }} align="right">Ngày đặt</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    {loading ? "Đang tải danh sách đơn hàng..." : "Không tìm thấy đơn hàng nào phù hợp với bộ lọc."}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ fontWeight: 700, fontSize: 13, color: "#0284c7", whiteSpace: "nowrap" }}>
                      {order.orderCode || `DH-${order.id}`}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                        {order.receiverName || order.customer?.fullName || "Khách mua"}
                      </Typography>
                      {order.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {order.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: "#334155" }}>
                      {order.shop?.shopName || order.shopName || "Gian hàng"}
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: 13, whiteSpace: "nowrap" }}>
                      {order.itemCount || (order.items ? order.items.length : 1)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
                      {formatVnd(order.totalAmount || order.total || 0)}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, whiteSpace: "nowrap" }}>
                      {order.paymentMethod === "COD" ? "Tiền mặt (COD)" : order.paymentMethod}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {renderOrderStatusBadge(order.status)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 12, color: "text.secondary", whiteSpace: "nowrap" }}>
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(e, p) => setPage(p - 1)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
