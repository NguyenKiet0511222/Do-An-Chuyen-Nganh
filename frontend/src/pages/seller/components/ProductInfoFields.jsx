import { Autocomplete, Box, Paper, TextField, Typography } from "@mui/material";
import CategorySelect from "./CategorySelect";
import { UNIT_OPTIONS, digitsOnly, formatDigits } from "../productForm";

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 14, fontWeight: 500 } };
const labelSx = { fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 };

const Required = () => <Box component="span" sx={{ color: "#ef4444" }}>*</Box>;

/** Chỉ giữ chữ số, bỏ số 0 ở đầu, cắt độ dài: "045.000" -> "45000". */
const numericInput = (value, maxLength) => digitsOnly(value).replace(/^0+(?=\d)/, "").slice(0, maxLength);

/**
 * Khối "Thông tin cơ bản" của form sản phẩm (docs/2110.md L1-2, L2-5). Không gọi API — mọi kiểm tra nằm ở
 * productForm.js, lỗi từng ô do form truyền vào qua fieldError(field) (gồm cả lỗi 400 backend gắn lại theo field).
 * Giá / tồn kho: ô chữ inputMode="numeric" chỉ nhận chữ số, có xem trước "45.000 đ".
 */
export default function ProductInfoFields({ form, setField, fieldError, contentLocked, stockLocked, stockHint, categories, currentCategory }) {
  const priceError = fieldError("price");
  const stockError = fieldError("stockQuantity");
  const unitError = fieldError("unit");
  const descriptionError = fieldError("description");

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, mb: 3, borderBottom: "1px solid #f1f5f9" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10b981" }} />
          Thông tin cơ bản
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>* Các trường bắt buộc</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(6, 1fr)" }, gap: 3 }}>
        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 4" } }}>
          <Typography sx={labelSx}>Tên sản phẩm <Required /></Typography>
          <TextField
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            disabled={contentLocked}
            error={Boolean(fieldError("name"))}
            helperText={fieldError("name")}
            size="small"
            fullWidth
            placeholder="VD: Xoài cát Hòa Lộc"
            sx={fieldSx}
            slotProps={{ htmlInput: { maxLength: 200 } }}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
          <Typography sx={labelSx}>Danh mục <Required /></Typography>
          <CategorySelect
            flat={categories.flat}
            loading={categories.loading}
            loadError={categories.error}
            value={form.categoryId}
            onChange={(value) => setField("categoryId", value)}
            currentCategory={currentCategory}
            disabled={contentLocked}
            error={fieldError("categoryId")}
          />
        </Box>

        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
          <Typography sx={labelSx}>Giá bán (đ) <Required /></Typography>
          <TextField
            value={form.price}
            onChange={(e) => setField("price", numericInput(e.target.value, 10))}
            disabled={contentLocked}
            error={Boolean(priceError)}
            helperText={priceError || (form.price ? `${formatDigits(form.price)} đ / ${form.unit.trim() || "đơn vị"}` : "Chỉ nhập số, VD 45000")}
            size="small"
            fullWidth
            placeholder="VD: 45000"
            sx={fieldSx}
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
          <Typography sx={labelSx}>Đơn vị <Required /></Typography>
          {/* freeSolo: giữ được đơn vị ngoài danh sách gợi ý, vd "hộp 500g" của dữ liệu seed */}
          <Autocomplete
            freeSolo
            options={UNIT_OPTIONS}
            value={form.unit || null}
            inputValue={form.unit}
            onChange={(_e, value) => setField("unit", value ?? "")}
            onInputChange={(_e, value) => {
              if (value !== form.unit) setField("unit", value);
            }}
            disabled={contentLocked}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="kg, bó, hộp 500g…"
                error={Boolean(unitError)}
                helperText={unitError || "Chọn hoặc gõ đơn vị khác"}
                sx={fieldSx}
              />
            )}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
          <Typography sx={labelSx}>Tồn kho <Required /></Typography>
          <TextField
            value={form.stockQuantity}
            onChange={(e) => setField("stockQuantity", numericInput(e.target.value, 7))}
            disabled={stockLocked}
            error={Boolean(stockError)}
            helperText={stockError || stockHint}
            size="small"
            fullWidth
            placeholder="VD: 50"
            sx={fieldSx}
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
          />
        </Box>

        <Box sx={{ gridColumn: "1 / -1" }}>
          <Typography sx={labelSx}>
            Xuất xứ <Box component="span" sx={{ color: "#94a3b8", fontWeight: 400 }}>(Vùng trồng)</Box>
          </Typography>
          <TextField
            value={form.origin}
            onChange={(e) => setField("origin", e.target.value)}
            disabled={contentLocked}
            error={Boolean(fieldError("origin"))}
            helperText={fieldError("origin")}
            size="small"
            fullWidth
            placeholder="VD: Cái Bè, Tiền Giang"
            sx={fieldSx}
          />
        </Box>

        <Box sx={{ gridColumn: "1 / -1" }}>
          <Typography sx={labelSx}>Mô tả chi tiết</Typography>
          <TextField
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            disabled={contentLocked}
            error={Boolean(descriptionError)}
            helperText={descriptionError || `${form.description.length}/5000 ký tự`}
            size="small"
            fullWidth
            multiline
            minRows={3}
            placeholder="Mô tả sản phẩm, cách bảo quản..."
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 14 } }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
