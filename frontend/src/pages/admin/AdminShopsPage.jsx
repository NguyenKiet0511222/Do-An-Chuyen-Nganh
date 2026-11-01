import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
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
import { Search, CheckCircle, Lock, Unlock, Phone } from "lucide-react";
import { adminApi, resolveAssetUrl } from "../../services/api";
import { apiErrorMessage, handleImageError } from "../../utils/format";

export default function AdminShopsPage() {
  const [shops, setShops] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // Bộ lọc
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMsg, setToastMsg] = useState("");

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: 12,
        keyword: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      };
      const res = await adminApi.shop.getAll(params);
      if (res) {
        setShops(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      }
    } catch (err) {
      console.warn("Lỗi khi tải danh sách cửa hàng:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Xác minh / khoá / mở khoá shop
  const handleAction = async (shop, action) => {
    let confirmMsg = "";
    if (action === "VERIFY") {
      confirmMsg = `Xác minh cửa hàng "${shop.shopName}"? Chủ shop sẽ được nâng quyền SELLER.`;
    } else if (action === "LOCK") {
      confirmMsg = `Bạn có chắc muốn KHOÁ cửa hàng "${shop.shopName}"?`;
    } else if (action === "UNLOCK") {
      confirmMsg = `Mở khoá cửa hàng "${shop.shopName}"?`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.shop.updateStatus(shop.id, { action });
      setToastMsg(`Đã thực hiện "${action}" cho shop ${shop.shopName}`);
      fetchShops();
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể cập nhật trạng thái cửa hàng"));
    }
  };

  const getShopStatusChip = (status) => {
    switch (status) {
      case "ACTIVE":
        return <Chip size="small" label="Đang hoạt động" color="success" sx={{ fontWeight: 600, fontSize: 11 }} />;
      case "PENDING_VERIFICATION":
        return (
          <Chip
            size="small"
            label="Chờ xác minh"
            variant="outlined"
            sx={{ borderStyle: "dashed", borderColor: "#f59e0b", color: "#b45309", fontWeight: 700, fontSize: 11 }}
          />
        );
      case "LOCKED":
        return <Chip size="small" label="Bị khoá" color="error" sx={{ fontWeight: 600, fontSize: 11 }} />;
      default:
        return <Chip size="small" label={status} variant="outlined" sx={{ fontSize: 11 }} />;
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
          Quản lý cửa hàng
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
            Quản trị gian hàng nông sản (Shops)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng cộng: {totalElements} gian hàng trong hệ thống
          </Typography>
        </Box>
        {loading && <CircularProgress size={20} />}
      </Box>

      {/* Filters Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={6}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm theo tên gian hàng hoặc email chủ shop..."
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

          <Grid item xs={12} sm={4} md={3}>
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
              <MenuItem value="PENDING_VERIFICATION">Chờ xác minh</MenuItem>
              <MenuItem value="LOCKED">Bị khoá</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Paper>

      {/* Shops Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Gian hàng</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Chủ cửa hàng</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Tỉnh thành</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Sản phẩm (Duyệt/Chờ/Từ chối)</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Tổng đơn</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  {loading ? "Đang tải danh sách cửa hàng..." : "Không tìm thấy gian hàng nào."}
                </TableCell>
              </TableRow>
            ) : (
              shops.map((s) => {
                const logo = resolveAssetUrl(s.logoUrl);
                const counts = s.productCounts || { approved: 0, pending: 0, rejected: 0 };

                return (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: "#64748b" }}>#{s.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          component="img"
                          src={logo || "https://placehold.co/40x40?text=Shop"}
                          alt={s.shopName}
                          onError={handleImageError}
                          sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: "cover", bgcolor: "#f1f5f9" }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {s.shopName}
                          </Typography>
                          {s.phone && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Phone size={11} /> {s.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                        {s.owner?.fullName || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.owner?.email || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{s.province || "—"}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "inline-flex", gap: 0.5, fontSize: 12 }}>
                        <Chip size="small" label={`${counts.approved} duyệt`} color="success" sx={{ height: 20, fontSize: 10 }} />
                        <Chip size="small" label={`${counts.pending} chờ`} color="warning" sx={{ height: 20, fontSize: 10 }} />
                        <Chip size="small" label={`${counts.rejected} huỷ`} sx={{ height: 20, fontSize: 10 }} />
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 13 }}>
                      {s.orderCount || 0}
                    </TableCell>
                    <TableCell>{getShopStatusChip(s.status)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8 }}>
                        {s.status === "PENDING_VERIFICATION" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle size={14} />}
                            onClick={() => handleAction(s, "VERIFY")}
                            sx={{ textTransform: "none", fontSize: 12, py: 0.3 }}
                          >
                            Xác minh
                          </Button>
                        )}
                        {s.status === "ACTIVE" && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Lock size={14} />}
                            onClick={() => handleAction(s, "LOCK")}
                            sx={{ textTransform: "none", fontSize: 12, py: 0.3 }}
                          >
                            Khoá
                          </Button>
                        )}
                        {s.status === "LOCKED" && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<Unlock size={14} />}
                            onClick={() => handleAction(s, "UNLOCK")}
                            sx={{ textTransform: "none", fontSize: 12, py: 0.3 }}
                          >
                            Mở khoá
                          </Button>
                        )}
                      </Box>
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

      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={4000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
