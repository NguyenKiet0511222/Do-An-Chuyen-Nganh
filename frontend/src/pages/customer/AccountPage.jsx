import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { addressApi, sellerApi } from "../../services/api";
import { ALL_PROVINCES, getDistrictsByProvince, getWardsByDistrict } from "../../data/vietnamAddressData";
import { Plus, Edit2, Trash2 } from "lucide-react";
import "./AccountPage.css";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("PROFILE");

  // Địa chỉ
  const [addresses, setAddresses] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // null = đóng, 'NEW' = tạo mới, hoặc id = sửa
  const [addrForm, setAddrForm] = useState({
    receiverName: "",
    phone: "",
    province: "Hà Nội",
    district: "Đống Đa",
    ward: "Láng Thượng",
    street: "",
    isDefault: false
  });

  // Đăng ký bán hàng
  const [sellerForm, setSellerForm] = useState({
    shopName: "",
    province: "Lâm Đồng",
    address: "",
    phone: "",
    description: ""
  });
  const [sellerSubmitting, setSellerSubmitting] = useState(false);
  const [sellerMsg, setSellerMsg] = useState(null);

  const loadAddresses = async () => {
    try {
      setLoadingAddress(true);
      const list = await addressApi.listMine();
      setAddresses(list || []);
    } catch (err) {
      console.warn("Lỗi khi tải địa chỉ:", err);
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ADDRESS") {
      loadAddresses();
    }
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleOpenNewAddr = () => {
    setAddrForm({
      receiverName: user?.fullName || "",
      phone: user?.phone || "",
      province: "Hà Nội",
      district: "Đống Đa",
      ward: "Láng Thượng",
      street: "",
      isDefault: addresses.length === 0
    });
    setEditingAddressId("NEW");
  };

  const handleOpenEditAddr = (addr) => {
    setAddrForm({
      receiverName: addr.receiverName,
      phone: addr.phone,
      province: addr.province || "Hà Nội",
      district: addr.district || "Đống Đa",
      ward: addr.ward || "",
      street: addr.street,
      isDefault: addr.isDefault
    });
    setEditingAddressId(addr.id);
  };

  const handleAddrProvinceChange = (e) => {
    const province = e.target.value;
    const districts = getDistrictsByProvince(province);
    const firstDistrict = districts[0] || "";
    const wards = getWardsByDistrict(province, firstDistrict);
    const firstWard = wards[0] || "";

    setAddrForm((prev) => ({
      ...prev,
      province,
      district: firstDistrict,
      ward: firstWard
    }));
  };

  const handleAddrDistrictChange = (e) => {
    const district = e.target.value;
    const wards = getWardsByDistrict(addrForm.province, district);
    const firstWard = wards[0] || "";

    setAddrForm((prev) => ({
      ...prev,
      district,
      ward: firstWard
    }));
  };

  const handleSaveAddr = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId === "NEW") {
        await addressApi.create(addrForm);
      } else {
        await addressApi.update(editingAddressId, addrForm);
      }
      setEditingAddressId(null);
      await loadAddresses();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi lưu địa chỉ";
      alert(msg);
    }
  };

  const handleDeleteAddr = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá địa chỉ này?")) return;
    try {
      await addressApi.delete(id);
      await loadAddresses();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi xoá địa chỉ";
      alert(msg);
    }
  };

  const handleSetDefaultAddr = async (id) => {
    try {
      await addressApi.setDefault(id);
      await loadAddresses();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi đặt mặc định";
      alert(msg);
    }
  };

  const handleSellerRegister = async (e) => {
    e.preventDefault();
    setSellerSubmitting(true);
    setSellerMsg(null);
    try {
      await sellerApi.register(sellerForm);
      setSellerMsg({
        type: "success",
        text: "Gửi đăng ký bán hàng thành công! Đang chờ Admin xác minh."
      });
    } catch (err) {
      setSellerMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Đăng ký không thành công"
      });
    } finally {
      setSellerSubmitting(false);
    }
  };

  const availableDistricts = getDistrictsByProvince(addrForm.province);
  const availableWards = getWardsByDistrict(addrForm.province, addrForm.district);

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
              <h3 className="user-fullname">{user?.fullName || "Khách hàng"}</h3>
              <p className="user-email">{user?.email || ""}</p>
              {user?.accountTier === "PREMIUM" && (
                <span style={{ fontSize: "11px", background: "#fef3c7", color: "#b45309", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, display: "inline-block", marginTop: "4px" }}>
                  ⭐ Tài khoản Premium
                </span>
              )}
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
              Sổ địa chỉ
            </button>
            <Link to="/my-orders" className="sidebar-nav-link" style={{ textDecoration: "none", display: "block" }}>
              Đơn hàng của tôi
            </Link>
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

              <div className="form-grid">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input type="text" className="form-input" defaultValue={user?.fullName || ""} disabled />
                </div>
                <div className="form-group">
                  <label>Email (Định danh tài khoản)</label>
                  <input type="email" className="form-input" defaultValue={user?.email || ""} disabled />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input type="text" className="form-input" defaultValue={user?.phone || "Chưa cập nhật"} disabled />
                </div>
                <div className="form-group">
                  <label>Hình thức đăng nhập</label>
                  <input type="text" className="form-input" defaultValue={user?.provider === "GOOGLE" ? "Google OAuth" : "Email & mật khẩu"} disabled />
                </div>
                <div className="form-group">
                  <label>Cấp độ tài khoản</label>
                  <input type="text" className="form-input" defaultValue={user?.accountTier === "PREMIUM" ? "Premium (Mở khoá AI Check)" : "Tiêu chuẩn (Standard)"} disabled />
                </div>
                <div className="form-group">
                  <label>Vai trò</label>
                  <input type="text" className="form-input" defaultValue={user?.role || "CUSTOMER"} disabled />
                </div>
              </div>
            </div>
          )}

          {/* ADDRESS TAB */}
          {activeTab === "ADDRESS" && (
            <div className="panel-box">
              <div className="panel-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 className="panel-title mb-0" style={{ margin: 0 }}>Sổ địa chỉ giao hàng</h2>
                {!editingAddressId && (
                  <button className="btn-outline-small" onClick={handleOpenNewAddr} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Plus size={16} /> Thêm địa chỉ mới
                  </button>
                )}
              </div>

              {/* Form thêm/sửa địa chỉ */}
              {editingAddressId && (
                <form onSubmit={handleSaveAddr} style={{ background: "#f9fafb", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>
                    {editingAddressId === "NEW" ? "Thêm địa chỉ mới" : "Chỉnh sửa địa chỉ"}
                  </h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Họ tên người nhận *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        value={addrForm.receiverName}
                        onChange={(e) => setAddrForm({ ...addrForm, receiverName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Số điện thoại *</label>
                      <input
                        type="tel"
                        className="form-input"
                        required
                        value={addrForm.phone}
                        onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tỉnh / Thành phố *</label>
                      <select
                        className="form-input"
                        value={addrForm.province}
                        onChange={handleAddrProvinceChange}
                      >
                        {ALL_PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Quận / Huyện *</label>
                      <select
                        className="form-input"
                        value={addrForm.district}
                        onChange={handleAddrDistrictChange}
                      >
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phường / Xã *</label>
                      <select
                        className="form-input"
                        value={addrForm.ward}
                        onChange={(e) => setAddrForm({ ...addrForm, ward: e.target.value })}
                      >
                        {availableWards.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Địa chỉ cụ thể (Số nhà, đường) *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        value={addrForm.street}
                        onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                      />
                    </div>
                    <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        id="isDefaultCheck"
                        checked={addrForm.isDefault}
                        onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                      />
                      <label htmlFor="isDefaultCheck" style={{ margin: 0, cursor: "pointer" }}>
                        Đặt làm địa chỉ mặc định
                      </label>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                    <button type="submit" className="btn-solid-dark" style={{ padding: "8px 20px" }}>
                      Lưu địa chỉ
                    </button>
                    <button type="button" className="btn-outline-small" onClick={() => setEditingAddressId(null)}>
                      Huỷ bỏ
                    </button>
                  </div>
                </form>
              )}

              {/* Danh sách địa chỉ */}
              {loadingAddress ? (
                <p>Đang tải danh sách địa chỉ...</p>
              ) : addresses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
                  Chưa có địa chỉ nào được lưu. Bấm "Thêm địa chỉ mới" để thêm.
                </div>
              ) : (
                <div className="address-list">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="address-card" style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "12px", background: "#fff" }}>
                      <div className="addr-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ fontSize: "15px" }}>{addr.receiverName}</strong>
                          <span style={{ color: "#6b7280", marginLeft: "10px" }}>{addr.phone}</span>
                        </div>
                        {addr.isDefault && (
                          <span className="addr-badge" style={{ background: "#ecfdf5", color: "#16a34a", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="addr-text" style={{ color: "#4b5563", margin: "8px 0 12px" }}>
                        {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(", ")}
                      </p>
                      <div className="addr-actions" style={{ display: "flex", gap: "12px" }}>
                        <button className="btn-text" onClick={() => handleOpenEditAddr(addr)} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Edit2 size={14} /> Sửa
                        </button>
                        {!addr.isDefault && (
                          <button className="btn-text" onClick={() => handleSetDefaultAddr(addr.id)}>
                            Đặt làm mặc định
                          </button>
                        )}
                        <button className="btn-text btn-text-danger" onClick={() => handleDeleteAddr(addr.id)} style={{ display: "flex", alignItems: "center", gap: "4px", color: "#dc2626" }}>
                          <Trash2 size={14} /> Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SELLER REGISTER TAB */}
          {activeTab === "SELLER_REGISTER" && (
            <div className="panel-box">
              <h2 className="panel-title">Đăng ký bán hàng nông sản</h2>
              <p className="panel-desc">
                Trở thành đối tác người bán trên sàn AgriFresh. Sau khi gửi, ban quản trị sẽ duyệt thông tin của bạn.
              </p>

              {user?.shopId ? (
                <div style={{ padding: "20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#15803d" }}>
                  <strong>Bạn đã có shop trên hệ thống!</strong>
                  <div style={{ marginTop: "8px" }}>
                    Trạng thái shop: <strong>{user.shopStatus || "PENDING_VERIFICATION"}</strong>
                  </div>
                  {user.role === "SELLER" && (
                    <div style={{ marginTop: "12px" }}>
                      <Link to="/seller" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "underline" }}>
                        Vào kênh quản lý người bán
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {sellerMsg && (
                    <div style={{ padding: "12px 16px", borderRadius: "6px", marginBottom: "16px", background: sellerMsg.type === "success" ? "#f0fdf4" : "#fef2f2", color: sellerMsg.type === "success" ? "#15803d" : "#b91c1c" }}>
                      {sellerMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleSellerRegister}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tên nhà vườn / Shop *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={sellerForm.shopName}
                          onChange={(e) => setSellerForm({ ...sellerForm, shopName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Tỉnh / thành phố *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          placeholder="VD: Lâm Đồng, Đà Lạt..."
                          value={sellerForm.province}
                          onChange={(e) => setSellerForm({ ...sellerForm, province: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Địa chỉ nhà vườn / kho lấy hàng *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={sellerForm.address}
                          onChange={(e) => setSellerForm({ ...sellerForm, address: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Số điện thoại liên hệ *</label>
                        <input
                          type="tel"
                          className="form-input"
                          required
                          value={sellerForm.phone}
                          onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Giới thiệu nông trại / sản phẩm</label>
                        <textarea
                          className="form-input"
                          rows="4"
                          placeholder="Bạn trồng loại nông sản gì, tiêu chuẩn canh tác (VietGAP, hữu cơ...)..."
                          value={sellerForm.description}
                          onChange={(e) => setSellerForm({ ...sellerForm, description: e.target.value })}
                        ></textarea>
                      </div>
                    </div>

                    <div className="panel-actions" style={{ marginTop: "20px" }}>
                      <button type="submit" className="btn-solid-dark" disabled={sellerSubmitting}>
                        {sellerSubmitting ? "Đang gửi đăng ký..." : "Gửi yêu cầu đăng ký"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
