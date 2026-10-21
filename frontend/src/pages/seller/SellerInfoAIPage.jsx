import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Avatar, Box, Button, CircularProgress, MenuItem, Paper, Snackbar, Tab, Tabs, TextField, Typography } from "@mui/material";
import { Check, Save, Store, Upload } from "lucide-react";
import { resolveAssetUrl, sellerApi } from "../../services/api";
import { ALL_PROVINCES } from "../../data/vietnamAddressData";
import { apiErrorMessage } from "../../utils/format";
import SellerAiResultsPanel from "./components/SellerAiResultsPanel";
import ShopLoadError from "./components/ShopLoadError";
import ShopStatusChip from "./components/ShopStatusChip";

const EMPTY_FORM = { shopName: "", province: "", address: "", phone: "", description: "" };
const FORM_FIELDS = Object.keys(EMPTY_FORM);
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

// Dòng mô tả trạng thái hồ sơ ở cột phải
const SHOP_STATUS_TEXT = {
  PENDING_VERIFICATION: "Chờ quản trị viên xác minh",
  ACTIVE: "Đã xác minh, đang hoạt động",
  LOCKED: "Bị quản trị viên khoá — liên hệ quản trị viên"
};

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13, fontWeight: 500 } };
const labelSx = { fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 };

const toForm = (shop) => ({
  shopName: shop?.shopName || "",
  province: shop?.province || "",
  address: shop?.address || "",
  phone: shop?.phone || "",
  description: shop?.description || ""
});

/** Kiểm tra giống ShopRequest ở backend (tên 3–150, giới thiệu ≤ 2000, địa chỉ ≤ 255, SĐT 9–11 chữ số). */
const validate = (form) => {
  const errors = {};
  const shopName = form.shopName.trim();
  if (!shopName) errors.shopName = "Vui lòng nhập tên shop";
  else if (shopName.length < 3 || shopName.length > 150) errors.shopName = "Tên shop từ 3 đến 150 ký tự";
  if (form.description.length > 2000) errors.description = "Giới thiệu shop tối đa 2000 ký tự";
  if (!form.province) errors.province = "Vui lòng chọn tỉnh/thành";
  const address = form.address.trim();
  if (!address) errors.address = "Vui lòng nhập địa chỉ lấy hàng";
  else if (address.length > 255) errors.address = "Địa chỉ tối đa 255 ký tự";
  if (!/^[0-9]{9,11}$/.test(form.phone.trim())) errors.phone = "Số điện thoại gồm 9 đến 11 chữ số";
  return errors;
};

/**
 * Thông tin shop + tab "Kết quả AI của shop" (docs/2110.md L1-7).
 * ?tab=ai mở tab Kết quả AI; ?reviewStatus=RETAKE_REQUESTED bật sẵn bộ lọc "Chỉ ảnh cần chụp lại" (link từ tổng quan).
 */
