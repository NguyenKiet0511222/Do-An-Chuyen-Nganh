import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  TextField,
  Typography
} from "@mui/material";
import { Cpu, Gauge, Hourglass, Images, PenLine, RefreshCw, Save, Wifi, WifiOff } from "lucide-react";
import { adminApi } from "../../../services/api";
import StatCardGrid from "../../../components/StatCardGrid";
import AiLabelChip from "../../../components/ai/AiLabelChip";
import AiReviewStatusChip from "../../../components/ai/AiReviewStatusChip";
import { REVIEW_STATUS_ORDER, apiErrorMessage, formatPercent } from "./aiReview";

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Kiểm tra 0 < review < autoAccept ≤ 1 (docs/1910.md mục 7.2). */
function validateThresholds(reviewText, autoText) {
  const review = reviewText === "" ? NaN : Number(reviewText);
  const auto = autoText === "" ? NaN : Number(autoText);
  const errors = {};
  if (!Number.isFinite(review)) errors.review = "Nhập số từ 0 đến 1";
  else if (review <= 0) errors.review = "Phải lớn hơn 0";
  if (!Number.isFinite(auto)) errors.auto = "Nhập số từ 0 đến 1";
  else if (auto <= 0) errors.auto = "Phải lớn hơn 0";
  else if (auto > 1) errors.auto = "Tối đa là 1";
  if (!errors.review && !errors.auto && review >= auto) errors.review = "Phải nhỏ hơn ngưỡng tự chấp nhận";
  return { review, auto, errors, valid: Object.keys(errors).length === 0 };
}

/** 1 đoạn màu trên thanh minh hoạ ngưỡng. */
function Zone({ width, text, sx }) {
  if (width <= 0) return null;
  return (
    <Box
      title={text}
      sx={{
        width: `${width * 100}%`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11.5,
        fontWeight: 700,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        px: 0.5,
        boxSizing: "border-box",
        ...sx
      }}
    >
      {text}
    </Box>
  );
}

const ZONE_SX = {
  uncertain: { bgcolor: "#fffbeb", color: "#b45309", border: "1.5px dashed #f59e0b" },
  freshReview: { bgcolor: "#ecfdf5", color: "#15803d", border: "1.5px solid #86efac" },
  autoAccept: { bgcolor: "#16a34a", color: "#ffffff", border: "1.5px solid #16a34a" },
  rottenReview: { bgcolor: "#fee2e2", color: "#b91c1c", border: "1.5px solid #fca5a5" }
};

/** Thanh 3 vùng: dưới review -> Không chắc; review..auto -> chờ admin; ≥ auto -> tự chấp nhận (chỉ ảnh TƯƠI). */
function ThresholdZones({ review, auto }) {
  const r = clamp01(Number.isFinite(review) ? review : 0);
  const a = Math.max(r, clamp01(Number.isFinite(auto) ? auto : 1));
  const rowSx = { display: "flex", height: 30, borderRadius: 1, overflow: "hidden", gap: "2px" };
  const markers = [
    { value: 0, text: "0" },
    { value: r, text: r.toFixed(2) },
    { value: a, text: a.toFixed(2) },
    { value: 1, text: "1" }
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "92px 1fr", columnGap: 1.5, rowGap: 1, alignItems: "center" }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>AI = tươi</Typography>
      <Box sx={rowSx}>
        <Zone width={r} text="Không chắc" sx={ZONE_SX.uncertain} />
        <Zone width={a - r} text="Chờ admin" sx={ZONE_SX.freshReview} />
        <Zone width={1 - a} text="Tự chấp nhận" sx={ZONE_SX.autoAccept} />
      </Box>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>AI = hỏng</Typography>
      <Box sx={rowSx}>
        <Zone width={r} text="Không chắc" sx={ZONE_SX.uncertain} />
        <Zone width={1 - r} text="Hỏng · luôn chờ admin" sx={ZONE_SX.rottenReview} />
      </Box>
      <Box />
      <Box sx={{ position: "relative", height: 16 }}>
        {markers.map((m, idx) => (
          <Typography
            key={idx}
            component="span"
            sx={{
              position: "absolute",
              left: `${m.value * 100}%`,
              transform: m.value === 0 ? "none" : m.value === 1 ? "translateX(-100%)" : "translateX(-50%)",
              fontSize: 11,
              color: "text.secondary",
              fontFamily: "monospace"
            }}
          >
            {m.text}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

/** 1 dòng trong bảng phân bổ: chip + thanh tỉ lệ + số lượng. */
function BreakdownRow({ chip, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "140px 1fr 64px", alignItems: "center", gap: 1.5 }}>
      <Box>{chip}</Box>
      <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: "#f1f5f9" }} />
      <Typography sx={{ fontSize: 13, fontWeight: 700, textAlign: "right" }}>{count.toLocaleString("vi-VN")}</Typography>
    </Box>
  );
}

