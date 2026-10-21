import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CustomerLayout from "./layouts/CustomerLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ComingSoon from "./components/ComingSoon";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/customer/HomePage";
import ProductsPage from "./pages/customer/ProductsPage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import ShopPage from "./pages/customer/ShopPage";
import AIClassifierPage from "./pages/customer/AIClassifierPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import MyOrdersPage from "./pages/customer/MyOrdersPage";
import OrderDetailPage from "./pages/customer/OrderDetailPage";
import AccountPage from "./pages/customer/AccountPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import SellerDashboardPage from "./pages/seller/SellerDashboardPage";
import SellerProductsPage from "./pages/seller/SellerProductsPage";
import SellerProductFormPage from "./pages/seller/SellerProductFormPage";
import SellerOrdersPage from "./pages/seller/SellerOrdersPage";
import SellerOrderDetailPage from "./pages/seller/SellerOrderDetailPage";
import SellerInfoAIPage from "./pages/seller/SellerInfoAIPage";
import ProfilePage from "./pages/shared/ProfilePage";
// Admin Management Pages (Theo Wireframe Nhóm 5)
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProductDetailPage from "./pages/admin/AdminProductDetailPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import AdminAiReviewPage from "./pages/admin/AdminAiReviewPage";

import "./App.css";

// Tạo mới -> sửa dùng chung 1 component: key theo id để chuyển /new -> /:id/edit thì form dựng lại sạch (không giữ file đã chọn)
function SellerProductFormRoute() {
  const { id } = useParams();
  return <SellerProductFormPage key={id ?? "new"} />;
}

// Trang lỗi lúc render không làm trắng cả app; chuyển sang đường dẫn khác là hết trạng thái lỗi
function AppRoutes({ children }) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRoutes>
          <Routes>
            {/* Khu khách hàng + trang đăng nhập/đăng ký (CSS thuần, có Navbar/Footer/Giỏ hàng) */}
            <Route element={<CustomerLayout />}>
              {/* Người xem chưa đăng nhập vẫn xem được */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/category/:slug" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/shops/:id" element={<ShopPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Cần đăng nhập (mọi vai trò) — khớp api.md 1.5: /api/cart, /api/orders, /api/users/me, /api/ai */}
              <Route element={<RequireAuth />}>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/my-orders" element={<MyOrdersPage />} />
                <Route path="/my-orders/:id" element={<OrderDetailPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/ai-check" element={<AIClassifierPage />} />
              </Route>
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
              <Route path="products" element={<SellerProductsPage />} />
              <Route path="products/new" element={<SellerProductFormRoute />} />
              <Route path="products/:id/edit" element={<SellerProductFormRoute />} />
              <Route path="orders" element={<SellerOrdersPage />} />
              <Route path="orders/:id" element={<SellerOrderDetailPage />} />
              <Route path="info" element={<SellerInfoAIPage />} />
              <Route path="profile" element={<ProfilePage />} />
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

              {/* Kiểm định AI: hàng chờ, thử mô hình, ngưỡng & thống kê (docs/1910.md mục 7.3) */}
              <Route path="ai-review" element={<AdminAiReviewPage />} />
              
              <Route path="profile" element={<ProfilePage />} />

              <Route path="*" element={<ComingSoon />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </AppRoutes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
