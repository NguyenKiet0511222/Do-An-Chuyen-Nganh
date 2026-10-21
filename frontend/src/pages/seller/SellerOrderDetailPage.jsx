import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Snackbar,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  stepConnectorClasses,
  styled
} from "@mui/material";
import { ArrowLeft, Check, ChevronRight, Clock, MapPin, Package, Phone, PhoneCall, Receipt, User, Wallet } from "lucide-react";
import AiLabelChip from "../../components/ai/AiLabelChip";
import { resolveAssetUrl, sellerApi } from "../../services/api";
import { ORDER_STATUS_META, ORDER_STEPS, PAYMENT_STATUS_META } from "../../utils/orderStatus";
import { formatDateTime, formatVnd, handleImageError } from "../../utils/format";
import OrderStatusActions from "./components/OrderStatusActions";
import ShopLoadError from "./components/ShopLoadError";

const paperSx = { borderRadius: "16px", border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" };
const headCellSx = { fontWeight: 600, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" };
const bodyCellSx = { borderBottom: "1px solid #f1f5f9" };
const iconBoxSx = { width: 32, height: 32, borderRadius: "8px", bgcolor: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

const PAYMENT_METHOD_LABEL = { COD: "Thanh toán khi nhận hàng (COD)" };

// Màu chấm trên dòng thời gian theo trạng thái đích
const TIMELINE_COLOR = {
  PENDING: "#f59e0b",
  CONFIRMED: "#0ea5e9",
  PROCESSING: "#0ea5e9",
  SHIPPING: "#10b981",
  DELIVERED: "#059669",
  CANCELLED: "#ef4444"
};

// Hướng dẫn ở thẻ "Bước tiếp theo" theo trạng thái hiện tại
const NEXT_STEP_HINT = {
  PENDING: "Kiểm tra tồn kho rồi bấm “Xác nhận đơn”. Không bán được thì huỷ đơn kèm lý do.",
  CONFIRMED: "Bấm “Bắt đầu chuẩn bị” khi bắt đầu soạn và đóng gói hàng. Vẫn huỷ được nếu không giao được hàng.",
  PROCESSING: "Đóng gói xong, giao cho đơn vị vận chuyển và ghi mã vận đơn. Sau bước này không huỷ được nữa.",
  SHIPPING: "Khi khách đã nhận hàng, bấm “Xác nhận đã giao” — đơn chuyển Hoàn thành và Đã thanh toán (không hoàn tác).",
  DELIVERED: "Đơn đã hoàn thành và đã thanh toán. Doanh thu đã được tính cho shop.",
  CANCELLED: "Đơn đã huỷ, tồn kho các sản phẩm trong đơn đã được hoàn lại."
};

const CustomStepperConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 14,
    left: "calc(-50% + 20px)",
    right: "calc(50% + 20px)"
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: "#10b981" }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: "#10b981" }
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: "#e2e8f0",
    borderTopWidth: 3,
    borderRadius: 2,
    transition: "border-color 0.3s ease"
  }
}));

function CustomStepIcon({ active, completed, className, icon }) {
  return (
    <Box
      className={className}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        bgcolor: completed ? "#059669" : active ? "#10b981" : "#f1f5f9",
        color: completed || active ? "#fff" : "#64748b",
        boxShadow: completed || active ? "0 4px 6px rgba(16, 185, 129, 0.25)" : "none",
        border: completed || active ? "none" : "1px solid #cbd5e1",
        zIndex: 1,
        fontSize: 12,
        fontWeight: 700
      }}
    >
      {completed ? <Check size={16} strokeWidth={3} /> : icon}
    </Box>
  );
}

/**
 * Chi tiết 1 đơn của shop (docs/2110.md L1-4 + phần đơn của L2-6): dữ liệu GET /seller/orders/{id}; nút chuyển trạng thái
 * dựng từ SELLER_NEXT_STATUS, chờ API xong mới hiện trạng thái mới (dùng đúng response). Stepper + dòng thời gian từ history[].
 */
