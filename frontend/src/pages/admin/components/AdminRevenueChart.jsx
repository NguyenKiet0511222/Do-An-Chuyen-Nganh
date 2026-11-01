import { useState, useEffect } from "react";
import { Box, MenuItem, Select, Typography, Paper, CircularProgress } from "@mui/material";
import { adminApi } from "../../../services/api";
import { formatVnd } from "../../../utils/format";

export default function AdminRevenueChart() {
  const [period, setPeriod] = useState("7");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    adminApi.dashboard
      .getRevenue(Number(period))
      .then((data) => {
        if (!ignore && Array.isArray(data)) {
          setChartData(data);
        }
      })
      .catch((err) => {
        console.warn("Lỗi tải biểu đồ doanh thu:", err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [period]);

  // Chart dimensions
  const width = 640;
  const height = 220;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const dataList = chartData.length > 0 ? chartData : [];
  const maxRevenue = Math.max(...dataList.map((d) => d.revenue || 0), 1000000);
  // Làm tròn trần lên mốc dễ đọc
  const maxVal = Math.ceil(maxRevenue / 1000000) * 1000000;

  const points = dataList.map((item, index) => {
    const x =
      dataList.length > 1
        ? padding.left + (index / (dataList.length - 1)) * chartW
        : padding.left + chartW / 2;
    const y = padding.top + chartH - ((item.revenue || 0) / maxVal) * chartH;
    return { ...item, x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  // Format short date (YYYY-MM-DD -> DD/MM)
  const formatShortDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Doanh thu {period === "7" ? "7 ngày gần nhất" : `${period} ngày gần đây`}
          </Typography>
        </Box>

        <Select
          size="small"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          sx={{ height: 32, fontSize: 13, minWidth: 95 }}
        >
          <MenuItem value="7">7 ngày</MenuItem>
          <MenuItem value="14">14 ngày</MenuItem>
          <MenuItem value="30">30 ngày</MenuItem>
        </Select>
      </Box>

      {/* SVG Line Chart */}
      <Box sx={{ position: "relative", width: "100%", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {loading ? (
          <CircularProgress size={30} />
        ) : points.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Chưa có số liệu doanh thu trong khoảng thời gian này.
          </Typography>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            {/* Y Axis Grid & Labels */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={width - padding.right}
              y2={padding.top}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text x={padding.left - 10} y={padding.top + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {(maxVal / 1000000).toFixed(0)}tr
            </text>

            <line
              x1={padding.left}
              y1={padding.top + chartH / 2}
              x2={width - padding.right}
              y2={padding.top + chartH / 2}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={padding.top + chartH / 2 + 4}
              textAnchor="end"
              fontSize="11"
              fill="#64748b"
            >
              {(maxVal / 2000000).toFixed(1)}tr
            </text>

            <line
              x1={padding.left}
              y1={padding.top + chartH}
              x2={width - padding.right}
              y2={padding.top + chartH}
              stroke="#cbd5e1"
            />
            <text
              x={padding.left - 10}
              y={padding.top + chartH + 4}
              textAnchor="end"
              fontSize="11"
              fill="#64748b"
            >
              0đ
            </text>

            {/* Line Path */}
            {points.length > 1 && (
              <path d={pathD} fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            )}

            {/* Data Points and X Labels */}
            {points.map((pt, i) => {
              const shouldShowLabel =
                points.length <= 10 || i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 7) === 0;

              return (
                <g key={i}>
                  {/* Point */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === i ? 6 : 4}
                    fill={hoveredPoint === i ? "#059669" : "#0f172a"}
                    stroke="#ffffff"
                    strokeWidth="2"
                    style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* X Axis Label */}
                  {shouldShowLabel && (
                    <text
                      x={pt.x}
                      y={height - 12}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                    >
                      {formatShortDate(pt.date)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPoint !== null && points[hoveredPoint] && (
          <Box
            sx={{
              position: "absolute",
              top: 10,
              right: 20,
              bgcolor: "rgba(15, 23, 42, 0.9)",
              color: "#fff",
              p: 1.2,
              borderRadius: 1.5,
              fontSize: 12,
              pointerEvents: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}
          >
            <Typography variant="caption" sx={{ display: "block", color: "#94a3b8" }}>
              {points[hoveredPoint].date}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              Doanh thu: {formatVnd(points[hoveredPoint].revenue)}
            </Typography>
            <Typography variant="caption" sx={{ color: "#a7f3d0" }}>
              Số đơn hoàn thành: {points[hoveredPoint].orders} đơn
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
