import { Box, Typography, Paper, Grid, TextField, Button, Avatar, Chip, Switch } from "@mui/material";
import { User, Mail, Phone, Calendar, ShieldCheck, KeyRound, Camera, Store, CircleUserRound, Smartphone, Check, HelpCircle } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useState, useEffect } from "react";
import { authApi } from "../../services/api";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(!user);
  const [twoFactor, setTwoFactor] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await authApi.me();
        if (data) setProfile(data);
      } catch (error) {
        console.error("Lỗi lấy thông tin:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN": return "Quản trị viên";
      case "SELLER": return "Chủ cửa hàng";
      default: return "Khách hàng";
    }
  };

  return (
    <Box sx={{ pb: 6, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ w: 40, h: 40, minWidth: 40, borderRadius: 3, bgcolor: "rgba(209, 250, 229, 0.7)", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircleUserRound size={22} strokeWidth={2} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Hồ sơ tài khoản
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5, fontWeight: 500 }}>
            Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản bán hàng
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid rgba(226, 232, 240, 0.9)", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        
        {/* Cover Banner */}
        <Box sx={{ height: 128, backgroundImage: "linear-gradient(to right, #dcfce7, #e2f9ed, #f0fdf4)", borderBottom: "1px solid rgba(167, 243, 208, 0.6)", position: "relative" }} />
        
        <Box sx={{ px: { xs: 3, md: 4 }, pb: 5, mt: -7 }}>
          {/* Avatar and Basic Information */}
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 2, pb: 4, borderBottom: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
              {/* Avatar */}
              <Box sx={{ position: "relative" }}>
                <Avatar 
                  src={profile.avatarUrl}
                  sx={{ width: 96, height: 96, border: "4px solid #fff", backgroundImage: "linear-gradient(to top right, #059669, #14b8a6)", fontSize: 36, fontWeight: 700, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                >
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U"}
                </Avatar>
                <Box sx={{ position: "absolute", bottom: 4, right: 4, w: 28, h: 28, borderRadius: "50%", bgcolor: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.2s", "&:hover": { borderColor: "#10b981", color: "#059669" } }}>
                  <Camera size={14} />
                </Box>
              </Box>

              {/* Seller Name & Status */}
              <Box sx={{ mb: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                  {profile.fullName || "Người dùng"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: "#065f46", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                    <Store size={12} /> {getRoleLabel(profile.role)}
                  </Box>
                  {profile.active !== false && (
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600 }}>
                      <Box sx={{ w: 6, h: 6, borderRadius: "50%", bgcolor: "#10b981", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
                      Đang hoạt động
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Quick Stat Pill */}
            <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1, px: 2, py: 1.5, borderRadius: 3, bgcolor: "rgba(236, 253, 245, 0.8)", border: "1px solid rgba(167, 243, 208, 0.7)", color: "#065f46", fontSize: 12, fontWeight: 600 }}>
              <ShieldCheck size={18} color="#059669" />
              Tài khoản đã hoàn tất kiểm định danh tính
            </Box>
          </Box>

          {/* Two-column Body */}
          <Grid container spacing={4} sx={{ mt: 1 }}>
            
            {/* Left Column: Thông tin cá nhân */}
            <Grid item xs={12} lg={7}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 2, mb: 1 }}>
                <User size={18} color="#059669" />
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Thông tin cá nhân</Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b", mb: 1 }}>Họ và tên</Typography>
                  <TextField 
                    defaultValue={profile.fullName || ""} 
                    fullWidth size="small" 
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500, bgcolor: "#fff" } }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b", mb: 1 }}>Email liên hệ</Typography>
                  <TextField 
                    defaultValue={profile.email || ""} 
                    fullWidth size="small" 
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500, bgcolor: "#fff" } }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#64748b", mb: 1 }}>Số điện thoại</Typography>
                  <TextField 
                    defaultValue={profile.phone || ""} 
                    fullWidth size="small" 
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500, bgcolor: "#fff" } }}
                  />
                </Box>

                <Box sx={{ pt: 1 }}>
                  <Button variant="contained" startIcon={<Check size={16} />} sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" }, textTransform: "none", fontWeight: 600, fontSize: 13, borderRadius: 2, px: 3, py: 1, boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.2)" }}>
                    Cập nhật thông tin
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Right Column: Bảo mật & Tài khoản */}
            <Grid item xs={12} lg={5}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 2, mb: 1 }}>
                <ShieldCheck size={18} color="#059669" />
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>Bảo mật & Tài khoản</Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                
                {/* Mật khẩu */}
                <Box sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "rgba(248, 250, 252, 0.6)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, transition: "background 0.2s", "&:hover": { bgcolor: "#fff" } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ w: 40, h: 40, borderRadius: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      <KeyRound size={16} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Mật khẩu</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: 2, mt: 0.25, lineHeight: 1 }}>••••••••</Typography>
                    </Box>
                  </Box>
                  <Button size="small" variant="outlined" sx={{ color: "#047857", borderColor: "#e2e8f0", bgcolor: "#fff", textTransform: "none", fontWeight: 700, borderRadius: 2, minWidth: "auto", px: 2, "&:hover": { bgcolor: "#ecfdf5", borderColor: "#e2e8f0", color: "#065f46" } }}>
                    Đổi
                  </Button>
                </Box>

                {/* Ngày tham gia */}
                <Box sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.8)", bgcolor: "rgba(248, 250, 252, 0.6)", display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ w: 40, h: 40, borderRadius: 2, bgcolor: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <Calendar size={16} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Ngày tham gia hệ thống</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a", mt: 0.25 }}>
                      {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "27/9/2026"}
                    </Typography>
                  </Box>
                </Box>

                {/* 2FA */}
                <Box sx={{ p: 2, borderRadius: 3, border: "1px solid #d1fae5", bgcolor: "rgba(236, 253, 245, 0.4)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ w: 40, h: 40, borderRadius: 2, bgcolor: "#fff", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      <Smartphone size={16} />
                    </Box>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Xác thực 2 lớp (2FA)</Typography>
                        <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: "#d1fae5", color: "#047857", fontSize: 10, fontWeight: 700 }}>Bật</Box>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: "#64748b", mt: 0.25 }}>Bảo vệ mã OTP khi đăng nhập</Typography>
                    </Box>
                  </Box>
                  <Switch checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#059669" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#059669" } }} />
                </Box>

                {/* Support Note */}
                <Box sx={{ mt: 2, p: 2, borderRadius: 3, bgcolor: "rgba(254, 252, 232, 0.6)", border: "1px solid rgba(253, 230, 138, 0.6)", display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <HelpCircle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                    Cần thay đổi thông tin pháp nhân hoặc giấy kiểm định chất lượng AI? Vui lòng liên hệ <Typography component="span" sx={{ color: "#047857", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer" }}>Đội ngũ hỗ trợ đối tác</Typography>.
                  </Typography>
                </Box>
                
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
