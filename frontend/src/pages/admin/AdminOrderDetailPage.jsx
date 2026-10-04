import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Grid,
  Link,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { ArrowLeft, Printer, Ban } from "lucide-react";
import WireframeNoteBox from "./components/WireframeNoteBox";
import { DETAILED_ORDER_DH_01187 } from "../../data/adminMockData";

export default function AdminOrderDetailPage() {
  const navigate = useNavigate();
  const order = DETAILED_ORDER_DH_01187;

  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [internalNote, setInternalNote] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const steps = ["Đặt hàng", "Đã xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn thành"];

  const handleUpdateStatus = () => {
    setToastMsg(`Đã cập nhật trạng thái đơn sang "${currentStatus}" thành công.`);
  };

  const wireframeNotes = [
    "1. Thanh tiến trình: trạng thái hiện tại của đơn; các bước đã qua tô đậm.",
    "2. Sản phẩm trong đơn: hiển thị người bán từng dòng vì một đơn có thể gồm sản phẩm từ nhiều người bán; nhãn AI tại thời điểm duyệt được lưu kèm để đối chiếu khi khiếu nại.",
    "3. Thanh toán & vận chuyển: thông tin tra cứu nhanh; mã vận đơn có thể bấm để mở trang theo dõi.",
    "4. Cập nhật trạng thái: admin đổi trạng thái thủ công khi cần (ví dụ xác nhận giao thành công, xử lý hoàn tiền).",
    "5. Lịch sử: mọi thay đổi trạng thái đều được ghi lại kèm người thực hiện."
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator="/" sx={{ mb: 1.5, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin/orders" color="inherit" underline="hover">
          Đơn hàng
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          {order.id}
        </Typography>
      </Breadcrumbs>

      {/* Header Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
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
            <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
              Đơn hàng {order.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Đặt lúc {order.createdAt}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Printer size={16} />}
            onClick={() => window.print()}
            sx={{ textTransform: "none", fontSize: 13, borderColor: "#cbd5e1", color: "#334155" }}
          >
            In đơn
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Ban size={16} />}
            onClick={() => setToastMsg("Đã gửi yêu cầu huỷ đơn hàng.")}
            sx={{ textTransform: "none", fontSize: 13 }}
          >
            Huỷ đơn
          </Button>
        </Box>
      </Box>

      {/* Stepper Progress Bar matching wireframe */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          {/* Background Connecting Line */}
          <Box
            sx={{
              position: "absolute",
              top: 14,
              left: 30,
              right: 30,
              height: 2,
              bgcolor: "#e2e8f0",
              zIndex: 0
            }}
          />
          {/* Active Progress Line */}
          <Box
            sx={{
              position: "absolute",
              top: 14,
              left: 30,
              width: `${(order.currentStep / (steps.length - 1)) * 92}%`,
              height: 2,
              bgcolor: "#0f172a",
              zIndex: 1
            }}
          />

          {steps.map((step, index) => {
            const isPassed = index <= order.currentStep;
            const isCurrent = index === order.currentStep;
            return (
              <Box
                key={step}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 2,
                  bgcolor: "#fff",
                  px: 1
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: isPassed ? "#0f172a" : "#fff",
                    border: isPassed ? "2px solid #0f172a" : "2px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isPassed ? "#fff" : "#94a3b8",
                    fontSize: 12,
                    fontWeight: 700,
                    mb: 1
                  }}
                >
                  {isPassed ? (index + 1) : (index + 1)}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isCurrent ? 800 : isPassed ? 600 : 400,
                    color: isCurrent ? "#0f172a" : isPassed ? "#334155" : "#94a3b8",
                    fontSize: 12.5,
                    textAlign: "center"
                  }}
                >
                  {step} {isCurrent && "(1)"}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Main 2-Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Products List + Price Calculation + Timeline */}
        <Grid item xs={12} lg={8}>
          {/* Card: Sản phẩm trong đơn (3) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Sản phẩm trong đơn ({order.items.length})
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
                2
              </Box>
            </Box>

            <Table size="small" sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 700, fontSize: 12.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell>Người bán</TableCell>
                  <TableCell align="center">SL</TableCell>
                  <TableCell align="right">Đơn giá</TableCell>
                  <TableCell align="right">Thành tiền</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1,
                            overflow: "hidden",
                            bgcolor: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            flexShrink: 0
                          }}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#0f172a" }}>
                            {item.name}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
                            <Typography variant="caption" color="text.secondary">
                              {item.code}
                            </Typography>
                            {item.aiLabel && (
                              <Box
                                component="span"
                                sx={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: "#16a34a",
                                  bgcolor: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                  px: 0.8,
                                  py: 0.1,
                                  borderRadius: 0.8
                                }}
                              >
                                {item.aiLabel}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{item.seller}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 13 }}>
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13 }}>
                      {item.unitPrice.toLocaleString("vi-VN")} đ
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>
                      {item.totalPrice.toLocaleString("vi-VN")} đ
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Divider sx={{ my: 2 }} />

            {/* Pricing Summary matching wireframe */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, px: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", width: 260, fontSize: 13 }}>
                <Typography variant="body2" color="text.secondary">Tạm tính</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {order.pricing.subtotal.toLocaleString("vi-VN")} đ
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", width: 260, fontSize: 13 }}>
                <Typography variant="body2" color="text.secondary">Phí vận chuyển</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {order.pricing.shippingFee.toLocaleString("vi-VN")} đ
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", width: 260, fontSize: 13 }}>
                <Typography variant="body2" color="text.secondary">
                  Giảm giá (mã {order.pricing.voucherCode})
                </Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {order.pricing.discount.toLocaleString("vi-VN")} đ
                </Typography>
              </Box>

              <Divider sx={{ width: 260, my: 0.5 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", width: 260 }}>
                <Typography variant="subtitle2" fontWeight={800}>Tổng thanh toán</Typography>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0f172a" }}>
                  {order.pricing.total.toLocaleString("vi-VN")} đ
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Card: Lịch sử đơn hàng (5) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Lịch sử đơn hàng
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
                5
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {order.history.map((event, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2px solid #64748b",
                      mt: 0.3,
                      flexShrink: 0
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a", fontSize: 13 }}>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {event.time} · {event.actor}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Customer info, Delivery, Payment & Transport, Status Update */}
        <Grid item xs={12} lg={4}>
          {/* Card: Khách hàng */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Khách hàng
            </Typography>
            <Typography variant="body1" fontWeight={700} sx={{ color: "#0f172a" }}>
              {order.customer.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
              {order.customer.phone} · {order.customer.email}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Đã mua {order.customer.orderCount} đơn
              </Typography>
              <Typography variant="caption" color="text.disabled">·</Typography>
              <Link href="#view-profile" underline="hover" sx={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>
                Xem hồ sơ
              </Link>
            </Box>
          </Paper>

          {/* Card: Địa chỉ giao hàng */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Địa chỉ giao hàng
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: "#1e293b", lineHeight: 1.5 }}>
              {order.deliveryAddress.fullAddress}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              {order.deliveryAddress.note}
            </Typography>
          </Paper>

          {/* Card: Thanh toán & vận chuyển (3) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Thanh toán & vận chuyển
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
                3
              </Box>
            </Box>

            <Table size="small" sx={{ "& td": { py: 0.8, fontSize: 13 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", width: "45%" }}>Phương thức</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{order.paymentAndShipping.method}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Trạng thái</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={order.paymentAndShipping.status}
                      variant="outlined"
                      sx={{ borderColor: "#64748b", color: "#1e293b", fontSize: 11, fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Đơn vị vận chuyển</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{order.paymentAndShipping.carrier}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Mã vận đơn</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                    {order.paymentAndShipping.trackingNumber}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {/* Card: Cập nhật trạng thái (4) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Cập nhật trạng thái
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
                4
              </Box>
            </Box>

            <Select
              fullWidth
              size="small"
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              sx={{ mb: 2, fontSize: 13 }}
            >
              <MenuItem value="Chờ xác nhận">Chờ xác nhận</MenuItem>
              <MenuItem value="Đang chuẩn bị">Đang chuẩn bị</MenuItem>
              <MenuItem value="Đang giao">Đang giao</MenuItem>
              <MenuItem value="Hoàn thành">Hoàn thành</MenuItem>
              <MenuItem value="Đã huỷ">Đã huỷ</MenuItem>
              <MenuItem value="Hoàn tiền">Hoàn tiền</MenuItem>
            </Select>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.8, fontSize: 12.5 }}>
              Ghi chú nội bộ
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Chỉ admin nhìn thấy..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              sx={{ mb: 2, "& textarea": { fontSize: 13 } }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleUpdateStatus}
              sx={{
                bgcolor: "#0f172a",
                textTransform: "none",
                fontWeight: 700,
                fontSize: 13.5,
                py: 1,
                "&:hover": { bgcolor: "#1e293b" }
              }}
            >
              Cập nhật
            </Button>
          </Paper>
        </Grid>
      </Grid>



      {/* Toast Feedback */}
      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={3000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
