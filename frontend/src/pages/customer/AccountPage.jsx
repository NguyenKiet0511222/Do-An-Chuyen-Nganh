import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  addressApi,
  sellerApi,
  userProfileApi,
  authApi,
  aiApi,
  resolveAssetUrl
} from "../../services/api";
import {
  ALL_PROVINCES,
  getDistrictsByProvince,
  getWardsByDistrict
} from "../../data/vietnamAddressData";
import {
  User,
  Camera,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Sparkles,
  Store,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  History,
  ShoppingBag
} from "lucide-react";
import { formatDateTime, apiErrorMessage } from "../../utils/format";
import "./AccountPage.css";

export default function AccountPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("PROFILE");

  // Hồ sơ cá nhân
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Đổi mật khẩu
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Địa chỉ
  const [addresses, setAddresses] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressMsg, setAddressMsg] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrForm, setAddrForm] = useState({
    receiverName: "",
    phone: "",
    province: "Hà Nội",
    district: "Đống Đa",
    ward: "Láng Thượng",
    street: "",
    isDefault: false
  });

  // Lịch sử kiểm tra AI
  const [aiHistory, setAiHistory] = useState([]);
  const [loadingAiHistory, setLoadingAiHistory] = useState(false);

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

  // Tải thông tin hồ sơ mới nhất từ backend khi vào trang
  useEffect(() => {
    let ignore = false;
    userProfileApi
      .get()
      .then((data) => {
        if (!ignore && data) {
          updateUser(data);
          setProfileForm({
            fullName: data.fullName || "",
            phone: data.phone || ""
          });
        }
      })
      .catch((err) => {
        console.warn("Không thể tải thông tin hồ sơ mới nhất:", err);
      });
    return () => {
      ignore = true;
    };
  }, [updateUser]);

  const loadAddresses = useCallback(async () => {
    try {
      setLoadingAddress(true);
      const list = await addressApi.listMine();
      setAddresses(list || []);
    } catch (err) {
      console.warn("Lỗi khi tải địa chỉ:", err);
    } finally {
      setLoadingAddress(false);
    }
  }, []);

  const loadAiHistory = useCallback(async () => {
    try {
      setLoadingAiHistory(true);
      const res = await aiApi.getHistory({ page: 0, size: 20 });
      setAiHistory(res?.content || []);
    } catch (err) {
      console.warn("Lỗi khi tải lịch sử AI:", err);
    } finally {
      setLoadingAiHistory(false);
    }
  }, []);

  // Tải dữ liệu tương ứng khi đổi tab
  useEffect(() => {
    if (activeTab === "ADDRESS") {
      loadAddresses();
    } else if (activeTab === "AI_HISTORY") {
      loadAiHistory();
    }
  }, [activeTab, loadAddresses, loadAiHistory]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Cập nhật hồ sơ
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const cleanName = profileForm.fullName.trim();
    const cleanPhone = profileForm.phone.trim();

    if (!cleanName || cleanName.length < 2) {
      setProfileMsg({ type: "error", text: "Họ và tên phải có ít nhất 2 ký tự!" });
      return;
    }
    if (cleanPhone && !/^\d{9,11}$/.test(cleanPhone)) {
      setProfileMsg({ type: "error", text: "Số điện thoại phải gồm 9 đến 11 chữ số!" });
      return;
    }

    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const updated = await userProfileApi.update({
        fullName: cleanName,
        phone: cleanPhone || null
      });
      updateUser(updated);
      setProfileMsg({ type: "success", text: "Đã cập nhật thông tin hồ sơ thành công!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: apiErrorMessage(err, "Không thể cập nhật hồ sơ") });
    } finally {
      setProfileLoading(false);
    }
  };

  // Đổi ảnh đại diện
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: "error", text: "Kích thước ảnh đại diện không được vượt quá 5MB!" });
      return;
    }

    try {
      setAvatarUploading(true);
      const res = await userProfileApi.updateAvatar(file);
      updateUser({ avatarUrl: res.avatarUrl });
      setProfileMsg({ type: "success", text: "Đã cập nhật ảnh đại diện mới thành công!" });
    } catch (err) {
      setProfileMsg({ type: "error", text: apiErrorMessage(err, "Không thể tải lên ảnh đại diện") });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "Mật khẩu xác nhận không khớp!" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự!" });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      setPasswordMsg({
        type: "success",
        text: "Đã đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo."
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: apiErrorMessage(err, "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.")
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Sổ địa chỉ
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
    setAddressMsg(null);
  };

  const handleOpenEditAddr = (addr) => {
    setAddrForm({
      receiverName: addr.receiverName || "",
      phone: addr.phone || "",
      province: addr.province || "Hà Nội",
      district: addr.district || "Đống Đa",
      ward: addr.ward || "",
      street: addr.street || "",
      isDefault: Boolean(addr.isDefault)
    });
    setEditingAddressId(addr.id);
    setAddressMsg(null);
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
    if (!/^\d{9,11}$/.test(addrForm.phone.trim())) {
      setAddressMsg({ type: "error", text: "Số điện thoại người nhận phải gồm 9 đến 11 chữ số!" });
      return;
    }

    try {
      if (editingAddressId === "NEW") {
        await addressApi.create(addrForm);
        setAddressMsg({ type: "success", text: "Đã thêm địa chỉ giao hàng mới thành công!" });
      } else {
        await addressApi.update(editingAddressId, addrForm);
        setAddressMsg({ type: "success", text: "Đã cập nhật địa chỉ giao hàng thành công!" });
      }
      setEditingAddressId(null);
      loadAddresses();
    } catch (err) {
      setAddressMsg({ type: "error", text: apiErrorMessage(err, "Không thể lưu địa chỉ") });
    }
  };

  const handleDeleteAddr = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá địa chỉ giao hàng này?")) return;
    try {
      await addressApi.delete(id);
      setAddressMsg({ type: "success", text: "Đã xoá địa chỉ giao hàng thành công!" });
      loadAddresses();
    } catch (err) {
      setAddressMsg({ type: "error", text: apiErrorMessage(err, "Không thể xoá địa chỉ") });
    }
  };

  const handleSetDefaultAddr = async (id) => {
    try {
      await addressApi.setDefault(id);
      setAddressMsg({ type: "success", text: "Đã đặt làm địa chỉ mặc định thành công!" });
      loadAddresses();
    } catch (err) {
      setAddressMsg({ type: "error", text: apiErrorMessage(err, "Không thể đặt làm mặc định") });
    }
  };

  // Đăng ký bán hàng
  const handleSellerRegister = async (e) => {
    e.preventDefault();
    if (!/^\d{9,11}$/.test(sellerForm.phone.trim())) {
      setSellerMsg({ type: "error", text: "Số điện thoại nhà vườn phải gồm 9 đến 11 chữ số!" });
      return;
    }

    setSellerSubmitting(true);
    setSellerMsg(null);
    try {
      await sellerApi.register(sellerForm);
      setSellerMsg({
        type: "success",
        text: "Gửi đăng ký mở shop thành công! Ban quản trị sẽ xác minh trong vòng 24h làm việc."
      });
      // Tải lại hồ sơ để cập nhật shopId / shopStatus
      const freshUser = await userProfileApi.get();
      if (freshUser) updateUser(freshUser);
    } catch (err) {
      setSellerMsg({
        type: "error",
        text: apiErrorMessage(err, "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.")
      });
    } finally {
      setSellerSubmitting(false);
    }
  };

  const availableDistricts = getDistrictsByProvince(addrForm.province);
  const availableWards = getWardsByDistrict(addrForm.province, addrForm.district);
  const avatarUrl = resolveAssetUrl(user?.avatarUrl);

  const getAiBadgeClass = (label) => {
    switch (label) {
      case "FRESH":
        return "ai-badge-fresh";
      case "ROTTEN":
        return "ai-badge-rotten";
      default:
        return "ai-badge-uncertain";
    }
  };

  const getAiBadgeLabel = (label) => {
    switch (label) {
      case "FRESH":
        return "Tươi sạch";
      case "ROTTEN":
        return "Hư hỏng";
      default:
        return "Chưa rõ";
    }
  };

  return (
    <div className="account-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Tài khoản cá nhân</span>
      </div>

      <div className="account-layout">
        {/* Sidebar Nav */}
        <aside className="account-sidebar">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar-wrap">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.fullName || "Khách hàng"}
                  className="sidebar-avatar-img"
                />
              ) : (
                <div className="sidebar-avatar-fallback">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <button
                type="button"
                className="sidebar-avatar-btn"
                onClick={() => avatarInputRef.current?.click()}
                title="Đổi ảnh đại diện"
                disabled={avatarUploading}
              >
                <Camera size={12} />
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                style={{ display: "none" }}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
              />
            </div>
            <div className="user-text-info">
              <h3 className="user-fullname">{user?.fullName || "Khách hàng"}</h3>
              <p className="user-email">{user?.email}</p>
              {user?.accountTier === "PREMIUM" && (
                <span className="badge-premium-tier">Premium VIP</span>
              )}
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "PROFILE" ? "active" : ""}`}
              onClick={() => setActiveTab("PROFILE")}
            >
              <User size={17} />
              <span>Hồ sơ cá nhân</span>
            </button>
            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "PASSWORD" ? "active" : ""}`}
              onClick={() => setActiveTab("PASSWORD")}
            >
              <KeyRound size={17} />
              <span>Đổi mật khẩu</span>
            </button>
            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "ADDRESS" ? "active" : ""}`}
              onClick={() => setActiveTab("ADDRESS")}
            >
              <MapPin size={17} />
              <span>Sổ địa chỉ</span>
            </button>
            <Link to="/my-orders" className="sidebar-nav-link">
              <ShoppingBag size={17} />
              <span>Đơn hàng của tôi</span>
            </Link>
            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "AI_HISTORY" ? "active" : ""}`}
              onClick={() => setActiveTab("AI_HISTORY")}
            >
              <History size={17} />
              <span>Lịch sử kiểm tra AI</span>
            </button>
            <button
              type="button"
              className={`sidebar-nav-btn ${activeTab === "SELLER_REGISTER" ? "active" : ""}`}
              onClick={() => setActiveTab("SELLER_REGISTER")}
            >
              <Store size={17} />
              <span>Đăng ký bán hàng</span>
            </button>

            <div className="sidebar-divider"></div>

            <button type="button" className="sidebar-nav-btn btn-logout" onClick={handleLogout}>
              <LogOut size={17} />
              <span>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="account-main-content">
          {/* PROFILE TAB */}
          {activeTab === "PROFILE" && (
            <div className="panel-box">
              <h2 className="panel-title">Hồ sơ cá nhân</h2>
              <p className="panel-desc">
                Quản lý thông tin hồ sơ của bạn để bảo mật tài khoản và thuận tiện mua sắm trên sàn.
              </p>

              {profileMsg && (
                <div className={`account-alert account-alert-${profileMsg.type}`}>
                  {profileMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Avatar Section */}
              <div className="profile-avatar-section">
                <div className="profile-avatar-wrap">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.fullName || "Khách hàng"}
                      className="profile-avatar-img"
                    />
                  ) : (
                    <div className="profile-avatar-fallback">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <div className="profile-avatar-meta">
                  <span className="profile-avatar-meta-name">{user?.fullName || "Khách hàng"}</span>
                  <div className="profile-avatar-actions">
                    <button
                      type="button"
                      className="btn-outline-small"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                    >
                      {avatarUploading ? "Đang tải ảnh..." : "Đổi ảnh đại diện"}
                    </button>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      JPG, PNG hoặc WEBP (tối đa 5MB)
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Nhập họ và tên"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="VD: 0912345678"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                    <span className="form-hint">Để trống hoặc nhập 9–11 chữ số</span>
                  </div>

                  <div className="form-group">
                    <label>Email tài khoản (không thể thay đổi)</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ""}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label>Hình thức đăng nhập</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user?.provider === "GOOGLE" ? "Google OAuth" : "Email & mật khẩu"}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label>Cấp độ tài khoản</label>
                    <input
                      type="text"
                      className="form-input"
                      value={user?.accountTier === "PREMIUM" ? "Premium VIP (Mở khoá AI Check)" : "Tiêu chuẩn (Standard)"}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label>Vai trò hệ thống</label>
                    <input
                      type="text"
                      className="form-input"
                      value={
                        user?.role === "SELLER"
                          ? "Người bán hàng (Seller)"
                          : user?.role === "ADMIN"
                          ? "Quản trị viên (Admin)"
                          : "Khách hàng (Customer)"
                      }
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="panel-actions" style={{ marginTop: "12px" }}>
                  <button type="submit" className="btn-solid-dark" disabled={profileLoading}>
                    {profileLoading ? "Đang lưu thay đổi..." : "Lưu thay đổi hồ sơ"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASSWORD TAB */}
          {activeTab === "PASSWORD" && (
            <div className="panel-box">
              <h2 className="panel-title">Đổi mật khẩu tài khoản</h2>
              <p className="panel-desc">
                Cập nhật mật khẩu định kỳ giúp tài khoản của bạn được an toàn trước các rủi ro bảo mật.
              </p>

              {passwordMsg && (
                <div className={`account-alert account-alert-${passwordMsg.type}`}>
                  {passwordMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              {user?.provider === "GOOGLE" ? (
                <div className="account-alert account-alert-info" style={{ padding: "20px" }}>
                  <ShieldCheck size={26} color="#0284c7" />
                  <div>
                    <strong>Tài khoản đăng nhập qua Google</strong>
                    <p style={{ margin: "4px 0 0", color: "#0369a1" }}>
                      Tài khoản của bạn được liên kết và xác thực an toàn qua <strong>Google OAuth</strong>.
                      Hệ thống không lưu trữ mật khẩu riêng cho tài khoản này.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword}>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Mật khẩu hiện tại *</label>
                      <input
                        type="password"
                        className="form-input"
                        required
                        placeholder="Nhập mật khẩu đang sử dụng"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mật khẩu mới *</label>
                      <input
                        type="password"
                        className="form-input"
                        required
                        placeholder="Tối thiểu 6 ký tự"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Xác nhận mật khẩu mới *</label>
                      <input
                        type="password"
                        className="form-input"
                        required
                        placeholder="Nhập lại mật khẩu mới"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="panel-actions" style={{ marginTop: "12px" }}>
                    <button type="submit" className="btn-solid-dark" disabled={passwordLoading}>
                      {passwordLoading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ADDRESS TAB */}
          {activeTab === "ADDRESS" && (
            <div className="panel-box">
              <div className="panel-header-row">
                <div>
                  <h2 className="panel-title mb-0">Sổ địa chỉ giao hàng</h2>
                  <p className="panel-desc" style={{ margin: "4px 0 0" }}>
                    Địa chỉ mặc định sẽ được tự động chọn khi bạn đặt hàng nông sản.
                  </p>
                </div>
                {!editingAddressId && (
                  <button
                    className="btn-solid-primary"
                    onClick={handleOpenNewAddr}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px" }}
                  >
                    <Plus size={16} /> Thêm địa chỉ mới
                  </button>
                )}
              </div>

              {addressMsg && (
                <div className={`account-alert account-alert-${addressMsg.type}`}>
                  {addressMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{addressMsg.text}</span>
                </div>
              )}

              {/* Form thêm/sửa địa chỉ */}
              {editingAddressId && (
                <form
                  onSubmit={handleSaveAddr}
                  style={{
                    background: "#f8fafc",
                    padding: "22px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    marginBottom: "24px"
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 18px", color: "#0f172a" }}>
                    {editingAddressId === "NEW" ? "Thêm địa chỉ giao hàng mới" : "Chỉnh sửa địa chỉ giao hàng"}
                  </h3>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Họ và tên người nhận *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="VD: Nguyễn Văn A"
                        value={addrForm.receiverName}
                        onChange={(e) => setAddrForm({ ...addrForm, receiverName: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Số điện thoại nhận hàng *</label>
                      <input
                        type="tel"
                        className="form-input"
                        required
                        placeholder="VD: 0912345678 (9-11 chữ số)"
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
                      <label>Địa chỉ cụ thể (Số nhà, tên đường) *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="VD: Số 12, ngõ 45"
                        value={addrForm.street}
                        onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                      />
                    </div>

                    <div className="form-group full-width" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        id="isDefaultCheck"
                        checked={addrForm.isDefault}
                        onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <label htmlFor="isDefaultCheck" style={{ margin: 0, cursor: "pointer", fontWeight: 500 }}>
                        Đặt làm địa chỉ nhận hàng mặc định
                      </label>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                    <button type="submit" className="btn-solid-primary" style={{ padding: "8px 20px" }}>
                      Lưu địa chỉ
                    </button>
                    <button
                      type="button"
                      className="btn-outline-small"
                      onClick={() => setEditingAddressId(null)}
                    >
                      Huỷ bỏ
                    </button>
                  </div>
                </form>
              )}

              {/* Danh sách địa chỉ */}
              {loadingAddress ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                  Đang tải danh sách địa chỉ...
                </div>
              ) : addresses.length === 0 ? (
                <div className="empty-state">
                  <MapPin size={36} color="#94a3b8" />
                  <p>Bạn chưa lưu địa chỉ giao hàng nào.</p>
                  <button className="btn-solid-primary" onClick={handleOpenNewAddr}>
                    + Thêm địa chỉ đầu tiên
                  </button>
                </div>
              ) : (
                <div className="address-list">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="address-card">
                      <div className="addr-header">
                        <div className="addr-name-phone">
                          <strong className="addr-name">{addr.receiverName}</strong>
                          <span className="addr-phone">{addr.phone}</span>
                        </div>
                        {addr.isDefault && (
                          <span className="addr-badge">Mặc định</span>
                        )}
                      </div>
                      <p className="addr-text">
                        {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(", ")}
                      </p>
                      <div className="addr-actions">
                        <button
                          type="button"
                          className="btn-text"
                          onClick={() => handleOpenEditAddr(addr)}
                          style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Edit2 size={14} /> Sửa
                        </button>
                        {!addr.isDefault && (
                          <button
                            type="button"
                            className="btn-text"
                            onClick={() => handleSetDefaultAddr(addr.id)}
                          >
                            Đặt làm mặc định
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-text btn-text-danger"
                          onClick={() => handleDeleteAddr(addr.id)}
                          style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Trash2 size={14} /> Xoá
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI HISTORY TAB */}
          {activeTab === "AI_HISTORY" && (
            <div className="panel-box">
              <div className="panel-header-row">
                <div>
                  <h2 className="panel-title mb-0">Lịch sử kiểm tra AI độ tươi nông sản</h2>
                  <p className="panel-desc" style={{ margin: "4px 0 0" }}>
                    Xem lại các kết quả kiểm tra chất lượng bằng mô hình AI Freshness gần đây.
                  </p>
                </div>
                <Link
                  to="/ai-check"
                  className="btn-solid-primary"
                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px" }}
                >
                  <Sparkles size={16} /> Kiểm tra ảnh mới
                </Link>
              </div>

              {loadingAiHistory ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                  Đang tải lịch sử kiểm định...
                </div>
              ) : aiHistory.length === 0 ? (
                <div className="empty-state">
                  <Sparkles size={36} color="#94a3b8" />
                  <p>Bạn chưa có lượt kiểm tra AI nào được ghi nhận.</p>
                  <Link to="/ai-check" className="btn-solid-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                    Chụp ảnh – Kiểm tra độ tươi ngay
                  </Link>
                </div>
              ) : (
                <div className="ai-history-list">
                  {aiHistory.map((item) => {
                    const thumbUrl = resolveAssetUrl(item.imageUrl);
                    return (
                      <div key={item.id} className="ai-history-card">
                        <div className="ai-history-left">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt={item.produce || "Nông sản"} className="ai-thumb" />
                          ) : (
                            <div className="ai-thumb-placeholder">
                              <Sparkles size={20} />
                            </div>
                          )}
                          <div>
                            <div className="ai-meta-produce">{item.produce || "Nông sản"}</div>
                            <div className="ai-meta-time">
                              {formatDateTime(item.createdAt)} &middot; Mô hình: {item.modelVersion || "MobileNetV2"} ({item.inferenceMs || 0}ms)
                            </div>
                          </div>
                        </div>

                        <div className="ai-history-right">
                          <span className={`ai-badge ${getAiBadgeClass(item.label)}`}>
                            {getAiBadgeLabel(item.label)}
                          </span>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                            {item.confidence ? `${(Number(item.confidence) * 100).toFixed(1)}%` : "-"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SELLER REGISTER TAB */}
          {activeTab === "SELLER_REGISTER" && (
            <div className="panel-box">
              <h2 className="panel-title">Đăng ký bán hàng nông sản</h2>
              <p className="panel-desc">
                Trở thành đối tác nhà vườn trên sàn AgriFresh để tiếp cận hàng triệu khách hàng và giới thiệu nông sản sạch của bạn.
              </p>

              {user?.shopId ? (
                <div
                  style={{
                    padding: "24px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    color: "#166534"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "17px", fontWeight: 700 }}>
                    <CheckCircle2 size={22} color="#16a34a" />
                    <span>Tài khoản của bạn đã có cửa hàng trên hệ thống!</span>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "14px", lineHeight: 1.6 }}>
                    Mã cửa hàng: <strong>#{user.shopId}</strong> &middot; Trạng thái gian hàng:{" "}
                    <strong>
                      {user.shopStatus === "ACTIVE"
                        ? "Đang hoạt động"
                        : user.shopStatus === "PENDING_VERIFICATION"
                        ? "Đang chờ admin xác minh"
                        : user.shopStatus === "LOCKED"
                        ? "Đang bị tạm khoá"
                        : user.shopStatus || "PENDING"}
                    </strong>
                  </div>
                  {user.role === "SELLER" && (
                    <div style={{ marginTop: "16px" }}>
                      <Link
                        to="/seller"
                        className="btn-solid-primary"
                        style={{ textDecoration: "none", display: "inline-block" }}
                      >
                        Truy cập Kênh quản lý người bán
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {sellerMsg && (
                    <div className={`account-alert account-alert-${sellerMsg.type}`}>
                      {sellerMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      <span>{sellerMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSellerRegister}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tên nhà vườn / Cửa hàng *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          placeholder="VD: Nông trại Xanh Đà Lạt"
                          value={sellerForm.shopName}
                          onChange={(e) => setSellerForm({ ...sellerForm, shopName: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Tỉnh / Thành phố *</label>
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
                        <label>Địa chỉ nhà vườn / Kho lấy hàng *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          placeholder="VD: Thôn 3, Xã Đạ Sar, Huyện Lạc Dương"
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
                          placeholder="VD: 0912345678 (9-11 chữ số)"
                          value={sellerForm.phone}
                          onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="form-group full-width">
                        <label>Giới thiệu nông trại / Nông sản chủ lực</label>
                        <textarea
                          className="form-input"
                          rows="4"
                          placeholder="Mô tả các loại trái cây, rau củ đặc sản, chứng chỉ tiêu chuẩn canh tác (VietGAP, GlobalGAP, Organic)..."
                          value={sellerForm.description}
                          onChange={(e) => setSellerForm({ ...sellerForm, description: e.target.value })}
                        ></textarea>
                      </div>
                    </div>

                    <div className="panel-actions" style={{ marginTop: "16px" }}>
                      <button type="submit" className="btn-solid-primary" disabled={sellerSubmitting}>
                        {sellerSubmitting ? "Đang gửi hồ sơ đăng ký..." : "Gửi yêu cầu đăng ký người bán"}
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
