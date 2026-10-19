package com.nhom5.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Nationalized;

/**
 * Bảng settings (script 07, ERD api.md mục 2): cấu hình dạng key-value admin đổi trên web, không cần restart.
 * Hiện có 2 khoá ngưỡng AI (docs/1910.md mục 4) — đọc / ghi qua AiSettingsService.
 *
 * <p>Không kế thừa BaseEntity: khoá chính là chuỗi, bảng không có id / created_at. {@code key}, {@code value}
 * là từ khoá SQL nên tên cột đặt trong backtick để Hibernate tự quote ({@code [key]} trên SQL Server,
 * {@code "key"} trên H2).</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "settings")
public class Setting {

    /** Ví dụ "ai.auto_accept_threshold". */
    @Id
    @Column(name = "`key`", length = 50)
    private String key;

    @Nationalized
    @Column(name = "`value`", nullable = false, length = 255)
    private String value;
}