/** Tab "Ngưỡng & thống kê" (docs/1910.md mục 4, 7.2, 7.3). */
export default function AiSettingsPanel() {
  const [settingsTick, setSettingsTick] = useState(0);
  const [settingsState, setSettingsState] = useState({ tick: -1, data: null, error: null });
  const [form, setForm] = useState({ review: "", auto: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const [range, setRange] = useState({ from: "", to: "" });
  const [statsTick, setStatsTick] = useState(0);
  const [statsState, setStatsState] = useState({ request: null, data: null, error: null });

  // --- Ngưỡng ---
  useEffect(() => {
    let ignore = false;
    adminApi.ai
      .getSettings()
      .then((data) => {
        if (ignore) return;
        setSettingsState({ tick: settingsTick, data, error: null });
        setForm({ review: String(data?.reviewThreshold ?? ""), auto: String(data?.autoAcceptThreshold ?? "") });
      })
      .catch((err) => {
        if (!ignore) setSettingsState({ tick: settingsTick, data: null, error: apiErrorMessage(err, "Không tải được cấu hình AI.") });
      });
    return () => {
      ignore = true;
    };
  }, [settingsTick]);

  const settingsLoading = settingsState.tick !== settingsTick;
  const settings = settingsState.data;
  const { review, auto, errors, valid } = validateThresholds(form.review, form.auto);
  const dirty = Boolean(settings) && (review !== Number(settings.reviewThreshold) || auto !== Number(settings.autoAcceptThreshold));

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });
  const closeToast = (_e, reason) => {
    if (reason === "clickaway") return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const data = await adminApi.ai.updateSettings({ autoAcceptThreshold: auto, reviewThreshold: review });
      setSettingsState((prev) => ({ ...prev, data, error: null }));
      setForm({ review: String(data?.reviewThreshold ?? review), auto: String(data?.autoAcceptThreshold ?? auto) });
      showToast("Đã lưu ngưỡng. Ngưỡng mới áp dụng cho ảnh tải lên từ bây giờ.");
    } catch (err) {
      showToast(apiErrorMessage(err, "Không lưu được ngưỡng, vui lòng thử lại."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    if (!settings) return;
    setForm({ review: String(settings.reviewThreshold ?? ""), auto: String(settings.autoAcceptThreshold ?? "") });
  };

  // --- Thống kê ---
  const rangeInvalid = Boolean(range.from && range.to && range.from > range.to);
  const statsRequest = useMemo(
    () => ({ params: { from: range.from || undefined, to: range.to || undefined }, tick: statsTick }),
    [range, statsTick]
  );

  useEffect(() => {
    if (rangeInvalid) return undefined;
    let ignore = false;
    adminApi.ai
      .getStatistics(statsRequest.params)
      .then((data) => {
        if (!ignore) setStatsState({ request: statsRequest, data, error: null });
      })
      .catch((err) => {
        if (!ignore) setStatsState({ request: statsRequest, data: null, error: apiErrorMessage(err, "Không tải được thống kê AI.") });
      });
    return () => {
      ignore = true;
    };
  }, [statsRequest, rangeInvalid]);

  const statsLoading = !rangeInvalid && statsState.request !== statsRequest;
  const stats = statsState.data;
  const byLabel = stats?.byLabel || {};
  const byReviewStatus = stats?.byReviewStatus || {};
  const labelTotal = ["FRESH", "ROTTEN", "UNCERTAIN"].reduce((sum, key) => sum + (Number(byLabel[key]) || 0), 0);
  const statusTotal = REVIEW_STATUS_ORDER.reduce((sum, key) => sum + (Number(byReviewStatus[key]) || 0), 0);

  const statCards = stats
    ? [
        { label: "Tổng ảnh đã phân loại", value: (Number(stats.totalClassified) || 0).toLocaleString("vi-VN"), icon: Images, color: "primary.main" },
        { label: "Đang chờ kiểm định (hiện tại)", value: (Number(stats.pendingReview) || 0).toLocaleString("vi-VN"), icon: Hourglass, color: "warning.main" },
        { label: "Admin đã sửa nhãn", value: (Number(stats.correctedByAdmin) || 0).toLocaleString("vi-VN"), icon: PenLine, color: "secondary.main" },
        { label: "Độ tin cậy trung bình", value: formatPercent(stats.avgConfidence) || "—", icon: Gauge, color: "info.main" }
      ]
    : [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Ngưỡng tin cậy */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mr: "auto" }}>Ngưỡng tin cậy</Typography>
          {settings && (
            <>
              <Chip size="small" variant="outlined" icon={<Cpu size={14} />} label={`Model ${settings.modelVersion || "—"}`} />
              <Chip
                size="small"
                color={settings.aiOnline ? "success" : "error"}
                icon={settings.aiOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                label={settings.aiOnline ? "AI đang hoạt động" : "AI không phản hồi"}
                sx={{ fontWeight: 700 }}
              />
            </>
          )}
        </Box>

        {settingsLoading && !settings ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : settingsState.error && !settings ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => setSettingsTick((t) => t + 1)}>
                Thử lại
              </Button>
            }
          >
            {settingsState.error}
          </Alert>
        ) : (
          <>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mb: 2.5 }}>
              <TextField
                type="number"
                size="small"
                label="Ngưỡng chờ admin (review)"
                value={form.review}
                onChange={(e) => setForm((prev) => ({ ...prev, review: e.target.value }))}
                error={Boolean(errors.review)}
                helperText={errors.review || "Độ tin cậy dưới mức này → KHÔNG CHẮC"}
                disabled={saving}
                slotProps={{ htmlInput: { step: 0.01, min: 0, max: 1 } }}
              />
              <TextField
                type="number"
                size="small"
                label="Ngưỡng tự chấp nhận (auto-accept)"
                value={form.auto}
                onChange={(e) => setForm((prev) => ({ ...prev, auto: e.target.value }))}
                error={Boolean(errors.auto)}
                helperText={errors.auto || "Ảnh TƯƠI từ mức này trở lên được tự chấp nhận"}
                disabled={saving}
                slotProps={{ htmlInput: { step: 0.01, min: 0, max: 1 } }}
              />
            </Box>

            <ThresholdZones review={review} auto={auto} />

            <Alert severity="info" sx={{ mt: 2.5, fontSize: 12.5 }}>
              Ngưỡng mới chỉ áp dụng cho ảnh tải lên <strong>sau khi lưu</strong> — nhãn của ảnh cũ giữ nguyên. Ảnh AI nhận là HỎNG
              luôn vào hàng chờ, kể cả khi độ tin cậy cao.
            </Alert>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
              <Button onClick={handleResetForm} disabled={!dirty || saving} sx={{ color: "#475569" }}>
                Hoàn tác
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!valid || !dirty || saving}
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={16} />}
                sx={{ color: "#fff" }}
              >
                Lưu ngưỡng
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Thống kê */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mr: "auto", pt: 1 }}>Thống kê kiểm định AI</Typography>
          <TextField
            type="date"
            size="small"
            label="Từ ngày"
            value={range.from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
            error={rangeInvalid}
            helperText={rangeInvalid ? "Từ ngày phải trước Đến ngày" : undefined}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: range.to || undefined } }}
            sx={{ width: 170 }}
          />
          <TextField
            type="date"
            size="small"
            label="Đến ngày"
            value={range.to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
            error={rangeInvalid}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: range.from || undefined } }}
            sx={{ width: 170 }}
          />
          <IconButton onClick={() => setStatsTick((t) => t + 1)} disabled={statsLoading} aria-label="Tải lại thống kê" sx={{ mt: 0.25 }}>
            <RefreshCw size={16} />
          </IconButton>
        </Box>

        <Box sx={{ height: 4, mb: 1 }}>{statsLoading && stats && <LinearProgress />}</Box>

        {statsLoading && !stats ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : statsState.error && !statsLoading ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => setStatsTick((t) => t + 1)}>
                Thử lại
              </Button>
            }
          >
            {statsState.error}
          </Alert>
        ) : stats ? (
          <Box sx={{ opacity: statsLoading ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <StatCardGrid stats={statCards} />

            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mt: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, mb: 1.5 }}>Theo nhãn hiển thị</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {["FRESH", "ROTTEN", "UNCERTAIN"].map((key) => (
                    <BreakdownRow key={key} chip={<AiLabelChip label={key} size="small" />} count={Number(byLabel[key]) || 0} total={labelTotal} />
                  ))}
                </Box>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 1.5 }}>
                  Nhãn hiển thị = nhãn admin chốt nếu có, không thì nhãn AI.
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, mb: 1.5 }}>Theo trạng thái kiểm định</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {REVIEW_STATUS_ORDER.map((key) => (
                    <BreakdownRow key={key} chip={<AiReviewStatusChip status={key} />} count={Number(byReviewStatus[key]) || 0} total={statusTotal} />
                  ))}
                </Box>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 1.5 }}>
                  AI không phản hồi: <strong>{(Number(stats.aiUnavailable) || 0).toLocaleString("vi-VN")}</strong> ảnh (không tính vào độ
                  tin cậy trung bình).
                </Typography>
              </Paper>
            </Box>
          </Box>
        ) : null}
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity} variant="filled" onClose={closeToast} sx={{ fontSize: 13 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
