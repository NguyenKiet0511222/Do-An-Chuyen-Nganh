import { Alert, Box, Breadcrumbs, Button, Chip, CircularProgress, Paper, Snackbar, Tooltip, Typography } from "@mui/material";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Package, RotateCcw, Save, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { categoryApi, sellerApi } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { PRODUCT_STATUS_META } from "../../utils/aiLabel";
import { flattenCategoryTree } from "../../utils/categories";
import { apiErrorMessage } from "../../utils/format";
import { notifySellerDataChanged } from "../../utils/sellerEvents";
import ProductConfirmDialog from "./components/ProductConfirmDialog";
import ProductImageManager from "./components/ProductImageManager";
import ProductInfoFields from "./components/ProductInfoFields";
import ProductStatusBanner from "./components/ProductStatusBanner";
import ProductSubmitChecklist from "./components/ProductSubmitChecklist";
import {
  CATEGORY_INVALID_MESSAGE,
  EMPTY_FORM,
  categoryStatus,
  fieldErrorsOf,
  formFromProduct,
  isContentChanged,
  isRetake,
  isStockChanged,
  productEditMode,
  publishedChangeWarning,
  revokeNewImages,
  toPayload,
  toServerImage,
  uploadImagesInBatches,
  validateProductForm,
  validateStock
} from "./productForm";

