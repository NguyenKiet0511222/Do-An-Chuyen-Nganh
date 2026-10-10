import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi } from "../../services/api";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/useAuth";
import { getSharedProducts } from "../../data/productStore";
import {
  Star,
  ShieldCheck,
  Truck,
  Heart,
  Share2,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  RotateCcw,
  BadgeCheck,
  MessageSquare,
  Store,
  Flame,
  Sparkles,
  ArrowRight,
  ChevronRight,
  X,
  Send,
  ThumbsUp,
  UserCheck,
  Tag,
  ChevronDown
} from "lucide-react";
import "./ProductDetailPage.css";

// Helper render số sao thập phân (ví dụ 4.8★ -> 4 sao vàng + 1 sao 80% vàng + 0 sao xám)
function renderStarRating(score, size = 13) {
  const numScore = Number(score) || 5;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fillFraction = Math.max(0, Math.min(1, numScore - (starIndex - 1)));
        if (fillFraction >= 0.85) {
          return (
            <Star
              key={starIndex}
              size={size}
              fill="var(--pdp-amber-400)"
              color="var(--pdp-amber-400)"
            />
          );
        } else if (fillFraction >= 0.15) {
          return (
            <div
              key={starIndex}
              style={{
                position: "relative",
                width: `${size}px`,
                height: `${size}px`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Star
                size={size}
                fill="none"
                color="var(--pdp-slate-300)"
                style={{ position: "absolute", top: 0, left: 0 }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${Math.round(fillFraction * 100)}%`,
                  overflow: "hidden",
                  whiteSpace: "nowrap"
                }}
              >
                <Star
                  size={size}
                  fill="var(--pdp-amber-400)"
                  color="var(--pdp-amber-400)"
                />
              </div>
            </div>
          );
        } else {
          return (
            <Star
              key={starIndex}
              size={size}
              fill="none"
              color="var(--pdp-slate-300)"
            />
          );
        }
      })}
    </div>
  );
}

// Helper render đủ 5 ngôi sao cho từng đánh giá của người dùng
function renderReviewStars(rating, size = 12) {
  const r = Number(rating) || 5;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= r ? "var(--pdp-amber-400)" : "none"}
          color={s <= r ? "var(--pdp-amber-400)" : "var(--pdp-slate-300)"}
        />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Dữ liệu cơ bản ---
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState("Mix 3 màu (Bán chạy)");

  // --- Chức năng Yêu thích & Chia sẻ ---
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1240);

  // --- Chức năng Shop ---
  const [isFollowingShop, setIsFollowingShop] = useState(false);
  const [followerCount, setFollowerCount] = useState("12.4k");

  // --- Chức năng Chat mini ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const chatMessagesEndRef = useRef(null);

  // --- Chức năng Vận chuyển ---
  const [shippingAddress, setShippingAddress] = useState("Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh");
  const [shippingFee, setShippingFee] = useState("₫15.000 - ₫22.000");
  const [shippingSpeed, setShippingSpeed] = useState("Giao Hỏa Tốc 2H");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [tempCity, setTempCity] = useState("TP. Hồ Chí Minh");
  const [tempDistrict, setTempDistrict] = useState("Quận 1");

  // --- Chức năng Voucher ---
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [savedVouchers, setSavedVouchers] = useState([]);

  // --- Chức năng Đánh giá ---
  const [reviews, setReviews] = useState([]);
  const [activeReviewFilter, setActiveReviewFilter] = useState("all");
  const [visibleReviewCount, setVisibleReviewCount] = useState(6);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewVariation, setNewReviewVariation] = useState("");
  const [helpfulReviews, setHelpfulReviews] = useState({});

  // --- Toast thông báo ---
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // --- Tải dữ liệu sản phẩm & đánh giá ---
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      setLoading(true);
      try {
        let pData = null;
        try {
          pData = await productApi.getById(id);
        } catch (apiErr) {
          console.warn("Lỗi API getById, fallback sharedProducts:", apiErr.message);
        }

        if (!pData) {
          const shared = getSharedProducts();
          pData = shared.find((p) => String(p.id) === String(id));
        }

        if (!ignore && pData) {
          setProduct(pData);

          // Nạp trạng thái yêu thích từ LocalStorage
          const likedKey = `pdp_fav_${pData.id}`;
          const isFav = localStorage.getItem(likedKey) === "true";
          setIsLiked(isFav);
          setLikeCount(isFav ? 1241 : 1240);

          // Nạp trạng thái theo dõi shop
          const shopId = pData.shop?.id || pData.shopId || 1;
          const followKey = `pdp_follow_shop_${shopId}`;
          const isFollow = localStorage.getItem(followKey) === "true";
          setIsFollowingShop(isFollow);
          setFollowerCount(isFollow ? "12.5k" : "12.4k");

          // Nạp mã voucher đã lưu
          try {
            const vData = JSON.parse(localStorage.getItem("pdp_saved_vouchers") || "[]");
            setSavedVouchers(vData);
          } catch {
            setSavedVouchers([]);
          }

          // Nạp đánh giá từ LocalStorage hoặc bộ 24 đánh giá chuẩn của sản phẩm
          const reviewStorageKey = `pdp_reviews_${pData.id}`;
          const savedReviews = localStorage.getItem(reviewStorageKey);
          if (savedReviews) {
            try {
              setReviews(JSON.parse(savedReviews));
            } catch {
              initDefaultReviews(pData);
            }
          } else {
            initDefaultReviews(pData);
          }

          // Khởi tạo tin nhắn chat ban đầu
          setChatMessages([
            {
              id: 1,
              sender: "seller",
              text: `Chào bạn! Cảm ơn bạn đã quan tâm đến ${pData.name}. HTX luôn sẵn sàng tư vấn nông sản sạch tươi ngon nhất cho bạn ạ!`
            }
          ]);

          // Tải danh sách sản phẩm liên quan và bán chạy
          try {
            const listRes = await productApi.getAll({ size: 12 });
            const allItems = listRes?.content || (Array.isArray(listRes) ? listRes : []);
            const others = allItems.filter((item) => String(item.id) !== String(id));
            setRelatedProducts(others.slice(0, 4));
            setTopSellers(others.slice(0, 4));
          } catch (e) {
            const shared = getSharedProducts();
            const others = shared.filter((p) => String(p.id) !== String(id));
            setRelatedProducts(others.slice(0, 4));
            setTopSellers(others.slice(0, 4));
          }
        }
      } catch (err) {
        if (!ignore) console.error("Lỗi tải chi tiết sản phẩm:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    // Khởi tạo đúng 24 đánh giá khớp hoàn hảo với 4.8★ (21 năm sao, 2 bốn sao, 1 ba sao, 18 có ảnh)
    function initDefaultReviews(pData) {
      const pImg = pData.imageUrl || pData.primaryImageUrl || "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=600";
      
      const defaultList = [
        {
          id: 1,
          user: "vothanhtruc_92",
          rating: 5,
          date: "2024-03-12 14:28",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Nông sản siêu tươi luôn ạ! Giao hỏa tốc 2 tiếng tới nơi cuống vẫn còn xanh mơn mởn. Vỏ dày, ngọt giòn, làm salad cực ngon. Shop đóng gói bọc xốp chống sốc rất cẩn thận, 10 điểm chất lượng!",
          images: [pImg],
          reply: "Cảm ơn bạn rất nhiều vì đã tin dùng rau củ sạch của HTX Đà Lạt. Chúc bạn và gia đình có những bữa ăn thật ngon miệng và dồi dào sức khỏe!",
          helpful: 12
        },
        {
          id: 2,
          user: "hoangminh_eatclean",
          rating: 5,
          date: "2024-03-10 09:15",
          variation: "Ớt vàng Đà Lạt",
          comment: "Đúng chuẩn hàng kiểm định AI tươi rói. Cân đủ ký, màu sắc sáng bóng không tì vết. Sẽ tiếp tục ủng hộ shop nông sản Việt!",
          images: [pImg],
          reply: null,
          helpful: 8
        },
        {
          id: 3,
          user: "nguyenan_farm",
          rating: 4,
          date: "2024-03-05 16:40",
          variation: "Loại tiêu chuẩn",
          comment: "Sản phẩm tươi ngon, giá cả hợp lý so với siêu thị. Vận chuyển hỏa tốc đúng giờ, rau còn nguyên vị giòn ngọt.",
          images: [pImg],
          reply: "Dạ shop cảm ơn bạn An nhiều ạ! Shop sẽ duy trì chất lượng tốt nhất phục vụ bạn nhé.",
          helpful: 5
        },
        {
          id: 4,
          user: "thuy_tien_dalat",
          rating: 5,
          date: "2024-03-04 11:20",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Mua lần thứ 3 ở shop rồi, lần nào cũng ưng ý hết nấc. Rau củ sạch ăn yên tâm cho cả nhà.",
          images: [pImg],
          reply: null,
          helpful: 6
        },
        {
          id: 5,
          user: "quang_huy_chef",
          rating: 5,
          date: "2024-03-02 20:15",
          variation: "Loại 1 (Tuyển chọn)",
          comment: "Độ tươi 95% chuẩn AI, làm món nướng hay xào thịt bò giòn ngọt mọng nước.",
          images: [pImg],
          reply: null,
          helpful: 4
        },
        {
          id: 6,
          user: "lanhuong_organic",
          rating: 5,
          date: "2024-02-28 08:45",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Hàng VietGAP chuẩn chỉ, shop đóng gói bọc màng khí cẩn thận, shipper lịch sự.",
          images: [pImg],
          reply: null,
          helpful: 7
        },
        {
          id: 7,
          user: "tuan_anh_hcm",
          rating: 5,
          date: "2024-02-26 15:30",
          variation: "Ớt đỏ Đà Lạt",
          comment: "Giao hàng nhanh như chớp, mới đặt 1 tiếng rưỡi đã có shipper bấm chuông. Rau củ tươi rói.",
          images: [pImg],
          reply: null,
          helpful: 3
        },
        {
          id: 8,
          user: "bich_ngoc_94",
          rating: 4,
          date: "2024-02-22 17:10",
          variation: "Ớt xanh Đà Lạt",
          comment: "Rau tươi ngon, nhưng lần này quả hơi nhỏ hơn đợt trước một chút. Vẫn đánh giá 4 sao vì chất lượng tốt.",
          images: [pImg],
          reply: "Dạ shop ghi nhận góp ý của bạn Ngọc để lựa chọn size quả đồng đều hơn trong các đợt thu hoạch tới ạ!",
          helpful: 2
        },
        {
          id: 9,
          user: "duc_thanh_gym",
          rating: 5,
          date: "2024-02-20 19:00",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Rất thích cách shop kiểm định AI độ tươi. Mua về làm nước ép thanh lọc cơ thể cực kỳ sảng khoái.",
          images: [pImg],
          reply: null,
          helpful: 5
        },
        {
          id: 10,
          user: "kim_oanh_cook",
          rating: 5,
          date: "2024-02-18 10:25",
          variation: "Loại 1 (Tuyển chọn)",
          comment: "Rau sạch tươi như vừa hái tại vườn Đà Lạt sáng nay. Nấu canh ngọt nước tự nhiên.",
          images: [pImg],
          reply: null,
          helpful: 4
        },
        {
          id: 11,
          user: "viet_dung_fresh",
          rating: 5,
          date: "2024-02-15 14:40",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Shop uy tín, cân đủ thậm chí dư một chút. Sẽ giới thiệu bạn bè cùng mua.",
          images: [pImg],
          reply: null,
          helpful: 2
        },
        {
          id: 12,
          user: "mai_phuong_eat",
          rating: 5,
          date: "2024-02-12 09:50",
          variation: "Ớt vàng Đà Lạt",
          comment: "Màu sắc bóng đẹp, giòn ngọt không bị dập nát quả nào. Cảm ơn HTX nông nghiệp sạch!",
          images: [pImg],
          reply: null,
          helpful: 6
        },
        {
          id: 13,
          user: "hoang_long_88",
          rating: 5,
          date: "2024-02-10 16:15",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Được miễn phí vận chuyển Freeship Xtra, giá lại rẻ hơn siêu thị gần nhà. Quá hời.",
          images: [pImg],
          reply: null,
          helpful: 3
        },
        {
          id: 14,
          user: "thanh_thao_green",
          rating: 5,
          date: "2024-02-08 11:35",
          variation: "Loại 1 (Tuyển chọn)",
          comment: "Rau củ chuẩn hữu cơ, xào lên giữ được màu xanh mướt và độ giòn.",
          images: [pImg],
          reply: null,
          helpful: 5
        },
        {
          id: 15,
          user: "minh_tri_chef",
          rating: 5,
          date: "2024-02-05 18:20",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Chất lượng ổn định suốt mấy tháng nay. Đặt làm tiệc gia đình ai cũng khen rau củ ngọt mát.",
          images: [pImg],
          reply: null,
          helpful: 4
        },
        {
          id: 16,
          user: "phuong_vy_95",
          rating: 5,
          date: "2024-02-02 13:45",
          variation: "Ớt đỏ Đà Lạt",
          comment: "Đóng gói sạch sẽ, có nhãn kiểm định QR truy xuất nguồn gốc rõ ràng.",
          images: [pImg],
          reply: null,
          helpful: 3
        },
        {
          id: 17,
          user: "ngoc_tram_family",
          rating: 5,
          date: "2024-01-29 10:10",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Cả nhà mình ai cũng khen. Bé nhà mình bình thường lười ăn rau mà hôm nay ăn hết cả đĩa.",
          images: [pImg],
          reply: null,
          helpful: 2
        },
        {
          id: 18,
          user: "anh_tuan_q1",
          rating: 3,
          date: "2024-01-25 15:55",
          variation: "Loại tiêu chuẩn",
          comment: "Sản phẩm tươi ngon nhưng shipper giao trễ hơn hẹn 20 phút do trời mưa. Hy vọng shop khắc phục khâu vận chuyển.",
          images: [pImg],
          reply: "Dạ shop thành thật xin lỗi bạn Tuấn về sự chậm trễ hôm trời mưa gió! Shop đã làm việc lại với đội ngũ vận chuyển để đảm bảo đúng hẹn tuyệt đối ạ.",
          helpful: 9
        },
        {
          id: 19,
          user: "khanh_linh_clean",
          rating: 5,
          date: "2024-01-20 09:30",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Đạt điểm 10 chất lượng. Mình sẽ ủng hộ shop dài dài.",
          images: [],
          reply: null,
          helpful: 3
        },
        {
          id: 20,
          user: "hong_nhung_cook",
          rating: 5,
          date: "2024-01-18 16:40",
          variation: "Ớt vàng Đà Lạt",
          comment: "Rau củ tươi ngon mọng nước, mùi thơm tự nhiên rất dễ chịu.",
          images: [],
          reply: null,
          helpful: 2
        },
        {
          id: 21,
          user: "quoc_bao_92",
          rating: 5,
          date: "2024-01-15 11:15",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Giao nhanh, đóng gói cẩn thận, rau tươi rói.",
          images: [],
          reply: null,
          helpful: 1
        },
        {
          id: 22,
          user: "thu_trang_dalat",
          rating: 5,
          date: "2024-01-12 14:05",
          variation: "Loại 1 (Tuyển chọn)",
          comment: "Hài lòng về chất lượng sản phẩm và thái độ phục vụ của shop.",
          images: [],
          reply: null,
          helpful: 2
        },
        {
          id: 23,
          user: "hai_dang_vnu",
          rating: 5,
          date: "2024-01-10 17:50",
          variation: "Mix 3 màu (Bán chạy)",
          comment: "Hàng chuẩn như hình mô tả. 5 sao uy tín.",
          images: [],
          reply: null,
          helpful: 1
        },
        {
          id: 24,
          user: "cam_tu_96",
          rating: 5,
          date: "2024-01-08 08:20",
          variation: "Ớt đỏ Đà Lạt",
          comment: "Nông sản sạch, an toàn vệ sinh thực phẩm.",
          images: [],
          reply: null,
          helpful: 0
        }
      ];
      setReviews(defaultList);
    }

    loadData();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => {
      ignore = true;
    };
  }, [id]);

  // Cuộn chat xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (isChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  if (loading || !product) {
    return (
      <div className="pdp-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", color: "var(--pdp-slate-600)", fontWeight: "600" }}>
            Đang tải thông tin nông sản sạch...
          </div>
        </div>
      </div>
    );
  }

  // --- Dữ liệu chuẩn hóa & TÍNH TOÁN ĐIỂM SỐ SAO CHÍNH XÁC ---
  const totalRatingSum = reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0);
  const calculatedAvgRating = reviews.length > 0 ? totalRatingSum / reviews.length : (product.ratingAvg ? Number(product.ratingAvg) : 4.8);
  const formattedRating = calculatedAvgRating.toFixed(1);

  // Thống kê chính xác số lượng từng loại sao
  const count5Star = reviews.filter((r) => r.rating === 5).length;
  const count4Star = reviews.filter((r) => r.rating === 4).length;
  const count3Star = reviews.filter((r) => r.rating === 3).length;
  const count2Star = reviews.filter((r) => r.rating === 2).length;
  const count1Star = reviews.filter((r) => r.rating === 1).length;
  const countImages = reviews.filter((r) => r.images && r.images.length > 0).length;
  const countComments = reviews.filter((r) => r.comment && r.comment.trim().length > 0).length;

  const mainImage =
    product.imageUrl ||
    product.primaryImageUrl ||
    "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=600";

  let galleryImages = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    galleryImages = product.images.map((img) => (typeof img === "string" ? img : img.url || mainImage));
  } else {
    galleryImages = [mainImage, mainImage, mainImage, mainImage, mainImage];
  }

  const currentImgUrl = galleryImages[selectedImageIndex] || galleryImages[0] || mainImage;
  const unit = product.unit || "kg";
  const stock = product.stockQuantity || product.inventory || product.stock || 40;
  const price = Number(product.price || 0);
  const originalPrice = Math.round(price * 1.15);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100) || 12;

  const originName = product.origin || product.location || product.shop?.province || "TP. Đà Lạt, Tỉnh Lâm Đồng";
  const sellerName = product.shop?.shopName || product.seller || product.farmName || "HTX Nông Nghiệp Xanh Đà Lạt";
  const categoryName = product.category || "Rau Củ Quả Đà Lạt";

  const aiScore = product.aiOverallConfidence
    ? Math.round(Number(product.aiOverallConfidence) * 100)
    : product.aiLabel?.confidence
    ? Math.round(product.aiLabel.confidence * 100)
    : product.freshnessScore || 95;

  let variationOptions = ["Loại 1 (Tuyển chọn)", "Loại 2 (Tiêu chuẩn)", "Mix tươi ngon (Bán chạy)"];
  if (product.name && product.name.toLowerCase().includes("ớt")) {
    variationOptions = ["Ớt đỏ Đà Lạt", "Ớt vàng Đà Lạt", "Ớt xanh Đà Lạt", "Mix 3 màu (Bán chạy)"];
  } else if (product.name && product.name.toLowerCase().includes("khoai")) {
    variationOptions = ["Củ to tuyển chọn", "Củ vừa ăn", "Combo 3kg tiết kiệm"];
  }

  // --- Xử lý Thêm giỏ hàng & Mua ngay ---
  const triggerAddToCart = (targetProduct, targetQty = 1) => {
    const prodToAdd = targetProduct || product;
    const itemToAdd = {
      ...prodToAdd,
      image: currentImgUrl,
      aiGrade: `Tươi sạch AI (${aiScore}%)`,
      origin: originName,
      unit: prodToAdd.unit || unit,
      selectedVariation
    };

    const success = addToCart(itemToAdd, targetQty);
    if (success) {
      triggerToast(`Đã thêm ${targetQty} ${itemToAdd.unit} "${itemToAdd.name}" vào giỏ hàng!`);
    }
    return success;
  };

  const handleBuyNow = () => {
    if (triggerAddToCart(product, quantity)) {
      navigate("/checkout");
    }
  };

  // --- Xử lý Yêu thích ---
  const handleToggleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));
    localStorage.setItem(`pdp_fav_${product.id}`, String(newLiked));
    triggerToast(newLiked ? "Đã thêm vào danh sách yêu thích!" : "Đã bỏ yêu thích");
  };

  // --- Xử lý Chia sẻ ---
  const handleShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("Đã sao chép liên kết sản phẩm vào bộ nhớ tạm!");
    } else {
      triggerToast("Liên kết: " + window.location.href);
    }
  };

  // --- Xử lý Theo dõi Shop ---
  const handleToggleFollowShop = () => {
    const shopId = product.shop?.id || product.shopId || 1;
    const newFollow = !isFollowingShop;
    setIsFollowingShop(newFollow);
    setFollowerCount(newFollow ? "12.5k" : "12.4k");
    localStorage.setItem(`pdp_follow_shop_${shopId}`, String(newFollow));
    triggerToast(newFollow ? `Đã theo dõi gian hàng ${sellerName}!` : `Đã bỏ theo dõi gian hàng ${sellerName}`);
  };

  // --- Xử lý Gửi Chat ---
  const handleSendMessage = (customText) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: textToSend.trim()
    };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatInput("");

    setTimeout(() => {
      let replyText = "Dạ cảm ơn bạn! Shop đã nhận được tin nhắn và sẽ hỗ trợ đóng hàng giao hỏa tốc sớm nhất cho bạn nhé.";
      if (textToSend.includes("còn tươi") || textToSend.includes("chất lượng")) {
        replyText = `Dạ sản phẩm ${product.name} được thu hoạch sáng nay, kiểm định AI Fresh đạt ${aiScore}% độ tươi, cam kết nguyên vị giòn ngọt ạ!`;
      } else if (textToSend.includes("giao") || textToSend.includes("ship")) {
        replyText = "Dạ khu vực TP.HCM shop giao hỏa tốc nhận trong 2 giờ. Các tỉnh khác từ 1-2 ngày bọc xốp bảo quản mát ạ!";
      } else if (textToSend.includes("freeship") || textToSend.includes("mã")) {
        replyText = "Dạ đơn từ 150.000₫ shop có voucher Freeship Xtra giảm ngay phí vận chuyển bạn nhé!";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "seller",
          text: replyText
        }
      ]);
    }, 700);
  };

  // --- Xử lý Lưu Voucher ---
  const handleSaveVoucher = (code) => {
    if (savedVouchers.includes(code)) return;
    const updated = [...savedVouchers, code];
    setSavedVouchers(updated);
    localStorage.setItem("pdp_saved_vouchers", JSON.stringify(updated));
    triggerToast(`Đã lưu mã giảm giá "${code}" vào ví của bạn!`);
  };

  // --- Xử lý Cập nhật địa chỉ nhận hàng ---
  const handleSaveAddress = (e) => {
    e.preventDefault();
    const newAddr = `${tempDistrict}, ${tempCity}`;
    setShippingAddress(newAddr);
    if (tempCity.includes("Hồ Chí Minh")) {
      setShippingFee("₫15.000 - ₫22.000");
      setShippingSpeed("Giao Hỏa Tốc 2H");
    } else {
      setShippingFee("₫28.000 - ₫35.000");
      setShippingSpeed("Giao Tiết Kiệm (1-2 ngày)");
    }
    setIsAddressModalOpen(false);
    triggerToast(`Đã cập nhật địa chỉ giao hàng tới ${newAddr}!`);
  };

  // --- Xử lý Gửi Đánh Giá Mới (Tính lại số sao & cập nhật LocalStorage) ---
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá nông sản.");
      return;
    }

    const reviewerName = user?.fullName || "Khách hàng thân thiết";
    const newRev = {
      id: Date.now(),
      user: reviewerName,
      rating: newReviewRating,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      variation: newReviewVariation || selectedVariation,
      comment: newReviewComment.trim(),
      images: [currentImgUrl],
      reply: null,
      helpful: 0
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    localStorage.setItem(`pdp_reviews_${product.id}`, JSON.stringify(updated));

    setNewReviewComment("");
    setIsReviewModalOpen(false);
    triggerToast(`Cảm ơn bạn! Đánh giá ${newReviewRating} sao đã được ghi nhận thành công.`);
  };

  // --- Xử lý Thích đánh giá hữu ích ---
  const handleHelpfulClick = (reviewId) => {
    if (helpfulReviews[reviewId]) return;
    setHelpfulReviews((prev) => ({ ...prev, [reviewId]: true }));
    setReviews((prev) => {
      const nextReviews = prev.map((r) => (r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r));
      localStorage.setItem(`pdp_reviews_${product.id}`, JSON.stringify(nextReviews));
      return nextReviews;
    });
    triggerToast("Cảm ơn bạn đã phản hồi đánh giá hữu ích!");
  };

  // --- Lọc đánh giá theo tab đã chọn ---
  const filteredReviews = reviews.filter((rev) => {
    if (activeReviewFilter === "all") return true;
    if (activeReviewFilter === "5star") return rev.rating === 5;
    if (activeReviewFilter === "4star") return rev.rating === 4;
    if (activeReviewFilter === "3star") return rev.rating === 3;
    if (activeReviewFilter === "2star") return rev.rating === 2;
    if (activeReviewFilter === "1star") return rev.rating === 1;
    if (activeReviewFilter === "images") return rev.images && rev.images.length > 0;
    if (activeReviewFilter === "comments") return rev.comment && rev.comment.trim().length > 0;
    return true;
  });

  const displayedReviews = filteredReviews.slice(0, visibleReviewCount);

  return (
    <div className="pdp-page">
      {/* Toast thông báo góc phải */}
      {showToast && (
        <div className="pdp-toast">
          <Check size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="pdp-container">
        {/* --- Breadcrumb --- */}
        <section className="pdp-breadcrumbs">
          <nav>
            <Link to="/" className="pdp-breadcrumb-link">Nông Sản Việt</Link>
            <span className="pdp-breadcrumb-sep"><ChevronRight size={12} /></span>
            <Link to="/products" className="pdp-breadcrumb-link">Thực Phẩm Tươi Sống</Link>
            <span className="pdp-breadcrumb-sep"><ChevronRight size={12} /></span>
            <Link to={`/products?category=${encodeURIComponent(categoryName)}`} className="pdp-breadcrumb-link">{categoryName}</Link>
            <span className="pdp-breadcrumb-sep"><ChevronRight size={12} /></span>
            <span className="pdp-breadcrumb-current">{product.name}</span>
          </nav>
        </section>

        {/* --- Product Detail Hero --- */}
        <main className="pdp-hero-card">
          <div className="pdp-hero-grid">
            {/* Cột trái: Thư viện ảnh Shopee Mall */}
            <div className="pdp-gallery">
              <div className="pdp-main-image-wrap">
                <span className="pdp-mall-badge-lg">MALL</span>
                <span className="pdp-ai-fresh-badge">
                  <ShieldCheck size={12} />
                  AI FRESH {aiScore}%
                </span>
                <img
                  src={currentImgUrl}
                  alt={product.name}
                  className="pdp-main-img"
                />
              </div>

              {/* Thumbnails */}
              <div className="pdp-thumbnails-grid">
                {galleryImages.slice(0, 5).map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`pdp-thumb-btn ${selectedImageIndex === idx ? "active" : ""}`}
                    onClick={() => setSelectedImageIndex(idx)}
                    title={`Xem hình ảnh ${idx + 1}`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>

              {/* Chia sẻ & Yêu thích */}
              <div className="pdp-gallery-footer">
                <div className="pdp-share-wrap">
                  <span>Chia sẻ:</span>
                  <div className="pdp-social-icons">
                    <button
                      type="button"
                      className="pdp-social-btn"
                      title="Sao chép liên kết chia sẻ"
                      onClick={handleShareLink}
                    >
                      <Share2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="pdp-social-btn"
                      title="Nhắn tin hỏi shop"
                      onClick={() => setIsChatOpen(true)}
                    >
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </div>
                <div className="pdp-fav-wrap">
                  <button
                    type="button"
                    className="pdp-fav-btn"
                    onClick={handleToggleLike}
                    title={isLiked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                  >
                    <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                    <span>Đã thích ({likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin sản phẩm & Tương tác mua hàng */}
            <div className="pdp-info">
              {/* Tiêu đề & Nhãn Mall */}
              <div className="pdp-title-section">
                <h1 className="pdp-product-title">
                  <span className="pdp-mall-tag">Mall</span>
                  <span>{product.name}</span>
                </h1>

                {/* SỐ SAO VÀ ĐÁNH GIÁ ĐỒNG BỘ 100% VỚI DỮ LIỆU THỰC TẾ */}
                <div className="pdp-rating-meta">
                  <div className="pdp-meta-stars" title={`Điểm đánh giá trung bình: ${formattedRating} / 5`}>
                    <span className="pdp-meta-score">{formattedRating}</span>
                    <div className="pdp-stars-icons">
                      {renderStarRating(calculatedAvgRating, 13)}
                    </div>
                  </div>
                  <span className="pdp-meta-divider">|</span>
                  <div className="pdp-meta-reviews">
                    <strong>{reviews.length}</strong> <span>Đánh Giá</span>
                  </div>
                  <span className="pdp-meta-divider">|</span>
                  <div className="pdp-meta-sold">
                    <strong>{product.soldCount || 140}</strong> <span>Đã Bán</span>
                  </div>
                  <span className="pdp-meta-divider">|</span>
                  <span style={{ color: "var(--pdp-slate-400)" }}>Mã SP: #{product.id}</span>
                </div>
              </div>

              {/* Bảng giá Shopee nền xám */}
              <div className="pdp-price-box">
                <span className="pdp-original-price">₫{originalPrice.toLocaleString("vi-VN")}</span>
                <span className="pdp-current-price">₫{price.toLocaleString("vi-VN")}</span>
                <span className="pdp-discount-badge">{discountPercent}% GIẢM</span>
                <span className="pdp-price-tag">
                  <Sparkles size={13} /> Giá Tốt Trong Ngày
                </span>
              </div>

              {/* Mã giảm giá Shop */}
              <div className="pdp-row">
                <span className="pdp-row-label">Mã Giảm Giá Của Shop</span>
                <div className="pdp-voucher-chips">
                  <button
                    type="button"
                    className="pdp-voucher-chip"
                    onClick={() => setIsVoucherModalOpen(true)}
                  >
                    Giảm ₫10k
                  </button>
                  <button
                    type="button"
                    className="pdp-voucher-chip"
                    onClick={() => setIsVoucherModalOpen(true)}
                  >
                    Giảm ₫15k đơn từ 150k
                  </button>
                  <button
                    type="button"
                    className="pdp-voucher-chip freeship"
                    onClick={() => setIsVoucherModalOpen(true)}
                  >
                    Freeship Xtra
                  </button>
                </div>
              </div>

              {/* Vận chuyển */}
              <div className="pdp-row pdp-row-shipping">
                <span className="pdp-row-label">Vận Chuyển</span>
                <div className="pdp-shipping-info">
                  <div className="pdp-shipping-dest">
                    <Truck size={16} color="var(--pdp-brand-600)" />
                    <span>
                      Vận chuyển tới <strong>{shippingAddress}</strong>
                    </span>
                    <button
                      type="button"
                      className="pdp-shipping-change-btn"
                      onClick={() => setIsAddressModalOpen(true)}
                    >
                      Thay đổi
                    </button>
                  </div>
                  <div className="pdp-shipping-fee">
                    <span>Phí vận chuyển: <strong>{shippingFee}</strong></span>
                    <span className="pdp-express-badge">{shippingSpeed}</span>
                  </div>
                </div>
              </div>

              {/* Phân loại hàng (Variations) */}
              <div className="pdp-row">
                <span className="pdp-row-label">Phân Loại</span>
                <div className="pdp-variations-list">
                  {variationOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`pdp-variation-btn ${selectedVariation === opt ? "active" : ""}`}
                      onClick={() => setSelectedVariation(opt)}
                    >
                      {selectedVariation === opt && <Check size={12} />}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Số lượng */}
              <div className="pdp-row">
                <span className="pdp-row-label">Số Lượng</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div className="pdp-qty-stepper">
                    <button
                      type="button"
                      className="pdp-qty-btn"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="text"
                      className="pdp-qty-input"
                      value={quantity}
                      readOnly
                    />
                    <button
                      type="button"
                      className="pdp-qty-btn"
                      onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="pdp-stock-text">{stock} {unit} có sẵn trong kho</span>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pdp-action-buttons">
                <button
                  type="button"
                  className="pdp-btn-add-cart"
                  onClick={() => triggerAddToCart(product, quantity)}
                >
                  <ShoppingCart size={17} />
                  Thêm Vào Giỏ Hàng
                </button>
                <button
                  type="button"
                  className="pdp-btn-buy-now"
                  onClick={handleBuyNow}
                >
                  Mua Ngay
                </button>
              </div>

              {/* Cam kết sàn */}
              <div className="pdp-assurance-footer">
                <div className="pdp-assurance-item">
                  <RotateCcw size={14} />
                  <span>7 ngày miễn phí đổi trả</span>
                </div>
                <div className="pdp-assurance-item">
                  <BadgeCheck size={14} />
                  <span>100% Nông sản VietGAP</span>
                </div>
                <div className="pdp-assurance-item">
                  <ShieldCheck size={14} />
                  <span>Kiểm định AI độ tươi đạt chuẩn</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* --- Thông Tin Shop / HTX --- */}
        <section className="pdp-shop-card">
          <div className="pdp-shop-left">
            <div className="pdp-shop-avatar-wrap">
              {product.shop?.logoUrl ? (
                <img src={product.shop.logoUrl} alt={sellerName} />
              ) : (
                <Store size={28} />
              )}
              <span className="pdp-shop-mall-pill">Mall</span>
            </div>
            <div className="pdp-shop-info">
              <h3 className="pdp-shop-name">{sellerName}</h3>
              <p className="pdp-shop-status">Online 5 Phút Trước</p>
              <div className="pdp-shop-buttons">
                <button
                  type="button"
                  className="pdp-shop-chat-btn"
                  onClick={() => setIsChatOpen(true)}
                >
                  <MessageSquare size={13} /> Chat Ngay
                </button>
                <Link to={`/shops/${product.shop?.id || product.shopId || 1}`} className="pdp-shop-view-btn">
                  <Store size={13} /> Xem Shop
                </Link>
                <button
                  type="button"
                  className={`pdp-shop-follow-btn ${isFollowingShop ? "following" : ""}`}
                  onClick={handleToggleFollowShop}
                >
                  {isFollowingShop ? <UserCheck size={13} /> : <Plus size={13} />}
                  {isFollowingShop ? "Đang Theo Dõi" : "Theo Dõi"}
                </button>
              </div>
            </div>
          </div>

          <div className="pdp-shop-stats-grid">
            <div className="pdp-shop-stat-item">
              <span>Đánh Giá:</span>
              <strong>{product.shop?.ratingAvg ? `${Number(product.shop.ratingAvg).toFixed(1)} (420+ đánh giá)` : "4.9 (420+ đánh giá)"}</strong>
            </div>
            <div className="pdp-shop-stat-item">
              <span>Tỉ Lệ Phản Hồi:</span>
              <strong>98%</strong>
            </div>
            <div className="pdp-shop-stat-item">
              <span>Tham Gia:</span>
              <strong>2 năm trước</strong>
            </div>
            <div className="pdp-shop-stat-item">
              <span>Sản Phẩm:</span>
              <strong>38</strong>
            </div>
            <div className="pdp-shop-stat-item">
              <span>Thời Gian Phản Hồi:</span>
              <strong>trong vài phút</strong>
            </div>
            <div className="pdp-shop-stat-item">
              <span>Người Theo Dõi:</span>
              <strong>{followerCount}</strong>
            </div>
          </div>
        </section>

        {/* --- Chi Tiết, Mô Tả & Đánh Giá + Cột Top Bán Chạy --- */}
        <div className="pdp-content-grid">
          {/* CỘT CHÍNH (Trái) */}
          <div className="pdp-main-column">
            {/* Box 1: Chi tiết sản phẩm */}
            <div className="pdp-card-box">
              <h2 className="pdp-box-header">Chi Tiết Sản Phẩm</h2>
              <div className="pdp-specs-table">
                <div className="pdp-spec-line">
                  <span className="pdp-spec-label">Danh Mục</span>
                  <div className="pdp-spec-val" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Link to="/products" className="pdp-spec-cat-link">Nông Sản Việt</Link>
                    <ChevronRight size={11} color="var(--pdp-slate-400)" />
                    <Link to="/products" className="pdp-spec-cat-link">Thực Phẩm Tươi Sống</Link>
                    <ChevronRight size={11} color="var(--pdp-slate-400)" />
                    <span style={{ color: "var(--pdp-slate-800)", fontWeight: "600" }}>{categoryName}</span>
                  </div>
                </div>
                <div className="pdp-spec-line">
                  <span className="pdp-spec-label">Thương hiệu / HTX</span>
                  <span className="pdp-spec-val bold">{sellerName}</span>
                </div>
                <div className="pdp-spec-line">
                  <span className="pdp-spec-label">Hạn sử dụng</span>
                  <span className="pdp-spec-val">7-10 ngày (Bảo quản 4-8°C)</span>
                </div>
                <div className="pdp-spec-line">
                  <span className="pdp-spec-label">Trọng lượng</span>
                  <span className="pdp-spec-val">1 {unit} / phần</span>
                </div>
                <div className="pdp-spec-line">
                  <span className="pdp-spec-label">Phương thức canh tác</span>
                  <span className="pdp-spec-val">Nhà kính công nghệ cao, tiêu chuẩn VietGAP</span>
                </div>
                <div className="pdp-spec-line">
                  <span className="pdp-spec-label">Kho hàng</span>
                  <span className="pdp-spec-val">{stock} {unit}</span>
                </div>
                <div className="pdp-spec-line">
                  <span className="pdp-spec-label">Gửi từ</span>
                  <span className="pdp-spec-val bold">{originName}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Mô tả sản phẩm */}
            <div className="pdp-card-box">
              <h2 className="pdp-box-header">Mô Tả Sản Phẩm</h2>
              <div className="pdp-description-text">
                <p>
                  {product.description ||
                    `${product.name} được nuôi trồng và thu hoạch trực tiếp tại các nông trại đạt chuẩn VietGAP. Nguồn nước sạch tự nhiên cùng khí hậu mát mẻ quanh năm tạo nên chất lượng nông sản giòn ngọt, dày cơm và giàu dinh dưỡng.`}
                </p>
                <p>
                  <strong>Đặc điểm nổi bật:</strong>
                  <br />
                  - 100% Thu hái tươi mới mỗi sáng, kiểm định chất lượng AI đạt {aiScore}% độ tươi và độ bóng vỏ.
                  <br />
                  - Giàu vitamin và khoáng chất tự nhiên, an toàn cho cả gia đình.
                  <br />
                  - Thích hợp cho các món xào, luộc, canh thanh mát hoặc chế biến salad eat-clean.
                </p>
                <p>
                  <strong>Hướng dẫn bảo quản:</strong>
                  <br />
                  - Để nơi khô ráo thoáng mát hoặc bọc màng thực phẩm bảo quản trong ngăn mát tủ lạnh (4-8°C).
                  <br />
                  - Giữ nguyên độ giòn ngọt thơm ngon từ 7-10 ngày.
                </p>
              </div>
            </div>

            {/* Box 3: ĐÁNH GIÁ SẢN PHẨM KHỚP 100% VỚI TOÀN BỘ SỐ LIỆU */}
            <div className="pdp-card-box">
              <div className="pdp-box-header" style={{ marginBottom: "20px" }}>
                <span>Đánh Giá Sản Phẩm ({reviews.length})</span>
                <button
                  type="button"
                  className="pdp-write-review-btn"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  <Star size={13} fill="currentColor" /> Viết Đánh Giá
                </button>
              </div>

              {/* Thang điểm tổng quan */}
              <div className="pdp-reviews-overview">
                <div className="pdp-rating-big">
                  <div className="pdp-score-num">
                    {formattedRating} <span>trên 5</span>
                  </div>
                  <div className="pdp-stars-icons" style={{ justifyContent: "center", marginTop: "4px" }}>
                    {renderStarRating(calculatedAvgRating, 16)}
                  </div>
                </div>

                {/* Các nút lọc số sao khớp chuẩn xác số lượng thực tế */}
                <div className="pdp-filter-tabs">
                  <button
                    type="button"
                    className={`pdp-filter-tab ${activeReviewFilter === "all" ? "active" : ""}`}
                    onClick={() => {
                      setActiveReviewFilter("all");
                      setVisibleReviewCount(6);
                    }}
                  >
                    Tất Cả ({reviews.length})
                  </button>
                  <button
                    type="button"
                    className={`pdp-filter-tab ${activeReviewFilter === "5star" ? "active" : ""}`}
                    onClick={() => {
                      setActiveReviewFilter("5star");
                      setVisibleReviewCount(6);
                    }}
                  >
                    5 Sao ({count5Star})
                  </button>
                  <button
                    type="button"
                    className={`pdp-filter-tab ${activeReviewFilter === "4star" ? "active" : ""}`}
                    onClick={() => {
                      setActiveReviewFilter("4star");
                      setVisibleReviewCount(6);
                    }}
                  >
                    4 Sao ({count4Star})
                  </button>
                  {count3Star > 0 && (
                    <button
                      type="button"
                      className={`pdp-filter-tab ${activeReviewFilter === "3star" ? "active" : ""}`}
                      onClick={() => {
                        setActiveReviewFilter("3star");
                        setVisibleReviewCount(6);
                      }}
                    >
                      3 Sao ({count3Star})
                    </button>
                  )}
                  {count2Star > 0 && (
                    <button
                      type="button"
                      className={`pdp-filter-tab ${activeReviewFilter === "2star" ? "active" : ""}`}
                      onClick={() => {
                        setActiveReviewFilter("2star");
                        setVisibleReviewCount(6);
                      }}
                    >
                      2 Sao ({count2Star})
                    </button>
                  )}
                  {count1Star > 0 && (
                    <button
                      type="button"
                      className={`pdp-filter-tab ${activeReviewFilter === "1star" ? "active" : ""}`}
                      onClick={() => {
                        setActiveReviewFilter("1star");
                        setVisibleReviewCount(6);
                      }}
                    >
                      1 Sao ({count1Star})
                    </button>
                  )}
                  <button
                    type="button"
                    className={`pdp-filter-tab ${activeReviewFilter === "images" ? "active" : ""}`}
                    onClick={() => {
                      setActiveReviewFilter("images");
                      setVisibleReviewCount(6);
                    }}
                  >
                    Có Hình Ảnh / Video ({countImages})
                  </button>
                  <button
                    type="button"
                    className={`pdp-filter-tab ${activeReviewFilter === "comments" ? "active" : ""}`}
                    onClick={() => {
                      setActiveReviewFilter("comments");
                      setVisibleReviewCount(6);
                    }}
                  >
                    Có Bình Luận ({countComments})
                  </button>
                </div>
              </div>

              {/* Danh sách bình luận */}
              <div className="pdp-review-list">
                {filteredReviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "var(--pdp-slate-400)", fontSize: "13px" }}>
                    Chưa có đánh giá nào phù hợp với bộ lọc đã chọn.
                  </div>
                ) : (
                  displayedReviews.map((rev) => (
                    <div key={rev.id} className="pdp-review-item">
                      <div className={`pdp-reviewer-avatar ${rev.id % 2 === 0 ? "alt" : ""}`}>
                        {rev.user.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="pdp-review-body">
                        <div className="pdp-reviewer-name">{rev.user}</div>
                        {/* Render chuẩn 5 sao với số sao đạt được màu vàng, còn lại rỗng */}
                        <div className="pdp-stars-icons">
                          {renderReviewStars(rev.rating, 13)}
                        </div>
                        <div className="pdp-review-meta">
                          {rev.date} | Phân loại hàng: {rev.variation}
                        </div>
                        <p className="pdp-review-comment">{rev.comment}</p>

                        {rev.images && rev.images.length > 0 && (
                          <div className="pdp-review-photos">
                            {rev.images.map((imgUrl, i) => (
                              <img key={i} src={imgUrl} alt="Review feedback" className="pdp-review-img" />
                            ))}
                          </div>
                        )}

                        {rev.reply && (
                          <div className="pdp-seller-reply">
                            <strong>Phản Hồi Của Người Bán:</strong>
                            {rev.reply}
                          </div>
                        )}

                        <div className="pdp-review-actions-row">
                          <button
                            type="button"
                            className={`pdp-review-helpful-btn ${helpfulReviews[rev.id] ? "liked" : ""}`}
                            onClick={() => handleHelpfulClick(rev.id)}
                          >
                            <ThumbsUp size={12} />
                            <span>Hữu ích ({rev.helpful || 0})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Nút Xem thêm đánh giá nếu còn đánh giá chưa hiện */}
              {filteredReviews.length > visibleReviewCount && (
                <div style={{ textAlign: "center", paddingTop: "20px" }}>
                  <button
                    type="button"
                    className="pdp-shop-view-btn"
                    style={{ margin: "0 auto", padding: "8px 24px" }}
                    onClick={() => setVisibleReviewCount((prev) => prev + 6)}
                  >
                    Xem thêm ({filteredReviews.length - visibleReviewCount} đánh giá khác) <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHỤ (Phải: Top Bán Chạy Của Shop) */}
          <div className="pdp-sidebar-column">
            <div className="pdp-top-sellers-card">
              <h3 className="pdp-top-sellers-title">
                <Flame size={16} /> Top Bán Chạy Của Shop
              </h3>
              <div className="pdp-top-sellers-list">
                {topSellers.map((item) => (
                  <Link
                    key={item.id}
                    to={`/products/${item.id}`}
                    className="pdp-top-seller-item"
                  >
                    <img
                      src={
                        item.imageUrl ||
                        item.primaryImageUrl ||
                        "https://placehold.co/100x100?text=Top+Seller"
                      }
                      alt={item.name}
                      className="pdp-top-seller-thumb"
                    />
                    <div className="pdp-top-seller-meta">
                      <h4 className="pdp-top-seller-name">{item.name}</h4>
                      <span className="pdp-top-seller-price">
                        ₫{Number(item.price || 0).toLocaleString("vi-VN")}
                      </span>
                      <span className="pdp-top-seller-sold">
                        Đã bán {item.soldCount || 180} {item.unit || "kg"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- Có Thể Bạn Cũng Thích --- */}
        {relatedProducts.length > 0 && (
          <section className="pdp-related-section">
            <div className="pdp-related-header">
              <h2 className="pdp-related-title">
                <Sparkles size={18} /> Có Thể Bạn Cũng Thích
              </h2>
              <Link to="/products" className="pdp-related-view-all">
                Xem tất cả rau củ quả <ArrowRight size={14} />
              </Link>
            </div>

            <div className="pdp-related-grid">
              {relatedProducts.map((rel) => {
                const relImg =
                  rel.imageUrl ||
                  rel.primaryImageUrl ||
                  "https://placehold.co/400x400?text=Produce";
                const relScore = rel.aiOverallConfidence
                  ? Math.round(Number(rel.aiOverallConfidence) * 100)
                  : rel.freshnessScore || 95;

                return (
                  <div key={rel.id} className="pdp-related-card">
                    <Link to={`/products/${rel.id}`} className="pdp-related-card-link">
                      <div className="pdp-related-img-wrap">
                        <img src={relImg} alt={rel.name} />
                        <span className="pdp-related-mall-badge">Mall</span>
                        <span className="pdp-related-ai-badge">AI {relScore}%</span>
                      </div>
                      <h3 className="pdp-related-name">{rel.name}</h3>
                      <div className="pdp-related-meta-row">
                        <span className="pdp-related-price">
                          ₫{Number(rel.price || 0).toLocaleString("vi-VN")}
                        </span>
                        <span className="pdp-related-sold">
                          Đã bán {rel.soldCount || 120}
                        </span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="pdp-related-add-btn"
                      onClick={() => triggerAddToCart(rel, 1)}
                    >
                      <ShoppingCart size={13} /> Thêm
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* =========================================================================
          MODALS & FLOATING CHAT POPUP
          ========================================================================= */}

      {/* 1. Modal Viết Đánh Giá */}
      {isReviewModalOpen && (
        <div className="pdp-modal-overlay" onClick={() => setIsReviewModalOpen(false)}>
          <div className="pdp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pdp-modal-header">
              <h3 className="pdp-modal-title">Viết Đánh Giá Sản Phẩm</h3>
              <button
                type="button"
                className="pdp-modal-close-btn"
                onClick={() => setIsReviewModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="pdp-modal-body">
                {/* Chọn số sao tương tác */}
                <div className="pdp-star-picker-wrap">
                  <div className="pdp-star-picker-icons">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`pdp-star-picker-star ${s <= newReviewRating ? "active" : ""}`}
                        onClick={() => setNewReviewRating(s)}
                      >
                        <Star size={28} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                  <span className="pdp-star-picker-label">
                    {newReviewRating === 5 && "Tuyệt vời (5 sao)"}
                    {newReviewRating === 4 && "Hài lòng (4 sao)"}
                    {newReviewRating === 3 && "Bình thường (3 sao)"}
                    {newReviewRating === 2 && "Không hài lòng (2 sao)"}
                    {newReviewRating === 1 && "Rất tệ (1 sao)"}
                  </span>
                </div>

                <div className="pdp-form-group">
                  <label className="pdp-form-label">Phân loại hàng đã mua</label>
                  <select
                    className="pdp-form-select"
                    value={newReviewVariation || selectedVariation}
                    onChange={(e) => setNewReviewVariation(e.target.value)}
                  >
                    {variationOptions.map((v, i) => (
                      <option key={i} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="pdp-form-group">
                  <label className="pdp-form-label">Cảm nhận về chất lượng nông sản</label>
                  <textarea
                    className="pdp-form-textarea"
                    placeholder="Hãy chia sẻ cảm nhận về độ tươi, vị ngọt giòn, cách đóng gói và thời gian giao hàng nhé..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="pdp-modal-footer">
                <button
                  type="button"
                  className="pdp-shop-view-btn"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="pdp-btn-buy-now" style={{ height: "38px", padding: "0 20px" }}>
                  Gửi Đánh Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Mã Giảm Giá Của Shop */}
      {isVoucherModalOpen && (
        <div className="pdp-modal-overlay" onClick={() => setIsVoucherModalOpen(false)}>
          <div className="pdp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pdp-modal-header">
              <h3 className="pdp-modal-title">Mã Giảm Giá Của Shop</h3>
              <button
                type="button"
                className="pdp-modal-close-btn"
                onClick={() => setIsVoucherModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="pdp-modal-body">
              <div className="pdp-voucher-modal-list">
                <div className="pdp-voucher-ticket">
                  <div className="pdp-voucher-ticket-left">
                    <Tag size={16} />
                    <span>GIẢM 10K</span>
                  </div>
                  <div className="pdp-voucher-ticket-right">
                    <div className="pdp-voucher-ticket-info">
                      <h4>Giảm ₫10.000</h4>
                      <p>Đơn tối thiểu ₫100.000 • HSD: 30/11/2026</p>
                    </div>
                    <button
                      type="button"
                      className={`pdp-voucher-save-btn ${savedVouchers.includes("GIAM10K") ? "saved" : ""}`}
                      onClick={() => handleSaveVoucher("GIAM10K")}
                    >
                      {savedVouchers.includes("GIAM10K") ? "Đã Lưu" : "Lưu Mã"}
                    </button>
                  </div>
                </div>

                <div className="pdp-voucher-ticket">
                  <div className="pdp-voucher-ticket-left" style={{ backgroundColor: "#047857" }}>
                    <Tag size={16} />
                    <span>GIẢM 15K</span>
                  </div>
                  <div className="pdp-voucher-ticket-right">
                    <div className="pdp-voucher-ticket-info">
                      <h4>Giảm ₫15.000</h4>
                      <p>Đơn tối thiểu ₫150.000 • HSD: 30/11/2026</p>
                    </div>
                    <button
                      type="button"
                      className={`pdp-voucher-save-btn ${savedVouchers.includes("GIAM15K") ? "saved" : ""}`}
                      onClick={() => handleSaveVoucher("GIAM15K")}
                    >
                      {savedVouchers.includes("GIAM15K") ? "Đã Lưu" : "Lưu Mã"}
                    </button>
                  </div>
                </div>

                <div className="pdp-voucher-ticket">
                  <div className="pdp-voucher-ticket-left" style={{ backgroundColor: "#2563EB" }}>
                    <Truck size={16} />
                    <span>FREESHIP</span>
                  </div>
                  <div className="pdp-voucher-ticket-right">
                    <div className="pdp-voucher-ticket-info">
                      <h4>Miễn Phí Vận Chuyển</h4>
                      <p>Giảm tối đa ₫25.000 phí ship • HSD: 30/11/2026</p>
                    </div>
                    <button
                      type="button"
                      className={`pdp-voucher-save-btn ${savedVouchers.includes("FREESHIP") ? "saved" : ""}`}
                      onClick={() => handleSaveVoucher("FREESHIP")}
                    >
                      {savedVouchers.includes("FREESHIP") ? "Đã Lưu" : "Lưu Mã"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="pdp-modal-footer">
              <button
                type="button"
                className="pdp-btn-buy-now"
                style={{ height: "38px", padding: "0 20px" }}
                onClick={() => setIsVoucherModalOpen(false)}
              >
                Đồng Ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Thay Đổi Địa Chỉ Vận Chuyển */}
      {isAddressModalOpen && (
        <div className="pdp-modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
          <div className="pdp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pdp-modal-header">
              <h3 className="pdp-modal-title">Địa Chỉ Nhận Hàng</h3>
              <button
                type="button"
                className="pdp-modal-close-btn"
                onClick={() => setIsAddressModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAddress}>
              <div className="pdp-modal-body">
                <div className="pdp-form-group">
                  <label className="pdp-form-label">Tỉnh / Thành phố</label>
                  <select
                    className="pdp-form-select"
                    value={tempCity}
                    onChange={(e) => setTempCity(e.target.value)}
                  >
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Lâm Đồng (Đà Lạt)">Lâm Đồng (Đà Lạt)</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Bình Dương">Bình Dương</option>
                    <option value="Đồng Nai">Đồng Nai</option>
                  </select>
                </div>

                <div className="pdp-form-group">
                  <label className="pdp-form-label">Quận / Huyện / Phường</label>
                  <input
                    type="text"
                    className="pdp-form-input"
                    value={tempDistrict}
                    onChange={(e) => setTempDistrict(e.target.value)}
                    placeholder="Ví dụ: Phường Bến Nghé, Quận 1"
                    required
                  />
                </div>
              </div>
              <div className="pdp-modal-footer">
                <button
                  type="button"
                  className="pdp-shop-view-btn"
                  onClick={() => setIsAddressModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="pdp-btn-buy-now" style={{ height: "38px", padding: "0 20px" }}>
                  Xác Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Khung Chat Mini Nổi (Live Chat Shopee) */}
      {isChatOpen && (
        <div className="pdp-chat-popup">
          <div className="pdp-chat-popup-header">
            <div className="pdp-chat-shop-header">
              <div className="pdp-chat-shop-avatar">
                <Store size={18} />
              </div>
              <div className="pdp-chat-header-info">
                <h4>{sellerName}</h4>
                <span>Đang hoạt động</span>
              </div>
            </div>
            <button
              type="button"
              className="pdp-modal-close-btn"
              style={{ color: "#ffffff" }}
              onClick={() => setIsChatOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Xem trước sản phẩm */}
          <div className="pdp-chat-preview-box">
            <img src={currentImgUrl} alt={product.name} className="pdp-chat-preview-img" />
            <div className="pdp-chat-preview-meta">
              <div className="pdp-chat-preview-title">{product.name}</div>
              <div className="pdp-chat-preview-price">₫{price.toLocaleString("vi-VN")}</div>
            </div>
            <button
              type="button"
              className="pdp-chat-send-prod-btn"
              onClick={() => handleSendMessage(`Tôi muốn hỏi về sản phẩm "${product.name}" (Giá: ₫${price.toLocaleString("vi-VN")})`)}
            >
              Gửi Hỏi SP
            </button>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="pdp-chat-messages-wrap">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`pdp-chat-msg ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Câu hỏi nhanh gợi ý */}
          <div className="pdp-chat-quick-replies">
            <button
              type="button"
              className="pdp-chat-quick-reply-btn"
              onClick={() => handleSendMessage("Nông sản này còn tươi mới không shop?")}
            >
              Còn tươi không shop?
            </button>
            <button
              type="button"
              className="pdp-chat-quick-reply-btn"
              onClick={() => handleSendMessage("Bao lâu thì giao tới Quận 1 TP.HCM ạ?")}
            >
              Bao lâu giao tới nơi?
            </button>
            <button
              type="button"
              className="pdp-chat-quick-reply-btn"
              onClick={() => handleSendMessage("Shop có mã freeship hôm nay không?")}
            >
              Có freeship không?
            </button>
          </div>

          {/* Khung nhập tin nhắn */}
          <form
            className="pdp-chat-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              className="pdp-chat-input"
              placeholder="Nhập tin nhắn..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="pdp-chat-send-btn">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
