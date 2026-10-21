import { useState, useEffect, useRef, useMemo, useId } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Search, X, ArrowRight, TrendingUp, Tag, AlertCircle } from "lucide-react";
import { productApi, resolveAssetUrl } from "../services/api";
import { normalizeVi } from "../utils/text";
import { formatVnd, handleImageError } from "../utils/format";
import AiQualityBadge from "./AiQualityBadge";
import "./SearchAutocomplete.css";

const MAX_SUGGESTIONS = 6;
const MAX_BEST_SELLERS = 5;
const MAX_CATEGORY_CHIPS = 6;
// Backend chưa tìm không dấu -> lọc phía trình duyệt trên 100 sản phẩm mới nhất (docs/2110.md mục 5)
const CACHE_SIZE = 100;
const REMOTE_MIN_LENGTH = 2;
const PLACEHOLDER_IMAGE = "https://placehold.co/96x96?text=No+Image";

// Trang có ô tìm kiếm phản ánh lên URL: /products?search=… và /category/:slug?search=…
const readUrlQuery = (location) =>
  location.pathname === "/products" || location.pathname.startsWith("/category/")
    ? new URLSearchParams(location.search).get("search") ?? ""
    : "";

// Product (list item) của GET /api/products -> dòng gợi ý (kèm chuỗi đã bỏ dấu để so khớp)
const toSuggestion = (p) => ({
  id: p.id,
  name: p.name ?? "",
  price: p.price,
  unit: p.unit || "kg",
  categoryName: p.category?.name ?? "",
  shopName: p.shop?.shopName ?? "",
  province: p.shop?.province ?? "",
  imageUrl: resolveAssetUrl(p.primaryImageUrl) || PLACEHOLDER_IMAGE,
  aiLabel: p.aiOverallLabel ?? null,
  aiConfidence: p.aiOverallConfidence ?? null,
  soldCount: Number(p.soldCount) || 0,
  search: {
    name: normalizeVi(p.name),
    category: normalizeVi(p.category?.name),
    shop: normalizeVi(p.shop?.shopName),
    province: normalizeVi(p.shop?.province)
  }
});

/** Ghép thêm các dòng mới (theo id) vào cuối danh sách cũ. */
const mergeById = (base, extra) => {
  const ids = new Set(base.map((item) => String(item.id)));
  return [...base, ...extra.filter((item) => !ids.has(String(item.id)))];
};

const scoreOf = (item, q) => {
  let score = 0;
  if (item.search.name === q) score += 100;
  else if (item.search.name.startsWith(q)) score += 50;
  else if (item.search.name.includes(q)) score += 30;
  if (item.search.category.includes(q)) score += 20;
  if (item.search.shop.includes(q) || item.search.province.includes(q)) score += 10;
  return score;
};

// Tô đoạn khớp (so khớp không dấu). Chuẩn hoá NFC trước để mỗi ký tự gốc ứng đúng 1 ký tự sau khi bỏ dấu.
function HighlightMatch({ text, query }) {
  const source = String(text ?? "").normalize("NFC");
  const q = normalizeVi(query).trim();
  const index = q ? normalizeVi(source).indexOf(q) : -1;
  if (index < 0) return source;
  return (
    <>
      {source.slice(0, index)}
      <mark>{source.slice(index, index + q.length)}</mark>
      {source.slice(index + q.length)}
    </>
  );
}

/**
 * Ô tìm kiếm có gợi ý (Navbar).
 * - categories: danh sách phẳng từ GET /api/categories (utils/categories.flattenCategoryTree) — Navbar truyền xuống.
 * - Gợi ý chỉ tải khi bấm vào ô (không tải lúc mở trang); API lỗi thì báo lỗi, không gợi ý sản phẩm giả.
 */
