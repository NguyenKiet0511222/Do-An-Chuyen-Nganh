import axios from "axios";
import { classifyProduceImage } from "./aiService";

// NƠI DUY NHẤT gọi HTTP trong frontend. Mọi request đi qua Spring Boot (không gọi thẳng AI service / DB).
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const TOKEN_KEY = "agri_token"; // trùng với context/AuthContext.jsx
const USER_KEY = "agri_user";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 10000
});

// Gắn JWT vào mọi request nếu đã đăng nhập
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token hết hạn / không hợp lệ -> xoá phiên và về trang đăng nhập (trừ chính các API auth)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

// Backend luôn trả { success, message, data } (ApiResponse) -> chỉ lấy phần data
const unwrap = (response) => response.data?.data ?? response.data;

// ==========================================
// 1. API Xác thực (Auth) — backend làm ở tuần 3
// ==========================================
export const authApi = {
  // -> { token, user: { id, fullName, email, roles: [...] } }
  login: (payload) => apiClient.post("/auth/login", payload).then(unwrap),
  register: (payload) => apiClient.post("/auth/register", payload).then(unwrap),
  loginWithGoogle: (idToken) => apiClient.post("/auth/google", { idToken }).then(unwrap),
  me: () => apiClient.get("/auth/me").then(unwrap)
};

// ==========================================
// 2. API Nông sản (Products) — Mục 4.4 api.md
// ==========================================
export const productApi = {
  /**
   * Lấy danh sách sản phẩm công khai kèm lọc, sắp xếp và phân trang
   * @param {Object} params { keyword, categoryId, shopId, minPrice, maxPrice, origin, aiLabel, sort, page, size }
   */
  getAll: async (params = {}) => {
    const cleanedParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "" && value !== "all") {
        cleanedParams[key] = value;
      }
    }

    try {
      const response = await apiClient.get("/products", { params: cleanedParams });
      return unwrap(response);
    } catch (error) {
      console.warn("Lỗi kết nối API /products:", error.message);
      throw error;
    }
  },

  /**
   * Lấy chi tiết sản phẩm công khai kèm danh sách ảnh và nhãn AI từng ảnh
   * @param {number|string} id
   */
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return unwrap(response);
    } catch (error) {
      console.warn(`Lỗi kết nối API /products/${id}:`, error.message);
      throw error;
    }
  }
};

// ==========================================
// 3. API AI Phân loại chất lượng qua ảnh (đi qua Spring Boot -> AI service)
// ==========================================
export const aiApi = {
  /**
   * Gửi ảnh tới backend để nhận nhãn AI (loại nông sản, tươi/hỏng, độ tin cậy)
   * @param {File|string} imageInput File từ input hoặc URL ảnh mẫu
   * @param {string|null} sampleId ID ảnh mẫu demo (nếu chọn từ danh sách)
   */
  classify: async (imageInput, sampleId = null) => {
    if (imageInput instanceof File) {
      const formData = new FormData();
      formData.append("image", imageInput);

      try {
        const response = await apiClient.post("/ai/classify", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        return unwrap(response);
      } catch (error) {
        console.warn("Backend AI chưa phản hồi, sử dụng phân tích mô phỏng:", error.message);
      }
    }

    // Fallback mô phỏng cho demo khi chưa nối AI (tuần 5)
    return await classifyProduceImage(imageInput, sampleId);
  }
};

// ==========================================
// 4. API Đơn hàng (Orders) — backend làm ở tuần 5
// ==========================================
export const orderApi = {
  createOrder: async (orderData) => {
    try {
      return unwrap(await apiClient.post("/orders", orderData));
    } catch (error) {
      console.warn("Backend chưa sẵn sàng, mô phỏng đặt hàng thành công:", error.message);
      return {
        success: true,
        orderId: `AGRI-${Math.floor(100000 + Math.random() * 900000)}`,
        message: "Đặt hàng thành công (Mô phỏng)"
      };
    }
  }
};
