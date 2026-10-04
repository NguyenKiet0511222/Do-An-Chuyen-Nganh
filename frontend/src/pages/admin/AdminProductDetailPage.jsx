import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Grid,
  Link,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import WireframeNoteBox from "./components/WireframeNoteBox";
import { DETAILED_PRODUCT_REVIEW } from "../../data/adminMockData";

export default function AdminProductDetailPage() {
  const navigate = useNavigate();
  const product = DETAILED_PRODUCT_REVIEW;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const handleQuickReasonClick = (chipText) => {
    if (!reason.includes(chipText)) {
      setReason((prev) => (prev ? `${prev}, ${chipText.toLowerCase()}` : chipText));
    }
  };

  const handleApprove = () => {
    setToastMsg(`Đã duyệt sản phẩm ${product.name} thành công!`);
    setTimeout(() => navigate("/admin/products"), 1500);
  };

  const handleRequestChanges = () => {
    if (!reason.trim()) {
      setToastMsg("Vui lòng nhập lý do yêu cầu bổ sung.");
      return;
    }
    setToastMsg(`Đã gửi yêu cầu bổ sung thông tin tới ${product.seller.name}.`);
    setTimeout(() => navigate("/admin/products"), 1500);
  };

  const handleReject = () => {
    if (!reason.trim()) {
      setToastMsg("Vui lòng nhập lý do từ chối sản phẩm.");
      return;
    }
    setToastMsg(`Đã từ chối duyệt sản phẩm ${product.name}.`);
    setTimeout(() => navigate("/admin/products"), 1500);
  };

  const wireframeNotes = [
    "1. Thư viện ảnh: mỗi ảnh hiển thị nhãn AI riêng; ảnh nghi hỏng được viền đậm để admin thấy ngay.",
    "2. Bảng kết quả AI: tổng hợp từ API Python (FastAPI MobileNetV2) trả về cho từng ảnh; có kiểm tra chéo loại nông sản nhận diện với danh mục người bán chọn.",
    "3. Thông tin người bán: lịch sử duyệt / từ chối giúp admin đánh giá độ tin cậy của người bán.",
    "4. Quyết định duyệt: 3 hành động Duyệt / Yêu cầu bổ sung / Từ chối; lý do có sẵn các mẫu nhanh, sẽ gửi thông báo cho người bán.",
    "5. Lịch sử: lưu vết ai làm gì, lúc nào (audit log)."
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator="/" sx={{ mb: 1.5, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin/products" color="inherit" underline="hover">
          Sản phẩm
        </Link>
        <Link component={RouterLink} to="/admin/products" color="inherit" underline="hover">
          Chờ duyệt
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          {product.name}
        </Typography>
      </Breadcrumbs>

      {/* Header Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/admin/products")}
            startIcon={<ArrowLeft size={16} />}
            sx={{ textTransform: "none", fontSize: 13, borderColor: "#cbd5e1", color: "#334155" }}
          >
            Quay lại
          </Button>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
            Chi tiết & duyệt sản phẩm
          </Typography>
        </Box>
      </Box>

      {/* Main 2-Column Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Image Gallery + AI Inspection Result */}
        <Grid item xs={12} lg={6}>
          {/* Card: Ảnh sản phẩm (4) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Ảnh sản phẩm ({product.images.length})
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
                1
              </Box>
            </Box>

            {/* Main Preview Image */}
            <Box
              sx={{
                width: "100%",
                height: 380,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#0f172a",
                position: "relative",
                border: product.images[activeImageIndex].isRotten ? "2px solid #ef4444" : "1px solid #e2e8f0"
              }}
            >
              <img
                src={product.images[activeImageIndex].url}
                alt={product.images[activeImageIndex].title}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  bgcolor: product.images[activeImageIndex].isRotten ? "rgba(239, 68, 68, 0.9)" : "rgba(15, 23, 42, 0.8)",
                  color: "#fff",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  backdropFilter: "blur(4px)"
                }}
              >
                {product.images[activeImageIndex].title} · {product.images[activeImageIndex].badge}
              </Box>
            </Box>

            {/* 4 Thumbnails with AI badges */}
            <Grid container spacing={1.5} sx={{ mt: 1 }}>
              {product.images.map((img, idx) => {
                const isActive = activeImageIndex === idx;
                return (
                  <Grid item xs={3} key={img.id}>
                    <Box
                      onClick={() => setActiveImageIndex(idx)}
                      sx={{
                        borderRadius: 1.5,
                        overflow: "hidden",
                        border: img.isRotten
                          ? "2.5px solid #ef4444"
                          : isActive
                          ? "2.5px solid #0f172a"
                          : "1px solid #cbd5e1",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        "&:hover": { transform: "scale(1.02)" }
                      }}
                    >
                      <Box sx={{ height: 80, bgcolor: "#f1f5f9" }}>
                        <img
                          src={img.url}
                          alt={img.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </Box>
                      <Box
                        sx={{
                          py: 0.4,
                          textAlign: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: img.isRotten ? "#0f172a" : "#f8fafc",
                          color: img.isRotten ? "#f87171" : "#16a34a",
                          borderTop: "1px solid #e2e8f0"
                        }}
                      >
                        {img.badge}
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>

          {/* Card: Kết quả kiểm định AI (2) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Kết quả kiểm định AI
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

            <Table size="small" sx={{ "& td": { py: 1.2, fontSize: 13 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", width: "45%" }}>Ảnh được kiểm định</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{product.aiReport.totalScanned}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Ảnh gắn nhãn tươi</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#16a34a" }}>
                    {product.aiReport.freshCountText}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Ảnh nghi hỏng</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        bgcolor: "#0f172a",
                        color: "#f87171",
                        px: 1,
                        py: 0.2,
                        borderRadius: 1,
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {product.aiReport.rottenCountText}
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Loại nông sản nhận diện</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{product.aiReport.recognizedProduce}</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#fffbeb" }}>
                  <TableCell sx={{ color: "#b45309", fontWeight: 700 }}>Đề xuất của hệ thống</TableCell>
                  <TableCell sx={{ color: "#b45309", fontWeight: 800 }}>
                    {product.aiReport.systemSuggestion}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Right Column: Product Info, Seller Info, Approval Decision, Audit Log */}
        <Grid item xs={12} lg={6}>
          {/* Card: Thông tin sản phẩm */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Thông tin sản phẩm
              </Typography>
              <Chip
                size="small"
                label={product.status}
                variant="outlined"
                sx={{ borderStyle: "dashed", borderColor: "#64748b", color: "#334155", fontSize: 11 }}
              />
            </Box>

            <Table size="small" sx={{ "& td": { py: 1, fontSize: 13 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", width: "30%" }}>Tên sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14 }}>{product.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Mã SP</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{product.id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Danh mục</TableCell>
                  <TableCell>{product.category}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Giá bán</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                    {product.price.toLocaleString("vi-VN")} đ / {product.unit}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Tồn kho</TableCell>
                  <TableCell>
                    {product.stock} {product.unit}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Xuất xứ</TableCell>
                  <TableCell>{product.origin}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", verticalAlign: "top" }}>Mô tả</TableCell>
                  <TableCell sx={{ color: "text.secondary", lineHeight: 1.6 }}>{product.description}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {/* Card: Người bán (3) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Người bán
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
              <Link href="#seller-profile" underline="hover" sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                Hồ sơ
              </Link>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: "#0f172a", fontSize: 14, fontWeight: 700 }}>
                {product.seller.avatar}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={700} sx={{ color: "#0f172a" }}>
                  {product.seller.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tham gia {product.seller.joinDate} · {product.seller.approvedCount} SP đã duyệt ·{" "}
                  {product.seller.rejectedCount} SP bị từ chối · Đánh giá {product.seller.rating}/5
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Card: Quyết định duyệt (4) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Quyết định duyệt
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

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 12.5 }}>
              Lý do (bắt buộc khi từ chối / yêu cầu bổ sung)
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Nhập lý do gửi cho người bán..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mb: 1.5, "& textarea": { fontSize: 13 } }}
            />

            {/* Quick Reason Chips */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 2.5 }}>
              {product.quickReasons.map((chipText) => (
                <Chip
                  key={chipText}
                  label={chipText}
                  size="small"
                  onClick={() => handleQuickReasonClick(chipText)}
                  sx={{
                    fontSize: 11.5,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#e2e8f0" }
                  }}
                />
              ))}
            </Box>

            {/* 3 Action Buttons matching wireframe */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="contained"
                onClick={handleApprove}
                sx={{
                  flex: 1.2,
                  bgcolor: "#0f172a",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: 13.5,
                  "&:hover": { bgcolor: "#1e293b" }
                }}
              >
                Duyệt sản phẩm
              </Button>

              <Button
                variant="outlined"
                onClick={handleRequestChanges}
                sx={{
                  flex: 1.2,
                  borderColor: "#64748b",
                  color: "#1e293b",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 13.5
                }}
              >
                Yêu cầu bổ sung
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={handleReject}
                sx={{
                  flex: 0.8,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 13.5
                }}
              >
                Từ chối
              </Button>
            </Box>
          </Paper>

          {/* Card: Lịch sử (5) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Lịch sử
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
              {product.history.map((event, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1.5, position: "relative" }}>
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
      </Grid>



      {/* Feedback Toast */}
      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={3000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
