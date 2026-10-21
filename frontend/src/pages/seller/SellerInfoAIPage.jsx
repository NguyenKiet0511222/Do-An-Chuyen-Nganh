import { Box, Typography, Paper, Button, Tabs, Tab, TextField, Avatar, MenuItem, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { Upload, Save, CheckCircle2, Clock, Check } from "lucide-react";
import { sellerApi, resolveAssetUrl } from "../../services/api";
import SellerAiResultsPanel from "./components/SellerAiResultsPanel";

export default function SellerInfoAIPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  const [formData, setFormData] = useState({
    shopName: "Vườn rau Tâm An",
    province: "Lâm Đồng",
    address: "Thôn Đa Quý, xã Xuân Thọ, TP. Đà Lạt",
    phone: "0905111222",
    description: "Rau củ Đà Lạt trồng nhà kính, thu hoạch trong ngày, không thuốc trừ sâu.",
    logoUrl: "",
    status: "ACTIVE",
    verifiedAt: null
  });

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    let active = true;
    sellerApi.getShop()
      .then((shop) => {
        if (!active || !shop) return;
        const mapped = {
          shopName: shop.shopName || "",
          province: shop.province || "Lâm Đồng",
          address: shop.address || "",
          phone: shop.phone || "",
          description: shop.description || "",
          logoUrl: shop.logoUrl ? resolveAssetUrl(shop.logoUrl) : "",
          status: shop.status || "ACTIVE",
          verifiedAt: shop.verifiedAt || null
        };
        setFormData(mapped);
        setInitialData(mapped);
      })
      .catch((err) => {
        console.warn("Lỗi tải thông tin shop:", err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setToast({ open: true, severity: "error", message: "Chỉ chấp nhận file ảnh JPG, PNG hoặc WEBP" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ open: true, severity: "error", message: "Kích thước ảnh không được vượt quá 5 MB" });
      return;
    }

    try {
      setUploadingLogo(true);
      const res = await sellerApi.updateLogo(file);
      if (res?.logoUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: resolveAssetUrl(res.logoUrl) }));
      }
      setToast({ open: true, severity: "success", message: "Đã cập nhật logo shop thành công!" });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi tải logo lên";
      setToast({ open: true, severity: "error", message: msg });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!formData.shopName?.trim()) {
      setToast({ open: true, severity: "error", message: "Vui lòng nhập tên shop" });
      return;
    }
    if (!formData.phone?.trim()) {
      setToast({ open: true, severity: "error", message: "Vui lòng nhập số điện thoại" });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        shopName: formData.shopName.trim(),
        description: formData.description?.trim() || "",
        province: formData.province || "Lâm Đồng",
        address: formData.address?.trim() || "",
        phone: formData.phone.trim()
      };
      const res = await sellerApi.updateShop(payload);
      if (res) {
        setFormData((prev) => ({
          ...prev,
          shopName: res.shopName,
          description: res.description,
          province: res.province,
          address: res.address,
          phone: res.phone
        }));
        setInitialData((prev) => ({ ...prev, ...payload }));
      }
      setToast({ open: true, severity: "success", message: "Đã lưu thay đổi thông tin shop thành công!" });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi lưu thông tin shop";
      setToast({ open: true, severity: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData(initialData);
      setToast({ open: true, severity: "info", message: "Đã khôi phục thông tin ban đầu" });
    }
  };

  return (
    <Box sx={{ pb: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Title & Description */}
      <Box sx={{ spaceY: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Thông tin shop & kết quả AI
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5 }}>
          Quản lý định danh cơ sở, thông tin liên lạc và báo cáo xếp hạng chất lượng AI.
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: "1px solid #e2e8f0" }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          TabIndicatorProps={{ sx: { bgcolor: "#059669", height: 2 } }}
        >
          <Tab 
            disableRipple
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Thông tin shop
                <Box sx={{ px: 1, py: 0.25, borderRadius: 10, fontSize: 11, fontWeight: 600, bgcolor: tabValue === 0 ? "#d1fae5" : "#f1f5f9", color: tabValue === 0 ? "#065f46" : "#64748b" }}>
                  1
                </Box>
              </Box>
            } 
            sx={{ 
              textTransform: "none", 
              fontWeight: tabValue === 0 ? 700 : 500, 
              color: tabValue === 0 ? "#047857 !important" : "#64748b",
              fontSize: 14,
              px: 3,
              minHeight: "auto",
              py: 2
            }} 
          />
          <Tab 
            disableRipple
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Kết quả AI của shop
                <Box sx={{ px: 1, py: 0.25, borderRadius: 10, fontSize: 11, fontWeight: 600, bgcolor: tabValue === 1 ? "#d1fae5" : "#f1f5f9", color: tabValue === 1 ? "#065f46" : "#64748b" }}>
                  2
                </Box>
              </Box>
            } 
            sx={{ 
              textTransform: "none", 
              fontWeight: tabValue === 1 ? 700 : 500, 
              color: tabValue === 1 ? "#047857 !important" : "#64748b",
              fontSize: 14,
              px: 3,
              minHeight: "auto",
              py: 2
            }} 
          />
        </Tabs>
      </Box>

      {/* Tab 0: Thông tin shop */}
      {tabValue === 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          {/* Left/Main Form */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 3, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            {/* Card Header With Status */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, borderBottom: "1px solid #f1f5f9" }}>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Thông tin shop</Typography>
                <Typography sx={{ fontSize: 12, color: "#94a3b8", mt: 0.5 }}>Cập nhật hồ sơ hiển thị công khai với khách hàng</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {formData.status === "ACTIVE" ? (
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: 10, fontSize: 12, fontWeight: 600, bgcolor: "#ecfdf5", color: "#047857", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <CheckCircle2 size={14} />
                    Đã xác minh
                  </Box>
                ) : (
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: 10, fontSize: 12, fontWeight: 600, bgcolor: "#fffbeb", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                    <Clock size={14} />
                    Chờ xác minh
                  </Box>
                )}
                <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                  {formData.verifiedAt ? new Date(formData.verifiedAt).toLocaleDateString("vi-VN") : "Hồ sơ chuẩn"}
                </Typography>
              </Box>
            </Box>

            {/* Logo Upload Section */}
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: 3 }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoFileChange}
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
              />
              <Avatar 
                src={formData.logoUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"} 
                variant="rounded"
                sx={{ width: 80, height: 80, border: "2px solid #f1f5f9", borderRadius: 3 }}
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleLogoClick}
                    disabled={uploadingLogo}
                    startIcon={uploadingLogo ? <CircularProgress size={14} /> : <Upload size={14} />} 
                    sx={{ color: "#334155", borderColor: "#cbd5e1", textTransform: "none", borderRadius: 2, fontWeight: 600, "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" } }}
                  >
                    {uploadingLogo ? "Đang tải..." : "Đổi logo"}
                  </Button>
                  <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>PNG/JPG/WEBP, ≤ 5 MB</Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: "#64748b" }}>Hình ảnh rõ nét giúp nhận diện thương hiệu tốt hơn trong báo cáo AI.</Typography>
              </Box>
            </Box>

            {/* Main Input Fields Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2.5,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Tên shop</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={formData.shopName}
                  onChange={handleFieldChange("shopName")}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }} 
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Tỉnh / thành</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  select 
                  value={formData.province}
                  onChange={handleFieldChange("province")}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }}
                >
                  <MenuItem value="Lâm Đồng">Lâm Đồng</MenuItem>
                  <MenuItem value="Hà Nội">Hà Nội</MenuItem>
                  <MenuItem value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</MenuItem>
                  <MenuItem value="Đà Nẵng">Đà Nẵng</MenuItem>
                  <MenuItem value="Đắk Lắk">Đắk Lắk</MenuItem>
                  <MenuItem value="Cần Thơ">Cần Thơ</MenuItem>
                  <MenuItem value="Gia Lai">Gia Lai</MenuItem>
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Địa chỉ lấy hàng</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={formData.address}
                  onChange={handleFieldChange("address")}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }} 
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>SĐT shop</Typography>
                <TextField 
                  fullWidth 
                  size="small" 
                  value={formData.phone}
                  onChange={handleFieldChange("phone")}
                  placeholder="0905111222"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }} 
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", mb: 0.75 }}>Giới thiệu shop</Typography>
                <TextField 
                  fullWidth 
                  multiline 
                  rows={3} 
                  value={formData.description}
                  onChange={handleFieldChange("description")}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, fontWeight: 500 } }} 
                />
                <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.5 }}>Tối đa 2000 ký tự hiển thị trên danh thiếp shop.</Typography>
              </Box>
            </Box>

            {/* Save CTA */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, pt: 1 }}>
              <Button 
                variant="contained" 
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />} 
                sx={{ bgcolor: "#065f46", "&:hover": { bgcolor: "#064e3b" }, textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3 }}
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button 
                variant="text" 
                onClick={handleCancel}
                disabled={saving}
                sx={{ color: "#64748b", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#f1f5f9" } }}
              >
                Khôi phục
              </Button>
            </Box>
          </Paper>

          {/* Right Side: AI Trust Guidelines */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b" }}>Tiêu chí hồ sơ nhà vườn</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Check size={16} color="#059669" style={{ marginTop: 2 }} />
                <Typography sx={{ fontSize: 12, color: "#475569" }}>Tên vườn khớp với giấy chứng nhận VietGAP / GlobalGAP đã đăng ký.</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Check size={16} color="#059669" style={{ marginTop: 2 }} />
                <Typography sx={{ fontSize: 12, color: "#475569" }}>Địa chỉ kho lấy hàng chuẩn xác để AI tối ưu tuyến đường vận chuyển nhanh.</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Check size={16} color="#059669" style={{ marginTop: 2 }} />
                <Typography sx={{ fontSize: 12, color: "#475569" }}>Hotline hoạt động 24/7 phục vụ xác thực đơn nông sản thu hoạch sớm.</Typography>
              </Box>
            </Box>
            <Box sx={{ pt: 2, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Trạng thái hồ sơ:</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: formData.status === "ACTIVE" ? "#047857" : "#d97706" }}>
                {formData.status === "ACTIVE" ? "Hợp lệ & Hoạt động" : "Chờ quản trị viên duyệt"}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Tab 1: Kết quả AI */}
      {tabValue === 1 && <SellerAiResultsPanel />}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
