import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  FormControlLabel,
  Link,
  Pagination,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { Camera } from "lucide-react";
import { resolveAssetUrl, sellerApi } from "../../../services/api";
import AiLabelChip from "../../../components/ai/AiLabelChip";
import AiReviewStatusChip from "../../../components/ai/AiReviewStatusChip";
import { displayLabelOf, formatProduce } from "../../../utils/aiLabel";
import { apiErrorMessage } from "../../../utils/format";

const PAGE_SIZE = 10;
const RETAKE = "RETAKE_REQUESTED";

const headCellSx = {
  fontWeight: 700,
  color: "#64748b",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  borderBottom: "1px solid #f1f5f9"
};
const bodyCellSx = { borderBottom: "1px solid #f1f5f9" };

/**
 * Tab "Kết quả AI của shop" (GET /seller/ai/results, mới nhất trước): nhãn AI + trạng thái kiểm định từng ảnh.
 * Ảnh admin yêu cầu chụp lại (RETAKE_REQUESTED) được tô nổi kèm ghi chú của admin — người bán phải xoá đúng ảnh đó
 * và tải ảnh mới thì sản phẩm mới gửi duyệt lại được (docs/1910.md mục 3).
 * initialReviewStatus = "RETAKE_REQUESTED" (từ ?reviewStatus= trên URL, link ở trang tổng quan) -> bật sẵn "Chỉ ảnh cần chụp lại".
 */
