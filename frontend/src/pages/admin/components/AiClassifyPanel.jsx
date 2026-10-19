import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Typography } from "@mui/material";
import { Cpu, ImageUp, ScanSearch, Timer } from "lucide-react";
import { adminApi } from "../../../services/api";
import AiLabelChip from "./AiLabelChip";
import { apiErrorMessage, formatClassLabel, formatPercent, formatProduce } from "./aiReview";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // giống giới hạn upload của backend (api.md mục 6)

/** Tab "Thử mô hình": admin tải 1 ảnh lên để xem AI đoán gì — không lưu lịch sử (docs/1910.md mục 6, 7.2). */
export default function AiClassifyPanel() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const busyRef = useRef(false);

  // Giải phóng URL xem trước cũ khi đổi ảnh / rời trang
  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const pickFile = (picked) => {
    if (!picked) return;
    if (!ACCEPTED_TYPES.includes(picked.type)) {
      setError("Chỉ nhận ảnh JPG, PNG hoặc WEBP.");
      return;
    }
    if (picked.size > MAX_SIZE_BYTES) {
      setError("Ảnh vượt quá 5 MB.");
      return;
    }
    setError("");
    setResult(null);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  };

  const handleInputChange = (event) => {
    pickFile(event.target.files?.[0]);
    // Cho phép chọn lại đúng file vừa chọn
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    if (!classifying) pickFile(event.dataTransfer.files?.[0]);
  };

  const handleClassify = async () => {
    if (!file || busyRef.current) return;
    busyRef.current = true;
    setClassifying(true);
    setError("");
    setResult(null);
    try {
      setResult(await adminApi.ai.classify(file));
    } catch (err) {
      setError(
        err?.response?.status === 503
          ? "AI service đang tắt hoặc chưa nạp được model. Hãy bật AI service rồi thử lại."
          : apiErrorMessage(err, "Không phân loại được ảnh, vui lòng thử lại.")
      );
    } finally {
      busyRef.current = false;
      setClassifying(false);
    }
  };

  const conditionLabel = result?.condition === "rotten" ? "ROTTEN" : result?.condition === "fresh" ? "FRESH" : null;
  const top = Array.isArray(result?.top) ? result.top.slice(0, 3) : [];

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" } }}>
      {/* Chọn ảnh + xem trước */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.5 }}>Ảnh cần thử</Typography>
        <Typography sx={{ fontSize: 12.5, color: "text.secondary", mb: 2 }}>
          JPG, PNG hoặc WEBP, tối đa 5 MB. Ảnh thử không được lưu lại.
        </Typography>

        <Box
          role="button"
          tabIndex={0}
          aria-label="Chọn ảnh"
          onClick={() => !classifying && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !classifying) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          sx={{
            height: 300,
            borderRadius: 2,
            border: `2px dashed ${dragOver ? "#10b981" : "#cbd5e1"}`,
            bgcolor: previewUrl ? "#0f172a" : dragOver ? "#ecfdf5" : "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            cursor: classifying ? "default" : "pointer",
            transition: "all 0.15s"
          }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Ảnh xem trước" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : (
            <Box sx={{ textAlign: "center", color: "#64748b", px: 2 }}>
              <ImageUp size={36} />
              <Typography sx={{ mt: 1, fontSize: 13.5, fontWeight: 600 }}>Bấm để chọn ảnh hoặc kéo thả vào đây</Typography>
            </Box>
          )}
        </Box>
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} hidden onChange={handleInputChange} />

        <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="outlined" onClick={() => inputRef.current?.click()} disabled={classifying} startIcon={<ImageUp size={16} />}>
            {file ? "Chọn ảnh khác" : "Chọn ảnh"}
          </Button>
          <Button
            variant="contained"
            onClick={handleClassify}
            disabled={!file || classifying}
            startIcon={classifying ? <CircularProgress size={14} color="inherit" /> : <ScanSearch size={16} />}
            sx={{ color: "#fff" }}
          >
            {classifying ? "Đang phân loại..." : "Phân loại"}
          </Button>
          {file && (
            <Typography sx={{ fontSize: 12, color: "text.secondary", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "1 1 120px" }}>
              {file.name}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Kết quả */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Kết quả của mô hình</Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {classifying && (
          <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
            <CircularProgress size={28} />
            <Typography sx={{ fontSize: 13 }}>AI đang phân tích ảnh...</Typography>
          </Box>
        )}

        {!classifying && !result && !error && (
          <Typography sx={{ fontSize: 13, color: "text.secondary", py: 6, textAlign: "center" }}>
            Chọn ảnh rồi bấm <strong>Phân loại</strong> để xem nhãn AI.
          </Typography>
        )}

        {result && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Box sx={{ transform: "scale(1.15)", transformOrigin: "left center" }}>
                <AiLabelChip label={conditionLabel} confidence={result.confidence} />
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, ml: 1 }}>{formatProduce(result.produce) || "Không rõ loại"}</Typography>
            </Box>

            <Box sx={{ fontSize: 13, color: "#334155", display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 0.5 }}>
              <Box component="span" sx={{ color: "text.secondary" }}>Lớp của model</Box>
              <Box component="span" sx={{ fontFamily: "monospace" }}>{result.label || "—"}</Box>
              <Box component="span" sx={{ color: "text.secondary" }}>Tình trạng</Box>
              <Box component="span">{result.condition === "fresh" ? "Tươi" : result.condition === "rotten" ? "Hỏng" : result.condition || "—"}</Box>
              <Box component="span" sx={{ color: "text.secondary" }}>Độ tin cậy</Box>
              <Box component="span" sx={{ fontWeight: 700 }}>{formatPercent(result.confidence) || "0%"}</Box>
            </Box>

            {top.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>Top {top.length} lớp có điểm cao nhất</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {top.map((item, idx) => {
                    const score = Math.max(0, Math.min(1, Number(item.score) || 0));
                    return (
                      <Box key={item.label || idx}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, mb: 0.4 }}>
                          <span>
                            {idx + 1}. {formatClassLabel(item.label)}{" "}
                            <Box component="span" sx={{ color: "text.disabled", fontFamily: "monospace", fontSize: 11.5 }}>
                              {item.label}
                            </Box>
                          </span>
                          <strong>{(score * 100).toFixed(1)}%</strong>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={score * 100}
                          color={item.label?.endsWith("_rotten") ? "error" : "primary"}
                          sx={{ height: 6, borderRadius: 3, bgcolor: "#f1f5f9" }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip size="small" icon={<Cpu size={14} />} label={`Model ${result.modelVersion || "—"}`} variant="outlined" />
              {result.inferenceMs != null && (
                <Chip size="small" icon={<Timer size={14} />} label={`${result.inferenceMs} ms`} variant="outlined" />
              )}
            </Box>

            <Alert severity="info" sx={{ fontSize: 12.5 }}>
              Đây là kết quả thô của model. Khi người bán tải ảnh, hệ thống còn áp ngưỡng tin cậy và kiểm tra loại nông sản có thuộc
              danh mục sản phẩm hay không.
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
