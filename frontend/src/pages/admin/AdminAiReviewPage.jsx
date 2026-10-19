import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Breadcrumbs, Link, Tab, Tabs, Typography } from "@mui/material";
import { adminApi } from "../../services/api";
import AiReviewQueue from "./components/AiReviewQueue";
import AiClassifyPanel from "./components/AiClassifyPanel";
import AiSettingsPanel from "./components/AiSettingsPanel";
import { AI_PENDING_CHANGED_EVENT } from "./components/aiReview";

/**
 * Màn Kiểm định AI (/admin/ai-review) — docs/1910.md mục 7.3:
 * Hàng chờ | Thử mô hình | Ngưỡng & thống kê.
 */
export default function AdminAiReviewPage() {
  const [tab, setTab] = useState(0);
  const [pendingCount, setPendingCount] = useState(null);
  const [pendingTick, setPendingTick] = useState(0);

  // Số ảnh đang chờ cho nhãn tab "Hàng chờ (n)" — tải lại mỗi khi có ảnh được kiểm định
  useEffect(() => {
    let ignore = false;
    adminApi.ai
      .getStatistics()
      .then((stats) => {
        if (!ignore) setPendingCount(Number(stats?.pendingReview) || 0);
      })
      .catch(() => {
        if (!ignore) setPendingCount(null);
      });
    return () => {
      ignore = true;
    };
  }, [pendingTick]);

  useEffect(() => {
    const handleChanged = () => setPendingTick((t) => t + 1);
    window.addEventListener(AI_PENDING_CHANGED_EVENT, handleChanged);
    return () => window.removeEventListener(AI_PENDING_CHANGED_EVENT, handleChanged);
  }, []);

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <Breadcrumbs separator="/" sx={{ mb: 1, fontSize: 13 }}>
        <Link component={RouterLink} to="/admin" color="inherit" underline="hover">
          Quản trị
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 13, fontWeight: 600 }}>
          Kiểm định AI
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
        Kiểm định AI
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.5, mb: 2 }}>
        Xác nhận hoặc sửa nhãn tươi/hỏng mà AI gắn cho ảnh sản phẩm, thử mô hình và chỉnh ngưỡng tin cậy.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_e, value) => setTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ "& .MuiTab-root": { textTransform: "none", fontSize: 14, fontWeight: 600, minWidth: 100 } }}
        >
          <Tab label={pendingCount != null ? `Hàng chờ (${pendingCount})` : "Hàng chờ"} />
          <Tab label="Thử mô hình" />
          <Tab label="Ngưỡng & thống kê" />
        </Tabs>
      </Box>

      {/* Giữ hàng chờ + ảnh thử khi đổi tab; tab ngưỡng & thống kê tải lại mỗi lần mở */}
      <Box hidden={tab !== 0}>
        <AiReviewQueue />
      </Box>
      <Box hidden={tab !== 1}>
        <AiClassifyPanel />
      </Box>
      {tab === 2 && <AiSettingsPanel />}
    </Box>
  );
}
