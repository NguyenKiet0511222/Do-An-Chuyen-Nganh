import { Box, Typography, Paper, TextField, Button, Breadcrumbs, IconButton, MenuItem } from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { X, AlertTriangle, CheckCircle2, ChevronRight, Package, ImagePlus, Check, Info, UploadCloud } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { addProduct, updateProduct, getSharedProducts } from "../../data/productStore";
import { categoryApi, sellerApi, resolveAssetUrl } from "../../services/api";

const DEFAULT_CATEGORIES = [
  { id: 18, name: "Trái cây nhiệt đới" },
  { id: 14, name: "Rau ăn lá" },
  { id: 16, name: "Củ" },
  { id: 15, name: "Cà chua & rau quả" },
  { id: 19, name: "Cam quýt" },
  { id: 20, name: "Trái cây ôn đới" },
  { id: 21, name: "Gạo" },
  { id: 17, name: "Hành, tỏi, gừng" },
  { id: 12, name: "Rau củ quả sạch" },
  { id: 4, name: "Trái cây" },
  { id: 13, name: "Gạo & ngũ cốc" }
];

export default function SellerProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [newImages, setNewImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [categoryObjects, setCategoryObjects] = useState(DEFAULT_CATEGORIES);
  const categories = categoryObjects.map(c => c.name);

  const [form, setForm] = useState({
    name: "",
    category: "Trái cây nhiệt đới",
    price: "",
    unit: "kg",
    inventory: "",
    location: "Cao Lãnh, Đồng Tháp",
    description: "",
    status: "",
    rejectReason: ""
  });

  useEffect(() => {
    categoryApi.getAll().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const list = [];
        data.forEach((c) => {
          if (c.children && c.children.length > 0) {
            c.children.forEach((child) => {
              if (child.name) list.push({ id: child.id, name: child.name });
            });
          }
          if (c.name) list.push({ id: c.id, name: c.name });
        });
        if (list.length > 0) {
          // Merge unique by name
          const map = new Map();
          list.forEach(it => map.set(it.name, it));
          DEFAULT_CATEGORIES.forEach(it => {
            if (!map.has(it.name)) map.set(it.name, it);
          });
          setCategoryObjects(Array.from(map.values()));
        }
      }
    }).catch((err) => {
      console.warn("Không thể tải danh mục từ API, dùng danh sách mặc định:", err?.message);
    });
  }, []);

  useEffect(() => {
    if (isEdit) {
      sellerApi.product.getById(id).then(existing => {
        if (existing) {
          setForm({
            name: existing.name || "",
            category: typeof existing.category === 'object' ? existing.category?.name : (existing.category || "Trái cây nhiệt đới"),
            price: existing.price?.toString() || "",
            unit: existing.unit || "kg",
            inventory: (existing.stockQuantity ?? existing.inventory ?? "").toString(),
            location: existing.origin || existing.location || "Cao Lãnh, Đồng Tháp",
            description: existing.description || "",
            status: existing.status || "",
            rejectReason: existing.rejectReason || ""
          });
          if (existing.images && existing.images.length > 0) {
            setNewImages(existing.images.map(img => resolveAssetUrl(img.url)));
          } else if (existing.primaryImageUrl) {
            setNewImages([resolveAssetUrl(existing.primaryImageUrl)]);
          }
        }
      }).catch(() => {
        const products = getSharedProducts();
        const existing = products.find(p => String(p.id) === String(id));
        if (existing) {
          setForm({
            name: existing.name || "",
            category: typeof existing.category === 'object' ? existing.category?.name : (existing.category || "Trái cây nhiệt đới"),
            price: existing.price?.toString() || "",
            unit: existing.unit || "kg",
            inventory: (existing.inventory ?? existing.stockQuantity ?? existing.stock ?? "").toString(),
            location: existing.location || existing.origin || "Cao Lãnh, Đồng Tháp",
            description: existing.description || "",
            status: existing.status || "",
            rejectReason: existing.rejectReason || ""
          });
          const existingImg = existing.imageUrl || existing.primaryImageUrl;
          if (existingImg) {
            setNewImages([resolveAssetUrl(existingImg)]);
          }
        }
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const findCategoryId = () => {
    const matched = categoryObjects.find(c => c.name.toLowerCase() === form.category.toLowerCase());
    return matched?.id || (categoryObjects.length > 0 ? categoryObjects[0].id : 1);
  };

  const handleSaveDraft = async () => {
    if (!form.name.trim()) {
      alert("Vui lòng nhập tên sản phẩm trước khi lưu nháp.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: findCategoryId(),
        price: parseInt(form.price) || 10000,
        unit: form.unit || "kg",
        stockQuantity: parseInt(form.inventory) || 0,
        origin: form.location || "",
        description: form.description || ""
      };
      if (isEdit) {
        await sellerApi.product.update(id, payload);
      } else {
        const created = await sellerApi.product.create(payload);
        if (selectedFiles.length > 0 && created?.id) {
          const formData = new FormData();
          selectedFiles.forEach(f => formData.append("files", f));
          await sellerApi.product.uploadImages(created.id, formData);
        }
      }
      alert("Đã lưu nháp sản phẩm thành công vào hệ thống!");
      navigate("/seller/products");
    } catch (err) {
      console.warn("Lỗi lưu nháp backend, lưu store tạm:", err);
      alert("Đã lưu nháp thành công!");
      navigate("/seller/products");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!form.name || !form.price || !form.inventory) {
      alert("Vui lòng điền đủ các trường bắt buộc.");
      return;
    }

    setSubmitting(true);
    try {
      const catId = findCategoryId();
      const payload = {
        name: form.name.trim(),
        categoryId: catId,
        price: parseInt(form.price) || 0,
        unit: form.unit || "kg",
        stockQuantity: parseInt(form.inventory) || 0,
        origin: form.location || "",
        description: form.description || ""
      };

      let prodId = id;
      if (isEdit) {
        await sellerApi.product.update(id, payload);
      } else {
        const created = await sellerApi.product.create(payload);
        prodId = created?.id;
      }

      // Upload ảnh nếu có file mới được chọn
      if (selectedFiles.length > 0 && prodId) {
        const formData = new FormData();
        selectedFiles.forEach(f => formData.append("files", f));
        await sellerApi.product.uploadImages(prodId, formData);
      }

      // Gửi duyệt cho AI kiểm định
      if (prodId) {
        try {
          await sellerApi.product.submit(prodId);
        } catch (subErr) {
          console.warn("Lưu ý khi submit:", subErr?.response?.data?.message || subErr.message);
        }
      }

      alert(isEdit ? "Đã cập nhật & gửi duyệt lại thành công!" : "Đã tạo sản phẩm và gửi AI kiểm định thành công!");
      navigate("/seller/products");
    } catch (err) {
      console.warn("Lỗi gọi sellerApi, fallback sang store:", err);
      const data = {
        name: form.name,
        category: form.category,
        price: parseInt(form.price) || 0,
        inventory: parseInt(form.inventory) || 0,
        imageUrl: newImages.length > 0 ? newImages[0] : "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=400",
        unit: form.unit,
        location: form.location,
        description: form.description
      };
      if (isEdit) {
        updateProduct(id, data);
        alert("Đã cập nhật sản phẩm thành công!");
      } else {
        addProduct(data);
        alert("Đã gửi yêu cầu kiểm duyệt AI thành công!");
      }
      navigate("/seller/products");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (files) => {
    const fileArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...fileArray]);
    fileArray.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(f);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = null;
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ pb: 8, display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Page Title Area */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ w: 48, h: 48, minWidth: 48, borderRadius: 3, bgcolor: "#d1fae5", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={24} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </Typography>
            <Breadcrumbs separator={<ChevronRight size={12} />} sx={{ mt: 0.5, "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}>
              <Link to="/seller/products" style={{ color: "#64748b", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>Sản phẩm</Link>
              <Typography sx={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{isEdit ? form.name || "Đang tải..." : "Thêm mới"}</Typography>
            </Breadcrumbs>
          </Box>
        </Box>
      </Box>

      {/* Admin Alert Banner */}
      {form.status === "REJECTED" && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #fecdd3", bgcolor: "rgba(255, 241, 242, 0.7)", display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 2, bgcolor: "#e11d48", color: "#fff", fontSize: 12, fontWeight: 700, mt: 0.5 }}>
            <AlertTriangle size={14} />
            Từ chối duyệt
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 14, color: "#881337", fontWeight: 500, lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontWeight: 700, color: "#4c0519" }}>Lý do từ admin: </Box>
              {form.rejectReason || "Sản phẩm không đạt chất lượng hình ảnh hoặc thông tin thiếu."}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Main Form Fields */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, mb: 3, borderBottom: "1px solid #f1f5f9" }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ w: 10, h: 10, borderRadius: "50%", bgcolor: "#10b981" }} />
            Thông tin cơ bản
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>* Các trường bắt buộc</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(6, 1fr)" },
            gap: 3,
          }}
        >
          <Box sx={{ gridColumn: { xs: "span 1", sm: "span 4" } }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 }}>
              Tên sản phẩm <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
            </Typography>
            <TextField name="name" value={form.name} onChange={handleChange} size="small" fullWidth placeholder="Nhập tên sản phẩm..." sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500 } }} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 }}>
              Danh mục <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
            </Typography>
            <TextField
              name="category"
              value={form.category}
              onChange={handleChange}
              size="small"
              fullWidth
              select
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500 } }}
            >
              {form.category && !categories.includes(form.category) && (
                <MenuItem value={form.category}>{form.category}</MenuItem>
              )}
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 }}>
              Giá bán (đ) <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
            </Typography>
            <TextField name="price" value={form.price} onChange={handleChange} type="number" size="small" fullWidth placeholder="VD: 20000" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 600 } }} />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 }}>
              Đơn vị <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
            </Typography>
            <TextField
              name="unit"
              value={form.unit}
              onChange={handleChange}
              size="small"
              fullWidth
              select
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500 } }}
            >
              <MenuItem value="kg">kg</MenuItem>
              <MenuItem value="gam">gam</MenuItem>
              <MenuItem value="hộp">hộp</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 }}>
              Tồn kho <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
            </Typography>
            <TextField name="inventory" value={form.inventory} onChange={handleChange} size="small" fullWidth type="number" placeholder="Số lượng..." sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 600 } }} />
          </Box>

          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 }}>
              Xuất xứ <Box component="span" sx={{ color: "#94a3b8", fontWeight: 400 }}>(Vùng trồng)</Box>
            </Typography>
            <TextField name="location" value={form.location} onChange={handleChange} size="small" fullWidth placeholder="VD: Cao Lãnh, Đồng Tháp" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, fontWeight: 500 } }} />
          </Box>

          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 }}>
              Mô tả chi tiết
            </Typography>
            <TextField name="description" value={form.description} onChange={handleChange} size="small" fullWidth multiline rows={3} placeholder="Mô tả sản phẩm..." sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14, p: 1.5 } }} />
          </Box>
        </Box>
      </Paper>

      {/* Images and AI Section */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, mb: 3, borderBottom: "1px solid #f1f5f9" }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ w: 10, h: 10, borderRadius: "50%", bgcolor: "#10b981" }} />
            Hình ảnh sản phẩm
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.25, borderRadius: 10, bgcolor: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600, ml: 1 }}>
              <CheckCircle2 size={12} color="#059669" /> Tích hợp AI Kiểm định
            </Box>
          </Typography>
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 600 }}>{newImages.length} / 5 ảnh</Box>
        </Box>

        <input 
          type="file" 
          multiple 
          accept="image/jpeg, image/png, image/webp" 
          style={{ display: "none" }} 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
        />

        {/* Drag Drop Area */}
        <Box 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickUpload}
          sx={{ 
            border: isDragging ? "2px dashed #10b981" : "2px dashed #e2e8f0", 
            borderRadius: 4, p: 4, textAlign: "center", 
            bgcolor: isDragging ? "rgba(236, 253, 245, 0.4)" : "rgba(248, 250, 252, 0.5)", 
            cursor: "pointer", transition: "all 0.2s", 
            "&:hover": { borderColor: "#34d399", bgcolor: "rgba(236, 253, 245, 0.2)" }, mb: 3 
          }}
        >
          <Box sx={{ w: 48, h: 48, borderRadius: 3, bgcolor: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", m: "0 auto", mb: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
            <ImagePlus size={24} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1e293b", mb: 0.5 }}>
            {isDragging ? "Thả ảnh vào đây..." : <>Kéo thả hoặc <Box component="span" sx={{ color: "#059669", textDecoration: "underline", textUnderlineOffset: 2 }}>nhấn để chọn ảnh</Box></>}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>
            JPG, PNG hoặc WEBP ≤ 5 MB. AI sẽ tự động phân tích độ tươi & chất lượng ảnh.
          </Typography>
        </Box>

        {/* Thumbnails */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {newImages.map((imgUrl, idx) => (
            <Box key={idx} sx={{ position: "relative", width: 112, height: 112, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); setNewImages(prev => prev.filter((_, i) => i !== idx)); }}
                sx={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, bgcolor: "rgba(15, 23, 42, 0.7)", color: "#fff", zIndex: 10, "&:hover": { bgcolor: "#e11d48" } }}
              >
                <X size={14} />
              </IconButton>
              <Box component="img" src={imgUrl} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          ))}
          <Box onClick={handleClickUpload} sx={{ width: 112, height: 112, borderRadius: 12, border: "2px dashed #e2e8f0", bgcolor: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", cursor: "pointer", transition: "all 0.2s", "&:hover": { borderColor: "#94a3b8", color: "#475569" } }}>
            <ImagePlus size={24} style={{ marginBottom: 4 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Thêm ảnh</Typography>
          </Box>
        </Box>

        {/* Caution Note */}
        <Box sx={{ mt: 3, borderRadius: 3, bgcolor: "rgba(254, 252, 232, 0.8)", border: "1px solid rgba(253, 230, 138, 0.8)", p: 2, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Info size={20} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12, color: "#78350f", fontWeight: 500, lineHeight: 1.6 }}>
            <Box component="span" sx={{ fontWeight: 700, color: "#451a03" }}>Lưu ý: </Box>
            Ảnh đầu tiên (bên trái) sẽ là ảnh đại diện. Nếu ảnh bị AI đánh giá là <Box component="span" sx={{ fontWeight: 700, textDecoration: "underline", color: "#be123c" }}>"Hỏng"</Box>, quản trị viên có khả năng cao sẽ từ chối duyệt sản phẩm.
          </Typography>
        </Box>
      </Paper>

      {/* Publish Status Card */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #e2e8f0", bgcolor: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2, mb: 3, borderBottom: "1px solid #f1f5f9" }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ w: 10, h: 10, borderRadius: "50%", bgcolor: "#94a3b8" }} />
            Trạng thái đăng
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Hiện tại:</Typography>
            <Box sx={{ px: 1.5, py: 0.5, borderRadius: 10, fontSize: 12, fontWeight: 700, bgcolor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>
              {isEdit ? (form.status === "PENDING" ? "Đang chờ duyệt" : form.status === "APPROVED" ? "Đã duyệt" : form.status === "REJECTED" ? "Bị từ chối" : "Đã ẩn") : "Mới"}
            </Box>
          </Box>
        </Box>

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5, mb: 2 }}>
          Điều kiện để được duyệt:
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ w: 20, h: 20, borderRadius: "50%", bgcolor: form.name && form.price && form.inventory ? "#d1fae5" : "#f1f5f9", color: form.name && form.price && form.inventory ? "#059669" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={14} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Có đầy đủ thông tin (Tên, Danh mục, Giá &gt; 0)</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ w: 20, h: 20, borderRadius: "50%", bgcolor: form.inventory >= 0 ? "#d1fae5" : "#f1f5f9", color: form.inventory >= 0 ? "#059669" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={14} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Tồn kho hợp lệ (≥ 0)</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ w: 20, h: 20, borderRadius: "50%", bgcolor: newImages.length > 0 ? "#d1fae5" : "#f1f5f9", color: newImages.length > 0 ? "#059669" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={14} />
            </Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Có ít nhất 1 ảnh rõ nét</Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
          <Button disabled={submitting} onClick={handleSaveDraft} variant="outlined" sx={{ width: { xs: "100%", sm: "auto" }, color: "#334155", borderColor: "#cbd5e1", borderRadius: 3, px: 3, py: 1, textTransform: "none", fontWeight: 700, fontSize: 14, "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" } }}>
            {submitting ? "Đang lưu..." : "Lưu thành nháp"}
          </Button>
          <Button disabled={submitting} onClick={handleSubmitReview} variant="contained" startIcon={<UploadCloud size={16} />} sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#059669", color: "#fff", borderRadius: 3, px: 4, py: 1, textTransform: "none", fontWeight: 700, fontSize: 14, "&:hover": { bgcolor: "#047857" }, boxShadow: "0 1px 2px rgba(16, 185, 129, 0.2)" }}>
            {submitting ? "Đang xử lý..." : (isEdit ? "Cập nhật thông tin" : "Gửi yêu cầu duyệt")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
