import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { aiApi } from "../../services/api";
import "./AIClassifierPage.css";

export default function AIClassifierPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setImageFile(file);
        setResult(null); // clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleClassify = async () => {
    if (!selectedImage && !imageFile) return;
    setIsAnalyzing(true);
    
    try {
      const apiResult = await aiApi.classify(imageFile || selectedImage);
      
      let label = "Tươi";
      let tagClass = "";
      if (apiResult.freshnessScore < 85) {
        label = "Hỏng";
        tagClass = "tag-warning";
      } else if (apiResult.freshnessScore < 92) {
        label = "Không chắc";
        tagClass = "tag-uncertain";
      }

      const newResult = {
        name: apiResult.produceName,
        label: label,
        tagClass: tagClass,
        confidence: apiResult.confidence,
        timeMs: 180, // simulated time
        suggestion: apiResult.estimatedShelfLife,
        image: selectedImage,
        timeStr: new Date().toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}),
        dateStr: new Date().toLocaleDateString("vi-VN")
      };

      setResult(newResult);
      setHistory(prev => [newResult, ...prev]);

    } catch (err) {
      console.error(err);
      alert("Lỗi khi kiểm định AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="ai-wireframe-page">
      <div className="ai-breadcrumb">
        <Link to="/" style={{color: '#666', textDecoration: 'none'}}>Trang chủ</Link> / <span className="ai-breadcrumb-current">Kiểm tra độ tươi bằng AI</span>
      </div>

      <div className="ai-grid">
        {/* Cột trái */}
        <div>
          <div className="ai-card-wf">
            <h3 className="ai-card-title">Tải ảnh nông sản</h3>
            
            <div className="ai-upload-area" onClick={handleUploadClick}>
              {selectedImage ? (
                <div style={{height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <img src={selectedImage} alt="Preview" style={{maxHeight: '100%', maxWidth: '100%'}} />
                </div>
              ) : (
                <>
                  <div className="ai-upload-icon-ph"></div>
                  <div className="ai-upload-text">Kéo thả ảnh vào đây</div>
                  <div className="ai-upload-links">hoặc <a href="#" onClick={(e) => {e.preventDefault(); handleUploadClick();}}>chọn từ máy</a> - <a href="#" onClick={(e) => {e.preventDefault(); handleUploadClick();}}>chụp bằng camera</a></div>
                  <div className="ai-upload-hint">JPG / PNG / WEBP, tối đa 5 MB. Chụp rõ, đủ sáng, 1 loại nông sản mỗi ảnh.</div>
                </>
              )}
              <input 
                type="file" 
                className="hidden-input" 
                ref={fileInputRef} 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <button 
              className="ai-btn-classify" 
              onClick={handleClassify}
              disabled={isAnalyzing || !selectedImage}
            >
              {isAnalyzing ? "Đang phân loại..." : "Phân loại"}
            </button>
            <div className="ai-usage-text">Hôm nay còn 18/20 lượt</div>
          </div>

          <div className="ai-card-wf">
            <h3 className="ai-card-title">Loại nông sản AI hỗ trợ</h3>
            <div className="ai-support-text">
              Cà chua, khoai tây, cà rốt, ớt chuông, dưa chuột, chuối, xoài, cam, ổi, táo, dâu tây. Loại khác sẽ trả "Không chắc".
            </div>
          </div>
        </div>

        {/* Cột phải */}
        <div>
          <div className="ai-card-wf">
            <h3 className="ai-card-title">Kết quả</h3>
            {result ? (
              <div className="ai-result-content">
                <div className="ai-result-image" style={{backgroundImage: `url(${result.image})`}}></div>
                <div className="ai-result-info">
                  <h4 className="ai-result-title">
                    {result.name} — <span className={`ai-result-tag ${result.tagClass}`}>{result.label}</span>
                  </h4>
                  <div className="ai-confidence-label">Độ tin cậy</div>
                  <div className="ai-progress-bg">
                    <div className="ai-progress-fill" style={{width: `${result.confidence}%`}}></div>
                  </div>
                  <div className="ai-model-info">
                    <strong>{result.confidence}%</strong> - mô hình mobilenetv2_v1 - {result.timeMs} ms
                  </div>
                  <div className="ai-suggestion">Gợi ý: {result.suggestion}</div>
                  <div className="ai-disclaimer">Kết quả chỉ mang tính tham khảo, dựa trên ảnh bạn cung cấp.</div>
                </div>
              </div>
            ) : (
              <div className="ai-result-content" style={{opacity: 0.5}}>
                <div className="ai-result-image">ảnh vừa tải</div>
                <div className="ai-result-info">
                  <div style={{height: '24px', background: '#eee', width: '200px', marginBottom: '16px'}}></div>
                  <div className="ai-progress-bg"></div>
                  <div style={{height: '12px', background: '#eee', width: '150px', marginBottom: '16px'}}></div>
                  <div style={{height: '12px', background: '#eee', width: '80%'}}></div>
                </div>
              </div>
            )}
          </div>

          <div className="ai-card-wf">
            <h3 className="ai-card-title">Lịch sử kiểm tra</h3>
            <table className="ai-history-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Loại</th>
                  <th>Kết quả</th>
                  <th>Tin cậy</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td><div className="ai-history-img" style={{backgroundImage: `url(${item.image})`}}></div></td>
                    <td>{item.name}</td>
                    <td><span className={`ai-result-tag ${item.tagClass}`}>{item.label}</span></td>
                    <td>{item.confidence}%</td>
                    <td>Hôm nay {item.timeStr}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', color: '#888'}}>Chưa có lịch sử kiểm tra.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
