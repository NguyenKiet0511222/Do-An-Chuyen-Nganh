import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import { ShoppingBag, Search, ChevronDown, Menu, X, Wand2, User } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { totalCount } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="site-header">
      {/* Top Row */}
      <div className="header-top">
        <div className="header-top-container">
          {/* Logo */}
          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/logo.png" alt="Logo" style={{ height: "56px" }} onError={(e) => e.target.style.display='none'} />
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#00A651', whiteSpace: 'nowrap' }}>Nông sản Việt</span>
          </Link>

          {/* Search Bar */}
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm rau củ, trái cây sạch, nấm hữu cơ..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-submit-btn">Tìm</button>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="header-actions">
            {/* Kiểm tra AI Button */}
            <Link to="/ai-check" className="btn-ai-check">
              <Wand2 size={16} />
              <span>Kiểm tra AI</span>
            </Link>

            {/* Giỏ hàng */}
            <Link to="/cart" className="cart-button">
              <div className="cart-icon-wrapper">
                <ShoppingBag size={24} color="#4b5563" />
                <span className="cart-badge">{totalCount > 0 ? totalCount : 0}</span>
              </div>
              <span className="cart-label">Giỏ hàng</span>
            </Link>

            <div className="divider"></div>

            {/* User Profile */}
            {user ? (
              <Link to="/account" className="user-profile-nav">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="user-avatar" />
                ) : (
                  <div className="default-avatar">
                    <User size={20} />
                  </div>
                )}
                <div className="user-info-nav">
                  <span className="user-name">{user.fullName || "Nguyễn Anh Kiệt"}</span>
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
            <Link to="/category/rau-cu" className={`nav-link ${isActive("/category/rau-cu") ? "active" : ""}`}>
              Rau củ
            </Link>
            <Link to="/category/trai-cay" className={`nav-link ${isActive("/category/trai-cay") ? "active" : ""}`}>
              Trái cây
            </Link>
            <Link to="/category/nam" className={`nav-link ${isActive("/category/nam") ? "active" : ""}`}>
              Nấm
            </Link>
            <Link to="/category/thuc-pham-kho" className={`nav-link ${isActive("/category/thuc-pham-kho") ? "active" : ""}`}>
              Thực phẩm khô
            </Link>
            <Link to="/category/dac-san" className={`nav-link ${isActive("/category/dac-san") ? "active" : ""}`}>
              Đặc sản
            </Link>
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
