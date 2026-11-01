import { useState, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Link,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { Plus, Edit2, Trash2, FolderTree, CornerDownRight } from "lucide-react";
import { adminApi } from "../../services/api";
import { apiErrorMessage } from "../../utils/format";

export default function AdminCategoriesPage() {
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  // Dialog Thêm / Sửa
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = tạo mới
  const [form, setForm] = useState({
    name: "",
    parentId: "",
    description: "",
    imageUrl: "",
    displayOrder: 0,
    isActive: true,
    aiProduceKeys: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.category.getAll();
      setCategoryTree(data || []);
    } catch (err) {
      console.warn("Lỗi khi tải danh mục:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Danh mục gốc (chỉ root mới làm cha được - cây 2 cấp)
  const rootCategories = categoryTree;

  const handleOpenCreate = (preselectedParentId = "") => {
    setEditingId(null);
    setForm({
      name: "",
      parentId: preselectedParentId ? String(preselectedParentId) : "",
      description: "",
      imageUrl: "",
      displayOrder: 0,
      isActive: true,
      aiProduceKeys: ""
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat, parentId = null) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      parentId: parentId ? String(parentId) : "",
      description: cat.description || "",
      imageUrl: cat.imageUrl || "",
      displayOrder: cat.displayOrder ?? 0,
      isActive: cat.isActive !== false,
      aiProduceKeys: cat.aiProduceKeys || ""
    });
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Tên danh mục không được để trống.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        parentId: form.parentId ? Number(form.parentId) : null,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
        aiProduceKeys: form.aiProduceKeys.trim() || null
      };

      if (editingId) {
        await adminApi.category.update(editingId, payload);
        setToastMsg(`Đã cập nhật danh mục "${payload.name}"`);
      } else {
        await adminApi.category.create(payload);
        setToastMsg(`Đã tạo danh mục "${payload.name}" thành công`);
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể lưu danh mục"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Bạn có chắc muốn xoá danh mục "${cat.name}"? Thao tác này không thể hoàn tác.`)) return;

    try {
      await adminApi.category.delete(cat.id);
      setToastMsg(`Đã xoá danh mục "${cat.name}"`);
      fetchCategories();
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể xoá danh mục (đang có danh mục con hoặc sản phẩm liên quan)"));
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs separator="/" sx={{ mb: 1, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Tổng quan
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          Quản lý danh mục
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#0f172a" }}>
            Cây danh mục nông sản (2 cấp)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý phân loại sản phẩm, ảnh đại diện và từ khoá nhận diện AI
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => handleOpenCreate("")}
          sx={{ textTransform: "none", bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
        >
          Thêm danh mục mới
        </Button>
      </Box>

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Tên danh mục</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Thứ tự</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="center">Sản phẩm</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Từ khoá AI (aiProduceKeys)</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>Trạng thái</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13 }} align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categoryTree.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  {loading ? "Đang tải cây danh mục..." : "Chưa có danh mục nào."}
                </TableCell>
              </TableRow>
            ) : (
              categoryTree.map((root) => (
                <>
                  {/* Danh mục cha (Root) */}
                  <TableRow key={`root-${root.id}`} sx={{ bgcolor: "rgba(248, 250, 252, 0.7)" }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FolderTree size={16} color="#0f172a" />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a" }}>
                            {root.name}
                          </Typography>
                          {root.description && (
                            <Typography variant="caption" color="text.secondary">
                              {root.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "#64748b" }}>{root.slug}</TableCell>
                    <TableCell align="center" sx={{ fontSize: 13 }}>{root.displayOrder ?? 0}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 13 }}>
                      {root.productCount ?? 0}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: "#0284c7" }}>
                      {root.aiProduceKeys || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={root.isActive ? "Hiển thị" : "Đã ẩn"}
                        color={root.isActive ? "success" : "default"}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Plus size={12} />}
                        onClick={() => handleOpenCreate(root.id)}
                        sx={{ textTransform: "none", fontSize: 11, mr: 1 }}
                      >
                        Thêm con
                      </Button>
                      <IconButton size="small" onClick={() => handleOpenEdit(root, null)}>
                        <Edit2 size={15} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(root)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Danh mục con (Children) */}
                  {root.children?.map((child) => (
                    <TableRow key={`child-${child.id}`} hover>
                      <TableCell sx={{ pl: 5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CornerDownRight size={14} color="#94a3b8" />
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: 13 }}>
                            {child.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#64748b" }}>{child.slug}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 13 }}>{child.displayOrder ?? 0}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: 13 }}>
                        {child.productCount ?? 0}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#0284c7" }}>
                        {child.aiProduceKeys || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={child.isActive ? "Hiển thị" : "Đã ẩn"}
                          color={child.isActive ? "success" : "default"}
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenEdit(child, root.id)}>
                          <Edit2 size={15} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(child)}>
                          <Trash2 size={15} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog Tạo / Sửa Danh mục */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {editingId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Tên danh mục"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Select
              size="small"
              fullWidth
              displayEmpty
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <MenuItem value="">(Không có) — Là danh mục cha gốc</MenuItem>
              {rootCategories
                .filter((r) => r.id !== editingId)
                .map((r) => (
                  <MenuItem key={r.id} value={String(r.id)}>
                    Thuộc cha: {r.name}
                  </MenuItem>
                ))}
            </Select>

            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Mô tả"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  size="small"
                  label="Thứ tự hiển thị"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                  }
                  label="Hiển thị công khai"
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              label="Từ khoá AI (aiProduceKeys)"
              helperText="Cách nhau dấu phẩy. VD: mango,apple,banana,orange"
              value={form.aiProduceKeys}
              onChange={(e) => setForm({ ...form, aiProduceKeys: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
              Huỷ
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ bgcolor: "#0f172a", "&:hover": { bgcolor: "#1e293b" } }}
            >
              {submitting ? "Đang lưu..." : "Lưu danh mục"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={Boolean(toastMsg)}
        autoHideDuration={4000}
        onClose={() => setToastMsg("")}
        message={toastMsg}
      />
    </Box>
  );
}
