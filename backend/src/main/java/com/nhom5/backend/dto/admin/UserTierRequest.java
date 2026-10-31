package com.nhom5.backend.dto.admin;

import com.nhom5.backend.entity.enums.AccountTier;
import jakarta.validation.constraints.NotNull;

/** PATCH /admin/users/{id}/tier (api.md mục 4.9) — gán thủ công cấp tài khoản để demo tính năng Premium. */
public record UserTierRequest(
        @NotNull(message = "Vui lòng chọn cấp tài khoản STANDARD hoặc PREMIUM")
        AccountTier tier
) {
}
