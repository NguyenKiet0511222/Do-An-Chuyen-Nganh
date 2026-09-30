package com.nhom5.backend.entity;

import org.hibernate.annotations.Nationalized;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.nhom5.backend.entity.enums.AccountTier;
import com.nhom5.backend.entity.enums.AuthProvider;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.UserStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Bảng users — hỗ trợ đồng thời đăng nhập thường (LOCAL) và Google (GOOGLE).
 */
@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Nationalized
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    /** Email đăng nhập, lưu chữ thường, không trùng. */
    @Nationalized
    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    /** BCrypt hash; NULL nếu tài khoản chỉ đăng nhập bằng Google. Không bao giờ serialize ra JSON. */
    @JsonIgnore
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    /** Google "sub" id, chỉ có khi từng đăng nhập Google. */
    @Column(name = "provider_id", length = 255)
    private String providerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.CUSTOMER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_tier", nullable = false, length = 20)
    @Builder.Default
    private AccountTier accountTier = AccountTier.STANDARD;

    @Nationalized
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /** false = bị khoá, không cho đăng nhập. */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    public boolean isActive() {
        return active && (status == null || status == UserStatus.ACTIVE);
    }

    public void setActive(boolean active) {
        this.active = active;
        this.status = active ? UserStatus.ACTIVE : UserStatus.LOCKED;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
        this.active = (status == UserStatus.ACTIVE);
    }
}
