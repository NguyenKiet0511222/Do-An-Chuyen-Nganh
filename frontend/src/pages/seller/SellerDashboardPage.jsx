import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Link,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { Camera, ClipboardList, Hourglass, ScanSearch, Wallet, Wrench } from "lucide-react";
import StatCardGrid from "../../components/StatCardGrid";
import { sellerApi } from "../../services/api";
import { PRODUCT_STATUS_META } from "../../utils/aiLabel";
import { formatDateTime, formatVnd } from "../../utils/format";
import { SELLER_DATA_CHANGED_EVENT } from "../../utils/sellerEvents";
import DashboardOrderStatusCard from "./components/DashboardOrderStatusCard";
import OrderStatusActions from "./components/OrderStatusActions";
import ShopLoadError from "./components/ShopLoadError";
import ShopStatusChip from "./components/ShopStatusChip";
import { fetchOrderStatusCounts } from "./components/orderStatusCounts";

const cardSx = { p: 3, borderRadius: "16px", border: "1px solid #E5E7EB", bgcolor: "#fff" };
const headCellSx = { fontWeight: 600, color: "#6B7280", fontSize: 12, borderBottom: "1px solid #E5E7EB", py: 1.5 };
const bodyCellSx = { borderBottom: "1px solid #F3F4F6", fontSize: 14 };

// Dòng phụ dưới chip trạng thái shop
const SHOP_STATUS_HINT = {
  PENDING_VERIFICATION: "Quản trị viên đang xác minh hồ sơ shop.",
  LOCKED: "Shop đang bị quản trị viên khoá — liên hệ quản trị viên để được mở lại."
};

const itemsText = (items) => (items || []).map((it) => `${it.productName} ×${it.quantity}`).join(", ") || "—";

/**
 * Tổng quan người bán (docs/2110.md L1-6): chỉ số liệu thật từ API — summary, trạng thái shop, sản phẩm cần sửa,
 * đơn theo trạng thái, đơn chờ xác nhận. Tải lại khi có notifySellerDataChanged() (xác nhận đơn, gửi duyệt, xoá...).
 */
