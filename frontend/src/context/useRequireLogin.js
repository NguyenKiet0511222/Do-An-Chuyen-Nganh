import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * Chặn thao tác cần đăng nhập (thêm giỏ, mua ngay...). Người xem chưa đăng nhập -> chuyển tới /login
 * kèm lời nhắc; đăng nhập xong LoginPage đưa về đúng trang đang xem.
 *
 *   const requireLogin = useRequireLogin();
 *   if (!requireLogin("Đăng nhập để ...")) return;
 */
export function useRequireLogin() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (message) => {
    if (isAuthenticated) return true;
    navigate("/login", { state: { from: location, message } });
    return false;
  };
}
