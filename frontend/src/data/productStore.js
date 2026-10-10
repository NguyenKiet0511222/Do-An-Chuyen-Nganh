import { ADMIN_PRODUCTS } from "./adminMockData";

export async function syncSharedProductsWithApi() {
  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    const res = await fetch(`${API_URL}/products?size=100`);
    if (res.ok) {
      const data = await res.json();
      const items = data.data?.content || [];
      if (items.length > 0) {
        const backendProducts = items.map(p => ({
          id: p.id,
          name: p.name,
          seller: p.shop?.shopName || "HTX Nông Sản",
          category: typeof p.category === 'object' ? p.category?.name : (p.category || "Nông sản sạch"),
          price: Number(p.price) || 0,
          originalPrice: Math.floor((Number(p.price) || 0) * 1.2),
          inventory: p.stockQuantity || 100,
          status: p.status || "APPROVED",
          imageUrl: p.primaryImageUrl || p.imageUrl || "https://placehold.co/400x400?text=No+Image",
          aiLabel: {
            text: p.aiOverallLabel === "FRESH" ? "Tươi sạch AI" : (p.aiOverallLabel === "ROTTEN" ? "Hỏng" : "Kiểm định AI"),
            type: p.aiOverallLabel === "FRESH" ? "fresh" : (p.aiOverallLabel === "ROTTEN" ? "rotten" : "uncertain"),
            confidence: p.aiOverallConfidence ? Number(p.aiOverallConfidence) : 0.95
          },
          rejectReason: p.rejectReason || "",
          submitDate: new Date().toLocaleDateString("vi-VN"),
          soldCount: p.soldCount || 0
        }));

        const stored = localStorage.getItem("shared_products");
        let current = stored ? JSON.parse(stored) : [];
        const existingIds = new Set(backendProducts.map(p => String(p.id)));
        const nonBackend = current.filter(p => !existingIds.has(String(p.id)));
        const merged = [...backendProducts, ...nonBackend];

        localStorage.setItem("shared_products", JSON.stringify(merged));
        return merged;
      }
    }
  } catch (err) {
    console.warn("Lỗi đồng bộ sản phẩm từ backend API:", err);
  }
  return getSharedProducts();
}

// Tự động đồng bộ ngầm khi chạy trên trình duyệt
if (typeof window !== "undefined") {
  syncSharedProductsWithApi();
}

export function getSharedProducts() {
  const stored = localStorage.getItem("shared_products");
  if (stored) {
    let parsed = JSON.parse(stored);
    let changed = false;
    parsed.forEach(p => {
      if (["SP-01186", "SP-01185", "SP-01183", "SP-01181", "SP-01180"].includes(p.id)) {
        if (p.status === "PENDING") {
          p.status = "APPROVED";
          changed = true;
        }
      }
    });
    if (changed) {
      localStorage.setItem("shared_products", JSON.stringify(parsed));
    }
    return parsed;
  }
  
  // Initialize with ADMIN_PRODUCTS as base
  const initial = ADMIN_PRODUCTS.map(p => ({
    id: p.id,
    name: p.name,
    seller: p.seller || "Vườn rau Tâm An",
    category: p.category,
    price: p.price,
    originalPrice: p.price * 1.2,
    inventory: p.inventory || 100,
    status: p.status === "Chờ duyệt" ? "PENDING" : (p.status === "Cần sửa" ? "REJECTED" : "APPROVED"),
    imageUrl: p.imageUrl,
    aiLabel: p.aiLabel,
    rejectReason: p.rejectReason || "",
    submitDate: p.submitDate || new Date().toLocaleDateString("vi-VN"),
    soldCount: Math.floor(Math.random() * 50)
  }));
  
  localStorage.setItem("shared_products", JSON.stringify(initial));
  return initial;
}

export function saveSharedProducts(products) {
  localStorage.setItem("shared_products", JSON.stringify(products));
}

export function addProduct(product) {
  const products = getSharedProducts();
  products.unshift({
    ...product,
    id: `SP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    status: "PENDING",
    submitDate: new Date().toLocaleDateString("vi-VN"),
    aiLabel: { text: "AI chưa quét", type: "uncertain" }
  });
  saveSharedProducts(products);
}

export function updateProductStatus(id, newStatus, rejectReason = "") {
  const products = getSharedProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx].status = newStatus; // PENDING, APPROVED, REJECTED, HIDDEN
    if (rejectReason) products[idx].rejectReason = rejectReason;
    saveSharedProducts(products);
  }
}

export function updateProduct(id, updatedData) {
  const products = getSharedProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...updatedData, status: "PENDING", submitDate: new Date().toLocaleDateString("vi-VN") };
    saveSharedProducts(products);
  }
}
