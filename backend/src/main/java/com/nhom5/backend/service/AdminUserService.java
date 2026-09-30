package com.nhom5.backend.service;

import com.nhom5.backend.dto.admin.AdminUserResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.entity.Shop;
import com.nhom5.backend.entity.User;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Tra cứu người dùng cho admin (GET /admin/users) — thay cho /api/users cũ từng trả thẳng entity. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminUserService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

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
        User user = userRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Không tìm thấy người dùng #" + id));
        return AdminUserResponse.from(user, shopRepository.findByUserId(id).orElse(null));
    }
}
