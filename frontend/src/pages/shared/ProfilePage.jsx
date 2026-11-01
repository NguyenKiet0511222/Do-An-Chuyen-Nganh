import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress
} from "@mui/material";
import {
  User,
  Calendar,
  ShieldCheck,
  KeyRound,
  Camera,
  Store,
  CircleUserRound,
  Smartphone,
  Check,
  HelpCircle
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { authApi, userProfileApi, resolveAssetUrl } from "../../services/api";
import { apiErrorMessage } from "../../utils/format";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [twoFactor, setTwoFactor] = useState(true);

  // Dialog Đổi mật khẩu
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [pwdSaving, setPwdSaving] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    authApi
      .me()
      .then((data) => {
        if (!ignore && data) {
          setProfile(data);
          setFullName(data.fullName || "");
          setPhone(data.phone || "");
        }
      })
      .catch((err) => {
        console.warn("Lỗi lấy thông tin hồ sơ:", err);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "SELLER":
        return "Chủ cửa hàng";
      default:
        return "Khách hàng";
    }
  };

  // Cập nhật họ tên, SĐT
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert("Họ và tên không được để trống.");
      return;
    }
    setSaving(true);
    try {
      const updated = await userProfileApi.update({
        fullName: fullName.trim(),
        phone: phone.trim() || null
      });
      setProfile((prev) => ({ ...prev, ...updated }));
      updateUser(updated);
      setToastMsg("Đã cập nhật thông tin hồ sơ thành công!");
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể cập nhật hồ sơ"));
    } finally {
      setSaving(false);
    }
  };

  // Tải lên avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const res = await userProfileApi.updateAvatar(file);
      const newAvatarUrl = res.avatarUrl;
      setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      updateUser({ avatarUrl: newAvatarUrl });
      setToastMsg("Đã cập nhật ảnh đại diện thành công!");
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể cập nhật ảnh đại diện"));
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    setPwdSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword
      });
      setToastMsg("Đã đổi mật khẩu thành công!");
      setPwdDialogOpen(false);
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại."));
    } finally {
      setPwdSaving(false);
    }
  };

  const avatarSrc = resolveAssetUrl(profile.avatarUrl);

  return (
    <Box sx={{ pb: 6, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            minWidth: 40,
            borderRadius: 3,
            bgcolor: "rgba(209, 250, 229, 0.7)",
            color: "#047857",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <CircleUserRound size={22} strokeWidth={2} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Hồ sơ tài khoản
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5, fontWeight: 500 }}>
            Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid rgba(226, 232, 240, 0.9)",
          bgcolor: "#fff",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        {/* Cover Banner */}
        <Box
          sx={{
            height: 128,
            backgroundImage: "linear-gradient(to right, #dcfce7, #e2f9ed, #f0fdf4)",
            borderBottom: "1px solid rgba(167, 243, 208, 0.6)",
            position: "relative"
          }}
        />

        <Box sx={{ px: { xs: 3, md: 4 }, pb: 5, mt: -7 }}>
          {/* Avatar and Basic Information */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 2,
              pb: 4,
              borderBottom: "1px solid #f1f5f9"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
              {/* Avatar */}
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={avatarSrc}
                  sx={{
                    width: 96,
                    height: 96,
                    border: "4px solid #fff",
                    backgroundImage: "linear-gradient(to top right, #059669, #14b8a6)",
                    fontSize: 36,
                    fontWeight: 700,
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
                </Avatar>
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: "absolute",
                    bottom: 4,
                    right: 4,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: "#fff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#475569",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "#10b981", color: "#059669" }
                  }}
                  title="Đổi ảnh đại diện"
                >
                  <Camera size={14} />
                </Box>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                />
              </Box>

              {/* Name & Role */}
              <Box sx={{ mb: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                  {profile.fullName || "Người dùng"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: "#065f46",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    <Store size={12} /> {getRoleLabel(profile.role)}
                  </Box>
                  {profile.active !== false && (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #e2e8f0",
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "#10b981"
                        }}
                      />
                      Đang hoạt động
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Quick Stat Pill */}
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1.5,
                borderRadius: 3,
                bgcolor: "rgba(236, 253, 245, 0.8)",
                border: "1px solid rgba(167, 243, 208, 0.7)",
                color: "#065f46",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              <ShieldCheck size={18} color="#059669" />
              Tài khoản đã xác thực hợp lệ
            </Box>
          </Box>

          {/* Two-column Body */}
          <Grid container spacing={4} sx={{ mt: 1 }}>
            {/* Left Column: Thông tin cá nhân */}
            <Grid item xs={12} lg={7}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 2, mb: 1 }}>
                <User size={18} color="#059669" />
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                  Thông tin cá nhân
                </Typography>
              </Box>

              <form onSubmit={handleUpdateProfile}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b", mb: 1 }}>
                      Họ và tên *
                    </Typography>
                    <TextField
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      fullWidth
                      size="small"
                      required
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500, bgcolor: "#fff" } }}
                    />
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b", mb: 1 }}>
                      Email liên hệ (Định danh tài khoản)
                    </Typography>
                    <TextField
                      value={profile.email || ""}
                      fullWidth
                      size="small"
                      disabled
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500, bgcolor: "#f8fafc" } }}
                    />
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b", mb: 1 }}>
                      Số điện thoại
                    </Typography>
                    <TextField
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0912345678"
                      fullWidth
                      size="small"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500, bgcolor: "#fff" } }}
                    />
                  </Box>

                  <Box sx={{ pt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}
                      sx={{
                        bgcolor: "#059669",
                        "&:hover": { bgcolor: "#047857" },
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 13,
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.2)"
                      }}
                    >
                      {saving ? "Đang lưu..." : "Cập nhật thông tin"}
                    </Button>
                  </Box>
                </Box>
              </form>
            </Grid>

            {/* Right Column: Bảo mật & Tài khoản */}
            <Grid item xs={12} lg={5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 2, mb: 1 }}>
                <ShieldCheck size={18} color="#059669" />
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                  Bảo mật & Tài khoản
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Mật khẩu */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(226, 232, 240, 0.8)",
                    bgcolor: "rgba(248, 250, 252, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    transition: "background 0.2s",
                    "&:hover": { bgcolor: "#fff" }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: "#fff",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#475569",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                      }}
                    >
                      <KeyRound size={16} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                        Mật khẩu đăng nhập
                      </Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: 2, mt: 0.25, lineHeight: 1 }}>
                        ••••••••
                      </Typography>
                    </Box>
                  </Box>

                  {profile.provider === "GOOGLE" ? (
                    <Typography variant="caption" color="text.secondary">
                      Google OAuth
                    </Typography>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setPwdDialogOpen(true)}
                      sx={{
                        color: "#047857",
                        borderColor: "#e2e8f0",
                        bgcolor: "#fff",
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                        minWidth: "auto",
                        px: 2,
                        "&:hover": { bgcolor: "#ecfdf5", borderColor: "#e2e8f0", color: "#065f46" }
                      }}
                    >
                      Đổi
                    </Button>
                  )}
                </Box>

                {/* Ngày tham gia */}
                <Box sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "rgba(248, 250, 252, 0.6)", display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "#fff",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#475569",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                    }}
                  >
                    <Calendar size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                      Ngày tham gia hệ thống
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a", mt: 0.25 }}>
                      {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </Typography>
                  </Box>
                </Box>

                {/* 2FA */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid #d1fae5",
                    bgcolor: "rgba(236, 253, 245, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: "#fff",
                        border: "1px solid #a7f3d0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#059669",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                      }}
                    >
                      <Smartphone size={16} />
                    </Box>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                          Xác thực tài khoản (Active)
                        </Typography>
                        <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: "#d1fae5", color: "#047857", fontSize: 10, fontWeight: 700 }}>
                          Bật
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.25 }}>
                        Tài khoản hợp lệ và sẵn sàng giao dịch
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#059669" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#059669" }
                    }}
                  />
                </Box>

                {/* Support Note */}
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "rgba(254, 252, 232, 0.6)",
                    border: "1px solid rgba(253, 230, 138, 0.6)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5
                  }}
                >
                  <HelpCircle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                    Cần thay đổi thông tin pháp nhân hoặc giấy kiểm định chất lượng AI? Vui lòng liên hệ ban quản trị hệ thống.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Dialog Đổi mật khẩu */}
      <Dialog open={pwdDialogOpen} onClose={() => setPwdDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleChangePassword}>
          <DialogTitle sx={{ fontWeight: 800 }}>Đổi mật khẩu tài khoản</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              required
              fullWidth
              type="password"
              size="small"
              label="Mật khẩu hiện tại"
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
            />
            <TextField
              required
              fullWidth
              type="password"
              size="small"
              label="Mật khẩu mới (từ 6 ký tự)"
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
            />
            <TextField
              required
              fullWidth
              type="password"
              size="small"
              label="Xác nhận mật khẩu mới"
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPwdDialogOpen(false)} disabled={pwdSaving}>
              Huỷ
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={pwdSaving}
              sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}
            >
              {pwdSaving ? "Đang xử lý..." : "Lưu mật khẩu mới"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={4000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
