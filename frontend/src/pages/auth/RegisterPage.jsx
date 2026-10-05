import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography
} from "@mui/material";
import { authApi } from "../../services/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  // Trang cần quay lại sau khi đăng nhập (đi từ LoginPage sang)
  const from = useLocation().state?.from;
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      navigate("/login", {
        replace: true,
        state: { from, message: "Đăng ký thành công! Mời bạn đăng nhập." }
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Tạo tài khoản
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Mua nông sản đã kiểm định AI hoặc mở gian hàng của bạn.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Họ và tên"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            required
            autoComplete="name"
          />
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
            autoComplete="new-password"
            slotProps={{ htmlInput: { minLength: 6 } }}
          />
          <TextField
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            slotProps={{ htmlInput: { minLength: 6 } }}
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, textAlign: "center" }}>
          Đã có tài khoản?{" "}
          <Link component={RouterLink} to="/login" state={{ from }} fontWeight={600}>
            Đăng nhập
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}
