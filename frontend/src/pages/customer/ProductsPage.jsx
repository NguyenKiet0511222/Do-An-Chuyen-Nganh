import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import { ChevronRight, ChevronLeft, AlertCircle, RefreshCw, SearchX } from "lucide-react";
import { productApi, categoryApi } from "../../services/api";
import { flattenCategoryTree, findCategoryBySlug, findCategoryById } from "../../utils/categories";
import { normalizeVi } from "../../utils/text";
import { apiErrorMessage } from "../../utils/format";

const PAGE_SIZE = 12;
const NO_PRODUCTS = [];
// Backend chưa tìm không dấu -> tải tối đa 100 sản phẩm (đúng danh mục + cách sắp xếp) rồi lọc phía trình duyệt (docs/2110.md mục 5)
const FETCH_SIZE = 100;

// Giá trị sort của GET /api/products (api.md mục 4.4)
const SORT_OPTIONS = [
  { value: "newest", label: "Sắp xếp: Mới nhất" },
  { value: "bestSelling", label: "Sắp xếp: Bán chạy nhất" },
  { value: "priceAsc", label: "Giá: Thấp đến Cao" },
  { value: "priceDesc", label: "Giá: Cao đến Thấp" },
  { value: "rating", label: "Sắp xếp: Đánh giá cao" }
];
// Tên cũ còn trong link/bookmark cũ
const SORT_ALIASES = { new: "newest", best_seller: "bestSelling" };
const normalizeSort = (raw) => {
  const value = SORT_ALIASES[raw] ?? raw;
  return SORT_OPTIONS.some((o) => o.value === value) ? value : "newest";
};

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export default function ProductsPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Từ khoá + cách sắp xếp nằm trên URL (Back/Forward, chia sẻ link giữ nguyên)
  const searchQuery = (searchParams.get("search") || searchParams.get("keyword") || "").trim();
  const sortBy = normalizeSort(searchParams.get("sort"));

  const [aiFilter, setAiFilter] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedProvinces, setSelectedProvinces] = useState([]);
  const [reloadToken, setReloadToken] = useState(0);

  // ---- Danh mục thật: /category/:slug -> tìm theo slug trên cây /api/categories ----
  const [categoryResult, setCategoryResult] = useState({ key: null, flat: [], error: null });
  useEffect(() => {
    let ignore = false;
    categoryApi
      .getAll()
      .then((tree) => {
        if (!ignore) setCategoryResult({ key: reloadToken, flat: flattenCategoryTree(tree), error: null });
      })
      .catch((err) => {
        if (!ignore) setCategoryResult({ key: reloadToken, flat: [], error: apiErrorMessage(err, "Không tải được danh mục.") });
      });
    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const categoriesLoading = categoryResult.key !== reloadToken;
  const categories = categoryResult.flat;
  const currentCategory = slug ? findCategoryBySlug(categories, slug) : null;
  const parentCategory = currentCategory?.parentId ? findCategoryById(categories, currentCategory.parentId) : null;
  const categoryNotFound = Boolean(slug) && !categoriesLoading && !categoryResult.error && !currentCategory;
  const categoryLoadFailed = Boolean(slug) && !categoriesLoading && Boolean(categoryResult.error) && !currentCategory;

  // ---- Sản phẩm: categoryId do backend lọc (gồm cả danh mục con), sort do backend sắp ----
  const categoryId = currentCategory?.id ?? null;
  const canFetch = !slug || Boolean(currentCategory);
  const productKey = canFetch ? `${categoryId ?? "all"}|${sortBy}|${reloadToken}` : null;
  const [productResult, setProductResult] = useState({ key: null, items: [], error: null });

  useEffect(() => {
    if (!productKey) return undefined;
    let ignore = false;
    productApi
      .getAll({ categoryId: categoryId ?? undefined, sort: sortBy, size: FETCH_SIZE })
      .then((res) => {
        if (!ignore) setProductResult({ key: productKey, items: res?.content ?? [], error: null });
      })
      .catch((err) => {
        if (!ignore) {
          setProductResult({
            key: productKey,
            items: [],
            error: apiErrorMessage(err, "Không tải được danh sách sản phẩm. Kiểm tra kết nối rồi thử lại.")
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, [productKey, categoryId, sortBy]);

  const productsLoading = canFetch && productResult.key !== productKey;
  const loading = productsLoading || (Boolean(slug) && categoriesLoading && !currentCategory);
  const productError = canFetch && !productsLoading ? productResult.error : null;
  const products = canFetch && !productsLoading ? productResult.items : NO_PRODUCTS;

  // Tỉnh của shop có trong kết quả (lọc khu vực) — không viết cứng
  const provinceOptions = useMemo(() => {
    const set = new Set(products.map((p) => p.shop?.province).filter(Boolean));
    selectedProvinces.forEach((p) => set.add(p));
    return [...set].sort((a, b) => a.localeCompare(b, "vi"));
  }, [products, selectedProvinces]);

  // ---- Lọc phía trình duyệt: từ khoá không dấu, nhãn AI, khoảng giá, khu vực ----
  const filteredProducts = useMemo(() => {
    const q = normalizeVi(searchQuery);
    const min = toNumberOrNull(minPrice);
    const max = toNumberOrNull(maxPrice);
    return products.filter((p) => {
      if (q) {
        const fields = [p.name, p.category?.name, p.shop?.shopName, p.shop?.province];
        if (!fields.some((field) => normalizeVi(field).includes(q))) return false;
      }
      if (aiFilter && p.aiOverallLabel !== "FRESH") return false;
      const price = Number(p.price);
      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;
      if (selectedProvinces.length > 0 && !selectedProvinces.includes(p.shop?.province)) return false;
      return true;
    });
  }, [products, searchQuery, aiFilter, minPrice, maxPrice, selectedProvinces]);

  // ---- Phân trang phía trình duyệt; đổi bộ lọc thì về trang 1 (tính lúc render, không cần effect) ----
  const filterSignature = JSON.stringify([slug ?? "", searchQuery, sortBy, aiFilter, minPrice, maxPrice, selectedProvinces]);
  const [pageState, setPageState] = useState({ signature: filterSignature, page: 0 });
  const totalElements = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const page = Math.min(pageState.signature === filterSignature ? pageState.page : 0, totalPages - 1);
  const displayedProducts = filteredProducts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const goToPage = (nextPage) => {
    setPageState({ signature: filterSignature, page: nextPage });
    window.scrollTo(0, 0);
  };

  const handleSortChange = (value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "newest") next.delete("sort");
        else next.set("sort", value);
        return next;
      },
      { replace: true }
    );
  };

  const toggleProvince = (province) => {
    setSelectedProvinces((prev) =>
      prev.includes(province) ? prev.filter((p) => p !== province) : [...prev, province]
    );
  };

  const handleClearFilters = () => {
    setAiFilter(false);
    setMinPrice("");
    setMaxPrice("");
    setSelectedProvinces([]);
    navigate("/products");
  };

  const handleRetry = () => setReloadToken((t) => t + 1);

  const pageTitle = currentCategory
    ? currentCategory.name
    : slug
    ? "Danh mục"
    : searchQuery
    ? `Kết quả tìm kiếm: "${searchQuery}"`
    : "Tất cả sản phẩm";

  const rootCategories = categories.filter((c) => c.depth === 0);
  const childrenOf = (parentId) => categories.filter((c) => c.parentId === parentId);

  const renderCategoryLink = (cat, bold) => (
    <Link key={cat.id} to={`/category/${cat.slug}`} className="category-filter-link">
      <span className={`checkbox-label ${bold ? "font-bold" : ""}`}>
        <input type="checkbox" checked={slug === cat.slug} readOnly tabIndex={-1} aria-hidden="true" />
        {cat.name}
        <span className="category-filter-count">({cat.productCount})</span>
      </span>
    </Link>
  );

  const renderMainContent = () => {
    if (categoryNotFound) {
      return (
        <div className="no-products-state">
          <div className="empty-icon-wrap">
            <SearchX size={32} />
          </div>
          <h3>Không tìm thấy danh mục</h3>
          <p>Danh mục "{slug}" không tồn tại hoặc đã ngừng hoạt động.</p>
          <Link to="/products" className="btn-primary">Xem tất cả sản phẩm</Link>
        </div>
      );
    }

    const errorMessage = categoryLoadFailed ? categoryResult.error : productError;
    if (errorMessage) {
      return (
        <div className="api-error-banner" role="alert">
          <AlertCircle size={22} className="error-icon" />
          <div className="error-content">
            <strong>{categoryLoadFailed ? "Không tải được danh mục" : "Không tải được sản phẩm"}</strong>
            {errorMessage}
          </div>
          <button type="button" className="retry-btn" onClick={handleRetry}>
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="products-grid-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="product-skeleton-card" style={{ height: "300px" }}></div>
          ))}
        </div>
      );
    }

    if (displayedProducts.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
          <p style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>Không tìm thấy sản phẩm phù hợp</p>
          <p style={{ fontSize: "14px", color: "#888", marginBottom: "20px" }}>Vui lòng thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
          <button type="button" className="btn-primary" onClick={handleClearFilters}>
            Xóa tất cả bộ lọc
          </button>
        </div>
      );
    }

    return (
      <div className="products-grid-3">
        {displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="category-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        {parentCategory && (
          <>
            <Link to={`/category/${parentCategory.slug}`} className="breadcrumb-link">{parentCategory.name}</Link>
            <span className="breadcrumb-separator">/</span>
          </>
        )}
        <span className="breadcrumb-current">{pageTitle}</span>
      </div>

      <div className="category-layout">
        {/* Sidebar Filters */}
        <aside className="sidebar-filters">
          <div className="filter-section">
            <h3 className="filter-title">Danh mục</h3>
            <div className="filter-list">
              <Link to="/products" className="category-filter-link">
                <span className="checkbox-label font-bold">
                  <input type="checkbox" checked={!slug} readOnly tabIndex={-1} aria-hidden="true" /> Tất cả sản phẩm
                </span>
              </Link>

              {rootCategories.map((root) => {
                const children = childrenOf(root.id);
                return (
                  <div key={root.id}>
                    {renderCategoryLink(root, true)}
                    {children.length > 0 && (
                      <div className="sub-filter-list">{children.map((child) => renderCategoryLink(child, false))}</div>
                    )}
                  </div>
                );
              })}

              {categoriesLoading && categories.length === 0 && (
                <p className="filter-help-text">Đang tải danh mục...</p>
              )}
              {!categoriesLoading && categoryResult.error && (
                <p className="filter-help-text">Không tải được danh mục.</p>
              )}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Khoảng giá (VNĐ)</h3>
            <div className="price-inputs">
              <input
                type="number"
                min="0"
                placeholder="Từ"
                className="price-input"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                min="0"
                placeholder="Đến"
                className="price-input"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Nhãn chất lượng AI</h3>
            <label className="checkbox-label font-bold" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                className="ai-checkbox"
                checked={aiFilter}
                onChange={(e) => setAiFilter(e.target.checked)}
              />
              <span>Chỉ hiện sản phẩm AI đánh giá Tươi</span>
            </label>
            <p className="filter-help-text">Theo nhãn AI tổng hợp từ ảnh người bán tải lên (đã qua kiểm duyệt).</p>
          </div>

          {provinceOptions.length > 0 && (
            <div className="filter-section">
              <h3 className="filter-title">Khu vực shop</h3>
              <div className="filter-list">
                {provinceOptions.map((province) => (
                  <label key={province} className="checkbox-label" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selectedProvinces.includes(province)}
                      onChange={() => toggleProvince(province)}
                    />
                    {province}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="button" className="clear-filter-btn" onClick={handleClearFilters}>
            Xóa bộ lọc
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-product-area">
          <div className="product-area-header">
            <div className="result-count">
              {loading || categoryNotFound || categoryLoadFailed || productError ? (
                <span>&nbsp;</span>
              ) : (
                <>
                  Tìm thấy <strong>{totalElements}</strong> sản phẩm trong "{pageTitle}"
                  {currentCategory && searchQuery && <> cho từ khoá "{searchQuery}"</>}
                </>
              )}
            </div>
            <div className="sort-dropdown">
              <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)} aria-label="Sắp xếp sản phẩm">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderMainContent()}

          {/* Pagination */}
          {!loading && !productError && totalPages > 1 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} / {totalElements}
              </div>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={page === 0}
                  onClick={() => goToPage(Math.max(0, page - 1))}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`page-num-btn ${page === idx ? "active" : ""}`}
                    onClick={() => goToPage(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className="page-nav-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
                  aria-label="Trang sau"
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
