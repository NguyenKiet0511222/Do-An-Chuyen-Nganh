# Ghi chú nhanh — chạy backend, tài khoản test, link

## Chạy backend

### 1. Cần có (làm 1 lần)

- **JDK 17 trở lên** (`java -version`; JDK 21/24 vẫn chạy được). Không cần cài Maven — dùng `mvnw.cmd` có sẵn.
- **SQL Server** (DB của nhóm là SQL Server, không phải MySQL) và phải **bật TCP/IP cổng 1433**:
  SQL Server Configuration Manager → SQL Server Network Configuration → Protocols for `<tên instance>` → **TCP/IP → Enable** → restart service *SQL Server (`<tên instance>`)*. Mặc định cài đặt để TẮT.
- **Tạo database**: mở SSMS, chạy `backend/src/main/resources/db/01_create_database.sql` (tạo `nongsan_db`).
  Các bảng: chạy tiếp `02_users.sql` → `03_catalog.sql` → `04_orders.sql`, hoặc bỏ qua vì backend để `ddl-auto=update` tự tạo bảng.

### 2. Cấu hình cục bộ (làm 1 lần)

Copy `backend/src/main/resources/application-local.properties.example` → `application-local.properties` (cùng thư mục, đã gitignore — **không commit**), rồi sửa cho có các dòng sau:

```properties
# --- SQL Server ---
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=nongsan_db;encrypt=true;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=<mật khẩu sa trên máy bạn>
# Driver + dialect SQL Server (có sẵn trong file .example; nhóm đã chốt SQL Server, KHÔNG dùng MySQL)
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect

# --- Tài khoản ADMIN tạo lần đầu (để khớp bảng tài khoản bên dưới) ---
app.admin.email=admin@nongsan.local
app.admin.password=Admin@123

# --- Đăng nhập Google (Client ID xin trong nhóm, phải trùng VITE_GOOGLE_CLIENT_ID của frontend) ---
app.google.client-id=<Client ID>.apps.googleusercontent.com
```

### 3. Chạy

**Cách nhanh:** double-click `run_backend.bat` ở thư mục gốc (hoặc `backend\run.bat`) — tự build rồi chạy.

**Hoặc gõ lệnh:**

```bat
cd backend
mvnw.cmd -DskipTests package
java -jar target\backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```

- Thấy dòng `Started BackendApplication in ... seconds` là xong → mở http://localhost:8080/api/health phải ra `"status":"UP"`.
- Dừng: `Ctrl + C` trong cửa sổ đang chạy.
- ⚠️ **Không dùng `mvnw.cmd spring-boot:run`**: lỗi `Could not find or load main class` vì đường dẫn project có dấu tiếng Việt/khoảng trắng.
- ⚠️ `application-local.properties` được **đóng gói vào file jar** → sửa file này xong phải **build lại** (`mvnw.cmd -DskipTests package`) rồi mới chạy; chạy lại jar cũ sẽ không nhận thay đổi. `run_backend.bat` luôn build lại nên không bị.

### 4. Lỗi thường gặp

| Lỗi trong log | Cách sửa |
|---|---|
| `The TCP/IP connection to the host localhost, port 1433 has failed` | Chưa bật TCP/IP hoặc SQL Server chưa chạy — xem mục 1, nhớ restart service |
| `Login failed for user 'sa'` | Sai mật khẩu `sa`, hoặc instance chưa bật đăng nhập SQL Server Authentication (SSMS → Properties của server → Security → *SQL Server and Windows Authentication mode*, rồi restart) |
| `Cannot open database "nongsan_db"` | Chưa chạy `01_create_database.sql` |
| `Incorrect syntax near 'statistics'` | File local còn cấu hình MySQL cũ (vd `MySQLDialect`) — xoá đi, dùng đúng các dòng SQL Server ở mục 2 |
| `Port 8080 was already in use` | Đang có backend khác chạy: `netstat -ano \| findstr :8080` → `taskkill /PID <số PID> /F` |
| `Could not find or load main class ...BackendApplication` | Đang chạy bằng `spring-boot:run` — dùng cách ở mục 3 |
| Bấm đăng nhập Google báo *thiếu GOOGLE_CLIENT_ID* | Chưa điền `app.google.client-id` hoặc chưa build lại jar |

## Tài khoản mẫu

Backend tự tạo khi khởi động (`AdminSeeder`, `ProductSeeder`, `OrderSeeder`) nếu DB chưa có — không cần chạy SQL.
Chỉ dùng cho dev/test, **không** dùng khi deploy thật.

| Vai trò | Email | Mật khẩu | Ghi chú |
|---|---|---|---|
| ADMIN | `admin@nongsan.local` | `Admin@123` | Lấy từ `app.admin.*` lúc **tạo lần đầu** — DB đã có ADMIN thì đổi cấu hình cũng không đổi mật khẩu |
| SELLER | `seller@nongsan.local` | `Seller@123` | Nguyễn Văn Tâm — shop **Vườn rau Tâm An**, có sẵn sản phẩm + 6 đơn mẫu |
| SELLER | `caolanh@nongsan.local` | `Seller@123` | Lê Văn Cao — shop **HTX Xoài Cao Lãnh** |
| CUSTOMER | `customer@nongsan.local` | `Customer@123` | Khách mẫu, chủ các đơn mẫu |

- Tài khoản cũ `seller@nongsanviet.com / 123456` **không còn dùng được** (chỉ chạy nhờ "đăng nhập ảo" đã gỡ 05/10).
- File `.example` để `app.admin.password=DoiMatKhauNay@123` — copy y nguyên thì mật khẩu admin là cái đó, không phải `Admin@123`.
- Đăng nhập Google: Gmail phải có trong **Test users** của project Google Cloud *AgriFresh AI* (nhờ chủ project thêm), và máy phải điền Client ID — xem CLAUDE.md mục 5. Tài khoản tạo qua Google là `CUSTOMER`, không có mật khẩu.

## Link

| | |
|---|---|
| Web | http://localhost:5173 |
| Swagger | http://localhost:8080/swagger-ui |
| Health | http://localhost:8080/api/health |

`localhost:8080` chỉ là API (trả JSON) — mở thẳng trên trình duyệt sẽ báo "Bạn cần đăng nhập", đó là bình thường.
