import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productApi, categoryApi } from "../../services/api";
import ProductCard from "../../components/ProductCard";
import { Camera, Store, Star, Play } from "lucide-react";
import "./HomePage.css";

// Helper function to get an icon based on category slug/name
const getCategoryIcon = (slug) => {
  const iconMap = {
    'rau-cu': '🥦',
    'trai-cay': '🍎',
    'nam': '🍄',
    'thuc-pham-kho': '🌾',
    'dac-san': '🍯',
  };
  return iconMap[slug] || '🍇';
};

export default function HomePage() {
  const [newProducts, setNewProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getAll({ size: 10 }),
          categoryApi.getAll()
        ]);
        
        if (!ignore) {
          // Xử lý products
          const products = productsRes.content || [];
          setNewProducts(products.slice(0, 4));
          
          if (products.length >= 8) {
            setBestSellers(products.slice(4, 8));
          } else if (products.length > 4) {
            setBestSellers(products.slice(products.length - 4, products.length));
          } else {
            setBestSellers([...products].reverse());
          }

          // Xử lý categories
          const cats = categoriesRes || [];
          // Lấy 5 danh mục đầu tiên để hiển thị, cái thứ 6 sẽ là "Tất cả"
          const displayCats = cats.slice(0, 5).map(c => ({
            id: c.slug || c.id,
            name: c.name,
            icon: getCategoryIcon(c.slug),
            count: `${c.productCount || 0} sản phẩm`,
            isAll: false
          }));

          // Thêm mục "Tất cả"
          displayCats.push({
            id: 'all',
            name: "Tất cả mục",
            icon: "🍇",
            count: "Khám phá",
            isAll: true
          });
          
          setCategories(displayCats);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, []);

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

      {/* 2. Categories */}
      <section className="hp-categories-section section-container">
        <div className="section-header-new">
          <div className="sh-left">
            <h2 className="sh-title">Danh mục sản phẩm</h2>
            <p className="sh-subtitle">Tuyển chọn các mặt hàng sạch được phân loại theo nông hộ</p>
          </div>
          <Link to="/categories" className="sh-link">Xem tất cả &rarr;</Link>
        </div>
        <div className="categories-grid-new">
          {categories.map((cat) => (
            <Link to={cat.isAll ? '/categories' : `/category/${cat.id}`} key={cat.id} className="category-card-new">
              <div className="cat-icon-new">{cat.icon}</div>
              <h3 className="cat-name-new">{cat.name}</h3>
              <p className="cat-count-new">{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Sản phẩm mới duyệt */}
      <section className="hp-products-section section-container">
        <div className="section-header">
          <h2 className="section-title">Sản phẩm mới duyệt</h2>
          <Link to="/products?sort=new" className="view-all-link">Xem thêm</Link>
        </div>
        {loading ? (
          <div className="hp-loading">Đang tải sản phẩm...</div>
        ) : (
          <div className="products-grid">
            {newProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. AI Check Banner */}
      <section className="hp-ai-banner-section section-container">
        <div className="ai-horizontal-banner">
          <div className="ai-banner-icon">
            <Camera size={48} strokeWidth={1} />
          </div>
          <div className="ai-banner-text">
            <h3>Không chắc rau quả còn tươi? Để AI kiểm tra giúp bạn</h3>
            <p>Chụp hoặc tải ảnh nông sản, hệ thống trả kết quả tươi / hỏng kém % tin cậy trong vài giây.</p>
          </div>
          <div className="ai-banner-action">
            <Link to="/ai-check" className="btn-dark">Kiểm tra ngay</Link>
          </div>
        </div>
      </section>

      {/* 5. Bán chạy tuần này */}
      <section className="hp-products-section section-container">
        <div className="section-header">
          <h2 className="section-title">Bán chạy tuần này</h2>
          <Link to="/products?sort=best_seller" className="view-all-link">Xem thêm</Link>
        </div>
        {loading ? (
          <div className="hp-loading">Đang tải sản phẩm...</div>
        ) : (
          <div className="products-grid">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Shop nổi bật */}
      <section className="hp-shops-section section-container">
        <div className="section-header">
          <h2 className="section-title">Shop nổi bật</h2>
        </div>
        <div className="shops-grid">
          {[
            { id: 1, name: "Vườn rau Tâm An", address: "Lâm Đồng", rating: 4.6, productsCount: 18 },
            { id: 2, name: "HTX Xoài Cao Lãnh", address: "Đồng Tháp", rating: 4.8, productsCount: 12 },
            { id: 3, name: "Đặc sản Tây Bắc", address: "Sơn La", rating: 4.7, productsCount: 15 }
          ].map(shop => (
            <div key={shop.id} className="shop-card">
              <div className="shop-info">
                <div className="shop-avatar">
                  <Store size={24} />
                </div>
                <div className="shop-details">
                  <h4>{shop.name}</h4>
                  <div className="shop-meta">
                    <span>{shop.address}</span>
                    <span className="dot">•</span>
                    <span className="shop-rating"><Star size={12} fill="currentColor" /> {shop.rating}</span>
                    <span className="dot">•</span>
                    <span>{shop.productsCount} sản phẩm</span>
                  </div>
                </div>
              </div>
              <Link to={`/shops/${shop.id}`} className="btn-outline-small">Xem shop</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

