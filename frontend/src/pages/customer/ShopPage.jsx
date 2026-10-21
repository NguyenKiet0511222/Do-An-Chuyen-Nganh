import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { shopApi, resolveAssetUrl } from "../../services/api";
import { useCart } from "../../context/useCart";
import { apiErrorMessage, handleImageError } from "../../utils/format";
import AiQualityBadge from "../../components/AiQualityBadge";
import { Star, Store, AlertCircle } from "lucide-react";
import "./ShopPage.css";

const PAGE_SIZE = 8;
const PLACEHOLDER_IMAGE = "https://placehold.co/400x400?text=No+Image";

const formatPrice = (amount) => new Intl.NumberFormat("vi-VN").format(amount || 0);

// Thẻ sản phẩm riêng cho trang shop (wireframe) — dữ liệu là "Product (list item)" trong GET /api/shops/{id}
function ShopProductCard({ product, shopName }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const imageUrl = resolveAssetUrl(product.primaryImageUrl) || PLACEHOLDER_IMAGE;
  const hasRating = Number(product.ratingCount) > 0 && product.ratingAvg != null;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // addToCart trả false khi chưa đăng nhập (đã chuyển tới /login) hoặc API lỗi
    if (!(await addToCart(product, 1))) return;
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    <div className="shop-product-card-wf">
      <Link to={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div className="shop-product-img-box">
          {/* Nhãn AI tổng hợp thật; chưa có nhãn -> không hiện */}
          <AiQualityBadge
            label={product.aiOverallLabel}
            confidence={product.aiOverallConfidence}
            className="shop-product-ai-badge"
          />
          <img src={imageUrl} alt={product.name} onError={handleImageError} />
        </div>
      </Link>
      <div className="shop-product-info">
        <Link to={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="shop-product-title">{product.name}</div>
        </Link>
        <div className="shop-product-shopname">{product.shop?.shopName || shopName}</div>
        <div className="shop-product-price">{formatPrice(product.price)} đ/{product.unit || "kg"}</div>
        <div className="shop-product-stats">
          Đã bán {product.soldCount ?? 0}
          {hasRating && (
            <>
              {" • "}
              <Star size={10} fill="currentColor" className="shop-star-icon" /> {Number(product.ratingAvg).toFixed(1)}
            </>
          )}
        </div>
        <button
          type="button"
          className="shop-product-btn-add"
          onClick={handleAdd}
          style={{ backgroundColor: isAdded ? "var(--primary)" : "", color: isAdded ? "#fff" : "" }}
        >
          {isAdded ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { id } = useParams();
  const [reloadToken, setReloadToken] = useState(0);

  // Trang hiện tại gắn với shop đang xem: đổi shop thì về trang 1 (tính lúc render, không cần effect)
  const [pageState, setPageState] = useState({ shopId: id, page: 0 });
  const page = pageState.shopId === id ? pageState.page : 0;

  const requestKey = `${id}|${page}|${reloadToken}`;
  const [result, setResult] = useState({ key: null, shopId: null, shop: null, products: null, error: null, status: null });

  useEffect(() => {
    let ignore = false;
    shopApi
      .getShopPublicPage(id, page, PAGE_SIZE)
      .then((data) => {
        if (!ignore) {
          setResult({ key: requestKey, shopId: id, shop: data?.shop ?? null, products: data?.products ?? null, error: null, status: null });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setResult({
            key: requestKey,
            shopId: id,
            shop: null,
            products: null,
            error: apiErrorMessage(err, "Không tải được cửa hàng. Kiểm tra kết nối rồi thử lại."),
            status: err?.response?.status ?? null
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, [id, page, requestKey]);

  const loading = result.key !== requestKey;
  const shop = result.shopId === id ? result.shop : null;
  const products = !loading ? result.products?.content ?? [] : [];
  const totalElements = result.shopId === id ? result.products?.totalElements ?? 0 : 0;
  const totalPages = result.shopId === id ? Math.max(1, result.products?.totalPages ?? 1) : 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPageState({ shopId: id, page: newPage });
      window.scrollTo(0, 0);
    }
  };

  if (!loading && result.error) {
    // 404 (hoặc id sai định dạng): không có shop; 403: shop chưa xác minh / bị khoá
    const notFound = result.status === 404 || result.status === 400;
    const inactive = result.status === 403;
    return (
      <div className="shop-page-wf-container">
        <div className="detail-error-card" role="alert">
          <AlertCircle size={40} color="#dc2626" />
          <h2>{notFound ? "Không tìm thấy cửa hàng" : inactive ? "Cửa hàng không hoạt động" : "Không tải được cửa hàng"}</h2>
          <p>
            {notFound
              ? "Cửa hàng không tồn tại hoặc đường dẫn không đúng."
              : inactive
              ? "Cửa hàng đang chờ xác minh hoặc tạm ngừng bán."
              : result.error}
          </p>
          <div className="error-actions">
            {!notFound && !inactive && (
              <button type="button" className="btn-secondary" onClick={() => setReloadToken((t) => t + 1)}>
                Thử lại
              </button>
            )}
            <Link to="/products" className="btn-primary">Xem sản phẩm khác</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="shop-page-wf-container" style={{ textAlign: "center", padding: "80px 20px", color: "#666" }}>
        Đang tải thông tin cửa hàng...
      </div>
    );
  }

  const shopLogo = resolveAssetUrl(shop.logoUrl);
  const hasShopRating = Number(shop.ratingCount) > 0 && shop.ratingAvg != null;
  const metaParts = [
    shop.province,
    hasShopRating ? `★ ${Number(shop.ratingAvg).toFixed(1)} (${shop.ratingCount} đánh giá)` : "Chưa có đánh giá",
    `${totalElements} sản phẩm`
  ].filter(Boolean);

  return (
    <div className="shop-page-wf-container">
      {/* Breadcrumb */}
      <div className="shop-wf-breadcrumb">
        <Link to="/">Trang chủ</Link> / <span>{shop.shopName}</span>
      </div>

      {/* Header Card */}
      <div className="shop-wf-header-card">
        <div className="shop-wf-avatar-box" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--primary-subtle)" }}>
          {shopLogo ? (
            <img src={shopLogo} alt={shop.shopName} onError={handleImageError} />
          ) : (
            <Store size={44} color="var(--primary)" />
          )}
        </div>
        <div className="shop-wf-header-info">
          <div className="shop-wf-title-row">
            <h1>{shop.shopName}</h1>
            {/* API chỉ trả shop đang hoạt động (đã được admin xác minh) */}
            <span className="shop-wf-badge">Đã xác minh</span>
          </div>
          <div className="shop-wf-meta-row">{metaParts.join(" • ")}</div>
          {shop.description && <div className="shop-wf-desc-row">{shop.description}</div>}
        </div>
      </div>

      {/* Tabs */}
      <div className="shop-wf-tabs">
        <div className="shop-wf-tab active">Sản phẩm ({totalElements})</div>
        <div className="shop-wf-tab">Giới thiệu cửa hàng</div>
        <div className="shop-wf-tab">Đánh giá khách hàng</div>
      </div>

      {/* Filters */}
      <div className="shop-wf-filter-bar">
        <div className="shop-wf-search">
          <input type="text" placeholder="Tìm kiếm nông sản trong shop..." />
        </div>
        <div className="shop-wf-dropdowns">
          <select>
            <option>Tất cả danh mục</option>
          </select>
          <select>
            <option>Sắp xếp: Mới nhất</option>
            <option>Sắp xếp: Bán chạy</option>
            <option>Giá: Thấp đến cao</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>Đang tải sản phẩm...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>Shop chưa có sản phẩm nào đang bán.</div>
      ) : (
        <div className="shop-wf-products-grid">
          {products.map((product) => (
            <ShopProductCard key={product.id} product={product} shopName={shop.shopName} />
          ))}
        </div>
      )}

      {/* Pagination — phân trang phía server */}
      {totalPages > 1 && (
        <div className="shop-wf-pagination">
          <span className="shop-wf-page-info">
            Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalElements)} / {totalElements}
          </span>
          <button
            type="button"
            className="shop-wf-page-btn"
            disabled={page === 0 || loading}
            onClick={() => handlePageChange(page - 1)}
            aria-label="Trang trước"
          >&lt;</button>

          {[...Array(totalPages)].map((_, idx) => (
            <button
              type="button"
              key={idx}
              className={`shop-wf-page-btn ${page === idx ? "active" : ""}`}
              disabled={loading}
              onClick={() => handlePageChange(idx)}
            >
              {idx + 1}
            </button>
          ))}

          <button
            type="button"
            className="shop-wf-page-btn"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => handlePageChange(page + 1)}
            aria-label="Trang sau"
          >&gt;</button>
        </div>
      )}
    </div>
  );
}
