import { Box, Typography, Paper, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Breadcrumbs, Divider, TextField, Chip, Avatar, Stepper, Step, StepLabel, StepConnector, stepConnectorClasses, styled } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, MapPin, Phone, User, Package, Clock, Truck, Store, Receipt } from "lucide-react";

// Custom Stepper styles for modern look
const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#10b981' },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#10b981' },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#e5e7eb',
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const QontoStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  color: '#e5e7eb',
  display: 'flex',
  height: 22,
  alignItems: 'center',
  ...(ownerState.active && { color: '#10b981' }),
  '& .QontoStepIcon-completedIcon': { color: '#10b981', zIndex: 1, fontSize: 24 },
  '& .QontoStepIcon-circle': { width: 14, height: 14, borderRadius: '50%', backgroundColor: 'currentColor' },
}));

function QontoStepIcon(props) {
  const { active, completed, className } = props;
  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? <CheckCircle2 className="QontoStepIcon-completedIcon" /> : <div className="QontoStepIcon-circle" />}
    </QontoStepIconRoot>
  );
}

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  
  const steps = ["Khách đặt hàng", "Chờ xác nhận", "Đang chuẩn bị", "Đang giao", "Hoàn thành"];
  const currentStep = 1; // 0-indexed, so 1 = "Chờ xác nhận"
  
  return (
    <Box sx={{ pb: 4, maxWidth: 1200, margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Receipt size={28} color="#10b981" />
          Chi tiết đơn hàng
        </Typography>
      </Box>

      <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ mb: 4, fontSize: 14 }}>
        <Link to="/seller/orders" style={{ color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>Đơn hàng</Link>
        <Typography color="text.primary" fontWeight={700} fontSize={14}>{id || "DH-2026-00003"}</Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 3, mb: 5 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Typography variant="h5" fontWeight={800} color="#111827">{id || "DH-2026-00003"}</Typography>
              <Chip label="Chờ xác nhận" size="small" color="warning" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, color: "#4b5563" }}>
              <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Clock size={16} /> Đặt lúc: 13/09/2026 16:45
              </Typography>
              <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Package size={16} /> Thanh toán: COD
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" color="error" sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}>Từ chối / Hủy đơn</Button>
            <Button variant="contained" sx={{ bgcolor: "#10b981", textTransform: "none", fontWeight: 700, borderRadius: 2, px: 4, boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
              Xác nhận đơn
            </Button>
          </Box>
        </Box>

        {/* Modern Timeline */}
        <Box sx={{ width: "100%", px: { xs: 0, md: 4 } }}>
          <Stepper alternativeLabel activeStep={currentStep} connector={<QontoConnector />}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel StepIconComponent={QontoStepIcon}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>{label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7} lg={8}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            
            {/* Sản phẩm cần chuẩn bị */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", overflow: "hidden" }}>
              <Box sx={{ p: 3, bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#111827", display: "flex", alignItems: "center", gap: 1 }}>
                  Sản phẩm trong đơn (1)
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280", py: 2 }}>Sản phẩm</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280" }} align="center">SL</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280" }} align="right">Đơn giá</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280" }} align="right">Thành tiền</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#6b7280" }} align="right">Tồn kho sau đơn</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Avatar variant="rounded" src="https://images.unsplash.com/photo-1518977672816-c87948c3b7a5?w=100" sx={{ width: 48, height: 48, borderRadius: 2 }} />
                          <Typography variant="subtitle2" fontWeight={700} color="#111827">Khoai tây Đà Lạt</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label="5 kg" size="small" sx={{ fontWeight: 600, bgcolor: "#f1f5f9", color: "#334155" }} />
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#4b5563" }}>28.000 ₫</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: "#111827" }}>140.000 ₫</TableCell>
                      <TableCell align="right" sx={{ color: "#10b981", fontWeight: 600 }}>495 kg</TableCell>
                    </TableRow>
                    
                    {/* Summary rows */}
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell colSpan={3} align="right" sx={{ color: "#6b7280", fontWeight: 500, borderBottom: "none" }}>Tạm tính</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "#374151", borderBottom: "none" }}>140.000 ₫</TableCell>
                      <TableCell sx={{ borderBottom: "none" }}></TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell colSpan={3} align="right" sx={{ color: "#6b7280", fontWeight: 500, borderBottom: "none" }}>Phí ship (khách trả)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "#374151", borderBottom: "none" }}>20.000 ₫</TableCell>
                      <TableCell sx={{ borderBottom: "none" }}></TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 800, color: "#111827", fontSize: 16 }}>Khách thanh toán COD</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: 18, color: "#ef4444" }}>160.000 ₫</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Lịch sử */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: "#111827" }}>
                Lịch sử đơn hàng
              </Typography>
              <Box sx={{ display: "flex", gap: 3, mt: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "#10b981", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#fff" }} />
                  </Box>
                  <Box sx={{ width: 2, height: 40, bgcolor: "#e5e7eb", my: 0.5 }}></Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#111827">Khách đặt hàng</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>13/09/2026 16:45 · Lê Văn Nam</Typography>
                </Box>
              </Box>
            </Paper>

          </Box>
        </Grid>

        <Grid item xs={12} md={5} lg={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            
            {/* Khách hàng */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: "#111827" }}>
                Thông tin khách hàng
              </Typography>
              
              <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <User size={20} color="#6b7280" style={{ flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} color="#111827">Lê Văn Nam</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Phone size={20} color="#6b7280" style={{ flexShrink: 0 }} />
                  <Typography variant="body2" color="#374151" fontWeight={600}>0987 654 321</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <MapPin size={20} color="#6b7280" style={{ flexShrink: 0 }} />
                  <Typography variant="body2" color="#4b5563" lineHeight={1.5}>Số 101 Nguyễn Văn Linh, Tân Phong, Quận 7, TP. HCM</Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>Ghi chú: (không có)</Typography>
              
              <Button variant="outlined" fullWidth sx={{ mt: 3, textTransform: "none", color: "#10b981", borderColor: "#10b981", fontWeight: 700, borderRadius: 2 }}>
                Gọi cho khách
              </Button>
            </Paper>

            {/* Bước tiếp theo */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", bgcolor: "#f8fafc" }}>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: "#111827" }}>
                Bước tiếp theo
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, mb: 3, color: "#64748b" }}>
                Hướng dẫn xử lý đơn hàng theo trạng thái hiện tại.
              </Typography>
              
              <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: 2, border: "1px solid #e2e8f0", mb: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: "#111827" }}><strong style={{ color: "#f59e0b" }}>Chờ xác nhận</strong> <ChevronRight size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Xác nhận đơn</Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}><strong>Đã xác nhận</strong> <ChevronRight size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Bắt đầu chuẩn bị</Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}><strong>Đang chuẩn bị</strong> <ChevronRight size={14} style={{ display: "inline", verticalAlign: "middle" }} /> Giao hàng (nhập mã vận đơn)</Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1.5, color: "#1e293b", fontWeight: 700 }}>
                Ghi chú nội bộ khi đổi trạng thái (Tùy chọn)
              </Typography>
              <TextField 
                multiline 
                rows={3} 
                fullWidth 
                placeholder="VD: giao qua GHN, mã 1A2B3C4D..." 
                sx={{ 
                  "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: 2 },
                  "& fieldset": { borderColor: "#e2e8f0" }
                }} 
              />
            </Paper>

          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
