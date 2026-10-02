package com.nongsan.exception;

/**
 * Ném ra khi không tìm thấy tài nguyên công khai (shop, category...) -> HTTP 404
 * theo bảng mã lỗi api.md mục 1.2.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
