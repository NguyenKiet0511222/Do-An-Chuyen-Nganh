import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ScopedCssBaseline,
  TextField,
  Toolbar,
  Typography,
  Menu as MuiMenu,
  MenuItem
} from "@mui/material";
import {
  Menu,
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  FolderTree,
  ScanSearch,
  LogOut,
  Home,
  Search,
  Bell,
  Settings,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { adminApi, sellerApi } from "../services/api";
import { AI_PENDING_CHANGED_EVENT } from "../pages/admin/components/aiReview";
import { SELLER_DATA_CHANGED_EVENT } from "../utils/sellerEvents";

const DRAWER_WIDTH = 240;

// Menu điều hướng theo vai trò
const NAV_BY_ROLE = {
  seller: {
    title: "Kênh người bán",
    logoTitle: "EcoFresh Partner",
    items: [
      { label: "Tổng quan", to: "/seller", icon: LayoutDashboard, end: true },
      // Badge thật từ /seller/dashboard/summary: cần sửa = REJECTED + NEED_INFO, đơn mới = pendingOrders (0 thì ẩn)
      { label: "Sản phẩm", to: "/seller/products", icon: Package, dynamicBadge: "sellerNeedFix", badgeColor: "warning" },
      { label: "Đơn hàng", to: "/seller/orders", icon: ClipboardList, dynamicBadge: "sellerNewOrders", badgeColor: "default" },
      { label: "Thông tin shop & AI", to: "/seller/info", icon: ScanSearch }
    ]
  },
  admin: {
    title: "Quản trị hệ thống",
    logoTitle: "EcoFresh Admin",
    items: [
      { label: "Tổng quan", to: "/admin", icon: LayoutDashboard, end: true },
      // Badge = số sản phẩm PENDING thật (totalElements của adminApi.product.getAll)
      { label: "Sản phẩm", to: "/admin/products", icon: Package, dynamicBadge: "adminPendingProducts", badgeColor: "warning" },
      // Chưa có /api/admin/orders -> chưa có badge
      { label: "Đơn hàng", to: "/admin/orders", icon: ClipboardList },
      // Badge = số ảnh đang chờ kiểm định thật (pendingReview), xem DashboardLayout bên dưới
      { label: "Kiểm định AI", to: "/admin/ai-review", icon: ScanSearch, dynamicBadge: "aiPending", badgeColor: "error" },
      { label: "Người dùng", to: "/admin/users", icon: Users },
      { label: "Danh mục", to: "/admin/categories", icon: FolderTree }
    ],
    otherItems: [
      { label: "Cài đặt", to: "/admin/settings", icon: Settings }
    ]
  }
};

export default function DashboardLayout({ role }) {
  const { user, logout, hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [aiPending, setAiPending] = useState(0);
  const [adminPendingProducts, setAdminPendingProducts] = useState(0);
  const [sellerCounts, setSellerCounts] = useState({ needFix: 0, newOrders: 0 });
  const location = useLocation();
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.admin;
  // Chỉ gọi API của đúng khu: ADMIN vào khu người bán không gọi summary người bán (backend trả 404 "chưa có shop")
  const isAdminArea = role === "admin" && hasRole("ADMIN");
  const isSellerArea = role === "seller" && hasRole("SELLER");

  // Badge admin: số ảnh chờ kiểm định AI + số sản phẩm chờ duyệt. Tải lại khi có ảnh / sản phẩm vừa được kiểm định
  // (AdminProductsPage, AdminProductDetailPage, AiReview* đều gọi notifyAiPendingChanged()).
  useEffect(() => {
    if (!isAdminArea) return undefined;
    let ignore = false;
    const loadPending = () => {
      adminApi.ai
        .getStatistics()
        .then((stats) => {
          if (!ignore) setAiPending(Number(stats?.pendingReview) || 0);
        })
        .catch(() => {
          if (!ignore) setAiPending(0); // lỗi -> ẩn badge
        });
      adminApi.product
        .getAll({ status: "PENDING", page: 0, size: 1 })
        .then((page) => {
          if (!ignore) setAdminPendingProducts(Number(page?.totalElements) || 0);
        })
        .catch(() => {
          if (!ignore) setAdminPendingProducts(0);
        });
    };
    loadPending();
    window.addEventListener(AI_PENDING_CHANGED_EVENT, loadPending);
    return () => {
      ignore = true;
      window.removeEventListener(AI_PENDING_CHANGED_EVENT, loadPending);
    };
  }, [isAdminArea]);

  // Badge người bán: tải lại khi có notifySellerDataChanged() (gửi duyệt, xoá, ẩn sản phẩm, đổi trạng thái đơn)
  useEffect(() => {
    if (!isSellerArea) return undefined;
    let ignore = false;
    const loadSummary = () => {
      sellerApi.dashboard
        .getSummary()
        .then((summary) => {
          if (ignore) return;
          const byStatus = summary?.productsByStatus || {};
          setSellerCounts({
            needFix: (Number(byStatus.REJECTED) || 0) + (Number(byStatus.NEED_INFO) || 0),
            newOrders: Number(summary?.pendingOrders) || 0
          });
        })
        .catch(() => {
          if (!ignore) setSellerCounts({ needFix: 0, newOrders: 0 }); // lỗi -> ẩn badge
        });
    };
    loadSummary();
    window.addEventListener(SELLER_DATA_CHANGED_EVENT, loadSummary);
    return () => {
      ignore = true;
      window.removeEventListener(SELLER_DATA_CHANGED_EVENT, loadSummary);
    };
  }, [isSellerArea]);

  // Số = 0 (hoặc sai khu) thì ẩn badge
  const countBadge = (enabled, count, suffix) => (enabled && count > 0 ? `${count}${suffix}` : null);
  const dynamicBadges = {
    aiPending: countBadge(isAdminArea, aiPending, ""),
    adminPendingProducts: countBadge(isAdminArea, adminPendingProducts, " chờ"),
    sellerNeedFix: countBadge(isSellerArea, sellerCounts.needFix, " cần sửa"),
    sellerNewOrders: countBadge(isSellerArea, sellerCounts.newOrders, " mới")
  };

  const handleProfileClick = (event) => setAnchorEl(event.currentTarget);
  const handleProfileClose = () => setAnchorEl(null);
  const handleLogoutClick = () => {
    handleProfileClose();
    logout();
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fff" }}>
      {/* Brand Header */}
      <Toolbar sx={{ px: 2, height: 130, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
        <Box
          component="img"
          src="/nongsanviet-logo.png"
          alt="Nông sản Việt Logo"
          sx={{ height: 72, objectFit: "contain", transform: "scale(1.25)", transformOrigin: "center" }}
        />
        <Typography variant="caption" sx={{ fontSize: 13, fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center", mt: 1 }}>
          {nav.title}
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* Main Nav Items */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {nav.items.map(({ label, to, icon: Icon, end, badge: staticBadge, dynamicBadge, badgeColor }) => {
          const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
          const badge = dynamicBadge ? dynamicBadges[dynamicBadge] : staticBadge;
          return (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 1,
                py: 1.2,
                px: 2,
                color: isActive ? "#047857" : "#64748b",
                bgcolor: isActive ? "#ecfdf5" : "transparent",
                "&:hover": { bgcolor: isActive ? "#ecfdf5" : "#f8fafc", color: isActive ? "#047857" : "#0f172a" },
                transition: "all 0.2s"
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive ? "#10b981" : "#94a3b8" }}>
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText
                primary={label}
                slotProps={{
                  primary: {
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 600
                  }
                }}
              />
              {badge && (
                <Chip
                  label={badge}
                  size="small"
                  color={badgeColor === "warning" ? "warning" : badgeColor === "error" ? "error" : "default"}
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    px: 0.5,
                    bgcolor: badgeColor === "warning" ? "#fef3c7" : badgeColor === "error" ? "#fee2e2" : "#f1f5f9",
                    color: badgeColor === "warning" ? "#b45309" : badgeColor === "error" ? "#b91c1c" : "#475569",
                    "& .MuiChip-label": { px: 1 }
                  }}
                />
              )}
            </ListItemButton>
          );
        })}

        {/* Mục Khác (Admin only) */}
        {nav.otherItems && (
          <>
            <Box sx={{ px: 2, pt: 3, pb: 1 }}>
              <Typography variant="caption" sx={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                Khác
              </Typography>
            </Box>
            {nav.otherItems.map(({ label, to, icon: Icon }) => (
              <ListItemButton
                key={to}
                component={NavLink}
                to={to}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  py: 1.2,
                  px: 2,
                  color: "#64748b",
                  "&.active": { bgcolor: "#ecfdf5", color: "#047857" },
                  "&:hover": { bgcolor: "#f8fafc" }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "#94a3b8" }}>
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText primary={label} slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }} />
              </ListItemButton>
            ))}
          </>
        )}
      </List>

      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            mb: 1,
            py: 1.2,
            px: 2,
            color: "#ef4444",
            "&:hover": { bgcolor: "#fef2f2" }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "#ef4444" }}>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText primary="Đăng xuất" slotProps={{ primary: { fontSize: 14, fontWeight: 700 } }} />
        </ListItemButton>
        <ListItemButton component={Link} to="/" sx={{ borderRadius: 2, py: 1.2, px: 2, color: "#64748b", "&:hover": { bgcolor: "#f8fafc" } }}>
          <ListItemIcon sx={{ minWidth: 36, color: "#94a3b8" }}>
            <Home size={20} />
          </ListItemIcon>
          <ListItemText primary="Về trang mua hàng" slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <ScopedCssBaseline sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAFB" }}>
      {/* Top Header */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: "1px solid #f1f5f9",
          bgcolor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)"
        }}
      >
        <Toolbar sx={{ height: 72, gap: 2, px: { xs: 2, md: 4 } }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" }, color: "#64748b" }}
            aria-label="Mở menu"
          >
            <Menu size={24} />
          </IconButton>

          {/* Quick Search */}
          <Box sx={{ flex: 1, maxWidth: 480, display: { xs: "none", sm: "block" } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm kiếm..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color="#94a3b8" />
                    </InputAdornment>
                  ),
                  sx: {
                    height: 40,
                    fontSize: 14,
                    bgcolor: "#f1f5f9",
                    borderRadius: 2,
                    "& fieldset": { border: "none" },
                    "&:hover": { bgcolor: "#e2e8f0" }
                  }
                }
              }}
            />
          </Box>
          <Box sx={{ flex: 1, display: { sm: "none" } }} />

          {/* Thông báo: chưa có API thông báo -> không hiện số giả */}
          <IconButton aria-label="Thông báo" sx={{ color: "#64748b", bgcolor: "#f8fafc", width: 40, height: 40, borderRadius: "10px" }}>
            <Bell size={20} />
          </IconButton>

          {/* User Profile */}
          <Box onClick={handleProfileClick} sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", pl: 1, borderLeft: "1px solid #f1f5f9" }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#10b981",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)"
              }}
            >
              {(user?.fullName || user?.email || "?").trim().split(" ").slice(-1)[0].substring(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
                {user?.fullName || user?.email}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {hasRole("ADMIN") ? "Quản trị viên" : "Chủ cửa hàng"}
              </Typography>
            </Box>
            <ChevronDown size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
          </Box>

          {/* User Dropdown Menu */}
          <MuiMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.5,
                  minWidth: 220,
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: "1px solid #f1f5f9"
                }
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {user?.email}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem component={Link} to={role === "seller" ? "/seller/info" : "/admin/settings"} onClick={handleProfileClose} sx={{ fontSize: 14, py: 1 }}>
              {role === "seller" ? "Hồ sơ cửa hàng" : "Cài đặt hệ thống"}
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleLogoutClick} sx={{ fontSize: 14, py: 1, color: "error.main" }}>
              Đăng xuất
            </MenuItem>
          </MuiMenu>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, borderRight: "none", boxShadow: "4px 0 24px rgba(0,0,0,0.05)" } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", borderRightColor: "#f1f5f9" }
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content View */}
      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, minWidth: 0, pt: { xs: 10, md: 12 } }}>
        <Outlet />
      </Box>
    </ScopedCssBaseline>
  );
}
