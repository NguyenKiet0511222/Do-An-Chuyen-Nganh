// Chuẩn hoá chuỗi tiếng Việt để so khớp không dấu: "Cà Chua Đà Lạt" -> "ca chua da lat".
// NFD tách dấu thành ký tự riêng rồi bỏ; giữ nguyên độ dài theo từng ký tự gốc nên dùng được để tô đoạn khớp.
export const normalizeVi = (str) =>
  String(str ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
