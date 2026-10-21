import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { Package, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { categoryApi, resolveAssetUrl, sellerApi } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import AiLabelChip from "../../components/ai/AiLabelChip";
import { PRODUCT_STATUS_META } from "../../utils/aiLabel";
import { flattenCategoryTree } from "../../utils/categories";
import { apiErrorMessage, handleImageError } from "../../utils/format";
import { notifySellerDataChanged } from "../../utils/sellerEvents";
import ProductConfirmDialog from "./components/ProductConfirmDialog";
import ProductStockInlineEditor from "./components/ProductStockInlineEditor";

const PAGE_SIZE = 10;
// Lọc danh mục: /seller/products không có tham số categoryId -> tải tối đa 100 sản phẩm (giới hạn size của backend)
// rồi lọc + phân trang phía trình duyệt
const CATEGORY_FETCH_SIZE = 100;

const TABS = [
  { label: "Tất cả", statuses: null, activeColor: "#047857", badgeBg: "#d1fae5", badgeColor: "#065f46" },
  { label: "Nháp", statuses: ["DRAFT"], activeColor: "#334155", badgeBg: "#f1f5f9", badgeColor: "#475569" },
  { label: "Chờ duyệt", statuses: ["PENDING"], activeColor: "#b45309", badgeBg: "#fef3c7", badgeColor: "#b45309" },
  { label: "Đã duyệt", statuses: ["APPROVED"], activeColor: "#047857", badgeBg: "#f1f5f9", badgeColor: "#475569" },
  { label: "Từ chối / cần bổ sung", statuses: ["REJECTED", "NEED_INFO"], activeColor: "#e11d48", badgeBg: "#ffe4e6", badgeColor: "#be123c" },
  { label: "Đang ẩn", statuses: ["HIDDEN"], activeColor: "#334155", badgeBg: "#f1f5f9", badgeColor: "#475569" }
];

const headCellSx = {
  fontWeight: 700,
  color: "#64748b",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  borderBottom: "1px solid rgba(226, 232, 240, 0.8)"
};
const cellSx = { borderBottom: "1px solid #f1f5f9" };
const filterFieldSx = { "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc", borderRadius: "10px", "& fieldset": { borderColor: "#e2e8f0" } } };
const actionBtnSx = { minWidth: 0, px: 1, py: 0.25, fontSize: 13, fontWeight: 600, borderRadius: "8px", boxShadow: "none", "&:hover": { boxShadow: "none", transform: "none" } };

/** Mở thẳng tab qua ?status=REJECTED,NEED_INFO (vd từ trang tổng quan). */
const tabFromQuery = (status) => {
  const idx = status ? TABS.findIndex((t) => t.statuses?.join(",") === status) : -1;
  return idx >= 0 ? idx : 0;
};

/** Danh mục được chọn + mọi danh mục con cháu (chọn "Rau củ" thì gồm cả "Củ quả", "Rau lá"). */
const categoryWithDescendants = (flat, categoryId) => {
  const ids = new Set([String(categoryId)]);
  let grew = true;
  while (grew) {
    grew = false;
    flat.forEach((c) => {
      if (c.parentId != null && ids.has(String(c.parentId)) && !ids.has(String(c.id))) {
        ids.add(String(c.id));
        grew = true;
      }
    });
  }
  return ids;
};

/**
 * Sản phẩm của shop — chỉ dữ liệu thật từ GET /api/seller/products (docs/2110.md L1-3, L2-6):
 * tab theo trạng thái (đếm từ summary.productsByStatus), tìm theo tên (keyword phía server), phân trang server,
 * nút thao tác theo trạng thái, sửa tồn kho tại chỗ.
 */
