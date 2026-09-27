import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { productApi } from "../../services/api";
import { useCart } from "../../context/useCart";
import {
  ShieldCheck,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  AlertCircle,
  ArrowLeft,
  Store,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Truck
} from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart, setIsCartOpen } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadProduct() {
      try {
        const data = await productApi.getById(id);
        if (!ignore) {
          if (data) {
            setProduct(data);
            setSelectedImageIndex(0);
            setQuantity(1);
            setError(null);
          } else {
            setError("Không tìm thấy thông tin sản phẩm này.");
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Lỗi khi tải chi tiết sản phẩm:", err);
          setError("Không thể tải thông tin sản phẩm từ máy chủ. Vui lòng kiểm tra kết nối API.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="product-detail-page section-container">
        <div className="detail-loading-skeleton">
          <div className="skeleton-breadcrumbs" />
          <div className="skeleton-detail-grid">
            <div className="skeleton-gallery-box" />
            <div className="skeleton-info-panel">
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-90" />
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-80" />
              <div className="skeleton-line w-50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page section-container">
        <div className="detail-error-card">
          <AlertCircle size={44} className="text-red" />
          <h2>Không tìm thấy sản phẩm</h2>
          <p>{error || "Sản phẩm không tồn tại hoặc chưa được duyệt mở bán trên hệ thống."}</p>
          <div className="error-actions">
            <button type="button" className="btn-secondary" onClick={handleRetry}>
              <RefreshCw size={15} /> Thử lại
            </button>
            <Link to="/products" className="btn-primary">
              <ArrowLeft size={16} /> Quay lại cửa hàng nông sản
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [
        {
          id: 0,
          url: product.primaryImageUrl || "/placeholder.jpg",
          isPrimary: true,
          displayOrder: 1,
          ai: {
            label: product.aiOverallLabel || "FRESH",
            confidence: product.aiOverallConfidence || 0.92,
            finalLabel: product.aiOverallLabel,
            reviewStatus: "AUTO_ACCEPTED"
          }
        }
      ];

  const currentImage = images[selectedImageIndex] || images[0];
  const aiInfo = currentImage.ai;

  const unit = product.unit || "kg";
  const confidencePercent =
    product.aiOverallConfidence != null
      ? Math.round(Number(product.aiOverallConfidence) * 100)
      : null;

  const currentImgConfidencePercent =
    aiInfo?.confidence != null
      ? Math.round(Number(aiInfo.confidence) * 100)
      : confidencePercent || 92;

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0);
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (product.stockQuantity && next > product.stockQuantity) return product.stockQuantity;
      return next;
    });
  };

  const handleAddToCart = () => {
    const normalizedProduct = {
      ...product,
      image: product.primaryImageUrl || currentImage.url || "/placeholder.jpg",
      aiGrade:
        product.aiOverallLabel === "FRESH"
          ? `Tươi sạch AI${confidencePercent ? ` (${confidencePercent}%)` : ""}`
          : product.aiOverallLabel === "UNCERTAIN"
          ? "Cần kiểm tra"
          : "Kiểm định AI",
      origin: product.origin || product.shop?.province || "Việt Nam",
      certification: "VietGAP",
      unit
    };

    addToCart(normalizedProduct, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsCartOpen(true);
  };

  const renderReviewStatusText = (status) => {
    switch (status) {
      case "AUTO_ACCEPTED":
        return "Hệ thống AI tự động duyệt (Độ tin cậy cao ≥ 90%)";
      case "ADMIN_ACCEPTED":
        return "Chuyên viên kiểm định đã xác nhận đạt chuẩn";
      case "PENDING_REVIEW":
        return "Hàng chờ kiểm duyệt thủ công bổ sung";
      case "CORRECTED":
        return "Đã được quản trị viên hiệu chỉnh nhãn";
      default:
        return "Đã kiểm định qua mô hình AI";
    }
  };

  return (
    <div className="product-detail-page section-container">
      {/* Breadcrumbs */}
      <nav className="detail-breadcrumbs" aria-label="Đường dẫn trang">
        <Link to="/">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/products">Cửa hàng nông sản</Link>
        {product.category?.name && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span>{product.category.name}</span>
          </>
        )}
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-active">{product.name}</span>
      </nav>

      {/* Main PDP 2-Column Grid (Khớp hoàn toàn Wireframe Image 1) */}
      <div className="product-detail-layout">
        {/* LEFT COLUMN: Gallery with Main Image & 3 Thumbnails */}
        <div className="detail-gallery-column">
          {/* Main Photo Card */}
          <div className="detail-main-image-card">
            <img
              src={currentImage.url}
              alt={`${product.name} - góc chụp ${selectedImageIndex + 1}`}
              className="detail-main-image"
            />

            {/* AI Badge in top-left */}
            <div className="image-ai-pill-badge">
              <span>
                {aiInfo?.label === "FRESH" || !aiInfo?.label ? "TƯƠI SẠCH AI" : "CẦN KIỂM ĐỊNH"}{" "}
                {currentImgConfidencePercent}%
              </span>
            </div>
          </div>

          {/* 3 Thumbnails Row below main image */}
          {images.length > 0 && (
            <div className="detail-thumbnails-row">
              {images.slice(0, 3).map((img, idx) => {
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    className={`thumb-button ${
                      selectedImageIndex === idx ? "active" : ""
                    }`}
                    onClick={() => setSelectedImageIndex(idx)}
                    aria-label={`Xem ảnh ${idx + 1}`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="thumb-image"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Product Info, Shop Card, CTAs, Tabs */}
        <div className="detail-info-column">
          {/* Product Title */}
          <h1 className="detail-title">{product.name}</h1>

          {/* Star Rating Row: ★★★★★ 4.8 (35 Đánh giá) */}
          <div className="detail-rating-row">
            <div className="stars-group">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={17}
                  className="star-icon-filled"
                  fill="#16a34a"
                  color="#16a34a"
                />
              ))}
            </div>
            <strong className="rating-score">
              {Number(product.ratingAvg || 4.8).toFixed(1)}
            </strong>
            <span className="reviews-link">
              ({product.ratingCount || 35} đánh giá)
            </span>
          </div>

          {/* Price Row: 45.000 ₫ / kg */}
          <div className="detail-price-row">
            <span className="price-amount">{formatPrice(product.price)}</span>
            <span className="price-unit">/ {unit}</span>
          </div>

          {/* SHOP INFORMATION BOX */}
          <div className="pdp-shop-box">
            <h3 className="shop-box-title">Thông tin cửa hàng</h3>
            <div className="shop-box-content">
              <div className="shop-box-left">
                <div className="shop-leaf-icon-wrap">
                  <Store size={22} className="shop-leaf-icon" />
                </div>
                <div className="shop-text-info">
                  <h4 className="shop-name">
                    {product.shop?.shopName || "Vườn rau Tâm An"}
                  </h4>
                  <p className="shop-desc">
                    {product.shop?.province
                      ? `Tại ${product.shop.province}, chuyên nông sản sạch chuẩn VietGAP từ 2015`
                      : "Trực tiếp từ nông trại Đà Lạt, chuẩn canh tác sạch VietGAP"}
                  </p>
                </div>
              </div>

              <button type="button" className="visit-shop-pill-btn">
                Xem cửa hàng
              </button>
            </div>
          </div>

          {/* Quantity Selector & Action Buttons (Thêm vào giỏ + Mua ngay) */}
          <div className="pdp-actions-row">
            <div className="stepper-pill-box">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                aria-label="Giảm 1"
              >
                <Minus size={15} />
              </button>
              <span className="stepper-val">{quantity}</span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleQuantityChange(1)}
                disabled={product.stockQuantity && quantity >= product.stockQuantity}
                aria-label="Tăng 1"
              >
                <Plus size={15} />
              </button>
            </div>

            <button
              type="button"
              className={`pdp-btn-add-cart ${isAdded ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
            >
              {isAdded ? (
                <>
                  <Check size={18} /> Đã thêm vào giỏ!
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> Thêm vào giỏ
                </>
              )}
            </button>

            <button
              type="button"
              className="pdp-btn-buy-now"
              onClick={handleBuyNow}
              disabled={product.stockQuantity <= 0}
            >
              Mua ngay
            </button>
          </div>

          {/* TABS SECTION (Việt hóa theo yêu cầu) */}
          <div className="pdp-tabs-container">
            <div className="pdp-tabs-nav">
              <button
                type="button"
                className={`pdp-tab-item ${activeTab === "description" ? "active" : ""}`}
                onClick={() => setActiveTab("description")}
              >
                Mô tả sản phẩm
              </button>
              <button
                type="button"
                className={`pdp-tab-item ${activeTab === "nutrition" ? "active" : ""}`}
                onClick={() => setActiveTab("nutrition")}
              >
                Thông tin dinh dưỡng & AI
              </button>
              <button
                type="button"
                className={`pdp-tab-item ${activeTab === "delivery" ? "active" : ""}`}
                onClick={() => setActiveTab("delivery")}
              >
                Giao hàng & Đổi trả
              </button>
            </div>

            <div className="pdp-tab-body">
              {activeTab === "description" && (
                <div className="tab-pane-content">
                  <p className="tab-description-text">
                    {product.description ||
                      `${product.name} được canh tác trên nền đất màu mỡ với khí hậu lý tưởng, thu hoạch thủ công đúng độ chín ngon nhất. Từng quả đều được quét và kiểm định thị giác AI (MobileNetV2 Vision) nhằm đảm bảo tối đa độ tươi ngọt, độ giòn và an toàn thực phẩm cho gia đình bạn.`}
                  </p>
                  <div className="pdp-quick-specs">
                    <div className="spec-row">
                      <span className="spec-label">Xuất xứ:</span>
                      <strong>{product.origin || product.shop?.province || "Đà Lạt, Lâm Đồng"}</strong>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Quy cách:</span>
                      <strong>Theo {unit}</strong>
                    </div>
                    <div className="spec-row">
                      <span className="spec-label">Kiểm định AI:</span>
                      <strong className="text-emerald">
                        {aiInfo?.label === "FRESH" || !aiInfo?.label ? "Đạt chuẩn tươi mới" : aiInfo.label} ({currentImgConfidencePercent}%)
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "nutrition" && (
                <div className="tab-pane-content">
                  {/* AI Vision Inspection Report Box */}
                  <div className="ai-report-nested-box">
                    <div className="ai-report-top">
                      <div className="ai-report-title">
                        <Cpu size={16} className="text-emerald" />
                        <strong>Báo cáo AI Vision (Ảnh #{selectedImageIndex + 1})</strong>
                      </div>
                      <span className="ai-model-tag">Mô hình MobileNetV2</span>
                    </div>

                    <div className="ai-report-metrics">
                      <div className="metric-row">
                        <span>Phẩm cấp AI:</span>
                        <span className="ai-pill-status fresh">
                          <CheckCircle2 size={13} /> {aiInfo?.label === "FRESH" || !aiInfo?.label ? "TƯƠI MỚI ĐẠT CHUẨN" : aiInfo.label}
                        </span>
                      </div>
                      <div className="metric-row">
                        <span>Độ tin cậy thuật toán AI:</span>
                        <strong>{currentImgConfidencePercent}%</strong>
                      </div>
                      <div className="confidence-track-mini">
                        <div
                          className="confidence-fill-mini"
                          style={{ width: `${currentImgConfidencePercent}%` }}
                        />
                      </div>
                      <div className="metric-row">
                        <span>Trạng thái duyệt:</span>
                        <small>{renderReviewStatusText(aiInfo?.reviewStatus || "AUTO_ACCEPTED")}</small>
                      </div>
                    </div>
                  </div>

                  <p className="nutrition-summary-text">
                    Nông sản dồi dào chất xơ, vitamin A, C, khoáng chất kali và chất chống oxy hóa tự nhiên lycopene giúp tăng cường đề kháng và tim mạch.
                  </p>
                </div>
              )}

              {activeTab === "delivery" && (
                <div className="tab-pane-content">
                  <ul className="delivery-policy-list">
                    <li>
                      <Truck size={15} className="policy-icon" />
                      <span><strong>Giao hàng nhanh 2h:</strong> Đóng gói bảo quản lạnh trực tiếp từ kho trung tâm giao ngay trong ngày.</span>
                    </li>
                    <li>
                      <ShieldCheck size={15} className="policy-icon" />
                      <span><strong>Cam kết chất lượng:</strong> 100% hình ảnh sản phẩm được kiểm tra bởi AI Vision.</span>
                    </li>
                    <li>
                      <RefreshCw size={15} className="policy-icon" />
                      <span><strong>Đổi trả dễ dàng:</strong> Hoàn tiền hoặc đổi 1-đổi-1 nếu hàng không tươi hoặc dập hỏng khi nhận.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
