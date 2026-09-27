import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { productApi } from "../../services/api";
import ProductCard from "../../components/ProductCard";
import { ChevronRight, ChevronLeft } from "lucide-react";

const SLUG_TO_CATEGORY_ID = {
  "rau-cu": 1,
  "trai-cay": 2,
  "nam": 3,
  "thuc-pham-kho": 4,
  "dac-san": 5,
};

const SLUG_TO_NAME = {
  "rau-cu": "Rau củ",
  "trai-cay": "Trái cây",
  "nam": "Nấm",
  "thuc-pham-kho": "Thực phẩm khô",
  "dac-san": "Đặc sản",
};

export default function ProductsPage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 1
  });

  const initialCategoryId = slug && SLUG_TO_CATEGORY_ID[slug] ? SLUG_TO_CATEGORY_ID[slug].toString() : "all";
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryId);
  const [sortBy, setSortBy] = useState("newest");
  const [aiFilter, setAiFilter] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Cập nhật selectedCategory khi URL slug thay đổi
  useEffect(() => {
    if (slug && SLUG_TO_CATEGORY_ID[slug]) {
      setSelectedCategory(SLUG_TO_CATEGORY_ID[slug].toString());
    } else if (!slug) {
      setSelectedCategory("all");
    }
  }, [slug]);

  useEffect(() => {
    let ignore = false;
    async function loadProducts() {
      setLoading(true);
      try {
        const params = {
          categoryId: selectedCategory !== "all" ? Number(selectedCategory) : undefined,
          sort: sortBy !== "newest" ? sortBy : undefined,
          page: pagination.page,
          size: 12
        };
        const data = await productApi.getAll(params);
        if (!ignore) {
          if (data && Array.isArray(data.content)) {
            setProducts(data.content);
            setPagination(prev => ({
              ...prev,
              totalElements: data.totalElements ?? data.content.length,
              totalPages: data.totalPages ?? 1
            }));
          } else if (Array.isArray(data)) {
            setProducts(data);
            setPagination(prev => ({
              ...prev,
              totalElements: data.length,
              totalPages: Math.ceil(data.length / 12)
            }));
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        if (!ignore) console.error("API Error:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadProducts();
    return () => { ignore = true; };
  }, [selectedCategory, sortBy, pagination.page]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  const categoryName = slug && SLUG_TO_NAME[slug] ? SLUG_TO_NAME[slug] : "Tất cả sản phẩm";

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
              <Link to="/category/rau-cu" style={{textDecoration: 'none'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={selectedCategory === "1"} readOnly /> Rau củ (68)
                </label>
              </Link>
              {selectedCategory === "1" && (
                <div className="sub-filter-list">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked /> Rau ăn lá (31)
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" /> Củ quả (29)
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" /> Nấm (8)
                  </label>
                </div>
              )}
              
              <Link to="/category/trai-cay" style={{textDecoration: 'none', display: 'block', marginTop: '12px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={selectedCategory === "2"} readOnly /> Trái cây (112)
                </label>
              </Link>

              <Link to="/category/nam" style={{textDecoration: 'none', display: 'block', marginTop: '12px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={selectedCategory === "3"} readOnly /> Nấm (8)
                </label>
              </Link>

              <Link to="/category/thuc-pham-kho" style={{textDecoration: 'none', display: 'block', marginTop: '12px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={selectedCategory === "4"} readOnly /> Thực phẩm khô (40)
                </label>
              </Link>
              
              <Link to="/products" style={{textDecoration: 'none', display: 'block', marginTop: '12px'}}>
                <label className="checkbox-label font-bold" style={{cursor: 'pointer'}}>
                  <input type="checkbox" checked={selectedCategory === "all"} readOnly /> Tất cả sản phẩm
                </label>
              </Link>
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Khoảng giá</h3>
            <div className="price-inputs">
              <input type="text" placeholder="Từ" className="price-input" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              <span>-</span>
              <input type="text" placeholder="Đến" className="price-input" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Nhãn chất lượng AI <span className="info-icon">i</span></h3>
            <label className="checkbox-label font-bold">
              <input type="checkbox" className="ai-checkbox" checked={aiFilter} onChange={e => setAiFilter(e.target.checked)} />
              <span>Chỉ hiện sản phẩm AI đánh giá Tươi</span>
            </label>
            <p className="filter-help-text">Sản phẩm chưa kiểm định vẫn hiện nhưng không có nhãn.</p>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Xuất xứ</h3>
            <div className="filter-list">
              <label className="checkbox-label"><input type="checkbox" /> Đà Lạt</label>
              <label className="checkbox-label"><input type="checkbox" /> Đồng Tháp</label>
              <label className="checkbox-label"><input type="checkbox" /> Sơn La</label>
            </div>
          </div>

          <button className="clear-filter-btn">Xóa bộ lọc</button>
        </aside>

        {/* Main Content */}
        <main className="main-product-area">
          <div className="product-area-header">
            <div className="result-count">
              Tìm thấy <strong>{pagination.totalElements}</strong> sản phẩm trong "{categoryName}"
            </div>
            <div className="sort-dropdown">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Sắp xếp: Mới nhất</option>
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
          ) : (
            <div className="products-grid-3">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 0 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Hiển thị {pagination.page * pagination.size + 1}–{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} / {pagination.totalElements}
              </div>
              <div className="pagination-controls">
                <button 
                  className="page-nav-btn" 
                  disabled={pagination.page === 0}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(pagination.totalPages)].map((_, idx) => (
                  <button 
                    key={idx} 
                    className={`page-num-btn ${pagination.page === idx ? 'active' : ''}`}
                    onClick={() => handlePageChange(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  className="page-nav-btn" 
                  disabled={pagination.page >= pagination.totalPages - 1}
                  onClick={() => handlePageChange(pagination.page + 1)}
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
