package com.nhom5.backend.dto.seller;

import jakarta.validation.constraints.NotNull;

/** PATCH /seller/products/{id}/visibility — { "hidden": true } ẩn, false bỏ ẩn. */
public record VisibilityRequest(
        @NotNull(message = "Thiếu trường hidden")
        Boolean hidden
) {
}
