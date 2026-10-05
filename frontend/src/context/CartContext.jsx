import { useState, useEffect } from "react";
import { CartContext } from "./cartContextInstance";
import { useAuth } from "./useAuth";
import { useRequireLogin } from "./useRequireLogin";

// Giỏ hàng gắn với từng tài khoản (key theo userId); người xem chưa đăng nhập không có giỏ.
// TODO (tuần 5): chuyển sang /api/cart (api.md 4.5), giữ nguyên các hàm export để các trang không phải sửa.
function readCart(storageKey) {
  if (!storageKey) return [];
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const requireLogin = useRequireLogin();
  const storageKey = user?.id != null ? `agri_cart_${user.id}` : null;

  const [cart, setCart] = useState(() => readCart(storageKey));
  const [loadedKey, setLoadedKey] = useState(storageKey);

  // Đăng nhập / đăng xuất / đổi tài khoản -> nạp giỏ của tài khoản hiện tại
  if (loadedKey !== storageKey) {
    setLoadedKey(storageKey);
    setCart(readCart(storageKey));
  }

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (e) {
      console.error("Lỗi khi lưu giỏ hàng vào localStorage", e);
    }
  }, [storageKey, cart]);

  // true = đã thêm; false = người xem chưa đăng nhập (đã được chuyển tới trang đăng nhập)
  const addToCart = (product, quantity = 1) => {
    if (!requireLogin("Đăng nhập để thêm sản phẩm vào giỏ hàng.")) return false;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });

    // Thông báo nhanh mặt hàng vừa thêm
    setLastAddedItem(product.name);
    setTimeout(() => setLastAddedItem(null), 2500);
    return true;
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        totalAmount,
        isCartOpen,
        setIsCartOpen,
        lastAddedItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
