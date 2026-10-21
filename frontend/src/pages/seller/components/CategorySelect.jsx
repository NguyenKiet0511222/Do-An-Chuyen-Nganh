import { useMemo } from "react";
import { Box, ListSubheader, MenuItem, TextField, Typography } from "@mui/material";
import { Sparkles } from "lucide-react";
import { effectiveProduceKeys, findCategoryById } from "../../../utils/categories";
import { PRODUCE_TYPES, produceName } from "../../../utils/aiLabel";

const KNOWN_PRODUCE = new Set(PRODUCE_TYPES.map((p) => p.value));

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 14, fontWeight: 500 } };

/** Gợi ý AI theo aiProduceKeys của danh mục (trống thì lấy của cha) — khớp luật gắn nhãn dòng 2 (CLAUDE.md mục 7). */
const aiHintOf = (flat, category) => {
  if (!category || category.hasChildren) return null;
  const keys = effectiveProduceKeys(flat, category);
  if (keys.length === 0) return null;
  const known = keys.filter((k) => KNOWN_PRODUCE.has(k));
  if (known.length === 0) {
    return { tone: "warning", text: `AI chưa nhận diện ${category.name.toLowerCase()} — ảnh sẽ chờ admin kiểm định` };
  }
  return { tone: "info", text: `AI nhận ra: ${known.map((k) => produceName(k).toLowerCase()).join(", ")}` };
};

/**
 * Chọn danh mục từ cây thật (GET /api/categories). Danh mục cha có con -> tiêu đề nhóm (không chọn được) + các con;
 * cha không con (vd "Trái cây") -> mục chọn bình thường. Danh mục hiện tại không còn trong cây (đã ngừng hoạt động)
 * vẫn hiện tên nhưng không chọn lại được — form chặn lưu nội dung cho tới khi chọn danh mục khác.
 */
export default function CategorySelect({ flat, loading, loadError, value, onChange, currentCategory, disabled, error }) {
  const selected = findCategoryById(flat, value);
  const hint = aiHintOf(flat, selected);
  // Giá trị đang chọn không phải mục chọn được (ngừng hoạt động / cha có con / chưa tải xong cây) -> thêm 1 mục khoá
  // để Select không báo "out-of-range value"
  const orphan = value && (!selected || selected.hasChildren);
  const orphanName =
    selected?.name ?? (String(currentCategory?.id) === String(value) ? currentCategory?.name : null) ?? `Danh mục #${value}`;

  const options = useMemo(
    () =>
      flat.map((c) =>
        c.hasChildren ? (
          <ListSubheader key={`group-${c.id}`} sx={{ fontWeight: 700, color: "#0f172a", lineHeight: "34px", pl: 2 + c.depth * 2 }}>
            {c.name}
          </ListSubheader>
        ) : (
          <MenuItem key={c.id} value={String(c.id)} sx={{ pl: 2 + c.depth * 2, fontSize: 14 }}>
            {c.name}
          </MenuItem>
        )
      ),
    [flat]
  );

  const renderValue = (v) => {
    if (!v) {
      return <Box component="span" sx={{ color: "#94a3b8" }}>{loading ? "Đang tải danh mục…" : "Chọn danh mục…"}</Box>;
    }
    const category = findCategoryById(flat, v);
    if (!category) return orphanName;
    const parent = findCategoryById(flat, category.parentId);
    return parent ? `${parent.name} › ${category.name}` : category.name;
  };

  const helperText = error || (loadError ? "Không tải được danh mục — thử tải lại trang" : null);

  return (
    <Box>
      <TextField
        select
        fullWidth
        size="small"
        value={value ?? ""}
        onChange={(e) => onChange(String(e.target.value))}
        disabled={disabled}
        error={Boolean(helperText)}
        helperText={helperText}
        sx={fieldSx}
        slotProps={{
          select: {
            displayEmpty: true,
            renderValue,
            MenuProps: { slotProps: { paper: { sx: { maxHeight: 360 } } } }
          }
        }}
      >
        {orphan && (
          <MenuItem value={String(value)} disabled>
            {orphanName}
            {selected?.hasChildren ? " (nhóm danh mục)" : !loading && !loadError ? " (ngừng hoạt động)" : ""}
          </MenuItem>
        )}
        {options}
        {!loading && flat.length === 0 && (
          <MenuItem value="__none" disabled>
            Chưa có danh mục
          </MenuItem>
        )}
      </TextField>
      {hint && !helperText && (
        <Typography
          sx={{
            mt: 0.75,
            fontSize: 12,
            display: "flex",
            alignItems: "flex-start",
            gap: 0.75,
            color: hint.tone === "warning" ? "#b45309" : "#047857",
            fontWeight: 500,
            lineHeight: 1.5
          }}
        >
          <Sparkles size={13} style={{ marginTop: 2, flexShrink: 0 }} />
          {hint.text}
        </Typography>
      )}
    </Box>
  );
}
