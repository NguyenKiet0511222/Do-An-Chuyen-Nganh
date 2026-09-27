import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { Check, Plus, Star } from "lucide-react";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const imageUrl = product.primaryImageUrl || product.image || "/placeholder.jpg";
  const originName = product.origin || product.shop?.province || "Việt Nam";
  const confidencePercent = product.aiOverallConfidence != null ? Math.round(Number(product.aiOverallConfidence) * 100) : product.freshnessScore;
  const unit = product.unit || "kg";

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const normalizedProduct = {
      ...product,
      image: imageUrl,
      aiGrade:
        product.aiOverallLabel === "FRESH"
          ? `Tươi sạch AI${confidencePercent ? ` (${confidencePercent}%)` : ""}`
          : product.aiOverallLabel === "UNCERTAIN"
          ? "Cần kiểm tra"
          : product.aiGrade || "Kiểm định AI",
      origin: originName,
      certification: product.certification || "VietGAP",
      unit
    };

    addToCart(normalizedProduct, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount || 0);
  };

  const renderAiBadge = () => {
    const label = product.aiOverallLabel;
    const pct = confidencePercent || 98;
    if (label === "FRESH" || !label) {
      return (
        <div className="card-ai-badge fresh">
          <span>AI FRESH {pct}%</span>
        </div>
      );
    }
    if (label === "UNCERTAIN") {
      return (
        <div className="card-ai-badge uncertain">
          <span>AI REVIEW {pct}%</span>
        </div>
      );
    }
    return (
      <div className="card-ai-badge rotten">
        <span>AI ALERT</span>
      </div>
    );
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-media-link">
        <div className="product-image-container">
          <img
            src={imageUrl}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />

          {/* Clean AI Badge matching wireframe */}
          {renderAiBadge()}
        </div>
      </Link>

      <div className="product-content">
        <Link to={`/products/${product.id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>

        {/* Price on left, Rating on right (Khớp hoàn toàn Wireframe Image 2) */}
        <div className="product-price-rating-row">
          <div className="product-price-block">
            <span className="product-price">{formatPrice(product.price)}</span>
            <span className="product-unit">/{unit}</span>
          </div>

          <div className="product-card-rating">
            <Star size={13} className="star-icon" fill="currentColor" />
            <span className="rating-num">
              {Number(product.ratingAvg || 4.8).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Full-width Add to Cart button matching Image 2 */}
        <button
          type="button"
          className={`card-add-to-cart-btn ${isAdded ? "added" : ""}`}
          onClick={handleAdd}
          aria-label={`Thêm ${product.name} vào giỏ`}
        >
          {isAdded ? (
            <>
              <Check size={16} /> Đã thêm vào giỏ
            </>
          ) : (
            <>
              <Plus size={16} /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}

