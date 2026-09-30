package com.nhom5.backend.service;

import com.nhom5.backend.config.AppProperties;
import com.nhom5.backend.exception.AppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;

/**
 * Lưu ảnh upload xuống đĩa (api.md mục 6): {app.upload.dir}/{folder}/{uuid}.{ext}, trả URL tương đối "/uploads/...".
 * Chỉ nhận JPG/PNG/WEBP ≤ 5 MB — kiểm tra cả content-type lẫn chữ ký đầu file để không nhận file giả đuôi ảnh.
 */
@Slf4j
@Service
public class FileStorageService {

    public static final String URL_PREFIX = "/uploads/";
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSION_BY_TYPE = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp");

    private final Path root;

    public FileStorageService(AppProperties appProperties) {
        this.root = Paths.get(appProperties.upload().dir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Không tạo được thư mục upload: " + root, e);
        }
    }

    public Path getRoot() {
        return root;
    }

    /** Kiểm tra ảnh hợp lệ, ném 400 nếu không. Gọi trước khi lưu để upload nhiều ảnh không bị lưu dở dang. */
    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw AppException.badRequest("File ảnh rỗng");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw AppException.badRequest("Ảnh \"" + file.getOriginalFilename() + "\" vượt quá 5 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !EXTENSION_BY_TYPE.containsKey(contentType.toLowerCase())
                || !hasImageSignature(file, contentType.toLowerCase())) {
            throw AppException.badRequest("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
        }
    }

    /** Lưu ảnh vào thư mục con (ví dụ "products/12", "logos") và trả URL "/uploads/products/12/{uuid}.jpg". */
    public String storeImage(MultipartFile file, String folder) {
        validateImage(file);
        String extension = EXTENSION_BY_TYPE.get(file.getContentType().toLowerCase());
        Path dir = root.resolve(folder).normalize();
        if (!dir.startsWith(root)) {
            throw AppException.badRequest("Thư mục lưu ảnh không hợp lệ");
        }
        String fileName = UUID.randomUUID() + "." + extension;
        try (InputStream in = file.getInputStream()) {
            Files.createDirectories(dir);
            Files.copy(in, dir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Không lưu được ảnh", e);
        }
        return URL_PREFIX + root.relativize(dir).toString().replace('\\', '/') + "/" + fileName;
    }

    /** Xoá file theo URL "/uploads/..." — bỏ qua URL ngoài (ảnh seed từ Unsplash) và lỗi IO. */
    public void deleteQuietly(String url) {
        if (url == null || !url.startsWith(URL_PREFIX)) {
            return;
        }
        Path target = root.resolve(url.substring(URL_PREFIX.length())).normalize();
        if (!target.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("Không xoá được file {}: {}", target, e.getMessage());
        }
    }

    private static boolean hasImageSignature(MultipartFile file, String contentType) {
        byte[] head = new byte[12];
        try (InputStream in = file.getInputStream()) {
            int read = in.readNBytes(head, 0, head.length);
            head = Arrays.copyOf(head, read);
        } catch (IOException e) {
            return false;
        }
        return switch (contentType) {
            case "image/jpeg" -> startsWith(head, 0, 0xFF, 0xD8, 0xFF);
            case "image/png" -> startsWith(head, 0, 0x89, 'P', 'N', 'G');
            case "image/webp" -> startsWith(head, 0, 'R', 'I', 'F', 'F') && startsWith(head, 8, 'W', 'E', 'B', 'P');
            default -> false;
        };
    }

    private static boolean startsWith(byte[] data, int offset, int... expected) {
        if (data.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((data[offset + i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }
}
