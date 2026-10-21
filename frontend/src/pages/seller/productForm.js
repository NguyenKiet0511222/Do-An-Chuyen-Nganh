// Tiện ích cho form sản phẩm người bán (không phải component — tách riêng vì oxlint only-export-components).
// Quy tắc lấy đúng theo backend: SellerProductRequest (validate), SellerProductService (trạng thái, ảnh),
// FileStorageService (JPG/PNG/WEBP ≤ 5 MB), application.properties (multipart tối đa 10 MB / request).
import { sellerApi } from "../../services/api";
import { findCategoryById } from "../../utils/categories";

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Backend giới hạn 10 MB mỗi request -> gửi theo lô ≤ 9 MB (chừa chỗ cho phần đầu multipart)
export const UPLOAD_BATCH_BYTES = 9 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const RETAKE = "RETAKE_REQUESTED";

export const UNIT_OPTIONS = ["kg", "500g", "bó", "trái", "hộp", "túi", "chục"];

export const LIMITS = {
  nameMin: 3,
  nameMax: 200,
  priceMax: 1_000_000_000,
  stockMax: 1_000_000,
  unitMax: 20,
  originMax: 150,
  descriptionMax: 5000
};

export const EMPTY_FORM = {
  name: "",
  categoryId: "",
  price: "",
  unit: "",
  stockQuantity: "",
  origin: "",
  description: ""
};

/** Trạng thái được gửi duyệt (SellerProductService.SUBMITTABLE). */
export const SUBMITTABLE_STATUSES = ["DRAFT", "REJECTED", "NEED_INFO"];

/**
 * Chế độ của form theo trạng thái sản phẩm (docs/2110.md L2-4):
 * - new: chưa tạo;
 * - editable: DRAFT / REJECTED / NEED_INFO — sửa tự do, gửi duyệt;
 * - pending: PENDING — chỉ sửa tồn kho (mọi thao tác khác backend trả 409);
 * - published: APPROVED hoặc HIDDEN do người bán ẩn — đổi tồn kho vẫn bán; đổi nội dung/ảnh -> về PENDING;
 * - adminHidden: HIDDEN do admin ẩn — chỉ sửa tồn kho (sửa nội dung sẽ gỡ lệnh ẩn của admin).
 */
export const productEditMode = (product) => {
  if (!product) return "new";
  if (SUBMITTABLE_STATUSES.includes(product.status)) return "editable";
  if (product.status === "PENDING") return "pending";
  if (product.status === "HIDDEN" && product.hiddenBy === "ADMIN") return "adminHidden";
  return "published";
};

/** Cảnh báo trước khi sửa nội dung / ảnh của sản phẩm đang bán (APPROVED) hoặc người bán tự ẩn (HIDDEN). */
export const publishedChangeWarning = (status, what = "nội dung") =>
  status === "HIDDEN"
    ? `Sửa ${what} sẽ chuyển sản phẩm về Chờ duyệt và khoá sửa đến khi admin duyệt — sau khi duyệt sản phẩm sẽ hiện lại.`
    : `Sửa ${what} sẽ gỡ sản phẩm khỏi trang bán, chuyển về Chờ duyệt và khoá sửa đến khi admin duyệt.`;

/** Chỉ giữ chữ số: "45.000đ" -> "45000". */
export const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

/** "45000" -> "45.000 đ" (xem trước dưới ô giá); rỗng -> "". */
export const formatDigits = (digits) => (digits ? Number(digits).toLocaleString("vi-VN") : "");

const trimToNull = (value) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

/** Sản phẩm từ API -> giá trị form (số giữ dạng chuỗi chữ số để ô nhập lọc được). */
export const formFromProduct = (p) => ({
  name: p?.name ?? "",
  categoryId: p?.category?.id != null ? String(p.category.id) : "",
  price: p?.price != null ? String(p.price) : "",
  unit: p?.unit ?? "",
  stockQuantity: p?.stockQuantity != null ? String(p.stockQuantity) : "",
  origin: p?.origin ?? "",
  description: p?.description ?? ""
});

