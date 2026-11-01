import { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { ChevronRight, ArrowUpRight, ArrowDownRight, Store, Users } from "lucide-react";
import AdminRevenueChart from "./components/AdminRevenueChart";
import { adminApi, resolveAssetUrl } from "../../services/api";
import AiLabelChip from "../../components/ai/AiLabelChip";
import { ORDER_STATUS_META } from "../../utils/orderStatus";
import { formatDateTime, formatVnd, handleImageError } from "../../utils/format";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingShops, setPendingShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    Promise.allSettled([
      adminApi.dashboard.getSummary(),
      adminApi.dashboard.getRecentOrders(5),
      adminApi.dashboard.getPendingProducts(5),
      adminApi.shop.getAll({ status: "PENDING_VERIFICATION", size: 5 })
    ]).then(([summaryRes, ordersRes, productsRes, shopsRes]) => {
      if (ignore) return;
      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setSummary(summaryRes.value);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value) {
        // Có thể là mảng hoặc PageResponse
        const list = Array.isArray(ordersRes.value) ? ordersRes.value : ordersRes.value.content || [];
        setRecentOrders(list);
      }
      if (productsRes.status === "fulfilled" && productsRes.value) {
        const list = Array.isArray(productsRes.value) ? productsRes.value : productsRes.value.content || [];
        setPendingProducts(list);
      }
      if (shopsRes.status === "fulfilled" && shopsRes.value) {
        const list = Array.isArray(shopsRes.value) ? shopsRes.value : shopsRes.value.content || [];
        setPendingShops(list);
      }
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const renderOrderStatusChip = (status) => {
    const meta = ORDER_STATUS_META[status] || {
      label: status,
      color: "default"
    };

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
          sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontSize: 11 }}
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
      {/* Page Title */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
          Tổng quan hệ thống
        </Typography>
        {loading && <CircularProgress size={20} />}
      </Box>

      {/* 4 Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Card 1: Doanh thu hôm nay */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 2, height: "100%" }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
              Doanh thu hôm nay
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mb: 0.5 }}>
              {formatVnd(summary?.todayRevenue ?? 0)}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {summary?.revenueChangePct != null ? (
                <>
                  {summary.revenueChangePct >= 0 ? (
                    <ArrowUpRight size={15} color="#10b981" />
                  ) : (
                    <ArrowDownRight size={15} color="#ef4444" />
                  )}
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: summary.revenueChangePct >= 0 ? "#10b981" : "#ef4444" }}
                  >
                    {summary.revenueChangePct >= 0 ? `+${summary.revenueChangePct}%` : `${summary.revenueChangePct}%`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    so với hôm qua
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Chưa có dữ liệu hôm qua
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Card 2: Đơn hàng mới */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            onClick={() => navigate("/admin/orders")}
            sx={{ p: 2.2, borderRadius: 2, height: "100%", cursor: "pointer", "&:hover": { borderColor: "#0f172a" } }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
              Đơn hàng hôm nay
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mb: 0.5 }}>
              {summary?.newOrdersToday ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary?.pendingOrders ?? 0} đơn đang chờ xác nhận
            </Typography>
          </Paper>
        </Grid>

        {/* Card 3: Sản phẩm chờ duyệt */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            onClick={() => navigate("/admin/products")}
            sx={{ p: 2.2, borderRadius: 2, height: "100%", cursor: "pointer", "&:hover": { borderColor: "#0f172a" } }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
              Sản phẩm chờ duyệt
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mb: 0.5 }}>
              {summary?.pendingProducts ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              cần quản trị viên kiểm duyệt
            </Typography>
          </Paper>
        </Grid>

        {/* Card 4: Kiểm định AI hàng chờ */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            variant="outlined"
            onClick={() => navigate("/admin/ai-review")}
            sx={{
              p: 2.2,
              borderRadius: 2,
              height: "100%",
              cursor: "pointer",
              "&:hover": { borderColor: "#ef4444" }
            }}
          >
            <Typography variant="body2" color="error.main" fontWeight={600} sx={{ mb: 1 }}>
              Kiểm định AI hàng chờ
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#ef4444", mb: 0.5 }}>
              {summary?.aiPendingReview ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary?.aiRottenFlags ? `${summary.aiRottenFlags} ảnh AI gắn nhãn HỎNG` : "Không có cờ cảnh báo hỏng"}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Grid: Left (Chart + Orders) & Right (Pending Products + Pending Shops) */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Revenue Chart */}
          <Box sx={{ mb: 3 }}>
            <AdminRevenueChart />
          </Box>

          {/* Latest Orders Table */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Đơn hàng mới nhất
              </Typography>
              <Link
                component={RouterLink}
                to="/admin/orders"
                underline="hover"
                sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 0.5 }}
              >
                Xem tất cả <ChevronRight size={14} />
              </Link>
            </Box>

            <Table size="small" sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 700, fontSize: 12.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Mã đơn</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Cửa hàng</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                      Chưa có đơn hàng nào trong hệ thống.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      hover
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>
                        {order.orderCode || `DH-${order.id}`}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {order.receiverName || order.customer?.fullName || "Khách mua"}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>
                        {order.shop?.shopName || order.shopName || "Gian hàng"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>
                        {formatVnd(order.totalAmount || order.total || 0)}
                      </TableCell>
                      <TableCell>{renderOrderStatusChip(order.status)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, color: "text.secondary" }}>
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Sàn tổng quan Cards */}
          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: "#334155" }}>
              Quy mô hệ thống
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Store size={22} color="#059669" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Shop hoạt động
                    </Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                      {summary?.totalShops ?? 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5, display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Users size={22} color="#0284c7" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Khách hàng
                    </Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                      {summary?.totalCustomers ?? 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Pending Products Widget */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Sản phẩm chờ duyệt
              </Typography>
              <Link
                component={RouterLink}
                to="/admin/products"
                underline="hover"
                sx={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}
              >
                Tất cả ({summary?.pendingProducts ?? pendingProducts.length})
              </Link>
            </Box>

            {pendingProducts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                Không có sản phẩm nào đang chờ duyệt.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {pendingProducts.map((p) => {
                  const imgUrl = resolveAssetUrl(p.primaryImageUrl || p.imageUrl);
                  return (
                    <Box
                      key={p.id}
                      onClick={() => navigate(`/admin/products/${p.id}`)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.2,
                        borderRadius: 1.5,
                        border: "1px solid #f1f5f9",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": { bgcolor: "#f8fafc", borderColor: "#cbd5e1" }
                      }}
                    >
                      <Box
                        component="img"
                        src={imgUrl}
                        alt={p.name}
                        onError={handleImageError}
                        sx={{ width: 44, height: 44, borderRadius: 1, objectFit: "cover", bgcolor: "#f1f5f9" }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          noWrap
                          sx={{ color: "#0f172a", fontSize: 13 }}
                        >
                          {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                          {p.shop?.shopName || p.shopName || "Gian hàng"} · {formatVnd(p.price)}
                        </Typography>
                      </Box>
                      <AiLabelChip label={p.aiOverallLabel} confidence={p.aiOverallConfidence} size="small" />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Pending Shops Widget */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Shop chờ xác minh
              </Typography>
              <Link
                component={RouterLink}
                to="/admin/shops"
                underline="hover"
                sx={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}
              >
                Xem shop ({summary?.pendingShops ?? pendingShops.length})
              </Link>
            </Box>

            {pendingShops.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, textAlign: "center" }}>
                Hiện không có shop nào chờ xác minh.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {pendingShops.map((shop) => (
                  <Box
                    key={shop.id}
                    onClick={() => navigate("/admin/shops")}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.2,
                      borderRadius: 1.5,
                      border: "1px solid #f1f5f9",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#f8fafc" }
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: 13 }}>
                        {shop.shopName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {shop.province || "Chưa rõ tỉnh thành"} · Chủ shop: {shop.owner?.fullName || "—"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 11, textTransform: "none", py: 0.2, px: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/admin/shops");
                      }}
                    >
                      Kiểm tra
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
