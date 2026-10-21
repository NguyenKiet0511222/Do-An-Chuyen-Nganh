import { sellerApi } from "../../../services/api";
import { ORDER_STATUS_ORDER } from "../../../utils/orderStatus";

/**
 * Đếm số đơn của shop theo từng trạng thái. Backend chưa có API đếm riêng (summary chỉ có pendingOrders)
 * -> mỗi trạng thái 1 request GET /seller/orders?status=X&size=1 rồi lấy totalElements.
 * params: { from, to } (yyyy-MM-dd, không bắt buộc) để chỉ đếm đơn đặt trong khoảng ngày đó.
 * Trả { PENDING, CONFIRMED, PROCESSING, SHIPPING, DELIVERED, CANCELLED, ALL }.
 */
export async function fetchOrderStatusCounts(params = {}) {
  const pages = await Promise.all(
    ORDER_STATUS_ORDER.map((status) => sellerApi.order.getAll({ ...params, status, page: 0, size: 1 }))
  );
  const counts = {};
  ORDER_STATUS_ORDER.forEach((status, index) => {
    counts[status] = Number(pages[index]?.totalElements) || 0;
  });
  counts.ALL = ORDER_STATUS_ORDER.reduce((sum, status) => sum + counts[status], 0);
  return counts;
}
