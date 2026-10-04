import { Box, Typography, Paper, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, TextField, Chip, Avatar } from "@mui/material";
import { useState } from "react";
import { Upload, Save, CheckCircle2, Check } from "lucide-react";

export default function SellerInfoAIPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const aiResults = [
    { image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=100", name: "Cam sành loại 2", badge: "Hỏng 85%", badgeStyle: { bgcolor: "#f43f5e", color: "#fff", border: "none" }, admin: "Đã xác nhận hỏng", action: "Thay ảnh" },
    { image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=100", name: "Quýt đường", badge: "Không chắc 64%", badgeStyle: { bgcolor: "#fffbeb", color: "#d97706", border: "1px solid #fcd34d" }, admin: "Chờ admin duyệt", action: "Thay ảnh" },
    { image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100", name: "Dâu tây Đà Lạt", badge: "Tươi 89%", badgeStyle: { bgcolor: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }, admin: "Tự chấp nhận", action: "—" }
  ];

  return (
    <Box sx={{ pb: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Title & Description */}
      <Box sx={{ spaceY: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Thông tin shop & kết quả AI
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5 }}>
          Quản lý định danh cơ sở, thông tin liên lạc và báo cáo xếp hạng chất lượng AI.
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: "1px solid #e2e8f0" }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          TabIndicatorProps={{ sx: { bgcolor: "#059669", height: 2 } }}
        >
          <Tab 
            disableRipple
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Thông tin shop
                <Box sx={{ px: 1, py: 0.25, borderRadius: 10, fontSize: 11, fontWeight: 600, bgcolor: tabValue === 0 ? "#d1fae5" : "#f1f5f9", color: tabValue === 0 ? "#065f46" : "#64748b" }}>
                  1
                </Box>
              </Box>
            } 
            sx={{ 
              textTransform: "none", 
              fontWeight: tabValue === 0 ? 700 : 500, 
              color: tabValue === 0 ? "#047857 !important" : "#64748b",
              fontSize: 14,
              px: 3,
              minHeight: "auto",
              py: 2
            }} 
          />
          <Tab 
            disableRipple
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Kết quả AI của shop
                <Box sx={{ px: 1, py: 0.25, borderRadius: 10, fontSize: 11, fontWeight: 600, bgcolor: tabValue === 1 ? "#d1fae5" : "#f1f5f9", color: tabValue === 1 ? "#065f46" : "#64748b" }}>
                  2
                </Box>
              </Box>
            } 
            sx={{ 
              textTransform: "none", 
              fontWeight: tabValue === 1 ? 700 : 500, 
              color: tabValue === 1 ? "#047857 !important" : "#64748b",
              fontSize: 14,
              px: 3,
              minHeight: "auto",
              py: 2
            }} 
          />
        </Tabs>
      </Box>

      {/* Tab 0: Thông tin shop */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Left/Main Form */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 3, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              {/* Card Header With Status */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, borderBottom: "1px solid #f1f5f9" }}>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Thông tin shop</Typography>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.5 }}>Cập nhật hồ sơ hiển thị công khai với khách hàng</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: 10, fontSize: 12, fontWeight: 600, bgcolor: "#ecfdf5", color: "#047857", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <CheckCircle2 size={14} />
                    Đã xác minh
                  </Box>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>15/06/2026</Typography>
                </Box>
              </Box>

              {/* Logo Upload Section */}
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: 3 }}>
                <Avatar 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=200" 
                  variant="rounded"
                  sx={{ width: 80, height: 80, border: "2px solid #f1f5f9", borderRadius: 3 }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Button variant="outlined" size="small" startIcon={<Upload size={14} />} sx={{ color: "#334155", borderColor: "#cbd5e1", textTransform: "none", borderRadius: 2, fontWeight: 600, "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" } }}>
                      Đổi logo
                    </Button>
                    <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>PNG/JPG, vuông, ≤ 2 MB</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: "#64748b" }}>Hình ảnh rõ nét giúp nhận diện thương hiệu tốt hơn trong báo cáo AI.</Typography>
                </Box>
              </Box>

              {/* Main Input Fields Grid */}
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Tên shop</Typography>
                  <TextField fullWidth size="small" defaultValue="Vườn rau Tâm An" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Tỉnh / thành</Typography>
                  <TextField fullWidth size="small" select SelectProps={{ native: true }} defaultValue="Lâm Đồng" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }}>
                    <option value="Lâm Đồng">Lâm Đồng</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP. HCM">TP. Hồ Chí Minh</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Địa chỉ lấy hàng</Typography>
                  <TextField fullWidth size="small" defaultValue="Thôn Đa Quý, xã Xuân Thọ, TP. Đà Lạt" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>SĐT shop</Typography>
                  <TextField fullWidth size="small" defaultValue="0905 111 222" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }} />
                </Grid>
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Giới thiệu shop</Typography>
                  <TextField fullWidth multiline rows={3} defaultValue="Rau củ Đà Lạt trồng nhà kính, thu hoạch trong ngày, không thuốc trừ sâu." sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }} />
                  <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.5 }}>Tối đa 250 ký tự hiển thị trên danh thiếp shop.</Typography>
                </Grid>
              </Grid>

              {/* Save CTA */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, pt: 1 }}>
                <Button 
                  variant="contained" 
                  onClick={() => alert("Đã lưu thông tin shop thành công!")}
                  startIcon={<Save size={16} />} 
                  sx={{ bgcolor: "#065f46", "&:hover": { bgcolor: "#064e3b" }, textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3 }}
                >
                  Lưu thay đổi
                </Button>
                <Button variant="text" sx={{ color: "#64748b", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#f1f5f9" } }}>
                  Hủy
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Right Side: AI Trust Guidelines */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b" }}>Tiêu chí hồ sơ nhà vườn</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Check size={16} color="#059669" style={{ marginTop: 2 }} />
                  <Typography sx={{ fontSize: 12, color: "#475569" }}>Tên vườn khớp với giấy chứng nhận VietGAP / GlobalGAP đã đăng ký.</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Check size={16} color="#059669" style={{ marginTop: 2 }} />
                  <Typography sx={{ fontSize: 12, color: "#475569" }}>Địa chỉ kho lấy hàng chuẩn xác để AI tối ưu tuyến đường vận chuyển nhanh.</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Check size={16} color="#059669" style={{ marginTop: 2 }} />
                  <Typography sx={{ fontSize: 12, color: "#475569" }}>Hotline hoạt động 24/7 phục vụ xác thực đơn nông sản thu hoạch sớm.</Typography>
                </Box>
              </Box>
              <Box sx={{ pt: 2, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Trạng thái hồ sơ:</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#047857" }}>Hợp lệ & Sẵn sàng</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Kết quả AI */}
      {tabValue === 1 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
          <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Kết quả AI của shop (ảnh cần chú ý)
            </Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(248, 250, 252, 0.75)" }}>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", py: 2, pl: 4, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Nhãn AI</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9" }}>Admin</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #f1f5f9", pr: 4 }} align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {aiResults.map((row, idx) => (
                  <TableRow key={idx} sx={{ "&:hover": { bgcolor: "rgba(248, 250, 252, 0.8)" } }}>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", py: 2, pl: 4 }}>
                      <Avatar src={row.image} variant="rounded" sx={{ width: 64, height: 64, border: "1px solid #e2e8f0", borderRadius: 2 }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", color: "#1e293b", fontSize: 13, fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }}>
                      <Box sx={{ display: "inline-flex", px: 1.5, py: 0.5, borderRadius: 10, fontSize: 11, fontWeight: 600, ...row.badgeStyle }}>
                        {row.badge}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", color: "#475569", fontSize: 13, fontWeight: 500 }}>{row.admin}</TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", pr: 4 }} align="right">
                      {row.action !== "—" ? (
                        <Typography component="span" sx={{ fontSize: 13, color: "#059669", textDecoration: "none", cursor: "pointer", fontWeight: 600, "&:hover": { textDecoration: "underline", color: "#047857" } }}>
                          {row.action}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ p: 3, borderTop: "1px solid #f1f5f9", bgcolor: "rgba(248, 250, 252, 0.5)" }}>
            <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              Tổng 30 ngày: <Box component="span" sx={{ color: "#0f172a", fontWeight: 600 }}>24 ảnh</Box> · Tươi 22 · Không chắc 1 · Hỏng 1
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
