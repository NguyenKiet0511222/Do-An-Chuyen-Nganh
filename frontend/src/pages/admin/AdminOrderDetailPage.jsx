import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Link,
  Paper,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import {
  ArrowLeft,
  Printer,
  Ban,
  CheckCircle,
  Truck,
  Package,
  Store,
  MapPin,
  Clock,
  Phone
} from "lucide-react";
import { adminApi, resolveAssetUrl } from "../../services/api";
import { ORDER_STATUS_META, ORDER_STEPS, PAYMENT_STATUS_META } from "../../utils/orderStatus";
import { formatDateTime, formatVnd, handleImageError, apiErrorMessage } from "../../utils/format";
import AiLabelChip from "../../components/ai/AiLabelChip";

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Dialog huỷ đơn
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Dialog giao hàng (nhập mã vận đơn)
  const [shippingOpen, setShippingOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");

  const loadOrderDetail = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await adminApi.order.getById(id);
      setOrder(res);
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, "Không thể tải thông tin đơn hàng"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  // Chuyển trạng thái
  const handleTransition = async (nextStatus, payload = {}) => {
    setActionLoading(true);
    try {
      const body = { status: nextStatus, ...payload };
      const updated = await adminApi.order.updateStatus(id, body);
      setOrder(updated);
      setToastMsg(`Đã cập nhật trạng thái đơn sang "${ORDER_STATUS_META[nextStatus]?.label || nextStatus}" thành công.`);
      setCancelOpen(false);
      setCancelReason("");
      setShippingOpen(false);
      setTrackingCode("");
    } catch (err) {
      alert(apiErrorMessage(err, "Lỗi khi chuyển trạng thái đơn"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg || !order) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg || "Không tìm thấy đơn hàng"}
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/admin/orders")}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const currentStepIndex = ORDER_STEPS.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator="/" sx={{ mb: 1.5, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Tổng quan
        </Link>
        <Link component={RouterLink} to="/admin/orders" color="inherit" underline="hover">
          Đơn hàng
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          {order.orderCode || `DH-${order.id}`}
        </Typography>
      </Breadcrumbs>

      {/* Header Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/admin/orders")}
            startIcon={<ArrowLeft size={16} />}
            sx={{ textTransform: "none", fontSize: 13, borderColor: "#cbd5e1", color: "#334155" }}
          >
            Quay lại
          </Button>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
                Đơn {order.orderCode || `DH-${order.id}`}
              </Typography>
              <Chip
                size="small"
                label={ORDER_STATUS_META[order.status]?.label || order.status}
                color={isCancelled ? "error" : order.status === "DELIVERED" ? "success" : "primary"}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Đặt lúc {formatDateTime(order.createdAt)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Printer size={16} />}
            onClick={() => window.print()}
            sx={{ textTransform: "none", fontSize: 13, borderColor: "#cbd5e1", color: "#334155" }}
          >
            In đơn
          </Button>

          {/* Nút hành động trạng thái admin */}
          {order.status === "PENDING" && (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={actionLoading}
                startIcon={<CheckCircle size={16} />}
                onClick={() => handleTransition("CONFIRMED")}
                sx={{ textTransform: "none", fontSize: 13 }}
              >
                Xác nhận đơn
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={actionLoading}
                startIcon={<Ban size={16} />}
                onClick={() => setCancelOpen(true)}
                sx={{ textTransform: "none", fontSize: 13 }}
              >
                Huỷ đơn
              </Button>
            </>
          )}

          {order.status === "CONFIRMED" && (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={actionLoading}
                startIcon={<Package size={16} />}
                onClick={() => handleTransition("PROCESSING")}
                sx={{ textTransform: "none", fontSize: 13 }}
              >
                Bắt đầu chuẩn bị
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={actionLoading}
                startIcon={<Ban size={16} />}
                onClick={() => setCancelOpen(true)}
                sx={{ textTransform: "none", fontSize: 13 }}
              >
                Huỷ đơn
              </Button>
            </>
          )}

          {order.status === "PROCESSING" && (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={actionLoading}
                startIcon={<Truck size={16} />}
                onClick={() => setShippingOpen(true)}
                sx={{ textTransform: "none", fontSize: 13 }}
              >
                Giao cho đơn vị vận chuyển
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={actionLoading}
                startIcon={<Ban size={16} />}
                onClick={() => setCancelOpen(true)}
                sx={{ textTransform: "none", fontSize: 13 }}
              >
                Huỷ đơn
              </Button>
            </>
          )}

          {order.status === "SHIPPING" && (
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={actionLoading}
              startIcon={<CheckCircle size={16} />}
              onClick={() => handleTransition("DELIVERED")}
              sx={{ textTransform: "none", fontSize: 13 }}
            >
              Xác nhận đã giao thành công
            </Button>
          )}
        </Box>
      </Box>

      {/* Stepper Progress Bar */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        {isCancelled ? (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Đơn hàng này đã bị huỷ
            </Typography>
            <Typography variant="body2">
              Lý do: {order.cancelReason || "Không có lý do cụ thể"}
            </Typography>
          </Alert>
        ) : (
          <Stepper activeStep={currentStepIndex} alternativeLabel>
            {ORDER_STEPS.map((step) => (
              <Step key={step}>
                <StepLabel>{ORDER_STATUS_META[step]?.label || step}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </Paper>

      {/* Order Main Content */}
      <Grid container spacing={3}>
        {/* Left Column: Items and History */}
        <Grid item xs={12} lg={8}>
          {/* Order Items Table */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Danh sách sản phẩm trong đơn ({order.items?.length || 0})
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12.5 }}>Sản phẩm</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12.5 }} align="right">Đơn giá</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12.5 }} align="center">Số lượng</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 12.5 }} align="right">Thành tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items?.map((item) => {
                    const prod = item.product || {};
                    const imgUrl = resolveAssetUrl(prod.primaryImageUrl || prod.imageUrl);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Box
                              component="img"
                              src={imgUrl}
                              alt={prod.name || "Nông sản"}
                              onError={handleImageError}
                              sx={{ width: 50, height: 50, borderRadius: 1.5, objectFit: "cover", bgcolor: "#f1f5f9" }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight={700} sx={{ fontSize: 13.5 }}>
                                {prod.name}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                {prod.origin && (
                                  <Typography variant="caption" color="text.secondary">
                                    Xuất xứ: {prod.origin}
                                  </Typography>
                                )}
                                <AiLabelChip label={prod.aiOverallLabel} confidence={prod.aiOverallConfidence} size="small" />
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13 }}>
                          {formatVnd(item.unitPrice)} / {prod.unit || "kg"}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: 13, fontWeight: 600 }}>
                          {item.quantity}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 13.5, fontWeight: 700 }}>
                          {formatVnd(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pricing Summary */}
            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ width: 280, display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Tiền hàng:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatVnd(order.subtotal || (order.totalAmount - (order.shippingFee || 0)))}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Phí vận chuyển:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatVnd(order.shippingFee || 0)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1" fontWeight={800}>Tổng thanh toán:</Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    {formatVnd(order.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Timeline / Status History */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Lịch sử trạng thái đơn hàng
            </Typography>

            {order.statusHistory?.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Chưa có ghi nhận lịch sử.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {order.statusHistory?.map((h) => (
                  <Box key={h.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", mt: 0.2 }}>
                      <Clock size={14} color="#64748b" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="body2" fontWeight={700}>
                          {ORDER_STATUS_META[h.toStatus]?.label || h.toStatus}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(h.changedAt)}
                        </Typography>
                      </Box>
                      {h.comment && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                          {h.comment}
                        </Typography>
                      )}
                      {h.changedBy && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          Bởi: {h.changedBy.fullName} ({h.changedBy.role})
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Customer, Shop & Shipping Info */}
        <Grid item xs={12} lg={4}>
          {/* Receiver / Shipping Address */}
          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 2, mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <MapPin size={18} color="#059669" />
              <Typography variant="subtitle2" fontWeight={700}>
                Địa chỉ nhận hàng
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
              {order.receiverName} {order.phone && `(${order.phone})`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {order.shippingAddress}
            </Typography>
            {order.note && (
              <Box sx={{ mt: 1, p: 1, bgcolor: "#f8fafc", borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Ghi chú: {order.note}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Shop Info */}
          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 2, mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Store size={18} color="#0284c7" />
              <Typography variant="subtitle2" fontWeight={700}>
                Cửa hàng bán nông sản
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={700}>
              {order.shop?.shopName || order.shopName || "Gian hàng"}
            </Typography>
            {order.shop?.province && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Khu vực: {order.shop.province}
              </Typography>
            )}
            {order.shop?.phone && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                <Phone size={12} /> {order.shop.phone}
              </Typography>
            )}
          </Paper>

          {/* Payment & Shipping Method */}
          <Paper variant="outlined" sx={{ p: 2.2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Vận chuyển & Thanh toán
            </Typography>

            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Phương thức thanh toán
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {order.paymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod}
              </Typography>
              <Chip
                size="small"
                label={PAYMENT_STATUS_META[order.paymentStatus]?.label || order.paymentStatus}
                color={order.paymentStatus === "PAID" ? "success" : "default"}
                sx={{ mt: 0.5, fontSize: 11 }}
              />
            </Box>

            {order.trackingCode && (
              <Box sx={{ mt: 1.5, p: 1.2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 1.5 }}>
                <Typography variant="caption" color="success.dark" fontWeight={600}>
                  Mã vận đơn
                </Typography>
                <Typography variant="body2" fontWeight={800} color="success.dark">
                  {order.trackingCode}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Huỷ đơn */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Huỷ đơn hàng</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Vui lòng nhập lý do huỷ đơn hàng. Tồn kho sản phẩm trong đơn sẽ được hoàn lại tự động.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            required
            multiline
            rows={3}
            label="Lý do huỷ đơn"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelOpen(false)} disabled={actionLoading}>
            Đóng
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={actionLoading || !cancelReason.trim()}
            onClick={() => handleTransition("CANCELLED", { cancelReason: cancelReason.trim() })}
          >
            Xác nhận huỷ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Giao hàng (Mã vận đơn) */}
      <Dialog open={shippingOpen} onClose={() => setShippingOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Giao cho đơn vị vận chuyển</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nhập mã vận đơn từ đơn vị vận chuyển để khách hàng theo dõi.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Mã vận đơn (tracking code)"
            placeholder="VD: GHN123456VN"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShippingOpen(false)} disabled={actionLoading}>
            Đóng
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={actionLoading}
            onClick={() => handleTransition("SHIPPING", { trackingCode: trackingCode.trim() || undefined })}
          >
            Bắt đầu giao
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={4000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
