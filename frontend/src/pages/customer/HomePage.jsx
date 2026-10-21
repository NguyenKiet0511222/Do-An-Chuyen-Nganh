import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { productApi, categoryApi } from "../../services/api";
import { flattenCategoryTree } from "../../utils/categories";
import { apiErrorMessage } from "../../utils/format";
import ProductCard from "../../components/ProductCard";
import { Camera, Store, Play, AlertCircle, RefreshCw } from "lucide-react";
import "./HomePage.css";

const HOME_PRODUCT_COUNT = 4;
const HOME_CATEGORY_COUNT = 5;
const FEATURED_SHOP_COUNT = 3;

// Biểu tượng theo slug danh mục thật (ProductSeeder); danh mục mới chưa có biểu tượng riêng thì dùng mặc định
const CATEGORY_ICONS = {
  "rau-cu": "🥦",
  "cu-qua": "🥕",
  "rau-la": "🥬",
  "trai-cay": "🍎"
};
const categoryIcon = (slug) => CATEGORY_ICONS[slug] || "🌱";

export default function HomePage() {
  const [reloadToken, setReloadToken] = useState(0);
  // key = reloadToken của lần tải đã xong; khác reloadToken hiện tại nghĩa là đang tải
  const [data, setData] = useState({ key: null, newProducts: [], bestSellers: [], categories: [], error: null });

  useEffect(() => {
    let ignore = false;
    Promise.allSettled([
      productApi.getAll({ sort: "newest", size: HOME_PRODUCT_COUNT }),
      productApi.getAll({ sort: "bestSelling", size: HOME_PRODUCT_COUNT }),
      categoryApi.getAll()
    ]).then(([newestRes, bestRes, categoriesRes]) => {
      if (ignore) return;
      const productError = [newestRes, bestRes].find((r) => r.status === "rejected");
      setData({
        key: reloadToken,
        newProducts: newestRes.status === "fulfilled" ? newestRes.value?.content ?? [] : [],
        bestSellers: bestRes.status === "fulfilled" ? bestRes.value?.content ?? [] : [],
        categories: categoriesRes.status === "fulfilled" ? flattenCategoryTree(categoriesRes.value) : [],
        error: productError ? apiErrorMessage(productError.reason, "Không tải được sản phẩm. Kiểm tra kết nối rồi thử lại.") : null
      });
    });
    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  const loading = data.key !== reloadToken;

  const displayCategories = useMemo(
    () => data.categories.slice(0, HOME_CATEGORY_COUNT),
    [data.categories]
  );

  // Shop nổi bật = các shop đang có sản phẩm bán chạy/mới (lấy từ chính dữ liệu sản phẩm thật, không viết cứng)
  const featuredShops = useMemo(() => {
    const shops = new Map();
    [...data.bestSellers, ...data.newProducts].forEach((p) => {
      if (p.shop?.id != null && !shops.has(p.shop.id)) shops.set(p.shop.id, p.shop);
    });
    return [...shops.values()].slice(0, FEATURED_SHOP_COUNT);
  }, [data.bestSellers, data.newProducts]);

  const handleRetry = () => setReloadToken((t) => t + 1);

  const renderProductGrid = (products, emptyText) => {
    if (loading) return <div className="hp-loading">Đang tải sản phẩm...</div>;
    if (products.length === 0) return data.error ? null : <div className="hp-loading">{emptyText}</div>;
    return (
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="home-page">
      {/* 1. Main Banner */}
      <section className="hero-banner-section section-container">
        <div className="main-banner-new">
          <h1 className="mb-title">Nông sản tươi từ vườn<br/>đến bàn ăn của bạn</h1>
          <p className="mb-subtitle">Mỗi mẻ nông sản được thu hoạch trong ngày và được hệ thống AI giám sát<br/>độ tươi mới, cam kết không tồn dư thuốc bảo vệ thực vật.</p>
          <div className="mb-actions">
            <Link to="/products" className="btn-buy-now-new">Mua ngay</Link>
            <button className="btn-video-new"><Play size={16} fill="currentColor" /> Xem quy trình thu hoạch</button>
          </div>
        </div>
      </section>

      {/* Lỗi tải sản phẩm -> báo lỗi + thử lại, không hiện sản phẩm giả */}
      {!loading && data.error && (
        <section className="section-container">
          <div className="api-error-banner" role="alert">
            <AlertCircle size={22} className="error-icon" />
            <div className="error-content">
              <strong>Không tải được sản phẩm</strong>
              {data.error}
            </div>
            <button type="button" className="retry-btn" onClick={handleRetry}>
              <RefreshCw size={14} /> Thử lại
            </button>
          </div>
        </section>
      )}

      {/* 2. Categories — dựng từ /api/categories */}
      {(loading || displayCategories.length > 0) && (
        <section className="hp-categories-section section-container">
          <div className="section-header-new">
            <div className="sh-left">
              <h2 className="sh-title">Danh mục sản phẩm</h2>
              <p className="sh-subtitle">Tuyển chọn các mặt hàng sạch được phân loại theo nông hộ</p>
            </div>
            <Link to="/products" className="sh-link">Xem tất cả &rarr;</Link>
          </div>
          {loading ? (
            <div className="hp-loading">Đang tải danh mục...</div>
          ) : (
            <div className="categories-grid-new">
              {displayCategories.map((cat) => (
                <Link to={`/category/${cat.slug}`} key={cat.id} className="category-card-new">
                  <div className="cat-icon-new">{categoryIcon(cat.slug)}</div>
                  <h3 className="cat-name-new">{cat.name}</h3>
                  <p className="cat-count-new">{cat.productCount} sản phẩm</p>
                </Link>
              ))}
              <Link to="/products" className="category-card-new">
                <div className="cat-icon-new">🧺</div>
                <h3 className="cat-name-new">Tất cả mục</h3>
                <p className="cat-count-new">Khám phá</p>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 3. Sản phẩm mới duyệt */}
      <section className="hp-products-section section-container">
        <div className="section-header">
          <h2 className="section-title">Sản phẩm mới duyệt</h2>
          <Link to="/products?sort=newest" className="view-all-link">Xem thêm</Link>
        </div>
        {renderProductGrid(data.newProducts, "Chưa có sản phẩm nào đang bán.")}
      </section>

      {/* 4. AI Check Banner */}
      <section className="hp-ai-banner-section section-container">
        <div className="ai-horizontal-banner">
          <div className="ai-banner-icon">
            <Camera size={48} strokeWidth={1} />
          </div>
          <div className="ai-banner-text">
            <h3>Không chắc rau quả còn tươi? Để AI kiểm tra giúp bạn</h3>
            <p>Chụp hoặc tải ảnh nông sản, hệ thống trả kết quả tươi / hỏng kèm % tin cậy trong vài giây.</p>
          </div>
          <div className="ai-banner-action">
            <Link to="/ai-check" className="btn-dark">Kiểm tra ngay</Link>
          </div>
        </div>
      </section>

      {/* 5. Bán chạy — sort=bestSelling của backend */}
      <section className="hp-products-section section-container">
        <div className="section-header">
          <h2 className="section-title">Bán chạy</h2>
          <Link to="/products?sort=bestSelling" className="view-all-link">Xem thêm</Link>
        </div>
        {renderProductGrid(data.bestSellers, "Chưa có sản phẩm nào đang bán.")}
      </section>

      {/* 6. Shop nổi bật — shop của các sản phẩm ở trên */}
      {!loading && featuredShops.length > 0 && (
        <section className="hp-shops-section section-container">
          <div className="section-header">
            <h2 className="section-title">Shop nổi bật</h2>
          </div>
          <div className="shops-grid">
            {featuredShops.map((shop) => (
              <div key={shop.id} className="shop-card">
                <div className="shop-info">
                  <div className="shop-avatar">
                    <Store size={24} />
                  </div>
                  <div className="shop-details">
                    <h4>{shop.shopName}</h4>
                    {shop.province && (
                      <div className="shop-meta">
                        <span>{shop.province}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Link to={`/shops/${shop.id}`} className="btn-outline-small">Xem shop</Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
