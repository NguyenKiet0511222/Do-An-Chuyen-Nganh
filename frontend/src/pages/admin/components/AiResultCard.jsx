import { Link as RouterLink } from "react-router-dom";
import { Box, Chip, Divider, Link, Paper, Typography } from "@mui/material";
import { Store, ZoomIn } from "lucide-react";
import { resolveAssetUrl } from "../../../services/api";
import AiLabelChip from "../../../components/ai/AiLabelChip";
import AiReviewActions from "./AiReviewActions";
import AiReviewStatusChip from "../../../components/ai/AiReviewStatusChip";
import { PRODUCT_STATUS_META, displayLabelOf, formatProduce, handleImageError } from "./aiReview";

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "");

// reviewedBy có thể là tên (string) hoặc object { id, fullName } tuỳ backend
const reviewerName = (reviewedBy) =>
  reviewedBy && typeof reviewedBy === "object" ? reviewedBy.fullName || reviewedBy.email : reviewedBy;

/** 1 thẻ trong hàng chờ Kiểm định AI (khuôn AdminAiResult, docs/1910.md mục 7.2). */
export default function AiResultCard({ result, onZoom, onDone, onError }) {
  const displayLabel = displayLabelOf(result);
  const corrected = result.finalLabel && result.finalLabel !== result.label;
  const productStatus = result.product?.status;
  const productMeta = PRODUCT_STATUS_META[productStatus];
  const produceText = formatProduce(result.produce);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Ảnh — bấm để phóng to */}
      <Box
        role="button"
        tabIndex={0}
        aria-label="Phóng to ảnh"
        onClick={() => onZoom(result)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onZoom(result);
          }
        }}
        sx={{
          position: "relative",
          height: 180,
          bgcolor: "#0f172a",
          cursor: "zoom-in",
          "&:hover .zoom-hint, &:focus-visible .zoom-hint": { opacity: 1 }
        }}
      >
        <img
          src={resolveAssetUrl(result.imageUrl)}
          alt={result.product?.name || "Ảnh sản phẩm"}
          onError={handleImageError}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <Box
          className="zoom-hint"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            p: 0.6,
            display: "flex",
            borderRadius: 1,
            bgcolor: "rgba(15, 23, 42, 0.7)",
            color: "#fff",
            opacity: 0,
            transition: "opacity 0.15s"
          }}
        >
          <ZoomIn size={16} />
        </Box>
      </Box>

      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
          {/* % là độ tin cậy của AI -> chỉ ghép khi nhãn hiển thị vẫn là nhãn AI */}
          <AiLabelChip label={displayLabel} confidence={corrected ? null : result.confidence} />
          <AiReviewStatusChip status={result.reviewStatus} />
        </Box>

        {corrected && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12, color: "text.secondary" }}>
            AI gốc: <AiLabelChip label={result.label} confidence={result.confidence} size="small" />
          </Box>
        )}

        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
          {result.label === "UNCERTAIN" ? "AI đoán: " : "Loại: "}
          {produceText ? `${produceText}${result.label === "UNCERTAIN" ? "?" : ""}` : "—"}
        </Typography>

        {result.note && (
          <Typography
            title={result.note}
            sx={{
              fontSize: 12,
              color: "text.secondary",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {result.note}
          </Typography>
        )}

        <Divider sx={{ my: 0.25 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {result.product?.id ? (
            <Link
              component={RouterLink}
              to={`/admin/products/${result.product.id}`}
              underline="hover"
              title={result.product.name}
              sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {result.product.name}
            </Link>
          ) : (
            <Typography sx={{ fontSize: 13.5, color: "text.secondary", flex: 1 }}>Không rõ sản phẩm</Typography>
          )}
          {productMeta && (
            <Chip
              size="small"
              label={productMeta.label}
              color={productMeta.color}
              sx={{ height: 20, fontSize: 10.5, fontWeight: 700, flexShrink: 0, "& .MuiChip-label": { px: 0.8 } }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12.5, color: "#475569", minWidth: 0 }}>
          <Store size={14} style={{ flexShrink: 0 }} />
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {result.shop?.shopName || "—"}
          </Box>
        </Box>

        <Typography sx={{ fontSize: 11.5, color: "text.disabled" }}>
          Tải lên {formatDateTime(result.createdAt)}
          {result.reviewedAt && ` · Kiểm định ${formatDateTime(result.reviewedAt)}`}
          {reviewerName(result.reviewedBy) && ` bởi ${reviewerName(result.reviewedBy)}`}
        </Typography>

        <Box sx={{ mt: "auto", pt: 0.5 }}>
          <AiReviewActions
            aiResultId={result.id}
            label={result.label}
            reviewStatus={result.reviewStatus}
            productStatus={productStatus}
            onDone={onDone}
            onError={onError}
          />
        </Box>
      </Box>
    </Paper>
  );
}
