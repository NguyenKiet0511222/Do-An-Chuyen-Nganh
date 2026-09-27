import { useState, useEffect } from "react";
import { productApi } from "../../services/api";
import ProductCard from "../../components/ProductCard";
import {
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MapPin,
  Tag
} from "lucide-react";

const CATEGORIES = [
  { id: "all", name: "Tất cả nông sản" },
  { id: "1", name: "Rau củ" },
  { id: "2", name: "Củ quả" },
  { id: "3", name: "Rau lá" },
  { id: "4", name: "Trái cây" }
];

const AI_OPTIONS = [
  { id: "all", name: "Tất cả phẩm cấp" },
  { id: "FRESH", name: "Tươi sạch AI (Chuẩn)" },
  { id: "UNCERTAIN", name: "Cần kiểm định" }
];

const PRICE_RANGES = [
  { id: "all", label: "Tất cả mức giá", min: null, max: null },
  { id: "under50", label: "Dưới 50.000₫", min: 0, max: 50000 },
  { id: "50to100", label: "50.000₫ - 100.000₫", min: 50000, max: 100000 },
  { id: "above100", label: "Trên 100.000₫", min: 100000, max: null }
];

const ORIGINS = [
  { id: "all", name: "Tất cả vùng trồng" },
  { id: "Lâm Đồng", name: "Lâm Đồng (Đà Lạt)" },
  { id: "Đồng Tháp", name: "Đồng Tháp (Cao Lãnh)" },
  { id: "Tiền Giang", name: "Tiền Giang" },
  { id: "Bến Tre", name: "Bến Tre" }
];

