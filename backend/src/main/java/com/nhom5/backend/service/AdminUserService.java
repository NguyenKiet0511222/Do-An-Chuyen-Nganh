package com.nhom5.backend.service;

import com.nhom5.backend.dto.admin.AdminUserResponse;
import com.nhom5.backend.dto.admin.CreateAdminRequest;
import com.nhom5.backend.dto.admin.UserStatusRequest;
import com.nhom5.backend.dto.admin.UserTierRequest;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.entity.enums.AuthProvider;
import com.nhom5.backend.entity.enums.Role;
import com.nhom5.backend.entity.enums.UserStatus;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.repository.UserRepository;
import com.nhom5.backend.util.QueryParams;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Quản lý người dùng cho admin (mục 4.9): tra cứu, khoá / mở khoá, đổi cấp tài khoản, tạo admin. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final PasswordEncoder passwordEncoder;

    public PageResponse<AdminUserResponse> search(Role role, UserStatus status, String keyword, int page, int size) {
        var pageable = QueryParams.pageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<User> users = userRepository.search(role, status, QueryParams.normalize(keyword), pageable);

        List<Long> userIds = users.getContent().stream().map(User::getId).toList();
        Map<Long, Shop> shopByUserId = userIds.isEmpty() ? Map.of()
                : shopRepository.findByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(s -> s.getUser().getId(), Function.identity()));

        List<AdminUserResponse> content = users.getContent().stream()
                .map(u -> AdminUserResponse.from(u, shopByUserId.get(u.getId())))
                .toList();
        return PageResponse.from(new PageImpl<>(content, pageable, users.getTotalElements()));
    }

    public AdminUserResponse get(Long id) {
        return toResponse(requireUser(id));
    }

    /**
     * LOCK: ACTIVE -> LOCKED, UNLOCK: LOCKED -> ACTIVE; sai trạng thái hoặc tự khoá chính mình -> 409.
     * Tài khoản bị khoá bị chặn ngay ở mọi request kể cả khi token còn hạn (ActiveUserFilter).
     */
    @Transactional
    public AdminUserResponse changeStatus(Long adminId, Long userId, UserStatusRequest request) {
        User user = requireUser(userId);
        switch (request.action()) {
            case LOCK -> {
                if (user.getId().equals(adminId)) {
                    throw AppException.conflict("Không thể tự khoá tài khoản của chính mình");
                }
                if (!user.isActive()) {
                    throw AppException.conflict("Tài khoản #" + userId + " đã bị khoá");
                }
                user.setStatus(UserStatus.LOCKED);
            }
            case UNLOCK -> {
                if (user.isActive()) {
                    throw AppException.conflict("Tài khoản #" + userId + " đang hoạt động");
                }
                user.setStatus(UserStatus.ACTIVE);
            }
        }
        return toResponse(user);
    }

    /** Gán cấp tài khoản thủ công (mục 3.3 — chưa có luồng tự nâng cấp Premium). Có hiệu lực ngay, không cần đăng nhập lại. */
    @Transactional
    public AdminUserResponse changeTier(Long userId, UserTierRequest request) {
        User user = requireUser(userId);
        user.setAccountTier(request.tier());
        return toResponse(user);
    }

    /** Tạo thêm 1 tài khoản ADMIN đăng nhập bằng email/mật khẩu. Email đã có -> 409. */
    @Transactional
    public AdminUserResponse createAdmin(CreateAdminRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw AppException.conflict("Email đã được đăng ký");
        }
        User admin = userRepository.save(User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .provider(AuthProvider.LOCAL)
                .role(Role.ADMIN)
                .build());
        return AdminUserResponse.from(admin, null);
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng #" + id));
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.from(user, shopRepository.findByUserId(user.getId()).orElse(null));
    }
}
