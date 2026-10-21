import { useState } from "react";
import { Box, CircularProgress, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { Check, Pencil, X } from "lucide-react";
import { sellerApi } from "../../../services/api";
import { apiErrorMessage } from "../../../utils/format";
import { digitsOnly, validateStock } from "../productForm";

/**
 * Sửa tồn kho ngay trên dòng danh sách (PATCH /seller/products/{id}/stock) — dùng được ở mọi trạng thái,
 * kể cả Chờ duyệt, không làm sản phẩm phải duyệt lại. onSaved nhận SellerProductResponse mới.
 */
export default function ProductStockInlineEditor({ product, onSaved, notify, disabled }) {
  const [value, setValue] = useState(null); // null = không ở chế độ sửa
  const [saving, setSaving] = useState(false);
  const editing = value !== null;

  const cancel = () => setValue(null);

  const save = async () => {
    const error = validateStock(value);
    if (error) {
      notify("error", error);
      return;
    }
    if (Number(value) === product.stockQuantity) {
      cancel();
      return;
    }
    setSaving(true);
    try {
      const updated = await sellerApi.product.updateStock(product.id, Number(value));
      onSaved(updated);
      notify("success", `Đã cập nhật tồn kho "${product.name}": ${updated.stockQuantity}`);
      setValue(null);
    } catch (err) {
      notify("error", apiErrorMessage(err, "Không cập nhật được tồn kho."));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
        <Typography component="span" sx={{ color: product.stockQuantity === 0 ? "#e11d48" : "#1e293b", fontWeight: 600, fontSize: 13 }}>
          {product.stockQuantity ?? "—"}
        </Typography>
        <Tooltip title="Sửa tồn kho">
          <span>
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => setValue(String(product.stockQuantity ?? ""))}
              sx={{ color: "#94a3b8", "&:hover": { color: "#059669" } }}
              aria-label="Sửa tồn kho"
            >
              <Pencil size={13} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
      <TextField
        autoFocus
        size="small"
        value={value}
        onChange={(e) => setValue(digitsOnly(e.target.value).slice(0, 7))}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        disabled={saving}
        sx={{ width: 84, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 13 } }}
        slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": "Tồn kho mới" } }}
      />
      {saving ? (
        <CircularProgress size={16} sx={{ mx: 1 }} color="success" />
      ) : (
        <>
          <IconButton size="small" onClick={save} sx={{ color: "#059669" }} aria-label="Lưu tồn kho">
            <Check size={15} />
          </IconButton>
          <IconButton size="small" onClick={cancel} sx={{ color: "#94a3b8" }} aria-label="Huỷ sửa tồn kho">
            <X size={15} />
          </IconButton>
        </>
      )}
    </Box>
  );
}
