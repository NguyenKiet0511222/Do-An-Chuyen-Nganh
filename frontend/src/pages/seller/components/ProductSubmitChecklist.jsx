import { Box, Typography } from "@mui/material";
import { Check, X } from "lucide-react";

/** Danh sách điều kiện gửi duyệt (khớp SellerProductService.submit) — xanh khi đạt, xám khi chưa. */
export default function ProductSubmitChecklist({ items }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5, mb: 2 }}>
        Điều kiện để gửi duyệt
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {items.map((item) => (
          <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                minWidth: 20,
                borderRadius: "50%",
                bgcolor: item.ok ? "#d1fae5" : "#f1f5f9",
                color: item.ok ? "#059669" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {item.ok ? <Check size={14} /> : <X size={12} />}
            </Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: item.ok ? "#334155" : "#64748b" }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
