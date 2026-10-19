import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Slider,
  Snackbar,
  TextField,
  Typography
} from "@mui/material";
import { CheckCheck, Inbox, RefreshCw, X } from "lucide-react";
import { adminApi, resolveAssetUrl } from "../../../services/api";
import AiLabelChip from "./AiLabelChip";
import AiResultCard from "./AiResultCard";
import {
  AI_LABEL_OPTIONS,
  PRODUCE_TYPES,
  REVIEW_STATUS_META,
  REVIEW_STATUS_ORDER,
  apiErrorMessage,
  displayLabelOf,
  formatProduce,
  handleImageError,
  notifyAiPendingChanged
} from "./aiReview";

const PAGE_SIZE = 12;
const DEFAULT_FILTERS = { reviewStatus: "PENDING_REVIEW", label: "", produce: "", from: "", to: "", sort: "oldest" };

const filterFieldSx = { minWidth: 150, "& .MuiInputBase-input": { fontSize: 13 } };

/** Tab "Hàng chờ": lọc + lưới thẻ ảnh + chấp nhận hàng loạt (docs/1910.md mục 7.2, 7.3). */
export default function AiReviewQueue() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);
  const [loaded, setLoaded] = useState({ request: null, data: null, error: null });
  const [zoomed, setZoomed] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const [minConfidence, setMinConfidence] = useState(0.95);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const dateInvalid = Boolean(filters.from && filters.to && filters.from > filters.to);

  // Mỗi lần lọc / đổi trang / tải lại tạo 1 request mới; loading = request đang hiển thị chưa phải request mới nhất
  const request = useMemo(
    () => ({
      params: {
        reviewStatus: filters.reviewStatus === "ALL" ? REVIEW_STATUS_ORDER.join(",") : filters.reviewStatus,
        label: filters.label || undefined,
        produce: filters.produce || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        sort: filters.sort,
        page,
        size: PAGE_SIZE
      },
      tick: reloadTick
    }),
    [filters, page, reloadTick]
  );

  useEffect(() => {
    if (dateInvalid) return undefined;
    let ignore = false;
    adminApi.ai
      .getResults(request.params)
      .then((data) => {
        if (ignore) return;
        // Duyệt hết ảnh của trang cuối -> lùi về trang cuối còn dữ liệu
        const lastPage = Math.max((data?.totalPages ?? 0) - 1, 0);
        if ((data?.content?.length ?? 0) === 0 && request.params.page > lastPage) {
          setPage(lastPage);
          return;
        }
        setLoaded({ request, data, error: null });
      })
      .catch((err) => {
        if (ignore) return;
        setLoaded({ request, data: null, error: apiErrorMessage(err, "Không tải được danh sách kiểm định AI.") });
      });
    return () => {
      ignore = true;
    };
  }, [request, dateInvalid]);

  const loading = !dateInvalid && loaded.request !== request;
  const results = loaded.data?.content ?? [];
  const totalElements = loaded.data?.totalElements ?? 0;
  const totalPages = loaded.data?.totalPages ?? 0;
  const filtersChanged = Object.keys(DEFAULT_FILTERS).some((key) => filters[key] !== DEFAULT_FILTERS[key]);

  const updateFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  };

  const reload = () => setReloadTick((t) => t + 1);

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });
  const closeToast = (_e, reason) => {
    if (reason === "clickaway") return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleReviewed = (_updated, message) => {
    showToast(message, "success");
    reload();
  };

  const handleBulkAccept = async () => {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      // Làm tròn 2 chữ số để tránh sai số dấu phẩy động của slider (0.9500000001)
      const res = await adminApi.ai.acceptBulk({ minConfidence: Math.round(minConfidence * 100) / 100 });
      const succeeded = Number(res?.succeeded) || 0;
      setBulkConfirmOpen(false);
      showToast(
        succeeded > 0
          ? `Đã chấp nhận ${succeeded} ảnh TƯƠI có độ tin cậy ≥ ${Math.round(minConfidence * 100)}%.`
          : `Không có ảnh TƯƠI nào ≥ ${Math.round(minConfidence * 100)}% trong hàng chờ.`,
        succeeded > 0 ? "success" : "info"
      );
      if (succeeded > 0) {
        notifyAiPendingChanged();
        reload();
      }
    } catch (err) {
      showToast(apiErrorMessage(err, "Chấp nhận hàng loạt thất bại, vui lòng thử lại."), "error");
    } finally {
      setBulkBusy(false);
    }
  };

  const percentText = `${Math.round(minConfidence * 100)}%`;
  const isDefaultQueue = filters.reviewStatus === "PENDING_REVIEW" && !filtersChanged;

  return (
    <Box>
      {/* Bộ lọc */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "flex-start" }}>
          <TextField select size="small" label="Trạng thái" value={filters.reviewStatus} onChange={updateFilter("reviewStatus")} sx={filterFieldSx}>
            {REVIEW_STATUS_ORDER.map((status) => (
              <MenuItem key={status} value={status} sx={{ fontSize: 13 }}>
                {REVIEW_STATUS_META[status].label}
              </MenuItem>
            ))}
            <MenuItem value="ALL" sx={{ fontSize: 13 }}>
              Tất cả
            </MenuItem>
          </TextField>
          <TextField select size="small" label="Nhãn" value={filters.label} onChange={updateFilter("label")} sx={{ ...filterFieldSx, minWidth: 130 }}>
            <MenuItem value="" sx={{ fontSize: 13 }}>
              Tất cả
            </MenuItem>
            {AI_LABEL_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Loại nông sản" value={filters.produce} onChange={updateFilter("produce")} sx={{ ...filterFieldSx, minWidth: 170 }}>
            <MenuItem value="" sx={{ fontSize: 13 }}>
              Tất cả
            </MenuItem>
            {PRODUCE_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                {opt.label} ({opt.value})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            size="small"
            label="Từ ngày"
            value={filters.from}
            onChange={updateFilter("from")}
            error={dateInvalid}
            helperText={dateInvalid ? "Từ ngày phải trước Đến ngày" : undefined}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.to || undefined } }}
            sx={filterFieldSx}
          />
          <TextField
            type="date"
            size="small"
            label="Đến ngày"
            value={filters.to}
            onChange={updateFilter("to")}
            error={dateInvalid}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.from || undefined } }}
            sx={filterFieldSx}
          />
          <TextField select size="small" label="Sắp xếp" value={filters.sort} onChange={updateFilter("sort")} sx={filterFieldSx}>
            <MenuItem value="oldest" sx={{ fontSize: 13 }}>
              Cũ nhất trước
            </MenuItem>
            <MenuItem value="newest" sx={{ fontSize: 13 }}>
              Mới nhất trước
            </MenuItem>
          </TextField>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto", minHeight: 40 }}>
            {filtersChanged && (
              <Button size="small" onClick={resetFilters} sx={{ fontSize: 12.5, color: "#475569", px: 1 }}>
                Xoá lọc
              </Button>
            )}
            <Typography sx={{ fontSize: 13, color: "text.secondary", whiteSpace: "nowrap" }}>
              <strong>{totalElements}</strong> ảnh
            </Typography>
            <IconButton size="small" onClick={reload} disabled={loading} aria-label="Tải lại">
              <RefreshCw size={16} />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Chấp nhận hàng loạt ảnh TƯƠI có độ tin cậy cao */}
      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#f0fdf4", borderColor: "#bbf7d0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: 1, md: 3 } }}
      >
        <Box sx={{ flex: "1 1 260px", minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#14532d" }}>Chấp nhận nhanh ảnh TƯƠI có độ tin cậy cao</Typography>
          <Typography sx={{ fontSize: 12, color: "#166534" }}>
            Áp dụng cho toàn bộ ảnh đang Chờ kiểm định có nhãn TƯƠI, không theo bộ lọc bên trên.
          </Typography>
        </Box>
        <Box sx={{ flex: "1 1 220px", px: 1 }}>
          <Slider
            value={minConfidence}
            min={0.5}
            max={1}
            step={0.01}
            onChange={(_e, value) => setMinConfidence(value)}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
            marks={[
              { value: 0.5, label: "50%" },
              { value: 0.9, label: "90%" },
              { value: 1, label: "100%" }
            ]}
            disabled={bulkBusy}
            aria-label="Ngưỡng độ tin cậy tối thiểu"
            sx={{ "& .MuiSlider-markLabel": { fontSize: 11 } }}
          />
        </Box>
        <Button
          variant="contained"
          onClick={() => setBulkConfirmOpen(true)}
          disabled={bulkBusy}
          startIcon={<CheckCheck size={16} />}
          sx={{ fontSize: 13, color: "#fff", whiteSpace: "nowrap" }}
        >
          Chấp nhận tất cả ảnh TƯƠI ≥ {percentText}
        </Button>
      </Paper>

      {loaded.error && !loading && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Thử lại
            </Button>
          }
        >
          {loaded.error}
        </Alert>
      )}

      <Box sx={{ height: 4, mb: 1 }}>{loading && loaded.data && <LinearProgress />}</Box>

      {/* Lưới thẻ */}
      {loading && !loaded.data ? (
        <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
          <CircularProgress size={28} />
          <Typography sx={{ fontSize: 13 }}>Đang tải hàng chờ kiểm định...</Typography>
        </Box>
      ) : !loaded.error && !loading && results.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 7, px: 2, borderRadius: 2, textAlign: "center", color: "text.secondary" }}>
          <Inbox size={36} color="#94a3b8" />
          <Typography sx={{ mt: 1, fontSize: 14, fontWeight: 600, color: "#334155" }}>
            {isDefaultQueue ? "Hàng chờ trống — không còn ảnh nào cần kiểm định." : "Không có ảnh nào khớp bộ lọc."}
          </Typography>
          {!isDefaultQueue && (
            <Button size="small" onClick={resetFilters} sx={{ mt: 1 }}>
              Xoá bộ lọc
            </Button>
          )}
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            opacity: loading ? 0.6 : 1,
            pointerEvents: loading ? "none" : "auto",
            transition: "opacity 0.15s"
          }}
        >
          {results.map((result) => (
            <AiResultCard
              key={result.id}
              result={result}
              onZoom={setZoomed}
              onDone={handleReviewed}
              onError={(message) => showToast(message, "error")}
            />
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <Pagination count={totalPages} page={page + 1} onChange={(_e, p) => setPage(p - 1)} color="primary" disabled={loading} />
        </Box>
      )}

      {/* Phóng to ảnh */}
      <Dialog open={Boolean(zoomed)} onClose={() => setZoomed(null)} maxWidth="md" fullWidth>
        {zoomed && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6, flexWrap: "wrap" }}>
              <AiLabelChip label={displayLabelOf(zoomed)} confidence={zoomed.finalLabel && zoomed.finalLabel !== zoomed.label ? null : zoomed.confidence} />
              <Typography component="span" sx={{ fontSize: 15, fontWeight: 700 }}>
                {formatProduce(zoomed.produce) || "Không rõ loại"}
              </Typography>
              <IconButton onClick={() => setZoomed(null)} aria-label="Đóng" sx={{ position: "absolute", right: 12, top: 12 }}>
                <X size={18} />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ bgcolor: "#0f172a", borderRadius: 2, overflow: "hidden", display: "flex", justifyContent: "center" }}>
                <img
                  src={resolveAssetUrl(zoomed.imageUrl)}
                  alt={zoomed.product?.name || "Ảnh sản phẩm"}
                  onError={handleImageError}
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", display: "block" }}
                />
              </Box>
              {zoomed.note && <Typography sx={{ mt: 1.5, fontSize: 13, color: "text.secondary" }}>{zoomed.note}</Typography>}
              <Typography sx={{ mt: 1, fontSize: 13 }}>
                {zoomed.product?.id ? (
                  <Link component={RouterLink} to={`/admin/products/${zoomed.product.id}`} underline="hover" sx={{ fontWeight: 700 }}>
                    {zoomed.product.name}
                  </Link>
                ) : (
                  "Không rõ sản phẩm"
                )}
                {zoomed.shop?.shopName && ` · ${zoomed.shop.shopName}`}
                {zoomed.modelVersion && ` · Model ${zoomed.modelVersion}`}
              </Typography>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Xác nhận chấp nhận hàng loạt */}
      <Dialog open={bulkConfirmOpen} onClose={() => !bulkBusy && setBulkConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Chấp nhận hàng loạt?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13.5 }}>
            Mọi ảnh đang <strong>Chờ kiểm định</strong> có nhãn <strong>TƯƠI</strong> và độ tin cậy từ <strong>{percentText}</strong> trở lên sẽ
            được chấp nhận. Thao tác này không hoàn tác được.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkConfirmOpen(false)} disabled={bulkBusy} sx={{ color: "#475569" }}>
            Huỷ
          </Button>
          <Button
            variant="contained"
            onClick={handleBulkAccept}
            disabled={bulkBusy}
            startIcon={bulkBusy ? <CircularProgress size={14} color="inherit" /> : <CheckCheck size={16} />}
            sx={{ color: "#fff" }}
          >
            Chấp nhận
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity} variant="filled" onClose={closeToast} sx={{ fontSize: 13 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
