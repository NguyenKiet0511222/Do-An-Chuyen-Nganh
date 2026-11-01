import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { aiApi, resolveAssetUrl } from "../../services/api";
import { useAuth } from "../../context/useAuth";
import { CUSTOMER_AI_TAG, formatPercent, produceName } from "../../utils/aiLabel";
import { apiErrorMessage, formatDateTime } from "../../utils/format";
import { Lock, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import "./AIClassifierPage.css";

export default function AIClassifierPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const isPremium = user?.accountTier === "PREMIUM";

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated || !isPremium) return;
    setLoadingHistory(true);
    try {
      const res = await aiApi.getHistory({ size: 10 });
      if (res) {
        setHistory(res.content || []);
      }
    } catch (err) {
      console.warn("Lỗi khi tải lịch sử kiểm tra:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [isAuthenticated, isPremium]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setImageFile(file);
        setResult(null);
        setErrorMessage("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClassify = async () => {
    if (!imageFile) return;
    setIsAnalyzing(true);
    setErrorMessage("");

    try {
      const apiResult = await aiApi.classify(imageFile);
      setResult(apiResult);
      // Cập nhật lại lịch sử
      loadHistory();
    } catch (err) {
      console.error("Lỗi kiểm định AI:", err);
      const status = err.response?.status;
      if (status === 429) {
        setErrorMessage("Bạn đã dùng hết 20 lượt kiểm tra nhanh trong ngày hôm nay. Vui lòng quay lại vào ngày mai!");
      } else if (status === 503) {
        setErrorMessage("Dịch vụ mô hình AI hiện đang bảo trì hoặc chưa sẵn sàng. Vui lòng thử lại sau ít phút!");
      } else if (status === 403) {
        setErrorMessage("Tính năng kiểm tra nhanh độc quyền chỉ dành cho tài khoản Premium.");
      } else {
        setErrorMessage(apiErrorMessage(err, "Không thể phân loại nông sản. Vui lòng thử lại với ảnh rõ hơn."));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 1. Nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="ai-wireframe-page">
        <div className="ai-breadcrumb">
          <Link to="/" style={{ color: "#666", textDecoration: "none" }}>Trang chủ</Link> /{" "}
          <span className="ai-breadcrumb-current">Kiểm tra độ tươi bằng AI</span>
        </div>
        <div className="ai-card-wf" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "12px", color: "#0f172a" }}>
            Vui lòng đăng nhập để sử dụng tính năng
          </h2>
          <p style={{ maxWidth: "500px", margin: "0 auto 24px", color: "#64748b", lineHeight: 1.6 }}>
            Tính năng Kiểm tra chất lượng nông sản bằng AI yêu cầu đăng nhập tài khoản Premium.
          </p>
          <button
            type="button"
            className="ai-btn-classify"
            style={{ maxWidth: "200px", margin: "0 auto" }}
            onClick={() => navigate("/login")}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  // 2. Nếu tài khoản STANDARD (không phải PREMIUM)
  if (!isPremium) {
    return (
      <div className="ai-wireframe-page">
        <div className="ai-breadcrumb">
          <Link to="/" style={{ color: "#666", textDecoration: "none" }}>Trang chủ</Link> /{" "}
          <span className="ai-breadcrumb-current">Kiểm tra độ tươi bằng AI</span>
        </div>
        <div className="ai-card-wf" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ display: "inline-flex", p: "16px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", marginBottom: "20px" }}>
            <Lock size={48} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "12px", color: "#0f172a" }}>
            Tính năng dành riêng cho tài khoản 🔒 Premium
          </h2>
          <p style={{ maxWidth: "540px", margin: "0 auto 24px", color: "#64748b", lineHeight: 1.6 }}>
            Chức năng Kiểm tra chất lượng nông sản qua AI bằng ảnh tải lên độc quyền dành cho thành viên <strong>Premium</strong> (tối đa 20 lượt/ngày).
            <br />
            Trong bản thử nghiệm (v1), quản trị viên có thể gán cấp bậc <strong>Premium</strong> cho tài khoản của bạn để trải nghiệm tính năng này.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <Link
              to="/"
              style={{
                display: "inline-block",
                padding: "10px 24px",
                background: "#059669",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: "bold"
              }}
            >
              Về trang chủ mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Nếu là tài khoản PREMIUM -> Giao diện quét ảnh & lịch sử
  const resultTag = result ? CUSTOMER_AI_TAG[result.label] || { text: result.label, cls: "" } : null;
  const resultConfidencePct = result && result.confidence != null ? Math.round(Number(result.confidence) * 100) : 0;
  const recognizedName = result ? produceName(result.produce) || result.produce || "Nông sản" : "";

  return (
    <div className="ai-wireframe-page">
      <div className="ai-breadcrumb">
        <Link to="/" style={{ color: "#666", textDecoration: "none" }}>Trang chủ</Link> /{" "}
        <span className="ai-breadcrumb-current">Kiểm tra độ tươi bằng AI (Premium)</span>
      </div>

      {errorMessage && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="ai-grid">
        {/* Cột trái: Tải ảnh & Gợi ý */}
        <div>
          <div className="ai-card-wf">
            <h3 className="ai-card-title">
              <Sparkles size={18} color="#059669" /> Tải ảnh nông sản để kiểm tra
            </h3>

            <div className="ai-upload-area" onClick={handleUploadClick}>
              {selectedImage ? (
                <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={selectedImage}
                    alt="Xem trước"
                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", borderRadius: "4px" }}
                  />
                </div>
              ) : (
                <>
                  <div className="ai-upload-icon-ph"></div>
                  <div className="ai-upload-text">Kéo thả ảnh vào đây hoặc bấm để chọn</div>
                  <div className="ai-upload-links">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleUploadClick(); }}>
                      Chọn ảnh từ máy tính / điện thoại
                    </a>
                  </div>
                  <div className="ai-upload-hint">
                    Hỗ trợ JPG, PNG, WEBP tối đa 5 MB. Chụp rõ quả, đủ sáng để AI phân tích chính xác nhất.
                  </div>
                </>
              )}
              <input
                type="file"
                className="hidden-input"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
            </div>

            <button
              type="button"
              className="ai-btn-classify"
              onClick={handleClassify}
              disabled={isAnalyzing || !imageFile}
            >
              {isAnalyzing ? "Đang phân tích qua mô hình AI..." : "Phân tích chất lượng ngay"}
            </button>
            <div className="ai-usage-text">
              Gói Premium: Hỗ trợ tối đa 20 lượt kiểm tra / ngày
            </div>
          </div>

          <div className="ai-card-wf">
            <h3 className="ai-card-title">14 loại nông sản AI hỗ trợ nhận diện</h3>
            <div className="ai-support-text">
              Táo, chuối, ớt chuông, cà rốt, dưa leo, nho, ổi, táo tàu, xoài, cam, lựu, khoai tây, dâu tây, cà chua.
              <br />
              <small style={{ color: "#888", display: "block", marginTop: "6px" }}>
                * Nếu ảnh không thuộc các loại trên hoặc độ tin cậy dưới ngưỡng kiểm định, AI sẽ gán nhãn &quot;Không chắc&quot;.
              </small>
            </div>
          </div>
        </div>

        {/* Cột phải: Kết quả & Lịch sử */}
        <div>
          {/* Card Kết quả */}
          <div className="ai-card-wf">
            <h3 className="ai-card-title">Kết quả phân tích</h3>
            {result ? (
              <div className="ai-result-content">
                <div
                  className="ai-result-image"
                  style={{
                    backgroundImage: `url(${resolveAssetUrl(result.imageUrl) || selectedImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
                <div className="ai-result-info">
                  <h4 className="ai-result-title">
                    {recognizedName} —{" "}
                    <span className={`ai-result-tag ${resultTag?.cls || ""}`}>
                      {resultTag?.text || result.label}
                    </span>
                  </h4>

                  <div className="ai-confidence-label">Độ tin cậy của mô hình</div>
                  <div className="ai-progress-bg">
                    <div
                      className="ai-progress-fill"
                      style={{
                        width: `${resultConfidencePct}%`,
                        backgroundColor: result.label === "ROTTEN" ? "#ef4444" : result.label === "FRESH" ? "#10b981" : "#f59e0b"
                      }}
                    />
                  </div>
                  <div className="ai-model-info">
                    <strong>{formatPercent(result.confidence) || `${resultConfidencePct}%`}</strong>
                    {result.modelVersion && ` · Mô hình: ${result.modelVersion}`}
                    {result.inferenceMs != null && ` · ${result.inferenceMs} ms`}
                  </div>

                  <div className="ai-suggestion" style={{ marginTop: "12px", fontSize: "13px", color: "#475569" }}>
                    {result.label === "FRESH" && "Nông sản đạt độ tươi tốt, thích hợp sử dụng và bảo quản thông thường."}
                    {result.label === "ROTTEN" && "Cảnh báo: Ảnh có dấu hiệu thâm hỏng, nấm mốc hoặc thối rữa."}
                    {result.label === "UNCERTAIN" && "Độ tin cậy chưa đạt ngưỡng tự động xác nhận hoặc góc chụp chưa rõ."}
                  </div>

                  <div className="ai-disclaimer" style={{ marginTop: "12px", fontSize: "11px", color: "#94a3b8" }}>
                    * Kết quả dự đoán tự động qua thị giác máy tính (MobileNetV2), mang tính chất tham khảo.
                  </div>
                </div>
              </div>
            ) : (
              <div className="ai-result-content" style={{ opacity: 0.6, padding: "20px 0" }}>
                <div style={{ textAlign: "center", width: "100%", color: "#94a3b8" }}>
                  Tải ảnh nông sản và bấm &quot;Phân tích chất lượng ngay&quot; để xem kết quả tại đây.
                </div>
              </div>
            )}
          </div>

          {/* Card Lịch sử */}
          <div className="ai-card-wf">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 className="ai-card-title" style={{ margin: 0 }}>
                Lịch sử kiểm tra gần đây
              </h3>
              <button
                type="button"
                onClick={loadHistory}
                disabled={loadingHistory}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#059669", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
              >
                <RefreshCw size={13} className={loadingHistory ? "spin" : ""} /> Làm mới
              </button>
            </div>

            <table className="ai-history-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Loại</th>
                  <th>Kết quả</th>
                  <th>Độ tin cậy</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "#888", padding: "24px 0" }}>
                      {loadingHistory ? "Đang tải lịch sử..." : "Chưa có lượt kiểm tra nào."}
                    </td>
                  </tr>
                ) : (
                  history.map((item) => {
                    const tag = CUSTOMER_AI_TAG[item.label] || { text: item.label, cls: "" };
                    const img = resolveAssetUrl(item.imageUrl);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div
                            className="ai-history-img"
                            style={{
                              backgroundImage: `url(${img})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center"
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{produceName(item.produce) || item.produce || "—"}</td>
                        <td>
                          <span className={`ai-result-tag ${tag.cls}`}>
                            {tag.text}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatPercent(item.confidence) || "—"}</td>
                        <td style={{ fontSize: "12px", color: "#64748b" }}>
                          {formatDateTime(item.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
