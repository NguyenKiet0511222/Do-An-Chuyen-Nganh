import { Box, Typography, Grid, Paper, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Divider, IconButton, Tooltip, Avatar } from "@mui/material";
import { Info, DollarSign, Package, ClipboardList, AlertTriangle, ArrowRight, ShieldCheck, TrendingUp, TrendingDown, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

export default function SellerDashboardPage() {
  return (
    <Box sx={{ pb: 4, maxWidth: 1200, margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 1.5 }}>
          Tổng quan cửa hàng
        </Typography>
      </Box>

      {/* Info Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
          bgcolor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 3
        }}
      >
        <Chip icon={<ShieldCheck size={16} />} label="Đã xác minh" size="small" sx={{ bgcolor: "#10b981", color: "#fff", fontWeight: 700, borderRadius: 1.5, ".MuiChip-icon": { color: "#fff" } }} />
        <Typography variant="body1" sx={{ color: "#166534", fontWeight: 500, flex: 1 }}>
          <strong style={{ fontWeight: 700 }}>Vườn rau Tâm An</strong> đang hoạt động tốt · Xác minh từ ngày 15/06/2026
        </Typography>
        <Tooltip title="Cửa hàng của bạn đã gửi giấy tờ chứng nhận an toàn thực phẩm.">
          <IconButton size="small" sx={{ color: "#15803d", bgcolor: "#dcfce7", "&:hover": { bgcolor: "#bbf7d0" } }}>
            <Info size={18} />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: "Doanh thu hôm nay", value: "1.240.000 ₫", sub: "Tăng 12% so với hôm qua", icon: <DollarSign size={24} color="#10b981" />, trend: "up", color: "#10b981", bg: "#dcfce7" },
          { title: "Đơn chờ xác nhận", value: "4", sub: "Cần xác nhận trong 24h", icon: <ClipboardList size={24} color="#f59e0b" />, trend: "neutral", color: "#f59e0b", bg: "#fef3c7" },
          { title: "Sản phẩm chờ duyệt", value: "1", sub: "Dưa chuột baby", icon: <Package size={24} color="#3b82f6" />, trend: "neutral", color: "#3b82f6", bg: "#dbeafe" },
          { title: "Sản phẩm cần sửa", value: "2", sub: "1 từ chối · 1 cần bổ sung", icon: <AlertTriangle size={24} color="#ef4444" />, trend: "down", color: "#ef4444", bg: "#fee2e2" }
        ].map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper elevation={0} sx={{ p: 3, height: "100%", borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", top: -15, right: -15, width: 80, height: 80, borderRadius: "50%", bgcolor: card.bg, opacity: 0.5, zIndex: 0 }} />
              
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {card.title}
                  </Typography>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ my: 1, color: "#111827" }}>
                  {card.value}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {card.trend === "up" && <TrendingUp size={14} color="#10b981" />}
                  {card.trend === "down" && <TrendingDown size={14} color="#ef4444" />}
                  <Typography variant="caption" sx={{ color: card.trend === "up" ? "#10b981" : card.trend === "down" ? "#ef4444" : "#6b7280", fontWeight: 600 }}>
                    {card.sub}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Two Columns Area */}
      <Grid container spacing={3}>
        {/* Left Column: Orders */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper elevation={0} sx={{ height: "100%", borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: "#111827" }}>
                Đơn hàng mới cần xử lý
              </Typography>
              <Button component={Link} to="/seller/orders" size="small" endIcon={<ArrowRight size={16} />} sx={{ textTransform: "none", color: "#10b981", fontWeight: 700 }}>
                Xem tất cả
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fff" }}>
                    <TableCell sx={{ fontWeight: 600, color: "#6b7280", py: 2 }}>Mã đơn</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Khách hàng</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Số SP</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Tổng tiền</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Đặt lúc</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "#6b7280" }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { id: "DH-2026-00003", customer: "Lê Văn Nam", qty: 1, total: "160.000 ₫", time: "Hôm nay, 16:45" },
                    { id: "DH-2026-00006", customer: "Phạm Thu Hà", qty: 2, total: "165.000 ₫", time: "Hôm nay, 18:10" },
                    { id: "DH-2026-00007", customer: "Ngô Minh Tuấn", qty: 1, total: "200.000 ₫", time: "Hôm qua, 07:45" }
                  ].map((row) => (
                    <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f9fafb" }, transition: "background 0.2s" }}>
                      <TableCell sx={{ borderBottom: "1px solid #f3f4f6", fontWeight: 700, color: "#111827" }}>{row.id}</TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #f3f4f6", fontWeight: 600, color: "#4b5563" }}>{row.customer}</TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                        <Chip label={`${row.qty} món`} size="small" sx={{ bgcolor: "#f3f4f6", color: "#4b5563", fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #f3f4f6", fontWeight: 700, color: "#ef4444" }}>{row.total}</TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{row.time}</TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }} align="right">
                        <Button variant="contained" size="small" sx={{ textTransform: "none", bgcolor: "#10b981", boxShadow: "none", borderRadius: 2, px: 2 }}>
                          Xác nhận
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={5} lg={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, height: "100%" }}>
            
            {/* Sản phẩm cần sửa */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#111827" }}>
                  Sản phẩm cần sửa
                </Typography>
                <Button component={Link} to="/seller/products" size="small" sx={{ textTransform: "none", color: "#10b981", fontWeight: 700 }}>
                  Quản lý
                </Button>
              </Box>
              <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                {[
                  { name: "Cam sành loại 2", image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=100", badge: "Từ chối", badgeColor: "error", desc: "Ảnh có dấu hiệu hỏng (AI 85%), cần chụp lại." },
                  { name: "Quýt đường", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=100", badge: "Cần bổ sung", badgeColor: "warning", desc: "Ảnh mờ, AI không thể nhận diện chính xác." }
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Avatar variant="rounded" src={item.image} sx={{ width: 64, height: 64, borderRadius: 2, border: "1px solid #e5e7eb" }} />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#111827">{item.name}</Typography>
                        <Chip label={item.badge} size="small" color={item.badgeColor} sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.4 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Nhãn AI của shop */}
            <Paper elevation={0} sx={{ flexGrow: 1, borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: "#111827" }}>
                  Đánh giá AI (30 ngày)
                </Typography>
                <Typography variant="body2" sx={{ mb: 2.5, color: "#4b5563" }}>
                  Phân tích trên tổng số 120 ảnh sản phẩm
                </Typography>
                
                {/* Progress bar simulation */}
                <Box sx={{ height: 16, bgcolor: "#e5e7eb", borderRadius: 8, display: "flex", overflow: "hidden", mb: 2 }}>
                  <Tooltip title="Tươi: 92%">
                    <Box sx={{ width: "92%", bgcolor: "#10b981", "&:hover": { opacity: 0.9 } }}></Box>
                  </Tooltip>
                  <Tooltip title="Không chắc: 6%">
                    <Box sx={{ width: "6%", bgcolor: "#f59e0b", "&:hover": { opacity: 0.9 } }}></Box>
                  </Tooltip>
                  <Tooltip title="Hỏng: 2%">
                    <Box sx={{ width: "2%", bgcolor: "#ef4444", "&:hover": { opacity: 0.9 } }}></Box>
                  </Tooltip>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10b981" }} />
                    <Typography variant="caption" fontWeight={600} color="#374151">Tươi (92%)</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#f59e0b" }} />
                    <Typography variant="caption" fontWeight={600} color="#374151">Mờ (6%)</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#ef4444" }} />
                    <Typography variant="caption" fontWeight={600} color="#374151">Hỏng (2%)</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
