import { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
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
import { ChevronRight } from "lucide-react";
import AdminRevenueChart from "./components/AdminRevenueChart";
import { adminApi, resolveAssetUrl } from "../../services/api";
import AiLabelChip from "../../components/ai/AiLabelChip";
import { handleImageError } from "../../utils/format";
import {
  ADMIN_STATS,
  ADMIN_ORDERS,
  NEW_REGISTERED_SELLERS
} from "../../data/adminMockData";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [aiStats, setAiStats] = useState(null);
  const [recentSellers, setRecentSellers] = useState([]);
  const [loadingReal, setLoadingReal] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.allSettled([
      adminApi.product.getAll({ status: "PENDING", size: 5 }),
      adminApi.ai.getStatistics(),
      adminApi.user.getAll({ role: "SELLER", size: 5 })
    ]).then(([prodRes, aiRes, userRes]) => {
      if (ignore) return;
      if (prodRes.status === "fulfilled" && prodRes.value) {
        setPendingProducts(prodRes.value.content || []);
        setPendingTotal(prodRes.value.totalElements || 0);
      }
      if (aiRes.status === "fulfilled" && aiRes.value) {
        setAiStats(aiRes.value);
      }
      if (userRes.status === "fulfilled" && userRes.value) {
        setRecentSellers(userRes.value.content || []);
      }
      setLoadingReal(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const getOrderStatusChip = (status) => {
    switch (status) {
      case "Hoàn thành":
        return <Chip size="small" label={status} sx={{ bgcolor: "#0f172a", color: "#fff", fontWeight: 600, fontSize: 11 }} />;
      case "Đang giao":
        return <Chip size="small" label={status} variant="outlined" sx={{ borderColor: "#64748b", color: "#1e293b", fontSize: 11 }} />;
      case "Đang chuẩn bị":
        return <Chip size="small" label={status} variant="outlined" sx={{ borderColor: "#64748b", color: "#1e293b", fontSize: 11 }} />;
      case "Chờ xác nhận":
        return <Chip size="small" label={status} variant="outlined" sx={{ borderStyle: "dashed", borderColor: "#64748b", color: "#475569", fontSize: 11 }} />;
      case "Đã huỷ":
        return <Chip size="small" label={status} sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontSize: 11 }} />;
      default:
        return <Chip size="small" label={status} variant="outlined" sx={{ fontSize: 11 }} />;
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Page Title */}
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2.5, color: "#0f172a" }}>
        Tổng quan
      </Typography>

      {/* 4 Stat Cards matching Wireframe 1 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Card 1: Doanh thu hôm nay */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 2, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Doanh thu hôm nay
              </Typography>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "1px solid #94a3b8",
                  fontSize: 11,
                  color: "text.secondary"
                }}
              >
                1
              </Box>
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mb: 0.5 }}>
              {ADMIN_STATS.revenueToday.toLocaleString("vi-VN")} đ
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {ADMIN_STATS.revenueDiffPercent}
            </Typography>
          </Paper>
        </Grid>

        {/* Card 2: Đơn hàng mới */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 2, height: "100%" }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
              Đơn hàng mới
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mb: 0.5 }}>
              {ADMIN_STATS.newOrders}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {ADMIN_STATS.pendingOrdersConfirmation} chờ xác nhận
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Sản phẩm chờ duyệt
              </Typography>
              <Chip size="small" label="API" color="success" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a", mb: 0.5 }}>
              {pendingTotal}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
              <Typography variant="body2" color="error.main" fontWeight={600}>
                Kiểm định AI hàng chờ
              </Typography>
              <Chip size="small" label="API" color="success" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#ef4444", mb: 0.5 }}>
              {aiStats?.pendingReview ?? ADMIN_STATS.aiWarningRottenImages}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {aiStats ? `${aiStats.autoAccepted || 0} ảnh đã tự chấp nhận` : ADMIN_STATS.requiresManualCheck}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Grid: Left (Chart + Orders) & Right (Pending Products + Sellers) */}
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
                  <TableCell>Người bán</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ADMIN_ORDERS.slice(0, 5).map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{order.id}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{order.customer}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{order.seller}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>
                      {order.total.toLocaleString("vi-VN")} đ
                    </TableCell>
                    <TableCell>{getOrderStatusChip(order.status)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 12, color: "text.secondary" }}>
                      {order.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Pending Products Widget */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Sản phẩm chờ duyệt
                </Typography>
                <Chip size="small" label="Dữ liệu thật" color="primary" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
              </Box>
              <Link
                component={RouterLink}
                to="/admin/products"
                underline="hover"
                sx={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}
              >
                Xem tất cả ({pendingTotal})
              </Link>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {pendingProducts.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  {loadingReal ? "Đang tải danh sách..." : "Không có sản phẩm nào đang chờ duyệt."}
                </Typography>
              ) : (
                pendingProducts.map((prod) => (
                  <Box
                    key={prod.id}
                    onClick={() => navigate(`/admin/products/${prod.id}`)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.2,
                      borderRadius: 1.5,
                      border: "1px solid #f1f5f9",
                      bgcolor: "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 1,
                          overflow: "hidden",
                          bgcolor: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={resolveAssetUrl(prod.primaryImageUrl) || "https://placehold.co/100x100?text=No+Image"}
                          alt={prod.name}
                          onError={handleImageError}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: "#0f172a", fontSize: 13 }}>
                          {prod.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prod.shop?.shopName || "N/A"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* AI Tag */}
                    <AiLabelChip label={prod.aiOverallLabel} confidence={prod.aiOverallConfidence} size="small" />
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          {/* New Registered Sellers Widget */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Người bán mới đăng ký
              </Typography>
              <Chip size="small" label={recentSellers.length > 0 ? "Dữ liệu thật" : "Minh hoạ"} color="default" sx={{ height: 20, fontSize: 10 }} />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {(recentSellers.length > 0 ? recentSellers : NEW_REGISTERED_SELLERS).map((seller) => (
                <Box
                  key={seller.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.2,
                    borderRadius: 1.5,
                    border: "1px solid #f1f5f9"
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: "#0f172a" }}>
                      {seller.shopName || seller.fullName || seller.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {seller.email || seller.location || "Người bán hệ thống"}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={seller.status === "ACTIVE" ? "Đã kích hoạt" : seller.status || "Chờ duyệt"}
                    color={seller.status === "ACTIVE" || seller.verified ? "success" : "default"}
                    variant="outlined"
                    sx={{ fontSize: 11, fontWeight: 600 }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>


    </Box>
  );
}
