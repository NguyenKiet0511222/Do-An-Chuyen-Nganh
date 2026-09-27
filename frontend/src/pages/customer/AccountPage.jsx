import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./AccountPage.css";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("PROFILE");

  // Fallback data for wireframe mockup
  const mockUser = {
    fullName: user?.fullName || "Trần Thị Mai",
    email: user?.email || "mai@nongsan.vn",
    phone: "0912 345 678",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="account-page page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Tài khoản</span>
      </div>

      <div className="account-layout">
        {/* Sidebar */}
        <aside className="account-sidebar">
          <div className="sidebar-user-info">
            <div className="user-avatar-placeholder">
              <div className="cross-line"></div>
              <div className="cross-line cross-line-2"></div>
            </div>
            <div className="user-text-info">
              <h3 className="user-fullname">{mockUser.fullName}</h3>
              <p className="user-email">{mockUser.email}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-btn ${activeTab === "PROFILE" ? "active" : ""}`}
              onClick={() => setActiveTab("PROFILE")}
            >
              Hồ sơ
            </button>
            <button
              className={`sidebar-nav-btn ${activeTab === "ADDRESS" ? "active" : ""}`}
              onClick={() => setActiveTab("ADDRESS")}
            >
              Số địa chỉ
            </button>
            <button
              className={`sidebar-nav-btn ${activeTab === "PASSWORD" ? "active" : ""}`}
              onClick={() => setActiveTab("PASSWORD")}
            >
              Đổi mật khẩu
            </button>
            <Link to="/my-orders" className="sidebar-nav-link">
              Đơn hàng của tôi
            </Link>
            <button
              className={`sidebar-nav-btn ${activeTab === "AI_HISTORY" ? "active" : ""}`}
              onClick={() => setActiveTab("AI_HISTORY")}
            >
              Lịch sử kiểm tra AI
            </button>
            <button
              className={`sidebar-nav-btn ${activeTab === "SELLER_REGISTER" ? "active" : ""}`}
              onClick={() => setActiveTab("SELLER_REGISTER")}
            >
              Đăng ký bán hàng
            </button>
            
            <div className="sidebar-divider"></div>
            
            <button className="sidebar-nav-btn btn-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="account-main-content">
          {/* PROFILE TAB */}
          {activeTab === "PROFILE" && (
            <div className="panel-box">
              <h2 className="panel-title">Hồ sơ cá nhân</h2>
              
              <div className="profile-avatar-section">
                <div className="user-avatar-placeholder lg">
                  <div className="cross-line"></div>
                  <div className="cross-line cross-line-2"></div>
                </div>
                <button className="btn-outline-small">Đổi ảnh đại diện</button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input type="text" className="form-input" defaultValue={mockUser.fullName} />
                </div>
                <div className="form-group">
                  <label>Email (không đổi được)</label>
                  <input type="email" className="form-input" defaultValue={mockUser.email} disabled />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" className="form-input" defaultValue={mockUser.phone} />
                </div>
                <div className="form-group">
                  <label>Đăng nhập bằng</label>
                  <input type="text" className="form-input" defaultValue="Email & mật khẩu" disabled />
                </div>
              </div>

              <div className="panel-actions">
                <button className="btn-solid-dark">Lưu thay đổi</button>
              </div>
            </div>
          )}

          {/* ADDRESS TAB */}
          {activeTab === "ADDRESS" && (
            <div className="panel-box">
              <div className="panel-header-row">
                <h2 className="panel-title mb-0">Sổ địa chỉ</h2>
                <button className="btn-outline-small">+ Thêm địa chỉ</button>
              </div>

              <div className="address-list">
                <div className="address-card">
                  <div className="addr-header">
                    <span className="addr-name">{mockUser.fullName}</span>
                    <span className="addr-badge">Mặc định</span>
                  </div>
                  <p className="addr-text">
                    0912 345 678 &middot; Số 12, ngõ 45 Nguyễn Chí Thanh, Láng Thượng, Đống Đa, Hà Nội
                  </p>
                  <div className="addr-actions">
                    <button className="btn-text">Sửa</button>
                    <button className="btn-text btn-text-danger">Xoá</button>
                  </div>
                </div>

                <div className="address-card">
                  <div className="addr-header">
                    <span className="addr-name">{mockUser.fullName}</span>
                  </div>
                  <p className="addr-text">
                    0912 345 678 &middot; Số 8 Trần Thái Tông, Dịch Vọng, Cầu Giấy, Hà Nội (công ty)
                  </p>
                  <div className="addr-actions">
                    <button className="btn-text">Sửa</button>
                    <button className="btn-text">Đặt mặc định</button>
                    <button className="btn-text btn-text-danger">Xoá</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSWORD TAB */}
          {activeTab === "PASSWORD" && (
            <div className="panel-box">
              <h2 className="panel-title">Đổi mật khẩu</h2>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input type="password" className="form-input" defaultValue="********" />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input type="password" className="form-input" placeholder="Tối thiểu 8 ký tự" />
                </div>
                <div className="form-group">
                  <label>Nhập lại</label>
                  <input type="password" className="form-input" />
                </div>
              </div>

              <div className="panel-actions">
                <button className="btn-outline-dark">Cập nhật mật khẩu</button>
              </div>
              <p className="panel-note">Tài khoản đăng nhập bằng Google không có mục này.</p>
            </div>
          )}

          {/* SELLER REGISTER TAB */}
          {activeTab === "SELLER_REGISTER" && (
            <div className="panel-box">
              <h2 className="panel-title">Đăng ký bán hàng</h2>
              <p className="panel-desc">Sau khi gửi, admin sẽ xác minh trong 1–2 ngày. Khi được duyệt, tài khoản của bạn có thêm "Kênh người bán".</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên shop</label>
                  <input type="text" className="form-input" />
                </div>
                <div className="form-group">
                  <label>Tỉnh / thành</label>
                  <select className="form-input">
                    <option></option>
                    <option>Hà Nội</option>
                    <option>Hồ Chí Minh</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Địa chỉ lấy hàng</label>
                  <input type="text" className="form-input" />
                </div>
                <div className="form-group">
                  <label>SDT shop</label>
                  <input type="text" className="form-input" />
                </div>
                <div className="form-group full-width">
                  <label>Giới thiệu shop</label>
                  <textarea className="form-input" rows="4" placeholder="Bạn trồng / bán những gì, ở đâu..."></textarea>
                </div>
              </div>

              <div className="panel-actions">
                <button className="btn-solid-dark">Gửi yêu cầu</button>
              </div>
            </div>
          )}

          {/* AI HISTORY TAB (Placeholder) */}
          {activeTab === "AI_HISTORY" && (
            <div className="panel-box">
              <h2 className="panel-title">Lịch sử kiểm tra AI</h2>
              <div className="empty-state">Chưa có lịch sử kiểm tra.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
