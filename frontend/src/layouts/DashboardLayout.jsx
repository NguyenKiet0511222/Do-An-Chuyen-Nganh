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
  Store,
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
      { label: "Sản phẩm", to: "/admin/products", icon: Package, dynamicBadge: "adminPendingProducts", badgeColor: "warning" },
      { label: "Đơn hàng", to: "/admin/orders", icon: ClipboardList, dynamicBadge: "adminPendingOrders", badgeColor: "default" },
      { label: "Kiểm định AI", to: "/admin/ai-review", icon: ScanSearch, dynamicBadge: "aiPending", badgeColor: "error" },
      { label: "Cửa hàng", to: "/admin/shops", icon: Store, dynamicBadge: "adminPendingShops", badgeColor: "warning" },
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
  const [adminPendingOrders, setAdminPendingOrders] = useState(0);
  const [adminPendingShops, setAdminPendingShops] = useState(0);
  const [sellerCounts, setSellerCounts] = useState({ needFix: 0, newOrders: 0 });
  const location = useLocation();
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.admin;

  const isAdminArea = role === "admin" && hasRole("ADMIN");
  const isSellerArea = role === "seller" && hasRole("SELLER");

  // Badge admin: số ảnh chờ kiểm định AI, sản phẩm chờ duyệt, đơn mới, shop chờ duyệt
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
          if (!ignore) setAiPending(0);
        });
      adminApi.product
        .getAll({ status: "PENDING", page: 0, size: 1 })
        .then((page) => {
          if (!ignore) setAdminPendingProducts(Number(page?.totalElements) || 0);
        })
        .catch(() => {
          if (!ignore) setAdminPendingProducts(0);
        });
      adminApi.dashboard
        .getSummary()
        .then((sum) => {
          if (!ignore && sum) {
            setAdminPendingOrders(Number(sum.pendingOrders) || 0);
            setAdminPendingShops(Number(sum.pendingShops) || 0);
          }
        })
        .catch(() => {});
    };
    loadPending();
    window.addEventListener(AI_PENDING_CHANGED_EVENT, loadPending);
    return () => {
      ignore = true;
      window.removeEventListener(AI_PENDING_CHANGED_EVENT, loadPending);
    };
  }, [isAdminArea]);

  // Badge người bán
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
          if (!ignore) setSellerCounts({ needFix: 0, newOrders: 0 });
        });
    };
    loadSummary();
    window.addEventListener(SELLER_DATA_CHANGED_EVENT, loadSummary);
    return () => {
      ignore = true;
      window.removeEventListener(SELLER_DATA_CHANGED_EVENT, loadSummary);
    };
  }, [isSellerArea]);

  const countBadge = (enabled, count, suffix) => (enabled && count > 0 ? `${count}${suffix}` : null);
  const dynamicBadges = {
    aiPending: countBadge(isAdminArea, aiPending, ""),
    adminPendingProducts: countBadge(isAdminArea, adminPendingProducts, " chờ"),
    adminPendingOrders: countBadge(isAdminArea, adminPendingOrders, " mới"),
    adminPendingShops: countBadge(isAdminArea, adminPendingShops, " chờ"),
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
              <ListItemIcon sx={{ color: "inherit", minWidth: 38 }}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: -0.2
                }}
              />
              {badge && (
                <Chip
                  size="small"
                  label={badge}
                  color={badgeColor || "default"}
                  sx={{
                    height: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: "6px"
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      {/* Bottom Nav / Settings */}
      {nav.otherItems && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Divider sx={{ mb: 2, borderColor: "#f1f5f9" }} />
          {nav.otherItems.map(({ label, to, icon: Icon }) => (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                py: 1.2,
                px: 2,
                color: "#64748b",
                "&:hover": { bgcolor: "#f8fafc", color: "#0f172a" }
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 38 }}>
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          ))}
        </Box>
      )}

      {/* Footer / Back to Shop */}
      <Box sx={{ p: 2, borderTop: "1px solid #f1f5f9", bgcolor: "#fafafa" }}>
        <ListItemButton
          component={Link}
          to="/"
          sx={{
            borderRadius: 2,
            py: 1,
            px: 1.5,
            color: "#64748b",
            "&:hover": { bgcolor: "#f1f5f9", color: "#0f172a" }
          }}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
            <Home size={18} />
          </ListItemIcon>
          <ListItemText primary="Về sàn mua sắm" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <ScopedCssBaseline sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      {/* Top Bar Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "#fff",
          color: "#0f172a",
          borderBottom: "1px solid #f1f5f9",
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", height: 70, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 1, display: { md: "none" } }}
            >
              <Menu size={22} />
            </IconButton>

            {/* Quick Search */}
            <TextField
              placeholder="Tìm kiếm nhanh đơn hàng, nông sản..."
              size="small"
              sx={{
                width: { xs: 180, sm: 280 },
                display: { xs: "none", sm: "block" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#f8fafc",
                  fontSize: 13,
                  "& fieldset": { borderColor: "#f1f5f9" },
                  "&:hover fieldset": { borderColor: "#cbd5e1" }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#94a3b8" />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* User Profile & Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton size="small" sx={{ color: "#64748b" }}>
              <Bell size={20} />
            </IconButton>

            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: "center" }} />

            <Box
              onClick={handleProfileClick}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                p: 0.8,
                borderRadius: 2,
                "&:hover": { bgcolor: "#f8fafc" },
                transition: "background 0.2s"
              }}
            >
              <Avatar
                src={user?.avatarUrl}
                sx={{ width: 36, height: 36, bgcolor: "#10b981", fontSize: 14, fontWeight: 700 }}
              >
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {user?.fullName || "Người dùng"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  {role === "seller" ? "Người bán" : "Quản trị viên"}
                </Typography>
              </Box>
              <ChevronDown size={14} color="#64748b" />
            </Box>
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
            <MenuItem component={Link} to={role === "seller" ? "/seller/profile" : "/admin/profile"} onClick={handleProfileClose} sx={{ fontSize: 14, py: 1 }}>
              Hồ sơ tài khoản
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
