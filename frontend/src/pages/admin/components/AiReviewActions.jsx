import { useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from "@mui/material";
import { Camera, Check, CircleAlert, Leaf } from "lucide-react";
import { adminApi } from "../../../services/api";
import { apiErrorMessage, isReviewable, notifyAiPendingChanged } from "./aiReview";

const RETAKE_NOTE_MAX = 300;
const RETAKE_QUICK_NOTES = [
  "Ảnh mờ, chụp gần hơn",
  "Ảnh tối, thiếu sáng",
  "Ảnh không đúng sản phẩm đăng bán",
  "Nhiều loại nông sản trong một ảnh"
];

/**
 * Nút kiểm định 1 ảnh AI (dùng chung cho hàng chờ Kiểm định AI và trang chi tiết duyệt sản phẩm).
 * Chỉ hiện khi ảnh đang PENDING_REVIEW / AUTO_ACCEPTED. Theo wireframe docs/1910.md mục 7.3:
 * - "Chấp nhận" ẩn khi nhãn AI là UNCERTAIN (không có gì để chấp nhận — backend trả 400);
 * - "Sửa thành Tươi/Hỏng" ẩn nút trùng nhãn AI (trùng thì backend tính như Chấp nhận);
 * - "Yêu cầu chụp lại" bắt buộc ghi chú (sản phẩm PENDING sẽ chuyển NEED_INFO).
 * onDone(updatedResult, message) sau khi thành công; onError(message) khi lỗi.
 */
export default function AiReviewActions({ aiResultId, label, reviewStatus, productStatus, onDone, onError }) {
  const [pendingAction, setPendingAction] = useState(null);
  const [retakeOpen, setRetakeOpen] = useState(false);
  const [retakeNote, setRetakeNote] = useState("");
  // Chặn bấm đúp trước khi state kịp render lại
  const busyRef = useRef(false);

  if (!aiResultId || !isReviewable(reviewStatus)) return null;

  const busy = Boolean(pendingAction);

  const submit = async (key, payload, successMessage) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setPendingAction(key);
    try {
      const updated = await adminApi.ai.review(aiResultId, payload);
      notifyAiPendingChanged();
      onDone?.(updated, successMessage);
      return true;
    } catch (err) {
      onError?.(apiErrorMessage(err, "Không kiểm định được ảnh, vui lòng thử lại."));
      return false;
    } finally {
      busyRef.current = false;
      setPendingAction(null);
    }
  };

  const handleAccept = () => submit("ACCEPT", { action: "ACCEPT" }, "Đã chấp nhận nhãn AI.");

  const handleCorrect = (finalLabel) =>
    submit(
      `CORRECT_${finalLabel}`,
      { action: "CORRECT", finalLabel },
      `Đã sửa nhãn ảnh thành ${finalLabel === "FRESH" ? "TƯƠI" : "HỎNG"}.`
    );

  const closeRetake = () => {
    if (busy) return;
    setRetakeOpen(false);
  };

  const handleRetake = async () => {
    const note = retakeNote.trim();
    if (!note) return;
    const message =
      productStatus === "PENDING"
        ? "Đã yêu cầu chụp lại ảnh. Sản phẩm chuyển sang Cần bổ sung để người bán thay ảnh."
        : "Đã yêu cầu người bán chụp lại ảnh.";
    const ok = await submit("RETAKE", { action: "RETAKE", note }, message);
    if (ok) {
      setRetakeOpen(false);
      setRetakeNote("");
    }
  };

  const addQuickNote = (text) => {
    setRetakeNote((prev) => {
      if (prev.toLowerCase().includes(text.toLowerCase())) return prev;
      const next = prev.trim() ? `${prev.trim()}; ${text.toLowerCase()}` : text;
      return next.slice(0, RETAKE_NOTE_MAX);
    });
  };

  const spinner = <CircularProgress size={14} color="inherit" />;
  const buttonSx = { fontSize: 12.5, px: 1.5, py: 0.5, minWidth: 0, "&:hover": { transform: "none" } };

  return (
    <>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {label && label !== "UNCERTAIN" && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            disabled={busy}
            onClick={handleAccept}
            startIcon={pendingAction === "ACCEPT" ? spinner : <Check size={15} />}
            sx={{ ...buttonSx, color: "#fff" }}
          >
            Chấp nhận
          </Button>
        )}
        {label !== "FRESH" && (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            disabled={busy}
            onClick={() => handleCorrect("FRESH")}
            startIcon={pendingAction === "CORRECT_FRESH" ? spinner : <Leaf size={15} />}
            sx={buttonSx}
          >
            Sửa thành Tươi
          </Button>
        )}
        {label !== "ROTTEN" && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={busy}
            onClick={() => handleCorrect("ROTTEN")}
            startIcon={pendingAction === "CORRECT_ROTTEN" ? spinner : <CircleAlert size={15} />}
            sx={buttonSx}
          >
            Sửa thành Hỏng
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          disabled={busy}
          onClick={() => setRetakeOpen(true)}
          startIcon={<Camera size={15} />}
          sx={{ ...buttonSx, borderColor: "#94a3b8", color: "#334155" }}
        >
          Yêu cầu chụp lại
        </Button>
      </Box>

      <Dialog open={retakeOpen} onClose={closeRetake} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Yêu cầu chụp lại ảnh</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13.5, mb: 2 }}>
            Ảnh sẽ chuyển sang <strong>Yêu cầu chụp lại</strong>.{" "}
            {productStatus === "PENDING"
              ? "Sản phẩm đang chờ duyệt nên sẽ chuyển sang Cần bổ sung; người bán phải xoá ảnh này và tải ảnh mới mới gửi duyệt lại được."
              : "Sản phẩm giữ nguyên trạng thái; người bán thấy yêu cầu trong mục Kết quả AI của shop."}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Ghi chú cho người bán (bắt buộc)"
            placeholder="VD: Ảnh mờ, chụp gần hơn"
            value={retakeNote}
            onChange={(e) => setRetakeNote(e.target.value.slice(0, RETAKE_NOTE_MAX))}
            helperText={`${retakeNote.length}/${RETAKE_NOTE_MAX}`}
            disabled={busy}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
            {RETAKE_QUICK_NOTES.map((text) => (
              <Chip key={text} label={text} size="small" onClick={() => addQuickNote(text)} disabled={busy} sx={{ fontSize: 11.5 }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeRetake} disabled={busy} sx={{ color: "#475569" }}>
            Huỷ
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRetake}
            disabled={busy || !retakeNote.trim()}
            startIcon={pendingAction === "RETAKE" ? spinner : <Camera size={16} />}
          >
            Gửi yêu cầu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
