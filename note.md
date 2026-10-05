# Ghi chú nhanh — tài khoản test & link

## Tài khoản mẫu

Backend tự tạo khi khởi động (`AdminSeeder`, `ProductSeeder`, `OrderSeeder`) nếu DB chưa có — không cần chạy SQL.
Chỉ dùng cho dev/test, **không** dùng khi deploy thật.

| Vai trò | Email | Mật khẩu | Ghi chú |
|---|---|---|---|
| ADMIN | `admin@nongsan.local` | `Admin@123` | Lấy từ `app.admin.*` (đổi được trong `application-local.properties`) |
| SELLER | `seller@nongsan.local` | `Seller@123` | Nguyễn Văn Tâm — shop **Vườn rau Tâm An**, có sẵn sản phẩm + 6 đơn mẫu |
| SELLER | `caolanh@nongsan.local` | `Seller@123` | Lê Văn Cao — shop **HTX Xoài Cao Lãnh** |
| CUSTOMER | `customer@nongsan.local` | `Customer@123` | Khách mẫu, chủ các đơn mẫu |

- Tài khoản cũ `seller@nongsanviet.com / 123456` **không còn dùng được** (chỉ chạy nhờ "đăng nhập ảo" đã gỡ 05/10).
- Đăng nhập Google: Gmail phải có trong **Test users** của project Google Cloud *AgriFresh AI* (nhờ chủ project thêm), và máy phải điền Client ID — xem CLAUDE.md mục 5. Tài khoản tạo qua Google là `CUSTOMER`, không có mật khẩu.

## Link

| | |
|---|---|
| Web | http://localhost:5173 |
| Swagger | http://localhost:8080/swagger-ui |
| Health | http://localhost:8080/api/health |

`localhost:8080` chỉ là API (trả JSON) — mở thẳng trên trình duyệt sẽ báo "Bạn cần đăng nhập", đó là bình thường.
