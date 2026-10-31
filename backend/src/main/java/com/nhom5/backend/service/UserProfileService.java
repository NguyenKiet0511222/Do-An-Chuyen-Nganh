package com.nhom5.backend.service;

import com.nhom5.backend.dto.request.UpdateProfileRequest;
import com.nhom5.backend.dto.response.AvatarResponse;
import com.nhom5.backend.dto.response.UserResponse;
import com.nhom5.backend.entity.User;
import com.nhom5.backend.exception.AppException;
import com.nhom5.backend.repository.ShopRepository;
import com.nhom5.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Hồ sơ của người đang đăng nhập (api.md mục 4.2): xem / sửa họ tên, SĐT, đổi ảnh đại diện. */
@Service
@RequiredArgsConstructor
@Transactional
public class UserProfileService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public UserResponse get(Long userId) {
        return toResponse(requireUser(userId));
    }

    public UserResponse update(Long userId, UpdateProfileRequest request) {
        User user = requireUser(userId);
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        return toResponse(user);
    }

    /** Lưu ảnh mới rồi xoá file cũ (chỉ khi là file đã upload — ảnh Google giữ nguyên ngoài hệ thống). */
    public AvatarResponse updateAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("Vui lòng chọn 1 ảnh (field \"file\")");
        }
        User user = requireUser(userId);
        String oldAvatar = user.getAvatarUrl();
        user.setAvatarUrl(fileStorageService.storeImage(file, "avatars"));
        fileStorageService.deleteQuietly(oldAvatar);
        return new AvatarResponse(user.getAvatarUrl());
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("Tài khoản không còn tồn tại"));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.from(user, shopRepository.findByUserId(user.getId()).orElse(null));
    }
}
