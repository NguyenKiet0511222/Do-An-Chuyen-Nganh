import { Chip } from "@mui/material";
import { REVIEW_STATUS_META } from "../../utils/aiLabel";

/** Chip trạng thái kiểm định của 1 ảnh (Chờ kiểm định / Tự chấp nhận / Đã chấp nhận / Đã sửa / Yêu cầu chụp lại). */
export default function AiReviewStatusChip({ status }) {
  if (!status) return null;
  const meta = REVIEW_STATUS_META[status] || { label: status, color: "default" };
  return (
    <Chip
      size="small"
      variant="outlined"
      label={meta.label}
      color={meta.color}
      sx={{ height: 22, fontSize: 11, fontWeight: 700, "& .MuiChip-label": { px: 1 } }}
    />
  );
}
