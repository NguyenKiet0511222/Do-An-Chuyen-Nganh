// Hằng số + hàm tiện ích của màn Kiểm định AI (docs/1910.md mục 7.2–7.3).
// Phần dùng chung đã chuyển sang src/utils (aiLabel.js, format.js) — giữ re-export để import cũ của admin không phải sửa.

export * from "../../../utils/aiLabel";
export { apiErrorMessage, handleImageError } from "../../../utils/format";

// Báo cho menu (badge "Kiểm định AI") và tab "Hàng chờ (n)" tải lại số ảnh đang chờ
export const AI_PENDING_CHANGED_EVENT = "agri:ai-pending-changed";
export const notifyAiPendingChanged = () => window.dispatchEvent(new Event(AI_PENDING_CHANGED_EVENT));
