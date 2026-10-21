import { useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, Paper, Typography } from "@mui/material";
import { Camera, ImagePlus, Info, Lock, Star } from "lucide-react";
import { sellerApi } from "../../../services/api";
import AiLabelChip from "../../../components/ai/AiLabelChip";
import { apiErrorMessage } from "../../../utils/format";
import ProductConfirmDialog from "./ProductConfirmDialog";
import ProductImageCard from "./ProductImageCard";
import {
  MAX_IMAGES,
  chunkFilesBySize,
  isRetake,
  publishedChangeWarning,
  revokeNewImages,
  selectImageFiles,
  toNewImage,
  uploadImagesInBatches
} from "../productForm";

const READ_ONLY_REASON = {
  pending: "Sản phẩm đang chờ duyệt — chưa sửa được ảnh (kể cả đổi ảnh chính) cho tới khi admin duyệt xong.",
  adminHidden: "Sản phẩm bị quản trị viên ẩn — không sửa được ảnh."
};

/**
 * Khu ảnh của form sản phẩm (docs/2110.md L2-1 → L2-3). `images` là MỘT danh sách:
 * { kind: "server", id, url, isPrimary, ai } | { kind: "new", file, previewUrl }.
 * - Tạo mới: chỉ thêm/bỏ file trong danh sách, form tải lên sau khi tạo sản phẩm.
 * - Sửa (DRAFT / REJECTED / NEED_INFO): tải lên / xoá / đặt ảnh chính gọi API ngay, cập nhật từ response.
 * - Đang bán (APPROVED / HIDDEN do người bán): tải lên / xoá phải xác nhận vì sản phẩm sẽ về Chờ duyệt.
 * - PENDING / admin ẩn: chỉ xem (backend trả 409 cho mọi thao tác ảnh khi PENDING).
 */
