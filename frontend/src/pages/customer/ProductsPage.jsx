import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { productApi } from "../../services/api";

const SLUG_TO_NAME = {
  "rau-cu": "Rau củ",
  "trai-cay": "Trái cây",
  "nam": "Nấm tươi",
  "thuc-pham-kho": "Thực phẩm khô",
  "dac-san": "Đặc sản",
};

function removeVietnameseTones(str) {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}

export default function ProductsPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const searchQuery = searchParams.get("search") || searchParams.get("keyword") || "";
  const initialSort = searchParams.get("sort") || "newest";
  const [sortBy, setSortBy] = useState(initialSort);
  const [aiFilter, setAiFilter] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedOrigins, setSelectedOrigins] = useState([]);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  // Load products from backend API (with productStore fallback)
  useEffect(() => {
    let ignore = false;
    async function loadProducts() {
      setLoading(true);
      try {
        let allProducts = [];
        try {
          const res = await productApi.getAll({ size: 100, sort: "newest" });
          allProducts = res?.content || (Array.isArray(res) ? res : []);
        } catch (apiErr) {
          console.warn("Lỗi gọi productApi /products, fallback mock data:", apiErr.message);
          const { getSharedProducts } = await import("../../data/productStore");
          allProducts = getSharedProducts().filter(p => p.status === "APPROVED");
        }
        
        allProducts = allProducts.map(p => ({
          ...p,
          price: Number(p.price) || 0,
          originalPrice: p.originalPrice || Math.floor((Number(p.price) || 0) * 1.2),
          category: typeof p.category === 'object' ? p.category?.name : (p.category || ""),
          seller: p.shop?.shopName || p.seller || "Nông sản sạch",
          origin: p.origin || p.shop?.province || "Việt Nam",
          imageUrl: p.primaryImageUrl || p.imageUrl,
          aiGrade: p.aiGrade || (p.aiOverallLabel === "FRESH" ? "Tươi sạch AI" : (p.aiOverallLabel === "ROTTEN" ? "Hỏng" : "Kiểm định AI")),
        }));

        if (!ignore) {
          setRawProducts(allProducts);
        }
      } catch (err) {
        if (!ignore) console.error("Error loading products:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadProducts();
    return () => { ignore = true; };
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [slug, searchQuery, sortBy, aiFilter, minPrice, maxPrice, selectedOrigins]);

  // Handle origin toggle
  const toggleOrigin = (origin) => {
    setSelectedOrigins(prev => 
      prev.includes(origin) ? prev.filter(o => o !== origin) : [...prev, origin]
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setAiFilter(false);
    setMinPrice("");
    setMaxPrice("");
    setSelectedOrigins([]);
    setSortBy("newest");
    if (searchQuery) {
      searchParams.delete("search");
      searchParams.delete("keyword");
      setSearchParams(searchParams);
    }
    if (slug) {
      navigate("/products");
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return rawProducts.filter(p => {
      // 1. Category Filter
      if (slug) {
        const cat = (p.category || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        if (slug === "rau-cu") {
          const match = cat.includes("rau") || cat.includes("củ") || name.includes("rau") || name.includes("cà chua") || name.includes("khoai") || name.includes("cà rốt") || name.includes("cải");
          if (!match) return false;
        } else if (slug === "trai-cay") {
          const match = cat.includes("trái cây") || cat.includes("quả") || cat.includes("nhiệt đới") || name.includes("xoài") || name.includes("chuối") || name.includes("sầu riêng") || name.includes("cam") || name.includes("bưởi") || name.includes("táo") || name.includes("ổi");
          if (!match) return false;
        } else if (slug === "nam") {
          const match = cat.includes("nấm") || name.includes("nấm");
          if (!match) return false;
        } else if (slug === "thuc-pham-kho") {
          const match = cat.includes("khô") || name.includes("gạo") || name.includes("hạt") || name.includes("đậu") || name.includes("tiêu");
          if (!match) return false;
        } else if (slug === "dac-san") {
          const match = cat.includes("đặc sản") || name.includes("mật ong") || name.includes("chè") || name.includes("trà");
          if (!match) return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const qRaw = searchQuery.toLowerCase().trim();
        const qNorm = removeVietnameseTones(qRaw);
        const nameRaw = (p.name || "").toLowerCase();
        const nameNorm = removeVietnameseTones(nameRaw);
        const catRaw = (p.category || "").toLowerCase();
        const catNorm = removeVietnameseTones(catRaw);
        const sellerRaw = (p.seller || "").toLowerCase();
        const sellerNorm = removeVietnameseTones(sellerRaw);

        const match = 
          nameRaw.includes(qRaw) || nameNorm.includes(qNorm) ||
          catRaw.includes(qRaw) || catNorm.includes(qNorm) ||
          sellerRaw.includes(qRaw) || sellerNorm.includes(qNorm);

        if (!match) return false;
      }

      // 3. AI Fresh Filter
      if (aiFilter) {
        const isFresh = 
          p.aiOverallLabel === "FRESH" || 
          p.aiLabel?.type === "fresh" || 
          (p.aiLabel?.confidence && p.aiLabel.confidence >= 0.8) || 
          (p.freshnessScore && p.freshnessScore >= 85);
        if (!isFresh) return false;
      }

      // 4. Price Filter
      const priceNum = Number(p.price);
      if (minPrice && !isNaN(minPrice) && priceNum < Number(minPrice)) {
        return false;
      }
      if (maxPrice && !isNaN(maxPrice) && priceNum > Number(maxPrice)) {
        return false;
      }

      // 5. Origin Filter
      if (selectedOrigins.length > 0) {
        const loc = ((p.location || "") + " " + (p.origin || "") + " " + (p.seller || "")).toLowerCase();
        const matchesOrigin = selectedOrigins.some(o => loc.includes(o.toLowerCase()));
        if (!matchesOrigin) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      if (sortBy === "best_seller") return (b.soldCount || 0) - (a.soldCount || 0);
      return 0; // "newest" keep store order
    });
  }, [rawProducts, slug, searchQuery, aiFilter, minPrice, maxPrice, selectedOrigins, sortBy]);

  // Paginated products
  const totalElements = filteredProducts.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1;
  const displayedProducts = filteredProducts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const categoryName = slug && SLUG_TO_NAME[slug] 
    ? SLUG_TO_NAME[slug] 
    : (searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : "Tất cả sản phẩm");

  return (
    <div className="category-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{categoryName}</span>
      </div>

      <div className="category-layout">
        {/* Sidebar Filters */}
        <aside className="sidebar-filters">
          <div className="filter-section">
            <h3 className="filter-title">Danh mục <span className="info-icon">i</span></h3>
            <div className="filter-list">
              <Link to="/products" style={{textDecoration: 'none', display: 'block', marginBottom: '8px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={!slug} readOnly /> Tất cả sản phẩm
                </label>
              </Link>

              <Link to="/category/rau-cu" style={{textDecoration: 'none', display: 'block', marginBottom: '8px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={slug === "rau-cu"} readOnly /> Rau củ
                </label>
              </Link>
              
              <Link to="/category/trai-cay" style={{textDecoration: 'none', display: 'block', marginBottom: '8px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={slug === "trai-cay"} readOnly /> Trái cây
                </label>
              </Link>

              <Link to="/category/nam" style={{textDecoration: 'none', display: 'block', marginBottom: '8px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={slug === "nam"} readOnly /> Nấm tươi
                </label>
              </Link>

              <Link to="/category/thuc-pham-kho" style={{textDecoration: 'none', display: 'block', marginBottom: '8px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={slug === "thuc-pham-kho"} readOnly /> Thực phẩm khô
                </label>
              </Link>
              
              <Link to="/category/dac-san" style={{textDecoration: 'none', display: 'block', marginBottom: '8px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={slug === "dac-san"} readOnly /> Đặc sản
                </label>
              </Link>
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Khoảng giá (VNĐ)</h3>
            <div className="price-inputs">
              <input 
                type="number" 
                placeholder="Từ" 
                className="price-input" 
                value={minPrice} 
                onChange={e => setMinPrice(e.target.value)} 
              />
              <span>-</span>
              <input 
                type="number" 
                placeholder="Đến" 
                className="price-input" 
                value={maxPrice} 
                onChange={e => setMaxPrice(e.target.value)} 
              />
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Nhãn chất lượng AI <span className="info-icon">i</span></h3>
            <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
              <input 
                type="checkbox" 
                className="ai-checkbox" 
                checked={aiFilter} 
                onChange={e => setAiFilter(e.target.checked)} 
              />
              <span>Chỉ hiện sản phẩm AI đánh giá Tươi</span>
            </label>
            <p className="filter-help-text">Lọc các sản phẩm đã đạt chuẩn AI Freshness &gt; 85%.</p>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Xuất xứ</h3>
            <div className="filter-list">
              {["Đà Lạt", "Đồng Tháp", "Sơn La"].map(origin => (
                <label key={origin} className="checkbox-label" style={{cursor: 'pointer'}}>
                  <input 
                    type="checkbox" 
                    checked={selectedOrigins.includes(origin)}
                    onChange={() => toggleOrigin(origin)}
                  /> 
                  {origin}
                </label>
              ))}
            </div>
          </div>

          <button className="clear-filter-btn" onClick={handleClearFilters}>
            Xóa bộ lọc
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-product-area">
          <div className="product-area-header">
            <div className="result-count">
              Tìm thấy <strong>{totalElements}</strong> sản phẩm trong "{categoryName}"
            </div>
            <div className="sort-dropdown">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Sắp xếp: Mới nhất</option>
                <option value="best_seller">Sắp xếp: Bán chạy nhất</option>
                <option value="priceAsc">Giá: Thấp đến Cao</option>
                <option value="priceDesc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="products-grid-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="product-skeleton-card" style={{height: "300px"}}></div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
              <p style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>Không tìm thấy sản phẩm phù hợp</p>
              <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>Vui lòng thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              <button 
                onClick={handleClearFilters}
                style={{ padding: "8px 20px", background: "#00A651", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="products-grid-3">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} / {totalElements}
              </div>
              <div className="pagination-controls">
                <button 
                  className="page-nav-btn" 
                  disabled={page === 0}
                  onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, 0); }}
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx} 
                    className={`page-num-btn ${page === idx ? 'active' : ''}`}
                    onClick={() => { setPage(idx); window.scrollTo(0, 0); }}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  className="page-nav-btn" 
                  disabled={page >= totalPages - 1}
                  onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, 0); }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
