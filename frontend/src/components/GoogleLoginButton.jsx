import { useEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { authApi } from "../services/api";

// Phải trùng app.google.client-id của backend (backend kiểm tra aud của ID token)
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

// Nạp script Google Identity Services một lần cho cả app
let gsiPromise = null;
function loadGsi() {
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => {
        gsiPromise = null; // cho phép thử lại ở lần mở trang sau
        reject(new Error("Không tải được Google Identity Services"));
      };
      document.head.appendChild(script);
    });
  }
  return gsiPromise;
}

// initialize() chỉ gọi 1 lần (gọi lại GIS sẽ cảnh báo) -> callback chuyển tiếp tới nút đang hiển thị
let gsiInitialized = false;
let credentialHandler = null;

/**
 * Nút "Đăng nhập bằng Google" do Google tự vẽ (bắt buộc: chỉ nút này/One Tap mới trả ID token,
 * kiểu nút tự vẽ trả access token -> backend từ chối).
 * Google trả ID token -> POST /api/auth/google -> onSuccess(data) với data = { accessToken, tokenType, expiresIn, user }.
 * text: "signin_with" | "signup_with" | "continue_with".
 */
export default function GoogleLoginButton({ text = "signin_with", onSuccess, onError }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  // Cập nhật mỗi lần render để GIS luôn gọi tới onSuccess/onError mới nhất
  useEffect(() => {
    credentialHandler = async ({ credential }) => {
      onError?.("");
      setLoading(true);
      try {
        onSuccess?.(await authApi.loginWithGoogle(credential));
      } catch (err) {
        onError?.(
          err.response?.data?.message || "Đăng nhập Google thất bại. Vui lòng thử lại sau."
        );
      } finally {
        setLoading(false);
      }
    };
    return () => {
      credentialHandler = null;
    };
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        if (!gsiInitialized) {
          google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response) => credentialHandler?.(response)
          });
          gsiInitialized = true;
        }
        google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          text,
          locale: "vi",
          logo_alignment: "center",
          // GIS nhận độ rộng theo px, tối đa 400
          width: Math.min(400, containerRef.current.offsetWidth || 400)
        });
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!CLIENT_ID || unavailable) {
    return (
      <Button variant="outlined" fullWidth disabled>
        {CLIENT_ID
          ? "Không tải được Google, kiểm tra kết nối mạng"
          : "Đăng nhập Google chưa được cấu hình"}
      </Button>
    );
  }

  return (
    <Box>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          minHeight: 44,
          display: "flex",
          justifyContent: "center",
          opacity: loading ? 0.5 : 1,
          pointerEvents: loading ? "none" : "auto"
        }}
      />
      {loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
          Đang đăng nhập với Google...
        </Typography>
      )}
    </Box>
  );
}
