import { useRef, useState } from "react";
import {
  Alert,
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
import { Check, PackageCheck, PackageOpen, Truck, XCircle } from "lucide-react";
import { sellerApi } from "../../../services/api";
import { NEXT_ACTION_LABEL, ORDER_STATUS_META, canSellerCancel, nextForwardStatus } from "../../../utils/orderStatus";
import { apiErrorMessage } from "../../../utils/format";
import { notifySellerDataChanged } from "../../../utils/sellerEvents";

// Giới hạn note / cancelReason của OrderStatusUpdateRequest
const TEXT_MAX = 500;

// Chữ ngắn cho nút trên từng dòng bảng (trang chi tiết dùng NEXT_ACTION_LABEL đầy đủ)
const ROW_ACTION_LABEL = {
  CONFIRMED: "Xác nhận",
  PROCESSING: "Chuẩn bị hàng",
  SHIPPING: "Giao vận chuyển",
  DELIVERED: "Đã giao"
};

const ACTION_ICON = {
  CONFIRMED: Check,
  PROCESSING: PackageOpen,
  SHIPPING: Truck,
  DELIVERED: PackageCheck
};

// Bước phải hỏi lại trước khi gửi: giao vận chuyển (sau đó không huỷ được, có ô mã vận đơn),
// đã giao (không hoàn tác: PAID + cộng số đã bán + doanh thu), huỷ (bắt buộc lý do).
const DIALOG_STATUSES = new Set(["SHIPPING", "DELIVERED", "CANCELLED"]);

const CANCEL_QUICK_REASONS = ["Hết hàng", "Không liên hệ được khách", "Khách yêu cầu huỷ", "Hàng không đạt chất lượng"];

/**
 * Nút chuyển trạng thái 1 đơn của shop, dựng từ SELLER_NEXT_STATUS (chép đúng SellerOrderService.SELLER_TRANSITIONS):
 * 1 nút bước tiếp theo + (allowCancel) nút "Huỷ đơn". Chờ API xong mới báo onChanged(updatedOrderDetail, message) —
 * không cập nhật lạc quan; khoá nút trong lúc gửi; lỗi -> onError(message, err) (409 = đơn đã đổi trạng thái ở nơi khác).
 * Thành công thì phát notifySellerDataChanged() để badge menu + trang tổng quan tải lại số liệu.
 * order: { id, orderCode, status }.
 */
export default function OrderStatusActions({ order, compact = false, allowCancel = false, onChanged, onError }) {
  const [busyStatus, setBusyStatus] = useState(null);
  const [dialogStatus, setDialogStatus] = useState(null);
  // Chặn bấm đúp trước khi state kịp render lại
  const busyRef = useRef(false);

  if (!order) return null;
  const forward = nextForwardStatus(order.status);
  const cancellable = allowCancel && canSellerCancel(order.status);
  if (!forward && !cancellable) return null;

  const busy = Boolean(busyStatus);
  const orderCode = order.orderCode || `#${order.id}`;

  const submit = async (status, extra = {}) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyStatus(status);
    try {
      const updated = await sellerApi.order.changeStatus(order.id, { status, ...extra });
      setDialogStatus(null);
      notifySellerDataChanged();
      const label = ORDER_STATUS_META[updated?.status]?.label ?? ORDER_STATUS_META[status].label;
      onChanged?.(updated, `Đơn ${orderCode}: ${label}.`);
    } catch (err) {
      // 409 = trạng thái đã đổi (tab khác / khách vừa huỷ) -> đóng dialog để trang tải lại đơn
      if (err?.response?.status === 409) setDialogStatus(null);
      onError?.(apiErrorMessage(err, "Không cập nhật được trạng thái đơn, vui lòng thử lại."), err);
    } finally {
      busyRef.current = false;
      setBusyStatus(null);
    }
  };

  const handleForward = () => {
    if (DIALOG_STATUSES.has(forward)) setDialogStatus(forward);
    else submit(forward);
  };

  const ForwardIcon = ACTION_ICON[forward] || Check;
  const size = compact ? "small" : "medium";
  const buttonSx = compact
    ? { borderRadius: "8px", px: 1.5, py: 0.5, minWidth: "auto", whiteSpace: "nowrap", fontSize: 13 }
    : { borderRadius: "10px", px: 2.5, whiteSpace: "nowrap" };

  return (
    <>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: compact ? "flex-end" : "flex-start" }}>
        {cancellable && (
          <Button
            variant="outlined"
            color="error"
            size={size}
            disabled={busy}
            onClick={() => setDialogStatus("CANCELLED")}
            startIcon={<XCircle size={compact ? 14 : 16} />}
            sx={buttonSx}
          >
            {NEXT_ACTION_LABEL.CANCELLED}
          </Button>
        )}
        {forward && (
          <Button
            variant="contained"
            size={size}
            disabled={busy}
            onClick={handleForward}
            startIcon={
              busyStatus === forward ? <CircularProgress size={14} color="inherit" /> : <ForwardIcon size={compact ? 14 : 16} />
            }
            sx={{ ...buttonSx, bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
          >
            {compact ? ROW_ACTION_LABEL[forward] : NEXT_ACTION_LABEL[forward]}
          </Button>
        )}
      </Box>

      {dialogStatus && (
        <OrderStatusDialog
          orderCode={orderCode}
          status={dialogStatus}
          busy={busyStatus === dialogStatus}
          onClose={() => {
            if (!busyRef.current) setDialogStatus(null);
          }}
          onSubmit={(extra) => submit(dialogStatus, extra)}
        />
      )}
    </>
  );
}

