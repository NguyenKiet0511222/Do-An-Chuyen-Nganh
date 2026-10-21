import { Sparkles } from "lucide-react";
import { CUSTOMER_AI_TAG, formatPercent } from "../utils/aiLabel";

/**
 * Badge nhãn AI cho khu khách hàng (CSS thuần, class .ai-quality-badge trong index.css) — api.md mục 8:
 * Tươi viền xanh · Hỏng nền đỏ chữ trắng · Không chắc nét đứt vàng.
 * - label: "FRESH" | "ROTTEN" | "UNCERTAIN"; không có nhãn -> không hiện gì.
 * - confidence 0..1; null/0 (AI lỗi) -> không hiện %, không bao giờ tự bịa số.
 * - className: class định vị của từng nơi dùng (vd "card-ai-badge" nằm góc ảnh).
 */
export default function AiQualityBadge({ label, confidence, className = "" }) {
  const meta = CUSTOMER_AI_TAG[label];
  if (!meta) return null;
  const percent = formatPercent(confidence);

  return (
    <span
      className={`ai-quality-badge ${meta.cls} ${className}`.trim()}
      title={`Nhãn chất lượng do AI đánh giá từ ảnh sản phẩm: ${meta.text}${percent ? ` (độ tin cậy ${percent})` : ""}`}
    >
      <Sparkles size={11} aria-hidden="true" />
      <span>
        {meta.text}
        {percent && ` ${percent}`}
      </span>
    </span>
  );
}