export default function SellerAiResultsPanel({ initialReviewStatus } = {}) {
  const [retakeOnly, setRetakeOnly] = useState(initialReviewStatus === RETAKE);
  const [page, setPage] = useState(0);
  const [loaded, setLoaded] = useState({ request: null, data: null, retakeCount: 0, error: null });

  // Mỗi lần lọc / đổi trang tạo 1 request mới; loading = request đang hiển thị chưa phải request mới nhất
  const request = useMemo(
    () => ({ page, size: PAGE_SIZE, reviewStatus: retakeOnly ? RETAKE : undefined }),
    [page, retakeOnly]
  );

  useEffect(() => {
    let ignore = false;
    Promise.all([
      sellerApi.dashboard.getAiResults(request),
      // Đếm riêng số ảnh cần chụp lại để luôn hiện cảnh báo, kể cả khi đang xem tất cả
      sellerApi.dashboard.getAiResults({ reviewStatus: RETAKE, size: 1 })
    ])
      .then(([data, retake]) => {
        if (!ignore) setLoaded({ request, data, retakeCount: retake?.totalElements ?? 0, error: null });
      })
      .catch((err) => {
        if (!ignore) {
          setLoaded({
            request,
            data: null,
            retakeCount: 0,
            error: apiErrorMessage(err, "Không tải được kết quả AI của shop.")
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, [request]);

  const loading = loaded.request !== request;
  const results = loaded.data?.content ?? [];
  const totalElements = loaded.data?.totalElements ?? 0;
  const totalPages = loaded.data?.totalPages ?? 0;

  const handleRetakeOnlyChange = (event) => {
    setRetakeOnly(event.target.checked);
    setPage(0);
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
      <Box sx={{ p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Kết quả AI của shop</Typography>
        <FormControlLabel
          control={<Switch size="small" checked={retakeOnly} onChange={handleRetakeOnlyChange} />}
          label="Chỉ ảnh cần chụp lại"
          sx={{ mr: 0, "& .MuiFormControlLabel-label": { fontSize: 13, color: "#475569" } }}
        />
      </Box>

      {loaded.retakeCount > 0 && (
        <Alert severity="warning" icon={<Camera size={18} />} sx={{ mx: 3, mt: 3, borderRadius: 2, fontSize: 13 }}>
          Có <b>{loaded.retakeCount}</b> ảnh admin yêu cầu chụp lại. Xoá đúng ảnh đó và tải ảnh mới — còn ảnh này thì sản
          phẩm không gửi duyệt lại được.
        </Alert>
      )}
      {loaded.error && (
        <Alert severity="error" sx={{ mx: 3, mt: 3, borderRadius: 2, fontSize: 13 }}>
          {loaded.error}
        </Alert>
      )}

      <TableContainer sx={{ opacity: loading && loaded.data ? 0.6 : 1 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(248, 250, 252, 0.75)" }}>
              <TableCell sx={{ ...headCellSx, py: 2, pl: 4 }}>Ảnh</TableCell>
              <TableCell sx={headCellSx}>Sản phẩm</TableCell>
              <TableCell sx={headCellSx}>Nhãn AI</TableCell>
              <TableCell sx={headCellSx}>Admin</TableCell>
              <TableCell sx={{ ...headCellSx, pr: 4 }} align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ ...bodyCellSx, py: 5, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  {loading
                    ? "Đang tải kết quả AI..."
                    : retakeOnly
                      ? "Không có ảnh nào cần chụp lại."
                      : "Chưa có ảnh sản phẩm nào được AI gắn nhãn."}
                </TableCell>
              </TableRow>
            )}
            {results.map((row) => {
              const needRetake = row.reviewStatus === RETAKE;
              const corrected = row.finalLabel && row.finalLabel !== row.label;
              return (
                <TableRow
                  key={row.id}
                  sx={{ bgcolor: needRetake ? "#fff7ed" : undefined, "&:hover": { bgcolor: needRetake ? "#ffedd5" : "rgba(248, 250, 252, 0.8)" } }}
                >
                  <TableCell sx={{ ...bodyCellSx, py: 2, pl: 4 }}>
                    <Avatar
                      src={resolveAssetUrl(row.imageUrl)}
                      variant="rounded"
                      sx={{ width: 64, height: 64, border: needRetake ? "2px solid #fb923c" : "1px solid #e2e8f0", borderRadius: 2 }}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Typography sx={{ color: "#1e293b", fontSize: 13, fontWeight: 600 }}>{row.product?.name}</Typography>
                    {row.produce && (
                      <Typography sx={{ color: "#64748b", fontSize: 12, mt: 0.25 }}>AI nhận ra: {formatProduce(row.produce)}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <AiLabelChip label={displayLabelOf(row)} confidence={corrected ? null : row.confidence} size="small" />
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <AiReviewStatusChip status={row.reviewStatus} />
                    {row.note && (
                      <Typography sx={{ fontSize: 12, mt: 0.5, maxWidth: 360, lineHeight: 1.5, color: needRetake ? "#c2410c" : "#64748b", fontWeight: needRetake ? 600 : 400 }}>
                        {row.note}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ ...bodyCellSx, pr: 4 }} align="right">
                    {needRetake && row.product?.id ? (
                      // ?image= để form sửa sản phẩm cuộn tới và làm nổi đúng ảnh cần thay
                      <Link
                        component={RouterLink}
                        to={`/seller/products/${row.product.id}/edit${row.imageId ? `?image=${row.imageId}` : ""}`}
                        underline="hover"
                        sx={{ fontSize: 13, fontWeight: 600, color: "#059669", whiteSpace: "nowrap" }}
                      >
                        Thay ảnh
                      </Link>
                    ) : (
                      <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ p: 3, borderTop: "1px solid #f1f5f9", bgcolor: "rgba(248, 250, 252, 0.5)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
          {retakeOnly ? "Cần chụp lại" : "Tổng"}:{" "}
          <Box component="span" sx={{ color: "#0f172a", fontWeight: 600 }}>{totalElements} ảnh</Box>
          {!retakeOnly && ` · Cần chụp lại ${loaded.retakeCount}`}
        </Typography>
        {totalPages > 1 && (
          <Pagination
            size="small"
            count={totalPages}
            page={page + 1}
            onChange={(_event, value) => setPage(value - 1)}
          />
        )}
      </Box>
    </Paper>
  );
}
