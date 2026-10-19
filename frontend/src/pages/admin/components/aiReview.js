// Hằng số + hàm tiện ích dùng chung cho màn Kiểm định AI (docs/1910.md mục 7.2–7.3).
// Tách khỏi file component vì oxlint only-export-components.

// Nhãn AI — màu theo api.md mục 8: TƯƠI viền xanh, HỎNG nền đỏ, KHÔNG CHẮC nét đứt vàng
export const AI_LABEL_META = {
  FRESH: { text: "TƯƠI", sx: { bgcolor: "#f0fdf4", color: "#15803d", border: "1.5px solid #22c55e" } },
  ROTTEN: { text: "HỎNG", sx: { bgcolor: "#dc2626", color: "#ffffff", border: "1.5px solid #dc2626" } },
  UNCERTAIN: { text: "KHÔNG CHẮC", sx: { bgcolor: "#fffbeb", color: "#b45309", border: "1.5px dashed #f59e0b" } }
};

export const AI_LABEL_OPTIONS = [
  { value: "FRESH", label: "Tươi" },
  { value: "ROTTEN", label: "Hỏng" },
  { value: "UNCERTAIN", label: "Không chắc" }
];

// Trạng thái kiểm định của 1 ảnh (enum AiReviewStatus)
export const REVIEW_STATUS_META = {
  PENDING_REVIEW: { label: "Chờ kiểm định", color: "warning" },
  AUTO_ACCEPTED: { label: "Tự chấp nhận", color: "info" },
  ACCEPTED: { label: "Đã chấp nhận", color: "success" },
  CORRECTED: { label: "Đã sửa", color: "secondary" },
  RETAKE_REQUESTED: { label: "Yêu cầu chụp lại", color: "error" }
};

export const REVIEW_STATUS_ORDER = ["PENDING_REVIEW", "AUTO_ACCEPTED", "ACCEPTED", "CORRECTED", "RETAKE_REQUESTED"];

// Chỉ 2 trạng thái này còn thao tác được (mục 6: ảnh đã ACCEPTED/CORRECTED/RETAKE_REQUESTED -> 409)
export const isReviewable = (reviewStatus) => reviewStatus === "PENDING_REVIEW" || reviewStatus === "AUTO_ACCEPTED";

// Trạng thái sản phẩm (giống AdminProductsPage)
export const PRODUCT_STATUS_META = {
  DRAFT: { label: "Bản nháp", color: "default" },
  PENDING: { label: "Chờ duyệt", color: "warning" },
  APPROVED: { label: "Đã duyệt", color: "success" },
  REJECTED: { label: "Từ chối", color: "error" },
  NEED_INFO: { label: "Cần bổ sung", color: "info" },
  HIDDEN: { label: "Đang ẩn", color: "default" }
};

// 14 loại nông sản model biết (CLAUDE.md mục 7) — key tiếng Anh trùng produce_type của AI service
export const PRODUCE_TYPES = [
  { value: "apple", label: "Táo" },
  { value: "banana", label: "Chuối" },
  { value: "bellpepper", label: "Ớt chuông" },
  { value: "carrot", label: "Cà rốt" },
  { value: "cucumber", label: "Dưa leo" },
  { value: "grape", label: "Nho" },
  { value: "guava", label: "Ổi" },
  { value: "jujube", label: "Táo tàu" },
  { value: "mango", label: "Xoài" },
  { value: "orange", label: "Cam" },
  { value: "pomegranate", label: "Lựu" },
  { value: "potato", label: "Khoai tây" },
  { value: "strawberry", label: "Dâu tây" },
  { value: "tomato", label: "Cà chua" }
];

const PRODUCE_NAME = Object.fromEntries(PRODUCE_TYPES.map((p) => [p.value, p.label]));

/** "mango" -> "Xoài (mango)"; loại lạ giữ nguyên key. */
export const formatProduce = (produce) => {
  if (!produce) return null;
  const name = PRODUCE_NAME[produce.toLowerCase()];
  return name ? `${name} (${produce})` : produce;
};

/** Tên lớp lúc train "bellpepper_rotten" -> "Ớt chuông · hỏng". */
export const formatClassLabel = (classLabel) => {
  if (!classLabel) return "";
  const idx = classLabel.lastIndexOf("_");
  if (idx < 0) return classLabel;
  const produce = classLabel.slice(0, idx);
  const condition = classLabel.slice(idx + 1);
  const conditionText = condition === "fresh" ? "tươi" : condition === "rotten" ? "hỏng" : condition;
  return `${PRODUCE_NAME[produce] || produce} · ${conditionText}`;
};

/** Nhãn hiển thị = nhãn admin chốt nếu có, không thì nhãn AI. */
export const displayLabelOf = (ai) => (ai ? ai.displayLabel ?? ai.finalLabel ?? ai.label : null);

/** 0.9312 -> "93%"; null/0 (AI lỗi) -> null để không hiện "0%". */
export const formatPercent = (confidence) => {
  const value = Number(confidence);
  return Number.isFinite(value) && value > 0 ? `${Math.round(value * 100)}%` : null;
};

/** Ảnh lỗi (file đã xoá, backend tắt) -> thay bằng placeholder, chỉ thay 1 lần để không lặp vô hạn. */
export const handleImageError = (event) => {
  const img = event.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.src = "https://placehold.co/400x300?text=No+Image";
};

/** Lấy message tiếng Việt của ApiResponse khi lỗi, không có thì dùng câu mặc định. */
export const apiErrorMessage = (err, fallback) => err?.response?.data?.message || fallback;

// Báo cho menu (badge "Kiểm định AI") và tab "Hàng chờ (n)" tải lại số ảnh đang chờ
export const AI_PENDING_CHANGED_EVENT = "agri:ai-pending-changed";
export const notifyAiPendingChanged = () => window.dispatchEvent(new Event(AI_PENDING_CHANGED_EVENT));