/** Giá trị form -> body POST/PUT /seller/products (SellerProductRequest). */
export const toPayload = (form) => ({
  name: form.name.trim(),
  categoryId: Number(form.categoryId),
  description: trimToNull(form.description),
  price: Number(form.price),
  unit: form.unit.trim(),
  stockQuantity: Number(form.stockQuantity),
  origin: trimToNull(form.origin)
});

/** Nội dung thay đổi theo đúng cách backend so sánh (SellerProductService.update): tên, danh mục, mô tả, giá, đơn vị, xuất xứ. */
export const isContentChanged = (form, original) =>
  form.name.trim() !== original.name.trim() ||
  String(form.categoryId) !== String(original.categoryId) ||
  trimToNull(form.description) !== trimToNull(original.description) ||
  Number(form.price || 0) !== Number(original.price || 0) ||
  form.unit.trim() !== original.unit.trim() ||
  trimToNull(form.origin) !== trimToNull(original.origin);

export const isStockChanged = (form, original) => form.stockQuantity !== original.stockQuantity;

/** Kiểm tra tồn kho riêng — dùng cho chế độ chỉ sửa tồn kho (PATCH /stock). */
export const validateStock = (stock) => {
  if (stock === "") return "Vui lòng nhập tồn kho";
  if (Number(stock) > LIMITS.stockMax) return "Tồn kho tối đa 1.000.000";
  return null;
};

/** Bộ kiểm tra dùng chung cho ô nhập + checklist, khớp SellerProductRequest. Trả { field: message } (rỗng = hợp lệ). */
export const validateProductForm = (form) => {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = "Vui lòng nhập tên sản phẩm";
  else if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) errors.name = "Tên sản phẩm từ 3 đến 200 ký tự";

  if (!form.categoryId) errors.categoryId = "Vui lòng chọn danh mục";

  if (form.price === "") errors.price = "Vui lòng nhập giá bán";
  else if (Number(form.price) <= 0) errors.price = "Giá bán phải lớn hơn 0";
  else if (Number(form.price) > LIMITS.priceMax) errors.price = "Giá bán tối đa 1.000.000.000 đ";

  const unit = form.unit.trim();
  if (!unit) errors.unit = "Vui lòng nhập đơn vị tính";
  else if (unit.length > LIMITS.unitMax) errors.unit = "Đơn vị tính tối đa 20 ký tự";

  const stockError = validateStock(form.stockQuantity);
  if (stockError) errors.stockQuantity = stockError;

  if (form.origin.trim().length > LIMITS.originMax) errors.origin = "Xuất xứ tối đa 150 ký tự";
  if (form.description.length > LIMITS.descriptionMax) errors.description = "Mô tả tối đa 5000 ký tự";
  return errors;
};

/**
 * Danh mục chọn được để lưu: phải còn hoạt động (có trong cây /api/categories — cây chỉ gồm danh mục đang hoạt động)
 * và không phải danh mục cha có con. Trả "ok" | "missing" | "inactive" | "parent" | "unknown" (chưa tải được cây).
 */
export const categoryStatus = (flat, categoryId, loaded) => {
  if (!categoryId) return "missing";
  if (!loaded) return "unknown";
  const category = findCategoryById(flat, categoryId);
  if (!category) return "inactive";
  return category.hasChildren ? "parent" : "ok";
};

export const CATEGORY_INVALID_MESSAGE = "Danh mục cũ đã ngừng hoạt động — chọn danh mục khác để lưu";

/** Ảnh server từ API (SellerProductImageResponse) -> phần tử danh sách ảnh của form. */
export const toServerImage = (img) => ({
  kind: "server",
  key: `server-${img.id}`,
  id: img.id,
  url: img.url,
  isPrimary: Boolean(img.isPrimary),
  ai: img.ai ?? null
});

