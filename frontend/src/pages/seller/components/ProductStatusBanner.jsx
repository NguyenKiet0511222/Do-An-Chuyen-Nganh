import { Alert, AlertTitle } from "@mui/material";
import { AlertTriangle, CheckCircle2, Clock, EyeOff, ShieldAlert } from "lucide-react";

const alertSx = { borderRadius: "12px", fontSize: 13.5, alignItems: "flex-start", "& .MuiAlertTitle-root": { fontWeight: 700, fontSize: 14 } };

/**
 * Banner trạng thái ở đầu form sản phẩm (docs/2110.md L2-4) — lý do lấy đúng rejectReason của admin,
 * không bịa lý do khi admin không ghi. `mode` từ productEditMode().
 */
export default function ProductStatusBanner({ product, mode }) {
  if (!product) return null;
  const reason = product.rejectReason?.trim();

  if (product.status === "REJECTED") {
    return (
      <Alert severity="error" icon={<AlertTriangle size={20} />} sx={alertSx}>
        <AlertTitle>Từ chối duyệt</AlertTitle>
        <b>Lý do từ admin:</b> {reason || "Quản trị viên không ghi lý do."} Sửa theo góp ý rồi bấm <b>Gửi duyệt lại</b>.
      </Alert>
    );
  }
  if (product.status === "NEED_INFO") {
    return (
      <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={alertSx}>
        <AlertTitle>Cần bổ sung</AlertTitle>
        <b>Admin yêu cầu:</b> {reason || "Quản trị viên không ghi nội dung cần bổ sung."} Bổ sung xong bấm <b>Gửi duyệt lại</b>.
      </Alert>
    );
  }
  if (mode === "pending") {
    return (
      <Alert severity="info" icon={<Clock size={20} />} sx={alertSx}>
        <AlertTitle>Đang chờ duyệt — chỉ sửa được tồn kho</AlertTitle>
        Thông tin và ảnh bị khoá cho tới khi quản trị viên duyệt xong.
      </Alert>
    );
  }
  if (mode === "adminHidden") {
    return (
      <Alert severity="error" icon={<ShieldAlert size={20} />} sx={alertSx}>
        <AlertTitle>Sản phẩm bị quản trị viên ẩn</AlertTitle>
        Khách không thấy sản phẩm này. Bạn chỉ cập nhật được tồn kho; liên hệ quản trị viên nếu cần mở lại.
      </Alert>
    );
  }
  if (product.status === "HIDDEN") {
    return (
      <Alert severity="info" icon={<EyeOff size={20} />} sx={alertSx}>
        <AlertTitle>Bạn đang ẩn sản phẩm này</AlertTitle>
        Đổi tồn kho không cần duyệt lại. Đổi nội dung hoặc ảnh sẽ chuyển sản phẩm về Chờ duyệt — sau khi duyệt sản phẩm sẽ
        hiện lại.
      </Alert>
    );
  }
  if (product.status === "APPROVED") {
    return (
      <Alert severity="success" icon={<CheckCircle2 size={20} />} sx={alertSx}>
        <AlertTitle>Đang bán</AlertTitle>
        Đổi tồn kho vẫn bán bình thường. Đổi nội dung hoặc ảnh sẽ gỡ sản phẩm khỏi trang bán, chuyển về Chờ duyệt và khoá
        sửa đến khi admin duyệt.
      </Alert>
    );
  }
  return null;
}
