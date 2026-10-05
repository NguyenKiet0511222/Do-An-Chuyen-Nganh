import { useState } from "react";
import { AuthContext } from "./authContextInstance";

// Key lưu trong localStorage — services/api.js cũng đọc TOKEN_KEY để gắn header Authorization
export const TOKEN_KEY = "agri_token";
export const USER_KEY = "agri_user";

function readStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    // Phiên của bản "đăng nhập giả" cũ (token "mock-...", đã bỏ) -> coi như chưa đăng nhập
    if (token?.startsWith("mock-")) return { token: null, user: null };
    return token && user ? { token, user } : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

/**
 * Trạng thái đăng nhập toàn cục.
 * user có dạng { id, fullName, email, roles: ["CUSTOMER" | "SELLER" | "ADMIN"] } — do backend trả về khi login.
 */
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  const login = (data) => {
    const token = data?.accessToken || data?.token;
    const user = data?.user;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    setAuth({ token, user });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ token: null, user: null });
  };

  const hasRole = (role) => {
    if (!auth.user) return false;
    if (auth.user.role === role) return true;
    if (Array.isArray(auth.user.roles)) return auth.user.roles.includes(role);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        isAuthenticated: Boolean(auth.token),
        login,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
