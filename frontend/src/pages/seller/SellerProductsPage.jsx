import { Box, Typography, Paper, Tabs, Tab, TextField, InputAdornment, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Avatar } from "@mui/material";
import { Search, Plus, Edit, EyeOff, MoreVertical, Package } from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SellerProductsPage() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); 

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const allProducts = [
    { id: "SP-01180", image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100", name: "Cà chua bi Đà Lạt", category: "Củ quả", price: "45.000", stock: 120, ai: "Tươi 92%", status: "Đã duyệt", sold: 214 },
    { id: "SP-01181", image: "https://images.unsplash.com/photo-1518977672816-c87948c3b7a5?w=100", name: "Khoai tây Đà Lạt", category: "Củ quả", price: "28.000", stock: 495, ai: "Tươi 97%", status: "Đã duyệt", sold: 98 },
    { id: "SP-01182", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100", name: "Ớt chuông Đà Lạt", category: "Củ quả", price: "55.000", stock: 90, ai: "Tươi 91%", status: "Đã duyệt", sold: 73 },
    { id: "SP-01183", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100", name: "Rau muống hữu cơ", category: "Rau ăn lá", price: "12.000", stock: 80, ai: "Chưa kiểm định", status: "Đã duyệt", sold: 120 },
    { id: "SP-01184", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100", name: "Dâu tây Đà Lạt", category: "Trái cây NK", price: "180.000", stock: 30, ai: "Tươi 89%", status: "Đã duyệt", sold: 22 },
    { id: "SP-01185", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=100", name: "Dưa chuột baby", category: "Củ quả", price: "30.000", stock: 150, ai: "Tươi 90%", status: "Chờ duyệt", sold: 0 },
    { id: "SP-01186", image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=100", name: "Quýt đường", category: "Nhiệt đới", price: "40.000", stock: 120, ai: "Không chắc 64%", status: "Cần bổ sung", statusDesc: "Ảnh mờ, AI không chắc", sold: 0 },
    { id: "SP-01187", image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=100", name: "Cam sành loại 2", category: "Nhiệt đới", price: "20.000", stock: 100, ai: "Hỏng 85%", status: "Từ chối", statusDesc: "Ảnh có dấu hiệu hỏng", sold: 0 },
    { id: "SP-01188", image: "", name: "Súp lơ xanh", category: "Rau củ", price: "35.000", stock: 0, ai: "Chưa kiểm định", status: "Nháp", sold: 0 },
    { id: "SP-01189", image: "https://images.unsplash.com/photo-1518977672816-c87948c3b7a5?w=100", name: "Khoai môn", category: "Củ quả", price: "45.000", stock: 20, ai: "Tươi 90%", status: "Đang ẩn", sold: 15 },
  ];

  const tabs = [
    { label: "Tất cả", filter: null },
    { label: "Nháp", filter: ["Nháp"] },
    { label: "Chờ duyệt", filter: ["Chờ duyệt"] },
    { label: "Đã duyệt", filter: ["Đã duyệt"] },
    { label: "Cần bổ sung/Từ chối", filter: ["Cần bổ sung", "Từ chối"] },
    { label: "Đang ẩn", filter: ["Đang ẩn"] },
  ];

  const filteredProducts = useMemo(() => {
    const currentFilter = tabs[tabValue].filter;
    if (!currentFilter) return allProducts;
    return allProducts.filter(p => currentFilter.includes(p.status));
  }, [tabValue, allProducts]);

  return (
    <Box sx={{ pb: 4, maxWidth: 1200, margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Package size={28} color="#10b981" />
          Sản phẩm của shop
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Plus size={18} />} 
          sx={{ borderRadius: "10px", px: 3, boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}
          component={Link}
          to="/seller/products/new"
        >
          Thêm sản phẩm mới
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 4, border: "1px solid #e5e7eb", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
        
        <Box sx={{ borderBottom: "1px solid #e5e7eb", bgcolor: "#f9fafb" }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ sx: { bgcolor: "#10b981", height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 } }}
          >
            {tabs.map((tab, idx) => {
              const count = tab.filter 
                ? allProducts.filter(p => tab.filter.includes(p.status)).length 
                : allProducts.length;
              return (
                <Tab 
                  key={idx}
                  disableRipple
                  label={`${tab.label} (${count})`} 
                  sx={{ 
                    textTransform: "none", 
                    fontWeight: 600, 
                    color: tabValue === idx ? "#111827 !important" : "#6b7280",
                    fontSize: 15,
                    px: 3,
                    py: 2.5
                  }} 
                />
              );
            })}
          </Tabs>
        </Box>

        <Box sx={{ p: 3, display: "flex", gap: 2, alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
          <TextField
            placeholder="Tìm theo tên hoặc mã SP..."
            size="small"
            sx={{ flex: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={18} color="#9ca3af" /></InputAdornment>,
            }}
          />
          <TextField select size="small" sx={{ width: 180 }} SelectProps={{ native: true }}>
            <option>Tất cả danh mục</option>
            <option>Rau ăn lá</option>
            <option>Củ quả</option>
            <option>Trái cây</option>
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280", py: 2 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Giá (₫)</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Tồn kho</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }} align="center">Đã bán</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length > 0 ? filteredProducts.map((row) => (
                <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f9fafb" }, transition: "background 0.2s" }}>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar src={row.image} variant="rounded" sx={{ width: 48, height: 48, border: "1px solid #e5e7eb", bgcolor: "#f3f4f6" }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#111827", mb: 0.5 }}>{row.name}</Typography>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <Typography variant="caption" sx={{ color: "#6b7280", bgcolor: "#f3f4f6", px: 1, py: 0.2, borderRadius: 1 }}>{row.id}</Typography>
                          <Typography variant="caption" sx={{ color: row.ai.includes("Hỏng") ? "#ef4444" : row.ai.includes("Chưa") ? "#6b7280" : "#10b981", fontWeight: 600 }}>{row.ai}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6", color: "#4b5563" }}>{row.category}</TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6", fontWeight: 600, color: "#111827" }}>{row.price}</TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                    <Typography sx={{ color: row.stock === 0 ? "#ef4444" : "#111827", fontWeight: 600 }}>
                      {row.stock}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }}>
                    <Box>
                      <Chip 
                        label={row.status} 
                        size="small" 
                        color={
                          row.status === "Đã duyệt" ? "success" : 
                          row.status === "Chờ duyệt" ? "warning" : 
                          row.status === "Nháp" ? "default" :
                          row.status === "Đang ẩn" ? "default" : "error"
                        }
                        sx={{ fontWeight: 600, borderRadius: "6px" }} 
                      />
                      {row.statusDesc && (
                        <Typography variant="caption" sx={{ display: "block", color: "#ef4444", mt: 0.5, fontWeight: 500 }}>
                          {row.statusDesc}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6", color: "#4b5563" }} align="center">{row.sold}</TableCell>
                  <TableCell sx={{ borderBottom: "1px solid #f3f4f6" }} align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      <IconButton size="small" sx={{ color: "#3b82f6", bgcolor: "#eff6ff", "&:hover": { bgcolor: "#dbeafe" } }} onClick={() => navigate(`/seller/products/${row.id}/edit`)}>
                        <Edit size={16} />
                      </IconButton>
                      <IconButton size="small" sx={{ color: "#6b7280", bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" } }}>
                        <EyeOff size={16} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">Không có sản phẩm nào trong mục này.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
