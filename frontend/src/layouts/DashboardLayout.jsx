import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
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
  Badge
} from "@mui/material";
import {
  Menu,
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  FolderTree,
  ScanSearch,
  Sprout,
  LogOut,
  Home,
  Search,
  Bell,
  Settings,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../context/useAuth";

const DRAWER_WIDTH = 260;

// Menu điều hướng theo vai trò
const NAV_BY_ROLE = {
  seller: {
    title: "Kênh người bán",
    logoTitle: "EcoFresh Partner",
    items: [
      { label: "Tổng quan", to: "/seller", icon: LayoutDashboard, end: true },
      { label: "Sản phẩm", to: "/seller/products", icon: Package, badge: "2 cần sửa", badgeColor: "warning" },
      { label: "Đơn hàng", to: "/seller/orders", icon: ClipboardList, badge: "4 mới", badgeColor: "default" },
      { label: "Thông tin shop & AI", to: "/seller/info", icon: ScanSearch }
    ]
  },
  admin: {
    title: "Quản trị hệ thống",
    logoTitle: "EcoFresh Admin",
    items: [
      { label: "Tổng quan", to: "/admin", icon: LayoutDashboard, end: true },
      { label: "Sản phẩm", to: "/admin/products", icon: Package, badge: "14 chờ", badgeColor: "warning" },
      { label: "Đơn hàng", to: "/admin/orders", icon: ClipboardList, badge: "23 mới", badgeColor: "info" },
      { label: "Kiểm định AI", to: "/admin/ai-review", icon: ScanSearch, badge: "32", badgeColor: "error" },
      { label: "Người dùng", to: "/admin/users", icon: Users },
      { label: "Danh mục", to: "/admin/categories", icon: FolderTree }
    ],
    otherItems: [
      { label: "Cài đặt", to: "/admin/settings", icon: Settings }
    ]
  }
};

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.admin;

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fff" }}>
      {/* Brand Header */}
      <Toolbar sx={{ px: 3, height: 96, flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
        <Box
          component="img"
          src="/nongsanviet-logo.png"
          alt="Nông sản Việt Logo"
          sx={{ height: 64, objectFit: "contain", mb: 0.5, transform: "scale(1.1)", transformOrigin: "left center" }}
        />
        <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {nav.title}
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* Main Nav Items */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {nav.items.map(({ label, to, icon: Icon, end, badge, badgeColor }) => {
          const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
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
    <ScopedCssBaseline sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
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

          {/* Notification */}
          <IconButton sx={{ color: "#64748b", bgcolor: "#f8fafc", width: 40, height: 40, borderRadius: 2 }}>
            <Badge badgeContent={5} color="error" sx={{ "& .MuiBadge-badge": { fontWeight: 700 } }}>
              <Bell size={20} />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", pl: 1, borderLeft: "1px solid #f1f5f9" }}>
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
              {user?.fullName ? user.fullName.split(" ").slice(-1)[0].substring(0, 2).toUpperCase() : "HÀ"}
            </Avatar>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography variant="body2" fontWeight={700} color="#1e293b" lineHeight={1.2}>
                {user?.fullName || "Nguyễn Thu Hà"}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {role === "seller" ? "Chủ cửa hàng" : "Quản trị viên"}
              </Typography>
            </Box>
            <ChevronDown size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
          </Box>
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