export default function SellerProductsPage() {
  const [searchParams] = useSearchParams();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");

  const [tabValue, setTabValue] = useState(() => tabFromQuery(searchParams.get("status")));
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState({ request: null, data: null, error: null });
  const [productsByStatus, setProductsByStatus] = useState(null);
  const [categories, setCategories] = useState([]);
  const [actingId, setActingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  const notify = (severity, message) => setToast({ open: true, severity, message });
  const reload = () => setReloadKey((k) => k + 1);

  const filterByCategory = categoryFilter !== "all";
  // Mỗi bộ lọc tạo 1 request; loading = request đang hiển thị chưa phải request mới nhất
  const request = useMemo(
    () => ({
      params: {
        status: TABS[tabValue].statuses?.join(",") || undefined,
        keyword: keyword || undefined,
        page: filterByCategory ? 0 : page - 1,
        size: filterByCategory ? CATEGORY_FETCH_SIZE : PAGE_SIZE
      },
      reloadKey
    }),
    [tabValue, keyword, filterByCategory, page, reloadKey]
  );

  useEffect(() => {
    let ignore = false;
    sellerApi.product
      .getAll(request.params)
      .then((data) => {
        if (!ignore) setLoaded({ request, data, error: null });
      })
      .catch((error) => {
        if (!ignore) setLoaded({ request, data: null, error });
      });
    return () => {
      ignore = true;
    };
  }, [request]);

  // Số đếm tab = toàn shop (không theo từ khoá / danh mục); tài khoản admin không có shop -> không gọi
  useEffect(() => {
    if (isAdmin) return undefined;
    let ignore = false;
    sellerApi.dashboard
      .getSummary()
      .then((summary) => {
        if (!ignore) setProductsByStatus(summary?.productsByStatus ?? null);
      })
      .catch(() => {
        if (!ignore) setProductsByStatus(null);
      });
    return () => {
      ignore = true;
    };
  }, [isAdmin, reloadKey]);

  useEffect(() => {
    let ignore = false;
    categoryApi
      .getAll()
      .then((tree) => {
        if (!ignore) setCategories(flattenCategoryTree(tree));
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  // Gõ tìm kiếm -> chờ 400ms rồi mới gọi API (tham số keyword, backend tìm theo tên)
  useEffect(() => {
    const next = searchInput.trim();
    if (next === keyword) return undefined;
    const timer = setTimeout(() => {
      setKeyword(next);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, keyword]);

  const loading = loaded.request !== request;
  const allowedCategoryIds = useMemo(
    () => (filterByCategory ? categoryWithDescendants(categories, categoryFilter) : null),
    [filterByCategory, categories, categoryFilter]
  );

  const view = useMemo(() => {
    const data = loaded.data;
    if (!data) return { rows: [], totalElements: 0, totalPages: 0, truncated: false };
    if (!allowedCategoryIds) {
      return { rows: data.content ?? [], totalElements: data.totalElements ?? 0, totalPages: data.totalPages ?? 0, truncated: false };
    }
    const matched = (data.content ?? []).filter((p) => allowedCategoryIds.has(String(p.category?.id)));
    return {
      rows: matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      totalElements: matched.length,
      totalPages: Math.ceil(matched.length / PAGE_SIZE),
      truncated: (data.totalElements ?? 0) > (data.content ?? []).length
    };
  }, [loaded.data, allowedCategoryIds, page]);

  // Thao tác (gửi duyệt, ẩn, xoá…) làm dòng cuối của trang cuối rời tab -> trang hiện tại trống: lùi về trang cuối còn dữ liệu
  const lastPage = Math.max(1, view.totalPages);
  if (!loading && !loaded.error && page > lastPage) {
    setPage(lastPage);
  }

  const tabCount = (tab) => {
    if (!productsByStatus) return null;
    const keys = tab.statuses ?? Object.keys(productsByStatus);
    return keys.reduce((sum, key) => sum + (productsByStatus[key] ?? 0), 0);
  };

  const loadErrorMessage = (() => {
    const err = loaded.error;
    if (!err) return null;
    if (err.response?.status === 404 && isAdmin) return "Tài khoản quản trị không có shop — khu người bán dành cho người bán.";
    return apiErrorMessage(err, "Không tải được danh sách sản phẩm. Kiểm tra kết nối tới máy chủ rồi thử lại.");
  })();
  const noFilter = !TABS[tabValue].statuses && !keyword && !filterByCategory;
  const shopEmpty = !loading && !loaded.error && noFilter && view.totalElements === 0;

  const updateRow = (updated) =>
    setLoaded((prev) =>
      prev.data
        ? { ...prev, data: { ...prev.data, content: prev.data.content.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)) } }
        : prev
    );

  const runAction = async (row, action, successMessage, fallback) => {
    setActingId(row.id);
    try {
      await action();
      notify("success", successMessage);
      notifySellerDataChanged();
      reload();
      return true;
    } catch (err) {
      notify("error", apiErrorMessage(err, fallback));
      return false;
    } finally {
      setActingId(null);
    }
  };

  const handleSubmit = (row) =>
    runAction(row, () => sellerApi.product.submit(row.id), `Đã gửi duyệt "${row.name}"`, "Không gửi duyệt được sản phẩm.");

  const handleVisibility = (row, hidden) =>
    runAction(
      row,
      () => sellerApi.product.changeVisibility(row.id, hidden),
      hidden ? `Đã ẩn "${row.name}" khỏi trang bán` : `Đã bỏ ẩn — "${row.name}" đang bán lại`,
      hidden ? "Không ẩn được sản phẩm." : "Không bỏ ẩn được sản phẩm."
    );

  const handleDelete = async () => {
    const row = deleteTarget;
    await runAction(row, () => sellerApi.product.delete(row.id), `Đã xoá "${row.name}"`, "Không xoá được sản phẩm.");
    setDeleteTarget(null);
  };

  const rangeFrom = view.totalElements > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeTo = Math.min(page * PAGE_SIZE, view.totalElements);

  return (
    <Box sx={{ pb: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Sản phẩm của shop
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
          Quản lý sản phẩm, tồn kho, trạng thái duyệt và nhãn chất lượng AI của từng sản phẩm
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.9)", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <Box sx={{ borderBottom: "1px solid #f1f5f9", px: 1 }}>
          <Tabs
            value={tabValue}
            onChange={(_e, value) => {
              setTabValue(value);
              setPage(1);
            }}
            variant="scrollable"
            scrollButtons="auto"
            slotProps={{ indicator: { sx: { bgcolor: TABS[tabValue].activeColor, height: 2 } } }}
          >
            {TABS.map((tab, idx) => {
              const count = tabCount(tab);
              return (
                <Tab
                  key={tab.label}
                  disableRipple
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {tab.label}
                      {count !== null && (
                        <Box sx={{ px: 1, py: 0.25, borderRadius: "10px", fontSize: 11, fontWeight: 600, bgcolor: tab.badgeBg, color: tab.badgeColor }}>
                          {count}
                        </Box>
                      )}
                    </Box>
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: tabValue === idx ? 700 : 500,
                    color: tabValue === idx ? `${tab.activeColor} !important` : "#64748b",
                    fontSize: 13,
                    px: 3,
                    py: 2.5,
                    minHeight: "auto"
                  }}
                />
              );
            })}
          </Tabs>
        </Box>

        <Box sx={{ p: 2.5, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, flex: 1, minWidth: 280 }}>
            <TextField
              placeholder="Tìm theo tên sản phẩm..."
              size="small"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ width: { xs: "100%", sm: 320 }, ...filterFieldSx }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start"><Search size={16} color="#94a3b8" /></InputAdornment> }
              }}
            />
            <TextField
              select
              size="small"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 180, ...filterFieldSx }}
            >
              <MenuItem value="all">Tất cả danh mục</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={String(c.id)} sx={{ pl: 2 + c.depth * 2, fontWeight: c.hasChildren ? 600 : 400 }}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Button
            variant="contained"
            component={Link}
            to="/seller/products/new"
            disabled={isAdmin}
            startIcon={<Plus size={18} strokeWidth={2.5} />}
            sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" }, fontWeight: 600, borderRadius: 2, px: 3, py: 1 }}
          >
            Thêm sản phẩm
          </Button>
        </Box>

        {loadErrorMessage && (
          <Alert
            severity={isAdmin ? "warning" : "error"}
            sx={{ m: 2.5, borderRadius: "10px" }}
            action={
              isAdmin ? undefined : (
                <Button color="inherit" size="small" onClick={reload}>
                  Thử lại
                </Button>
              )
            }
          >
            {loadErrorMessage}
          </Alert>
        )}
        {view.truncated && (
          <Alert severity="info" sx={{ m: 2.5, borderRadius: "10px", fontSize: 13 }}>
            Lọc theo danh mục trên {CATEGORY_FETCH_SIZE} sản phẩm mới nhất — dùng ô tìm kiếm hoặc tab trạng thái để thu hẹp thêm.
          </Alert>
        )}

        {!loaded.error && (
          <TableContainer sx={{ opacity: loading && loaded.data ? 0.6 : 1, transition: "opacity 0.2s" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(248, 250, 252, 0.7)" }}>
                  <TableCell sx={{ ...headCellSx, py: 1.5, pl: 4 }}>Sản phẩm</TableCell>
                  <TableCell sx={headCellSx}>Danh mục</TableCell>
                  <TableCell sx={headCellSx}>Giá</TableCell>
                  <TableCell sx={headCellSx} align="center">Tồn kho</TableCell>
                  <TableCell sx={headCellSx} align="center">Nhãn AI</TableCell>
                  <TableCell sx={headCellSx} align="center">Trạng thái</TableCell>
                  <TableCell sx={headCellSx} align="center">Đã bán</TableCell>
                  <TableCell sx={{ ...headCellSx, pr: 4 }} align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && !loaded.data ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CircularProgress color="success" />
                    </TableCell>
                  </TableRow>
                ) : view.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      {shopEmpty ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                          <Package size={36} color="#94a3b8" />
                          <Typography sx={{ fontWeight: 600, color: "#334155" }}>Shop chưa có sản phẩm nào</Typography>
                          <Typography variant="body2" color="text.secondary">Thêm sản phẩm kèm ảnh — AI sẽ gắn nhãn chất lượng cho từng ảnh.</Typography>
                          <Button component={Link} to="/seller/products/new" variant="contained" startIcon={<Plus size={16} />} sx={{ mt: 1, bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } }}>
                            Thêm sản phẩm
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Không có sản phẩm phù hợp.</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  view.rows.map((row) => {
                    const meta = PRODUCT_STATUS_META[row.status] ?? { label: row.status, color: "default" };
                    const adminHidden = row.status === "HIDDEN" && row.hiddenBy === "ADMIN";
                    const acting = actingId === row.id;
                    const imgUrl = resolveAssetUrl(row.primaryImageUrl);
                    return (
                      <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "rgba(248, 250, 252, 0.6)" } }}>
                        <TableCell sx={{ ...cellSx, py: 2, pl: 4 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: "10px", bgcolor: "#f1f5f9", border: "1px solid rgba(226, 232, 240, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                              {imgUrl ? (
                                <img src={imgUrl} alt={row.name} onError={handleImageError} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <Package size={20} color="#94a3b8" />
                              )}
                            </Box>
                            <Box>
                              <Typography
                                component={Link}
                                to={`/seller/products/${row.id}/edit`}
                                sx={{ fontSize: 13, fontWeight: 600, color: "#1e293b", textDecoration: "none", "&:hover": { color: "#047857", textDecoration: "underline" } }}
                              >
                                {row.name}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", mt: 0.25 }}>#{row.id}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ ...cellSx, color: "#475569", fontSize: 13 }}>{row.category?.name ?? "—"}</TableCell>
                        <TableCell sx={{ ...cellSx, color: "#1e293b", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {Number(row.price ?? 0).toLocaleString("vi-VN")}{" "}
                          <Box component="span" sx={{ fontSize: 11, fontWeight: 400, color: "#64748b" }}>đ/{row.unit}</Box>
                        </TableCell>
                        <TableCell sx={cellSx} align="center">
                          <ProductStockInlineEditor product={row} onSaved={updateRow} notify={notify} disabled={acting || isAdmin} />
                        </TableCell>
                        <TableCell sx={cellSx} align="center">
                          <AiLabelChip label={row.aiOverallLabel} confidence={row.aiOverallConfidence} size="small" />
                        </TableCell>
                        <TableCell sx={{ ...cellSx, maxWidth: 200 }} align="center">
                          <Chip
                            size="small"
                            label={adminHidden ? `${meta.label} (Admin ẩn)` : meta.label}
                            color={meta.color}
                            variant={row.status === "DRAFT" ? "outlined" : "filled"}
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                          {(row.status === "REJECTED" || row.status === "NEED_INFO") && row.rejectReason && (
                            <Typography sx={{ color: "#94a3b8", mt: 0.5, lineHeight: 1.3, fontSize: 11 }}>{row.rejectReason}</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ ...cellSx, color: "#334155", fontSize: 13, fontWeight: 600 }} align="center">{row.soldCount ?? 0}</TableCell>
                        <TableCell sx={{ ...cellSx, pr: 4 }} align="right">
                          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                            {acting && <CircularProgress size={14} color="success" sx={{ mr: 0.5 }} />}
                            <Button component={Link} to={`/seller/products/${row.id}/edit`} size="small" sx={{ ...actionBtnSx, color: "#059669" }}>
                              Sửa
                            </Button>
                            {row.status === "DRAFT" && (
                              <Button size="small" disabled={acting} onClick={() => handleSubmit(row)} sx={{ ...actionBtnSx, color: "#2563eb" }}>
                                Gửi duyệt
                              </Button>
                            )}
                            {(row.status === "REJECTED" || row.status === "NEED_INFO") && (
                              <Button size="small" disabled={acting} onClick={() => handleSubmit(row)} sx={{ ...actionBtnSx, color: "#2563eb" }}>
                                Gửi duyệt lại
                              </Button>
                            )}
                            {row.status === "APPROVED" && (
                              <Button size="small" disabled={acting} onClick={() => handleVisibility(row, true)} sx={{ ...actionBtnSx, color: "#64748b" }}>
                                Ẩn
                              </Button>
                            )}
                            {row.status === "HIDDEN" && !adminHidden && (
                              <Button size="small" disabled={acting} onClick={() => handleVisibility(row, false)} sx={{ ...actionBtnSx, color: "#059669" }}>
                                Bỏ ẩn
                              </Button>
                            )}
                            {adminHidden && (
                              <Typography component="span" sx={{ fontSize: 12, color: "#94a3b8", px: 1 }}>Admin đã ẩn</Typography>
                            )}
                            <Button size="small" disabled={acting} onClick={() => setDeleteTarget(row)} sx={{ ...actionBtnSx, color: "#e11d48" }}>
                              Xoá
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ px: 3, py: 2, borderTop: "1px solid rgba(226, 232, 240, 0.8)", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", alignItems: "center", bgcolor: "#fff" }}>
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>
            Hiển thị <Box component="span" sx={{ fontWeight: 600, color: "#1e293b" }}>{rangeFrom}–{rangeTo}</Box> trong tổng số{" "}
            <Box component="span" sx={{ fontWeight: 600, color: "#1e293b" }}>{view.totalElements}</Box> sản phẩm
          </Typography>
          {view.totalPages > 1 && (
            <Pagination
              count={view.totalPages}
              page={page}
              onChange={(_e, p) => setPage(p)}
              size="small"
              sx={{ "& .MuiPaginationItem-root": { fontSize: 13, fontWeight: 600 }, "& .Mui-selected": { bgcolor: "#059669 !important", color: "#fff" } }}
            />
          )}
        </Box>
      </Paper>

      <ProductConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoá sản phẩm?"
        message={
          deleteTarget
            ? `Xoá "${deleteTarget.name}" cùng toàn bộ ảnh và kết quả AI. Không hoàn tác được. Sản phẩm đã có đơn hàng thì không xoá được — hãy dùng Ẩn.`
            : ""
        }
        confirmText="Xoá sản phẩm"
        confirmColor="error"
        loading={Boolean(deleteTarget) && actingId === deleteTarget.id}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={toast.severity === "error" ? 6000 : 4000}
        onClose={(_e, reason) => {
          if (reason !== "clickaway") setToast((prev) => ({ ...prev, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setToast((prev) => ({ ...prev, open: false }))} severity={toast.severity} variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
