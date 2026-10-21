import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

/**
 * Hộp xác nhận dùng chung cho khu sản phẩm người bán (xoá sản phẩm/ảnh, sửa sản phẩm đang bán...).
 * Thay cho window.confirm. `loading` khoá nút trong lúc gọi API; đóng hộp thoại thì không đổi gì.
 */
export default function ProductConfirmDialog({
  open,
  title,
  message,
  confirmText = "Xác nhận",
  confirmColor = "primary",
  loading = false,
  onConfirm,
  onClose
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 17, fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        {typeof message === "string" ? (
          <Typography sx={{ fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{message}</Typography>
        ) : (
          message
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none", fontWeight: 600, color: "#475569" }}>
          Huỷ
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, boxShadow: "none" }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
