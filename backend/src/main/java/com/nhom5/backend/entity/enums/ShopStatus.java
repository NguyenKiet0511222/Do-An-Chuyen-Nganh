package com.nhom5.backend.entity.enums;

/**
 * Luồng theo api.md mục 1.6 / 3.1: PENDING_VERIFICATION -> ACTIVE (admin VERIFY) <-> LOCKED (admin LOCK / UNLOCK).
 * SUSPENDED / REJECTED / INACTIVE có từ trước, hiện không dùng ở đâu — giữ lại để không lỗi dữ liệu cũ, chờ nhóm chốt bỏ.
 */
public enum ShopStatus {
    PENDING_VERIFICATION,
    ACTIVE,
    LOCKED,
    SUSPENDED,
    REJECTED,
    INACTIVE
}
