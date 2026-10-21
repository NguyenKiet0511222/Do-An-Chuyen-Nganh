import { Box, Typography, Paper, Tabs, Tab, TextField, InputAdornment, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Pagination, MenuItem } from "@mui/material";
import { Search, Plus, CheckCircle2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSharedProducts, updateProductStatus } from "../../data/productStore";
import { sellerApi, resolveAssetUrl } from "../../services/api";

export default function SellerProductsPage() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadSellerProducts = async () => {
    setLoading(true);
    try {
      const res = await sellerApi.product.getAll({ size: 100 });
      if (res && res.content && res.content.length > 0) {
        setProducts(res.content);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Không thể tải sản phẩm từ sellerApi, dùng shared store:", err?.message);
    }
    setProducts(getSharedProducts());
    setLoading(false);
  };

  useEffect(() => {
    loadSellerProducts();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
  };

  const tabs = [
    { label: "Tất cả", filter: null, activeColor: "#047857", badgeBg: "#d1fae5", badgeColor: "#065f46" },
    { label: "Nháp", filter: ["DRAFT"], activeColor: "#334155", badgeBg: "#f1f5f9", badgeColor: "#475569" },
    { label: "Chờ duyệt", filter: ["PENDING"], activeColor: "#b45309", badgeBg: "#fef3c7", badgeColor: "#b45309" },
    { label: "Đã duyệt", filter: ["APPROVED"], activeColor: "#047857", badgeBg: "#f1f5f9", badgeColor: "#475569" },
    { label: "Từ chối / cần bổ sung", filter: ["NEED_INFO", "REJECTED"], activeColor: "#e11d48", badgeBg: "#f1f5f9", badgeColor: "#475569" },
    { label: "Đang ẩn", filter: ["HIDDEN"], activeColor: "#334155", badgeBg: "#f1f5f9", badgeColor: "#475569" },
  ];

  const handleToggleHide = async (row) => {
    const isHidden = row.status === "HIDDEN";
    try {
      await sellerApi.product.changeVisibility(row.id, !isHidden);
      loadSellerProducts();
    } catch (err) {
      updateProductStatus(row.id, isHidden ? "APPROVED" : "HIDDEN");
      setProducts(getSharedProducts());
    }
  };

  const handleSubmitDraft = async (id) => {
    try {
      await sellerApi.product.submit(id);
      alert("Đã gửi duyệt sản phẩm thành công!");
      loadSellerProducts();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Không thể gửi duyệt");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá sản phẩm này?")) return;
    try {
      await sellerApi.product.delete(id);
      alert("Đã xoá sản phẩm!");
      loadSellerProducts();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Không thể xoá sản phẩm");
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    const currentFilter = tabs[tabValue].filter;
    if (currentFilter) {
      result = result.filter(p => currentFilter.includes(p.status));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name || "").toLowerCase().includes(q) || 
        String(p.id || "").toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter(p => {
        const cat = (typeof p.category === 'object' ? p.category?.name : (p.category || "")).toLowerCase();
        if (categoryFilter === "rau-la") return cat.includes("rau") || cat.includes("lá");
        if (categoryFilter === "trai-cay") return cat.includes("trái cây") || cat.includes("quả") || cat.includes("nhiệt đới");
        if (categoryFilter === "cu-qua") return cat.includes("củ") || cat.includes("khoai");
        return true;
      });
    }
    return result;
  }, [tabValue, products, searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const mapStatusConfig = (status) => {
    switch (status) {
      case "DRAFT": return { text: "Nháp", style: { border: "1px dashed #cbd5e1", color: "#64748b", bgcolor: "#f8fafc" } };
      case "PENDING": return { text: "Chờ duyệt", style: { border: "1px dashed #cbd5e1", color: "#475569", bgcolor: "#f8fafc" } };
      case "APPROVED": return { text: "Đã duyệt", style: { border: "1px solid rgba(16, 185, 129, 0.4)", color: "#065f46", bgcolor: "#ecfdf5" } };
      case "REJECTED": return { text: "Từ chối", style: { bgcolor: "#0f172a", color: "#fff", border: "none" } };
      case "NEED_INFO": return { text: "Cần bổ sung", style: { border: "1px dashed #f59e0b", color: "#92400e", bgcolor: "#fff" } };
      case "HIDDEN": return { text: "Đang ẩn", style: { border: "1px solid #cbd5e1", color: "#64748b", bgcolor: "#f8fafc" } };
      default: return { text: status, style: { border: "1px solid #cbd5e1", color: "#475569", bgcolor: "#f8fafc" } };
    }
  };

  const formatAiLabel = (row) => {
    if (row.aiLabel?.text) return row.aiLabel.text;
    const label = row.aiOverallLabel;
    const confidence = row.aiOverallConfidence;
    if (!label) return "Chưa kiểm định";
    const percent = confidence ? `${Math.round(confidence * 100)}%` : "";
    switch (label) {
      case "FRESH": return `Tươi ${percent}`;
      case "SPOILED": return `Hỏng ${percent}`;
      case "UNSURE": return `UNCERTAIN`;
      default: return label;
    }
  };

  const mapAiConfig = (row) => {
    const isRotten = row.aiOverallLabel === "SPOILED" || row.aiOverallLabel === "ROTTEN" || row.aiLabel?.type === "rotten";
    const isUnsure = row.aiOverallLabel === "UNSURE" || row.aiOverallLabel === "UNCERTAIN" || row.aiLabel?.type === "uncertain";
    const isFresh = row.aiOverallLabel === "FRESH" || row.aiLabel?.type === "fresh";

    if (isRotten) return { border: "none", bgcolor: "#0f172a", color: "#fff" };
    if (isUnsure) return { border: "1px solid #fde68a", color: "#92400e", bgcolor: "#fffbeb", icon: true };
    if (isFresh) return { border: "1px solid #a7f3d0", color: "#047857", bgcolor: "#ecfdf5", icon: true };
    return { border: "1px solid #e2e8f0", bgcolor: "#f8fafc", color: "#64748b" }; // Chưa kiểm định
  };

  return (
    <Box sx={{ pb: 4, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Sản phẩm của shop
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Quản lý kho hàng, cập nhật thông tin và kết quả kiểm định chất lượng AI AgriFresh
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2, py: 0.75, bgcolor: "#ecfdf5", color: "#065f46", fontSize: 13, fontWeight: 600, borderRadius: 2, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <CheckCircle2 size={16} /> AI Verified Active · Tỷ lệ đạt chuẩn 92%
          </Box>
        </Box>
      </Box>

      {/* Main Container */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(226, 232, 240, 0.9)", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: "1px solid #f1f5f9", px: 1 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ sx: { bgcolor: tabs[tabValue].activeColor, height: 2 } }}
          >
            {tabs.map((tab, idx) => {
              const count = tab.filter 
                ? products.filter(p => tab.filter.includes(p.status)).length 
                : products.length;
              return (
                <Tab 
                  key={idx}
                  disableRipple
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {tab.label}
                      <Box sx={{ px: 1, py: 0.25, borderRadius: 10, fontSize: 11, fontWeight: 600, bgcolor: tab.badgeBg, color: tab.badgeColor }}>
                        {count}
                      </Box>
                    </Box>
                  } 
                  sx={{ 
                    textTransform: "none", 
                    fontWeight: tabValue === idx ? 700 : 500, 
                    color: tabValue === idx ? `${tab.activeColor} !important` : "#64748b",
                    fontSize: 13,
                    px: 3,
                    py: 2.5,
                    minHeight: "auto"
                  }} 
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Toolbar */}
        <Box sx={{ p: 2.5, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, flex: 1, minWidth: 280 }}>
            <TextField
              placeholder="Tìm sản phẩm của shop..."
              size="small"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              sx={{ width: { xs: "100%", sm: 320 }, "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc", borderRadius: 2, "& fieldset": { borderColor: "#e2e8f0" } } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search size={16} color="#94a3b8" /></InputAdornment>,
              }}
            />
            <TextField 
              select 
              size="small" 
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              sx={{ minWidth: 160, "& .MuiOutlinedInput-root": { bgcolor: "#f8fafc", borderRadius: 2, "& fieldset": { borderColor: "#e2e8f0" } } }} 
            >
              <MenuItem value="all">Tất cả danh mục</MenuItem>
              <MenuItem value="rau-la">Rau lá</MenuItem>
              <MenuItem value="trai-cay">Trái cây</MenuItem>
              <MenuItem value="cu-qua">Củ quả</MenuItem>
            </TextField>
          </Box>
          <Button 
            variant="contained" 
            sx={{ bgcolor: "#059669", "&:hover": { bgcolor: "#047857" }, textTransform: "none", fontWeight: 600, borderRadius: 2, px: 3, py: 1, boxShadow: "0 1px 2px rgba(16, 185, 129, 0.2)" }}
            component={Link}
            to="/seller/products/new"
            startIcon={<Plus size={18} strokeWidth={2.5} />}
          >
            Thêm sản phẩm
          </Button>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(248, 250, 252, 0.7)" }}>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", py: 1.5, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(226, 232, 240, 0.8)", pl: 4 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }}>Danh mục</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }}>Giá</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }} align="center">Tồn kho</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }} align="center">Nhãn AI</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }} align="center">Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(226, 232, 240, 0.8)" }} align="center">Đã bán</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid rgba(226, 232, 240, 0.8)", pr: 4 }} align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress color="success" />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length > 0 ? pagedProducts.map((row) => {
                const statusConf = mapStatusConfig(row.status);
                const aiConf = mapAiConfig(row);
                const imgUrl = resolveAssetUrl(row.imageUrl || row.primaryImageUrl);
                const categoryStr = typeof row.category === 'object' ? row.category?.name : (row.category || "---");
                const stockVal = row.inventory ?? row.stockQuantity ?? row.stock ?? 100;
                const unitStr = row.unit || "kg";

                return (
                  <TableRow key={row.id} sx={{ transition: "background 0.2s", "&:hover": { bgcolor: "rgba(248, 250, 252, 0.6)" } }}>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", py: 2, pl: 4 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "#f1f5f9", border: "1px solid rgba(226, 232, 240, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={row.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Typography sx={{ fontSize: 20 }}>📦</Typography>
                          )}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                            {row.name}
                            {row.status === "PENDING" && <Box component="span" sx={{ color: "#d97706", fontWeight: 400, fontSize: 11, ml: 1 }}>(Chờ duyệt)</Box>}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", mt: 0.25 }}>{row.id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", color: "#475569", fontSize: 13 }}>{categoryStr}</TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", color: "#1e293b", fontSize: 13, fontWeight: 600 }}>
                      {Number(row.price || 0).toLocaleString("vi-VN")} <Box component="span" sx={{ fontSize: 11, fontWeight: 400, color: "#64748b" }}>đ/{unitStr}</Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", fontSize: 13 }} align="center">
                      <Typography component="span" sx={{ color: "#1e293b", fontWeight: 600 }}>
                        {stockVal}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9" }} align="center">
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: 10, fontSize: 11, fontWeight: 600, ...aiConf }}>
                        {aiConf.icon && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: aiConf.color }} />}
                        {formatAiLabel(row)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", maxWidth: 180 }} align="center">
                      <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.25, py: 0.25, borderRadius: 10, fontSize: 11, fontWeight: 500, bgcolor: statusConf.style.bgcolor, color: statusConf.style.color, border: statusConf.style.border }}>
                        {statusConf.text}
                      </Box>
                      {row.rejectReason && (
                        <Typography sx={{ display: "block", color: "#94a3b8", mt: 0.5, lineHeight: 1.2, fontSize: 11 }}>
                          {row.rejectReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", color: "#334155", fontSize: 13, fontWeight: 600 }} align="center">{row.soldCount || 0}</TableCell>
                    <TableCell sx={{ borderBottom: "1px solid #f1f5f9", pr: 4 }} align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
                        <Typography component={Link} to={`/seller/products/${row.id}/edit`} sx={{ fontSize: 13, color: "#059669", textDecoration: "none", fontWeight: 600, "&:hover": { color: "#047857", textDecoration: "underline" } }}>Sửa</Typography>
                        {row.status === "APPROVED" && (
                          <>
                            <Box component="span" sx={{ color: "#cbd5e1" }}>|</Box>
                            <Typography onClick={() => handleToggleHide(row)} component="span" sx={{ fontSize: 13, color: "#64748b", textDecoration: "none", cursor: "pointer", "&:hover": { color: "#e11d48", textDecoration: "underline" } }}>Ẩn</Typography>
                          </>
                        )}
                        {row.status === "HIDDEN" && (
                          <>
                            <Box component="span" sx={{ color: "#cbd5e1" }}>|</Box>
                            <Typography onClick={() => handleToggleHide(row)} component="span" sx={{ fontSize: 13, color: "#059669", textDecoration: "none", cursor: "pointer", "&:hover": { color: "#047857", textDecoration: "underline" } }}>Bỏ ẩn</Typography>
                          </>
                        )}
                        {row.status === "DRAFT" && (
                          <>
                            <Box component="span" sx={{ color: "#cbd5e1" }}>|</Box>
                            <Typography onClick={() => handleSubmitDraft(row.id)} component="span" sx={{ fontSize: 13, color: "#2563eb", textDecoration: "none", cursor: "pointer", "&:hover": { color: "#1d4ed8", textDecoration: "underline" } }}>Gửi duyệt</Typography>
                            <Box component="span" sx={{ color: "#cbd5e1" }}>|</Box>
                            <Typography onClick={() => handleDeleteProduct(row.id)} component="span" sx={{ fontSize: 13, color: "#e11d48", textDecoration: "none", cursor: "pointer", "&:hover": { color: "#be123c", textDecoration: "underline" } }}>Xoá</Typography>
                          </>
                        )}
                        {row.status === "REJECTED" && (
                          <>
                            <Box component="span" sx={{ color: "#cbd5e1" }}>|</Box>
                            <Typography onClick={() => handleDeleteProduct(row.id)} component="span" sx={{ fontSize: 13, color: "#e11d48", textDecoration: "none", cursor: "pointer", "&:hover": { color: "#be123c", textDecoration: "underline" } }}>Xoá</Typography>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">Không tìm thấy sản phẩm nào.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination Block */}
        <Box sx={{ px: 3, py: 2, borderTop: "1px solid rgba(226, 232, 240, 0.8)", display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#fff" }}>
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>
            Hiển thị <Box component="span" sx={{ fontWeight: 600, color: "#1e293b" }}>{filteredProducts.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-{Math.min(page * PAGE_SIZE, filteredProducts.length)}</Box> trong tổng số <Box component="span" sx={{ fontWeight: 600, color: "#1e293b" }}>{filteredProducts.length}</Box> sản phẩm
          </Typography>
          {totalPages > 1 && (
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(_, p) => setPage(p)}
              size="small" 
              sx={{ "& .MuiPaginationItem-root": { fontSize: 13, fontWeight: 600 }, "& .Mui-selected": { bgcolor: "#059669 !important", color: "#fff" } }} 
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
}
