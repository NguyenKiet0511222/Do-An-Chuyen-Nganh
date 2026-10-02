import { Box, Typography, Paper, Grid, TextField, Button, Chip, Divider, Checkbox, FormControlLabel, Breadcrumbs, IconButton } from "@mui/material";
import { Link } from "react-router-dom";
import { UploadCloud, X, AlertTriangle, CheckCircle2, ChevronRight, Package, ImagePlus } from "lucide-react";

export default function SellerProductFormPage() {
  return (
    <Box sx={{ pb: 4, maxWidth: 1000, margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Package size={28} color="#10b981" />
          Quản lý sản phẩm
        </Typography>
      </Box>

      <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ mb: 3, fontSize: 14 }}>
        <Link to="/seller/products" style={{ color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>Sản phẩm</Link>
        <Typography color="text.primary" fontWeight={700} fontSize={14}>Sửa: Cam sành loại 2</Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ p: 2, mb: 4, bgcolor: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 2, borderRadius: 3 }}>
        <Chip icon={<AlertTriangle size={16} />} label="Từ chối duyệt" size="small" sx={{ bgcolor: "#ef4444", color: "#fff", fontWeight: 700, borderRadius: 1.5, px: 1, ".MuiChip-icon": { color: "#fff" } }} />
        <Typography variant="body2" sx={{ color: "#991b1b", fontWeight: 500 }}>
          <strong style={{ fontWeight: 700 }}>Lý do từ admin:</strong> Ảnh sản phẩm có dấu hiệu hỏng (AI phát hiện 85%), vui lòng chụp lại ảnh thật của lô hàng để đảm bảo chất lượng.
        </Typography>
      </Paper>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            
            {/* Thông tin sản phẩm */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                Thông tin cơ bản
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>Tên sản phẩm <span style={{ color: "#ef4444" }}>*</span></Typography>
                  <TextField size="small" fullWidth defaultValue="Cam sành loại 2" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>Danh mục <span style={{ color: "#ef4444" }}>*</span></Typography>
                  <TextField size="small" fullWidth select SelectProps={{ native: true }} defaultValue="Trái cây nhiệt đới">
                    <option value="Trái cây nhiệt đới">Trái cây nhiệt đới</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>Giá bán (₫) <span style={{ color: "#ef4444" }}>*</span></Typography>
                  <TextField size="small" fullWidth defaultValue="20.000" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>Đơn vị <span style={{ color: "#ef4444" }}>*</span></Typography>
                  <TextField size="small" fullWidth select SelectProps={{ native: true }} defaultValue="kg">
                    <option value="kg">kg</option>
                    <option value="hộp">hộp</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>Tồn kho <span style={{ color: "#ef4444" }}>*</span></Typography>
                  <TextField size="small" fullWidth defaultValue="100" />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>Xuất xứ</Typography>
                  <TextField size="small" fullWidth defaultValue="Cao Lãnh, Đồng Tháp" />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>Mô tả chi tiết</Typography>
                  <TextField size="small" fullWidth multiline rows={5} defaultValue="Cam sành loại 2, vỏ có vết, ruột vẫn mọng nước. Thích hợp để vắt nước." />
                </Grid>
              </Grid>
            </Paper>

            {/* Ảnh sản phẩm */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>
                  Hình ảnh sản phẩm
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 600 }}>1 / 5 ảnh</Typography>
              </Box>
              
              <Box sx={{ 
                border: "2px dashed #d1d5db", 
                borderRadius: 3, 
                p: 5, 
                textAlign: "center", 
                bgcolor: "#f9fafb", 
                cursor: "pointer", 
                mb: 4,
                transition: "all 0.2s",
                "&:hover": { borderColor: "#10b981", bgcolor: "#ecfdf5" }
              }}>
                <ImagePlus size={40} color="#9ca3af" style={{ margin: "0 auto", marginBottom: 12 }} />
                <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ color: "#374151" }}>
                  Kéo thả hoặc nhấn để chọn ảnh
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  JPG, PNG hoặc WEBP ≤ 5 MB. AI sẽ tự động phân tích chất lượng ảnh.
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {/* Image 1 (Error) */}
                <Box sx={{ position: "relative" }}>
                  <Box sx={{ 
                    width: 120, height: 120, 
                    borderRadius: 3, overflow: "hidden",
                    border: "2px solid #ef4444",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                    backgroundImage: `url('https://images.unsplash.com/photo-1557800636-894a64c1696f?w=200')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}>
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, bgcolor: "rgba(239, 68, 68, 0.95)", color: "#fff", fontSize: 11, fontWeight: 600, py: 0.5, textAlign: "center", zIndex: 2 }}>
                      Hỏng 85%
                    </Box>
                  </Box>
                  <IconButton size="small" sx={{ position: "absolute", top: -10, right: -10, bgcolor: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", "&:hover": { bgcolor: "#fee2e2", color: "#ef4444" } }}>
                    <X size={16} />
                  </IconButton>
                </Box>

                {/* Image 2 (Uploading/Checking) */}
                <Box sx={{ width: 120, height: 120, border: "2px dashed #d1d5db", bgcolor: "#f9fafb", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                  <div className="loader" style={{ border: "3px solid #f3f3f3", borderTop: "3px solid #10b981", borderRadius: "50%", width: 24, height: 24, animation: "spin 1s linear infinite", marginBottom: 8 }} />
                  <Typography variant="caption" fontWeight={600}>AI đang quét...</Typography>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </Box>
              </Box>

              <Box sx={{ mt: 4, p: 2, bgcolor: "#fffbeb", borderRadius: 2, border: "1px solid #fde68a", display: "flex", gap: 1.5 }}>
                <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: "#b45309", lineHeight: 1.5 }}>
                  <strong>Lưu ý:</strong> Ảnh đầu tiên (bên trái) sẽ là ảnh đại diện. Nếu ảnh bị AI đánh giá là "Hỏng", quản trị viên có khả năng cao sẽ từ chối duyệt sản phẩm.
                </Typography>
              </Box>
            </Paper>

          </Box>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 4 }}>
            
            <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
              <Box sx={{ p: 3, bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <Typography variant="h6" fontWeight={700}>
                  Trạng thái đăng
                </Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Hiện tại:</Typography>
                  <Chip label="Từ chối duyệt" size="small" sx={{ bgcolor: "#fee2e2", color: "#ef4444", fontWeight: 700, borderRadius: 1.5 }} />
                </Box>

                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: "#374151" }}>
                  Điều kiện để được duyệt:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ marginTop: 2 }} />
                    <Typography variant="body2" sx={{ color: "#374151" }}>Có đầy đủ thông tin (Tên, Danh mục, Giá &gt; 0)</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ marginTop: 2 }} />
                    <Typography variant="body2" sx={{ color: "#374151" }}>Tồn kho hợp lệ (≥ 0)</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ width: 18, height: 18, border: "2px solid #d1d5db", borderRadius: "50%", mt: 0.3 }} />
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>Có ít nhất 1 ảnh <strong style={{ color: "#ef4444" }}>không bị đánh dấu Hỏng</strong></Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button variant="outlined" fullWidth sx={{ borderRadius: "10px", py: 1.2, textTransform: "none", color: "#374151", borderColor: "#d1d5db", fontWeight: 600 }}>
                    Lưu thành nháp
                  </Button>
                  <Button variant="contained" fullWidth sx={{ borderRadius: "10px", py: 1.2, textTransform: "none", bgcolor: "#10b981", fontWeight: 700, "&.Mui-disabled": { bgcolor: "#d1d5db", color: "#fff" } }} disabled>
                    Gửi yêu cầu duyệt lại
                  </Button>
                </Box>
              </Box>
            </Paper>

          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
