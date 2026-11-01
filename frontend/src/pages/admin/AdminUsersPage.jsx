import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Search, UserPlus, Lock, Unlock, Sparkles } from "lucide-react";
import { adminApi } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { formatDateTime, apiErrorMessage } from "../../utils/format";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [toastMsg, setToastMsg] = useState("");

  // Modal tạo Admin mới
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ fullName: "", email: "", password: "" });
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 12,
        keyword: search.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      };
      const res = await adminApi.user.getAll(params);
      if (res) {
        setUsers(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      }
    } catch (err) {
      console.warn("Lỗi khi tải danh sách người dùng:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Khoá / mở khoá tài khoản
  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      alert("Bạn không thể tự khoá tài khoản của chính mình.");
      return;
    }
    const newAction = user.status === "ACTIVE" ? "LOCK" : "UNLOCK";
    const confirmMsg =
      newAction === "LOCK"
        ? `Bạn có chắc muốn KHOÁ tài khoản "${user.email}"? Tài khoản này sẽ bị chặn truy cập ngay lập tức.`
        : `Bạn có chắc muốn MỞ KHOÁ tài khoản "${user.email}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.user.updateStatus(user.id, newAction);
      setToastMsg(`Đã ${newAction === "LOCK" ? "khoá" : "mở khoá"} tài khoản ${user.email}`);
      fetchUsers();
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể thay đổi trạng thái tài khoản"));
    }
  };

  // Đổi cấp độ tài khoản (STANDARD <-> PREMIUM)
  const handleToggleTier = async (user) => {
    const newTier = user.accountTier === "PREMIUM" ? "STANDARD" : "PREMIUM";
    try {
      await adminApi.user.updateTier(user.id, newTier);
      setToastMsg(`Đã chuyển tài khoản ${user.email} sang cấp ${newTier}`);
      fetchUsers();
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể cập nhật cấp độ tài khoản"));
    }
  };

  // Tạo quản trị viên mới
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.fullName.trim() || !adminForm.email.trim() || !adminForm.password) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setAdminSubmitting(true);
    try {
      await adminApi.user.createAdmin(adminForm);
      setToastMsg(`Đã tạo thành công tài khoản quản trị cho "${adminForm.email}"`);
      setCreateAdminOpen(false);
      setAdminForm({ fullName: "", email: "", password: "" });
      fetchUsers();
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể tạo tài khoản admin"));
    } finally {
      setAdminSubmitting(false);
    }
  };

  const getRoleChip = (role) => {
    switch (role) {
      case "ADMIN":
        return <Chip size="small" label="Quản trị viên" sx={{ bgcolor: "#0f172a", color: "#fff", fontWeight: 700 }} />;
      case "SELLER":
        return <Chip size="small" label="Người bán" color="success" variant="outlined" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip size="small" label="Khách hàng" variant="outlined" sx={{ fontWeight: 500 }} />;
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator="/" sx={{ mb: 1, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Tổng quan
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          Quản lý người dùng
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
            Quản trị người dùng & phân quyền
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng cộng: {totalElements} tài khoản trong hệ thống
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UserPlus size={16} />}
          onClick={() => setCreateAdminOpen(true)}
          sx={{ textTransform: "none", bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
        >
          Thêm quản trị viên
        </Button>
      </Box>

      {/* Filters Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#64748b" />
                  </InputAdornment>
                )
              }}
              sx={{ "& input": { fontSize: 13 } }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={3}>
            <Select
              size="small"
              fullWidth
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="all">Vai trò: Tất cả</MenuItem>
              <MenuItem value="CUSTOMER">Khách hàng (CUSTOMER)</MenuItem>
              <MenuItem value="SELLER">Người bán (SELLER)</MenuItem>
              <MenuItem value="ADMIN">Quản trị viên (ADMIN)</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={6} sm={3} md={3}>
            <Select
              size="small"
              fullWidth
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="all">Trạng thái: Tất cả</MenuItem>
              <MenuItem value="ACTIVE">Đang hoạt động</MenuItem>
              <MenuItem value="LOCKED">Bị khoá</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Họ và tên</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Email & SĐT</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Vai trò</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Cấp tài khoản</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Ngày tạo</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  {loading ? "Đang tải danh sách người dùng..." : "Không tìm thấy người dùng phù hợp."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isLocked = u.status === "LOCKED";
                const isPremium = u.accountTier === "PREMIUM";

                return (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: "#64748b" }}>#{u.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {u.fullName} {isSelf && <Chip size="small" label="Bạn" color="info" sx={{ height: 18, fontSize: 10, ml: 0.5 }} />}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>
                        {u.email}
                      </Typography>
                      {u.phone && (
                        <Typography variant="caption" color="text.secondary">
                          {u.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getRoleChip(u.role)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={isPremium ? <Sparkles size={12} /> : undefined}
                        label={isPremium ? "PREMIUM" : "STANDARD"}
                        color={isPremium ? "warning" : "default"}
                        variant={isPremium ? "filled" : "outlined"}
                        onClick={() => handleToggleTier(u)}
                        sx={{ cursor: "pointer", fontWeight: 700, fontSize: 11 }}
                        title="Bấm để đổi cấp Standard/Premium (Demo)"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={isLocked ? "Bị khoá" : "Hoạt động"}
                        color={isLocked ? "error" : "success"}
                        sx={{ fontWeight: 600, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
                      {formatDateTime(u.createdAt)}
                    </TableCell>
                    <TableCell align="right">
                      {!isSelf && (
                        <Button
                          size="small"
                          variant="outlined"
                          color={isLocked ? "success" : "error"}
                          startIcon={isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                          onClick={() => handleToggleStatus(u)}
                          sx={{ textTransform: "none", fontSize: 12, py: 0.3 }}
                        >
                          {isLocked ? "Mở khoá" : "Khoá"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(e, p) => setPage(p - 1)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}

      {/* Dialog Tạo Admin Mới */}
      <Dialog open={createAdminOpen} onClose={() => setCreateAdminOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleCreateAdmin}>
          <DialogTitle sx={{ fontWeight: 800 }}>Tạo tài khoản Quản trị viên</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Tài khoản được tạo sẽ có vai trò ADMIN và quyền truy cập toàn bộ trang quản trị.
            </Typography>
            <TextField
              required
              fullWidth
              size="small"
              label="Họ và tên"
              value={adminForm.fullName}
              onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
            />
            <TextField
              required
              fullWidth
              type="email"
              size="small"
              label="Email"
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            />
            <TextField
              required
              fullWidth
              type="password"
              size="small"
              label="Mật khẩu (từ 6 ký tự)"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateAdminOpen(false)} disabled={adminSubmitting}>
              Huỷ
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={adminSubmitting}
              sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
            >
              {adminSubmitting ? "Đang tạo..." : "Tạo Admin"}
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
