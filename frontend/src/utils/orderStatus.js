// Trạng thái đơn hàng (enum OrderStatus, api.md mục 3.5) + các bước người bán được chuyển.

export const ORDER_STATUS_META = {
  PENDING: { label: "Chờ xác nhận", color: "warning" },
  CONFIRMED: { label: "Đã xác nhận", color: "info" },
  PROCESSING: { label: "Đang chuẩn bị", color: "info" },
  SHIPPING: { label: "Đang giao", color: "primary" },
  DELIVERED: { label: "Hoàn thành", color: "success" },
  CANCELLED: { label: "Đã huỷ", color: "error" }
};

export const ORDER_STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"];

// Các bước hiển thị trên stepper (đơn huỷ hiện cảnh báo riêng, không nằm trên stepper)
export const ORDER_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"];

// Chép đúng SellerOrderService.SELLER_TRANSITIONS — sửa ở backend thì sửa cả ở đây. SHIPPING không huỷ được.
export const SELLER_NEXT_STATUS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"]
};

// Bước tiến (không tính huỷ) của 1 đơn, null nếu đã kết thúc
export const nextForwardStatus = (status) => (SELLER_NEXT_STATUS[status] || []).find((s) => s !== "CANCELLED") ?? null;

export const canSellerCancel = (status) => (SELLER_NEXT_STATUS[status] || []).includes("CANCELLED");

// Chữ trên nút chuyển sang trạng thái đích
export const NEXT_ACTION_LABEL = {
  CONFIRMED: "Xác nhận đơn",
  PROCESSING: "Bắt đầu chuẩn bị",
  SHIPPING: "Giao cho vận chuyển",
  DELIVERED: "Xác nhận đã giao",
  CANCELLED: "Huỷ đơn"
};

export const PAYMENT_STATUS_META = {
  UNPAID: { label: "Chưa thanh toán", color: "warning" },
  PAID: { label: "Đã thanh toán", color: "success" }
};
