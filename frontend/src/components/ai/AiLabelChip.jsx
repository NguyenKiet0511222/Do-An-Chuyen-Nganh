import { Box } from "@mui/material";
import { AI_LABEL_META, formatPercent } from "./aiReview";

/**
 * Badge nhãn AI theo api.md mục 8: TƯƠI viền xanh, HỎNG nền đỏ, KHÔNG CHẮC nét đứt vàng.
 * label: "FRESH" | "ROTTEN" | "UNCERTAIN"; confidence 0..1 (không truyền hoặc 0 thì không hiện %).
 */
export default function AiLabelChip({ label, confidence, size = "medium" }) {
  const meta = AI_LABEL_META[label];
  const percent = formatPercent(confidence);
  const small = size === "small";

  if (!meta) {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          px: small ? 0.8 : 1.2,
          py: small ? 0.2 : 0.4,
          borderRadius: 1,
          fontSize: small ? 11 : 12,
          fontWeight: 600,
          color: "#64748b",
          bgcolor: "#f1f5f9",
          border: "1px solid #cbd5e1"
        }}
      >
        Chưa có nhãn
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: small ? 0.8 : 1.2,
        py: small ? 0.2 : 0.4,
        borderRadius: 1,
        fontSize: small ? 11 : 12,
        fontWeight: 800,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
        ...meta.sx
      }}
    >
      {meta.text}
      {percent && <span style={{ fontWeight: 600 }}>· {percent}</span>}
    </Box>
  );
}