let newImageSeq = 0;
/** File người dùng chọn (chưa tải lên — chỉ có ở form tạo mới) -> phần tử danh sách ảnh. Nhớ revoke previewUrl khi bỏ. */
export const toNewImage = (file) => ({
  kind: "new",
  key: `new-${Date.now()}-${newImageSeq++}`,
  file,
  previewUrl: URL.createObjectURL(file)
});

export const revokeNewImages = (images) =>
  images.forEach((img) => {
    if (img.kind === "new") URL.revokeObjectURL(img.previewUrl);
  });

export const isRetake = (img) => img.kind === "server" && img.ai?.reviewStatus === RETAKE;

/** Ghi chú ai_results có dạng "<ghi chú AI> | Admin: <ghi chú admin>" -> chỉ lấy phần admin viết. */
export const adminNoteOf = (note) => {
  if (!note) return "";
  const idx = note.lastIndexOf("Admin: ");
  return idx >= 0 ? note.slice(idx + "Admin: ".length).trim() : note;
};

/**
 * Lọc file chọn/thả: chỉ JPG/PNG/WEBP ≤ 5 MB, tối đa `slotsLeft` ảnh.
 * Trả { accepted, skippedMessage } — skippedMessage null nếu không bỏ file nào.
 */
export const selectImageFiles = (fileList, slotsLeft) => {
  const accepted = [];
  let badType = 0;
  let tooBig = 0;
  let overflow = 0;
  Array.from(fileList ?? []).forEach((file) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type) || file.size === 0) badType += 1;
    else if (file.size > MAX_IMAGE_BYTES) tooBig += 1;
    else if (accepted.length >= slotsLeft) overflow += 1;
    else accepted.push(file);
  });
  const skipped = badType + tooBig + overflow;
  if (skipped === 0) return { accepted, skippedMessage: null };
  const reasons = [
    badType && `${badType} sai định dạng`,
    tooBig && `${tooBig} quá 5 MB`,
    overflow && `${overflow} vượt quá ${MAX_IMAGES} ảnh`
  ].filter(Boolean);
  return { accepted, skippedMessage: `Đã bỏ qua ${skipped} ảnh (${reasons.join(", ")})` };
};

/** Chia file thành các lô tổng dung lượng ≤ limit (mỗi file đã ≤ 5 MB nên lô nào cũng có ít nhất 1 file). */
export const chunkFilesBySize = (files, limit = UPLOAD_BATCH_BYTES) => {
  const batches = [];
  let current = [];
  let size = 0;
  files.forEach((file) => {
    if (current.length > 0 && size + file.size > limit) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(file);
    size += file.size;
  });
  if (current.length > 0) batches.push(current);
  return batches;
};

/** "Đang tải ảnh 2/4…" hoặc "Đang tải ảnh 2–3/4…" khi 1 lô có nhiều ảnh. */
export const uploadProgressText = (done, batchSize, total) => {
  const from = done + 1;
  const to = done + batchSize;
  return `Đang tải ảnh ${from === to ? from : `${from}–${to}`}/${total}…`;
};

/**
 * Tải ảnh theo lô (mỗi lô 1 request, backend gọi AI cho từng ảnh). Không ném lỗi:
 * trả { response, uploaded, error } — response là ProductImagesResponse của lô cuối thành công.
 */
export const uploadImagesInBatches = async (productId, files, onProgress) => {
  const batches = chunkFilesBySize(files);
  let response = null;
  let uploaded = 0;
  for (const batch of batches) {
    onProgress?.(uploadProgressText(uploaded, batch.length, files.length));
    const formData = new FormData();
    batch.forEach((file) => formData.append("files", file));
    try {
      response = await sellerApi.product.uploadImages(productId, formData);
    } catch (error) {
      return { response, uploaded, error };
    }
    uploaded += batch.length;
  }
  return { response, uploaded, error: null };
};

/** Lỗi 400 validate của backend: data = { field: message } -> gắn lại vào đúng ô. */
export const fieldErrorsOf = (err) => {
  const data = err?.response?.status === 400 ? err.response.data?.data : null;
  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
};