const sectionSx = { p: 4, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" };
const sectionTitleSx = { fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 };
const primaryBtnSx = { width: { xs: "100%", sm: "auto" }, borderRadius: 3, px: 4, py: 1, fontWeight: 700, fontSize: 14, bgcolor: "#059669", "&:hover": { bgcolor: "#047857" } };
const outlinedBtnSx = { width: { xs: "100%", sm: "auto" }, color: "#334155", borderColor: "#cbd5e1", borderRadius: 3, px: 3, py: 1, fontWeight: 700, fontSize: 14 };

/**
 * Thêm / sửa sản phẩm của người bán — chỉ dữ liệu thật từ /api/seller/products (docs/2110.md L1-2, L2-1 → L2-5).
 * Nút và ô nhập theo trạng thái (productEditMode): tạo mới · nháp/từ chối/cần bổ sung · chờ duyệt · đang bán · admin ẩn.
 * Route gắn key={id ?? "new"} nên tạo xong chuyển sang /edit thì form dựng lại sạch.
 */
export default function SellerProductFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const highlightImageId = searchParams.get("image");
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState({ flat: [], loading: true, error: null });
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [original, setOriginal] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [touched, setTouched] = useState({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [busy, setBusy] = useState(null); // "save" | "submit" | "stock" khi đang gọi API
  const [createProgress, setCreateProgress] = useState(null); // "Đang tải ảnh 1/3…" lúc tạo mới
  const [imagesBusy, setImagesBusy] = useState(false);
  const [confirmPublished, setConfirmPublished] = useState(false);
  // Thông báo mang theo khi vừa tạo xong (chuyển từ /new sang /edit)
  const [toast, setToast] = useState(() =>
    location.state?.toast ? { open: true, ...location.state.toast } : { open: false, severity: "success", message: "" }
  );

  const notify = (severity, message) => setToast({ open: true, severity, message });

  // Xoá state điều hướng để tải lại trang không hiện lại thông báo cũ
  useEffect(() => {
    if (location.state?.toast) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    let ignore = false;
    categoryApi
      .getAll()
      .then((tree) => {
        if (!ignore) setCategories({ flat: flattenCategoryTree(tree), loading: false, error: null });
      })
      .catch((err) => {
        if (!ignore) setCategories({ flat: [], loading: false, error: apiErrorMessage(err, "Không tải được danh mục.") });
      });
    return () => {
      ignore = true;
    };
  }, []);

  const applyProduct = (p) => {
    const values = formFromProduct(p);
    setProduct(p);
    setForm(values);
    setOriginal(values);
    setImages((p.images ?? []).map(toServerImage));
    setTouched({});
    setServerErrors({});
    setShowAllErrors(false);
  };

  useEffect(() => {
    if (!isEdit) return undefined;
    let ignore = false;
    sellerApi.product
      .getById(id)
      .then((p) => {
        if (ignore) return;
        const values = formFromProduct(p);
        setProduct(p);
        setForm(values);
        setOriginal(values);
        setImages((p.images ?? []).map(toServerImage));
      })
      .catch((err) => {
        if (!ignore) setLoadError(apiErrorMessage(err, `Không tải được sản phẩm #${id}.`));
      });
    return () => {
      ignore = true;
    };
  }, [id, isEdit]);

  const reloadProduct = () =>
    sellerApi.product
      .getById(id)
      .then(applyProduct)
      .catch(() => {});

  // ---------- Trạng thái suy ra ----------
  const mode = isEdit ? (product ? productEditMode(product) : null) : "new";
  const contentLocked = isAdmin || !mode || mode === "pending" || mode === "adminHidden";
  const stockLocked = isAdmin || !mode;
  const anyBusy = Boolean(busy) || imagesBusy;

  const catStatus = categoryStatus(categories.flat, form.categoryId, !categories.loading && !categories.error);
  const categoryInvalid = catStatus === "inactive" || catStatus === "parent";
  const clientErrors = validateProductForm(form);
  if (categoryInvalid) clientErrors.categoryId = CATEGORY_INVALID_MESSAGE;

  const contentChanged = mode !== "new" && isContentChanged(form, original);
  const stockChanged = mode !== "new" && isStockChanged(form, original);
  const dirty = contentChanged || stockChanged;

  const fieldError = (field) => {
    if (serverErrors[field]) return serverErrors[field];
    if (field !== "stockQuantity" && contentLocked) return null;
    const show = touched[field] || showAllErrors || (field === "categoryId" && categoryInvalid);
    return show ? clientErrors[field] ?? null : null;
  };

  // Điều kiện gửi duyệt — khớp SellerProductService.submit; `missing` dùng cho tooltip khi nút bị khoá
  const checklist = [
    {
      ok: Object.keys(clientErrors).length === 0,
      label: "Thông tin hợp lệ (tên, danh mục, giá > 0, đơn vị, tồn kho)",
      missing: "thông tin chưa hợp lệ (xem các ô báo đỏ)"
    },
    { ok: images.length > 0, label: "Có ít nhất 1 ảnh", missing: "cần ít nhất 1 ảnh" },
    {
      ok: !images.some(isRetake),
      label: "Không còn ảnh admin yêu cầu chụp lại",
      missing: "còn ảnh admin yêu cầu chụp lại (xoá và tải ảnh mới)"
    }
  ];
  const unmet = checklist.filter((item) => !item.ok);
  const submitBlockedReason = unmet.length ? `Chưa đủ điều kiện gửi duyệt: ${unmet.map((item) => item.missing).join(", ")}` : null;

  // Đang bán mà có thay đổi nội dung chưa lưu -> chặn thao tác ảnh (thao tác ảnh sẽ khoá sản phẩm chờ duyệt)
  const imageBlockedReason =
    mode === "published" && contentChanged
      ? "Bạn đang có thay đổi thông tin chưa lưu — lưu hoặc hoàn tác trước khi sửa ảnh (sửa ảnh sẽ khoá sản phẩm chờ duyệt)."
      : null;

  // ---------- Nhập liệu ----------
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
    setServerErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleUndo = () => {
    setForm(original);
    setTouched({});
    setServerErrors({});
    setShowAllErrors(false);
  };

  const requireValidForm = () => {
    if (Object.keys(clientErrors).length === 0) return true;
    setShowAllErrors(true);
    notify("error", clientErrors.categoryId === CATEGORY_INVALID_MESSAGE ? CATEGORY_INVALID_MESSAGE : "Thông tin chưa hợp lệ — kiểm tra các ô báo đỏ.");
    return false;
  };

  const handleApiError = (err, fallback) => {
    const fields = fieldErrorsOf(err);
    if (fields) {
      setServerErrors(fields);
      setShowAllErrors(true);
      notify("error", "Dữ liệu chưa hợp lệ — kiểm tra các ô báo đỏ.");
      return;
    }
    notify("error", apiErrorMessage(err, fallback));
    // 409: trạng thái sản phẩm đã đổi ở nơi khác (vd admin vừa duyệt) -> tải lại để form theo đúng trạng thái mới
    if (isEdit && err?.response?.status === 409) reloadProduct();
  };

  const applyStock = (stockQuantity) => {
    const value = String(stockQuantity);
    setProduct((prev) => ({ ...prev, stockQuantity }));
    setOriginal((prev) => ({ ...prev, stockQuantity: value }));
    setForm((prev) => ({ ...prev, stockQuantity: value }));
  };

  // ---------- Tạo mới: tạo -> tải ảnh -> (gửi duyệt) -> sang /edit ----------
  const handleCreate = async (andSubmit) => {
    if (!requireValidForm()) return;
    if (andSubmit && submitBlockedReason) {
      notify("warning", submitBlockedReason);
      return;
    }
    setBusy(andSubmit ? "submit" : "save");
    let created;
    try {
      created = await sellerApi.product.create(toPayload(form));
    } catch (err) {
      handleApiError(err, "Không tạo được sản phẩm.");
      setBusy(null);
      return;
    }

    // Sản phẩm đã có trên server: từ đây dù lỗi vẫn chuyển sang trang sửa để không tạo trùng khi bấm lại
    const files = images.filter((img) => img.kind === "new").map((img) => img.file);
    let result = { severity: "success", message: "Đã lưu nháp sản phẩm." };
    let uploadFailed = false;
    if (files.length > 0) {
      const { uploaded, error } = await uploadImagesInBatches(created.id, files, setCreateProgress);
      if (error) {
        uploadFailed = true;
        result = {
          severity: "error",
          message: `Đã lưu nháp nhưng chỉ tải được ${uploaded}/${files.length} ảnh: ${apiErrorMessage(error, "lỗi tải ảnh")}. Thêm lại ảnh ở trang này.`
        };
      }
    }
    if (andSubmit && !uploadFailed) {
      try {
        await sellerApi.product.submit(created.id);
        result = { severity: "success", message: "Đã tạo sản phẩm và gửi duyệt." };
      } catch (err) {
        result = { severity: "warning", message: `Đã lưu nháp nhưng chưa gửi duyệt được: ${apiErrorMessage(err, "lỗi gửi duyệt")}` };
      }
    } else if (andSubmit) {
      result = { ...result, message: `${result.message} Chưa gửi duyệt.` };
    }
    notifySellerDataChanged();
    revokeNewImages(images);
    setImages([]);
    navigate(`/seller/products/${created.id}/edit`, { replace: true, state: { toast: result } });
  };

  // ---------- Sửa ----------
  const saveContent = async () => {
    setBusy("save");
    try {
      const updated = await sellerApi.product.update(id, toPayload(form));
      const statusChanged = updated.status !== product.status;
      applyProduct(updated);
      if (statusChanged) {
        notifySellerDataChanged();
        notify("success", `Đã lưu — sản phẩm chuyển sang "${PRODUCT_STATUS_META[updated.status]?.label ?? updated.status}".`);
      } else {
        notify("success", "Đã lưu thay đổi.");
      }
    } catch (err) {
      handleApiError(err, "Không lưu được sản phẩm.");
    } finally {
      setBusy(null);
    }
  };

  const saveStock = async () => {
    const stockError = validateStock(form.stockQuantity);
    if (stockError) {
      setTouched((prev) => ({ ...prev, stockQuantity: true }));
      notify("error", stockError);
      return;
    }
    setBusy("stock");
    try {
      const res = await sellerApi.product.updateStock(id, Number(form.stockQuantity));
      applyStock(res.stockQuantity);
      notify("success", `Đã cập nhật tồn kho: ${res.stockQuantity}.`);
    } catch (err) {
      handleApiError(err, "Không cập nhật được tồn kho.");
    } finally {
      setBusy(null);
    }
  };

  // Lưu: chỉ PUT khi nội dung đổi (PUT gửi kèm tồn kho); chỉ tồn kho đổi -> PATCH /stock (không đổi trạng thái)
  const handleSave = () => {
    if (!dirty) {
      notify("info", "Chưa có thay đổi nào để lưu.");
      return;
    }
    if (!contentChanged) {
      saveStock();
      return;
    }
    if (!requireValidForm()) return;
    if (mode === "published") setConfirmPublished(true);
    else saveContent();
  };

  const handleConfirmPublished = async () => {
    await saveContent();
    setConfirmPublished(false);
  };

  const handleSubmit = async () => {
    if (submitBlockedReason) {
      notify("warning", submitBlockedReason);
      return;
    }
    if (contentChanged && !requireValidForm()) return;
    setBusy("submit");
    try {
      if (contentChanged) applyProduct(await sellerApi.product.update(id, toPayload(form)));
      else if (stockChanged) applyStock((await sellerApi.product.updateStock(id, Number(form.stockQuantity))).stockQuantity);
      applyProduct(await sellerApi.product.submit(id));
      notifySellerDataChanged();
      notify("success", "Đã gửi duyệt — sản phẩm chuyển sang Chờ duyệt.");
    } catch (err) {
      handleApiError(err, "Không gửi duyệt được sản phẩm.");
    } finally {
      setBusy(null);
    }
  };

  // Kết quả thao tác ảnh (ProductImagesResponse): toàn bộ ảnh + nhãn tổng + trạng thái mới
  const handleImagesUpdate = (res) => {
    setImages(res.images.map(toServerImage));
    const toPending = res.status === "PENDING" && product.status !== "PENDING";
    setProduct((prev) => ({
      ...prev,
      status: res.status,
      hiddenBy: toPending ? null : prev.hiddenBy,
      rejectReason: toPending ? null : prev.rejectReason,
      images: res.images,
      aiOverallLabel: res.aiOverallLabel,
      aiOverallConfidence: res.aiOverallConfidence
    }));
    if (res.status !== product.status) notifySellerDataChanged();
  };

  // ---------- Hiển thị ----------
  const statusMeta = product ? PRODUCT_STATUS_META[product.status] : null;
  const title = isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới";

  const header = (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ width: 48, height: 48, minWidth: 48, borderRadius: "12px", bgcolor: "#d1fae5", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Package size={24} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{title}</Typography>
          <Breadcrumbs separator={<ChevronRight size={12} />} sx={{ mt: 0.5, "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}>
            <Link to="/seller/products" style={{ color: "#64748b", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>Sản phẩm</Link>
            <Typography sx={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>
              {isEdit ? product?.name || `#${id}` : "Thêm mới"}
            </Typography>
          </Breadcrumbs>
        </Box>
      </Box>
      {mode && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Trạng thái:</Typography>
          <Chip
            size="small"
            label={statusMeta ? `${statusMeta.label}${mode === "adminHidden" ? " (Admin ẩn)" : ""}` : "Mới"}
            color={statusMeta?.color ?? "default"}
            variant={statusMeta ? "filled" : "outlined"}
            sx={{ fontWeight: 700 }}
          />
        </Box>
      )}
    </Box>
  );

  const adminAlert = isAdmin && (
    <Alert severity="warning" sx={{ borderRadius: "12px" }}>
      Tài khoản quản trị không có shop — khu người bán dành cho người bán.
    </Alert>
  );

  if (isEdit && !product) {
    return (
      <Box sx={{ pb: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        {header}
        {adminAlert}
        {loadError ? (
          <Alert
            severity="error"
            sx={{ borderRadius: "12px" }}
            action={
              <Button component={Link} to="/seller/products" color="inherit" size="small" startIcon={<ArrowLeft size={14} />}>
                Quay lại danh sách
              </Button>
            }
          >
            {isAdmin ? "Không có sản phẩm để sửa vì tài khoản quản trị không có shop." : loadError}
          </Alert>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress color="success" />
          </Box>
        )}
      </Box>
    );
  }

  const isResubmit = product?.status === "REJECTED" || product?.status === "NEED_INFO";

  const submitButton = (label, onClick) => (
    <Tooltip title={submitBlockedReason ?? ""} disableHoverListener={!submitBlockedReason}>
      <Box component="span" sx={{ width: { xs: "100%", sm: "auto" } }}>
        <Button
          disabled={anyBusy || isAdmin || Boolean(submitBlockedReason)}
          onClick={onClick}
          variant="contained"
          startIcon={busy === "submit" ? <CircularProgress size={14} color="inherit" /> : <UploadCloud size={16} />}
          sx={primaryBtnSx}
        >
          {busy === "submit" ? createProgress ?? "Đang gửi duyệt..." : label}
        </Button>
      </Box>
    </Tooltip>
  );

  return (
    <Box sx={{ pb: 8, display: "flex", flexDirection: "column", gap: 4 }}>
      {header}
      {adminAlert}
      <ProductStatusBanner product={product} mode={mode} />

      <ProductInfoFields
        form={form}
        setField={setField}
        fieldError={fieldError}
        contentLocked={contentLocked}
        stockLocked={stockLocked}
        stockHint={contentLocked && mode ? "Vẫn cập nhật được tồn kho" : "Số lượng đang có"}
        categories={categories}
        currentCategory={product?.category}
      />

      <ProductImageManager
        productId={product?.id ?? null}
        mode={mode}
        status={product?.status}
        images={images}
        onImagesChange={setImages}
        onServerUpdate={handleImagesUpdate}
        aiOverallLabel={product?.aiOverallLabel}
        aiOverallConfidence={product?.aiOverallConfidence}
        blockedReason={imageBlockedReason}
        highlightImageId={highlightImageId}
        disabled={Boolean(busy) || isAdmin}
        notify={notify}
        onBusyChange={setImagesBusy}
      />

      {/* Trạng thái đăng + nút theo trạng thái */}
      <Paper elevation={0} sx={sectionSx}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, mb: 3, borderBottom: "1px solid #f1f5f9" }}>
          <Typography sx={sectionTitleSx}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#94a3b8" }} />
            Trạng thái đăng
          </Typography>
          {dirty && <Chip size="small" label="Có thay đổi chưa lưu" color="warning" variant="outlined" sx={{ fontWeight: 600 }} />}
        </Box>

        {(mode === "new" || mode === "editable") && <ProductSubmitChecklist items={checklist} />}
        {mode === "pending" && (
          <Typography sx={{ fontSize: 13, color: "#475569" }}>Sản phẩm đang chờ duyệt — chỉ cập nhật được tồn kho.</Typography>
        )}
        {mode === "adminHidden" && (
          <Typography sx={{ fontSize: 13, color: "#475569" }}>Sản phẩm bị quản trị viên ẩn — chỉ cập nhật được tồn kho.</Typography>
        )}
        {mode === "published" && (
          <Typography sx={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
            Chỉ đổi tồn kho: sản phẩm vẫn {product.status === "HIDDEN" ? "giữ trạng thái ẩn" : "đang bán"}. Đổi tên, danh mục, giá,
            đơn vị, xuất xứ, mô tả hoặc ảnh: sản phẩm chuyển về <b>Chờ duyệt</b>.
          </Typography>
        )}

        <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", gap: 2 }}>
          <Button component={Link} to="/seller/products" startIcon={<ArrowLeft size={16} />} sx={{ color: "#64748b", fontWeight: 600, mr: { sm: "auto" } }}>
            Quay lại danh sách
          </Button>

          {mode !== "new" && dirty && (
            <Button onClick={handleUndo} disabled={anyBusy} startIcon={<RotateCcw size={15} />} sx={{ color: "#475569", fontWeight: 600 }}>
              Hoàn tác
            </Button>
          )}

          {mode === "new" && (
            <>
              <Button disabled={anyBusy || isAdmin} onClick={() => handleCreate(false)} variant="outlined" startIcon={<Save size={16} />} sx={outlinedBtnSx}>
                {busy === "save" ? createProgress ?? "Đang lưu..." : "Lưu nháp"}
              </Button>
              {submitButton("Lưu & gửi duyệt", () => handleCreate(true))}
            </>
          )}

          {mode === "editable" && (
            <>
              <Button disabled={anyBusy} onClick={handleSave} variant="outlined" startIcon={<Save size={16} />} sx={outlinedBtnSx}>
                {busy === "save" || busy === "stock" ? "Đang lưu..." : "Lưu"}
              </Button>
              {submitButton(isResubmit ? "Gửi duyệt lại" : "Gửi duyệt", handleSubmit)}
            </>
          )}

          {(mode === "pending" || mode === "adminHidden") && (
            <Button disabled={anyBusy || isAdmin || !stockChanged} onClick={saveStock} variant="contained" startIcon={<Save size={16} />} sx={primaryBtnSx}>
              {busy === "stock" ? "Đang lưu..." : "Cập nhật tồn kho"}
            </Button>
          )}

          {mode === "published" && (
            <Button disabled={anyBusy || isAdmin} onClick={handleSave} variant="contained" startIcon={<Save size={16} />} sx={primaryBtnSx}>
              {busy ? "Đang lưu..." : contentChanged ? "Lưu & chờ duyệt lại" : "Lưu thay đổi"}
            </Button>
          )}
        </Box>
      </Paper>

      <ProductConfirmDialog
        open={confirmPublished}
        title="Sửa sản phẩm đang bán?"
        message={`${publishedChangeWarning(product?.status)} Bạn chỉ sửa được 1 lần cho tới khi admin duyệt.`}
        confirmText="Lưu & chờ duyệt"
        confirmColor="warning"
        loading={busy === "save"}
        onConfirm={handleConfirmPublished}
        onClose={() => setConfirmPublished(false)}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={toast.severity === "error" || toast.severity === "warning" ? 7000 : 4000}
        onClose={(_e, reason) => {
          if (reason !== "clickaway") setToast((prev) => ({ ...prev, open: false }));
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