export default function ProductImageManager({
  productId,
  mode,
  status,
  images,
  onImagesChange,
  onServerUpdate,
  aiOverallLabel,
  aiOverallConfidence,
  blockedReason,
  highlightImageId,
  disabled,
  notify,
  onBusyChange
}) {
  const fileInputRef = useRef(null);
  const imagesRef = useRef(images);
  const scrolledRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(null); // chuỗi tiến độ khi đang gọi API ảnh
  const [confirm, setConfirm] = useState(null); // { type: "upload", files, skippedMessage } | { type: "delete", item }

  const busy = progress !== null;
  const modeReadOnly = mode === "pending" || mode === "adminHidden";
  const canEdit = !modeReadOnly && !disabled && !busy;
  const published = mode === "published";
  const slotsLeft = MAX_IMAGES - images.length;
  const serverImages = images.filter((img) => img.kind === "server");
  const retakeCount = serverImages.filter(isRetake).length;
  const hasServerPrimary = serverImages.some((img) => img.isPrimary);
  // % tổng là trung bình độ tin cậy AI gốc -> admin đã sửa nhãn ảnh nào thì không hiện % nữa
  const anyCorrected = serverImages.some((img) => img.ai?.finalLabel && img.ai.finalLabel !== img.ai.label);
  const highlightMissing =
    highlightImageId && mode !== "new" && !serverImages.some((img) => String(img.id) === String(highlightImageId));

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Thoát trang -> thu hồi ảnh xem trước của file chưa tải lên
  useEffect(() => () => revokeNewImages(imagesRef.current), []);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  // Đến từ "Kết quả AI → Thay ảnh" (?image=) -> cuộn tới đúng ảnh đó (1 lần)
  useEffect(() => {
    if (!highlightImageId || scrolledRef.current) return;
    const el = document.getElementById(`product-image-${highlightImageId}`);
    if (el) {
      scrolledRef.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightImageId, images]);

  const run = async (label, action) => {
    setProgress(label);
    try {
      await action();
    } finally {
      setProgress(null);
    }
  };

  const upload = (files, skippedMessage) =>
    run("Đang tải ảnh…", async () => {
      let toUpload = files;
      let notes = skippedMessage ? [skippedMessage] : [];
      // Sản phẩm đang bán: lô đầu tiên đã chuyển sản phẩm về PENDING -> lô sau sẽ bị 409, nên chỉ gửi 1 lô
      if (published) {
        const batches = chunkFilesBySize(files);
        if (batches.length > 1) {
          toUpload = batches[0];
          notes = [...notes, `Sản phẩm đang bán chỉ tải được 1 lô ≤ 9 MB mỗi lần sửa — đã bỏ qua ${files.length - toUpload.length} ảnh`];
        }
      }
      const { response, uploaded, error } = await uploadImagesInBatches(productId, toUpload, setProgress);
      if (response) onServerUpdate(response);
      if (error) {
        const reason = apiErrorMessage(error, "Không tải được ảnh, vui lòng thử lại.");
        notify("error", uploaded > 0 ? `Đã tải ${uploaded}/${toUpload.length} ảnh — ${reason}` : reason);
        return;
      }
      notify(notes.length ? "warning" : "success", [`Đã tải ${uploaded} ảnh — AI đã gắn nhãn.`, ...notes].join(" "));
    });

  const handleFiles = (fileList) => {
    if (!canEdit) return;
    if (published && blockedReason) {
      notify("warning", blockedReason);
      return;
    }
    if (slotsLeft <= 0) {
      notify("warning", `Đã đủ ${MAX_IMAGES} ảnh — xoá bớt ảnh để thêm ảnh mới.`);
      return;
    }
    const { accepted, skippedMessage } = selectImageFiles(fileList, slotsLeft);
    if (accepted.length === 0) {
      if (skippedMessage) notify("warning", skippedMessage);
      return;
    }
    if (mode === "new") {
      onImagesChange([...images, ...accepted.map(toNewImage)]);
      if (skippedMessage) notify("warning", skippedMessage);
    } else if (published) {
      setConfirm({ type: "upload", files: accepted, skippedMessage });
    } else {
      upload(accepted, skippedMessage);
    }
  };

  const handleRemove = (item) => {
    if (!canEdit) return;
    if (item.kind === "new") {
      URL.revokeObjectURL(item.previewUrl);
      onImagesChange(images.filter((img) => img.key !== item.key));
      return;
    }
    if (published && blockedReason) {
      notify("warning", blockedReason);
      return;
    }
    if (published && serverImages.length === 1) {
      notify("warning", "Đây là ảnh duy nhất của sản phẩm đang bán — thêm ảnh mới trước, xoá ảnh này sau khi admin duyệt.");
      return;
    }
    setConfirm({ type: "delete", item });
  };

  const deleteImage = (item) =>
    run("Đang xoá ảnh…", async () => {
      try {
        onServerUpdate(await sellerApi.product.deleteImage(productId, item.id));
        notify("success", "Đã xoá ảnh");
      } catch (err) {
        notify("error", apiErrorMessage(err, "Không xoá được ảnh, vui lòng thử lại."));
      }
    });

  // Đổi ảnh chính không đổi trạng thái sản phẩm (backend không đưa về PENDING) -> không cần xác nhận
  const handleSetPrimary = (item) =>
    run("Đang đặt ảnh chính…", async () => {
      try {
        onServerUpdate(await sellerApi.product.setPrimaryImage(productId, item.id));
        notify("success", "Đã đặt làm ảnh chính");
      } catch (err) {
        notify("error", apiErrorMessage(err, "Không đặt được ảnh chính, vui lòng thử lại."));
      }
    });

  const handleConfirm = async () => {
    const current = confirm;
    if (current.type === "upload") await upload(current.files, current.skippedMessage);
    else await deleteImage(current.item);
    setConfirm(null);
  };

  const confirmMessage = (() => {
    if (!confirm) return "";
    if (confirm.type === "upload") return publishedChangeWarning(status, "ảnh");
    const onlyImage = serverImages.length === 1;
    const parts = ["Ảnh và kết quả AI của ảnh sẽ bị xoá."];
    if (published) parts.push(publishedChangeWarning(status, "ảnh"));
    if (onlyImage) parts.push("Đây là ảnh duy nhất — sản phẩm cần ít nhất 1 ảnh mới gửi duyệt được.");
    return parts.join(" ");
  })();

  const onDragOver = (e) => {
    e.preventDefault();
    if (canEdit) setIsDragging(true);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };
  const openPicker = () => {
    if (!canEdit) return;
    if (slotsLeft <= 0) {
      notify("warning", `Đã đủ ${MAX_IMAGES} ảnh — xoá bớt ảnh để thêm ảnh mới.`);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, pb: 2, mb: 3, borderBottom: "1px solid #f1f5f9" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10b981" }} />
          Hình ảnh sản phẩm
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          {mode !== "new" && serverImages.length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Nhãn AI tổng:</Typography>
              <AiLabelChip label={aiOverallLabel} confidence={anyCorrected ? null : aiOverallConfidence} size="small" />
            </Box>
          )}
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: "8px", bgcolor: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600 }}>
            {images.length} / {MAX_IMAGES} ảnh
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
        {READ_ONLY_REASON[mode] && (
          <Alert severity="info" icon={<Lock size={18} />} sx={{ borderRadius: "10px", fontSize: 13 }}>
            {READ_ONLY_REASON[mode]}
          </Alert>
        )}
        {highlightMissing && (
          <Alert severity="info" sx={{ borderRadius: "10px", fontSize: 13 }}>
            Ảnh #{highlightImageId} không còn trong sản phẩm (có thể đã được xoá). Tải ảnh mới để thay nếu cần.
          </Alert>
        )}
        {retakeCount > 0 && (
          <Alert severity="warning" icon={<Camera size={18} />} sx={{ borderRadius: "10px", fontSize: 13 }}>
            Admin yêu cầu chụp lại <b>{retakeCount}</b> ảnh (viền cam).{" "}
            {published
              ? "Sản phẩm đang bán: mỗi lần sửa ảnh sẽ chuyển về Chờ duyệt và khoá sửa tới khi admin duyệt."
              : "Xoá ảnh đó và tải ảnh mới thì mới gửi duyệt được."}
          </Alert>
        )}
        {published && blockedReason && (
          <Alert severity="warning" sx={{ borderRadius: "10px", fontSize: 13 }}>
            {blockedReason}
          </Alert>
        )}
      </Box>

      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {!modeReadOnly && (
        <Box
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={openPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          sx={{
            border: isDragging ? "2px dashed #10b981" : "2px dashed #e2e8f0",
            borderRadius: "16px",
            p: 4,
            mb: 3,
            textAlign: "center",
            bgcolor: isDragging ? "rgba(236, 253, 245, 0.4)" : "rgba(248, 250, 252, 0.5)",
            cursor: canEdit && slotsLeft > 0 ? "pointer" : "default",
            opacity: slotsLeft > 0 ? 1 : 0.6,
            transition: "all 0.2s",
            "&:hover": canEdit && slotsLeft > 0 ? { borderColor: "#34d399", bgcolor: "rgba(236, 253, 245, 0.2)" } : {}
          }}
        >
          <Box sx={{ width: 48, height: 48, borderRadius: "12px", bgcolor: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", mx: "auto", mb: 2 }}>
            {busy ? <CircularProgress size={22} color="success" /> : <ImagePlus size={24} />}
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1e293b", mb: 0.5 }}>
            {busy
              ? progress
              : slotsLeft <= 0
                ? `Đã đủ ${MAX_IMAGES} ảnh`
                : isDragging
                  ? "Thả ảnh vào đây..."
                  : <>Kéo thả hoặc <Box component="span" sx={{ color: "#059669", textDecoration: "underline", textUnderlineOffset: 2 }}>nhấn để chọn ảnh</Box> (còn {slotsLeft} ảnh)</>}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
            JPG, PNG hoặc WEBP ≤ 5 MB, tối đa {MAX_IMAGES} ảnh.{" "}
            {mode === "new" ? "Ảnh được tải lên và AI gắn nhãn khi lưu sản phẩm." : "AI gắn nhãn ngay khi tải lên."}
          </Typography>
        </Box>
      )}

      {images.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {images.map((item, idx) => (
            <ProductImageCard
              key={item.key}
              item={item}
              isPrimary={item.kind === "server" ? item.isPrimary : !hasServerPrimary && idx === serverImages.length}
              highlighted={item.kind === "server" && String(item.id) === String(highlightImageId)}
              canEdit={canEdit}
              canDeleteServer={!(published && serverImages.length === 1)}
              onRemove={handleRemove}
              onSetPrimary={handleSetPrimary}
            />
          ))}
        </Box>
      ) : (
        <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>Chưa có ảnh nào.</Typography>
      )}

      <Box sx={{ mt: 3, borderRadius: "12px", bgcolor: "rgba(254, 252, 232, 0.8)", border: "1px solid rgba(253, 230, 138, 0.8)", p: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Info size={20} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 12, color: "#78350f", fontWeight: 500, lineHeight: 1.6 }}>
          <Box component="span" sx={{ fontWeight: 700, color: "#451a03" }}>Lưu ý: </Box>
          Ảnh chính hiện ở trang bán (đổi bằng nút <Star size={11} style={{ verticalAlign: "-1px" }} />). Ảnh AI đánh giá{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "#be123c" }}>Hỏng</Box> hoặc không chắc luôn được quản trị viên xem lại;
          ảnh bị yêu cầu chụp lại phải xoá và thay ảnh mới trước khi gửi duyệt.
        </Typography>
      </Box>

      <ProductConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === "upload" ? "Tải ảnh cho sản phẩm đang bán?" : "Xoá ảnh này?"}
        message={confirmMessage}
        confirmText={confirm?.type === "upload" ? "Tải lên & chờ duyệt" : "Xoá ảnh"}
        confirmColor={confirm?.type === "upload" ? "warning" : "error"}
        loading={busy}
        onConfirm={handleConfirm}
        onClose={() => setConfirm(null)}
      />
    </Paper>
  );
}
