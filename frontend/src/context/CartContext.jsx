import { useState, useEffect, useCallback } from "react";
import { CartContext } from "./cartContextInstance";
import { useAuth } from "./useAuth";
import { useRequireLogin } from "./useRequireLogin";
import { cartApi } from "../services/api";

export function CartProvider({ children }) {
  const { user } = useAuth();
  const requireLogin = useRequireLogin();

  const [cartData, setCartData] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chuyển CartResponse (groups) thành mảng item phẳng kèm thông tin shop
  const syncCartFromResponse = useCallback((data) => {
    setCartData(data);
    if (!data || !data.groups) {
      setCart([]);
      return;
    }
    const flattened = data.groups.flatMap((g) =>
      (g.items || []).map((it) => ({
        ...it,
        shop: g.shop
      }))
    );
    setCart(flattened);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user?.id) {
      setCart([]);
      setCartData(null);
      return;
    }
    try {
      setLoading(true);
      const data = await cartApi.get();
      syncCartFromResponse(data);
    } catch (err) {
      console.warn("Không thể tải giỏ hàng từ server:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, syncCartFromResponse]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // true = đã thêm; false = chưa đăng nhập (đã chuyển trang đăng nhập)
  const addToCart = async (product, quantity = 1) => {
    if (!requireLogin("Đăng nhập để thêm sản phẩm vào giỏ hàng.")) return false;

    try {
      const data = await cartApi.addItem({
        productId: product.id,
        quantity
      });
      syncCartFromResponse(data);

      setLastAddedItem(product.name);
      setTimeout(() => setLastAddedItem(null), 2500);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Không thể thêm vào giỏ hàng";
      alert(msg);
      return false;
    }
  };

  const removeFromCart = async (idOrProductId) => {
    const item = cart.find((i) => i.id === idOrProductId || i.product?.id === idOrProductId);
    if (!item) return;

    try {
      const data = await cartApi.removeItem(item.id);
      syncCartFromResponse(data);
    } catch (err) {
      console.error("Lỗi khi xóa khỏi giỏ:", err);
    }
  };

  const updateQuantity = async (idOrProductId, newQuantity) => {
    const item = cart.find((i) => i.id === idOrProductId || i.product?.id === idOrProductId);
    if (!item) return;

    if (newQuantity <= 0) {
      await removeFromCart(item.id);
      return;
    }

    try {
      const data = await cartApi.updateQuantity(item.id, newQuantity);
      syncCartFromResponse(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Không thể cập nhật số lượng";
      alert(msg);
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear();
      setCart([]);
      setCartData(null);
    } catch (err) {
      console.error("Lỗi khi xóa sạch giỏ:", err);
    }
  };

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.subtotal ?? (item.product?.price || 0) * item.quantity),
    0
  );

  const groups = cartData?.groups || [];
  const grandTotal = cartData?.grandTotal ?? totalAmount;

  return (
    <CartContext.Provider
      value={{
        cart,
        groups,
        cartData,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        totalCount,
        totalAmount,
        grandTotal,
        isCartOpen,
        setIsCartOpen,
        lastAddedItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