export default function ProductsPage() {
  // Query state
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAiLabel, setSelectedAiLabel] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(0);

  // Response state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 1
  });

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      const priceConfig = PRICE_RANGES.find((r) => r.id === selectedPriceRange);

      const params = {
        keyword: keyword.trim() || undefined,
        categoryId: selectedCategory !== "all" ? Number(selectedCategory) : undefined,
        aiLabel: selectedAiLabel !== "all" ? selectedAiLabel : undefined,
        minPrice: priceConfig?.min != null ? priceConfig.min : undefined,
        maxPrice: priceConfig?.max != null ? priceConfig.max : undefined,
        origin: selectedOrigin !== "all" ? selectedOrigin : undefined,
        sort: sortBy !== "newest" ? sortBy : undefined,
        page,
        size: 12
      };

      try {
        const data = await productApi.getAll(params);
        if (!ignore) {
          if (data && Array.isArray(data.content)) {
            setProducts(data.content);
            setPagination({
              page: data.page ?? 0,
              size: data.size ?? 12,
              totalElements: data.totalElements ?? data.content.length,
              totalPages: data.totalPages ?? 1
            });
          } else if (Array.isArray(data)) {
            setProducts(data);
            setPagination({
              page: 0,
              size: data.length,
              totalElements: data.length,
              totalPages: 1
            });
          } else {
            setProducts([]);
          }
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Lỗi khi tải danh sách sản phẩm:", err);
          setError(
            "Không thể tải danh sách sản phẩm từ máy chủ API. Vui lòng kiểm tra backend Spring Boot (cổng 8080) đang chạy."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [keyword, selectedCategory, selectedAiLabel, selectedPriceRange, selectedOrigin, sortBy, page, reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setKeyword(searchInput);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setLoading(true);
    setKeyword("");
    setPage(0);
  };

  const handleCategoryChange = (catId) => {
    setLoading(true);
    setSelectedCategory(catId);
    setPage(0);
  };

  const handleAiLabelChange = (aiId) => {
    setLoading(true);
    setSelectedAiLabel(aiId);
    setPage(0);
  };

  const handlePriceRangeChange = (priceId) => {
    setLoading(true);
    setSelectedPriceRange(priceId);
    setPage(0);
  };

  const handleOriginChange = (e) => {
    setLoading(true);
    setSelectedOrigin(e.target.value);
    setPage(0);
  };

  const handleSortChange = (e) => {
    setLoading(true);
    setSortBy(e.target.value);
    setPage(0);
  };

  const handlePageChange = (newPage) => {
    setLoading(true);
    setPage(newPage);
  };

  const handleResetFilters = () => {
    setLoading(true);
    setSearchInput("");
    setKeyword("");
    setSelectedCategory("all");
    setSelectedAiLabel("all");
    setSelectedPriceRange("all");
    setSelectedOrigin("all");
    setSortBy("newest");
    setPage(0);
  };

  const hasActiveFilters =
    keyword !== "" ||
    selectedCategory !== "all" ||
    selectedAiLabel !== "all" ||
    selectedPriceRange !== "all" ||
    selectedOrigin !== "all" ||
    sortBy !== "newest";

  return (
    <div className="products-page">
      {/* Page Header Banner */}
      <div className="page-header-banner">
        <div className="section-container">
          <div className="page-badge">
            <Sparkles size={14} /> Nông sản sạch kiểm định AI Vision
          </div>
          <h1>Cửa Hàng Nông Sản Sạch</h1>
          <p>
            Tất cả nông sản đều trải qua kiểm định thị giác máy tính AI trước khi mở bán.
            Minh bạch độ tươi, truy xuất nguồn gốc nông trại rõ ràng.
          </p>
        </div>
      </div>

      <div className="section-container main-content-wrapper">
        {/* 3 Visual Category Banners (Khớp chuẩn Wireframe Image 2) */}
        <div className="category-feature-cards-grid">
          <button
            type="button"
            className={`cat-feature-card ${selectedCategory === "1" ? "active" : ""}`}
            onClick={() => handleCategoryChange("1")}
          >
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600"
              alt="Fresh Vegetables"
              className="cat-feature-img"
            />
            <div className="cat-feature-content">
              <h3>FRESH VEGETABLES</h3>
              <p>Rau củ tươi sạch</p>
            </div>
          </button>

          <button
            type="button"
            className={`cat-feature-card ${selectedCategory === "4" ? "active" : ""}`}
            onClick={() => handleCategoryChange("4")}
          >
            <img
              src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600"
              alt="Delicious Fruits"
              className="cat-feature-img"
            />
            <div className="cat-feature-content">
              <h3>DELICIOUS FRUITS</h3>
              <p>Trái cây ngọt lành</p>
            </div>
          </button>

          <button
            type="button"
            className={`cat-feature-card ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => handleCategoryChange("all")}
          >
            <img
              src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600"
              alt="Organic Picks"
              className="cat-feature-img"
            />
            <div className="cat-feature-content">
              <h3>ORGANIC PICKS</h3>
              <p>Nông sản VietGAP</p>
            </div>
          </button>
        </div>

        {/* Section Heading matching Image 2 */}
        <div className="arrivals-section-heading">
          <h2>THIS WEEK'S FRESH ARRIVALS</h2>
          <p>Nông sản tươi sạch hái trong ngày được kiểm định AI trước khi giao</p>
        </div>

        {/* Filters Toolbar */}
        <div className="filters-toolbar-card">
          <div className="filters-top-bar">
            {/* Search Input */}
            <form className="search-box-form" onSubmit={handleSearchSubmit}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm nông sản theo tên, giống, vùng trồng..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Tìm kiếm sản phẩm"
              />
              {searchInput && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={handleClearSearch}
                  aria-label="Xoá tìm kiếm"
                >
                  ×
                </button>
              )}
              <button type="submit" className="search-submit-btn">
                Tìm kiếm
              </button>
            </form>

            {/* Origin & Sort Controls */}
            <div className="controls-right-group">
              <div className="select-control-box">
                <MapPin size={15} className="select-icon" />
                <select
                  value={selectedOrigin}
                  onChange={handleOriginChange}
                  aria-label="Lọc theo vùng miền"
                >
                  {ORIGINS.map((ori) => (
                    <option key={ori.id} value={ori.id}>
                      {ori.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="select-control-box">
                <SlidersHorizontal size={15} className="select-icon" />
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  aria-label="Sắp xếp sản phẩm"
                >
                  <option value="newest">Sắp xếp: Mới nhất</option>
                  <option value="bestSelling">Bán chạy nhất</option>
                  <option value="rating">Đánh giá cao nhất</option>
                  <option value="priceAsc">Giá: Thấp đến Cao</option>
                  <option value="priceDesc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Pills Groups */}
          <div className="filter-chips-section">
            {/* Category Filter */}
            <div className="filter-chip-row">
              <span className="filter-group-title">
                <Filter size={14} /> Danh mục:
              </span>
              <div className="chips-container">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`filter-chip ${
                      selectedCategory === cat.id ? "active" : ""
                    }`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Quality Filter */}
            <div className="filter-chip-row">
              <span className="filter-group-title">
                <Sparkles size={14} /> Kiểm định AI:
              </span>
              <div className="chips-container">
                {AI_OPTIONS.map((ai) => (
                  <button
                    key={ai.id}
                    type="button"
                    className={`filter-chip ai-chip ${
                      selectedAiLabel === ai.id ? "active" : ""
                    }`}
                    onClick={() => handleAiLabelChange(ai.id)}
                  >
                    {ai.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-chip-row">
              <span className="filter-group-title">
                <Tag size={14} /> Mức giá:
              </span>
              <div className="chips-container">
                {PRICE_RANGES.map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    className={`filter-chip ${
                      selectedPriceRange === pr.id ? "active" : ""
                    }`}
                    onClick={() => handlePriceRangeChange(pr.id)}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary Bar */}
        <div className="results-summary-row">
          <div className="summary-left">
            <span>
              Tìm thấy <strong>{pagination.totalElements}</strong> sản phẩm nông sản
              {pagination.totalPages > 1 && (
                <> (Trang {pagination.page + 1}/{pagination.totalPages})</>
              )}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="reset-filters-btn"
              onClick={handleResetFilters}
            >
              <RefreshCw size={14} /> Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="api-error-banner" role="alert">
            <AlertCircle size={20} className="error-icon" />
            <div className="error-content">
              <strong>Không thể kết nối đến máy chủ backend:</strong>
              <p>{error}</p>
            </div>
            <button type="button" className="retry-btn" onClick={handleRetry}>
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="product-skeleton-card">
                <div className="skeleton-image-box" />
                <div className="skeleton-body">
                  <div className="skeleton-line w-40" />
                  <div className="skeleton-line w-80" />
                  <div className="skeleton-line w-60" />
                  <div className="skeleton-line w-50" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="no-products-state">
            <div className="empty-icon-wrap">
              <Search size={36} />
            </div>
            <h3>Không tìm thấy sản phẩm nào</h3>
            <p>
              Không có nông sản nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn-primary reset-cta-btn"
                onClick={handleResetFilters}
              >
                <RefreshCw size={16} /> Đặt lại bộ lọc & xem tất cả
              </button>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="pagination-bar">
            <button
              type="button"
              className="page-btn page-nav-btn"
              disabled={page === 0}
              onClick={() => handlePageChange(Math.max(0, page - 1))}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} /> Trước
            </button>

            <div className="page-numbers">
              {Array.from({ length: pagination.totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`page-btn page-num-btn ${page === idx ? "active" : ""}`}
                  onClick={() => handlePageChange(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="page-btn page-nav-btn"
              disabled={page >= pagination.totalPages - 1}
              onClick={() => handlePageChange(Math.min(pagination.totalPages - 1, page + 1))}
              aria-label="Trang sau"
            >
              Sau <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
