import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { shopApi } from "../../services/api";
import { useCart } from "../../context/useCart";
import { getSharedProducts } from "../../data/productStore";
import { Star, Store, Check, Plus } from "lucide-react";
import "./ShopPage.css";

// Custom Product Card specifically for Shop Wireframe
function ShopProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const imageUrl = product.imageUrl || product.primaryImageUrl || product.image || "https://placehold.co/400x400?text=No+Image";
  const confidencePercent = 
    product.aiOverallConfidence != null 
      ? Math.round(Number(product.aiOverallConfidence) * 100) 
      : (product.aiLabel?.confidence 
          ? Math.round(product.aiLabel.confidence * 100) 
          : product.freshnessScore || 95);
  
  const isFresh = product.aiOverallLabel === "FRESH" || product.aiLabel?.type === "fresh" || (!product.aiOverallLabel && !product.aiLabel);
  const label = isFresh ? `Tươi ${confidencePercent}%` : "Chưa kiểm định";
  
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const normalizedProduct = {
      ...product,
      image: imageUrl,
      aiGrade: isFresh ? `Tươi sạch AI (${confidencePercent}%)` : "Kiểm định AI",
      origin: product.location || product.origin || "Việt Nam",
      unit: product.unit || "kg"
    };

    addToCart(normalizedProduct, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    <div className="shop-product-card-wf">
      <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="shop-product-img-box">
          <div className="shop-product-ai-badge">{label}</div>
          <img src={imageUrl} alt={product.name} />
        </div>
      </Link>
      <div className="shop-product-info">
        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="shop-product-title">{product.name}</div>
        </Link>
        <div className="shop-product-shopname">{product.seller || product.shop?.shopName || "Vườn rau Tâm An"}</div>
        <div className="shop-product-price">{formatPrice(product.price)} đ/{product.unit || "kg"}</div>
        <div className="shop-product-stats">
          Đã bán {product.soldCount || 128} • <Star size={10} fill="currentColor" className="shop-star-icon" /> {Number(product.ratingAvg || 4.8).toFixed(1)}
        </div>
        <button 
          className="shop-product-btn-add" 
          onClick={handleAdd}
          style={{ backgroundColor: isAdded ? '#00A651' : '', color: isAdded ? '#fff' : '' }}
        >
          {isAdded ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
        </button>
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
    totalElements: 0,
    totalPages: 1
  });

  useEffect(() => {
    let ignore = false;
    async function loadShopData() {
      setLoading(true);
      try {
        let shopData = null;
        let productList = [];

        try {
          const apiData = await shopApi.getShopPublicPage(id, pagination.page, 8);
          if (apiData) {
            shopData = apiData.shop;
            if (apiData.products?.content?.length) {
              productList = apiData.products.content;
            }
          }
        } catch (apiErr) {
          console.warn("Shop API fallback:", apiErr.message);
        }

        // Fallback to shared products from store
        const allShared = getSharedProducts().filter(p => p.status === "APPROVED");
        if (productList.length === 0) {
          productList = allShared;
        }

        if (!shopData) {
          const firstProduct = productList[0];
          shopData = {
            id: id || 1,
            shopName: firstProduct?.seller || "Vườn rau Tâm An",
            province: firstProduct?.location?.split(",")[0] || "Lâm Đồng",
            ratingAvg: 4.8,
            ratingCount: 214,
            description: "Chuyên cung cấp các loại rau củ quả hữu cơ, thu hoạch trong ngày, kiểm định AI nghiêm ngặt."
          };
        }

        if (!ignore) {
          setShop(shopData);
          setProducts(productList);
          setPagination(prev => ({
            ...prev,
            totalElements: productList.length,
            totalPages: Math.ceil(productList.length / 8) || 1
          }));
        }
      } catch (err) {
        if (!ignore) console.error("Error in loadShopData:", err);
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
  const shopRating = shop?.ratingAvg ? Number(shop.ratingAvg).toFixed(1) : "4.8";
  const shopRatingCount = shop?.ratingCount || 214;
  const shopProvince = shop?.province || "Lâm Đồng";
  const shopProductsCount = pagination.totalElements || products.length;

  if (loading && !shop) {
    return (
      <div className="shop-page-wf-container" style={{ textAlign: "center", padding: "80px 20px", color: "#666" }}>
        Đang tải thông tin cửa hàng...
      </div>
    );
  }

  const pagedProducts = products.slice(pagination.page * pagination.size, (pagination.page + 1) * pagination.size);

  return (
    <div className="shop-page-wf-container">
      {/* Breadcrumb */}
      <div className="shop-wf-breadcrumb">
        <Link to="/">Trang chủ</Link> / <span>{shopName}</span>
      </div>

      {/* Header Card */}
      <div className="shop-wf-header-card">
        <div className="shop-wf-avatar-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F8F0' }}>
          {shop?.logoUrl ? (
            <img src={shop.logoUrl} alt={shopName} />
          ) : (
            <Store size={44} color="#00A651" />
          )}
        </div>
        <div className="shop-wf-header-info">
          <div className="shop-wf-title-row">
            <h1>{shopName}</h1>
            <span className="shop-wf-badge">Đã xác minh <span className="shop-wf-info-icon">i</span></span>
          </div>
          <div className="shop-wf-meta-row">
            {shopProvince} • Tham gia 2026 • ★ {shopRating} ({shopRatingCount} đánh giá) • {shopProductsCount} sản phẩm • Cam kết AI độ tươi &gt; 90%
          </div>
          <div className="shop-wf-desc-row">
            {shop?.description || "Nông sản tươi ngon, thu hoạch tại vườn trong ngày, đạt tiêu chuẩn VietGAP."}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="shop-wf-tabs">
        <div className="shop-wf-tab active">Sản phẩm ({shopProductsCount})</div>
        <div className="shop-wf-tab">Giới thiệu cửa hàng</div>
        <div className="shop-wf-tab">Đánh giá khách hàng</div>
      </div>

      {/* Filters */}
      <div className="shop-wf-filter-bar">
        <div className="shop-wf-search">
          <input type="text" placeholder="Tìm kiếm nông sản trong shop..." />
        </div>
        <div className="shop-wf-dropdowns">
          <select>
            <option>Tất cả danh mục</option>
          </select>
          <select>
            <option>Sắp xếp: Mới nhất</option>
            <option>Sắp xếp: Bán chạy</option>
            <option>Giá: Thấp đến cao</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="shop-wf-products-grid">
        {pagedProducts.map(product => (
          <ShopProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
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
      )}
    </div>
  );
}
