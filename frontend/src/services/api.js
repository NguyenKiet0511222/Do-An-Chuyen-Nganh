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
  timeout: 15000
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

// Ảnh upload backend trả dạng tương đối "/uploads/..." -> ghép với origin backend (bỏ đuôi /api), api.md mục 6.
// URL tuyệt đối (ảnh seed Unsplash, placeholder) giữ nguyên.
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const resolveAssetUrl = (url) =>
  typeof url === "string" && url.startsWith("/uploads/") ? `${BACKEND_ORIGIN}${url}` : url;

// ==========================================
// 1. API Xác thực (Auth)
// ==========================================
export const authApi = {
  // -> { accessToken, tokenType: "Bearer", expiresIn, user: { id, fullName, email, role, ... } }
  login: async (payload) => {
    const response = await apiClient.post("/auth/login", payload);
    return unwrap(response);
  },
  register: (payload) => apiClient.post("/auth/register", payload).then(unwrap),
  loginWithGoogle: (idToken) => apiClient.post("/auth/google", { idToken }).then(unwrap),
  me: () => apiClient.get("/auth/me").then(unwrap),
  changePassword: (payload) => apiClient.put("/auth/change-password", payload).then(unwrap)
};

// ==========================================
// 1.2. API Hồ sơ cá nhân (User Profile) — api.md v1.7 mục 4.2
// ==========================================
export const userProfileApi = {
  get: () => apiClient.get("/users/me").then(unwrap),
  update: (payload) => apiClient.put("/users/me", payload).then(unwrap),
  updateAvatar: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.put("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then(unwrap);
  }
};

// ==========================================
// 1.5. API Danh mục (Categories)
// ==========================================
export const categoryApi = {
  getAll: async () => {
    try {
      const response = await apiClient.get("/categories");
      return unwrap(response);
    } catch (error) {
      console.warn("Lỗi kết nối API /categories:", error.message);
      throw error;
    }
  }
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
// 2.2. API Đánh giá sản phẩm (Reviews) — api.md v1.7 mục 3.6 & 4.4
// ==========================================
export const reviewApi = {
  getByProduct: (productId, params = {}) =>
    apiClient.get(`/products/${productId}/reviews`, { params }).then(unwrap),
  create: (productId, payload) =>
    apiClient.post(`/products/${productId}/reviews`, payload).then(unwrap)
};

// ==========================================
// 2.5. API Cửa hàng (Shops)
// ==========================================
export const shopApi = {
  getShopPublicPage: async (id, page = 0, size = 12) => {
    try {
      const response = await apiClient.get(`/shops/${id}`, {
        params: { page, size }
      });
      return unwrap(response);
    } catch (error) {
      console.warn(`Lỗi kết nối API /shops/${id}:`, error.message);
      throw error;
    }
  }
};

// ==========================================
// 3. API AI Phân loại chất lượng qua ảnh (Khách hàng Premium & demo)
// ==========================================
export const aiApi = {
  /**
   * Gửi ảnh tới backend để nhận nhãn AI (/api/ai/classify)
   * @param {File|string} imageInput File từ input hoặc URL ảnh mẫu
   * @param {string|null} sampleId ID ảnh mẫu demo (nếu chọn từ danh sách)
   */
  classify: async (imageInput, sampleId = null) => {
    if (imageInput instanceof File) {
      const formData = new FormData();
      formData.append("file", imageInput);

      const response = await apiClient.post("/ai/classify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000
      });
      return unwrap(response);
    }

    // Fallback mô phỏng cho ảnh demo offline
    return await classifyProduceImage(imageInput, sampleId);
  },
  getHistory: (params = {}) => apiClient.get("/ai/history", { params }).then(unwrap),
  getHistoryById: (id) => apiClient.get(`/ai/history/${id}`).then(unwrap)
};

