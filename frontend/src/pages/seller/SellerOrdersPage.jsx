import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Pagination,
  Paper,
  Snackbar,
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
import { ClipboardList, FilterX, Package, Truck, Wallet } from "lucide-react";
import StatCardGrid from "../../components/StatCardGrid";
import { sellerApi } from "../../services/api";
import { ORDER_STATUS_META, ORDER_STATUS_ORDER, PAYMENT_STATUS_META } from "../../utils/orderStatus";
import { formatDateTime, formatVnd } from "../../utils/format";
import OrderStatusActions from "./components/OrderStatusActions";
import ShopLoadError from "./components/ShopLoadError";
import { fetchOrderStatusCounts } from "./components/orderStatusCounts";

const PAGE_SIZE = 10;
const ALL = "ALL";
// Tab theo enum OrderStatus (có riêng "Đã xác nhận" — gộp vào "Chờ xác nhận" thì bấm xác nhận lần 2 sẽ 409) + "Tất cả"
const TABS = [...ORDER_STATUS_ORDER, ALL];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const headCellSx = {
  fontWeight: 700,
  color: "#64748b",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  borderBottom: "1px solid #f1f5f9"
};
const bodyCellSx = { borderBottom: "1px solid #f1f5f9" };

const itemsText = (items) => (items || []).map((it) => `${it.productName} ×${it.quantity}`).join(", ") || "—";

/**
 * Đơn hàng của shop (docs/2110.md L1-5): tab theo trạng thái, phân trang server (GET /seller/orders?status&from&to&page&size).
 * Backend không có tìm theo từ khoá cho đơn người bán -> lọc theo ngày đặt (from/to, docs/2110.md Q3).
 * Tab / ngày / trang nằm trên URL (?status=PENDING&from=…&to=…&page=2) để quay lại từ trang chi tiết vẫn giữ.
 */
