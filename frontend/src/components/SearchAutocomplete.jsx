import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Search, X, Sparkles, ArrowRight, TrendingUp, Tag } from "lucide-react";
import { productApi, resolveAssetUrl } from "../services/api";
import { getSharedProducts } from "../data/productStore";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import "./SearchAutocomplete.css";

const CATEGORY_MAP = [
  { slug: "rau-cu", name: "Rau củ", icon: "🥦" },
  { slug: "trai-cay", name: "Trái cây", icon: "🍎" },
  { slug: "nam", name: "Nấm tươi", icon: "🍄" },
  { slug: "thuc-pham-kho", name: "Thực phẩm khô", icon: "🌾" },
  { slug: "dac-san", name: "Đặc sản", icon: "🍯" }
];

const POPULAR_SEARCHES = [
  "Cà chua bi",
  "Táo Fuji",
  "Dâu tây Đà Lạt",
  "Nấm đùi gà",
  "Cam sành",
  "Bông cải xanh"
];

export function removeVietnameseTones(str) {
  if (!str) return "";
  str = String(str)
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
    .replace(/ì|í|ị|ỉ|ĩ/g, "i")
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
    .replace(/đ/g, "d")
    .replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A")
    .replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E")
    .replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I")
    .replace(/Ò|Ó|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O")
    .replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U")
    .replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y")
    .replace(/Đ/g, "D");
  return str.toLowerCase().trim();
}

// Helper highlight matching text
function HighlightMatch({ text = "", query = "" }) {
  if (!query || !query.trim() || !text) return <span>{text}</span>;

  const normalizedText = removeVietnameseTones(text);
  const normalizedQuery = removeVietnameseTones(query);
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return <span>{text}</span>;
  }

  const before = text.substring(0, matchIndex);
  const match = text.substring(matchIndex, matchIndex + query.length);
  const after = text.substring(matchIndex + query.length);

  return (
    <span>
      {before}
      <mark>{match}</mark>
      {after}
    </span>
  );
}

