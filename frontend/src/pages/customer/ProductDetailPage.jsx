import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi } from "../../services/api";
import { useCart } from "../../context/useCart";
import ProductCard from "../../components/ProductCard";
import { Star, Plus, Minus, Store, ShieldCheck } from "lucide-react";
import { getSharedProducts } from "../../data/productStore";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    let ignore = false;
    async function loadProduct() {
      try {
        const products = getSharedProducts();
        const data = products.find(p => String(p.id) === String(id));
        
        if (!ignore) {
          if (data) {
            setProduct(data);
            // Load related products
            const related = products.filter(p => p.status === "APPROVED" && String(p.id) !== String(id)).slice(0, 4);
            setRelatedProducts(related);
          } else {
            // Fallback if not found in local storage
            try {
              const apiData = await productApi.getById(id);
              if (apiData) setProduct(apiData);
            } catch (err) {
              console.warn("Product not found in API fallback");
            }
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
    return (
      <div className="detail-page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  const mainImageUrl = product.imageUrl || product.primaryImageUrl || "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=400";
  
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [
        { url: mainImageUrl, ai: { label: "FRESH", confidence: product.aiLabel?.confidence || 0.95 } }
      ];

  const currentImage = images[selectedImageIndex] || images[0];
  const unit = product.unit || "kg";
  const sellerName = product.seller || product.shop?.shopName || "Vườn rau Tâm An";
  const locationName = product.location || product.origin || product.shop?.province || "Đà Lạt, Lâm Đồng";
  const stockNum = product.inventory || product.stockQuantity || product.stock || 120;

  // AI confidence & status
  const aiConfidence = product.aiLabel?.confidence 
    ? Math.round(product.aiLabel.confidence * 100) 
    : (product.freshnessScore || 95);
  const aiType = product.aiLabel?.type || (product.aiOverallLabel === "FRESH" ? "fresh" : product.aiOverallLabel === "ROTTEN" ? "rotten" : "fresh");
  const isAiFresh = aiType === "fresh";

  const handleAddToCart = () => {
    const normalizedProduct = {
      ...product,
      image: currentImage.url || mainImageUrl,
      aiGrade: isAiFresh ? `Tươi sạch AI (${aiConfidence}%)` : "Kiểm định AI",
      origin: locationName,
      unit
    };
    return addToCart(normalizedProduct, quantity);
  };

  const handleBuyNow = () => {
    // Chưa đăng nhập thì addToCart đã chuyển tới /login, không được đè bằng /checkout
    if (handleAddToCart()) navigate("/checkout");
  };

  return (
    <div className="detail-page-container">
      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <Link to="/" className="breadcrumb-link">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/products" className="breadcrumb-link">{product.category || "Nông sản sạch"}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="detail-top-section">
        {/* Left Gallery */}
        <div className="detail-gallery">
          <div className="main-image-wrapper">
            <img src={currentImage.url} alt={product.name} className="main-image" />
            <div className="image-watermark">Ảnh thực tế kiểm định</div>
          </div>
          {images.length > 1 && (
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
          )}
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
            <span>4.8 (24 đánh giá)</span>
            <span className="dot">•</span>
            <span>Đã bán {product.soldCount || 158}</span>
            <span className="dot">•</span>
            <span>Mã {product.id}</span>
          </div>

          <div className="product-price">
            {Number(product.price || 0).toLocaleString("vi-VN")} ₫ <span>/ {unit}</span>
          </div>

          <div className="ai-quality-box">
            <div className="ai-box-header">
              <span className="ai-label">Nhãn chất lượng AI</span>
              <span className="ai-badge" style={{ backgroundColor: isAiFresh ? '#E8F8F0' : '#FFF3CD', color: isAiFresh ? '#00A651' : '#856404' }}>
                <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                {isAiFresh ? `Tươi • ${aiConfidence}%` : "Chờ xác nhận"}
              </span>
            </div>
            <div className="ai-progress-bar">
              <div className="ai-progress-fill" style={{ width: `${aiConfidence}%`, backgroundColor: isAiFresh ? '#00A651' : '#ffc107' }}></div>
            </div>
            <p className="ai-box-desc">
              Hình ảnh nông sản được mô hình phân loại thị giác máy tính AI đánh giá đạt độ tươi mới {aiConfidence}%, đã được kiểm duyệt an toàn trước khi mở bán.
            </p>
          </div>

          <div className="product-specs">
            <div className="spec-row">
              <span className="spec-name">Xuất xứ</span>
              <span className="spec-value">{locationName}</span>
            </div>
            <div className="spec-row">
              <span className="spec-name">Còn hàng</span>
              <span className="spec-value">{stockNum} {unit}</span>
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
              <div className="shop-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F8F0', borderRadius: '50%', width: '44px', height: '44px' }}>
                {product.shop?.logoUrl ? (
                  <img src={product.shop.logoUrl} alt={sellerName} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <Store size={22} color="#00A651" />
                )}
              </div>
              <div className="shop-details-mini">
                <h4>{sellerName} <span className="verified-badge">Đã xác minh</span></h4>
                <p>{locationName.split(",")[0]} • 4.8 ★ • Thành viên uy tín</p>
              </div>
            </div>
            <button className="btn-view-shop" onClick={() => navigate(`/shops/${product.shop?.id || 1}`)}>Xem shop</button>
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
            Mô tả sản phẩm
          </button>
          <button 
            className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Đánh giá khách hàng (24)
          </button>
        </div>
        <div className="tab-content">
          {activeTab === "description" && (
            <div className="description-content" style={{ whiteSpace: "pre-line", lineHeight: "1.7" }}>
              {product.description || `${product.name} được nuôi trồng và chăm sóc theo tiêu chuẩn an toàn sinh học. Thu hoạch trực tiếp trong ngày từ nông trại, bảo quản nhiệt độ mát tiêu chuẩn giúp giữ trọn dưỡng chất, hương vị thơm ngon và vị ngọt tự nhiên.`}
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
                    <div className="review-date">13/09/2026 • Đã mua hàng</div>
                    <p className="review-text">Sản phẩm rất tươi ngon, đóng gói cẩn thận, đúng như nhãn AI kiểm định.</p>
                  </div>
                </div>
                <div className="review-item">
                  <div className="reviewer-avatar"></div>
                  <div className="review-details">
                    <div className="reviewer-name">Lê Văn Nam <div className="stars"><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-filled"/><Star size={12} className="star-empty"/></div></div>
                    <div className="review-date">10/09/2026 • Đã mua hàng</div>
                    <p className="review-text">Nông sản sạch, ăn thơm ngọt. Giao hàng nhanh và thân thiện.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <h3 className="section-title">Nông sản cùng loại gợi ý</h3>
          <div className="products-grid-4">
            {relatedProducts.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
