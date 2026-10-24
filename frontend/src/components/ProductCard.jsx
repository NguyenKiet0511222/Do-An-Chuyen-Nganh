import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { Check, Plus, Star } from "lucide-react";
import { resolveAssetUrl } from "../services/api";
import { handleImageError } from "../utils/format";
import AiQualityBadge from "./AiQualityBadge";

const PLACEHOLDER_IMAGE = "https://placehold.co/400x400?text=No+Image";

const formatPrice = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

// Thẻ sản phẩm khu khách — nhận đúng khuôn "Product (list item)" của GET /api/products (api.md mục 4.4)
export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Ảnh người bán tải lên là "/uploads/..." -> ghép địa chỉ backend; ảnh URL tuyệt đối giữ nguyên
  const imageUrl = resolveAssetUrl(product.primaryImageUrl) || PLACEHOLDER_IMAGE;
  const unit = product.unit || "kg";
  const hasRating = Number(product.ratingCount) > 0 && product.ratingAvg != null;
  const isOutOfStock = product.stockQuantity != null && product.stockQuantity <= 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;
    // addToCart trả false khi chưa đăng nhập (đã chuyển tới /login) hoặc API lỗi (đã báo lỗi)
    if (!(await addToCart(product, 1))) return;
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
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
            onError={handleImageError}
          />

          {/* Nhãn AI tổng hợp — sản phẩm chưa có nhãn thì không hiện */}
          <AiQualityBadge
            label={product.aiOverallLabel}
            confidence={product.aiOverallConfidence}
            className="card-ai-badge"
          />
        </div>
      </Link>

      <div className="product-content">
        <Link to={`/products/${product.id}`} className="product-title-link">
          <h3 className="product-title">{product.name}</h3>
        </Link>

        <div className="product-price-rating-row">
          <div className="product-price-block">
            <span className="product-price">{formatPrice(product.price)}</span>
            <span className="product-unit">/{unit}</span>
          </div>

          {hasRating ? (
            <div className="product-card-rating" title={`${product.ratingCount} đánh giá`}>
              <Star size={13} className="star-icon" fill="currentColor" />
              <span className="rating-num">{Number(product.ratingAvg).toFixed(1)}</span>
            </div>
          ) : (
            <span className="product-card-no-rating">Chưa có đánh giá</span>
          )}
        </div>

        <button
          type="button"
          className={`card-add-to-cart-btn ${isAdded ? "added" : ""} ${isOutOfStock ? "disabled" : ""}`}
          onClick={handleAdd}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? `${product.name} đã hết hàng` : `Thêm ${product.name} vào giỏ`}
        >
          {isOutOfStock ? (
            "Hết hàng"
          ) : isAdded ? (
            <>
              <Check size={16} /> Đã thêm vào giỏ
            </>
          ) : (
            <>
              <Plus size={16} /> Thêm vào giỏ
            </>
          )}
        </button>
      </div>
    </div>
  );
}
