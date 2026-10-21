import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
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
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { adminApi, resolveAssetUrl } from "../../services/api";
import AiLabelChip from "../../components/ai/AiLabelChip";
import AiReviewActions from "./components/AiReviewActions";
import AiReviewStatusChip from "../../components/ai/AiReviewStatusChip";
import { displayLabelOf, formatProduce, handleImageError, notifyAiPendingChanged } from "./components/aiReview";

const QUICK_REASONS = [
  "Ảnh sản phẩm bị mờ, không rõ ràng",
  "Ảnh có dấu hiệu quả bị hỏng / thối dập",
  "Thiếu thông tin nguồn gốc xuất xứ cụ thể",
  "Tên sản phẩm không khớp với ảnh thực tế",
  "Đơn vị tính hoặc giá bán chưa hợp lý"
];

export default function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // silent = tải lại ngầm (sau khi kiểm định ảnh AI) để không nháy cả trang "Đang tải..."
  const loadProduct = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminApi.product.getById(id);
      setProduct(data);
    } catch (err) {
      console.error("Lỗi khi tải chi tiết sản phẩm admin:", err);
      setToastMsg(err.response?.data?.message || err.message || "Không tìm thấy sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id, loadProduct]);

  const handleQuickReasonClick = (chipText) => {
    if (!reason.includes(chipText)) {
      setReason((prev) => (prev ? `${prev}, ${chipText.toLowerCase()}` : chipText));
    }
  };

  const handleReview = async (action) => {
    if ((action === "REJECT" || action === "NEED_INFO") && !reason.trim()) {
      setToastMsg(`Vui lòng nhập lý do để ${action === "REJECT" ? "từ chối" : "yêu cầu bổ sung"}.`);
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.product.review(id, {
        action,
        reason: reason.trim() || undefined
      });
      setToastMsg(`Thao tác ${action} thành công!`);
      setReason("");
      // Từ chối / yêu cầu bổ sung đưa ảnh chờ kiểm định ra khỏi hàng chờ (docs/1910.md mục 2) -> badge menu tải lại
      notifyAiPendingChanged();
      await loadProduct();
    } catch (err) {
      setToastMsg(err.response?.data?.message || err.message || "Thao tác không thành công");
    } finally {
      setSubmitting(false);
    }
  };

  // Sau khi kiểm định 1 ảnh AI: áp ngay kết quả PATCH trả về (nút của ảnh đó ẩn luôn, tránh bấm lần 2 bị 409
  // trong lúc chờ tải lại), rồi tải lại ngầm sản phẩm (nhãn tổng, trạng thái có thể đổi khi RETAKE)
  const handleAiReviewed = (updated, message) => {
    setToastMsg(message);
    if (updated?.id) {
      setProduct((prev) => prev && {
        ...prev,
        status: updated.product?.status ?? prev.status,
        images: (prev.images || []).map((img) =>
          img.ai?.id === updated.id
            ? {
                ...img,
                ai: {
                  ...img.ai,
                  reviewStatus: updated.reviewStatus,
                  finalLabel: updated.finalLabel,
                  displayLabel: updated.displayLabel,
                  note: updated.note
                }
              }
            : img
        )
      });
    }
    loadProduct(true);
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", py: 8, textAlign: "center" }}>
        <Typography>Đang tải thông tin sản phẩm...</Typography>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", py: 8, textAlign: "center" }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          Không tìm thấy thông tin sản phẩm.
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/admin/products")}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [
    {
      id: 0,
      url: product.primaryImageUrl || "https://placehold.co/400x300?text=No+Image",
      ai: { label: product.aiOverallLabel, confidence: product.aiOverallConfidence }
    }
  ];

  const currentImg = images[activeImageIndex] || images[0];
  // Nhãn hiển thị = nhãn admin chốt (finalLabel) nếu có, không thì nhãn AI
  const currentLabel = displayLabelOf(currentImg.ai);
  const freshCount = images.filter((img) => displayLabelOf(img.ai) === "FRESH").length;
  const rottenCount = images.filter((img) => displayLabelOf(img.ai) === "ROTTEN").length;
  const uncertainCount = images.filter((img) => displayLabelOf(img.ai) === "UNCERTAIN").length;
  const aiImages = images.filter((img) => img.ai?.id);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator="/" sx={{ mb: 1.5, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Quản trị
        </Link>
        <Link component={RouterLink} to="/admin/products" color="inherit" underline="hover">
          Sản phẩm
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
            Chi tiết & Duyệt sản phẩm #{product.id}
          </Typography>
        </Box>
        <Chip
          label={product.status}
          color={product.status === "APPROVED" ? "success" : product.status === "PENDING" ? "warning" : "default"}
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {/* Main 2-Column Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Image Gallery + AI Inspection Result */}
        <Grid item xs={12} lg={6}>
          {/* Card: Ảnh sản phẩm */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Ảnh sản phẩm ({images.length})
            </Typography>

            {/* Main Preview Image */}
            <Box
              sx={{
                width: "100%",
                height: 380,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#0f172a",
                position: "relative",
                border: currentLabel === "ROTTEN" ? "2px solid #ef4444" : "1px solid #e2e8f0"
              }}
            >
              <img
                src={resolveAssetUrl(currentImg.url)}
                alt="Product preview"
                onError={handleImageError}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  bgcolor: currentLabel === "ROTTEN" ? "rgba(239, 68, 68, 0.9)" : "rgba(15, 23, 42, 0.8)",
                  color: "#fff",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  backdropFilter: "blur(4px)"
                }}
              >
                Nhãn AI: {currentLabel === "FRESH" ? "TƯƠI" : currentLabel === "ROTTEN" ? "HỎNG" : "KHÔNG CHẮC"}
                {currentImg.ai?.confidence && currentLabel === currentImg.ai?.label
                  ? ` (${Math.round(currentImg.ai.confidence * 100)}%)`
                  : ""}
              </Box>
            </Box>

            {/* Thumbnails */}
            {images.length > 1 && (
              <Grid container spacing={1.5} sx={{ mt: 1 }}>
                {images.map((img, idx) => {
                  const isActive = activeImageIndex === idx;
                  const isRotten = displayLabelOf(img.ai) === "ROTTEN";
                  return (
                    <Grid item xs={3} key={img.id || idx}>
                      <Box
                        onClick={() => setActiveImageIndex(idx)}
                        sx={{
                          borderRadius: 1.5,
                          overflow: "hidden",
                          border: isRotten
                            ? "2.5px solid #ef4444"
                            : isActive
                            ? "2.5px solid #0f172a"
                            : "1px solid #cbd5e1",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          "&:hover": { transform: "scale(1.02)" }
                        }}
                      >
                        <Box sx={{ height: 75, bgcolor: "#f1f5f9" }}>
                          <img
                            src={resolveAssetUrl(img.url)}
                            alt="thumb"
                            onError={handleImageError}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>

          {/* Card: Kết quả kiểm định AI */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ShieldCheck size={20} color="#16a34a" />
              <Typography variant="subtitle1" fontWeight={700}>
                Kết quả kiểm định AI (MobileNetV2)
              </Typography>
            </Box>

            <Table size="small" sx={{ "& td": { py: 1.2, fontSize: 13 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", width: "45%" }}>Tổng số ảnh</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{images.length} ảnh</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Ảnh gắn nhãn tươi</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#16a34a" }}>
                    {freshCount} ảnh
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Ảnh nghi hỏng</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: rottenCount > 0 ? "#dc2626" : "inherit" }}>
                    {rottenCount} ảnh
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Không chắc / Chờ xác thực</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#d97706" }}>
                    {uncertainCount} ảnh
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Nhãn tổng thể sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: product.aiOverallLabel === "FRESH" ? "#16a34a" : "#dc2626" }}>
                    {product.aiOverallLabel === "FRESH" ? "TƯƠI (FRESH)" : product.aiOverallLabel === "ROTTEN" ? "CẢNH BÁO HỎNG (ROTTEN)" : "KHÔNG CHẮC (UNCERTAIN)"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Kiểm định từng ảnh — dùng chung nút với màn Kiểm định AI */}
            {aiImages.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5 }}>Kiểm định từng ảnh</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {aiImages.map((img) => {
                    const idx = images.indexOf(img);
                    const corrected = img.ai.finalLabel && img.ai.finalLabel !== img.ai.label;
                    return (
                      <Box
                        key={img.id}
                        sx={{
                          display: "flex",
                          gap: 1.5,
                          p: 1.25,
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: idx === activeImageIndex ? "#0f172a" : "#e2e8f0"
                        }}
                      >
                        <Box
                          onClick={() => setActiveImageIndex(idx)}
                          title="Xem ảnh này"
                          sx={{ width: 64, height: 64, flexShrink: 0, borderRadius: 1, overflow: "hidden", cursor: "pointer", bgcolor: "#f1f5f9" }}
                        >
                          <img
                            src={resolveAssetUrl(img.url)}
                            alt={`Ảnh ${idx + 1}`}
                            onError={handleImageError}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                            <AiLabelChip label={displayLabelOf(img.ai)} confidence={corrected ? null : img.ai.confidence} size="small" />
                            <AiReviewStatusChip status={img.ai.reviewStatus} />
                            {img.ai.produce && (
                              <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                                {formatProduce(img.ai.produce)}
                              </Typography>
                            )}
                          </Box>
                          {img.ai.note && (
                            <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}>{img.ai.note}</Typography>
                          )}
                          <AiReviewActions
                            aiResultId={img.ai.id}
                            label={img.ai.label}
                            reviewStatus={img.ai.reviewStatus}
                            productStatus={product.status}
                            onDone={handleAiReviewed}
                            onError={setToastMsg}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Product Info, Seller Info, Approval Decision, Audit Log */}
        <Grid item xs={12} lg={6}>
          {/* Card: Thông tin sản phẩm */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Thông tin sản phẩm
            </Typography>

            <Table size="small" sx={{ "& td": { py: 1, fontSize: 13 } }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", width: "30%" }}>Tên sản phẩm</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 14 }}>{product.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Mã SP</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>#{product.id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Danh mục</TableCell>
                  <TableCell>{product.category?.name || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Giá bán</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                    {(product.price || 0).toLocaleString("vi-VN")} đ / {product.unit || "kg"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Tồn kho</TableCell>
                  <TableCell>{product.stockQuantity} {product.unit || "kg"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary" }}>Xuất xứ</TableCell>
                  <TableCell>{product.origin || "Chưa cập nhật"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: "text.secondary", verticalAlign: "top" }}>Mô tả</TableCell>
                  <TableCell sx={{ color: "text.secondary", lineHeight: 1.6 }}>{product.description || "Không có mô tả"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {/* Card: Người bán */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              Thông tin nhà vườn / Người bán
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: "#16a34a", fontSize: 16, fontWeight: 700 }}>
                {product.shop?.shopName?.[0] || "S"}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={700} sx={{ color: "#0f172a" }}>
                  {product.shop?.shopName || "N/A"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hotline: {product.shop?.phone || "N/A"} · Trạng thái shop: {product.shop?.status || "ACTIVE"}
                  {product.shop?.productCounts && (
                    <span> · {product.shop.productCounts.approved} SP đã duyệt · {product.shop.productCounts.rejected} SP bị từ chối</span>
                  )}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Card: Quyết định duyệt */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
              Quyết định kiểm duyệt
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 12.5 }}>
              Lý do (bắt buộc khi Từ chối hoặc Yêu cầu bổ sung):
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Nhập lý do gửi phản hồi cho người bán..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mb: 1.5, "& textarea": { fontSize: 13 } }}
            />

            {/* Quick Reason Chips */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 2.5 }}>
              {QUICK_REASONS.map((chipText) => (
                <Chip
                  key={chipText}
                  label={chipText}
                  size="small"
                  onClick={() => handleQuickReasonClick(chipText)}
                  sx={{ fontSize: 11.5, cursor: "pointer", "&:hover": { bgcolor: "#e2e8f0" } }}
                />
              ))}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {product.status === "PENDING" && (
                <>
                  <Button
                    variant="contained"
                    disabled={submitting}
                    onClick={() => handleReview("APPROVE")}
                    sx={{ flex: 1.2, bgcolor: "#16a34a", textTransform: "none", fontWeight: 700, fontSize: 13.5, "&:hover": { bgcolor: "#15803d" } }}
                  >
                    Duyệt sản phẩm
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={submitting}
                    onClick={() => handleReview("NEED_INFO")}
                    sx={{ flex: 1.2, borderColor: "#64748b", color: "#1e293b", textTransform: "none", fontWeight: 600, fontSize: 13.5 }}
                  >
                    Yêu cầu bổ sung
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={submitting}
                    onClick={() => handleReview("REJECT")}
                    sx={{ flex: 0.8, textTransform: "none", fontWeight: 600, fontSize: 13.5 }}
                  >
                    Từ chối
                  </Button>
                </>
              )}
              {product.status === "APPROVED" && (
                <Button
                  variant="outlined"
                  color="warning"
                  disabled={submitting}
                  onClick={() => handleReview("HIDE")}
                  sx={{ flex: 1, textTransform: "none", fontWeight: 600 }}
                >
                  Ẩn khỏi sàn giao dịch
                </Button>
              )}
              {product.status === "HIDDEN" && (
                <Button
                  variant="contained"
                  disabled={submitting}
                  onClick={() => handleReview("UNHIDE")}
                  sx={{ flex: 1, bgcolor: "#2563eb", textTransform: "none", fontWeight: 700 }}
                >
                  Bỏ ẩn (Cho phép bán lại)
                </Button>
              )}
            </Box>
          </Paper>

          {/* Card: Lịch sử duyệt (Audit log) */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Lịch sử kiểm duyệt (Audit Log)
            </Typography>

            {product.reviewHistory && product.reviewHistory.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {product.reviewHistory.map((item) => (
                  <Box key={item.id} sx={{ display: "flex", gap: 1.5, position: "relative" }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid #16a34a",
                        mt: 0.5,
                        flexShrink: 0
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: "#0f172a", fontSize: 13 }}>
                        {item.action} ({item.fromStatus || "Khởi tạo"} &rarr; {item.toStatus})
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""} · Thực hiện bởi {item.actorName || "Admin"} ({item.actorRole})
                      </Typography>
                      {item.reason && (
                        <Typography variant="body2" sx={{ fontSize: "12px", color: "#dc2626", mt: 0.5 }}>
                          Lý do: {item.reason}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chưa có lịch sử duyệt nào được ghi nhận.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Feedback Toast */}
      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={3500}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
