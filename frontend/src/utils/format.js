// Tiện ích hiển thị dùng chung cho mọi khu (khách, người bán, admin).

/** Lấy message tiếng Việt của ApiResponse khi lỗi, không có thì dùng câu mặc định. */
export const apiErrorMessage = (err, fallback) => err?.response?.data?.message || fallback;

/** Ảnh lỗi (file đã xoá, backend tắt) -> thay bằng placeholder, chỉ thay 1 lần để không lặp vô hạn. */
export const handleImageError = (event) => {
  const img = event.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.src = "https://placehold.co/400x300?text=No+Image";
};

/** 45000 -> "45.000 đ"; null -> "—". */
export const formatVnd = (value) =>
  value === null || value === undefined || value === "" ? "—" : `${Number(value).toLocaleString("vi-VN")} đ`;

/** ISO "2026-10-21T09:30:00" -> "21/10/2026 09:30"; null -> "—". */
export const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
