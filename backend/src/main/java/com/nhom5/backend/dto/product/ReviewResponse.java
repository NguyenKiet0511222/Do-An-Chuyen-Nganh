package com.nhom5.backend.dto.product;

import com.nhom5.backend.entity.Review;
import com.nhom5.backend.entity.User;

import java.time.LocalDateTime;

/** 1 đánh giá công khai (GET /products/{id}/reviews) — chỉ lộ tên + ảnh đại diện người đánh giá. */
public record ReviewResponse(
        Long id,
        Integer rating,
        String comment,
        Reviewer user,
        LocalDateTime createdAt
) {

    public record Reviewer(Long id, String fullName, String avatarUrl) {
    }

    public static ReviewResponse from(Review r) {
        User u = r.getUser();
        return new ReviewResponse(r.getId(), r.getRating(), r.getComment(),
                new Reviewer(u.getId(), u.getFullName(), u.getAvatarUrl()), r.getCreatedAt());
    }
}