export default function SellerInfoAIPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabValue = searchParams.get("tab") === "ai" ? 1 : 0;
  const reviewStatus = searchParams.get("reviewStatus") || undefined;

  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState({ key: -1, shop: null, error: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    sellerApi
      .getShop()
      .then((shop) => {
        if (ignore) return;
        setLoaded({ key: reloadKey, shop, error: null });
        setForm(toForm(shop));
        setFieldErrors({});
      })
      .catch((err) => {
        if (!ignore) setLoaded({ key: reloadKey, shop: null, error: err });
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const loading = loaded.key !== reloadKey;
  const shop = loaded.shop;
  // Không tải được shop -> khoá Lưu / đổi logo để không ghi đè shop thật bằng form trống
  const locked = loading || !shop;
  const initialForm = toForm(shop);
  const dirty = Boolean(shop) && FORM_FIELDS.some((field) => form[field] !== initialForm[field]);
  // Tỉnh đã lưu không có trong danh sách 63 tỉnh (dữ liệu cũ) -> vẫn hiện để không mất giá trị
  const provinceOptions =
    form.province && !ALL_PROVINCES.includes(form.province) ? [form.province, ...ALL_PROVINCES] : ALL_PROVINCES;
  const noShop = !loading && loaded.error?.response?.status === 404;

  const showToast = (severity, message) => setToast({ open: true, severity, message });
  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleTabChange = (_event, value) => setSearchParams(value === 1 ? { tab: "ai" } : {}, { replace: true });

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || locked) return;
    if (!LOGO_TYPES.includes(file.type)) {
      showToast("error", "Chỉ chấp nhận file ảnh JPG, PNG hoặc WEBP");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      showToast("error", "Kích thước ảnh không được vượt quá 5 MB");
      return;
    }
    setUploadingLogo(true);
    try {
      const res = await sellerApi.updateLogo(file);
      // Logo lưu ngay trên server (không phụ thuộc nút Lưu) -> cập nhật cả bản gốc
      setLoaded((prev) => ({ ...prev, shop: { ...prev.shop, logoUrl: res?.logoUrl ?? prev.shop?.logoUrl } }));
      showToast("success", "Đã cập nhật logo shop.");
    } catch (err) {
      showToast("error", apiErrorMessage(err, "Không tải được logo lên, vui lòng thử lại."));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (locked || saving) return;
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast("error", "Vui lòng kiểm tra lại các ô được đánh dấu.");
      return;
    }
    setSaving(true);
    try {
      const saved = await sellerApi.updateShop({
        shopName: form.shopName.trim(),
        description: form.description.trim(),
        province: form.province,
        address: form.address.trim(),
        phone: form.phone.trim()
      });
      // Hiện đúng dữ liệu backend đã lưu
      setLoaded((prev) => ({ ...prev, shop: saved }));
      setForm(toForm(saved));
      showToast("success", "Đã lưu thông tin shop.");
    } catch (err) {
      // 400 validate: data = { field: message } -> gắn vào đúng ô
      const data = err?.response?.data?.data;
      if (err?.response?.status === 400 && data && typeof data === "object" && !Array.isArray(data)) {
        setFieldErrors(data);
      }
      showToast("error", apiErrorMessage(err, "Không lưu được thông tin shop, vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setFieldErrors({});
  };

  const tabSx = (active) => ({
    textTransform: "none",
    fontWeight: active ? 700 : 500,
    color: active ? "#047857 !important" : "#64748b",
    fontSize: 14,
    px: 3,
    minHeight: "auto",
    py: 2
  });

  return (
    <Box sx={{ pb: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Thông tin shop & kết quả AI
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5 }}>
          Hồ sơ shop hiển thị với khách hàng và kết quả AI gắn nhãn ảnh sản phẩm của shop.
        </Typography>
      </Box>

      {noShop ? (
        <ShopLoadError error={loaded.error} />
      ) : (
        <>
          <Box sx={{ borderBottom: "1px solid #e2e8f0" }}>
            <Tabs value={tabValue} onChange={handleTabChange} slotProps={{ indicator: { sx: { bgcolor: "#059669", height: 2 } } }}>
              <Tab disableRipple label="Thông tin shop" sx={tabSx(tabValue === 0)} />
              <Tab disableRipple label="Kết quả AI của shop" sx={tabSx(tabValue === 1)} />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3, alignItems: "start" }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 3, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, pb: 2, borderBottom: "1px solid #f1f5f9" }}>
                  <Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Thông tin shop</Typography>
                    <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.5 }}>Cập nhật hồ sơ hiển thị công khai với khách hàng</Typography>
                  </Box>
                  {shop && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <ShopStatusChip status={shop.status} />
                      {shop.verifiedAt && (
                        <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                          Xác minh {new Date(shop.verifiedAt).toLocaleDateString("vi-VN")}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>

                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {loaded.error && (
                      <ShopLoadError
                        error={loaded.error}
                        fallback="Không tải được thông tin shop — chưa thể lưu thay đổi."
                        onRetry={() => setReloadKey((key) => key + 1)}
                      />
                    )}

                    {/* Logo */}
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: 3 }}>
                      <input type="file" ref={fileInputRef} onChange={handleLogoFileChange} accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} />
                      <Avatar
                        src={shop?.logoUrl ? resolveAssetUrl(shop.logoUrl) : undefined}
                        alt={shop?.shopName}
                        variant="rounded"
                        sx={{ width: 80, height: 80, border: "2px solid #f1f5f9", borderRadius: "16px", bgcolor: "#ecfdf5", color: "#059669" }}
                      >
                        <Store size={32} />
                      </Avatar>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={locked || uploadingLogo}
                            startIcon={uploadingLogo ? <CircularProgress size={14} /> : <Upload size={14} />}
                            sx={{ color: "#334155", borderColor: "#cbd5e1", borderRadius: "10px", fontWeight: 600, "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" } }}
                          >
                            {uploadingLogo ? "Đang tải..." : "Đổi logo"}
                          </Button>
                          <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>PNG/JPG/WEBP, ≤ 5 MB</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, color: "#64748b" }}>Logo hiển thị trên trang shop và trang sản phẩm của shop.</Typography>
                      </Box>
                    </Box>

                    {/* Các ô thông tin */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
                      <Box>
                        <Typography sx={labelSx}>Tên shop</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={form.shopName}
                          onChange={handleFieldChange("shopName")}
                          disabled={locked}
                          error={Boolean(fieldErrors.shopName)}
                          helperText={fieldErrors.shopName}
                          slotProps={{ htmlInput: { maxLength: 150 } }}
                          sx={fieldSx}
                        />
                      </Box>
                      <Box>
                        <Typography sx={labelSx}>Tỉnh / thành</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          select
                          value={form.province}
                          onChange={handleFieldChange("province")}
                          disabled={locked}
                          error={Boolean(fieldErrors.province)}
                          helperText={fieldErrors.province}
                          slotProps={{ select: { MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } } } }}
                          sx={fieldSx}
                        >
                          {provinceOptions.map((province) => (
                            <MenuItem key={province} value={province}>
                              {province}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      <Box>
                        <Typography sx={labelSx}>Địa chỉ lấy hàng</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={form.address}
                          onChange={handleFieldChange("address")}
                          disabled={locked}
                          error={Boolean(fieldErrors.address)}
                          helperText={fieldErrors.address}
                          slotProps={{ htmlInput: { maxLength: 255 } }}
                          sx={fieldSx}
                        />
                      </Box>
                      <Box>
                        <Typography sx={labelSx}>SĐT shop</Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={form.phone}
                          onChange={handleFieldChange("phone")}
                          disabled={locked}
                          error={Boolean(fieldErrors.phone)}
                          helperText={fieldErrors.phone}
                          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 11 } }}
                          sx={fieldSx}
                        />
                      </Box>
                      <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                        <Typography sx={labelSx}>Giới thiệu shop</Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={form.description}
                          onChange={handleFieldChange("description")}
                          disabled={locked}
                          error={Boolean(fieldErrors.description)}
                          helperText={fieldErrors.description || `${form.description.length}/2000 ký tự`}
                          slotProps={{ htmlInput: { maxLength: 2000 } }}
                          sx={fieldSx}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, pt: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={locked || saving || !dirty}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                        sx={{ bgcolor: "#065f46", "&:hover": { bgcolor: "#064e3b" }, fontWeight: 600, borderRadius: "10px", px: 3 }}
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                      <Button
                        variant="text"
                        onClick={handleReset}
                        disabled={locked || saving || !dirty}
                        sx={{ color: "#64748b", fontWeight: 600, "&:hover": { bgcolor: "#f1f5f9" } }}
                      >
                        Khôi phục
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>

              {/* Cột phải: hướng dẫn + trạng thái hồ sơ */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b" }}>Lưu ý hồ sơ shop</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    "Tên shop 3–150 ký tự, hiển thị trên trang shop công khai và trên từng sản phẩm.",
                    "Địa chỉ lấy hàng và số điện thoại (9–11 chữ số) dùng để liên hệ khi giao đơn.",
                    "Logo và phần giới thiệu giúp khách nhận diện shop."
                  ].map((text) => (
                    <Box key={text} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <Check size={16} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 12, color: "#475569" }}>{text}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ pt: 2, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Trạng thái hồ sơ:</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: shop?.status === "ACTIVE" ? "#047857" : shop?.status === "LOCKED" ? "#dc2626" : "#d97706", textAlign: "right" }}>
                    {shop ? SHOP_STATUS_TEXT[shop.status] || shop.status : "—"}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

          {/* key: link mới từ tổng quan (?reviewStatus=…) thì dựng lại panel với bộ lọc tương ứng */}
          {tabValue === 1 && <SellerAiResultsPanel key={reviewStatus || "all"} initialReviewStatus={reviewStatus} />}
        </>
      )}

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: "12px" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