export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const validId = /^\d+$/.test(id || "");
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState({ request: null, order: null, error: null });
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  const request = useMemo(() => (validId ? { id, reloadKey } : null), [id, reloadKey, validId]);

  useEffect(() => {
    if (!request) return undefined;
    let ignore = false;
    sellerApi.order
      .getById(request.id)
      .then((order) => {
        if (!ignore) setLoaded({ request, order, error: null });
      })
      .catch((err) => {
        if (!ignore) setLoaded({ request, order: null, error: err });
      });
    return () => {
      ignore = true;
    };
  }, [request]);

  const loading = request !== null && loaded.request !== request;
  // Đơn đang hiện phải đúng id trên URL (chuyển từ đơn này sang đơn khác không hiện đơn cũ)
  const order = loaded.order && String(loaded.order.id) === String(id) ? loaded.order : null;
  const notFoundMessage = `Không tìm thấy đơn hàng #${id}.`;

  const showToast = (severity, message) => setToast({ open: true, severity, message });
  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleChanged = (updated, message) => {
    // Hiện đúng đơn backend trả về sau khi chuyển trạng thái (kèm history mới), không tự đoán
    if (updated?.id) setLoaded((prev) => ({ ...prev, order: updated, error: null }));
    showToast("success", message);
  };
  const handleError = (message, err) => {
    showToast("error", message);
    // 409 = đơn đã đổi trạng thái ở nơi khác (vd khách vừa huỷ) -> tải lại để hiện trạng thái thật
    if (err?.response?.status === 409) setReloadKey((key) => key + 1);
  };

  const breadcrumbs = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ width: 40, height: 40, minWidth: 40, borderRadius: "10px", bgcolor: "#ecfdf5", border: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
        <Receipt size={20} />
      </Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Chi tiết đơn hàng
        </Typography>
        <Breadcrumbs separator={<ChevronRight size={10} />} sx={{ "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}>
          <Link component={RouterLink} to="/seller/orders" underline="hover" sx={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}>
            Đơn hàng
          </Link>
          <Typography sx={{ color: "#334155", fontSize: 12, fontWeight: 600 }}>{order?.orderCode || `#${id}`}</Typography>
        </Breadcrumbs>
      </Box>
    </Box>
  );

  const backLink = (
    <Box>
      <Button component={RouterLink} to="/seller/orders" startIcon={<ArrowLeft size={16} />} sx={{ color: "#475569", fontWeight: 600 }}>
        Về danh sách đơn hàng
      </Button>
    </Box>
  );

  if (!order) {
    return (
      <Box sx={{ pb: 6, display: "flex", flexDirection: "column", gap: 3 }}>
        {breadcrumbs}
        {!validId ? (
          <Alert severity="warning" sx={{ borderRadius: "12px" }}>
            {notFoundMessage}
          </Alert>
        ) : loading || !loaded.error ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ShopLoadError
            error={loaded.error}
            fallback="Không tải được đơn hàng."
            notFoundMessage={notFoundMessage}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        )}
        {backLink}
      </Box>
    );
  }

  const statusMeta = ORDER_STATUS_META[order.status] || { label: order.status, color: "default" };
  const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus];
  const history = order.history || [];
  const items = order.items || [];
  const isCancelled = order.status === "CANCELLED";
  const activeStep = order.status === "DELIVERED" ? ORDER_STEPS.length : ORDER_STEPS.indexOf(order.status);
  // Giờ của từng bước = lần đầu đơn chuyển tới trạng thái đó trong history[] (bước Chờ xác nhận = lúc đặt)
  const stepTime = (step) =>
    history.find((h) => h.toStatus === step)?.createdAt ?? (step === "PENDING" ? order.createdAt : null);
  const customer = order.customer || {};

  return (
    <Box sx={{ pb: 6, display: "flex", flexDirection: "column", gap: 3 }}>
      {breadcrumbs}

      {/* Tóm tắt + nút chuyển trạng thái */}
      <Paper elevation={0} sx={{ ...paperSx, p: { xs: 3, lg: 4 } }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", pb: 4, borderBottom: "1px solid #f1f5f9", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{order.orderCode}</Typography>
              <Chip label={statusMeta.label} color={statusMeta.color} sx={{ fontWeight: 700 }} />
              {paymentMeta && <Chip label={paymentMeta.label} color={paymentMeta.color} variant="outlined" sx={{ fontWeight: 700 }} />}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Clock size={14} color="#94a3b8" />
                Đặt lúc:{" "}
                <Box component="span" sx={{ color: "#334155", fontWeight: 600 }}>
                  {formatDateTime(order.createdAt)}
                </Box>
              </Box>
              <Typography sx={{ color: "#cbd5e1" }}>•</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Wallet size={14} color="#94a3b8" />
                <Box component="span" sx={{ color: "#334155", fontWeight: 600 }}>
                  {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                </Box>
              </Box>
            </Box>
          </Box>

          <OrderStatusActions order={order} allowCancel onChanged={handleChanged} onError={handleError} />
        </Box>

        {isCancelled ? (
          <Alert severity="error" sx={{ mt: 4, borderRadius: "12px" }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Đơn đã huỷ lúc {formatDateTime(order.cancelledAt)}</AlertTitle>
            Lý do: {order.cancelReason || "(không ghi lý do)"}
          </Alert>
        ) : (
          <Box sx={{ pt: 5, px: { xs: 0, sm: 2 }, overflowX: "auto" }}>
            <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepperConnector />} sx={{ minWidth: 520 }}>
              {ORDER_STEPS.map((step, index) => {
                const reached = index <= activeStep;
                const time = reached ? stepTime(step) : null;
                return (
                  <Step key={step}>
                    <StepLabel slots={{ stepIcon: CustomStepIcon }}>
                      <Typography sx={{ fontSize: 12, fontWeight: index === activeStep ? 800 : reached ? 600 : 500, color: index === activeStep ? "#047857" : reached ? "#0f172a" : "#64748b", mt: 0.5 }}>
                        {ORDER_STATUS_META[step].label}
                      </Typography>
                      {time && <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.25 }}>{formatDateTime(time)}</Typography>}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" }, gap: 3, alignItems: "start" }}>
        {/* Cột trái */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          {/* Sản phẩm trong đơn */}
          <Paper elevation={0} sx={{ ...paperSx, overflow: "hidden" }}>
            <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Sản phẩm trong đơn</Typography>
              <Box sx={{ px: 1.5, py: 0.25, borderRadius: "10px", bgcolor: "#ecfdf5", color: "#059669", fontSize: 11, fontWeight: 600 }}>{items.length} mặt hàng</Box>
            </Box>

            <TableContainer>
              <Table size="small" sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headCellSx, py: 2 }}>Sản phẩm</TableCell>
                    <TableCell align="center" sx={headCellSx}>SL</TableCell>
                    <TableCell align="right" sx={headCellSx}>Đơn giá</TableCell>
                    <TableCell align="right" sx={headCellSx}>Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={`${item.productId}-${index}`} sx={{ "&:hover": { bgcolor: "rgba(248, 250, 252, 0.7)" } }}>
                      <TableCell sx={{ ...bodyCellSx, py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Box sx={{ width: 48, height: 48, borderRadius: "10px", bgcolor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", color: "#94a3b8" }}>
                            {item.imageUrl ? (
                              <img
                                src={resolveAssetUrl(item.imageUrl)}
                                alt={item.productName}
                                onError={handleImageError}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <Package size={22} />
                            )}
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.productName}</Typography>
                            {/* Nhãn AI chụp lại lúc khách đặt (aiLabelSnapshot) */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                              <Typography component="span" sx={{ fontSize: 11, color: "#94a3b8" }}>Nhãn AI lúc đặt:</Typography>
                              <AiLabelChip label={item.aiLabelSnapshot} size="small" />
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={bodyCellSx}>
                        <Box sx={{ display: "inline-block", px: 1.5, py: 0.5, borderRadius: "6px", bgcolor: "#f1f5f9", color: "#334155", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {item.quantity} {item.unit}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ ...bodyCellSx, color: "#475569", fontWeight: 500, fontSize: 13, whiteSpace: "nowrap" }}>
                        {formatVnd(item.price)}
                      </TableCell>
                      <TableCell align="right" sx={{ ...bodyCellSx, color: "#0f172a", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
                        {formatVnd(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ p: 3, display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ width: 300, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ color: "#64748b", fontWeight: 500, fontSize: 12 }}>Tạm tính</Typography>
                  <Typography sx={{ color: "#334155", fontWeight: 600, fontSize: 12 }}>{formatVnd(order.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ color: "#64748b", fontWeight: 500, fontSize: 12 }}>Phí vận chuyển (khách trả)</Typography>
                  <Typography sx={{ color: "#334155", fontWeight: 600, fontSize: 12 }}>{formatVnd(order.shippingFee)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", pt: 1.5, mt: 0.5, borderTop: "1px solid #e2e8f0" }}>
                  <Typography sx={{ color: "#0f172a", fontWeight: 700, fontSize: 13 }}>Tổng thanh toán</Typography>
                  <Typography sx={{ color: "#e11d48", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>{formatVnd(order.total)}</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Dòng thời gian từ history[] */}
          <Paper elevation={0} sx={{ ...paperSx, p: 3 }}>
            <Box sx={{ pb: 2, mb: 3, borderBottom: "1px solid #f1f5f9" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Lịch sử đơn hàng</Typography>
            </Box>
            {history.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>Chưa có lịch sử trạng thái.</Typography>
            ) : (
              <Box sx={{ pl: 3, position: "relative", display: "flex", flexDirection: "column", gap: 3, "&::before": { content: '""', position: "absolute", left: 10, top: 8, bottom: 8, width: 2, bgcolor: "#e2e8f0" } }}>
                {history.map((h, index) => {
                  const color = TIMELINE_COLOR[h.toStatus] || "#94a3b8";
                  const title = h.fromStatus ? ORDER_STATUS_META[h.toStatus]?.label || h.toStatus : "Khách đặt hàng";
                  return (
                    <Box key={`${h.toStatus}-${index}`} sx={{ position: "relative" }}>
                      <Box sx={{ position: "absolute", left: -24, top: 3, width: 20, height: 20, borderRadius: "50%", bgcolor: "#fff", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{title}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.25 }}>
                        {formatDateTime(h.createdAt)}
                        {h.changedBy && (
                          <>
                            {" "}· bởi{" "}
                            <Box component="span" sx={{ fontWeight: 700, color: "#334155" }}>
                              {h.changedBy}
                            </Box>
                          </>
                        )}
                      </Typography>
                      {h.note && (
                        <Typography sx={{ mt: 0.75, px: 1.5, py: 1, borderRadius: "8px", bgcolor: "#f8fafc", border: "1px solid #f1f5f9", fontSize: 12, color: "#475569" }}>
                          {h.toStatus === "CANCELLED" ? "Lý do: " : "Ghi chú: "}
                          {h.note}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Box>

        {/* Cột phải */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          {/* Người nhận (theo đơn) */}
          <Paper elevation={0} sx={{ ...paperSx, p: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a", pb: 2, mb: 2, borderBottom: "1px solid #f1f5f9" }}>Người nhận</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={iconBoxSx}>
                  <User size={16} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.25 }}>Họ tên người nhận</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{order.receiverName}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={iconBoxSx}>
                  <Phone size={16} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.25 }}>Số điện thoại</Typography>
                  <Link href={`tel:${order.phone}`} underline="hover" sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b", letterSpacing: 0.5 }}>
                    {order.phone}
                  </Link>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Box sx={{ ...iconBoxSx, color: "#059669" }}>
                  <MapPin size={16} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.25 }}>Địa chỉ giao hàng</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#334155", lineHeight: 1.5 }}>{order.shippingAddress}</Typography>
                </Box>
              </Box>
              <Box sx={{ pt: 2, borderTop: "1px solid #f1f5f9" }}>
                <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 1 }}>Ghi chú của khách:</Typography>
                <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "#f8fafc", border: "1px solid #f1f5f9", fontSize: 12, color: order.note ? "#334155" : "#94a3b8", fontStyle: order.note ? "normal" : "italic" }}>
                  {order.note || "(Không có)"}
                </Box>
              </Box>
            </Box>
            {order.phone && (
              <Button
                component="a"
                href={`tel:${order.phone}`}
                variant="outlined"
                startIcon={<PhoneCall size={14} />}
                fullWidth
                sx={{ mt: 3, borderRadius: "10px", py: 1, borderColor: "#10b981", color: "#047857", fontWeight: 700, fontSize: 13, "&:hover": { bgcolor: "#ecfdf5", borderColor: "#10b981" } }}
              >
                Gọi người nhận
              </Button>
            )}
          </Paper>

          {/* Tài khoản đặt (khác người nhận) */}
          <Paper elevation={0} sx={{ ...paperSx, p: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a", pb: 2, mb: 2, borderBottom: "1px solid #f1f5f9" }}>Tài khoản đặt</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{customer.fullName || "—"}</Typography>
              {customer.phone ? (
                <Link href={`tel:${customer.phone}`} underline="hover" sx={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                  {customer.phone}
                </Link>
              ) : (
                <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Tài khoản chưa có số điện thoại</Typography>
              )}
            </Box>
          </Paper>

          {/* Bước tiếp theo */}
          <Paper elevation={0} sx={{ ...paperSx, p: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a", pb: 2, mb: 2, borderBottom: "1px solid #f1f5f9" }}>Bước tiếp theo</Typography>
            <Box sx={{ p: 2, borderRadius: "12px", bgcolor: isCancelled ? "#fef2f2" : "#f8fafc", border: "1px solid rgba(226, 232, 240, 0.7)", fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
              {NEXT_STEP_HINT[order.status] || "—"}
            </Box>
          </Paper>
        </Box>
      </Box>

      {backLink}

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: "12px" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
