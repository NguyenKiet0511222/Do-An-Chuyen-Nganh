package com.nhom5.backend.controller;

import com.nhom5.backend.dto.cart.CartItemRequest;
import com.nhom5.backend.dto.cart.CartQuantityRequest;
import com.nhom5.backend.dto.cart.CartResponse;
import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Giỏ hàng của người đang đăng nhập (api.md mục 4.5). Mọi role đều dùng được, cần JWT. */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Giỏ hàng", description = "Giỏ hàng của người đang đăng nhập, nhóm theo shop")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Xem giỏ hàng (nhóm theo shop, kèm phí ship từng shop)")
    public ApiResponse<CartResponse> get(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.ok(cartService.get(userId(jwt)));
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Thêm sản phẩm vào giỏ (đã có thì cộng dồn; vượt tồn kho -> 409)")
    public ApiResponse<CartResponse> addItem(@AuthenticationPrincipal Jwt jwt,
                                             @Valid @RequestBody CartItemRequest request) {
        return ApiResponse.ok(cartService.addItem(userId(jwt), request));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Đổi số lượng 1 dòng (0 = xoá dòng)")
    public ApiResponse<CartResponse> updateQuantity(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                    @Valid @RequestBody CartQuantityRequest request) {
        return ApiResponse.ok(cartService.updateQuantity(userId(jwt), id, request.quantity()));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Xoá 1 dòng khỏi giỏ")
    public ApiResponse<CartResponse> removeItem(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok(cartService.removeItem(userId(jwt), id));
    }

    @DeleteMapping
    @Operation(summary = "Xoá toàn bộ giỏ")
    public ApiResponse<Void> clear(@AuthenticationPrincipal Jwt jwt) {
        cartService.clear(userId(jwt));
        return ApiResponse.ok("Đã xoá giỏ hàng", null);
    }

    private static Long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
