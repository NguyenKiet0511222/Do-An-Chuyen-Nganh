package com.nhom5.backend.repository;

import com.nhom5.backend.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;

/** Bảng settings — khoá chính là tên khoá (String). */
public interface SettingRepository extends JpaRepository<Setting, String> {
}
