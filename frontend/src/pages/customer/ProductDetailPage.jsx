import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi } from "../../services/api";
import { useCart } from "../../context/useCart";
import ProductCard from "../../components/ProductCard";
import { Star, Plus, Minus } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    let ignore = false;
    async function loadProduct() {
      try {
        const data = await productApi.getById(id);
        if (!ignore) {
          if (data) {
            setProduct(data);
          }
        }
      } catch (err) {
        if (!ignore) console.error("Lỗi:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadProduct();
    return () => { ignore = true; };
  }, [id]);

  if (loading || !product) {
    return <div className="detail-page-container">Loading...</div>;
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [
        { url: product.primaryImageUrl || "/placeholder.jpg", ai: { label: "FRESH", confidence: 0.96 } },
        { url: "/placeholder.jpg", ai: { label: "FRESH", confidence: 0.91 } },
        { url: "/placeholder.jpg", ai: { label: "FRESH", confidence: 0.89 } }
      ];

  const currentImage = images[selectedImageIndex] || images[0];
  const unit = product.unit || "kg";

  const handleAddToCart = () => {
    const normalizedProduct = {
      ...product,
      image: product.primaryImageUrl || currentImage.url || "/placeholder.jpg",
      aiGrade: "Tươi sạch AI",
      origin: product.origin || "Đà Lạt",
      unit
    };
    addToCart(normalizedProduct, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  return (
    <div className="detail-page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/products" className="breadcrumb-link">Rau củ</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/products" className="breadcrumb-link">Củ quả</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="detail-top-section">
        {/* Left Gallery */}
        <div className="detail-gallery">
          <div className="main-image-wrapper">
            <img src={currentImage.url} alt={product.name} className="main-image" />
            <div className="image-watermark">Ảnh chính 800x600</div>
          </div>
          <div className="thumbnail-list">
            {images.map((img, idx) => (
              <button
                key={idx}
                className={`thumbnail-btn ${selectedImageIndex === idx ? "active" : ""}`}
                onClick={() => setSelectedImageIndex(idx)}
              >
                <img src={img.url} alt={`Thumb ${idx}`} />
                <div className="thumb-ai-label">Tươi {Math.round((img.ai?.confidence || 0.9) * 100)}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Info */}
        <div className="detail-info">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-meta">
            <div className="stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className={i < 4 ? "star-filled" : i === 4 ? "star-half" : "star-empty"} />
              ))}
            </div>
            <span>4.6 (18 đánh giá)</span>
            <span className="dot">•</span>
            <span>Đã bán 214</span>
            <span className="dot">•</span>
            <span>Mã SP-01187</span>
          </div>

          <div className="product-price">
            {product.price.toLocaleString("vi-VN")} ₫ <span>/ {unit}</span>
          </div>

          <div className="ai-quality-box">
            <div className="ai-box-header">
              <span className="ai-label">Nhãn chất lượng AI</span>
              <span className="ai-badge">Tươi • 92% <span className="info-icon">i</span></span>
            </div>
            <div className="ai-progress-bar">
              <div className="ai-progress-fill" style={{ width: "92%" }}></div>
            </div>
            <p className="ai-box-desc">
              3/3 ảnh sản phẩm được AI đánh giá tươi (độ tin cậy trung bình 92%). Kết quả do mô hình phân loại ảnh, đã qua admin kiểm duyệt.
            </p>
          </div>

          <div className="product-specs">
            <div className="spec-row">
              <span className="spec-name">Xuất xứ</span>
              <span className="spec-value">Đà Lạt, Lâm Đồng</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Còn hàng</span>
              <span className="spec-value">{product.stockQuantity || 120} {unit}</span>
            </div>
            <div className="spec-row align-center">
              <span className="spec-name">Số lượng</span>
              <div className="quantity-selector">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={16}/></button>
                <input type="number" value={quantity} readOnly />
                <button onClick={() => setQuantity(q => q + 1)}><Plus size={16}/></button>
              </div>
              <span className="unit-label">{unit}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-add-cart" onClick={handleAddToCart}>Thêm vào giỏ</button>
            <button className="btn-buy-now" onClick={handleBuyNow}>Mua ngay</button>
          </div>

          <div className="shop-card-mini">
            <div className="shop-info-left">
              <div className="shop-avatar">
                {(product.shop?.logoUrl) && <img src={product.shop.logoUrl} alt={product.shop.shopName} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />}
              </div>
              <div className="shop-details-mini">
                <h4>{product.shop?.shopName || "Vườn rau Tâm An"} <span className="verified-badge">Đã xác minh</span></h4>
                <p>{product.shop?.province || "Lâm Đồng"} • {product.shop?.ratingAvg || "4.6"} • Tham gia 2026</p>
              </div>
            </div>
            <button className="btn-view-shop" onClick={() => navigate(`/shops/${product.shop?.id || 3}`)}>Xem shop</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <div className="tab-headers">
          <button 
            className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
            onClick={() => setActiveTab("description")}
          >
            Mô tả
          </button>
          <button 
            className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Đánh giá (18)
          </button>
        </div>
        <div className="tab-content">
          {activeTab === "description" && (
            <div className="description-content">
              Cà chua bi trồng nhà kính, thu hoạch trong ngày, không thuốc trừ sâu. Bảo quản ngăn mát 5–7 ngày...
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="reviews-content">
              <h3 className="review-section-title">Đánh giá gần đây</h3>
              <div className="review-list">
                <div className="review-item">
                  <div className="reviewer-avatar"></div>
                  <div className="review-details">
                    <div className="reviewer-name">Trần Thị Mai <div className="stars"><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/></div></div>
                    <div className="review-date">13/09/2026 • Đã mua đơn DH-2026-00001</div>
                    <p className="review-text">Cà chua rất tươi, đúng như nhãn AI đánh giá.</p>
                  </div>
                </div>
                <div className="review-item">
                  <div className="reviewer-avatar"></div>
                  <div className="review-details">
                    <div className="reviewer-name">Lê Văn N. <div className="stars"><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-empty"/></div></div>
                    <div className="review-date">10/09/2026</div>
                    <p className="review-text">Ngon, giao hơi muộn.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div className="related-products-section">
        <h3 className="section-title">Sản phẩm cùng shop</h3>
        <div className="products-grid-4">
          <ProductCard product={{id: 2, name: "Khoai tây Đà Lạt", price: 28000, unit: "kg", shop: {shopName: "Vườn rau Tâm An"}, aiOverallLabel: "FRESH", aiOverallConfidence: 0.97}} />
          <ProductCard product={{id: 3, name: "Ớt chuông Đà Lạt", price: 55000, unit: "kg", shop: {shopName: "Vườn rau Tâm An"}, aiOverallLabel: "FRESH", aiOverallConfidence: 0.91}} />
          <ProductCard product={{id: 4, name: "Rau muống hữu cơ", price: 12000, unit: "bó", shop: {shopName: "Vườn rau Tâm An"}, aiOverallLabel: "UNCERTAIN"}} />
          <ProductCard product={{id: 5, name: "Cà rốt Đà Lạt", price: 22000, unit: "kg", shop: {shopName: "Vườn rau Tâm An"}, aiOverallLabel: "FRESH", aiOverallConfidence: 0.95}} />
        </div>
      </div>
    </div>
  );
}
