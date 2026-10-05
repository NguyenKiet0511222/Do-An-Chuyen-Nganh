import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Link,
  Paper,
  TextField,
  Typography
} from "@mui/material";
import { authApi } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import GoogleLoginButton from "../../components/GoogleLoginButton";

// Trang mặc định sau đăng nhập theo vai trò
function homeFor(user) {
  const role = user?.role;
  if (role === "ADMIN" || user?.roles?.includes("ADMIN")) return "/admin";
  if (role === "SELLER" || user?.roles?.includes("SELLER")) return "/seller";
  return "/";
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Bị chuyển tới từ thao tác cần đăng nhập (useRequireLogin / RequireAuth) -> nhắc lý do, xong quay lại trang đó
  const from = location.state?.from;
  const backTo = from ? `${from.pathname}${from.search ?? ""}` : null;
  const notice = location.state?.message || (from ? "Vui lòng đăng nhập để tiếp tục." : "");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Dùng chung cho đăng nhập mật khẩu và Google: data = { accessToken, tokenType, expiresIn, user }
  const finishLogin = (data) => {
    login(data);
    navigate(backTo || homeFor(data.user), { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      finishLogin(await authApi.login(form));
    } catch (err) {
      setError(
        err.response?.data?.message || "Không kết nối được máy chủ. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Đăng nhập
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Dành cho khách hàng, người bán và quản trị viên.
        </Typography>

        {notice && !error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {notice}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <TextField
            label="Mật khẩu"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>hoặc</Divider>

        <GoogleLoginButton onSuccess={finishLogin} onError={setError} />

        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          Chưa có tài khoản?{" "}
          {/* Giữ trang cần quay lại qua bước đăng ký */}
          <Link component={RouterLink} to="/register" state={{ from }} fontWeight={600}>
            Đăng ký ngay
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