// ==========================================
// 4. API Sổ địa chỉ (Addresses) — Mục 4.2 api.md
// ==========================================
export const addressApi = {
  listMine: () => apiClient.get("/users/me/addresses").then(unwrap),
  getMine: (id) => apiClient.get(`/users/me/addresses/${id}`).then(unwrap),
  create: (payload) => apiClient.post("/users/me/addresses", payload).then(unwrap),
  update: (id, payload) => apiClient.put(`/users/me/addresses/${id}`, payload).then(unwrap),
  delete: (id) => apiClient.delete(`/users/me/addresses/${id}`).then(unwrap),
  setDefault: (id) => apiClient.patch(`/users/me/addresses/${id}/default`).then(unwrap)
};

// ==========================================
// 4.5. API Giỏ hàng (Cart) — Mục 4.5 api.md
// ==========================================
export const cartApi = {
  get: () => apiClient.get("/cart").then(unwrap),
  addItem: (payload) => apiClient.post("/cart/items", payload).then(unwrap),
  updateQuantity: (id, quantity) => apiClient.put(`/cart/items/${id}`, { quantity }).then(unwrap),
  removeItem: (id) => apiClient.delete(`/cart/items/${id}`).then(unwrap),
  clear: () => apiClient.delete("/cart").then(unwrap)
};

// ==========================================
// 4.6. API Đơn hàng (Orders) — Mục 4.6 api.md
// ==========================================
export const orderApi = {
  checkout: (payload) => apiClient.post("/orders/checkout", payload).then(unwrap),
  getMyOrders: (params = {}) => apiClient.get("/orders", { params }).then(unwrap),
  getById: (id) => apiClient.get(`/orders/${id}`).then(unwrap),
  cancel: (id, cancelReason) => apiClient.patch(`/orders/${id}/cancel`, { cancelReason }).then(unwrap)
};