export default function SellerOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = (searchParams.get("status") || "").toUpperCase();
  const status = TABS.includes(statusParam) ? statusParam : "PENDING";
  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || "";
  const from = DATE_RE.test(fromParam) ? fromParam : "";
  const to = DATE_RE.test(toParam) ? toParam : "";
  const page = Math.max(0, (parseInt(searchParams.get("page"), 10) || 1) - 1);
  const dateError = from && to && from > to ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc." : null;

  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState({ request: null, data: null, error: null });
  const [counts, setCounts] = useState(null);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  // Mỗi lần đổi tab / ngày / trang / bấm thử lại tạo 1 request mới; loading = request đang hiển thị chưa phải request mới nhất
  const request = useMemo(
    () => (dateError ? null : { status, from, to, page, reloadKey }),
    [status, from, to, page, reloadKey, dateError]
  );
  // Số đếm từng tab chỉ phụ thuộc khoảng ngày (+ tải lại sau khi đổi trạng thái), không tải lại khi đổi tab / trang
  const countsRequest = useMemo(() => (dateError ? null : { from, to, reloadKey }), [from, to, reloadKey, dateError]);

  useEffect(() => {
    if (!request) return undefined;
    let ignore = false;
    sellerApi.order
      .getAll({
        from: request.from || undefined,
        to: request.to || undefined,
        status: request.status === ALL ? undefined : request.status,
        page: request.page,
        size: PAGE_SIZE
      })
      .then((data) => {
        if (!ignore) setLoaded({ request, data, error: null });
      })
      .catch((err) => {
        if (!ignore) setLoaded({ request, data: null, error: err });
      });
    return () => {
      ignore = true;
    };
  }, [request]);

  useEffect(() => {
    if (!countsRequest) return undefined;
    let ignore = false;
    fetchOrderStatusCounts({ from: countsRequest.from || undefined, to: countsRequest.to || undefined })
      .then((result) => {
        if (!ignore) setCounts(result);
      })
      .catch(() => {
        if (!ignore) setCounts(null); // lỗi -> tab không hiện số (lỗi danh sách đã báo riêng)
      });
    return () => {
      ignore = true;
    };
  }, [countsRequest]);

  const loading = request !== null && loaded.request !== request;
  const rows = dateError ? [] : loaded.data?.content ?? [];
  const totalElements = loaded.data?.totalElements ?? 0;
  const totalPages = loaded.data?.totalPages ?? 0;
  const hasDateFilter = Boolean(from || to);

  const updateParams = (patch) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") next.delete(key);
          else next.set(key, String(value));
        });
        return next;
      },
      { replace: true }
    );
  };

  const reload = () => setReloadKey((key) => key + 1);
  const showToast = (severity, message) => setToast({ open: true, severity, message });
  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  // Chờ API xong mới tải lại danh sách + số đếm (không cập nhật lạc quan)
  const handleChanged = (_updated, message) => {
    showToast("success", message);
    reload();
  };
  const handleError = (message, err) => {
    showToast("error", message);
    if (err?.response?.status === 409) reload();
  };

  const stats = [
    { label: "Chờ xác nhận", value: counts?.PENDING ?? "—", icon: ClipboardList, color: "warning.main" },
    {
      label: "Cần chuẩn bị (đã xác nhận + đang chuẩn bị)",
      value: counts ? counts.CONFIRMED + counts.PROCESSING : "—",
      icon: Package,
      color: "info.main"
    },
    { label: "Đang giao", value: counts?.SHIPPING ?? "—", icon: Truck, color: "secondary.main" },
    { label: "Tổng số đơn", value: counts?.ALL ?? "—", icon: Wallet, color: "primary.main" }
  ];

  const emptyText = (() => {
    const scope = status === ALL ? "Chưa có đơn hàng nào" : `Không có đơn nào ở trạng thái “${ORDER_STATUS_META[status].label}”`;
    return hasDateFilter ? `${scope} trong khoảng ngày đã chọn.` : `${scope}.`;
  })();

  return (
    <Box sx={{ pb: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Đơn hàng của shop
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
          Tiếp nhận đơn mới và chuyển trạng thái theo từng bước: xác nhận → chuẩn bị → giao vận chuyển → đã giao
        </Typography>
      </Box>

      {loaded.error && !loaded.data && !loading ? (
        <ShopLoadError error={loaded.error} fallback="Không tải được danh sách đơn hàng." onRetry={reload} />
      ) : (
        <>
          <Box>
            <StatCardGrid stats={stats} />
            {hasDateFilter && (
              <Typography sx={{ fontSize: 12, color: "#64748b", mt: 1 }}>Số liệu tính theo khoảng ngày đặt đã chọn.</Typography>
            )}
          </Box>

          <Paper elevation={0} sx={{ borderRadius: "16px", border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            {/* Tabs theo trạng thái */}
            <Box sx={{ borderBottom: "1px solid #f1f5f9", px: 1 }}>
              <Tabs
                value={status}
                onChange={(_event, value) => updateParams({ status: value, page: null })}
                variant="scrollable"
                scrollButtons="auto"
                slotProps={{ indicator: { sx: { bgcolor: "#059669", height: 2 } } }}
              >
                {TABS.map((tab) => {
                  const active = tab === status;
                  const count = counts?.[tab];
                  const highlight = tab === "PENDING" && count > 0;
                  return (
                    <Tab
                      key={tab}
                      value={tab}
                      disableRipple
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {tab === ALL ? "Tất cả" : ORDER_STATUS_META[tab].label}
                          {count !== undefined && (
                            <Box
                              component="span"
                              sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: "10px",
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: highlight ? "#d1fae5" : "#f1f5f9",
                                color: highlight ? "#065f46" : "#475569"
                              }}
                            >
                              {count}
                            </Box>
                          )}
                        </Box>
                      }
                      sx={{
                        textTransform: "none",
                        fontWeight: active ? 700 : 500,
                        color: active ? "#047857 !important" : "#64748b",
                        fontSize: 13,
                        px: 2.5,
                        py: 2.5,
                        minHeight: "auto"
                      }}
                    />
                  );
                })}
              </Tabs>
            </Box>

            {/* Lọc theo ngày đặt */}
            <Box sx={{ p: 2.5, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
              <TextField
                type="date"
                size="small"
                label="Từ ngày"
                value={from}
                onChange={(e) => updateParams({ from: e.target.value, page: null })}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: to || undefined } }}
                sx={{ width: 180, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
              <TextField
                type="date"
                size="small"
                label="Đến ngày"
                value={to}
                onChange={(e) => updateParams({ to: e.target.value, page: null })}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: from || undefined } }}
                sx={{ width: 180, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
              {hasDateFilter && (
                <Button
                  size="small"
                  startIcon={<FilterX size={16} />}
                  onClick={() => updateParams({ from: null, to: null, page: null })}
                  sx={{ color: "#64748b", fontWeight: 600 }}
                >
                  Xoá lọc ngày
                </Button>
              )}
              <Typography sx={{ fontSize: 12, color: "#94a3b8", ml: { md: "auto" } }}>Lọc theo ngày khách đặt hàng</Typography>
            </Box>

            {dateError && (
              <Alert severity="warning" sx={{ mx: 2.5, mb: 2, borderRadius: "12px" }}>
                {dateError}
              </Alert>
            )}

            {/* Bảng đơn */}
            <TableContainer sx={{ opacity: loading && loaded.data ? 0.6 : 1, transition: "opacity 0.2s" }}>
              <Table sx={{ minWidth: 960 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(248, 250, 252, 0.75)", borderTop: "1px solid #f1f5f9" }}>
                    <TableCell sx={{ ...headCellSx, py: 1.5, pl: 3 }}>Mã đơn</TableCell>
                    <TableCell sx={headCellSx}>Người nhận</TableCell>
                    <TableCell sx={headCellSx}>Sản phẩm</TableCell>
                    <TableCell sx={headCellSx}>Tổng</TableCell>
                    <TableCell sx={headCellSx}>Thanh toán</TableCell>
                    <TableCell sx={headCellSx}>Trạng thái</TableCell>
                    <TableCell sx={headCellSx}>Đặt lúc</TableCell>
                    <TableCell sx={{ ...headCellSx, pr: 3 }} align="right">
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ ...bodyCellSx, py: 8, color: "#64748b", fontSize: 13 }}>
                        {loading ? (
                          "Đang tải đơn hàng..."
                        ) : dateError ? (
                          "Chọn lại khoảng ngày để xem đơn."
                        ) : page > 0 && totalPages > 0 ? (
                          // Trang này hết đơn (vừa chuyển trạng thái / đổi bộ lọc) -> mời về trang cuối còn dữ liệu
                          <>
                            Trang {page + 1} không còn đơn nào.{" "}
                            <Button size="small" onClick={() => updateParams({ page: totalPages > 1 ? totalPages : null })} sx={{ fontWeight: 700 }}>
                              Về trang {totalPages}
                            </Button>
                          </>
                        ) : (
                          emptyText
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((order) => {
                    const statusMeta = ORDER_STATUS_META[order.status] || { label: order.status, color: "default" };
                    const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus];
                    return (
                      <TableRow key={order.id} sx={{ transition: "background 0.2s", "&:hover": { bgcolor: "rgba(248, 250, 252, 0.8)" } }}>
                        <TableCell sx={{ ...bodyCellSx, py: 2, pl: 3 }}>
                          <Link
                            component={RouterLink}
                            to={`/seller/orders/${order.id}`}
                            underline="hover"
                            sx={{ fontWeight: 700, color: "#0f172a", fontSize: 13, "&:hover": { color: "#047857" } }}
                          >
                            {order.orderCode}
                          </Link>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Typography sx={{ fontWeight: 600, color: "#0f172a", fontSize: 13 }}>{order.receiverName}</Typography>
                          <Typography sx={{ color: "#94a3b8", fontSize: 11, mt: 0.25 }}>{order.phone}</Typography>
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, maxWidth: 260 }}>
                          <Typography sx={{ color: "#1e293b", fontSize: 13, fontWeight: 500 }}>{itemsText(order.items)}</Typography>
                          <Typography sx={{ color: "#94a3b8", fontSize: 11, mt: 0.25 }}>{order.itemCount} sản phẩm</Typography>
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, whiteSpace: "nowrap" }}>
                          <Typography sx={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>{formatVnd(order.total)}</Typography>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#334155", mb: 0.5 }}>{order.paymentMethod}</Typography>
                          {paymentMeta && (
                            <Chip size="small" variant="outlined" color={paymentMeta.color} label={paymentMeta.label} sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                          )}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Chip size="small" color={statusMeta.color} label={statusMeta.label} sx={{ height: 24, fontSize: 11, fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{formatDateTime(order.createdAt)}</TableCell>
                        <TableCell sx={{ ...bodyCellSx, pr: 3 }} align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
                            {/* Mỗi dòng chỉ có bước tiếp theo; huỷ đơn làm ở trang chi tiết */}
                            <OrderStatusActions order={order} compact onChanged={handleChanged} onError={handleError} />
                            <Button
                              component={RouterLink}
                              to={`/seller/orders/${order.id}`}
                              variant="text"
                              size="small"
                              sx={{ color: "#475569", "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" }, fontWeight: 600, borderRadius: "8px", minWidth: "auto", px: 1.5 }}
                            >
                              Xem
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Phân trang server */}
            <Box sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between", alignItems: "center", bgcolor: "rgba(248, 250, 252, 0.5)" }}>
              <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                {totalElements > 0 ? (
                  <>
                    Hiển thị{" "}
                    <Box component="span" sx={{ fontWeight: 600, color: "#334155" }}>
                      {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + rows.length}
                    </Box>{" "}
                    của{" "}
                    <Box component="span" sx={{ fontWeight: 600, color: "#334155" }}>
                      {totalElements}
                    </Box>{" "}
                    đơn hàng
                  </>
                ) : (
                  "0 đơn hàng"
                )}
              </Typography>
              {totalPages > 1 && (
                <Pagination
                  size="small"
                  count={totalPages}
                  page={Math.min(page + 1, totalPages)}
                  onChange={(_event, value) => updateParams({ page: value > 1 ? value : null })}
                />
              )}
            </Box>
          </Paper>
        </>
      )}

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: "12px" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
