import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  Grid,
  InputAdornment,
  Link,
  Pagination,
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { Search } from "lucide-react";
import { adminApi, resolveAssetUrl } from "../../services/api";
import AiLabelChip from "../../components/ai/AiLabelChip";
import { handleImageError } from "../../utils/format";
import { notifyAiPendingChanged } from "./components/aiReview";

const TAB_STATUS_MAP = [
  null,          // 0: Tất cả
  "PENDING",     // 1: Chờ duyệt
  "APPROVED",    // 2: Đã duyệt
  "NEED_INFO",   // 3: Cần bổ sung
  "REJECTED",    // 4: Từ chối
  "HIDDEN"       // 5: Đang ẩn
];

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [tabIndex, setTabIndex] = useState(1); // Mặc định: Chờ duyệt
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const status = TAB_STATUS_MAP[tabIndex];
      const params = {
        page,
        size: 10,
        keyword: searchTerm.trim() || undefined,
        status: status || undefined
      };
      const res = await adminApi.product.getAll(params);
      setProducts(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
      setSelectedIds([]);
    } catch (err) {
      console.warn("Lỗi tải danh sách sản phẩm admin:", err.message);
    } finally {
      setLoading(false);
    }
  }, [tabIndex, page, searchTerm]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await adminApi.product.reviewBulk({
        productIds: selectedIds,
        action: "APPROVE"
      });
      setToastMsg(`Đã duyệt thành công ${res.succeeded || selectedIds.length} sản phẩm.`);
      notifyAiPendingChanged();
      loadProducts();
    } catch (err) {
      setToastMsg(err.response?.data?.message || err.message || "Lỗi khi duyệt hàng loạt");
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.length === 0) return;
    const reason = window.prompt("Nhập lý do từ chối cho các sản phẩm đã chọn:");
    if (!reason || !reason.trim()) {
      if (reason !== null) alert("Cần nhập lý do từ chối.");
      return;
    }

    try {
      const res = await adminApi.product.reviewBulk({
        productIds: selectedIds,
        action: "REJECT",
        reason: reason.trim()
      });
      setToastMsg(`Đã từ chối ${res.succeeded || selectedIds.length} sản phẩm.`);
      // Sản phẩm bị từ chối -> ảnh chờ kiểm định rời hàng chờ (docs/1910.md mục 2), badge menu tải lại
      notifyAiPendingChanged();
      loadProducts();
    } catch (err) {
      setToastMsg(err.response?.data?.message || err.message || "Lỗi khi từ chối hàng loạt");
    }
  };

  const handleSingleReview = async (id, action) => {
    let reason = null;
    if (action === "REJECT" || action === "NEED_INFO") {
      reason = window.prompt(`Nhập lý do ${action === "REJECT" ? "từ chối" : "yêu cầu bổ sung"}:`);
      if (!reason || !reason.trim()) {
        if (reason !== null) alert("Lý do là bắt buộc!");
        return;
      }
      reason = reason.trim();
    }

    try {
      await adminApi.product.review(id, { action, reason: reason || undefined });
      setToastMsg(`Đã cập nhật trạng thái sản phẩm thành công.`);
      notifyAiPendingChanged();
      loadProducts();
    } catch (err) {
      setToastMsg(err.response?.data?.message || err.message || "Lỗi khi xử lý");
    }
  };

  const getStatusChip = (status, hiddenBy) => {
    if (status === "HIDDEN" && hiddenBy === "ADMIN") {
      return (
        <Chip
          size="small"
          label="Đang ẩn (Admin)"
          color="error"
          variant="outlined"
          sx={{ fontSize: 11.5, fontWeight: 600 }}
        />
      );
    }
    const map = {
      PENDING: { label: "Chờ duyệt", color: "warning" },
      APPROVED: { label: "Đã duyệt", color: "success" },
      REJECTED: { label: "Từ chối", color: "error" },
      NEED_INFO: { label: "Cần bổ sung", color: "info" },
      HIDDEN: { label: "Đang ẩn", color: "default" },
      DRAFT: { label: "Bản nháp", color: "default" }
    };
    const info = map[status] || { label: status, color: "default" };
    return (
      <Chip
        size="small"
        label={info.label}
        color={info.color}
        variant="outlined"
        sx={{ fontSize: 11.5, fontWeight: 600 }}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator="/" sx={{ mb: 1, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Sản phẩm
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          Danh sách sản phẩm
        </Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2, color: "#0f172a" }}>
        Quản lý & duyệt sản phẩm
      </Typography>

      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => { setTabIndex(v); setPage(0); }}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: 14,
              fontWeight: 600,
              minWidth: 100
            }
          }}
        >
          <Tab label="Tất cả" />
          <Tab label="Chờ duyệt" />
          <Tab label="Đã duyệt" />
          <Tab label="Cần bổ sung" />
          <Tab label="Từ chối" />
          <Tab label="Đang ẩn" />
        </Tabs>
      </Box>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm theo tên sản phẩm, mã SP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94a3b8" />
                    </InputAdornment>
                  ),
                  sx: { fontSize: 13 }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: "right" }}>
            <Typography variant="body2" color="text.secondary">
              Tìm thấy <strong>{totalElements}</strong> sản phẩm
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Batch Action Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: selectedIds.length > 0 ? "#f8fafc" : "#ffffff"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Checkbox
            size="small"
            checked={selectedIds.length === products.length && products.length > 0}
            indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
            onChange={handleSelectAll}
          />
          <Typography variant="body2" fontWeight={600} sx={{ color: "#334155", fontSize: 13 }}>
            Đã chọn {selectedIds.length} sản phẩm
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            disabled={selectedIds.length === 0}
            onClick={handleBatchApprove}
            sx={{ textTransform: "none", fontSize: 12.5, bgcolor: "#0f172a" }}
          >
            Duyệt hàng loạt
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={selectedIds.length === 0}
            onClick={handleBatchReject}
            sx={{ textTransform: "none", fontSize: 12.5 }}
          >
            Từ chối hàng loạt
          </Button>
        </Box>
      </Paper>

      {/* Products Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <Table sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 700, fontSize: 12.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selectedIds.length === products.length && products.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell>Người bán (Shop)</TableCell>
              <TableCell align="right">Giá bán</TableCell>
              <TableCell align="right">Tồn kho</TableCell>
              <TableCell>Nhãn AI</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Ngày đăng</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  Đang tải dữ liệu sản phẩm...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Không tìm thấy sản phẩm nào phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              products.map((prod) => {
                const isSelected = selectedIds.includes(prod.id);
                return (
                  <TableRow
                    key={prod.id}
                    hover
                    selected={isSelected}
                    sx={{ "&:hover": { bgcolor: "#f8fafc" } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(prod.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1,
                            overflow: "hidden",
                            bgcolor: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            flexShrink: 0
                          }}
                        >
                          <img
                            src={resolveAssetUrl(prod.primaryImageUrl) || "https://placehold.co/100x100?text=No+Image"}
                            alt={prod.name}
                            onError={handleImageError}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              color: "#0f172a",
                              cursor: "pointer",
                              "&:hover": { textDecoration: "underline" }
                            }}
                            onClick={() => navigate(`/admin/products/${prod.id}`)}
                          >
                            {prod.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Mã #{prod.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>
                      {prod.category?.name || "Chưa phân loại"}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                      {prod.shop?.shopName || "N/A"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>
                      {(prod.price || 0).toLocaleString("vi-VN")} đ/{prod.unit || "kg"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13 }}>
                      {prod.stockQuantity} {prod.unit || "kg"}
                    </TableCell>

                    <TableCell>
                      <AiLabelChip label={prod.aiOverallLabel} confidence={prod.aiOverallConfidence} size="small" />
                    </TableCell>

                    <TableCell>
                      {getStatusChip(prod.status, prod.hiddenBy)}
                    </TableCell>

                    <TableCell align="right" sx={{ fontSize: 12, color: "text.secondary" }}>
                      {prod.createdAt ? new Date(prod.createdAt).toLocaleDateString("vi-VN") : ""}
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                        <Link
                          component={RouterLink}
                          to={`/admin/products/${prod.id}`}
                          underline="hover"
                          sx={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}
                        >
                          Chi tiết
                        </Link>
                        {prod.status === "PENDING" && (
                          <>
                            <Typography variant="caption" color="text.disabled">·</Typography>
                            <Button
                              size="small"
                              onClick={() => handleSingleReview(prod.id, "APPROVE")}
                              sx={{ fontSize: 12, p: 0, minWidth: "auto", textTransform: "none", color: "#16a34a", fontWeight: 600 }}
                            >
                              Duyệt
                            </Button>
                            <Typography variant="caption" color="text.disabled">·</Typography>
                            <Button
                              size="small"
                              onClick={() => handleSingleReview(prod.id, "NEED_INFO")}
                              sx={{ fontSize: 12, p: 0, minWidth: "auto", textTransform: "none", color: "#0284c7", fontWeight: 600 }}
                            >
                              Bổ sung
                            </Button>
                            <Typography variant="caption" color="text.disabled">·</Typography>
                            <Button
                              size="small"
                              onClick={() => handleSingleReview(prod.id, "REJECT")}
                              sx={{ fontSize: 12, p: 0, minWidth: "auto", textTransform: "none", color: "#dc2626", fontWeight: 600 }}
                            >
                              Từ chối
                            </Button>
                          </>
                        )}
                        {prod.status === "APPROVED" && (
                          <>
                            <Typography variant="caption" color="text.disabled">·</Typography>
                            <Button
                              size="small"
                              onClick={() => handleSingleReview(prod.id, "HIDE")}
                              sx={{ fontSize: 12, p: 0, minWidth: "auto", textTransform: "none", color: "#64748b", fontWeight: 600 }}
                            >
                              Ẩn
                            </Button>
                          </>
                        )}
                        {prod.status === "HIDDEN" && (
                          <>
                            <Typography variant="caption" color="text.disabled">·</Typography>
                            <Button
                              size="small"
                              onClick={() => handleSingleReview(prod.id, "UNHIDE")}
                              sx={{ fontSize: 12, p: 0, minWidth: "auto", textTransform: "none", color: "#2563eb", fontWeight: 600 }}
                            >
                              Bỏ ẩn
                            </Button>
                          </>
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
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(e, p) => setPage(p - 1)}
            color="primary"
          />
        </Box>
      )}

      {/* Feedback Toast */}
      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={3000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
