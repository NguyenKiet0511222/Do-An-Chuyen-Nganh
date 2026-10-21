import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/useAuth";
import { addressApi, orderApi, resolveAssetUrl } from "../../services/api";
import { handleImageError } from "../../utils/format";
import { ALL_PROVINCES, getDistrictsByProvince, getWardsByDistrict } from "../../data/vietnamAddressData";
import { MapPin, CreditCard, CheckCircle, Plus, Store, AlertCircle, X } from "lucide-react";

export default function CheckoutPage() {
  const { cart, groups, totalAmount, refreshCart } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  
  // Modal trạng thái
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [tempSelectedAddressId, setTempSelectedAddressId] = useState(null);

  const [note, setNote] = useState("");

  // Form địa chỉ mới với Dropdown chọn
  const [newAddr, setNewAddr] = useState({
    receiverName: user?.fullName || "",
    phone: user?.phone || "",
    province: "Hà Nội",
    district: "Đống Đa",
    ward: "Láng Thượng",
    street: "",
    isDefault: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorList, setErrorList] = useState([]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0);
  };

  const loadAddresses = async () => {
    try {
      const data = await addressApi.listMine();
      setAddresses(data || []);
      if (data && data.length > 0) {
        const defaultOne = data.find((a) => a.isDefault) || data[0];
        setSelectedAddressId(defaultOne.id);
        setTempSelectedAddressId(defaultOne.id);
        setIsAddingNewAddress(false);
      } else {
        setIsAddingNewAddress(true);
      }
    } catch (err) {
      console.warn("Không thể tải sổ địa chỉ:", err.message);
      setIsAddingNewAddress(true);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Xử lý thay đổi tỉnh thành -> cập nhật danh sách quận huyện
  const handleProvinceChange = (e) => {
    const province = e.target.value;
    const districts = getDistrictsByProvince(province);
    const firstDistrict = districts[0] || "";
    const wards = getWardsByDistrict(province, firstDistrict);
    const firstWard = wards[0] || "";

    setNewAddr((prev) => ({
      ...prev,
      province,
      district: firstDistrict,
      ward: firstWard
    }));
  };

  // Xử lý thay đổi quận huyện -> cập nhật danh sách phường xã
  const handleDistrictChange = (e) => {
    const district = e.target.value;
    const wards = getWardsByDistrict(newAddr.province, district);
    const firstWard = wards[0] || "";

    setNewAddr((prev) => ({
      ...prev,
      district,
      ward: firstWard
    }));
  };

  const handleAddNewAddress = async (e) => {
    e?.preventDefault();
    if (!newAddr.receiverName || !newAddr.phone || !newAddr.province || !newAddr.district || !newAddr.street) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return null;
    }
    try {
      const created = await addressApi.create(newAddr);
      await loadAddresses();
      setSelectedAddressId(created.id);
      setIsAddingNewAddress(false);
      setIsAddressModalOpen(false);
      return created.id;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Lỗi tạo địa chỉ";
      alert(msg);
      return null;
    }
  };

  const handleConfirmAddressChoice = () => {
    if (tempSelectedAddressId) {
      setSelectedAddressId(tempSelectedAddressId);
    }
    setIsAddressModalOpen(false);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setErrorMessage("");
    setErrorList([]);
    setIsSubmitting(true);

    try {
      let finalAddressId = selectedAddressId;

      // Nếu chưa có địa chỉ nào và đang nhập form mới
      if (!finalAddressId && isAddingNewAddress) {
        finalAddressId = await handleAddNewAddress();
        if (!finalAddressId) {
          setIsSubmitting(false);
          return;
        }
      }

      if (!finalAddressId) {
        alert("Vui lòng chọn hoặc thêm địa chỉ nhận hàng trước khi thanh toán.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        addressId: finalAddressId,
        note: note.trim() || undefined,
        cartItemIds: [], // Rỗng = toàn bộ giỏ
        paymentMethod: "COD"
      };

      const result = await orderApi.checkout(payload);
      setOrderSuccessData(result);
      await refreshCart();
    } catch (err) {
      console.error("Lỗi khi checkout:", err);
      const resData = err.response?.data;
      if (resData?.errors && resData.errors.length > 0) {
        setErrorList(resData.errors);
      }
      setErrorMessage(resData?.message || err.message || "Đặt hàng không thành công. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);

  if (orderSuccessData) {
    const orders = orderSuccessData.orders || [];
    return (
      <div className="checkout-success-container" style={{ maxWidth: "700px", margin: "40px auto", padding: "30px", background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", textAlign: "center" }}>
        <CheckCircle size={64} className="success-icon" color="#16a34a" style={{ margin: "0 auto 16px" }} />
        <h1 style={{ fontSize: "24px", color: "#111827", marginBottom: "8px" }}>Đặt hàng thành công!</h1>
        <p style={{ color: "#4b5563", marginBottom: "20px" }}>
          Hệ thống đã tự động tách thành <strong>{orders.length} đơn hàng</strong> tương ứng với từng nhà vườn/người bán.
        </p>

        <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "16px", marginBottom: "24px", textAlign: "left" }}>
          {orders.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
              <div>
                <strong style={{ color: "#16a34a" }}>{o.orderCode}</strong>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Shop: {o.shop?.shopName} &middot; {o.itemCount} món
                </div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 600 }}>
                {formatPrice(o.total)}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "16px", fontWeight: 700 }}>
            <span>Tổng thanh toán COD:</span>
            <span style={{ color: "#16a34a" }}>{formatPrice(orderSuccessData.grandTotal)}</span>
          </div>
        </div>

        <div className="success-actions" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link to="/" className="btn-secondary" style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #d1d5db", textDecoration: "none", color: "#374151" }}>
            Về trang chủ
          </Link>
          <Link to="/my-orders" className="btn-primary" style={{ padding: "10px 20px", borderRadius: "6px", background: "#16a34a", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
            Xem đơn hàng của tôi
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="checkout-page-container">
        <div className="empty-cart-view" style={{ textAlign: "center", padding: "60px 20px" }}>
          <h2>Giỏ hàng trống</h2>
          <p style={{ color: "#666", margin: "16px 0" }}>Bạn không có sản phẩm nào để thanh toán.</p>
          <Link to="/products" className="btn-primary">Quay lại cửa hàng</Link>
        </div>
      </div>
    );
  }

  const shopGroups = groups && groups.length > 0 ? groups : [{ shop: { id: 1, shopName: "Cửa hàng" }, items: cart, subtotal: totalAmount, shippingFee: 20000 }];
  const totalShippingFee = shopGroups.reduce((sum, g) => sum + (g.shippingFee || 20000), 0);
  const finalGrandTotal = totalAmount + totalShippingFee;

  const currentDistricts = getDistrictsByProvince(newAddr.province);
  const currentWards = getWardsByDistrict(newAddr.province, newAddr.district);

  return (
    <div className="checkout-page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/cart" className="breadcrumb-link">Giỏ hàng</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Thanh toán</span>
      </div>

      <div className="checkout-page-header">
        <h1>Thanh toán đơn hàng</h1>
      </div>

      {errorMessage && (
        <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px", color: "#b91c1c" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
          {errorList.length > 0 && (
            <ul style={{ margin: "8px 0 0 24px", padding: 0, fontSize: "14px" }}>
              {errorList.map((err, idx) => (
                <li key={idx}><strong>{err.field}</strong>: {err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form className="checkout-layout" onSubmit={handleCheckout}>
        {/* Left Column: Form Info */}
        <div className="checkout-form-column">
          
          {/* KHỐI ĐỊA CHỈ NHẬN HÀNG (DẠNG CHỌN ĐỊA CHỈ) */}
          <div className="checkout-section" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: 700, fontSize: "16px", marginBottom: "12px" }}>
              <MapPin size={20} />
              <span>Địa Chỉ Nhận Hàng</span>
            </div>

            {selectedAddr ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "15px", color: "#111827" }}>{selectedAddr.receiverName}</strong>
                    <span style={{ color: "#4b5563", fontWeight: 500 }}>{selectedAddr.phone}</span>
                    {selectedAddr.isDefault && (
                      <span style={{ fontSize: "11px", background: "#ecfdf5", color: "#16a34a", border: "1px solid #a7f3d0", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.5" }}>
                    {[selectedAddr.street, selectedAddr.ward, selectedAddr.district, selectedAddr.province].filter(Boolean).join(", ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempSelectedAddressId(selectedAddressId);
                    setIsAddressModalOpen(true);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#fff",
                    border: "1px solid #16a34a",
                    color: "#16a34a",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginLeft: "16px",
                    whiteSpace: "nowrap"
                  }}
                >
                  Thay đổi
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px", border: "1px dashed #d1d5db", borderRadius: "8px" }}>
                <p style={{ color: "#6b7280", marginBottom: "12px" }}>Bạn chưa có địa chỉ nhận hàng.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewAddress(true);
                    setIsAddressModalOpen(true);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  + Thêm địa chỉ nhận hàng
                </button>
              </div>
            )}

            {/* Ghi chú đơn hàng */}
            <div className="form-group" style={{ marginTop: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Ghi chú cho người bán (Tùy chọn)</label>
              <textarea
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao 15 phút..."
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", marginTop: "4px" }}
              ></textarea>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="checkout-section">
            <h2 className="section-title"><CreditCard size={20}/> Phương thức thanh toán</h2>
            <div className="payment-methods-list">
              <label className="payment-method-label active">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked
                  readOnly
                />
                <div className="payment-text">
                  <strong>Thanh toán khi nhận hàng (COD)</strong>
                  <p>Nhận hàng kiểm tra và thanh toán tiền mặt trực tiếp cho người giao hàng.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="checkout-summary-column">
          <div className="summary-card">
            <h3>Đơn hàng của bạn ({cart.length} món)</h3>
            
            <div className="checkout-items-list" style={{ maxHeight: "350px", overflowY: "auto" }}>
              {shopGroups.map((group, gIdx) => (
                <div key={gIdx} style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px dashed #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#16a34a", marginBottom: "8px" }}>
                    <Store size={15} />
                    <span>{group.shop?.shopName || "Nông trại"}</span>
                  </div>
                  {(group.items || []).map((item) => (
                    <div key={item.id || item.product?.id} className="checkout-item-row" style={{ marginBottom: "8px" }}>
                      <img 
                        src={resolveAssetUrl(item.product?.primaryImageUrl) || "https://placehold.co/100x100?text=No+Image"} 
                        alt={item.product?.name} 
                        className="checkout-item-img"
                        onError={handleImageError}
                      />
                      <div className="checkout-item-info">
                        <h4>{item.product?.name}</h4>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                          SL: {item.quantity} x {formatPrice(item.product?.price)}
                        </span>
                      </div>
                      <div className="checkout-item-price">
                        {formatPrice(item.subtotal || (item.product?.price * item.quantity))}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                    <span>Phí ship shop này:</span>
                    <span>{formatPrice(group.shippingFee || 20000)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row">
              <span>Tạm tính tiền hàng:</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <div className="summary-row">
              <span>Tổng phí vận chuyển ({shopGroups.length} shop):</span>
              <span>{formatPrice(totalShippingFee)}</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row total">
              <span>Tổng thanh toán:</span>
              <span className="total-amount">{formatPrice(finalGrandTotal)}</span>
            </div>
            
            <button 
              type="submit" 
              className="btn-place-order"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý đặt hàng..." : "Xác nhận đặt hàng"}
            </button>
          </div>
        </div>
      </form>

      {/* POPUP / MODAL CHỌN ĐỊA CHỈ NHẬN HÀNG (SHOPEE STYLE) */}
      {isAddressModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                {isAddingNewAddress ? "Thêm địa chỉ nhận hàng mới" : "Địa chỉ của tôi"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddressModalOpen(false);
                  setIsAddingNewAddress(false);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              {isAddingNewAddress ? (
                /* Form thêm mới địa chỉ với Dropdown chọn */
                <form onSubmit={handleAddNewAddress}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Họ và tên *</label>
                        <input
                          type="text"
                          required
                          placeholder="Họ tên người nhận"
                          value={newAddr.receiverName}
                          onChange={(e) => setNewAddr({ ...newAddr, receiverName: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Số điện thoại *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0912345678"
                          value={newAddr.phone}
                          onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                        />
                      </div>
                    </div>

                    {/* Dropdown chọn Tỉnh/Thành phố */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Tỉnh / Thành phố *</label>
                      <select
                        value={newAddr.province}
                        onChange={handleProvinceChange}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff" }}
                      >
                        {ALL_PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dropdown chọn Quận/Huyện */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Quận / Huyện *</label>
                      <select
                        value={newAddr.district}
                        onChange={handleDistrictChange}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff" }}
                      >
                        {currentDistricts.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dropdown chọn Phường/Xã */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Phường / Xã *</label>
                      <select
                        value={newAddr.ward}
                        onChange={(e) => setNewAddr({ ...newAddr, ward: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff" }}
                      >
                        {currentWards.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>

                    {/* Số nhà, tên đường cụ thể */}
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Địa chỉ cụ thể (Số nhà, đường) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Số nhà, ngõ/ngách, tên đường..."
                        value={newAddr.street}
                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <input
                        type="checkbox"
                        id="chkDefault"
                        checked={newAddr.isDefault}
                        onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                      />
                      <label htmlFor="chkDefault" style={{ fontSize: "13px", color: "#374151", cursor: "pointer" }}>
                        Đặt làm địa chỉ mặc định
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <button
                        type="submit"
                        style={{ flex: 1, padding: "10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                      >
                        Lưu và sử dụng
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewAddress(false)}
                          style={{ padding: "10px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
                        >
                          Trở lại
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                /* Danh sách địa chỉ có sẵn để chọn */
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {addresses.map((addr) => {
                      const isChecked = tempSelectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setTempSelectedAddressId(addr.id)}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            padding: "12px 16px",
                            border: isChecked ? "2px solid #16a34a" : "1px solid #e5e7eb",
                            borderRadius: "8px",
                            background: isChecked ? "#f0fdf4" : "#fff",
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          <input
                            type="radio"
                            name="addressSelectionRadio"
                            checked={isChecked}
                            onChange={() => setTempSelectedAddressId(addr.id)}
                            style={{ marginTop: "4px" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong style={{ fontSize: "14px" }}>{addr.receiverName}</strong>
                              <span style={{ color: "#6b7280", fontSize: "13px" }}>{addr.phone}</span>
                              {addr.isDefault && (
                                <span style={{ fontSize: "11px", background: "#ecfdf5", color: "#16a34a", border: "1px solid #a7f3d0", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <div style={{ color: "#4b5563", fontSize: "13px", marginTop: "4px", lineHeight: "1.4" }}>
                              {[addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(", ")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      padding: "10px",
                      border: "1px dashed #16a34a",
                      color: "#16a34a",
                      background: "#fff",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    <Plus size={16} /> Thêm địa chỉ mới
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer (chỉ khi xem danh sách) */}
            {!isAddingNewAddress && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "16px 20px", borderTop: "1px solid #e5e7eb" }}>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddressChoice}
                  style={{ padding: "8px 20px", borderRadius: "6px", border: "none", background: "#16a34a", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Xác nhận
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
