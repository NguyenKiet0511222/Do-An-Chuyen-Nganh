import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { ShoppingBag, ChevronDown, Menu, X, Wand2, User } from "lucide-react";
import { categoryApi, resolveAssetUrl } from "../services/api";
import { flattenCategoryTree, findCategoryBySlug } from "../utils/categories";
import SearchAutocomplete from "./SearchAutocomplete";
import "./Navbar.css";

const CATEGORY_PATH = "/category/";

export default function Navbar() {
  const { totalCount } = useCart();
  const { user, hasRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]); // danh sách phẳng, cha trước con

  // Danh mục thật từ /api/categories (công khai). Lỗi thì menu chỉ thiếu mục danh mục, không hiện danh mục giả.
  useEffect(() => {
    let ignore = false;
    categoryApi
      .getAll()
      .then((tree) => {
        if (!ignore) setCategories(flattenCategoryTree(tree));
      })
      .catch(() => {
        // Đã log trong categoryApi
      });
    return () => {
      ignore = true;
    };
  }, []);

  const rootCategories = useMemo(() => categories.filter((c) => c.depth === 0), [categories]);

  // Đang ở /category/:slug -> danh mục gốc tương ứng (trang danh mục con cũng sáng mục cha)
  const activeRootId = useMemo(() => {
    if (!location.pathname.startsWith(CATEGORY_PATH)) return null;
    const slug = location.pathname.slice(CATEGORY_PATH.length);
    const current = findCategoryBySlug(categories, slug);
    if (!current) return null;
    return current.parentId ?? current.id;
  }, [categories, location.pathname]);

  const isActive = (path) => location.pathname === path;
  const accountPath = hasRole("ADMIN") ? "/admin" : hasRole("SELLER") ? "/seller" : "/account";
  const avatarUrl = resolveAssetUrl(user?.avatarUrl);

  return (
    <header className="site-header">
      {/* Top Row */}
      <div className="header-top">
        <div className="header-top-container">
          {/* Logo */}
          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <img src="/logo.png" alt="Logo" className="brand-logo-img" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <span className="brand-logo-text">Nông sản Việt</span>
          </Link>

          {/* Ô tìm kiếm có gợi ý — chip danh mục dùng chung danh sách thật ở trên */}
          <div className="search-container">
            <SearchAutocomplete categories={categories} />
          </div>

          {/* Action Buttons */}
          <div className="header-actions">
            <Link to="/ai-check" className="btn-ai-check">
              <Wand2 size={16} />
              <span>Kiểm tra AI</span>
            </Link>

            <Link to="/cart" className="cart-button">
              <div className="cart-icon-wrapper">
                <ShoppingBag size={24} color="#4b5563" />
                <span className="cart-badge">{totalCount > 0 ? totalCount : 0}</span>
              </div>
              <span className="cart-label">Giỏ hàng</span>
            </Link>

            <div className="divider"></div>

            {user ? (
              <Link to={accountPath} className="user-profile-nav">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Ảnh đại diện" className="user-avatar" />
                ) : (
                  <div className="default-avatar">
                    <User size={20} />
                  </div>
                )}
                <div className="user-info-nav">
                  <span className="user-name">{user.fullName || user.email}</span>
                </div>
                <ChevronDown size={16} color="#666" />
              </Link>
            ) : (
              <Link to="/login" className="auth-login-link">
                Đăng nhập
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              className="mobile-menu-btn"
              aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row - Navigation */}
      <div className="header-bottom">
        <div className="header-bottom-container">
          <nav className="desktop-nav">
            <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
              Trang chủ
            </Link>
            {rootCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`${CATEGORY_PATH}${cat.slug}`}
                className={`nav-link ${activeRootId === cat.id ? "active" : ""}`}
              >
                {cat.name}
              </Link>
            ))}
            <Link to="/my-orders" className={`nav-link ${isActive("/my-orders") ? "active" : ""}`}>
              Đơn hàng của tôi
            </Link>
          </nav>

          <Link to="/ai-check" className="ai-scan-btn">
            Chụp ảnh – AI kiểm tra độ tươi
          </Link>
        </div>
      </div>
    </header>
  );
}
