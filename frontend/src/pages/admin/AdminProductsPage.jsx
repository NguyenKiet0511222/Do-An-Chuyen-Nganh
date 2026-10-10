import { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  Grid,
  InputAdornment,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { Search, FileSpreadsheet } from "lucide-react";
import WireframeNoteBox from "./components/WireframeNoteBox";
import { getSharedProducts, updateProductStatus, syncSharedProductsWithApi } from "../../data/productStore";

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [tabIndex, setTabIndex] = useState(1); // 1 = Chờ duyệt
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [aiFilter, setAiFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    setProducts(getSharedProducts());
    syncSharedProductsWithApi().then((synced) => {
      if (synced && synced.length > 0) setProducts(synced);
    });
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchApprove = () => {
    setToastMsg(`Đã duyệt thành công ${selectedIds.length} sản phẩm.`);
    setSelectedIds([]);
  };

  const handleBatchReject = () => {
    setToastMsg(`Đã từ chối ${selectedIds.length} sản phẩm.`);
    setSelectedIds([]);
  };

  const getAiBadge = (aiLabel) => {
    if (!aiLabel) {
      return (
        <Box
          sx={{
            bgcolor: "#f1f5f9",
            color: "#64748b",
            border: "1px solid #cbd5e1",
            px: 1.2,
            py: 0.4,
            borderRadius: 1,
            fontSize: 11.5,
            fontWeight: 500,
            display: "inline-block"
          }}
        >
          Chưa kiểm định
        </Box>
      );
    }
    
    switch (aiLabel.type) {
      case "rotten":
        return (
          <Box
            sx={{
              bgcolor: "#0f172a",
              color: "#f87171",
              border: "1px solid #ef4444",
              px: 1.2,
              py: 0.4,
              borderRadius: 1,
              fontSize: 11.5,
              fontWeight: 700,
              display: "inline-block"
            }}
          >
            {aiLabel.text}
          </Box>
        );
      case "fresh":
        return (
          <Box
            sx={{
              bgcolor: "#f8fafc",
              color: "#16a34a",
              border: "1px solid #86efac",
              px: 1.2,
              py: 0.4,
              borderRadius: 1,
              fontSize: 11.5,
              fontWeight: 600,
              display: "inline-block"
            }}
          >
            {aiLabel.text}
          </Box>
        );
      case "uncertain":
        return (
          <Box
            sx={{
              bgcolor: "#fffbeb",
              color: "#d97706",
              border: "1px dashed #f59e0b",
              px: 1.2,
              py: 0.4,
              borderRadius: 1,
              fontSize: 11.5,
              fontWeight: 600,
              display: "inline-block"
            }}
          >
            {aiLabel.text}
          </Box>
        );
      default:
        return (
          <Box
            sx={{
              bgcolor: "#f1f5f9",
              color: "#64748b",
              border: "1px solid #cbd5e1",
              px: 1.2,
              py: 0.4,
              borderRadius: 1,
              fontSize: 11.5,
              fontWeight: 500,
              display: "inline-block"
            }}
          >
            {aiLabel.text}
          </Box>
        );
    }
  };

  const filteredProducts = products.filter((p) => {
    // Filter by tab
    if (tabIndex === 1 && p.status !== "PENDING") return false;
    if (tabIndex === 2 && p.status !== "APPROVED") return false;
    if (tabIndex === 3 && p.status !== "REJECTED") return false;
    if (tabIndex === 4 && p.status !== "HIDDEN") return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        (p.name || "").toLowerCase().includes(q) ||
        String(p.id || "").toLowerCase().includes(q) ||
        (p.seller || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    const catStr = typeof p.category === 'string' ? p.category : (p.category?.name || "");
    if (categoryFilter !== "all" && !catStr.includes(categoryFilter)) return false;
    if (sellerFilter !== "all" && p.seller !== sellerFilter) return false;
    if (aiFilter !== "all" && p.aiLabel?.type !== aiFilter) return false;
    return true;
  });

  const wireframeNotes = [
    "1. Tìm kiếm & lọc: lọc theo danh mục, người bán, trạng thái duyệt; tab mặc định mở \"Chờ duyệt\" vì đây là việc admin làm nhiều nhất.",
    "2. Lọc theo nhãn AI: lọc nhanh các sản phẩm bị AI gắn nhãn hỏng hoặc chưa kiểm định.",
    "3. Thao tác hàng loạt: tick nhiều sản phẩm để duyệt / từ chối cùng lúc (giảm thao tác khi nhiều người bán đăng đồng thời).",
    "4. Cột nhãn AI: kết quả tổng hợp từ các ảnh của sản phẩm (tươi / hỏng + % tin cậy). \"Hỏng\" hiển thị nền tối để nổi bật.",
    "5. Thao tác: Xem mở màn chi tiết & duyệt; Duyệt / Từ chối cho phép xử lý ngay trên danh sách với sản phẩm rõ ràng."
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb matching wireframe */}
      <Breadcrumbs separator="/" sx={{ mb: 1, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Sản phẩm
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          Danh sách sản phẩm
        </Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Typography variant="h5" fontWeight={800} sx={{ mb: 2, color: "#0f172a" }}>
        Quản lý sản phẩm
      </Typography>

      {/* Status Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: 14,
              fontWeight: 600,
              minWidth: 100
            }
          }}
        >
          <Tab label="Tất cả (248)" />
          <Tab label="Chờ duyệt (14)" />
          <Tab label="Đã duyệt (221)" />
          <Tab label="Từ chối (9)" />
          <Tab label="Đang ẩn (4)" />
        </Tabs>
      </Box>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={3.5}>
            <TextField
              size="small"
              fullWidth
              placeholder="Tìm theo tên sản phẩm, mã SP, người bán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94a3b8" />
                    </InputAdornment>
                  ),
                  sx: { fontSize: 13 }
                }
              }}
            />
          </Grid>

          {/* Category Select */}
          <Grid item xs={6} md={2}>
            <Select
              size="small"
              fullWidth
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="all">Danh mục: Tất cả</MenuItem>
              <MenuItem value="Rau củ">Rau củ</MenuItem>
              <MenuItem value="Trái cây">Trái cây</MenuItem>
              <MenuItem value="Thực phẩm khô">Thực phẩm khô</MenuItem>
            </Select>
          </Grid>

          {/* Seller Select */}
          <Grid item xs={6} md={2}>
            <Select
              size="small"
              fullWidth
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="all">Người bán: Tất cả</MenuItem>
              <MenuItem value="Vườn rau Tâm An">Vườn rau Tâm An</MenuItem>
              <MenuItem value="HTX Xoài Cao Lãnh">HTX Xoài Cao Lãnh</MenuItem>
              <MenuItem value="Nông trại Ba Vì">Nông trại Ba Vì</MenuItem>
              <MenuItem value="Đặc sản Tây Bắc">Đặc sản Tây Bắc</MenuItem>
            </Select>
          </Grid>

          {/* AI Label Filter */}
          <Grid item xs={6} md={2}>
            <Select
              size="small"
              fullWidth
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="all">Nhãn AI: Tất cả</MenuItem>
              <MenuItem value="rotten">Cảnh báo Hỏng</MenuItem>
              <MenuItem value="fresh">Tươi</MenuItem>
              <MenuItem value="uncertain">Không chắc</MenuItem>
              <MenuItem value="unverified">Chưa kiểm định</MenuItem>
            </Select>
          </Grid>

          {/* Date Filter & Excel Export */}
          <Grid item xs={6} md={2.5} sx={{ display: "flex", gap: 1 }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<FileSpreadsheet size={16} />}
              onClick={() => setToastMsg("Đang xuất danh sách sản phẩm ra tệp Excel...")}
              sx={{ textTransform: "none", fontSize: 13, borderColor: "#cbd5e1", color: "#334155" }}
            >
              Xuất Excel
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Batch Action Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: selectedIds.length > 0 ? "#f8fafc" : "#ffffff"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Checkbox
            size="small"
            checked={selectedIds.length === products.length && products.length > 0}
            indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
            onChange={handleSelectAll}
          />
          <Typography variant="body2" fontWeight={600} sx={{ color: "#334155", fontSize: 13 }}>
            Đã chọn {selectedIds.length} sản phẩm
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            disabled={selectedIds.length === 0}
            onClick={handleBatchApprove}
            sx={{ textTransform: "none", fontSize: 12.5, bgcolor: "#0f172a" }}
          >
            Duyệt hàng loạt
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={selectedIds.length === 0}
            onClick={handleBatchReject}
            sx={{ textTransform: "none", fontSize: 12.5 }}
          >
            Từ chối
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={selectedIds.length === 0}
            onClick={() => {
              setToastMsg(`Đã ẩn ${selectedIds.length} sản phẩm khỏi sàn.`);
              setSelectedIds([]);
            }}
            sx={{ textTransform: "none", fontSize: 12.5, borderColor: "#cbd5e1", color: "#475569" }}
          >
            Ẩn khỏi web
          </Button>
        </Box>
      </Paper>

      {/* Products Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <Table sx={{ "& th": { bgcolor: "#f8fafc", fontWeight: 700, fontSize: 12.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selectedIds.length === products.length && products.length > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Sản phẩm</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell>Người bán</TableCell>
              <TableCell align="right">Giá</TableCell>
              <TableCell align="right">Tồn kho</TableCell>
              <TableCell>Nhãn AI</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Ngày đăng</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((prod) => {
              const isSelected = selectedIds.includes(prod.id);
              return (
                <TableRow
                  key={prod.id}
                  hover
                  selected={isSelected}
                  sx={{ "&:hover": { bgcolor: "#f8fafc" } }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(prod.id)}
                    />
                  </TableCell>

                  {/* Sản phẩm (Ảnh + Tên + Mã SP) */}
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 1,
                          overflow: "hidden",
                          bgcolor: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          sx={{
                            color: "#0f172a",
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" }
                          }}
                          onClick={() => navigate(`/admin/products/${prod.id}`)}
                        >
                          {prod.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prod.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{prod.category}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{prod.seller}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: 13 }}>
                    {prod.price.toLocaleString("vi-VN")} đ/{prod.unit}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: 13 }}>
                    {prod.stock} {prod.unit}
                  </TableCell>

                  {/* Nhãn AI */}
                  <TableCell>{getAiBadge(prod.aiLabel)}</TableCell>

                  {/* Trạng thái */}
                  <TableCell>
                    <Chip
                      size="small"
                      label={prod.status}
                      variant="outlined"
                      sx={{ borderStyle: "dashed", borderColor: "#64748b", color: "#334155", fontSize: 11 }}
                    />
                  </TableCell>

                  <TableCell align="right" sx={{ fontSize: 12, color: "text.secondary" }}>
                    {prod.createdAt}
                  </TableCell>

                  {/* Thao tác (Xem / Duyệt / Từ chối) */}
                  <TableCell align="center">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                      <Link
                        component={RouterLink}
                        to={`/admin/products/${prod.id}`}
                        underline="hover"
                        sx={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}
                      >
                        Xem
                      </Link>
                      <Typography variant="caption" color="text.disabled">
                        ·
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          updateProductStatus(prod.id, "APPROVED");
                          setProducts(getSharedProducts());
                          setToastMsg(`Đã duyệt sản phẩm ${prod.name}`);
                        }}
                        sx={{ fontSize: 12, p: 0, minWidth: "auto", textTransform: "none", color: "#16a34a", fontWeight: 600 }}
                      >
                        Duyệt
                      </Button>
                      <Typography variant="caption" color="text.disabled">
                        ·
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          updateProductStatus(prod.id, "REJECTED", "Không đạt chuẩn chất lượng");
                          setProducts(getSharedProducts());
                          setToastMsg(`Đã từ chối sản phẩm ${prod.name}`);
                        }}
                        sx={{ fontSize: 12, p: 0, minWidth: "auto", textTransform: "none", color: "#dc2626", fontWeight: 600 }}
                      >
                        Từ chối
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Pagination Footer matching wireframe */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
          Hiển thị 1–8 / 14
        </Typography>
        <Pagination count={2} page={1} shape="rounded" size="small" />
      </Box>



      {/* Snackbar feedback */}
      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={3000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
