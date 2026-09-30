package com.nhom5.backend.controller;

import com.nhom5.backend.dto.response.ApiResponse;
import com.nhom5.backend.dto.response.PageResponse;
import com.nhom5.backend.dto.seller.ProductImagesResponse;
import com.nhom5.backend.dto.seller.SellerProductDetailResponse;
import com.nhom5.backend.dto.seller.SellerProductRequest;
import com.nhom5.backend.dto.seller.SellerProductResponse;
import com.nhom5.backend.dto.seller.StockUpdateRequest;
import com.nhom5.backend.dto.seller.VisibilityRequest;
import com.nhom5.backend.service.SellerProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

/** Sản phẩm của shop (api.md mục 4.8) — luôn giới hạn trong shop của người đang đăng nhập. */
@RestController
@RequestMapping("/api/seller/products")
@RequiredArgsConstructor
@Tag(name = "Seller - Sản phẩm", description = "Tạo / sửa / xoá sản phẩm, ảnh, gửi duyệt, ẩn-hiện, tồn kho")
public class SellerProductController {

    private final SellerProductService sellerProductService;

    @GetMapping
    @Operation(summary = "Danh sách sản phẩm của shop")
    public ApiResponse<PageResponse<SellerProductResponse>> list(
            @AuthenticationPrincipal Jwt jwt,
            @Parameter(description = "Một hoặc nhiều trạng thái cách nhau dấu phẩy, ví dụ REJECTED,NEED_INFO. Bỏ trống = tất cả")
            @RequestParam(required = false) String status,
            @Parameter(description = "Tìm theo tên sản phẩm")
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(sellerProductService.list(currentUserId(jwt), status, keyword, page, size));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Tạo sản phẩm (trạng thái DRAFT)")
    public ApiResponse<SellerProductDetailResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                           @Valid @RequestBody SellerProductRequest request) {
        return ApiResponse.ok("Đã tạo sản phẩm nháp", sellerProductService.create(currentUserId(jwt), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm (kèm ảnh + nhãn AI từng ảnh, lý do từ chối)")
    public ApiResponse<SellerProductDetailResponse> detail(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok(sellerProductService.get(currentUserId(jwt), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Sửa sản phẩm",
            description = "Đang PENDING -> 409 (chỉ sửa tồn kho). Đang APPROVED/HIDDEN mà đổi nội dung -> tự về PENDING")
    public ApiResponse<SellerProductDetailResponse> update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                           @Valid @RequestBody SellerProductRequest request) {
        return ApiResponse.ok(sellerProductService.update(currentUserId(jwt), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá sản phẩm (chỉ khi chưa có đơn hàng, ngược lại 409 -> dùng ẩn)")
    public ApiResponse<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        sellerProductService.delete(currentUserId(jwt), id);
        return ApiResponse.ok("Đã xoá sản phẩm", null);
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload ảnh (field \"files\" hoặc \"file\", tối đa 5 ảnh/sản phẩm, JPG/PNG/WEBP ≤ 5 MB)",
            description = "Trả toàn bộ ảnh hiện tại + nhãn AI. Hiện chưa gọi AI: ảnh mới ở trạng thái chờ admin kiểm định")
    public ApiResponse<ProductImagesResponse> uploadImages(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        List<MultipartFile> all = new ArrayList<>();
        if (files != null) all.addAll(files);
        if (file != null) all.add(file);
        return ApiResponse.ok(sellerProductService.uploadImages(currentUserId(jwt), id, all));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @Operation(summary = "Xoá ảnh")
    public ApiResponse<ProductImagesResponse> deleteImage(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                          @PathVariable Long imageId) {
        return ApiResponse.ok(sellerProductService.deleteImage(currentUserId(jwt), id, imageId));
    }

    @PatchMapping("/{id}/images/{imageId}/primary")
    @Operation(summary = "Đặt ảnh chính")
    public ApiResponse<ProductImagesResponse> setPrimary(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                         @PathVariable Long imageId) {
        return ApiResponse.ok(sellerProductService.setPrimaryImage(currentUserId(jwt), id, imageId));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Gửi duyệt: DRAFT / REJECTED / NEED_INFO -> PENDING",
            description = "Điều kiện: ≥ 1 ảnh, giá > 0, tồn kho ≥ 0, có danh mục")
    public ApiResponse<SellerProductDetailResponse> submit(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return ApiResponse.ok("Đã gửi duyệt sản phẩm", sellerProductService.submit(currentUserId(jwt), id));
    }

    @PatchMapping("/{id}/visibility")
    @Operation(summary = "Ẩn / bỏ ẩn sản phẩm { \"hidden\": true|false }",
            description = "Chỉ ẩn được sản phẩm APPROVED; không bỏ ẩn được nếu admin đã ẩn")
    public ApiResponse<SellerProductResponse> visibility(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                         @Valid @RequestBody VisibilityRequest request) {
        return ApiResponse.ok(sellerProductService.changeVisibility(currentUserId(jwt), id, request.hidden()));
    }

    @PatchMapping("/{id}/stock")
    @Operation(summary = "Cập nhật tồn kho (mọi trạng thái, không cần duyệt lại)")
    public ApiResponse<SellerProductResponse> stock(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                                    @Valid @RequestBody StockUpdateRequest request) {
        return ApiResponse.ok(sellerProductService.updateStock(currentUserId(jwt), id, request.stockQuantity()));
    }

    private static Long currentUserId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