// ==========================================
// 5. API Người bán (Seller) — Mục 4.8 api.md
// ==========================================
export const sellerApi = {
  // --- Shop ---
  register: (payload) => apiClient.post("/seller/register", payload).then(unwrap),
  getShop: () => apiClient.get("/seller/shop").then(unwrap),
  updateShop: (payload) => apiClient.put("/seller/shop", payload).then(unwrap),
  updateLogo: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.put("/seller/shop/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then(unwrap);
  },

  // --- Products ---
  product: {
    getAll: (params = {}) => apiClient.get("/seller/products", { params }).then(unwrap),
    getById: (id) => apiClient.get(`/seller/products/${id}`).then(unwrap),
    create: (payload) => apiClient.post("/seller/products", payload).then(unwrap),
    update: (id, payload) => apiClient.put(`/seller/products/${id}`, payload).then(unwrap),
    delete: (id) => apiClient.delete(`/seller/products/${id}`).then(unwrap),
    submit: (id) => apiClient.post(`/seller/products/${id}/submit`).then(unwrap),
    uploadImages: (id, formData) => apiClient.post(`/seller/products/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000
    }).then(unwrap),
    deleteImage: (id, imageId) => apiClient.delete(`/seller/products/${id}/images/${imageId}`).then(unwrap),
    changeVisibility: (id, hidden) => apiClient.patch(`/seller/products/${id}/visibility`, { hidden }).then(unwrap),
    updateStock: (id, stockQuantity) => apiClient.patch(`/seller/products/${id}/stock`, { stockQuantity }).then(unwrap),
    setPrimaryImage: (id, imageId) => apiClient.patch(`/seller/products/${id}/images/${imageId}/primary`).then(unwrap)
  },

  // --- Orders ---
  order: {
    getAll: (params = {}) => apiClient.get("/seller/orders", { params }).then(unwrap),
    getById: (id) => apiClient.get(`/seller/orders/${id}`).then(unwrap),
    changeStatus: (id, payload) => apiClient.patch(`/seller/orders/${id}/status`, payload).then(unwrap)
  },

  // --- Dashboard ---
  dashboard: {
    getSummary: () => apiClient.get("/seller/dashboard/summary").then(unwrap),
    getAiResults: (params = {}) => apiClient.get("/seller/ai/results", { params }).then(unwrap)
  }
};

// ==========================================
// 6. API Quản trị (Admin) — Mục 4.9 api.md
// ==========================================
export const adminApi = {
  product: {
    getAll: (params = {}) => apiClient.get("/admin/products", { params }).then(unwrap),
    getById: (id) => apiClient.get(`/admin/products/${id}`).then(unwrap),
    review: (id, payload) => apiClient.patch(`/admin/products/${id}/review`, payload).then(unwrap),
    reviewBulk: (payload) => apiClient.patch("/admin/products/review-bulk", payload).then(unwrap)
  },
  dashboard: {
    getSummary: () => apiClient.get("/admin/dashboard/summary").then(unwrap),
    getRevenue: (days = 7) => apiClient.get(`/admin/dashboard/revenue?days=${days}`).then(unwrap),
    getRecentOrders: (limit = 5) => apiClient.get(`/admin/dashboard/recent-orders?limit=${limit}`).then(unwrap),
    getPendingProducts: (limit = 5) => apiClient.get(`/admin/dashboard/pending-products?limit=${limit}`).then(unwrap)
  },
  order: {
    getAll: (params = {}) => apiClient.get("/admin/orders", { params }).then(unwrap),
    getById: (id) => apiClient.get(`/admin/orders/${id}`).then(unwrap),
    updateStatus: (id, payload) => apiClient.patch(`/admin/orders/${id}/status`, payload).then(unwrap)
  },
  shop: {
    getAll: (params = {}) => apiClient.get("/admin/shops", { params }).then(unwrap),
    getById: (id) => apiClient.get(`/admin/shops/${id}`).then(unwrap),
    updateStatus: (id, payload) => apiClient.patch(`/admin/shops/${id}/status`, payload).then(unwrap)
  },
  user: {
    getAll: (params = {}) => apiClient.get("/admin/users", { params }).then(unwrap),
    getById: (id) => apiClient.get(`/admin/users/${id}`).then(unwrap),
    updateStatus: (id, action) => apiClient.patch(`/admin/users/${id}/status`, { action }).then(unwrap),
    updateTier: (id, tier) => apiClient.patch(`/admin/users/${id}/tier`, { tier }).then(unwrap),
    createAdmin: (payload) => apiClient.post("/admin/users", payload).then(unwrap)
  },
  category: {
    getAll: () => apiClient.get("/admin/categories").then(unwrap),
    create: (payload) => apiClient.post("/admin/categories", payload).then(unwrap),
    update: (id, payload) => apiClient.put(`/admin/categories/${id}`, payload).then(unwrap),
    delete: (id) => apiClient.delete(`/admin/categories/${id}`).then(unwrap)
  },
  // Kiểm định AI — docs/1910.md mục 7.2
  ai: {
    getResults: (params = {}) => apiClient.get("/admin/ai/results", { params }).then(unwrap),
    getResult: (id) => apiClient.get(`/admin/ai/results/${id}`).then(unwrap),
    review: (id, payload) => apiClient.patch(`/admin/ai/results/${id}/review`, payload).then(unwrap),
    acceptBulk: (payload) => apiClient.patch("/admin/ai/results/accept-bulk", payload).then(unwrap),
    classify: (file) => {
      const formData = new FormData();
      formData.append("image", file);
      return apiClient.post("/admin/ai/classify", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }).then(unwrap);
    },
    getSettings: () => apiClient.get("/admin/ai/settings").then(unwrap),
    updateSettings: (payload) => apiClient.put("/admin/ai/settings", payload).then(unwrap),
    getStatistics: (params = {}) => apiClient.get("/admin/ai/statistics", { params }).then(unwrap)
  }
};