export default function SearchAutocomplete({ initialValue = "", placeholder = "Tìm rau củ, trái cây sạch, nấm hữu cơ...", onSearchSubmitted }) {
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productsCache, setProductsCache] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load all products into local memory cache on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        let items = [];
        try {
          const res = await productApi.getAll({ size: 100, sort: "newest" });
          items = res?.content || (Array.isArray(res) ? res : []);
        } catch {
          // Fallback to local shared products or mock
          items = getSharedProducts() || [];
          if (!items || items.length === 0) {
            items = MOCK_PRODUCTS;
          }
        }

        const normalized = items
          .filter(p => !p.status || p.status === "APPROVED")
          .map(p => ({
            id: p.id,
            name: p.name || "",
            price: Number(p.price) || 0,
            unit: p.unit || "kg",
            category: typeof p.category === "object" ? p.category?.name : (p.category || ""),
            seller: p.shop?.shopName || p.seller || "Nông sản sạch",
            origin: p.origin || p.shop?.province || "Việt Nam",
            imageUrl: resolveAssetUrl(p.primaryImageUrl || p.imageUrl || p.image || "https://placehold.co/400x400?text=NongSan"),
            aiLabel: p.aiOverallLabel === "FRESH" || p.aiLabel?.type === "fresh" || !p.aiOverallLabel
              ? "Tươi sạch AI"
              : p.aiGrade || "Kiểm định AI",
          }));

        if (isMounted) {
          setProductsCache(normalized);
        }
      } catch (err) {
        console.warn("Lỗi nạp sản phẩm cho tìm kiếm:", err);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync initial query from URL search params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search") || params.get("keyword") || "";
    if (searchParam && !query) {
      setQuery(searchParam);
    }
    // Close dropdown on navigation
    setIsOpen(false);
  }, [location.pathname, location.search]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products based on current query
  const suggestions = useMemo(() => {
    const cleanQuery = removeVietnameseTones(query);
    if (!cleanQuery) return [];

    return productsCache
      .map(p => {
        const normName = removeVietnameseTones(p.name);
        const normCat = removeVietnameseTones(p.category);
        const normSeller = removeVietnameseTones(p.seller);
        const normOrigin = removeVietnameseTones(p.origin);

        let score = 0;
        if (normName === cleanQuery) score += 100;
        else if (normName.startsWith(cleanQuery)) score += 50;
        else if (normName.includes(cleanQuery)) score += 30;

        if (normCat.includes(cleanQuery)) score += 20;
        if (normSeller.includes(cleanQuery) || normOrigin.includes(cleanQuery)) score += 10;

        return { product: p, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.product);
  }, [query, productsCache]);

  // Matched categories for the query
  const matchedCategories = useMemo(() => {
    const cleanQuery = removeVietnameseTones(query);
    if (!cleanQuery) return [];
    return CATEGORY_MAP.filter(cat => 
      removeVietnameseTones(cat.name).includes(cleanQuery)
    );
  }, [query]);

  // Debounced API call if user wants remote search update
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);
    setIsOpen(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (val.trim().length >= 2) {
      setLoading(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await productApi.getAll({ keyword: val.trim(), size: 8 });
          const items = res?.content || (Array.isArray(res) ? res : []);
          if (items.length > 0) {
            setProductsCache(prev => {
              const existingIds = new Set(prev.map(p => String(p.id)));
              const newItems = items
                .filter(p => !existingIds.has(String(p.id)))
                .map(p => ({
                  id: p.id,
                  name: p.name || "",
                  price: Number(p.price) || 0,
                  unit: p.unit || "kg",
                  category: typeof p.category === "object" ? p.category?.name : (p.category || ""),
                  seller: p.shop?.shopName || p.seller || "Nông sản sạch",
                  origin: p.origin || p.shop?.province || "Việt Nam",
                  imageUrl: resolveAssetUrl(p.primaryImageUrl || p.imageUrl || p.image || "https://placehold.co/400x400?text=NongSan"),
                  aiLabel: p.aiOverallLabel === "FRESH" ? "Tươi sạch AI" : "Kiểm định AI"
                }));
              return [...prev, ...newItems];
            });
          }
        } catch {
          // Keep local cache silently
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
  };

  const submitSearch = (searchKeyword) => {
    const term = (searchKeyword !== undefined ? searchKeyword : query).trim();
    setIsOpen(false);
    setIsFocused(false);
    if (onSearchSubmitted) {
      onSearchSubmitted(term);
    }
    if (term) {
      navigate(`/products?search=${encodeURIComponent(term)}`);
    } else {
      navigate("/products");
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectProduct(suggestions[selectedIndex].id);
    } else {
      submitSearch();
    }
  };

  const handleSelectProduct = (productId) => {
    setIsOpen(false);
    navigate(`/products/${productId}`);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const formatPrice = (amount) => {
    return (Number(amount) || 0).toLocaleString("vi-VN") + " đ";
  };

  const hasQuery = query.trim().length > 0;
  const showDropdown = isOpen && (hasQuery || isFocused);

  return (
    <div className="search-autocomplete-wrapper" ref={containerRef}>
      {/* Form Input */}
      <form onSubmit={handleFormSubmit} className={`search-autocomplete-form ${isFocused ? "is-focused" : ""}`}>
        <Search size={18} className="search-autocomplete-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="search-autocomplete-input"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {loading && <div className="search-loading-spinner" title="Đang tìm kiếm..." />}

        {hasQuery && !loading && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            title="Xóa tìm kiếm"
          >
            <X size={14} />
          </button>
        )}

        <button type="submit" className="search-autocomplete-submit">
          Tìm
        </button>
      </form>

      {/* Dropdown Suggestions */}
      {showDropdown && (
        <div className="search-dropdown-menu">
          {/* Case 1: Typing text with product matches */}
          {hasQuery && suggestions.length > 0 && (
            <>
              <div className="search-dropdown-header">
                <span>Gợi ý sản phẩm</span>
                <span className="search-dropdown-header-count">{suggestions.length} sản phẩm</span>
              </div>

              {/* Matched Category Chips */}
              {matchedCategories.length > 0 && (
                <div className="search-category-bar">
                  <span className="search-category-label">
                    <Tag size={12} /> Danh mục:
                  </span>
                  {matchedCategories.map(cat => (
                    <Link
                      key={cat.slug}
                      to={`/category/${cat.slug}`}
                      className="search-category-chip"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Suggestions List */}
              <ul className="search-suggestions-list">
                {suggestions.map((product, idx) => (
                  <li key={product.id}>
                    <div
                      className={`search-suggestion-item ${selectedIndex === idx ? "is-selected" : ""}`}
                      onClick={() => handleSelectProduct(product.id)}
                    >
                      <div className="search-item-thumb-wrapper">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="search-item-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=150&q=80";
                          }}
                        />
                      </div>

                      <div className="search-item-info">
                        <div className="search-item-name-row">
                          <div className="search-item-name">
                            <HighlightMatch text={product.name} query={query} />
                          </div>
                        </div>

                        <div className="search-item-meta">
                          {product.category && (
                            <span className="search-item-category">{product.category}</span>
                          )}
                          <span className="search-item-origin">{product.origin}</span>
                        </div>

                        <div className="search-item-ai-tag">
                          <Sparkles size={10} />
                          <span>{product.aiLabel}</span>
                        </div>
                      </div>

                      <div className="search-item-price-col">
                        <div className="search-item-price">{formatPrice(product.price)}</div>
                        <div className="search-item-unit">/{product.unit}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Footer View All Results */}
              <div className="search-dropdown-footer">
                <button
                  type="button"
                  className="search-view-all-btn"
                  onClick={() => submitSearch()}
                >
                  Xem tất cả kết quả cho &ldquo;<strong>{query}</strong>&rdquo;
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}

          {/* Case 2: Typing text with NO matches */}
          {hasQuery && suggestions.length === 0 && !loading && (
            <div className="search-empty-state">
              <div className="search-empty-title">
                Không tìm thấy sản phẩm cho &ldquo;{query}&rdquo;
              </div>
              <div className="search-empty-desc">
                Thử tìm với các từ khóa gợi ý bên dưới:
              </div>
              <div className="search-trending-chips">
                {POPULAR_SEARCHES.map(term => (
                  <button
                    key={term}
                    type="button"
                    className="search-trending-chip"
                    onClick={() => {
                      setQuery(term);
                      submitSearch(term);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Case 3: Empty query & Input focused -> Show Popular / Trending searches */}
          {!hasQuery && (
            <div className="search-popular-wrapper">
              <div className="search-popular-title">
                <TrendingUp size={14} color="#00A651" />
                <span>Tìm kiếm phổ biến</span>
              </div>
              <div className="search-trending-chips" style={{ justifyContent: "flex-start" }}>
                {POPULAR_SEARCHES.map(term => (
                  <button
                    key={term}
                    type="button"
                    className="search-trending-chip"
                    onClick={() => {
                      setQuery(term);
                      submitSearch(term);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
