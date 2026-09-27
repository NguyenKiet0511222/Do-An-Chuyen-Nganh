import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../services/api";
import ProductCard from "../../components/ProductCard";
import { ArrowRight, ChevronRight, Leaf, Quote, Carrot, Apple, Fish, Coffee, Wheat, Package, Cpu, Sparkles, ShieldCheck, CheckCircle2, Sprout, Droplets } from "lucide-react";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchProducts() {
      try {
        const res = await productApi.getAll({ size: 12 });
        if (!ignore) {
          setFeaturedProducts(res.content || []);
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
      {/* 1. Hero Section (Original AI Style) */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} className="text-amber" />
              <span>Tiên phong công nghệ Nông sản AI 4.0</span>
            </div>

            <h1 className="hero-title">
              TÌM MUA THỰC PHẨM SẠCH TỪ <br />
              <span className="text-gradient">NHÀ CUNG CẤP UY TÍN TẠI ĐÂY</span>
            </h1>

            <p className="hero-subtitle">
              Mỗi trái cây, củ quả và rau xanh tại AgriFresh đều được quét thị giác máy
              tính (AI Vision) để đánh giá độ tươi, phát hiện khuyết tật vỏ và phân
              loại phẩm cấp minh bạch trước khi đến tay gia đình bạn.
            </p>

            <div className="hero-cta-group">
              <Link to="/products" className="btn-primary">
                <span>Mua sắm ngay</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/ai-check" className="btn-secondary">
                <Cpu size={18} className="text-emerald" />
                <span>Thử nghiệm AI Kiểm định</span>
              </Link>
            </div>

            <div className="hero-trust-row">
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <span>100% Nông sản VietGAP</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <span>Minh bạch phẩm cấp AI</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="text-emerald" />
                <span>Đổi trả nếu dập úng</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card-glass">
              <img
                src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=700&q=80"
                alt="Nông sản tươi xanh được kiểm định"
                className="hero-main-img"
              />
              <div className="floating-ai-tag">
                <div className="ai-tag-icon">
                  <Cpu size={20} />
                </div>
                <div className="ai-tag-info">
                  <span className="tag-title">AI Vision Scanner</span>
                  <span className="tag-status">Độ tươi: 98.6% • Loại 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Row */}
      <section className="hp-categories-section section-container">
        <h2 className="hp-section-title">Mua sản phẩm được lựa chọn từ vườn</h2>
        <div className="hp-categories-grid">
          {[
            { id: 1, name: "Rau củ", icon: Carrot },
            { id: 2, name: "Hoa quả", icon: Apple },
            { id: 3, name: "Thịt hải sản", icon: Fish },
            { id: 4, name: "Đồ uống", icon: Coffee },
            { id: 5, name: "Đồ khô", icon: Wheat },
            { id: 6, name: "Khác", icon: Package }
          ].map((cat) => (
            <div key={cat.id} className="hp-category-item">
              <div className="hp-cat-icon-circle">
                <cat.icon size={36} color="#16a34a" strokeWidth={1.5} />
              </div>
              <span className="hp-cat-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Promotions Row */}
      <section className="hp-promotions-section section-container">
        <h2 className="hp-section-title">CHƯƠNG TRÌNH KHUYẾN MÃI</h2>
        <div className="hp-promo-grid">
          <div className="hp-promo-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80')" }}>
            <div className="hp-promo-content">
              <h3>Thực phẩm hữu cơ</h3>
              <p>Khuyến mãi đặc biệt</p>
              <div className="hp-promo-price">Chỉ từ <span>55.000đ</span></div>
            </div>
          </div>
          <div className="hp-promo-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80')" }}>
            <div className="hp-promo-content">
              <h3>Trái cây tươi mới</h3>
              <p>Giảm giá cuối tuần</p>
              <div className="hp-promo-price">Giảm đến <span>30%</span></div>
            </div>
          </div>
          <div className="hp-promo-card" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80')" }}>
            <div className="hp-promo-content">
              <h3>Thịt tươi sạch</h3>
              <p>Nguồn gốc rõ ràng</p>
              <div className="hp-promo-price">Chỉ từ <span>120.000đ</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Products */}
      <section className="hp-featured-products section-container">
        <h2 className="hp-section-title">Sản phẩm nổi bật</h2>
        {loading ? (
          <div className="hp-loading">Đang tải sản phẩm...</div>
        ) : (
          <div className="products-grid">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <div className="hp-view-all-box">
          <Link to="/products" className="hp-btn-view-all">Xem tất cả</Link>
        </div>
      </section>

      {/* 5. Partners */}
      <section className="hp-partners-section section-container">
        <h2 className="hp-section-title">Kết nối nhà vườn</h2>
        <div className="hp-partners-grid">
          <div className="hp-partner-logo">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "80px" }}>
              <Leaf size={40} color="#16a34a" />
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "#0f5132" }}>TMF</span>
            </div>
            <p>Cam kết 100% thực phẩm sạch chuẩn VietGAP</p>
          </div>
          <div className="hp-partner-logo">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "80px" }}>
              <Sprout size={40} color="#16a34a" />
              <span style={{ fontSize: "1.7rem", fontWeight: 800, color: "#16a34a", whiteSpace: "nowrap" }}>Viet Nature</span>
            </div>
            <p>Nguồn gốc rõ ràng, an toàn tuyệt đối</p>
          </div>
          <div className="hp-partner-logo">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "80px" }}>
              <Droplets size={40} color="#0284c7" />
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "#0284c7" }}>BINCA</span>
            </div>
            <p>Sản phẩm hữu cơ chứng nhận quốc tế</p>
          </div>
          <div className="hp-partner-logo">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "80px" }}>
              <Wheat size={40} color="#b45309" />
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "#78350f" }}>dafusa</span>
            </div>
            <p>Được kiểm định chất lượng chặt chẽ</p>
          </div>
        </div>
      </section>

      {/* 6. Blog/Articles */}
      <section className="hp-articles-section section-container">
        <h2 className="hp-section-title">Hành trình Organic bắt đầu từ đây</h2>
        <div className="hp-articles-grid">
          {[
            { id: 1, title: "Làm thế nào để được chứng nhận là sản phẩm Organic?", icon: Leaf, bg: "linear-gradient(135deg, #16a34a, #059669)", link: "https://vnexpress.net/nong-nghiep-huu-co-4632731.html" },
            { id: 2, title: "Giới thiệu : Thực phẩm hữu cơ Organic là gì?", icon: Sprout, bg: "linear-gradient(135deg, #f59e0b, #b45309)", link: "https://thanhnien.vn/thuc-pham-huu-co-organic-la-gi-185230510103623512.htm" },
            { id: 3, title: "Nông nghiệp hữu cơ và thực trạng ở Việt Nam", icon: Carrot, bg: "linear-gradient(135deg, #0ea5e9, #0284c7)", link: "https://tuoitre.vn/nong-nghiep-huu-co.html" },
            { id: 4, title: "Tổng hợp những điều bạn cần biết về thực phẩm Organic", icon: Droplets, bg: "linear-gradient(135deg, #8b5cf6, #6d28d9)", link: "https://dantri.com.vn/suc-khoe/thuc-pham-organic-la-gi-hieu-sao-cho-dung-20220914101859604.htm" }
          ].map(art => (
            <a key={art.id} href={art.link} target="_blank" rel="noopener noreferrer" className="hp-article-card">
              <div style={{ height: "180px", background: art.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <art.icon size={64} color="#ffffff" strokeWidth={1.5} opacity={0.9} />
              </div>
              <h4 className="hp-article-title">{art.title}</h4>
              <p className="hp-article-excerpt">Cùng tìm hiểu về chuẩn nông nghiệp hữu cơ organic và cách chọn mua an toàn cho sức khỏe...</p>
            </a>
          ))}
        </div>
      </section>

      {/* 7. Testimonials */}
      <section className="hp-testimonials-section">
        <div className="hp-testi-overlay">
          <div className="section-container">
            <h2 className="hp-section-title" style={{ color: "#fff" }}>Khách hàng nói gì về MonaFresh</h2>
            <div className="hp-testi-grid">
              <div className="hp-testi-item">
                <div className="hp-testi-avatar">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" alt="Avatar" />
                </div>
                <p>"Rất yên tâm khi mua sắm thực phẩm sạch tại đây. Hàng hóa luôn tươi mới và được giao rất nhanh chóng."</p>
                <strong>Chị Phạm - Hà Nội</strong>
              </div>
              <div className="hp-testi-item">
                <div className="hp-testi-avatar">
                  <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80" alt="Avatar" />
                </div>
                <p>"Rau củ quả rất tươi, đóng gói cẩn thận. Tôi rất thích các sản phẩm hữu cơ tại cửa hàng, ăn rất ngon."</p>
                <strong>Chị Mai Hoa - HCM</strong>
              </div>
              <div className="hp-testi-item">
                <div className="hp-testi-avatar">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80" alt="Avatar" />
                </div>
                <p>"Dịch vụ rất tốt, nhân viên tư vấn nhiệt tình. Sẽ luôn ủng hộ cửa hàng trong thời gian tới để bảo vệ sức khỏe gia đình."</p>
                <strong>Chị Thủy - Đà Nẵng</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. AI Teaser Banner (Added Back) */}
      <section className="ai-teaser-section">
        <div className="section-container">
          <div className="ai-teaser-banner">
            <div className="teaser-content">
              <div className="teaser-badge">
                <Sparkles size={16} /> Công nghệ đột phá của đề tài
              </div>
              <h2>Bạn Có Nông Sản Cần Kiểm Định Chất Lượng?</h2>
              <p>
                Trải nghiệm ngay tính năng tải ảnh quả/rau để mô hình AI phân tích tự động:
                chấm điểm độ tươi, phát hiện vết xước, đánh giá phẩm cấp Loại 1 hay Loại 2
                và gợi ý hạn sử dụng tức thì.
              </p>
              <Link to="/ai-check" className="btn-ai-action">
                <Cpu size={18} />
                <span>Bắt đầu kiểm tra ảnh ngay</span>
              </Link>
            </div>
            <div className="teaser-preview">
              <div className="scan-simulator-card">
                <div className="scan-line"></div>
                <img
                  src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80"
                  alt="AI Scan demo"
                />
                <div className="scan-overlay-info">
                  <div className="scan-badge">Đang quét... Phân loại: 98%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Certifications */}
      <section className="hp-certs-section section-container">
        <h2 className="hp-section-title">Cam kết của chúng tôi</h2>
        <div className="hp-certs-grid">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4" }}>
              <ShieldCheck size={40} color="#16a34a" />
            </div>
            <strong style={{ color: "#15803d", fontSize: "0.95rem" }}>USDA Organic</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid #0284c7", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f9ff" }}>
              <CheckCircle2 size={40} color="#0284c7" />
            </div>
            <strong style={{ color: "#0369a1", fontSize: "0.95rem" }}>GlobalG.A.P</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid #b45309", display: "flex", alignItems: "center", justifyContent: "center", background: "#fffbeb" }}>
              <Leaf size={40} color="#b45309" />
            </div>
            <strong style={{ color: "#92400e", fontSize: "0.95rem" }}>Fairtrade</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid #6d28d9", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f3ff" }}>
              <Sparkles size={40} color="#6d28d9" />
            </div>
            <strong style={{ color: "#5b21b6", fontSize: "0.95rem" }}>AI Verified</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