export default function SearchAutocomplete({ categories = [], placeholder = "Tìm rau củ, trái cây tươi sạch..." }) {
  const navigate = useNavigate();
  const location = useLocation();
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const [query, setQuery] = useState(() => readUrlQuery(location));
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // status: idle (chưa bấm vào ô) | loading | ready | error
  const [cache, setCache] = useState({ status: "idle", items: [] });
  const [remoteLoading, setRemoteLoading] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const remoteSeqRef = useRef(0);
  const cacheRequestRef = useRef(false);

  // Đồng bộ URL mỗi lần chuyển trang (cả nút Back/Forward): ô hiện ?search= của trang kết quả, đóng gợi ý.
  // Điều chỉnh state ngay lúc render khi location đổi (mẫu "lưu giá trị của lần render trước" của React), không dùng effect.
  const [syncedLocationKey, setSyncedLocationKey] = useState(location.key);
  if (syncedLocationKey !== location.key) {
    setSyncedLocationKey(location.key);
    setQuery(readUrlQuery(location));
    setIsOpen(false);
    setActiveIndex(-1);
  }

  // Huỷ hẹn giờ tìm trên server khi gỡ component
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const normalizedQuery = normalizeVi(query).trim();
  const hasQuery = normalizedQuery.length > 0;

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    return cache.items
      .map((item) => ({ item, score: scoreOf(item, normalizedQuery) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SUGGESTIONS)
      .map((entry) => entry.item);
  }, [cache.items, normalizedQuery]);

  // "Bán chạy" khi ô trống: sắp theo số đã bán trong bộ nhớ đệm (bằng sort=bestSelling của server khi ≤ 100 sản phẩm)
  const bestSellers = useMemo(
    () => [...cache.items].sort((a, b) => b.soldCount - a.soldCount).slice(0, MAX_BEST_SELLERS),
    [cache.items]
  );

  const matchedCategories = useMemo(() => {
    const list = hasQuery
      ? categories.filter((cat) => normalizeVi(cat.name).includes(normalizedQuery))
      : categories;
    return list.slice(0, MAX_CATEGORY_CHIPS);
  }, [categories, hasQuery, normalizedQuery]);

  const options = hasQuery ? suggestions : bestSellers;
  const activeOptionIndex = isOpen && activeIndex >= 0 && activeIndex < options.length ? activeIndex : -1;
  const isLoading = cache.status === "loading" || remoteLoading;

  // Cuộn tới mục đang chọn bằng phím mũi tên
  useEffect(() => {
    if (activeOptionIndex < 0) return;
    document.getElementById(`${baseId}-option-${activeOptionIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeOptionIndex, baseId]);

  // Tải 100 sản phẩm mới nhất làm bộ nhớ đệm — lần đầu bấm vào ô, hoặc thử lại nếu lần trước lỗi.
  // Ref chặn gọi trùng khi focus + click đến liền nhau trước lần render kế tiếp.
  const loadCache = () => {
    if (cacheRequestRef.current || cache.status === "ready") return;
    cacheRequestRef.current = true;
    setCache((prev) => ({ ...prev, status: "loading" }));
    productApi
      .getAll({ size: CACHE_SIZE, sort: "newest" })
      .then((res) => {
        const fresh = (res?.content ?? []).map(toSuggestion);
        setCache((prev) => ({ status: "ready", items: mergeById(fresh, prev.items) }));
      })
      .catch(() => setCache((prev) => ({ ...prev, status: "error" })))
      .finally(() => {
        cacheRequestRef.current = false;
      });
  };

  // Gõ ≥ 2 ký tự: hỏi thêm server (300ms sau lần gõ cuối) để có cả sản phẩm ngoài bộ nhớ đệm
  const scheduleRemoteSearch = (value) => {
    clearTimeout(debounceRef.current);
    const keyword = value.trim();
    const seq = ++remoteSeqRef.current;
    if (keyword.length < REMOTE_MIN_LENGTH) {
      setRemoteLoading(false);
      return;
    }
    setRemoteLoading(true);
    debounceRef.current = setTimeout(() => {
      productApi
        .getAll({ keyword, size: 8 })
        .then((res) => {
          const found = (res?.content ?? []).map(toSuggestion);
          setCache((prev) => ({ ...prev, items: mergeById(prev.items, found) }));
        })
        .catch(() => {
          // Bỏ qua: vẫn còn gợi ý từ bộ nhớ đệm; lỗi tải bộ nhớ đệm đã có thông báo riêng
        })
        .finally(() => {
          if (seq === remoteSeqRef.current) setRemoteLoading(false);
        });
    }, 300);
  };

  const openDropdown = () => {
    setIsOpen(true);
    loadCache();
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    openDropdown();
    scheduleRemoteSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    setActiveIndex(-1);
    scheduleRemoteSearch("");
    inputRef.current?.focus();
  };

  // Focus rời khỏi cả khối tìm kiếm (Tab, bấm ra ngoài) -> đóng gợi ý
  const handleBlur = (e) => {
    if (!containerRef.current?.contains(e.relatedTarget)) closeDropdown();
  };

  const submitSearch = (term = query) => {
    const keyword = term.trim();
    closeDropdown();
    navigate(keyword ? `/products?search=${encodeURIComponent(keyword)}` : "/products");
  };

  const selectProduct = (productId) => {
    closeDropdown();
    navigate(`/products/${productId}`);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (activeOptionIndex >= 0) {
      selectProduct(options[activeOptionIndex].id);
    } else {
      submitSearch();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      if (options.length === 0) return;
      const down = e.key === "ArrowDown";
      setActiveIndex((prev) => {
        const current = prev >= 0 && prev < options.length ? prev : -1;
        if (down) return current + 1 >= options.length ? 0 : current + 1;
        return current <= 0 ? options.length - 1 : current - 1;
      });
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        closeDropdown();
      } else if (query) {
        handleClear();
      }
    }
  };

  const showStatus = options.length === 0;

  return (
    <div className="search-autocomplete-wrapper" ref={containerRef} onBlur={handleBlur}>
      <form role="search" onSubmit={handleFormSubmit} className="search-autocomplete-form">
        <Search size={18} className="search-autocomplete-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Tìm kiếm nông sản"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionIndex >= 0 ? `${baseId}-option-${activeOptionIndex}` : undefined}
          placeholder={placeholder}
          className="search-autocomplete-input"
          value={query}
          onChange={handleInputChange}
          onFocus={openDropdown}
          onClick={() => !isOpen && openDropdown()}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {isLoading && <div className="search-loading-spinner" role="status" aria-label="Đang tải gợi ý" />}

        {query && !isLoading && (
          <button type="button" className="search-clear-btn" onClick={handleClear} aria-label="Xoá nội dung tìm kiếm">
            <X size={14} />
          </button>
        )}

        <button type="submit" className="search-autocomplete-submit">
          Tìm
        </button>
      </form>

      {isOpen && (
        // Chặn mousedown để ô nhập không mất focus khi bấm vào gợi ý (click vẫn chạy bình thường)
        <div className="search-dropdown-menu" onMouseDown={(e) => e.preventDefault()}>
          {/* Danh mục thật từ /api/categories: ô trống -> tất cả, đang gõ -> danh mục khớp tên */}
          {matchedCategories.length > 0 && (
            <div className="search-category-bar">
              <span className="search-category-label">
                <Tag size={12} aria-hidden="true" /> Danh mục:
              </span>
              {matchedCategories.map((cat) => (
                <Link key={cat.id} to={`/category/${cat.slug}`} className="search-category-chip">
                  {hasQuery ? <HighlightMatch text={cat.name} query={query} /> : cat.name}
                </Link>
              ))}
            </div>
          )}

          {options.length > 0 && (
            <div className="search-dropdown-header">
              {hasQuery ? (
                <>
                  <span>Gợi ý sản phẩm</span>
                  <span className="search-dropdown-header-count">{options.length} sản phẩm</span>
                </>
              ) : (
                <span className="search-dropdown-header-title">
                  <TrendingUp size={14} aria-hidden="true" /> Sản phẩm bán chạy
                </span>
              )}
            </div>
          )}

          {options.length > 0 && (
            <ul className="search-suggestions-list" role="listbox" id={listboxId} aria-label="Gợi ý sản phẩm">
              {options.map((product, idx) => (
                <li
                  key={product.id}
                  id={`${baseId}-option-${idx}`}
                  role="option"
                  aria-selected={activeOptionIndex === idx}
                  className={`search-suggestion-item ${activeOptionIndex === idx ? "is-selected" : ""}`}
                  onClick={() => selectProduct(product.id)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div className="search-item-thumb-wrapper">
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="search-item-thumb"
                      loading="lazy"
                      onError={handleImageError}
                    />
                  </div>

                  <div className="search-item-info">
                    <div className="search-item-name">
                      <HighlightMatch text={product.name} query={query} />
                    </div>

                    <div className="search-item-meta">
                      {product.categoryName && <span className="search-item-category">{product.categoryName}</span>}
                      {product.shopName && (
                        <span className="search-item-origin">
                          {product.shopName}
                          {product.province && ` · ${product.province}`}
                        </span>
                      )}
                    </div>

                    {/* Nhãn AI giống hệt thẻ sản phẩm; chưa có nhãn -> không hiện */}
                    <AiQualityBadge
                      label={product.aiLabel}
                      confidence={product.aiConfidence}
                      className="search-item-ai"
                    />
                  </div>

                  <div className="search-item-price-col">
                    <div className="search-item-price">{formatVnd(product.price)}</div>
                    <div className="search-item-unit">
                      {hasQuery ? `/${product.unit}` : `Đã bán ${product.soldCount}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showStatus && (cache.status === "loading" || (hasQuery && remoteLoading)) && (
            <div className="search-dropdown-status">Đang tải gợi ý...</div>
          )}

          {showStatus && cache.status === "error" && !remoteLoading && (
            <div className="search-dropdown-status is-error" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>Không tải được gợi ý — nhấn Tìm để tìm kiếm</span>
            </div>
          )}

          {showStatus && hasQuery && cache.status === "ready" && !remoteLoading && (
            <div className="search-empty-state">
              <div className="search-empty-title">Không tìm thấy sản phẩm cho &ldquo;{query.trim()}&rdquo;</div>
              <div className="search-empty-desc">
                {matchedCategories.length > 0
                  ? "Thử xem theo danh mục phía trên, hoặc nhấn Tìm để tìm trong toàn bộ sản phẩm."
                  : "Thử từ khoá khác, hoặc nhấn Tìm để tìm trong toàn bộ sản phẩm."}
              </div>
            </div>
          )}

          {showStatus && !hasQuery && cache.status === "ready" && (
            <div className="search-dropdown-status">Chưa có sản phẩm nào đang bán.</div>
          )}

          {hasQuery && (
            <div className="search-dropdown-footer">
              <button type="button" className="search-view-all-btn" onClick={() => submitSearch()}>
                Xem tất cả kết quả cho &ldquo;<strong>{query.trim()}</strong>&rdquo;
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