export default function SellerDashboardPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState({ key: -1, data: null, error: null });
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  // Số liệu đổi ở nơi khác (nút Xác nhận bên dưới, trang sản phẩm...) -> tải lại cả trang
  useEffect(() => {
    const reload = () => setReloadKey((key) => key + 1);
    window.addEventListener(SELLER_DATA_CHANGED_EVENT, reload);
    return () => window.removeEventListener(SELLER_DATA_CHANGED_EVENT, reload);
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      sellerApi.dashboard.getSummary(),
      sellerApi.getShop(),
      sellerApi.product.getAll({ status: "REJECTED,NEED_INFO", page: 0, size: 3 }),
      sellerApi.order.getAll({ status: "PENDING", page: 0, size: 5 }),
      fetchOrderStatusCounts()
    ])
      .then(([summary, shop, needFix, pendingOrders, orderCounts]) => {
        if (!ignore) setLoaded({ key: reloadKey, data: { summary, shop, needFix, pendingOrders, orderCounts }, error: null });
      })
      .catch((err) => {
        // Lần tải lại lỗi thì giữ số liệu cũ, hiện Alert phía trên
        if (!ignore) setLoaded((prev) => ({ key: reloadKey, data: prev.data, error: err }));
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const loading = loaded.key !== reloadKey;
  const retry = () => setReloadKey((key) => key + 1);

  const header = (
    <Box>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827", mb: 1, letterSpacing: "-0.02em" }}>Tổng quan shop</Typography>
      <Typography sx={{ fontSize: 14, color: "#6B7280" }}>
        Doanh thu, đơn hàng, sản phẩm và kết quả kiểm định AI của shop
      </Typography>
    </Box>
  );

  if (!loaded.data) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {header}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ShopLoadError error={loaded.error} fallback="Không tải được số liệu tổng quan của shop." onRetry={retry} />
        )}
      </Box>
    );
  }

  const { summary, shop, needFix, pendingOrders, orderCounts } = loaded.data;
  const byStatus = summary?.productsByStatus || {};
  const needFixCount = (byStatus.REJECTED || 0) + (byStatus.NEED_INFO || 0);
  const aiFlags = summary?.aiFlags || {};
  const needFixItems = needFix?.content || [];
  const pendingRows = pendingOrders?.content || [];

  const stats = [
    { label: "Doanh thu hôm nay (đơn đã giao)", value: formatVnd(summary?.todayRevenue ?? 0), icon: Wallet, color: "primary.main" },
    { label: "Đơn chờ xác nhận", value: summary?.pendingOrders ?? 0, icon: ClipboardList, color: "warning.main" },
    { label: "Sản phẩm chờ duyệt", value: byStatus.PENDING ?? 0, icon: Hourglass, color: "info.main" },
    { label: "Sản phẩm cần sửa", value: needFixCount, icon: Wrench, color: needFixCount > 0 ? "error.main" : "success.main" }
  ];

  const aiRows = [
    { label: "Chờ admin kiểm định", value: aiFlags.pendingReview ?? 0, color: "#b45309" },
    { label: "Admin yêu cầu chụp lại", value: aiFlags.retakeRequested ?? 0, color: "#c2410c", highlight: true },
    { label: "Nhãn HỎNG", value: aiFlags.rotten ?? 0, color: "#dc2626" }
  ];

  const showToast = (severity, message) => setToast({ open: true, severity, message });
  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleOrderError = (message, err) => {
    showToast("error", message);
    if (err?.response?.status === 409) retry();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: "100%" }}>
      {header}
      {loading && <LinearProgress sx={{ borderRadius: "4px", mt: -1.5 }} />}
      {loaded.error && (
        <ShopLoadError error={loaded.error} fallback="Không tải lại được số liệu, đang hiện số liệu cũ." onRetry={retry} />
      )}

      {/* Trạng thái shop */}
      <Paper elevation={0} sx={{ ...cardSx, py: 2, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <ShopStatusChip status={shop?.status} />
        <Typography sx={{ fontSize: 14, color: "#6B7280", flex: 1, minWidth: 220 }}>
          <Box component="span" sx={{ color: "#111827", fontWeight: 600 }}>{shop?.shopName}</Box>
          {shop?.status === "ACTIVE" && shop?.verifiedAt && (
            <>
              {" "}· Xác minh ngày{" "}
              <Box component="span" sx={{ color: "#111827", fontWeight: 600 }}>
                {new Date(shop.verifiedAt).toLocaleDateString("vi-VN")}
              </Box>
            </>
          )}
          {SHOP_STATUS_HINT[shop?.status] && ` · ${SHOP_STATUS_HINT[shop.status]}`}
        </Typography>
        <Link component={RouterLink} to="/seller/info" underline="hover" sx={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
          Sửa thông tin shop
        </Link>
      </Paper>

      <StatCardGrid stats={stats} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(12, 1fr)" }, gap: 3, alignItems: "stretch" }}>
        <DashboardOrderStatusCard counts={orderCounts} sx={{ gridColumn: { xs: "span 1", lg: "span 7" } }} />

        <Paper elevation={0} sx={{ ...cardSx, p: 0, gridColumn: { xs: "span 1", lg: "span 5" }, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* Sản phẩm cần sửa (REJECTED + NEED_INFO) */}
          <Box sx={{ p: 3, borderBottom: "1px solid #E5E7EB" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
                Sản phẩm cần sửa {needFixCount > 0 && <Box component="span" sx={{ color: "#DC2626" }}>({needFixCount})</Box>}
              </Typography>
              <Link component={RouterLink} to="/seller/products?status=REJECTED,NEED_INFO" underline="hover" sx={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
                Xem
              </Link>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {needFixItems.length > 0 ? (
                needFixItems.map((prod) => {
                  const meta = PRODUCT_STATUS_META[prod.status] || { label: prod.status, color: "default" };
                  return (
                    <Box
                      key={prod.id}
                      component={RouterLink}
                      to={`/seller/products/${prod.id}/edit`}
                      sx={{ display: "block", p: 1.5, bgcolor: "#FEF2F2", borderRadius: "10px", border: "1px solid #FEE2E2", textDecoration: "none", transition: "background 0.2s", "&:hover": { bgcolor: "#FEE2E2" } }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{prod.name}</Typography>
                        <Chip size="small" label={meta.label} color={meta.color} sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                      </Box>
                      <Typography sx={{ fontSize: 13, color: prod.rejectReason ? "#991B1B" : "#6B7280" }}>
                        {prod.rejectReason || "Quản trị viên chưa ghi lý do — mở sản phẩm để xem chi tiết."}
                      </Typography>
                    </Box>
                  );
                })
              ) : (
                <Typography sx={{ fontSize: 13, color: "#059669", py: 1 }}>Không có sản phẩm nào cần sửa.</Typography>
              )}
            </Box>
          </Box>

          {/* Ảnh sản phẩm cần chú ý theo kiểm định AI (summary.aiFlags) */}
          <Box sx={{ p: 3, flex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 1 }}>
                <ScanSearch size={18} color="#059669" /> Ảnh cần chú ý (AI)
              </Typography>
              <Link component={RouterLink} to="/seller/info?tab=ai" underline="hover" sx={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
                Kết quả AI
              </Link>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {aiRows.map((row) => (
                <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <Typography sx={{ fontSize: 13, color: "#4B5563" }}>{row.label}</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: row.value > 0 ? row.color : "#111827" }}>{row.value}</Typography>
                </Box>
              ))}
            </Box>
            {(aiFlags.retakeRequested ?? 0) > 0 && (
              <Alert
                severity="warning"
                icon={<Camera size={18} />}
                sx={{ mt: 2, borderRadius: "12px", fontSize: 13 }}
                action={
                  <Link
                    component={RouterLink}
                    to="/seller/info?tab=ai&reviewStatus=RETAKE_REQUESTED"
                    underline="hover"
                    sx={{ fontSize: 13, fontWeight: 700, color: "#9a3412", whiteSpace: "nowrap", alignSelf: "center" }}
                  >
                    Xem ảnh
                  </Link>
                }
              >
                Có ảnh admin yêu cầu chụp lại — thay ảnh rồi gửi duyệt lại.
              </Alert>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Đơn chờ xác nhận (5 đơn mới nhất) */}
      <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: "hidden" }}>
        <Box sx={{ p: 3, borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Đơn chờ xác nhận</Typography>
            <Chip size="small" label={`${summary?.pendingOrders ?? 0} đơn`} sx={{ fontWeight: 700, color: "#059669", bgcolor: "#ECFDF5" }} />
          </Box>
          <Link component={RouterLink} to="/seller/orders?status=PENDING" underline="hover" sx={{ fontSize: 14, fontWeight: 600, color: "#059669" }}>
            Xem tất cả
          </Link>
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell sx={{ ...headCellSx, pl: 3 }}>Mã đơn</TableCell>
                <TableCell sx={headCellSx}>Người nhận</TableCell>
                <TableCell sx={headCellSx}>Sản phẩm</TableCell>
                <TableCell sx={headCellSx}>Tổng tiền</TableCell>
                <TableCell sx={headCellSx}>Đặt lúc</TableCell>
                <TableCell sx={{ ...headCellSx, pr: 3 }} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ ...bodyCellSx, py: 5, textAlign: "center", color: "#6B7280" }}>
                    Không có đơn nào chờ xác nhận.
                  </TableCell>
                </TableRow>
              ) : (
                pendingRows.map((order) => (
                  <TableRow key={order.id} sx={{ "&:hover": { bgcolor: "#F9FAFB" } }}>
                    <TableCell sx={{ ...bodyCellSx, pl: 3, fontWeight: 600 }}>
                      <Link component={RouterLink} to={`/seller/orders/${order.id}`} underline="hover" sx={{ color: "#111827", fontWeight: 700 }}>
                        {order.orderCode}
                      </Link>
                    </TableCell>
                    <TableCell sx={bodyCellSx}>
                      <Typography sx={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>{order.receiverName}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#6B7280" }}>{order.phone}</Typography>
                    </TableCell>
                    <TableCell sx={{ ...bodyCellSx, color: "#4B5563", maxWidth: 280 }}>{itemsText(order.items)}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{formatVnd(order.total)}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, color: "#6B7280", whiteSpace: "nowrap" }}>{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, pr: 3 }} align="right">
                      {/* Thành công -> notifySellerDataChanged() -> listener ở trên tải lại trang, dòng tự mất */}
                      <OrderStatusActions
                        order={order}
                        compact
                        onChanged={(_updated, message) => showToast("success", message)}
                        onError={handleOrderError}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: "12px" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