/** Dialog xác nhận: huỷ (bắt buộc lý do ≤ 500), giao vận chuyển (ghi chú / mã vận đơn tuỳ chọn), đã giao (không hoàn tác). */
function OrderStatusDialog({ orderCode, status, busy, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const isCancel = status === "CANCELLED";
  const trimmed = text.trim();
  const canSubmit = !busy && text.length <= TEXT_MAX && (!isCancel || trimmed.length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(isCancel ? { cancelReason: trimmed } : { note: trimmed || undefined });
  };

  const content = {
    CANCELLED: {
      title: `Huỷ đơn ${orderCode}`,
      description:
        "Đơn chuyển sang “Đã huỷ” và tồn kho các sản phẩm trong đơn được hoàn lại. Khách hàng sẽ thấy lý do huỷ bên dưới.",
      fieldLabel: "Lý do huỷ",
      placeholder: "VD: Hết hàng",
      confirm: "Huỷ đơn"
    },
    SHIPPING: {
      title: `Giao đơn ${orderCode} cho vận chuyển`,
      description: "Đơn chuyển sang “Đang giao”. Từ bước này người bán không huỷ đơn được nữa.",
      fieldLabel: "Ghi chú / mã vận đơn (tuỳ chọn)",
      placeholder: "VD: GHN123",
      confirm: NEXT_ACTION_LABEL.SHIPPING
    },
    DELIVERED: {
      title: `Xác nhận đã giao đơn ${orderCode}?`,
      description: null,
      fieldLabel: "Ghi chú (tuỳ chọn)",
      placeholder: "",
      confirm: NEXT_ACTION_LABEL.DELIVERED
    }
  }[status];

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: "16px" } } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{content.title}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {status === "DELIVERED" ? (
          <Alert severity="warning" sx={{ borderRadius: "12px" }}>
            Thao tác <b>không hoàn tác được</b>: đơn chuyển <b>Hoàn thành</b>, thanh toán chuyển <b>Đã thanh toán</b>, số đã
            bán và doanh thu của shop được cộng thêm. Chỉ xác nhận khi khách đã nhận hàng.
          </Alert>
        ) : (
          <DialogContentText sx={{ fontSize: 14 }}>{content.description}</DialogContentText>
        )}

        {isCancel && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {CANCEL_QUICK_REASONS.map((reason) => (
              <Chip
                key={reason}
                label={reason}
                size="small"
                variant={trimmed === reason ? "filled" : "outlined"}
                color={trimmed === reason ? "error" : "default"}
                onClick={() => setText(reason)}
                disabled={busy}
              />
            ))}
          </Box>
        )}

        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          required={isCancel}
          label={content.fieldLabel}
          placeholder={content.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          error={text.length > TEXT_MAX}
          helperText={`${text.length}/${TEXT_MAX} ký tự`}
          slotProps={{ htmlInput: { maxLength: TEXT_MAX } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={busy} sx={{ color: "#64748b" }}>
          Đóng
        </Button>
        <Button
          variant="contained"
          color={isCancel ? "error" : "primary"}
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {content.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
