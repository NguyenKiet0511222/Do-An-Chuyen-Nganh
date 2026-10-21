import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { Star, Trash2, X } from "lucide-react";
import { resolveAssetUrl } from "../../../services/api";
import AiLabelChip from "../../../components/ai/AiLabelChip";
import AiReviewStatusChip from "../../../components/ai/AiReviewStatusChip";
import { displayLabelOf, formatProduce } from "../../../utils/aiLabel";
import { handleImageError } from "../../../utils/format";
import { adminNoteOf, isRetake } from "../productForm";

const iconBtnSx = {
  position: "absolute",
  top: 6,
  width: 28,
  height: 28,
  bgcolor: "rgba(15, 23, 42, 0.65)",
  color: "#fff",
  zIndex: 2,
  "&:hover": { bgcolor: "rgba(15, 23, 42, 0.85)" }
};

/** 1 ô ảnh: ảnh + ảnh chính + nhãn AI từng ảnh (ảnh server) hoặc "chưa tải lên" (ảnh mới của form tạo mới). */
export default function ProductImageCard({ item, isPrimary, highlighted, canEdit, canDeleteServer, onRemove, onSetPrimary }) {
  const server = item.kind === "server";
  const ai = server ? item.ai : null;
  const retake = isRetake(item);
  // Admin đã sửa nhãn thì % là của nhãn cũ -> không hiện
  const corrected = ai?.finalLabel && ai.finalLabel !== ai.label;

  return (
    <Box
      id={server ? `product-image-${item.id}` : undefined}
      sx={{
        width: 172,
        borderRadius: "14px",
        overflow: "hidden",
        bgcolor: retake ? "#fff7ed" : "#fff",
        border: retake ? "2px solid #fb923c" : "1px solid #e2e8f0",
        outline: highlighted ? "3px solid #f97316" : "none",
        outlineOffset: 3,
        boxShadow: highlighted ? "0 0 0 8px rgba(249, 115, 22, 0.15)" : "0 1px 2px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.3s",
        scrollMarginTop: 96
      }}
    >
      <Box sx={{ position: "relative", height: 128, bgcolor: "#f1f5f9" }}>
        <Box
          component="img"
          src={server ? resolveAssetUrl(item.url) : item.previewUrl}
          alt="Ảnh sản phẩm"
          onError={handleImageError}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {isPrimary && (
          <Box
            sx={{
              position: "absolute",
              left: 6,
              bottom: 6,
              px: 1,
              py: 0.25,
              borderRadius: "6px",
              bgcolor: "#059669",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700
            }}
          >
            Ảnh chính
          </Box>
        )}
        {canEdit && server && !isPrimary && (
          <Tooltip title="Đặt làm ảnh chính">
            <IconButton size="small" onClick={() => onSetPrimary(item)} sx={{ ...iconBtnSx, left: 6 }} aria-label="Đặt làm ảnh chính">
              <Star size={15} />
            </IconButton>
          </Tooltip>
        )}
        {/* Ảnh duy nhất của sản phẩm đang bán không cho xoá: xoá là về Chờ duyệt với 0 ảnh mà admin vẫn duyệt được */}
        {canEdit && (!server || canDeleteServer) && (
          <Tooltip title={server ? "Xoá ảnh" : "Bỏ ảnh này"}>
            <IconButton
              size="small"
              onClick={() => onRemove(item)}
              sx={{ ...iconBtnSx, right: 6, "&:hover": { bgcolor: "#e11d48" } }}
              aria-label="Xoá ảnh"
            >
              <X size={15} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ p: 1.25, display: "flex", flexDirection: "column", gap: 0.75 }}>
        {!server && (
          <Typography sx={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
            Chưa tải lên — AI gắn nhãn sau khi lưu
          </Typography>
        )}
        {server && !ai && <Typography sx={{ fontSize: 11.5, color: "#94a3b8" }}>Chưa có kết quả AI</Typography>}
        {ai && (
          <Tooltip title={ai.note || ""} placement="top" disableHoverListener={!ai.note}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
              <AiLabelChip label={displayLabelOf(ai)} confidence={corrected ? null : ai.confidence} size="small" />
              <AiReviewStatusChip status={ai.reviewStatus} />
            </Box>
          </Tooltip>
        )}
        {ai?.produce && (
          <Typography sx={{ fontSize: 11, color: "#64748b" }}>AI nhận ra: {formatProduce(ai.produce)}</Typography>
        )}
        {retake && (
          <>
            <Typography sx={{ fontSize: 12, color: "#c2410c", fontWeight: 600, lineHeight: 1.45 }}>
              Admin yêu cầu chụp lại{ai?.note ? `: ${adminNoteOf(ai.note)}` : ""}
            </Typography>
            {canEdit && canDeleteServer && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={<Trash2 size={14} />}
                onClick={() => onRemove(item)}
                sx={{ py: 0.25, px: 1, fontSize: 12, fontWeight: 700, borderRadius: "8px" }}
              >
                Xoá ảnh này
              </Button>
            )}
            {canEdit && !canDeleteServer && (
              <Typography sx={{ fontSize: 11.5, color: "#9a3412", lineHeight: 1.45 }}>
                Đây là ảnh duy nhất: thêm ảnh mới trước, xoá ảnh này sau khi admin duyệt.
              </Typography>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
