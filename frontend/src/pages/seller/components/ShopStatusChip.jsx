import { Chip } from "@mui/material";
import { CheckCircle2, CircleAlert, Clock, Lock } from "lucide-react";

// Trạng thái shop (enum ShopStatus): PENDING_VERIFICATION -> ACTIVE (admin xác minh) <-> LOCKED (admin khoá / mở).
// SUSPENDED / REJECTED / INACTIVE backend còn giữ trong enum nhưng chưa dùng — vẫn có nhãn để không hiện mã thô.
const SHOP_STATUS_META = {
  PENDING_VERIFICATION: { label: "Chờ xác minh", color: "warning", icon: Clock },
  ACTIVE: { label: "Đang hoạt động", color: "success", icon: CheckCircle2 },
  LOCKED: { label: "Bị khoá", color: "error", icon: Lock },
  SUSPENDED: { label: "Tạm ngưng", color: "error", icon: CircleAlert },
  REJECTED: { label: "Bị từ chối", color: "error", icon: CircleAlert },
  INACTIVE: { label: "Ngừng hoạt động", color: "default", icon: CircleAlert }
};

/** Chip trạng thái shop: Chờ xác minh / Đang hoạt động / Bị khoá. */
export default function ShopStatusChip({ status, size = "small" }) {
  if (!status) return null;
  const meta = SHOP_STATUS_META[status] || { label: status, color: "default", icon: CircleAlert };
  const Icon = meta.icon;
  return (
    <Chip
      size={size}
      variant="outlined"
      color={meta.color}
      icon={<Icon size={14} />}
      label={meta.label}
      sx={{ fontWeight: 700, fontSize: 12 }}
    />
  );
}
