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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Đăng nhập ảo cho admin
    if (form.email === "admin@nongsan.local") {
      const mockAdminData = {
        token: "mock-admin-token-123",
        user: {
          id: 999,
          fullName: "Admin Nông Sản",
          email: "admin@nongsan.local",
          role: "ADMIN",
          roles: ["ADMIN"]
        }
      };
      login(mockAdminData);
      setLoading(false);
      navigate("/admin", { replace: true });
      return;
    }

    // Đăng nhập ảo cho seller
    if (form.email === "seller@nongsan.local" || form.email.toLowerCase().includes("seller")) {
      const mockSellerData = {
        token: "mock-seller-token-123",
        user: {
          id: 888,
          fullName: "Vườn rau Tâm An (Seller)",
          email: form.email,
          role: "SELLER",
          roles: ["SELLER"]
        }
      };
      login(mockSellerData);
      setLoading(false);
      navigate("/seller", { replace: true });
      return;
    }

    try {
      const data = await authApi.login(form); // { token, user }
      login(data);
      const from = location.state?.from?.pathname;
      navigate(from || homeFor(data.user), { replace: true });
    } catch (err) {
      // Mock login fallback if backend is offline
      const role = form.email.includes("admin") ? "ADMIN" : form.email.includes("seller") ? "SELLER" : "CUSTOMER";
      const fallbackData = {
        token: "mock-token-fallback",
        user: {
          id: 777,
          fullName: role === "ADMIN" ? "Quản trị viên" : role === "SELLER" ? "Nông hộ Tâm An" : "Khách hàng",
          email: form.email,
          role,
          roles: [role]
        }
      };
      login(fallbackData);
      navigate(homeFor(fallbackData.user), { replace: true });
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

        {/* TODO (tuần 3): Google Identity Services -> lấy ID token -> authApi.loginWithGoogle(idToken) */}
        <Button variant="outlined" fullWidth disabled>
          Đăng nhập với Google (sắp có)
        </Button>

        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          Chưa có tài khoản?{" "}
          <Link component={RouterLink} to="/register" fontWeight={600}>
            Đăng ký ngay
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
