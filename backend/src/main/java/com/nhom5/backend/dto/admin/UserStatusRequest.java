package com.nhom5.backend.dto.admin;

import jakarta.validation.constraints.NotNull;

/** PATCH /admin/users/{id}/status (api.md mục 4.9). LOCK: ACTIVE -> LOCKED; UNLOCK: LOCKED -> ACTIVE. */
public record UserStatusRequest(
        @NotNull(message = "Vui lòng chọn thao tác LOCK hoặc UNLOCK")
        Action action
) {

    public enum Action {
        LOCK,
        UNLOCK
    }
}
