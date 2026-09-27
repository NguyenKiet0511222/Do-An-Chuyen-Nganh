import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CustomerLayout from "./layouts/CustomerLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ComingSoon from "./components/ComingSoon";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/customer/HomePage";
import ProductsPage from "./pages/customer/ProductsPage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import AIClassifierPage from "./pages/customer/AIClassifierPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";

// Admin Management Pages (Theo Wireframe Nhóm 5)
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProductDetailPage from "./pages/admin/AdminProductDetailPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";

import "./App.css";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Khu khách hàng + trang đăng nhập/đăng ký (CSS thuần, có Navbar/Footer/Giỏ hàng) */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/ai-check" element={<AIClassifierPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Khu người bán (MUI dashboard, yêu cầu vai trò SELLER hoặc ADMIN) */}
            <Route
              path="/seller"
              element={
                <RequireAuth roles={["SELLER", "ADMIN"]}>
                  <DashboardLayout role="seller" />
                </RequireAuth>
              }
            >
              <Route index element={<SellerDashboardPage />} />
              <Route path="*" element={<ComingSoon />} />
            </Route>

            {/* Khu quản trị (MUI dashboard, yêu cầu vai trò ADMIN) - 5 màn hình theo Wireframe */}
            <Route
              path="/admin"
              element={
                <RequireAuth roles={["ADMIN"]}>
                  <DashboardLayout role="admin" />
                </RequireAuth>
              }
            >
              {/* Màn 1: Tổng quan */}
              <Route index element={<AdminDashboardPage />} />

              {/* Màn 5: Quản lý sản phẩm & Màn 4: Chi tiết duyệt sản phẩm */}
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/:id" element={<AdminProductDetailPage />} />

              {/* Màn 3: Quản lý đơn hàng & Màn 2: Chi tiết đơn hàng */}
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrderDetailPage />} />

              {/* Kiểm định AI (điều hướng nhanh tới danh sách sản phẩm) */}
              <Route path="ai-review" element={<AdminProductsPage />} />

              <Route path="*" element={<ComingSoon />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
