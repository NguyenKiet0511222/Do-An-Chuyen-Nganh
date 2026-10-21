import { Alert, Button } from "@mui/material";
import { useAuth } from "../../../context/useAuth";
import { apiErrorMessage } from "../../../utils/format";

/**
 * Alert khi tải dữ liệu khu người bán bị lỗi.
 * - ADMIN vào khu người bán: mọi API /seller/** trả 404 "Tài khoản chưa có shop" -> báo khu này dành cho người bán
 *   (không có link đăng ký — tài khoản quản trị không được đăng ký bán hàng).
 * - 404 khác (vd đơn không thuộc shop) -> notFoundMessage nếu có.
 * - Còn lại (backend tắt, 5xx...) -> message của ApiResponse hoặc fallback, kèm nút "Thử lại" nếu có onRetry.
 * error là lỗi axios gốc.
 */
export default function ShopLoadError({ error, fallback = "Không tải được dữ liệu, vui lòng thử lại.", notFoundMessage, onRetry, sx }) {
  const { hasRole } = useAuth();
  const status = error?.response?.status;
  const message = error?.response?.data?.message;
  const alertSx = { borderRadius: "12px", ...sx };

  if (status === 404 && (hasRole("ADMIN") || message === "Tài khoản chưa có shop")) {
    return (
      <Alert severity="info" sx={alertSx}>
        {hasRole("ADMIN")
          ? "Tài khoản quản trị không có shop — khu người bán dành cho người bán."
          : "Tài khoản chưa có shop."}
      </Alert>
    );
  }

  if (status === 404 && notFoundMessage) {
    return (
      <Alert severity="warning" sx={alertSx}>
        {notFoundMessage}
      </Alert>
    );
  }

  return (
    <Alert
      severity="error"
      sx={alertSx}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry} sx={{ fontWeight: 700 }}>
            Thử lại
          </Button>
        ) : undefined
      }
    >
      {apiErrorMessage(error, fallback)}
    </Alert>
  );
}
