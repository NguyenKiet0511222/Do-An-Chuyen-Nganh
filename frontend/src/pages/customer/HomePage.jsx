import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../services/api";
import ProductCard from "../../components/ProductCard";
import { Camera, Store, Star, Play, ShieldCheck } from "lucide-react";
import "./HomePage.css";

export default function HomePage() {
  const [newProducts, setNewProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchProducts() {
      try {
        const res = await productApi.getAll({ size: 10 });
        if (!ignore) {
          const products = res.content || [];
          setNewProducts(products.slice(0, 4));
          
          if (products.length >= 8) {
            setBestSellers(products.slice(4, 8));
          } else if (products.length > 4) {
            // Have 5-7 items, take the last 4
            setBestSellers(products.slice(products.length - 4, products.length));
          } else {
            // Less than or equal to 4 items, reuse them to not show an empty section
            setBestSellers([...products].reverse());
          }
          
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) setLoading(false);
      }
    }
    fetchProducts();
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
          {[
            { id: 'rau-cu', name: "Rau củ tươi", icon: "🥦", count: "85+ loại" },
            { id: 'trai-cay', name: "Trái cây", icon: "🍎", count: "62+ loại" },
            { id: 'nam', name: "Nấm hữu cơ", icon: "🍄", count: "24+ loại" },
            { id: 'thuc-pham-kho', name: "Thực phẩm khô", icon: "🌾", count: "40+ loại" },
            { id: 'dac-san', name: "Đặc sản vùng", icon: "🍯", count: "50+ món" },
            { id: 'all', name: "Tất cả mục", icon: "🍇", count: "Khám phá" }
          ].map((cat) => (
            <Link to={cat.id === 'all' ? '/categories' : `/category/${cat.id}`} key={cat.id} className="category-card-new">
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
              <Link to={`/shop/${shop.id}`} className="btn-outline-small">Xem shop</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

