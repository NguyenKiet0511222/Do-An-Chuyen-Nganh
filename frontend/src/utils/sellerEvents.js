// Báo cho menu người bán (badge "cần sửa", "đơn mới") và trang tổng quan tải lại số liệu
// sau khi gửi duyệt / xoá / ẩn sản phẩm hoặc đổi trạng thái đơn.
export const SELLER_DATA_CHANGED_EVENT = "agri:seller-data-changed";
export const notifySellerDataChanged = () => window.dispatchEvent(new Event(SELLER_DATA_CHANGED_EVENT));
