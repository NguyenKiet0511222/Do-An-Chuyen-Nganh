import { Box, Typography, Paper, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, TextField, Chip, Divider, Avatar, IconButton } from "@mui/material";
import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, AlertTriangle, Store, MapPin, Phone, Edit3 } from "lucide-react";

export default function SellerInfoAIPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const aiResults = [
    { image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=100", name: "Cam sành loại 2", badge: "Hỏng 85%", badgeColor: "error", admin: "Đã xác nhận hỏng", action: "Thay ảnh ngay" },
    { image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=100", name: "Quýt đường", badge: "Không chắc 64%", badgeColor: "warning", admin: "Chờ admin duyệt", action: "Cập nhật ảnh" },
    { image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100", name: "Dâu tây Đà Lạt", badge: "Tươi 89%", badgeColor: "success", admin: "Hệ thống duyệt", action: "—" }
  ];

  return (
    <Box sx={{ pb: 4, maxWidth: 1000, margin: "0 auto" }}>
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Store size={28} color="#10b981" />
          Hồ sơ Cửa hàng & Kiểm định AI
        </Typography>
      </Box>

      <Paper sx={{ mb: 4, borderRadius: 3, p: 1, display: "inline-block", bgcolor: "#f9fafb", border: "1px solid #e5e7eb" }} elevation={0}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          TabIndicatorProps={{ style: { display: "none" } }}
          sx={{ minHeight: 40 }}
        >
          <Tab 
            disableRipple
            label="Thông tin chung" 
            sx={{ 
              textTransform: "none", 
              fontWeight: 600, 
              minHeight: 40,
              borderRadius: 2,
              px: 3,
              color: tabValue === 0 ? "#fff !important" : "#6b7280",
              bgcolor: tabValue === 0 ? "#111827" : "transparent",
              transition: "all 0.3s",
            }} 
          />
          <Tab 
            disableRipple
            label="Kết quả quét AI" 
            sx={{ 
              textTransform: "none", 
              fontWeight: 600, 
              minHeight: 40,
              borderRadius: 2,
              px: 3,
              color: tabValue === 1 ? "#fff !important" : "#6b7280",
              bgcolor: tabValue === 1 ? "#10b981" : "transparent",
              transition: "all 0.3s",
            }} 
          />
        </Tabs>
      </Paper>

      {/* Tab 0: Thông tin shop */}
      {tabValue === 0 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", bgcolor: "#fff", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
          
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 3, mb: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box sx={{ position: "relative" }}>
                <Avatar 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=200" 
                  sx={{ width: 100, height: 100, border: "4px solid #f3f4f6", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
                />
                <IconButton 
                  size="small" 
                  sx={{ position: "absolute", bottom: -4, right: -4, bgcolor: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", "&:hover": { bgcolor: "#f9fafb" } }}
                >
                  <UploadCloud size={16} color="#4b5563" />
                </IconButton>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>Vườn rau Tâm An</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Đã tham gia từ 15/06/2026</Typography>
                <Chip 
                  icon={<CheckCircle2 size={16} />} 
                  label="Đã xác minh danh tính" 
                  size="small" 
                  sx={{ bgcolor: "#ecfdf5", color: "#059669", fontWeight: 600, px: 0.5, ".MuiChip-icon": { color: "#059669" } }} 
                />
              </Box>
            </Box>
            <Button variant="outlined" color="primary" startIcon={<Edit3 size={18} />} sx={{ borderRadius: "8px" }}>
              Đổi mật khẩu
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Store size={16} color="#9ca3af" /> Tên cửa hàng
              </Typography>
              <TextField fullWidth defaultValue="Vườn rau Tâm An" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <MapPin size={16} color="#9ca3af" /> Tỉnh / thành phố
              </Typography>
              <TextField fullWidth select SelectProps={{ native: true }} defaultValue="Lâm Đồng">
                <option value="Lâm Đồng">Lâm Đồng</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. HCM">TP. Hồ Chí Minh</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <MapPin size={16} color="#9ca3af" /> Địa chỉ kho hàng / lấy hàng
              </Typography>
              <TextField fullWidth defaultValue="Thôn Đa Quý, xã Xuân Thọ, TP. Đà Lạt" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Phone size={16} color="#9ca3af" /> Số điện thoại liên hệ
              </Typography>
              <TextField fullWidth defaultValue="0905 111 222" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Edit3 size={16} color="#9ca3af" /> Giới thiệu cửa hàng
              </Typography>
              <TextField fullWidth multiline rows={3} defaultValue="Rau củ Đà Lạt trồng nhà kính, thu hoạch trong ngày, không thuốc trừ sâu. Đảm bảo chất lượng tươi xanh khi đến tay khách hàng." />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="text" color="inherit" sx={{ color: "#6b7280" }}>Hủy</Button>
            <Button variant="contained" color="primary" sx={{ px: 4, py: 1.5, borderRadius: "10px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}>
              Lưu thay đổi
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tab 1: Kết quả AI */}
      {tabValue === 1 && (
        <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e5e7eb", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
          <Box sx={{ p: 3, bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AlertCircle size={20} color="#f59e0b" />
              Hình ảnh cần lưu ý
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Tổng 30 ngày: <strong style={{ color: "#111827" }}>24</strong> ảnh được quét
            </Typography>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Ảnh sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Tên sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Kết quả AI</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Trạng thái duyệt</TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #e5e7eb", textAlign: "right" }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {aiResults.map((row, idx) => (
                  <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#f9fafb" }, transition: "background 0.2s" }}>
                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                      <Avatar src={row.image} variant="rounded" sx={{ width: 52, height: 52, border: "1px solid #e5e7eb" }} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6", fontWeight: 600, color: "#111827" }}>{row.name}</TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                      <Chip 
                        icon={row.badgeColor === "error" ? <AlertTriangle size={14} /> : row.badgeColor === "warning" ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                        label={row.badge} 
                        color={row.badgeColor}
                        size="small"
                        sx={{ fontWeight: 700, borderRadius: "6px", px: 0.5 }} 
                      />
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6", color: "#4b5563" }}>{row.admin}</TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                      {row.action !== "—" ? (
                        <Button size="small" variant="outlined" color="primary" sx={{ borderRadius: "8px", textTransform: "none", py: 0.5 }}>
                          {row.action}
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ p: 2, bgcolor: "#ecfdf5", m: 3, borderRadius: 2, border: "1px solid #a7f3d0", display: "flex", gap: 2 }}>
            <CheckCircle2 size={24} color="#059669" />
            <Box>
              <Typography variant="subtitle2" sx={{ color: "#065f46", fontWeight: 700 }}>Tỷ lệ chất lượng rất tốt!</Typography>
              <Typography variant="body2" sx={{ color: "#047857" }}>92% sản phẩm của bạn được AI đánh giá là Tươi (Tươi &gt; 85%). Hãy tiếp tục phát huy nhé.</Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
