import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Breadcrumbs, Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, styled } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, MapPin, Phone, User, Clock, Wallet, Receipt, Check, PhoneCall, ArrowRightCircle, Circle, Cpu } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { sellerApi, resolveAssetUrl } from "../../services/api";

const CustomStepperConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 14,
    left: 'calc(-50% + 20px)',
    right: 'calc(50% + 20px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#10b981' },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#10b981' },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#e2e8f0',
    borderTopWidth: 3,
    borderRadius: 2,
    transition: 'border-color 0.3s ease',
  },
}));

function CustomStepIcon(props) {
  const { active, completed, className, icon } = props;

  return (
    <Box className={className} sx={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      width: 32, height: 32, borderRadius: '50%', 
      bgcolor: completed ? '#059669' : active ? '#10b981' : '#f1f5f9',
      color: completed || active ? '#fff' : '#64748b',
      boxShadow: completed || active ? "0 4px 6px rgba(16, 185, 129, 0.25)" : "none",
      border: completed || active ? "none" : "1px solid #cbd5e1",
      zIndex: 1,
      fontSize: 12,
      fontWeight: 700
    }}>
      {completed ? <Check size={16} strokeWidth={3} /> : icon}
    </Box>
  );
}

export default function SellerOrderDetailPage() {
  const { id } = useParams();

  const [orderStatus, setOrderStatus] = useState(null);
  const [apiOrder, setApiOrder] = useState(null);

  useEffect(() => {
    if (id) {
      sellerApi.order.getById(id).then(res => {
        if (res) {
          setApiOrder({
            id: res.orderCode || `DH-${res.id}`,
            rawId: res.id,
            status: res.status,
            customer: {
              name: res.receiverName || res.customer?.fullName || "Khách hàng",
              phone: res.phone || res.customer?.phone || "0987 654 321",
              address: res.shippingAddress || "Địa chỉ nhận hàng",
              note: res.note || "(Không có)"
            },
            time: res.createdAt ? new Date(res.createdAt).toLocaleString("vi-VN") : "13/09/2026 16:45",
            payment: res.paymentMethod || "COD",
            items: (res.items || []).map(it => ({
              id: it.productId,
              name: it.productName,
              image: resolveAssetUrl(it.imageUrl),
              qty: it.quantity || 1,
              price: it.price || 0,
              unit: it.unit || "kg"
            })),
            shippingFee: res.shippingFee || 20000,
            total: res.total || 0
          });
        }
      }).catch(err => {
        console.warn("Không tìm thấy đơn trên API, dùng store:", err?.message);
      });
    }
  }, [id]);

  const orderData = useMemo(() => {
    if (apiOrder) return apiOrder;
    try {
      const stored = localStorage.getItem("customer_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = parsed.find(o => String(o.id) === String(id));
        if (match) {
          return {
            id: match.id,
            status: match.status,
            customer: {
              name: match.customer?.fullName || "Lê Văn Nam",
              phone: match.customer?.phone || "0987 654 321",
              address: match.customer?.address || "Số 101 Nguyễn Văn Linh, Tân Phong, Quận 7, TP. HCM",
              note: match.customer?.note || "(Không có)"
            },
            time: match.date || "13/09/2026 16:45",
            payment: match.paymentMethod || "COD",
            items: (match.items || []).map(it => ({
              id: it.id,
              name: it.name,
              image: it.image,
              qty: it.quantity || 1,
              price: it.price || 0,
              unit: it.unit || "kg"
            })),
            shippingFee: match.shippingFee || 30000,
            total: match.total || 160000
          };
        }
      }
    } catch (e) {
      console.warn(e);
    }

    // Default fallback
    return {
      id: id || "DH-2026-00003",
      status: "PENDING",
      customer: {
        name: "Lê Văn Nam",
        phone: "0987 654 321",
        address: "Số 101 Nguyễn Văn Linh, Tân Phong, Quận 7, TP. HCM",
        note: "(Không có)"
      },
      time: "13/09/2026 16:45",
      payment: "COD",
      items: [
        { id: "SP-01183", name: "Khoai tây Đà Lạt", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=150", qty: 5, price: 28000, unit: "kg" }
      ],
      shippingFee: 20000,
      total: 160000
    };
  }, [id, apiOrder]);

  const currentStatus = orderStatus || orderData.status;

  const handleUpdateStatus = async (newStatus) => {
    setOrderStatus(newStatus);
    const targetRawId = apiOrder?.rawId || id;
    if (targetRawId && !isNaN(Number(targetRawId))) {
      try {
        let payload = { status: newStatus };
        if (newStatus === "CANCELLED") {
          const reason = window.prompt("Vui lòng nhập lý do huỷ đơn hàng:");
          if (!reason) return;
          payload.cancelReason = reason;
        }
        await sellerApi.order.changeStatus(targetRawId, payload);
      } catch (err) {
        console.warn("Lỗi cập nhật trạng thái đơn qua API:", err);
      }
    }
    try {
      const stored = localStorage.getItem("customer_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        const idx = parsed.findIndex(o => String(o.id) === String(orderData.id));
        if (idx !== -1) {
          parsed[idx].status = newStatus;
          localStorage.setItem("customer_orders", JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const getActiveStep = () => {
    switch (currentStatus) {
      case "PENDING": return 0;
      case "CONFIRMED": return 1;
      case "PROCESSING": return 2;
      case "SHIPPING": case "DELIVERING": return 3;
      case "DELIVERED": case "COMPLETED": return 4;
      default: return 0;
    }
  };

  const activeStep = getActiveStep();

  const steps = [
    { label: "Khách đặt hàng", status: activeStep >= 0 ? "completed" : "pending" },
    { label: "Chờ xác nhận", status: activeStep === 1 ? "active" : activeStep > 1 ? "completed" : "pending" },
    { label: "Đang chuẩn bị", status: activeStep === 2 ? "active" : activeStep > 2 ? "completed" : "pending" },
    { label: "Đang giao", status: activeStep === 3 ? "active" : activeStep > 3 ? "completed" : "pending" },
    { label: "Hoàn thành", status: activeStep === 4 ? "completed" : "pending" }
  ];

  const subtotal = orderData.items.reduce((s, it) => s + (it.price * it.qty), 0);

  return (
    <Box sx={{ pb: 6, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ width: 40, height: 40, minWidth: 40, borderRadius: 2, bgcolor: "#ecfdf5", border: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <Receipt size={20} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Chi tiết đơn hàng
          </Typography>
          <Breadcrumbs separator={<ChevronRight size={10} />} sx={{ "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}>
            <Link to="/seller/orders" style={{ color: "#64748b", textDecoration: "none", fontSize: 12, fontWeight: 500 }}>Đơn hàng</Link>
            <Typography sx={{ color: "#334155", fontSize: 12, fontWeight: 600 }}>{orderData.id}</Typography>
          </Breadcrumbs>
        </Box>
      </Box>

      {/* Hero Summary Card */}
      <Paper elevation={0} sx={{ p: { xs: 3, lg: 4 }, borderRadius: 4, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", pb: 4, borderBottom: "1px solid #f1f5f9", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{orderData.id}</Typography>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.5, py: 0.5, borderRadius: 10, fontSize: 12, fontWeight: 700, bgcolor: currentStatus === "PENDING" ? "#fffbeb" : "#ecfdf5", color: currentStatus === "PENDING" ? "#b45309" : "#047857", border: "1px solid #fde68a" }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: currentStatus === "PENDING" ? "#f59e0b" : "#10b981" }} />
                {currentStatus === "PENDING" ? "Chờ xác nhận" : currentStatus === "PROCESSING" ? "Đang chuẩn bị" : currentStatus === "DELIVERING" ? "Đang giao" : "Hoàn thành"}
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Clock size={14} color="#94a3b8" />
                Đặt lúc: <Box component="span" sx={{ color: "#334155", fontWeight: 600 }}>{orderData.time}</Box>
              </Box>
              <Typography sx={{ color: "#cbd5e1" }}>•</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Wallet size={14} color="#94a3b8" />
                Thanh toán: <Box component="span" sx={{ color: "#334155", fontWeight: 600 }}>{orderData.payment}</Box>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {currentStatus === "PENDING" && (
              <>
                <Button 
                  variant="outlined" 
                  onClick={() => handleUpdateStatus("CANCELLED")}
                  sx={{ color: "#e11d48", borderColor: "#fda4af", bgcolor: "#fff", "&:hover": { bgcolor: "#fff1f2", borderColor: "#fb7185" }, textTransform: "none", fontWeight: 700, borderRadius: 3, px: 2, py: 1 }}
                >
                  Từ chối / Hủy đơn
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => handleUpdateStatus("PROCESSING")}
                  startIcon={<Check size={14} />} 
                  sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" }, textTransform: "none", fontWeight: 700, borderRadius: 3, px: 3, py: 1 }}
                >
                  Xác nhận đơn
                </Button>
              </>
            )}
            {currentStatus === "PROCESSING" && (
              <Button 
                variant="contained" 
                onClick={() => handleUpdateStatus("DELIVERING")}
                sx={{ bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" }, textTransform: "none", fontWeight: 700, borderRadius: 3, px: 3, py: 1 }}
              >
                Giao cho đơn vị vận chuyển
              </Button>
            )}
            {currentStatus === "DELIVERING" && (
              <Button 
                variant="contained" 
                onClick={() => handleUpdateStatus("COMPLETED")}
                sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" }, textTransform: "none", fontWeight: 700, borderRadius: 3, px: 3, py: 1 }}
              >
                Đánh dấu Đã hoàn thành
              </Button>
            )}
          </Box>
        </Box>

        {/* Stepper */}
        <Box sx={{ pt: 5, px: { xs: 0, sm: 2 } }}>
          <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepperConnector />}>
            {steps.map((step, index) => (
              <Step key={step.label} completed={step.status === "completed"}>
                <StepLabel StepIconComponent={CustomStepIcon} StepIconProps={{ icon: index + 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: step.status === "active" ? 800 : step.status === "completed" ? 600 : 500, color: step.status === "active" ? "#047857" : step.status === "completed" ? "#0f172a" : "#64748b", mt: 0.5 }}>
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Paper>

      {/* Details Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" }, gap: 3, alignItems: "start" }}>
        {/* Left Column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            
            {/* Sản phẩm trong đơn */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
              <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Sản phẩm trong đơn ({orderData.items.length})</Typography>
                <Box sx={{ px: 1.5, py: 0.25, borderRadius: 10, bgcolor: "#ecfdf5", color: "#059669", fontSize: 11, fontWeight: 600 }}>{orderData.items.length} mặt hàng</Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ borderBottom: "1px solid #f1f5f9" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, py: 2 }}>Sản phẩm</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>SL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Đơn giá</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderData.items.map(item => (
                      <TableRow key={item.id} sx={{ "&:hover": { bgcolor: "rgba(248, 250, 252, 0.7)" }, transition: "background 0.2s" }}>
                        <TableCell sx={{ py: 2, borderBottom: "1px solid #f1f5f9" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{ position: "relative", width: 48, height: 48, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                              {item.image ? (
                                <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <Typography sx={{ fontSize: 24 }}>🥕</Typography>
                              )}
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.name}</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, fontSize: 11 }}>
                                <Typography sx={{ color: "#047857", fontWeight: 600 }}>Tươi sạch AI</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: "1px solid #f1f5f9" }}>
                          <Box sx={{ display: "inline-block", px: 1.5, py: 0.5, borderRadius: 1.5, bgcolor: "#f1f5f9", color: "#334155", fontSize: 11, fontWeight: 700 }}>
                            {item.qty} {item.unit || "kg"}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: "1px solid #f1f5f9", color: "#475569", fontWeight: 500, fontSize: 13 }}>
                          {Number(item.price).toLocaleString("vi-VN")} đ
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: "1px solid #f1f5f9", color: "#0f172a", fontWeight: 700, fontSize: 13 }}>
                          {(item.price * item.qty).toLocaleString("vi-VN")} đ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ p: 3, display: "flex", justifyContent: "flex-end" }}>
                <Box sx={{ width: 280, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Tạm tính</Typography>
                    <Typography sx={{ color: "#334155", fontWeight: 600 }}>{subtotal.toLocaleString("vi-VN")} đ</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <Typography sx={{ color: "#64748b", fontWeight: 500 }}>Phí ship (khách trả)</Typography>
                    <Typography sx={{ color: "#334155", fontWeight: 600 }}>{orderData.shippingFee.toLocaleString("vi-VN")} đ</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", pt: 1.5, mt: 0.5, borderTop: "1px solid #e2e8f0" }}>
                    <Typography sx={{ color: "#0f172a", fontWeight: 700, fontSize: 13 }}>Khách thanh toán {orderData.payment}</Typography>
                    <Typography sx={{ color: "#e11d48", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
                      {Number(orderData.total).toLocaleString("vi-VN")} đ
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Lịch sử đơn hàng */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 3, mb: 3, borderBottom: "1px solid #f1f5f9" }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Lịch sử đơn hàng</Typography>
                <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>Tự động ghi nhận bởi AI</Typography>
              </Box>

              <Box sx={{ pl: 3, position: "relative", display: "flex", flexDirection: "column", gap: 3, "&::before": { content: '""', position: "absolute", left: 10, top: 8, bottom: 8, width: 2, bgcolor: "#e2e8f0" } }}>
                <Box sx={{ position: "relative", display: "flex", gap: 2 }}>
                  <Box sx={{ position: "absolute", left: -24, top: 4, width: 20, height: 20, borderRadius: "50%", bgcolor: "#fff", border: "2px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Khách đặt hàng</Typography>
                      <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: "#ecfdf5", color: "#047857", fontSize: 10, fontWeight: 600 }}>Tạo mới</Box>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.5 }}>{orderData.time} · Người đặt: <Box component="span" sx={{ fontWeight: 700, color: "#334155" }}>{orderData.customer.name}</Box></Typography>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.25 }}>Hình thức thanh toán: {orderData.payment} ({Number(orderData.total).toLocaleString("vi-VN")} đ)</Typography>
                  </Box>
                </Box>

                <Box sx={{ position: "relative", display: "flex", gap: 2 }}>
                  <Box sx={{ position: "absolute", left: -24, top: 4, width: 20, height: 20, borderRadius: "50%", bgcolor: "#fff", border: "2px solid #14b8a6", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                    <Cpu size={10} color="#0d9488" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Kiểm tra thông tin tự động (AgriFresh AI)</Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.5 }}>Hệ thống xác minh sản phẩm đạt chuẩn an toàn vệ sinh và đủ điều kiện giao nhanh.</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

          </Box>
        {/* Right Column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            
            {/* Thông tin khách hàng */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, mb: 2, borderBottom: "1px solid #f1f5f9" }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Thông tin khách hàng</Typography>
                <Box sx={{ px: 1.5, py: 0.25, borderRadius: 10, bgcolor: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600 }}>Khách cá nhân</Box>
              </Box>
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.25 }}>Họ tên khách hàng</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{orderData.customer.name}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Phone size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.25 }}>Số điện thoại liên hệ</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1e293b", letterSpacing: 0.5 }}>{orderData.customer.phone}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "#f1f5f9", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MapPin size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.25 }}>Địa chỉ giao hàng</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#334155", lineHeight: 1.5 }}>{orderData.customer.address}</Typography>
                  </Box>
                </Box>

                <Box sx={{ pt: 2, borderTop: "1px solid #f1f5f9" }}>
                  <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 1 }}>Ghi chú của khách hàng:</Typography>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #f1f5f9", fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
                    {orderData.customer.note}
                  </Box>
                </Box>
              </Box>

              <Button variant="outlined" startIcon={<PhoneCall size={14} />} fullWidth sx={{ mt: 3, borderRadius: 3, py: 1, borderColor: "#10b981", color: "#047857", textTransform: "none", fontWeight: 700, fontSize: 13, "&:hover": { bgcolor: "#ecfdf5", borderColor: "#10b981" } }}>
                Gọi cho khách
              </Button>
            </Paper>

            {/* Bước tiếp theo */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <Box sx={{ pb: 2, mb: 2, borderBottom: "1px solid #f1f5f9" }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Bước tiếp theo</Typography>
                <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.5 }}>Hướng dẫn xử lý đơn hàng theo trạng thái hiện tại.</Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc", border: "1px solid rgba(226, 232, 240, 0.7)", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, bgcolor: currentStatus === "PENDING" ? "rgba(254, 243, 199, 0.8)" : "transparent", color: currentStatus === "PENDING" ? "#92400e" : "#64748b", fontSize: 12, fontWeight: 500 }}>
                  <ArrowRightCircle size={14} color={currentStatus === "PENDING" ? "#d97706" : "#cbd5e1"} />
                  <Box component="span" sx={{ fontWeight: 700 }}>Chờ xác nhận</Box> → Bấm "Xác nhận đơn"
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, bgcolor: currentStatus === "PROCESSING" ? "rgba(239, 246, 255, 0.8)" : "transparent", color: currentStatus === "PROCESSING" ? "#1e40af" : "#64748b", fontSize: 12 }}>
                  <Circle size={14} color={currentStatus === "PROCESSING" ? "#2563eb" : "#cbd5e1"} />
                  <Box component="span" sx={{ fontWeight: 700 }}>Đang chuẩn bị</Box> → Đóng gói và giao vận
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2, bgcolor: currentStatus === "DELIVERING" ? "rgba(236, 253, 245, 0.8)" : "transparent", color: currentStatus === "DELIVERING" ? "#065f46" : "#64748b", fontSize: 12 }}>
                  <Circle size={14} color={currentStatus === "DELIVERING" ? "#059669" : "#cbd5e1"} />
                  <Box component="span" sx={{ fontWeight: 700 }}>Đang giao</Box> → Theo dõi đến khi giao thành công
                </Box>
              </Box>
            </Paper>

          </Box>
      </Box>
    </Box>
  );
}
