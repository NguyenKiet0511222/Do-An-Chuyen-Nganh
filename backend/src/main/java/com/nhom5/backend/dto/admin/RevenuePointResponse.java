package com.nhom5.backend.dto.admin;

import java.time.LocalDate;

/** 1 điểm của GET /admin/dashboard/revenue: doanh thu + số đơn DELIVERED theo ngày delivered_at (api.md mục 4.9). */
public record RevenuePointResponse(LocalDate date, long revenue, long orders) {
}
