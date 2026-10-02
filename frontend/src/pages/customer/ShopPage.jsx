import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { shopApi } from "../../services/api";
import { Star } from "lucide-react";
import "./ShopPage.css";

// Custom Product Card specifically for Shop Wireframe
function ShopProductCard({ product }) {
  const imageUrl = product.primaryImageUrl || product.image || "/placeholder.jpg";
  const confidencePercent = product.aiOverallConfidence != null ? Math.round(Number(product.aiOverallConfidence) * 100) : product.freshnessScore || 95;
  const label = product.aiOverallLabel === "UNCERTAIN" ? "Chưa kiểm định" : `Tươi ${confidencePercent}%`;
  
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0);
  };

  return (
    <div className="shop-product-card-wf">
      <div className="shop-product-img-box">
        <div className="shop-product-ai-badge">{label}</div>
        <img src={imageUrl} alt={product.name} onError={(e) => e.target.style.display = 'none'} />
        {/* Placeholder X cross lines handled by CSS if img fails or is transparent */}
        <div className="shop-product-img-ph"></div>
      </div>
      <div className="shop-product-info">
        <div className="shop-product-title">{product.name}</div>
        <div className="shop-product-shopname">{product.shop?.shopName || "Vườn rau Tâm An"}</div>
        <div className="shop-product-price">{formatPrice(product.price)} đ/{product.unit || "kg"}</div>
        <div className="shop-product-stats">
          Đã bán {product.soldCount || Math.floor(Math.random() * 200) + 10} • <Star size={10} fill="currentColor" className="shop-star-icon" /> {Number(product.ratingAvg || 4.6).toFixed(1)}
        </div>
        <button className="shop-product-btn-add">Thêm vào giỏ</button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 8,
    totalElements: 18, // Mocked total elements based on wireframe
    totalPages: 3
  });

  useEffect(() => {
    let ignore = false;
    async function loadShopData() {
      setLoading(true);
      try {
        const data = await shopApi.getShopPublicPage(id, pagination.page, 8);
        if (!ignore) {
          if (data) {
            setShop(data.shop);
            if (data.products) {
              setProducts(data.products.content || []);
              setPagination(prev => ({
                ...prev,
                totalElements: data.products.totalElements || data.products.content?.length || 18,
                totalPages: data.products.totalPages || Math.ceil((data.products.totalElements || 18) / 8)
              }));
            }
          }
        }
      } catch (err) {
        if (!ignore) console.error("API Error when fetching shop:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadShopData();
    return () => { ignore = true; };
  }, [id, pagination.page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo(0, 0);
    }
  };

  const shopName = shop?.shopName || "Vườn rau Tâm An";
  const shopRating = shop?.ratingAvg ? Number(shop.ratingAvg).toFixed(1) : "4,6";
  const shopRatingCount = shop?.ratingCount || 214;
  const shopProvince = shop?.province || "Lâm Đồng";
  const shopProductsCount = pagination.totalElements || 18;

  if (loading && !shop) {
    return <div className="shop-page-wf-container">Loading...</div>;
  }

  return (
    <div className="shop-page-wf-container">
      {/* Breadcrumb */}
      <div className="shop-wf-breadcrumb">
        <Link to="/">Trang chủ</Link> / <span>{shopName}</span>
      </div>

      {/* Header Card */}
      <div className="shop-wf-header-card">
        <div className="shop-wf-avatar-box">
          <img src={shop?.logoUrl} alt={shopName} onError={(e) => e.target.style.display = 'none'} />
          <div className="shop-wf-avatar-ph"></div>
        </div>
        <div className="shop-wf-header-info">
          <div className="shop-wf-title-row">
            <h1>{shopName}</h1>
            <span className="shop-wf-badge">Đã xác minh <span className="shop-wf-info-icon">i</span></span>
          </div>
          <div className="shop-wf-meta-row">
            {shopProvince} • Tham gia 06/2026 • ★ {shopRating} ({shopRatingCount} đánh giá) • {shopProductsCount} sản phẩm • 96% sản phẩm được AI đánh giá tươi
          </div>
          <div className="shop-wf-desc-row">
            Rau củ Đà Lạt trồng nhà kính, thu hoạch trong ngày, không thuốc trừ sâu.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="shop-wf-tabs">
        <div className="shop-wf-tab active">Sản phẩm ({shopProductsCount})</div>
        <div className="shop-wf-tab">Giới thiệu</div>
        <div className="shop-wf-tab">Đánh giá</div>
      </div>

      {/* Filters */}
      <div className="shop-wf-filter-bar">
        <div className="shop-wf-search">
          <input type="text" placeholder="Tìm trong shop..." />
        </div>
        <div className="shop-wf-dropdowns">
          <select>
            <option>Danh mục của shop</option>
          </select>
          <select>
            <option>Sắp xếp: Bán chạy</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="shop-wf-products-grid">
        {products.length > 0 ? (
          products.map(product => (
            <ShopProductCard key={product.id} product={product} />
          ))
        ) : (
          [...Array(8)].map((_, idx) => (
            <div key={idx} className="shop-product-card-wf">
               <div className="shop-product-img-box">
                 <div className="shop-product-ai-badge">Tươi 92%</div>
                 <div className="shop-product-img-ph"></div>
               </div>
               <div className="shop-product-info">
                 <div className="shop-product-title">Sản phẩm {idx + 1}</div>
                 <div className="shop-product-shopname">{shopName}</div>
                 <div className="shop-product-price">45.000 đ/kg</div>
                 <div className="shop-product-stats">
                   Đã bán 214 • <Star size={10} fill="currentColor" className="shop-star-icon" /> 4,6
                 </div>
                 <button className="shop-product-btn-add">Thêm vào giỏ</button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="shop-wf-pagination">
        <span className="shop-wf-page-info">
          Hiển thị {pagination.page * pagination.size + 1}–{Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)} / {pagination.totalElements}
        </span>
        <button 
          className="shop-wf-page-btn" 
          disabled={pagination.page === 0} 
          onClick={() => handlePageChange(pagination.page - 1)}
        >&lt;</button>
        
        {[...Array(pagination.totalPages)].map((_, idx) => (
          <button 
            key={idx} 
            className={`shop-wf-page-btn ${pagination.page === idx ? 'active' : ''}`}
            onClick={() => handlePageChange(idx)}
          >
            {idx + 1}
          </button>
        ))}
        
        <button 
          className="shop-wf-page-btn" 
          disabled={pagination.page >= pagination.totalPages - 1}
          onClick={() => handlePageChange(pagination.page + 1)}
        >&gt;</button>
      </div>

    </div>
  );
}
