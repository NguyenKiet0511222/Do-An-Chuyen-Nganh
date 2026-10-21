import { Link as RouterLink } from "react-router-dom";
import { Box, LinearProgress, Link, Paper, Typography } from "@mui/material";
import { ORDER_STATUS_META, ORDER_STATUS_ORDER } from "../../../utils/orderStatus";

/**
 * Thẻ "Đơn theo trạng thái" ở tổng quan người bán (thay biểu đồ doanh thu viết cứng — docs/2110.md Q2).
 * counts = kết quả fetchOrderStatusCounts(): { PENDING, ..., CANCELLED, ALL }. Mỗi dòng dẫn tới tab tương ứng ở trang Đơn hàng.
 */
export default function DashboardOrderStatusCard({ counts, sx }) {
  const total = counts?.ALL ?? 0;

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: 2, ...sx }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Đơn theo trạng thái</Typography>
          <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.5 }}>
            Tổng <b>{total}</b> đơn của shop
          </Typography>
        </Box>
        <Link component={RouterLink} to="/seller/orders?status=ALL" underline="hover" sx={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
          Xem tất cả
        </Link>
      </Box>

      {total === 0 ? (
        <Typography sx={{ fontSize: 13, color: "#6B7280", py: 3, textAlign: "center" }}>Shop chưa có đơn hàng nào.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {ORDER_STATUS_ORDER.map((status) => {
            const meta = ORDER_STATUS_META[status];
            const count = counts?.[status] ?? 0;
            return (
              <Box
                key={status}
                component={RouterLink}
                to={`/seller/orders?status=${status}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "130px 1fr 40px",
                  alignItems: "center",
                  gap: 2,
                  px: 1.5,
                  py: 1,
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background 0.2s",
                  "&:hover": { bgcolor: "#F9FAFB" }
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{meta.label}</Typography>
                <LinearProgress
                  variant="determinate"
                  color={meta.color}
                  value={(count / total) * 100}
                  sx={{ height: 8, borderRadius: "8px", bgcolor: "#F3F4F6" }}
                />
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827", textAlign: "right" }}>{count}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
