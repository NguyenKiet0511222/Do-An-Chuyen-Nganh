# api.md — Đặc tả API & nghiệp vụ: Website bán nông sản tích hợp AI phân loại chất lượng

> Phiên bản: v1.6 (19/10/2026) · Nguồn: "Phân tích nghiệp vụ và api sơ bộ" của nhóm + đồng bộ Auth, Route Protection & Phân cấp Tài khoản Premium + chốt chi tiết API người bán (v1.3) + luồng khách hàng (địa chỉ, giỏ, checkout, đơn) & admin duyệt sản phẩm (v1.4) + AI service PyTorch & hợp đồng AI thống nhất (v1.5) + nối AI vào backend & admin kiểm định AI (changelog v1.6, lý do từng quyết định: [`1910.md`](1910.md)).
> Tài liệu này là **nguồn sự thật duy nhất** để sinh code. Khi có mâu thuẫn giữa tài liệu này và tài liệu khác, ưu tiên tài liệu này.

---

## 0. Tổng quan dự án

| Mục | Quyết định đã chốt |
|---|---|
| Mô hình | **Sàn nhiều người bán (multi-vendor)**: người bán (SELLER) đăng sản phẩm → admin duyệt → khách (CUSTOMER) mua. |
| Kho & giao hàng | **Người bán tự giữ hàng, tự giao.** Kho = `products.stock_quantity` do người bán quản lý. Không có kho tập trung, phiếu nhập, lô hàng, FEFO (hướng mở rộng v2). |
| Giỏ hàng nhiều shop | Cho phép. Khi thanh toán, hệ thống **tự tách thành nhiều đơn con, mỗi người bán một đơn** (cùng `checkoutGroupId`). |
| Thanh toán | **Chỉ COD** trong v1. Online (VNPay/Momo) là v2. |
| AI | Module phân loại ảnh nông sản (**tươi / hỏng + % tin cậy**). Gắn vào **ảnh sản phẩm khi người bán đăng** → admin dùng nhãn để duyệt. Khách hàng có thêm chức năng **"Kiểm tra AI"** độc lập nhưng chỉ dành cho tài khoản **🔒 Premium** — cơ chế tự nâng cấp chưa làm trong v1 (mục 3.3, 4.7, 9), admin gán thủ công để demo. |
| Đăng nhập | Email + mật khẩu **hoặc Google OAuth2**. Cả hai đều trả về **JWT** của hệ thống. |
| Vai trò | `CUSTOMER`, `SELLER`, `ADMIN` (không có role nhân viên riêng). |

### 0.1 Tech stack & cổng

| Thành phần | Công nghệ | Cổng |
|---|---|---|
| Frontend | ReactJS 19 (Vite) + React Router 7 + Axios; 3 khu vực: `customer/`, `seller/`, `admin/` | 5173 |
| Backend | Java 17/21, Spring Boot 4 (hoặc 3.4+), Spring Security + JWT (Nimbus / Resource Server), Spring Data JPA, Bean Validation, springdoc-openapi (Swagger) | 8080 |
| Database | SQL Server (JDBC `mssql-jdbc`) | 1433 |
| AI service | Python 3.10+, FastAPI, PyTorch + torchvision (MobileNetV2 transfer learning, 28 lớp) | 8000 |
| Lưu ảnh | Thư mục cục bộ `uploads/` (v1), phục vụ tĩnh tại `GET /uploads/**` | — |

### 0.2 Cấu trúc thư mục (monorepo)

```
Nhom5/
├── frontend/            # React (Vite)
│   └── src/{api, components, pages/{customer,seller,admin}, context, hooks, utils, layouts}
├── backend/             # Spring Boot
│   └── src/main/java/com/nhom5/backend/{config, security, controller, dto, entity, repository, service, exception}
├── ai/                  # FastAPI + model MobileNetV2
│   └── {app/, models/, notebooks/, requirements.txt}
└── docs/api.md          # tài liệu này
```

### 0.3 Biến môi trường

| Backend (`application.properties` / env) | Ý nghĩa |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Kết nối SQL Server |
| `JWT_SECRET` (≥ 32 ký tự), `JWT_EXPIRATION_MINUTES` (mặc định 1440 = 24h) | JWT |
| `GOOGLE_CLIENT_ID` | Xác thực ID token Google |
| `AI_SERVICE_URL` (mặc định `http://localhost:8000`) | Gọi AI service |
| `AI_ENABLED` (mặc định `true`) | `false` = không gọi AI, mọi ảnh mới vào hàng chờ admin (test H2 dùng) |
| `AI_AUTO_ACCEPT_THRESHOLD` = 0.90, `AI_REVIEW_THRESHOLD` = 0.70 | Ngưỡng mặc định khi bảng `settings` chưa có dòng (mục 3.3) |
| `AI_TIMEOUT_MS` = 5000 | Thời gian chờ AI trả lời; quá hạn coi như AI lỗi |
| `UPLOAD_DIR` (mặc định `./uploads`), `MAX_FILE_SIZE_MB` = 5 | Lưu ảnh |
| `CORS_ALLOWED_ORIGINS` = `http://localhost:5173` | CORS cho frontend Vite |
| `SHIPPING_FEE_FLAT` = 20000 | Phí ship cố định / đơn (VND) |

---

## 1. Quy ước chung

### 1.1 Định dạng
- Base URL: `http://localhost:8080/api`. JSON, UTF-8.
- Tiền: **số nguyên VND** (`long`), ví dụ `45000`.
- Thời gian: ISO-8601 có múi giờ, ví dụ `"2026-09-13T09:14:00+07:00"`.
- ID: `long` tự tăng (`BIGINT IDENTITY`).
- Tên trường JSON: `camelCase`. Enum: mã tiếng Anh viết HOA (UI tự map sang tiếng Việt).

### 1.2 Bọc response

Thành công:
```json
{ "success": true, "message": "OK", "data": { } }
```
Lỗi:
```json
{ "success": false, "message": "Dữ liệu không hợp lệ", "errors": [ { "field": "email", "message": "Email không đúng định dạng" } ] }
```

| HTTP | Khi nào |
|---|---|
| 200 / 201 | Thành công / tạo mới |
| 400 | Dữ liệu không hợp lệ (validation) |
| 401 | Chưa đăng nhập hoặc token sai/hết hạn |
| 403 | Không đủ quyền / không phải tài khoản Premium / tài khoản bị khoá |
| 404 | Không tìm thấy |
| 409 | Xung đột nghiệp vụ (email đã tồn tại, hết hàng, trạng thái không hợp lệ) |
| 500 | Lỗi hệ thống |

### 1.3 Phân trang & sắp xếp
Query: `page` (bắt đầu 0), `size` (mặc định 12, tối đa 100), `sort` (ví dụ `createdAt,desc`).
```json
{ "content": [ ], "page": 0, "size": 12, "totalElements": 248, "totalPages": 21 }
```

### 1.4 Xác thực
- Header: `Authorization: Bearer <accessToken>`.
- JWT HS256, claims: `sub` = userId (string), `email`, `role`, `iat`, `exp`. Hạn 24h (1440 phút). **Không có refresh token trong v1**.
- Mật khẩu mã hoá **BCrypt**. Tài khoản Google có `passwordHash = null`.

### 1.5 Ma trận đường dẫn ↔ quyền (cấu hình `SecurityFilterChain`)

| Đường dẫn | Quyền |
|---|---|
| `POST /api/auth/**`, `GET /api/categories/**`, `GET /api/products/**`, `GET /api/shops/**`, `GET /uploads/**`, `/swagger-ui/**`, `/v3/api-docs/**`, `/api/health` | Công khai |
| `/api/users/me/**`, `/api/cart/**`, `/api/orders/**`, `POST /api/products/{id}/reviews`, `POST /api/seller/register` | Đã đăng nhập (mọi role) |
| `/api/ai/**` | Đã đăng nhập + **🔒 Yêu cầu tài khoản `PREMIUM`** (mục 3.3, 4.7) |
| `/api/seller/**` (trừ `/register`) | `SELLER` hoặc `ADMIN` |
| `/api/admin/**` | `ADMIN` |

### 1.6 Enum

```
Role:            CUSTOMER | SELLER | ADMIN
UserStatus:      ACTIVE | LOCKED
AccountTier:     STANDARD | PREMIUM       (mặc định STANDARD — mở khoá mục 4.7 AI khách hàng)
AuthProvider:    LOCAL | GOOGLE
ShopStatus:      PENDING_VERIFICATION | ACTIVE | LOCKED
ProductStatus:   DRAFT | PENDING | APPROVED | REJECTED | NEED_INFO | HIDDEN
HiddenBy:        SELLER | ADMIN
AiSource:        PRODUCT_IMAGE | QUICK_CHECK
AiLabel:         FRESH | ROTTEN | UNCERTAIN
AiReviewStatus:  AUTO_ACCEPTED | PENDING_REVIEW | ACCEPTED | CORRECTED | RETAKE_REQUESTED
OrderStatus:     PENDING | CONFIRMED | PROCESSING | SHIPPING | DELIVERED | CANCELLED
PaymentMethod:   COD
PaymentStatus:   UNPAID | PAID
```

Nhãn tiếng Việt cho UI (tham khảo): PENDING = Chờ xác nhận, CONFIRMED = Đã xác nhận, PROCESSING = Đang chuẩn bị, SHIPPING = Đang giao, DELIVERED = Hoàn thành, CANCELLED = Đã huỷ; FRESH = Tươi, ROTTEN = Hỏng, UNCERTAIN = Không chắc.

---

## 2. Mô hình dữ liệu (SQL Server)

Mọi bảng có `created_at DATETIME2 DEFAULT SYSDATETIME()`, `updated_at DATETIME2`. Khoá chính `id BIGINT IDENTITY`.

| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `users` | full_name NVARCHAR(100); email NVARCHAR(150) UNIQUE; phone VARCHAR(20) NULL; password_hash NVARCHAR(255) NULL; provider (LOCAL/GOOGLE); provider_id NVARCHAR(255) NULL; role; status; **account_tier (STANDARD/PREMIUM) DEFAULT 'STANDARD'**; avatar_url NVARCHAR(500) NULL | `account_tier` gác cổng tính năng AI khách hàng — mục 3.3, 4.7 |
| `shops` | user_id UNIQUE FK→users; shop_name NVARCHAR(150); description NVARCHAR(MAX); province NVARCHAR(100); address NVARCHAR(255); phone; logo_url; status; rating_avg DECIMAL(2,1) DEFAULT 0; rating_count INT DEFAULT 0; verified_at NULL | 1 user ↔ 1 shop |
| `addresses` | user_id FK; receiver_name; phone; province; district; ward; street NVARCHAR(255); is_default BIT | Sổ địa chỉ khách |
| `categories` | name; slug UNIQUE; parent_id NULL FK→categories; description; image_url; display_order INT; is_active BIT; ai_produce_keys VARCHAR(255) NULL | Cây 2 cấp. `ai_produce_keys` ví dụ `"tomato,potato,carrot"` |
| `products` | shop_id FK; category_id FK; name NVARCHAR(200); slug UNIQUE; description NVARCHAR(MAX); price BIGINT; unit NVARCHAR(20); stock_quantity INT; origin NVARCHAR(150); status; hidden_by NULL; reject_reason NVARCHAR(500) NULL; ai_overall_label NULL; ai_overall_confidence DECIMAL(5,4) NULL; sold_count INT DEFAULT 0; rating_avg DECIMAL(2,1) DEFAULT 0; rating_count INT DEFAULT 0; approved_at NULL | |
| `product_images` | product_id FK; url NVARCHAR(500); display_order INT; is_primary BIT | Xoá sản phẩm → xoá ảnh (cascade) |
| `ai_results` | source (PRODUCT_IMAGE/QUICK_CHECK); product_image_id NULL FK→product_images; user_id NULL FK→users (người tải ảnh, chỉ khi QUICK_CHECK); image_url; produce VARCHAR(50); label; confidence DECIMAL(5,4); model_version VARCHAR(50); review_status; final_label NULL; reviewed_by NULL FK→users; reviewed_at NULL; note NVARCHAR(500) NULL; inference_ms INT | 2 nguồn: ảnh sản phẩm (product_image_id, 1 ảnh ↔ 1 kết quả mới nhất) hoặc khách Premium tự kiểm tra (user_id, mục 4.7). `model_version` NULL = AI tắt/lỗi. Dòng `review_status = CORRECTED` (có `final_label`) là **dữ liệu train lại** — không có bảng riêng (v1.6, mục 3.3) |
| `cart_items` | user_id FK; product_id FK; quantity INT; UNIQUE(user_id, product_id) | Không cần bảng carts |
| `orders` | order_code VARCHAR(20) UNIQUE; checkout_group_id VARCHAR(36); user_id FK; shop_id FK; status; payment_method; payment_status; receiver_name; phone; shipping_address NVARCHAR(500); note NVARCHAR(500) NULL; subtotal BIGINT; shipping_fee BIGINT; total BIGINT; cancel_reason NULL; confirmed_at, delivered_at, cancelled_at NULL | **1 đơn = 1 shop** |
| `order_items` | order_id FK; product_id FK; product_name (snapshot); unit; price BIGINT (snapshot); quantity INT; subtotal BIGINT; ai_label_snapshot NULL | Snapshot tại thời điểm đặt |
| `order_status_history` | order_id FK; from_status NULL; to_status; changed_by FK→users NULL; note NULL | Ghi mỗi lần đổi trạng thái |
| `product_review_history` | product_id FK; actor_id FK→users NULL; action (SUBMIT \| APPROVE \| REJECT \| NEED_INFO \| HIDE \| UNHIDE); from_status NULL; to_status; reason NVARCHAR(500) NULL | **Thêm v1.4** — lịch sử duyệt cho `GET /admin/products/{id}`: người bán submit + mọi thao tác admin |
| `reviews` | product_id FK; user_id FK; order_id FK; rating TINYINT (1–5); comment NVARCHAR(1000); UNIQUE(product_id, user_id, order_id) | Chỉ khi đơn DELIVERED |
| `settings` | [key] VARCHAR(50) PK; [value] NVARCHAR(255) NOT NULL | **Tạo v1.6** (script `07_settings.sql`, entity `Setting` — không kế thừa `BaseEntity`: khoá chuỗi, không có `id` / `created_at` / `updated_at`). Seed: `ai.auto_accept_threshold=0.90`, `ai.review_threshold=0.70`. Thiếu dòng → backend dùng mặc định `app.ai.*`. **Không** lưu `model_version` (đọc từ `GET /health` của AI service, mục 5) |

Quan hệ chính: `users 1–1 shops`, `shops 1–n products`, `products 1–n product_images 1–1 ai_results`, `users 1–n ai_results` (QUICK_CHECK, chỉ tài khoản Premium), `users 1–n orders`, `shops 1–n orders`, `orders 1–n order_items`, `products 1–n reviews`.

`order_code`: `DH-{yyyy}-{5 chữ số tăng dần}` ví dụ `DH-2026-01187`.

---

## 3. Quy tắc nghiệp vụ

### 3.1 Tài khoản
- Email là định danh duy nhất. Đăng ký thường tạo `role = CUSTOMER`, `provider = LOCAL`, `status = ACTIVE`, `account_tier = STANDARD`.
- Đăng nhập Google: backend xác thực ID token với Google (`GOOGLE_CLIENT_ID`). Email chưa có → tạo user `provider = GOOGLE`, `password_hash = null`. Email đã có → đăng nhập vào user đó và cập nhật `provider_id` nếu trống.
- Tài khoản `LOCKED` → mọi request trả 403 `"Tài khoản đã bị khoá"`.
- Muốn bán hàng: user đã đăng nhập gọi `POST /api/seller/register` tạo `shop` (PENDING_VERIFICATION). Admin xác minh → `shop.status = ACTIVE` **và** `user.role = SELLER`. Trước khi xác minh, user vẫn là CUSTOMER và không vào được `/api/seller/**`. Tài khoản ADMIN không đăng ký bán hàng được (403).
- Sau khi admin xác minh, JWT cũ vẫn mang `role = CUSTOMER` → người bán **phải đăng nhập lại** để nhận token `SELLER`. Frontend biết trạng thái shop qua `shopId` / `shopStatus` trong `/auth/me`.
- Shop `LOCKED` → toàn bộ sản phẩm của shop ẩn khỏi trang công khai; đơn hàng đang xử lý vẫn giữ. Người bán của shop bị khoá vẫn xem shop, sửa tồn kho và xử lý đơn, nhưng **không tạo / gửi duyệt sản phẩm** (403).

### 3.2 Sản phẩm & duyệt
- Vòng đời: `DRAFT → PENDING → APPROVED | REJECTED | NEED_INFO`. Người bán sửa sản phẩm ở `REJECTED`/`NEED_INFO` rồi `submit` lại → `PENDING`. `APPROVED` có thể → `HIDDEN` (do SELLER hoặc ADMIN, ghi `hidden_by`) và ngược lại (`SELLER` chỉ được bỏ ẩn nếu `hidden_by = SELLER`).
- Sửa **bất kỳ thông tin nào trừ tồn kho** (tên, giá, mô tả, ảnh, danh mục, đơn vị, xuất xứ) của sản phẩm `APPROVED` hoặc `HIDDEN` → tự chuyển về `PENDING` để duyệt lại (xoá `hidden_by`). Sửa **tồn kho** không cần duyệt lại. Đổi ảnh chính không tính là sửa nội dung. *(v1.3: mở rộng từ "giá / tên / mô tả / ảnh" để chặn lách duyệt, ví dụ đổi "kg" thành "lạng" giữ nguyên giá.)*
- Sản phẩm đang `PENDING` **bị khoá sửa** (thông tin + ảnh) → 409; chỉ được cập nhật tồn kho. `DRAFT` / `REJECTED` / `NEED_INFO` sửa tự do, giữ trạng thái tới khi `submit`.
- `submit` yêu cầu: ≥ 1 ảnh, giá > 0, tồn kho ≥ 0, có danh mục, **không còn ảnh `RETAKE_REQUESTED`** (admin yêu cầu chụp lại — v1.6); thiếu → 400 `"Chưa đủ điều kiện gửi duyệt: …"` liệt kê các điều kiện thiếu, ví dụ `"Chưa đủ điều kiện gửi duyệt: có 1 ảnh admin yêu cầu chụp lại (xoá và tải ảnh mới)"`. Ảnh bị AI gắn ROTTEN **không** chặn submit (admin quyết định). Submit xoá `reject_reason`.
- Xoá sản phẩm chỉ khi chưa từng nằm trong đơn nào; ngược lại 409 → dùng ẩn.
- Trang công khai chỉ trả sản phẩm `APPROVED` thuộc shop `ACTIVE`.
- Nhãn AI tổng hợp của sản phẩm (`ai_overall_label`) = xấu nhất trong các ảnh, theo nhãn hiển thị `final_label ?? label`: có ROTTEN → ROTTEN; không có ROTTEN nhưng có UNCERTAIN → UNCERTAIN; còn lại FRESH. `ai_overall_confidence` = trung bình confidence. Tính lại khi tải / xoá ảnh và sau mỗi thao tác kiểm định AI của admin.

### 3.3 AI
- Ảnh hợp lệ: JPG/PNG/WEBP, ≤ 5 MB. Không hợp lệ → 400.
- **Đã nối AI (v1.6, 19/10/2026).** Mỗi ảnh sản phẩm khi tải lên → backend gọi AI service **đồng bộ** (`ProductAiLabeler` + `AiServiceClient`, mục 5). Ảnh **luôn được lưu** dù AI tắt/lỗi — AI không chặn đăng sản phẩm.
  - Timeout `app.ai.timeout-ms` (5s). Tải nhiều ảnh trong 1 request: 1 ảnh gọi AI lỗi → các ảnh **còn lại của lần tải đó không gọi AI nữa**, vào thẳng hàng chờ (tránh 5 ảnh × 5s = 25s).
  - `app.ai.enabled=false` (`AI_ENABLED`) → không gọi AI, mọi ảnh mới vào hàng chờ với `note = "AI đang tắt — chờ admin kiểm định"` (test H2 dùng).
- **Bảng quy tắc** (2 ngưỡng đọc từ `settings`) — xét từ trên xuống, gặp dòng đầu tiên khớp thì dừng:

| # | Điều kiện | `label` | `review_status` | `note` (ví dụ) |
|---|---|---|---|---|
| 1 | AI tắt / lỗi / timeout / 503 / trả sai hợp đồng | UNCERTAIN, confidence 0 | PENDING_REVIEW | `AI không phản hồi — chờ admin kiểm định` |
| 2 | `produce_type` không thuộc `aiProduceKeys` của danh mục | UNCERTAIN | PENDING_REVIEW | `AI nhận ra cucumber_fresh (72%) — không thuộc danh mục "Rau lá" (cabbage, lettuce)` |
| 3 | confidence < `review_threshold` (0.70) | UNCERTAIN | PENDING_REVIEW | `AI không chắc: bellpepper_rotten (55%)` |
| 4 | `condition = rotten` | ROTTEN | PENDING_REVIEW | `AI phát hiện hỏng: mango_rotten (97%) — chờ admin xác nhận` |
| 5 | fresh, confidence < `auto_accept_threshold` (0.90) | FRESH | PENDING_REVIEW | `tomato_fresh (80%) — dưới ngưỡng tự chấp nhận 90%` |
| 6 | fresh, confidence ≥ `auto_accept_threshold` | FRESH | **AUTO_ACCEPTED** | — (`null`) |

  - Tự chấp nhận **chỉ** khi AI chắc chắn là **tươi**; ảnh hỏng luôn có admin xem dù AI chắc 99%. *(v1.6 sửa lỗi bản cũ: dòng "còn lại → AUTO_ACCEPTED" khiến ngưỡng 0.90 vô tác dụng — ảnh tươi 0.75 cũng tự chấp nhận.)*
  - Dòng 2–6 lưu `produce` = `produce_type` (chữ thường), `confidence` (làm tròn 4 chữ số, so ngưỡng trên đúng số đã lưu), `model_version`, `inference_ms` (đo ở backend, gồm cả thời gian gửi ảnh). Dòng 1 không có `produce` / `model_version`.
  - **Luật danh mục (dòng 2)** — bù cho việc model không có lớp "không nhận ra": lấy `aiProduceKeys` của danh mục sản phẩm; trống thì lấy của danh mục cha; cả hai trống → bỏ qua dòng 2. Tách dấu phẩy, bỏ khoảng trắng, so chữ thường. Seed khớp 14 loại model biết (mục 7); danh mục model chưa biết (vd Rau lá `cabbage,lettuce`) → ảnh luôn UNCERTAIN, AI không phán bừa. Người bán đổi danh mục sau khi đã tải ảnh: **không** chạy lại luật này (hạn chế v1).
- **Ngưỡng** lưu ở bảng `settings` (`ai.auto_accept_threshold`, `ai.review_threshold`), admin đổi qua `PUT /admin/ai/settings` (mục 4.9), **không cần restart**; áp cho ảnh tải lên **sau đó**, không gắn lại nhãn ảnh cũ. Thiếu dòng / giá trị không phải số trong (0, 1] → mặc định `app.ai.auto-accept-threshold` / `app.ai.review-threshold`; cặp ghép ra sai điều kiện `review < autoAccept` → dùng cả 2 mặc định.
- **Admin kiểm định** (mục 4.9): `ACCEPT` (giữ nhãn AI), `CORRECT` (đặt `final_label`), `RETAKE` (yêu cầu chụp lại: sản phẩm đang `PENDING` → `NEED_INFO`; trạng thái khác chỉ đánh dấu ảnh, muốn gỡ sản phẩm đang bán thì admin dùng **Ẩn**). Nhãn dùng để hiển thị = `final_label ?? label`. Hàng chờ chỉ gồm ảnh `PENDING_REVIEW` của sản phẩm `PENDING` / `APPROVED` / `HIDDEN` (sản phẩm người bán đang sửa không hiện). Admin duyệt sản phẩm **không** bị chặn khi còn ảnh chờ kiểm định AI.
- **Dữ liệu train lại** (v1.6): dùng luôn `ai_results`, không bảng riêng — `SELECT image_url, produce, label AS ai_label, final_label FROM ai_results WHERE review_status = 'CORRECTED'`. Ghi chú admin được **nối sau** ghi chú AI (không ghi đè nhãn gốc). Hạn chế: người bán xoá ảnh → mất dòng (cascade) và file.
- **Kiểm tra nhanh của khách (QUICK_CHECK, mục 4.7)**: tính năng **🔒 Premium** — chỉ tài khoản `account_tier = PREMIUM` mới gọi được `POST /api/ai/classify` và `GET /api/ai/history`. Tài khoản `STANDARD` gọi 2 endpoint này → 403 `{ "success": false, "message": "Tính năng dành cho tài khoản Premium" }`. Kết quả lưu vào `ai_results` với `user_id` của khách, **không** gắn vào sản phẩm nào và không ảnh hưởng `ai_overall_label`. Giới hạn 20 lượt/ngày/user (tuỳ chọn, chống spam mô hình).
- **Cơ chế nâng cấp lên Premium chưa xây dựng trong v1** (mục 9). `account_tier` mặc định `STANDARD` cho mọi tài khoản kể cả seed data. Trước mắt, admin có thể gán thủ công qua `PATCH /admin/users/{id}/tier` (mục 4.9) để demo tính năng.
- Công cụ kiểm tra nhanh riêng của admin (mục 4.9, `POST /admin/ai/classify`) không tính vào giới hạn trên và không lưu lịch sử — chỉ để thử mô hình.

### 3.4 Giỏ hàng & đặt hàng
- Chỉ thêm được sản phẩm `APPROVED` của shop `ACTIVE`; `quantity ≤ stock_quantity`.
- Checkout: nhóm các `cart_items` được chọn theo `shop_id` → **mỗi shop một `orders`** với chung `checkout_group_id` (UUID). Mỗi đơn: `subtotal = Σ price×quantity`, `shipping_fee = SHIPPING_FEE_FLAT`, `total = subtotal + shipping_fee`. Giá & tên sản phẩm được **snapshot** vào `order_items`.
- **Trừ tồn kho ngay khi tạo đơn** (trong 1 transaction, kiểm tra `stock_quantity ≥ quantity` từng dòng; thiếu → rollback toàn bộ checkout, trả 409 kèm danh sách sản phẩm thiếu hàng). Huỷ đơn → **hoàn tồn kho**.
- Xoá các `cart_items` đã checkout thành công.
- `payment_method = COD`, `payment_status = UNPAID`; khi `DELIVERED` → `PAID`.

### 3.5 Trạng thái đơn hàng

| Từ → đến | Ai được làm |
|---|---|
| PENDING → CONFIRMED | SELLER (chủ shop), ADMIN |
| CONFIRMED → PROCESSING | SELLER, ADMIN |
| PROCESSING → SHIPPING | SELLER, ADMIN |
| SHIPPING → DELIVERED | SELLER, ADMIN (đồng thời `payment_status = PAID`, `products.sold_count += quantity`) |
| PENDING / CONFIRMED → CANCELLED | CUSTOMER (chủ đơn), SELLER, ADMIN — bắt buộc `cancelReason` |
| PROCESSING → CANCELLED | SELLER, ADMIN |
| Mọi chuyển khác | 409 `"Chuyển trạng thái không hợp lệ"` |

Mỗi lần chuyển ghi 1 dòng `order_status_history` (`note` tuỳ chọn, ví dụ mã vận đơn khi chuyển SHIPPING). Huỷ đơn: `cancel_reason` bắt buộc, lưu vào `orders.cancel_reason` và làm `note` của dòng lịch sử nếu không gửi `note`; **hoàn tồn kho** từng dòng.

### 3.6 Đánh giá
- Chỉ khách có đơn `DELIVERED` chứa sản phẩm đó mới được đánh giá; mỗi (sản phẩm, đơn) 1 lần.
- Sau khi lưu: cập nhật `products.rating_avg/rating_count` và `shops.rating_avg/rating_count`.

---

## 4. API

Ký hiệu quyền: 🌐 công khai · 🔑 đã đăng nhập · 🛒 SELLER · 🛡 ADMIN. Mọi response đều bọc theo mục 1.2; dưới đây chỉ ghi phần `data`.

### 4.1 Auth (`/api/auth`)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | 🌐 | Đăng ký bằng email/mật khẩu (luôn tạo CUSTOMER, tier STANDARD) |
| POST | `/auth/login` | 🌐 | Đăng nhập, trả JWT |
| POST | `/auth/google` | 🌐 | Đăng nhập bằng Google ID token |
| GET | `/auth/me` | 🔑 | Thông tin user hiện tại (từ token) |
| PUT | `/auth/change-password` | 🔑 | Đổi mật khẩu (chỉ provider LOCAL) |

**POST /auth/register** — body:
```json
{ "fullName": "Trần Thị Mai", "email": "mai@gmail.com", "phone": "0912345678", "password": "Abc12345", "confirmPassword": "Abc12345" }
```
Validation: `fullName` 2–100 ký tự; `email` đúng định dạng; `phone` tuỳ chọn, 9–11 số; `password` ≥ 8 ký tự; `password == confirmPassword`. Email đã tồn tại → 409. Response 201:
```json
{ "userId": 12, "email": "mai@gmail.com" }
```

**POST /auth/login** — body `{ "email", "password" }`. Sai → 401 `"Sai email hoặc mật khẩu"`. Response:
```json
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": 12,
    "fullName": "Trần Thị Mai",
    "email": "mai@gmail.com",
    "phone": "0912345678",
    "role": "CUSTOMER",
    "accountTier": "STANDARD",
    "provider": "LOCAL",
    "avatarUrl": null,
    "active": true,
    "createdAt": "...",
    "shopId": null,
    "shopStatus": null
  }
}
```

**POST /auth/google** — body `{ "idToken": "<Google ID token từ frontend>" }`. Token không hợp lệ → 401. Response **giống hệt** `/auth/login`.

**GET /auth/me** — response: cùng khuôn `user` ở trên (`id, fullName, email, phone, role, accountTier, provider, avatarUrl, active, createdAt, shopId, shopStatus`). `shopId`/`shopStatus` null nếu chưa đăng ký bán; `shopStatus = PENDING_VERIFICATION` → frontend hiện "Chờ xác minh".

**PUT /auth/change-password** — body `{ "currentPassword", "newPassword", "confirmPassword" }`.

### 4.2 Hồ sơ & sổ địa chỉ (`/api/users/me`)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET / PUT | `/users/me` | 🔑 | Xem / sửa hồ sơ (`fullName`, `phone`) |
| PUT | `/users/me/avatar` | 🔑 | Upload ảnh đại diện (multipart `file`) → `{ "avatarUrl" }` |
| GET | `/users/me/addresses` | 🔑 | Danh sách địa chỉ |
| POST | `/users/me/addresses` | 🔑 | Thêm địa chỉ |
| PUT / DELETE | `/users/me/addresses/{id}` | 🔑 | Sửa / xoá (chỉ của mình) |
| PATCH | `/users/me/addresses/{id}/default` | 🔑 | Đặt làm mặc định |

Address JSON: `{ "id", "receiverName", "phone", "province", "district", "ward", "street", "isDefault" }`. Body POST/PUT: các field trên trừ `id` (`ward` tuỳ chọn, `isDefault` tuỳ chọn, `phone` 9–11 chữ số).
Quy tắc mặc định (v1.4): địa chỉ **đầu tiên tự thành mặc định**; `isDefault: true` (khi thêm/sửa) hoặc `PATCH .../default` → bỏ cờ các địa chỉ khác; `isDefault: false` trên địa chỉ đang mặc định bị bỏ qua (muốn đổi thì đặt cho địa chỉ khác); xoá địa chỉ mặc định → địa chỉ cũ nhất còn lại được đôn lên. Địa chỉ người khác → 404 ở mọi API. Đã làm đủ 6 API (v1.4); `/users/me`, `/users/me/avatar` chưa làm.

### 4.3 Danh mục (`/api/categories`)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/categories` | 🌐 | Cây danh mục đang hoạt động (cha → `children[]`) |
| GET | `/categories/{id}` | 🌐 | Chi tiết 1 danh mục |
| GET | `/admin/categories` | 🛡 | Toàn bộ (kể cả ẩn), dạng cây |
| POST | `/admin/categories` | 🛡 | Tạo |
| PUT / DELETE | `/admin/categories/{id}` | 🛡 | Sửa / xoá (xoá chỉ khi không có sản phẩm, ngược lại 409 — dùng `isActive=false` để ẩn) |

Category JSON: `{ "id", "name", "slug", "parentId", "description", "imageUrl", "displayOrder", "isActive", "aiProduceKeys", "productCount", "children": [] }`.

### 4.4 Sản phẩm – công khai (`/api/products`, `/api/shops`)

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/products` | 🌐 | Danh sách sản phẩm APPROVED, phân trang + lọc |
| GET | `/products/{id}` | 🌐 | Chi tiết (kèm ảnh + nhãn AI từng ảnh, shop, đánh giá tóm tắt) |
| GET | `/products/{id}/reviews` | 🌐 | Đánh giá, phân trang |
| POST | `/products/{id}/reviews` | 🔑 | Gửi đánh giá (mục 3.6) |
| GET | `/shops/{id}` | 🌐 | Trang shop công khai + sản phẩm của shop (phân trang) |

**GET /products** — query: `keyword`, `categoryId` (bao gồm danh mục con), `shopId`, `minPrice`, `maxPrice`, `origin`, `aiLabel` (FRESH/UNCERTAIN), `sort` = `newest` (mặc định) | `priceAsc` | `priceDesc` | `bestSelling` | `rating`, `page`, `size`.

Product (list item):
```json
{ "id": 1187, "name": "Cà chua bi Đà Lạt", "slug": "ca-chua-bi-da-lat", "price": 45000, "unit": "kg",
  "primaryImageUrl": "/uploads/products/1187/a.jpg", "aiOverallLabel": "FRESH", "aiOverallConfidence": 0.92,
  "ratingAvg": 4.6, "ratingCount": 18, "soldCount": 214, "stockQuantity": 120,
  "category": { "id": 5, "name": "Củ quả" }, "shop": { "id": 3, "shopName": "Vườn rau Tâm An", "province": "Lâm Đồng" } }
```
Product (detail) = list item + `description`, `origin`, `status`, `images: [ { "id", "url", "isPrimary", "displayOrder", "ai": { "label", "confidence", "finalLabel", "reviewStatus" } } ]`, `shop: { ..., "ratingAvg", "ratingCount", "logoUrl" }`.

**POST /products/{id}/reviews** — body `{ "orderId": 5011, "rating": 5, "comment": "Rất tươi" }` → 201; chưa mua/đã đánh giá → 409.

### 4.5 Giỏ hàng (`/api/cart`) 🔑

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/cart` | Giỏ hàng **nhóm theo shop** |
| POST | `/cart/items` | Thêm `{ "productId", "quantity" }` (đã có → cộng dồn) |
| PUT | `/cart/items/{id}` | Đổi số lượng `{ "quantity" }` (0 = xoá) |
| DELETE | `/cart/items/{id}` | Xoá 1 dòng |
| DELETE | `/cart` | Xoá toàn bộ |

GET /cart response:
```json
{
  "groups": [
    { "shop": { "id": 3, "shopName": "Vườn rau Tâm An" },
      "items": [ { "id": 77, "product": { "id": 1187, "name": "Cà chua bi Đà Lạt", "price": 45000, "unit": "kg", "primaryImageUrl": "...", "stockQuantity": 120 }, "quantity": 2, "subtotal": 90000 } ],
      "subtotal": 90000, "shippingFee": 20000 }
  ],
  "grandTotal": 110000, "totalItems": 1
}
```
Ghi chú (v1.4): `totalItems` = số dòng; `shippingFee` mỗi nhóm = `SHIPPING_FEE_FLAT`, `grandTotal` = Σ (subtotal + shippingFee). Thêm/đổi số lượng vượt tồn kho → 409 `"Chỉ còn {n} {unit}"`; sản phẩm không APPROVED hoặc shop không ACTIVE → 409 `"Sản phẩm hiện không còn bán"`. Sản phẩm **về sau** hết bán / hết hàng vẫn giữ trong giỏ (frontend dựa vào `stockQuantity` để cảnh báo) — checkout sẽ chặn. Dòng giỏ của người khác → 404. POST trả 201, PUT/DELETE dòng trả giỏ mới; DELETE /cart trả `data: null`.

### 4.6 Đặt hàng – khách hàng (`/api/orders`) 🔑

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/orders/checkout` | Tạo đơn từ giỏ (tự tách theo shop) |
| GET | `/orders` | Đơn của tôi (`status`, `page`, `size`) |
| GET | `/orders/{id}` | Chi tiết (chỉ chủ đơn) |
| PATCH | `/orders/{id}/cancel` | Huỷ `{ "cancelReason" }` (chỉ khi PENDING/CONFIRMED) |

**POST /orders/checkout** — body:
```json
{ "addressId": 4, "note": "Gọi trước 10 phút", "cartItemIds": [77, 78, 81], "paymentMethod": "COD" }
```
`cartItemIds` bỏ trống = toàn bộ giỏ. Response 201:
```json
{
  "checkoutGroupId": "5f1c...",
  "orders": [
    { "id": 5011, "orderCode": "DH-2026-01187", "shop": { "id": 3, "shopName": "Vườn rau Tâm An" }, "status": "PENDING",
      "subtotal": 114000, "shippingFee": 20000, "total": 134000, "itemCount": 2 },
    { "id": 5012, "orderCode": "DH-2026-01188", "shop": { "id": 7, "shopName": "HTX Xoài Cao Lãnh" }, "status": "PENDING",
      "subtotal": 195000, "shippingFee": 20000, "total": 215000, "itemCount": 1 }
  ],
  "grandTotal": 349000
}
```
Hết hàng → 409:
```json
{ "success": false, "message": "Một số sản phẩm không đủ hàng", "errors": [ { "field": "productId:1187", "message": "Chỉ còn 1 kg" } ] }
```
Ghi chú (v1.4): `errors[]` gộp cả sản phẩm **không còn bán** (`"Sản phẩm không còn bán"`); gặp lỗi là **không tạo đơn nào**, tồn kho và giỏ giữ nguyên. `cartItemIds` chứa id không thuộc giỏ mình → 404; giỏ rỗng → 400 `"Giỏ hàng trống"`; `addressId` không phải của mình → 404. `shippingAddress` = `street, ward, district, province` của địa chỉ chọn; `receiverName`/`phone` chép từ địa chỉ. `orderCode` = `DH-{năm}-{id đơn, đệm 5 số}` (suy từ id nên không trùng, không reset theo năm). `GET /orders` trả trang **OrderSummary** (mục 4.8) có thêm `shop { id, shopName }`. Huỷ: `PATCH /orders/{id}/cancel` chỉ khi PENDING/CONFIRMED (khác → 409), thiếu `cancelReason` → 400, hoàn tồn kho, ghi `history` với `note` = lý do.

Order (detail):
```json
{ "id": 5011, "orderCode": "DH-2026-01187", "checkoutGroupId": "5f1c...", "status": "SHIPPING",
  "paymentMethod": "COD", "paymentStatus": "UNPAID",
  "customer": { "id": 12, "fullName": "Trần Thị Mai", "phone": "0912345678" },
  "shop": { "id": 3, "shopName": "Vườn rau Tâm An", "phone": "0905111222" },
  "receiverName": "Trần Thị Mai", "phone": "0912345678", "shippingAddress": "Số 12, ngõ 45 Nguyễn Chí Thanh, Đống Đa, Hà Nội", "note": "Gọi trước 10 phút",
  "items": [ { "productId": 1187, "productName": "Cà chua bi Đà Lạt", "unit": "kg", "price": 45000, "quantity": 2, "subtotal": 90000, "aiLabelSnapshot": "FRESH", "imageUrl": "..." } ],
  "subtotal": 114000, "shippingFee": 20000, "total": 134000,
  "history": [ { "fromStatus": "PENDING", "toStatus": "CONFIRMED", "changedBy": "Vườn rau Tâm An", "note": null, "createdAt": "..." } ],
  "createdAt": "...", "confirmedAt": "...", "deliveredAt": null, "cancelledAt": null, "cancelReason": null }
```

### 4.7 AI – khách hàng (`/api/ai`) 🔑 + 🔒 Premium

> Yêu cầu `account_tier = PREMIUM` (mục 3.3). **v1 chưa có luồng tự nâng cấp** — chỉ admin gán thủ công (`/admin/users/{id}/tier`, mục 4.9) để demo; xem mục 9.

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/ai/classify` | Kiểm tra nhanh 1 ảnh (multipart `file` hoặc `image`) |
| GET | `/ai/history` | Lịch sử kiểm tra của tôi (phân trang) |
| GET | `/ai/history/{id}` | Chi tiết 1 lần (chỉ của mình) |

**POST /ai/classify** response 201:
```json
{ "id": 9021, "imageUrl": "/uploads/ai/9021.jpg", "produce": "tomato", "label": "FRESH", "confidence": 0.94, "modelVersion": "mobilenetv2-pt-v1", "inferenceMs": 180, "createdAt": "..." }
```
Tài khoản `STANDARD` gọi endpoint trên → 403:
```json
{ "success": false, "message": "Tính năng dành cho tài khoản Premium" }
```

### 4.8 Người bán (`/api/seller`) 🛒

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/seller/register` | 🔑 | Đăng ký shop `{ "shopName", "description", "province", "address", "phone" }` → 201 Shop, PENDING_VERIFICATION (đã có shop → 409, ADMIN → 403) |
| GET / PUT | `/seller/shop` | 🛒 | Xem / sửa thông tin shop (body giống register) → Shop |
| PUT | `/seller/shop/logo` | 🛒 | Upload logo (multipart `file`) → `{ "logoUrl" }` |
| GET | `/seller/dashboard/summary` | 🛒 | Số liệu tổng quan (khuôn bên dưới) |
| GET | `/seller/products` | 🛒 | Sản phẩm của shop (`status` — **1 hoặc nhiều giá trị cách dấu phẩy**, ví dụ `REJECTED,NEED_INFO`; `keyword`; `page`; `size`) → trang SellerProduct |
| POST | `/seller/products` | 🛒 | Tạo sản phẩm (DRAFT) → 201 SellerProductDetail |
| GET / PUT / DELETE | `/seller/products/{id}` | 🛒 | Chi tiết / sửa / xoá (quy tắc mục 3.2; xoá chỉ khi chưa có đơn, ngược lại 409 → dùng ẩn) |
| POST | `/seller/products/{id}/images` | 🛒 | Upload ảnh (multipart `files` — 1 hoặc nhiều phần cùng tên — hoặc `file`; tổng tối đa 5 ảnh/sản phẩm) → 201 ProductImages. Mỗi ảnh gửi AI gắn nhãn, tạo 1 `ai_results` theo bảng quy tắc mục 3.3 (AI lỗi vẫn lưu ảnh) |
| DELETE | `/seller/products/{id}/images/{imageId}` | 🛒 | Xoá ảnh (xoá ảnh chính → ảnh đầu tiên còn lại thành ảnh chính) → ProductImages |
| PATCH | `/seller/products/{id}/images/{imageId}/primary` | 🛒 | Đặt ảnh chính → ProductImages |
| POST | `/seller/products/{id}/submit` | 🛒 | DRAFT/REJECTED/NEED_INFO → PENDING → SellerProductDetail (điều kiện mục 3.2, gồm "không còn ảnh RETAKE_REQUESTED") |
| PATCH | `/seller/products/{id}/visibility` | 🛒 | `{ "hidden": true }` ẩn (chỉ APPROVED) / `false` bỏ ẩn (403 nếu `hiddenBy = ADMIN`) → SellerProduct |
| PATCH | `/seller/products/{id}/stock` | 🛒 | `{ "stockQuantity": 100 }` — mọi trạng thái, không cần duyệt lại → SellerProduct |
| GET | `/seller/orders` | 🛒 | Đơn của shop (`status` 1 hoặc nhiều giá trị; `from`, `to` dạng `yyyy-MM-dd` theo ngày đặt, bao gồm 2 đầu; `page`, `size`) → trang OrderSummary |
| GET | `/seller/orders/{id}` | 🛒 | Chi tiết (khuôn "Order (detail)" mục 4.6; đơn shop khác → 404) |
| PATCH | `/seller/orders/{id}/status` | 🛒 | `{ "status": "CONFIRMED", "note": "..." }` theo bảng 3.5. Huỷ: `{ "status": "CANCELLED", "cancelReason": "..." }` (thiếu lý do → 400) → Order (detail) |
| GET | `/seller/ai/results` | 🛒 | Kết quả AI các ảnh sản phẩm của shop, mới nhất trước (`reviewStatus` 1 hoặc nhiều giá trị, `page`, `size`) |

Quy ước chung của nhóm `/seller/**`: luôn làm việc trong shop của người đang đăng nhập — sản phẩm / đơn / ảnh của shop khác trả **404** như không tồn tại. Tài khoản chưa có shop (ví dụ ADMIN) → 404 `"Tài khoản chưa có shop"`. Giá trị enum lạ trong `status` / `reviewStatus` → 400.

**Shop** (register, GET/PUT shop):
```json
{ "id": 3, "shopName": "Vườn rau Tâm An", "description": "…", "province": "Lâm Đồng", "address": "Đường Mimosa, Phường 10, Đà Lạt",
  "phone": "0901234567", "logoUrl": "/uploads/logos/….png", "status": "ACTIVE", "ratingAvg": 4.8, "ratingCount": 56,
  "verifiedAt": "...", "createdAt": "..." }
```
Validation: `shopName` 3–150; `province` bắt buộc ≤ 100; `address` bắt buộc ≤ 255; `phone` 9–11 chữ số; `description` ≤ 2000.

**GET /seller/dashboard/summary**:
```json
{ "todayRevenue": 90000, "pendingOrders": 2,
  "productsByStatus": { "DRAFT": 0, "PENDING": 1, "APPROVED": 3, "REJECTED": 0, "NEED_INFO": 0, "HIDDEN": 0 },
  "aiFlags": { "pendingReview": 4, "retakeRequested": 1, "rotten": 0 } }
```
`todayRevenue` = tổng `total` các đơn DELIVERED có `delivered_at` trong hôm nay. `productsByStatus` luôn đủ 6 khoá. `aiFlags` = số ảnh đang chờ admin kiểm định / bị yêu cầu chụp lại / có nhãn hiển thị ROTTEN.

**POST /seller/products** — body (PUT dùng chung):
```json
{ "name": "Cà chua bi Đà Lạt", "categoryId": 5, "description": "Trồng nhà kính, thu hoạch trong ngày…", "price": 45000, "unit": "kg", "stockQuantity": 120, "origin": "Đà Lạt, Lâm Đồng" }
```
Validation: `name` 3–200; `price` > 0; `stockQuantity` ≥ 0; `unit` 1–20; `origin` ≤ 150; `description` ≤ 5000; `categoryId` phải tồn tại & active (sai → 400). `slug` backend tự sinh (tên không dấu + hậu tố ngẫu nhiên), không đổi khi sửa tên.

**SellerProduct** (1 dòng danh sách; cũng trả về sau `visibility` / `stock`):
```json
{ "id": 1187, "name": "Cà chua bi Đà Lạt", "slug": "ca-chua-bi-da-lat-2k9f1", "price": 45000, "unit": "kg",
  "stockQuantity": 120, "soldCount": 214, "status": "REJECTED", "hiddenBy": null, "rejectReason": "Ảnh có dấu hiệu hỏng",
  "aiOverallLabel": "UNCERTAIN", "aiOverallConfidence": 0.0, "primaryImageUrl": "/uploads/products/1187/….jpg",
  "category": { "id": 5, "name": "Củ quả" }, "createdAt": "...", "updatedAt": "..." }
```
**SellerProductDetail** = SellerProduct + `description`, `origin`, `ratingAvg`, `ratingCount`, `approvedAt`, `images` (khuôn như ProductImages bên dưới).

**ProductImages** (upload / xoá ảnh / đặt ảnh chính) — trả **toàn bộ** ảnh hiện tại, kèm `status` vì sửa ảnh sản phẩm đã duyệt sẽ về PENDING:
```json
{ "productId": 1187, "status": "DRAFT",
  "images": [
    { "id": 501, "url": "/uploads/products/1187/….png", "isPrimary": true, "displayOrder": 1,
      "ai": { "id": 9001, "produce": "tomato", "label": "FRESH", "confidence": 0.8, "finalLabel": null,
              "reviewStatus": "PENDING_REVIEW", "note": "tomato_fresh (80%) — dưới ngưỡng tự chấp nhận 90%" } }
  ],
  "aiOverallLabel": "FRESH", "aiOverallConfidence": 0.8 }
```

**OrderSummary** (1 dòng GET /seller/orders):
```json
{ "id": 5011, "orderCode": "DH-2026-01187", "status": "PENDING", "paymentMethod": "COD", "paymentStatus": "UNPAID",
  "customer": { "id": 12, "fullName": "Trần Thị Mai", "phone": "0912345678" }, "receiverName": "Trần Thị Mai", "phone": "0912345678",
  "items": [ { "productId": 1187, "productName": "Cà chua bi Đà Lạt", "unit": "kg", "quantity": 2 } ], "itemCount": 1,
  "subtotal": 90000, "shippingFee": 20000, "total": 110000, "createdAt": "..." }
```

**SellerAiResult** (1 dòng GET /seller/ai/results — có `product.id` để frontend dẫn tới trang sửa sản phẩm):
```json
{ "id": 9001, "product": { "id": 1187, "name": "Cà chua bi Đà Lạt", "status": "PENDING" }, "imageId": 501,
  "imageUrl": "/uploads/products/1187/….png", "produce": null, "label": "UNCERTAIN", "confidence": 0.0, "finalLabel": null,
  "reviewStatus": "PENDING_REVIEW", "note": "…", "reviewedAt": null, "createdAt": "..." }
```

### 4.9 Quản trị (`/api/admin`) 🛡

**Dashboard**

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/dashboard/summary` | `{ "todayRevenue", "revenueChangePct", "newOrdersToday", "pendingOrders", "pendingProducts", "aiPendingReview", "aiRottenFlags", "pendingShops", "totalCustomers", "totalShops" }` |
| GET | `/admin/dashboard/revenue?days=7` | `[ { "date": "2026-09-07", "revenue": 12450000, "orders": 37 } ]` (tính từ đơn DELIVERED theo `delivered_at`) |
| GET | `/admin/dashboard/recent-orders?limit=5` | Đơn mới nhất (rút gọn) |
| GET | `/admin/dashboard/pending-products?limit=5` | Sản phẩm chờ duyệt (kèm nhãn AI) |

**Sản phẩm & duyệt**

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/products` | Mọi trạng thái. Query: `status`, `keyword`, `categoryId`, `shopId`, `aiLabel`, `from`, `to`, `page`, `size`. Mặc định sort `createdAt,desc` |
| GET | `/admin/products/{id}` | Chi tiết + ảnh + AI từng ảnh + thông tin shop (số SP đã duyệt / từ chối) + lịch sử duyệt |
| PATCH | `/admin/products/{id}/review` | `{ "action": "APPROVE" \| "REJECT" \| "NEED_INFO" \| "HIDE" \| "UNHIDE", "reason": "…" }` — `reason` bắt buộc với REJECT/NEED_INFO |
| PATCH | `/admin/products/review-bulk` | `{ "productIds": [ ], "action": "APPROVE" \| "REJECT", "reason" }` → `{ "succeeded": 2, "failed": [ { "productId", "message" } ] }` — xử lý từng sản phẩm **độc lập** (partial success), sản phẩm sai trạng thái / không tồn tại / thiếu reason vào `failed` |

Quy tắc review (v1.4, theo mục 3.2): APPROVE / REJECT / NEED_INFO chỉ từ **PENDING**; APPROVE đặt `approvedAt`, xoá `rejectReason`; REJECT / NEED_INFO lưu `reason` vào `rejectReason`; HIDE chỉ từ APPROVED (`hiddenBy = ADMIN`); UNHIDE chỉ từ HIDDEN → APPROVED (admin bỏ ẩn được cả hàng người bán tự ẩn). Sai trạng thái → 409 `"Không thể {thao tác} sản phẩm đang ở trạng thái {status}"`. Mỗi thao tác (kể cả người bán `submit`) ghi 1 dòng `product_review_history`.

`AdminProduct` (1 dòng `GET /admin/products`) = SellerProduct (mục 4.8) + `shop { id, shopName }` + `approvedAt`.
`AdminProductDetail` (`GET /admin/products/{id}`, cũng là response của review):
```json
{ "id": 1187, "name": "Cà chua bi Đà Lạt", "slug": "...", "description": "...", "price": 45000, "unit": "kg", "stockQuantity": 120, "origin": "Đà Lạt",
  "soldCount": 0, "ratingAvg": 0, "ratingCount": 0, "status": "PENDING", "hiddenBy": null, "rejectReason": null,
  "aiOverallLabel": "UNCERTAIN", "aiOverallConfidence": 0, "primaryImageUrl": "/uploads/...", "category": { "id": 2, "name": "Củ quả" },
  "shop": { "id": 3, "shopName": "Vườn rau Tâm An", "phone": "0905111222", "status": "ACTIVE", "productCounts": { "approved": 4, "rejected": 1 } },
  "images": [ { "id": 9, "url": "...", "isPrimary": true, "displayOrder": 1, "ai": { "id", "produce", "label", "confidence", "finalLabel", "reviewStatus", "note" } } ],
  "reviewHistory": [ { "id": 1, "action": "SUBMIT", "fromStatus": "DRAFT", "toStatus": "PENDING", "actorName": "Nguyễn Văn Tâm", "actorRole": "SELLER", "reason": null, "createdAt": "..." } ],
  "approvedAt": null, "createdAt": "...", "updatedAt": "..." }
```

**Đơn hàng**

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/orders` | Query: `status`, `keyword` (mã đơn/tên/SĐT khách), `shopId`, `paymentMethod`, `from`, `to`, `page`, `size` |
| GET | `/admin/orders/{id}` | Chi tiết (như 4.6) |
| PATCH | `/admin/orders/{id}/status` | `{ "status", "note" }` theo bảng 3.5 |

**Người dùng & shop**

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/users` | Query: `role`, `status`, `keyword`, `page`, `size` → `{ id, fullName, email, phone, role, status, accountTier, provider, createdAt, shop: { id, shopName, status } \| null }` |
| PATCH | `/admin/users/{id}/status` | `{ "action": "LOCK" \| "UNLOCK" }` (không tự khoá chính mình) |
| PATCH | `/admin/users/{id}/tier` | `{ "tier": "STANDARD" \| "PREMIUM" }` — gán thủ công cấp tài khoản; **giải pháp demo cơ chế Premium** (mục 3.3/9) |
| POST | `/admin/users` | Tạo tài khoản ADMIN khác `{ fullName, email, password }` |
| GET | `/admin/shops` | Query: `status`, `keyword`, `province`, `page`, `size` → kèm `productCounts: { approved, pending, rejected }`, `orderCount`, `ratingAvg` |
| GET | `/admin/shops/{id}` | Chi tiết shop + chủ shop |
| PATCH | `/admin/shops/{id}/status` | `{ "action": "VERIFY" \| "LOCK" \| "UNLOCK", "reason" }` — VERIFY: shop ACTIVE + user role SELLER |

**Danh mục**: xem 4.3.

**Kiểm định AI** (v1.6 — đã làm, `AdminAiController`; chỉ kết quả của ảnh sản phẩm `source = PRODUCT_IMAGE`, QUICK_CHECK của khách không thuộc màn này)

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/admin/ai/results` | Query: `reviewStatus` (1 hoặc nhiều giá trị cách dấu phẩy, mặc định `PENDING_REVIEW`), `label` (nhãn hiển thị `finalLabel ?? label`), `shopId`, `produce` (vd `mango`, không phân biệt hoa thường), `from`, `to` (`yyyy-MM-dd` theo ngày tạo, bao gồm 2 đầu), `sort` = `oldest` (mặc định — chờ lâu xử lý trước) \| `newest`, `page`, `size` (mặc định 12) → trang `AdminAiResult` |
| GET | `/admin/ai/results/{id}` | `AdminAiResult` |
| PATCH | `/admin/ai/results/{id}/review` | `{ "action": "ACCEPT" \| "CORRECT" \| "RETAKE", "finalLabel": "FRESH" \| "ROTTEN", "note": "…" }` → `AdminAiResult` (quy tắc bên dưới) |
| PATCH | `/admin/ai/results/accept-bulk` | `{ "minConfidence": 0.95 }` (0.5–1) → `{ "succeeded": 7 }` — chấp nhận mọi ảnh **trong hàng chờ** có nhãn FRESH và confidence ≥ ngưỡng |
| POST | `/admin/ai/classify` | "Thử mô hình": multipart `file` hoặc `image` (JPG/PNG/WEBP ≤ 5 MB) → kết quả thô của model, **không** áp bảng quy tắc, **không** lưu |
| GET | `/admin/ai/settings` | `{ "autoAcceptThreshold": 0.9, "reviewThreshold": 0.7, "modelVersion": "mobilenetv2-pt-v1", "aiOnline": true }` |
| PUT | `/admin/ai/settings` | `{ "autoAcceptThreshold": 0.85, "reviewThreshold": 0.7 }`, điều kiện `0 < reviewThreshold < autoAcceptThreshold ≤ 1` → như GET, `message = "Đã lưu ngưỡng tin cậy"` |
| GET | `/admin/ai/statistics?from=&to=` | Thống kê theo ngày tạo (bỏ trống = mọi lúc), khuôn bên dưới |

**Hàng chờ** = ảnh `PENDING_REVIEW` của sản phẩm `PENDING` / `APPROVED` / `HIDDEN`. Ảnh chờ của sản phẩm `DRAFT` / `NEED_INFO` / `REJECTED` (đang là lượt của người bán) **không** hiện kể cả khi lọc `reviewStatus=PENDING_REVIEW`; kết quả đã kiểm định (`ACCEPTED` / `CORRECTED` / `RETAKE_REQUESTED`) và `AUTO_ACCEPTED` lọc xem được ở mọi trạng thái sản phẩm. `pendingReview` (thống kê) và badge menu "Kiểm định AI" đếm đúng điều kiện này.

`AdminAiResult` (1 dòng danh sách, chi tiết, response của review):
```json
{ "id": 9001, "imageUrl": "/uploads/products/12/ab.jpg", "produce": "mango", "label": "ROTTEN", "confidence": 0.97,
  "finalLabel": null, "displayLabel": "ROTTEN", "reviewStatus": "PENDING_REVIEW",
  "note": "AI phát hiện hỏng: mango_rotten (97%) — chờ admin xác nhận", "modelVersion": "mobilenetv2-pt-v1",
  "inferenceMs": 180, "createdAt": "...", "reviewedAt": null, "reviewedBy": null,
  "product": { "id": 12, "name": "Xoài cát Chu", "status": "PENDING", "categoryName": "Trái cây" },
  "shop": { "id": 2, "shopName": "HTX Xoài Cao Lãnh" } }
```
`displayLabel = finalLabel ?? label`; `reviewedBy` = `{ "id", "fullName" }` của admin sau khi kiểm định. Ảnh AI lỗi: `produce`, `modelVersion` null, `confidence` 0.

Quy tắc review:
- Chỉ kiểm định được ảnh `PENDING_REVIEW` hoặc `AUTO_ACCEPTED` (AI tự chấp nhận sai thì admin vẫn sửa được); ảnh đã `ACCEPTED` / `CORRECTED` / `RETAKE_REQUESTED` → 409 `"Kết quả AI #{id} đã được kiểm định ({status})"`.
- `ACCEPT`: giữ nhãn AI → `ACCEPTED`. Ảnh có nhãn `UNCERTAIN` → 400 (không có gì để chấp nhận, phải chọn Tươi/Hỏng bằng CORRECT).
- `CORRECT`: `finalLabel` bắt buộc, chỉ `FRESH` | `ROTTEN` (thiếu / UNCERTAIN → 400) → `CORRECTED` + lưu `final_label`. `finalLabel` trùng nhãn AI → tính như `ACCEPT` (`final_label` để null, không thổi phồng `correctedByAdmin`).
- `RETAKE`: `note` bắt buộc (thiếu → 400) → `RETAKE_REQUESTED`. Sản phẩm đang `PENDING` → `NEED_INFO`, `reject_reason = "Ảnh cần chụp lại: {note}"`, ghi 1 dòng `product_review_history` (action `NEED_INFO`, actor = admin). Trạng thái khác chỉ đánh dấu ảnh. Người bán phải xoá ảnh đó và tải ảnh mới mới gửi duyệt lại được (mục 3.2).
- `note` (≤ 500, tuỳ chọn với ACCEPT / CORRECT) được **nối sau** ghi chú AI: `"{ghi chú AI} | Admin: {note}"` (AI không có ghi chú → `"Admin: {note}"`), cắt ở 500 ký tự.
- Mọi thao tác (kể cả accept-bulk) ghi `reviewed_by`, `reviewed_at` và tính lại `ai_overall_label` của sản phẩm.

`POST /admin/ai/classify` response:
```json
{ "label": "apple_fresh", "produce": "apple", "condition": "fresh", "confidence": 0.9531,
  "top": [ { "label": "apple_fresh", "score": 0.9531 }, { "label": "pomegranate_fresh", "score": 0.0214 }, { "label": "apple_rotten", "score": 0.0102 } ],
  "modelVersion": "mobilenetv2-pt-v1", "inferenceMs": 210 }
```
`top` = 3 lớp điểm cao nhất trong `all_scores` (AI không trả `all_scores` → chỉ lớp được chọn); `inferenceMs` đo ở backend. Không có file → 400; ảnh sai định dạng / > 5 MB → 400 (như upload, mục 6); AI tắt / lỗi / timeout → **503** `"AI service không phản hồi, thử lại sau"`.

`GET / PUT /admin/ai/settings`: 2 ngưỡng đọc/ghi bảng `settings` (mục 3.3); `modelVersion` + `aiOnline` lấy từ `GET /health` của AI service (`aiOnline` = trả lời được **và** `model_loaded = true`). AI tắt → `modelVersion: null`, `aiOnline: false` (API vẫn 200). PUT: thiếu field → 400; `autoAcceptThreshold > 1`, `reviewThreshold ≤ 0` hoặc `reviewThreshold ≥ autoAcceptThreshold` → 400. Đổi ngưỡng không gắn lại nhãn ảnh cũ.

`GET /admin/ai/statistics`:
```json
{ "totalClassified": 1240,
  "byLabel": { "FRESH": 1100, "ROTTEN": 95, "UNCERTAIN": 45 },
  "byReviewStatus": { "AUTO_ACCEPTED": 980, "PENDING_REVIEW": 32, "ACCEPTED": 200, "CORRECTED": 12, "RETAKE_REQUESTED": 16 },
  "avgConfidence": 0.9132, "pendingReview": 32, "correctedByAdmin": 12, "aiUnavailable": 20 }
```
- `totalClassified` = mọi ảnh sản phẩm tạo trong khoảng (kể cả AI lỗi) = tổng `byLabel` = tổng `byReviewStatus`; 2 map luôn đủ khoá.
- `byLabel` theo nhãn hiển thị (`finalLabel ?? label`); `avgConfidence` bỏ qua ảnh AI lỗi, `null` khi không có ảnh; `correctedByAdmin` = số `CORRECTED`; `aiUnavailable` = số ảnh AI tắt/lỗi (`model_version` null).
- `pendingReview` = số đang chờ **hiện tại** theo điều kiện hàng chờ, **không** lọc ngày (có thể khác `byReviewStatus.PENDING_REVIEW`).

Lỗi chung: id không tồn tại (hoặc là QUICK_CHECK) → 404 `"Không tìm thấy kết quả AI #{id}"`; enum lạ trong `reviewStatus` / `label` / `action` / `finalLabel`, `sort` khác `oldest|newest`, ngày sai định dạng hoặc `from > to` → 400.

---

## 5. Hợp đồng AI service (nội bộ, FastAPI, cổng 8000)

Backend là **client duy nhất** của AI service (frontend không gọi thẳng).

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/health` | `{ "status": "UP", "model_loaded": true, "model_version": "mobilenetv2-pt-v1", "num_classes": 28, "labels": [ "apple_fresh", ... ], "device": "cpu", "error": null }` |
| POST | `/classify` (bí danh `/predict`) | multipart field **`image`** (JPG/PNG/WEBP — backend đã giới hạn ≤ 5 MB trước khi gửi) |

**POST /classify** response 200 (v1.5, thống nhất với CLAUDE.md mục 7):
```json
{ "label": "tomato_fresh", "produce_type": "tomato", "condition": "fresh", "confidence": 0.9412,
  "all_scores": { "apple_fresh": 0.0012, "...": 0.0, "tomato_fresh": 0.9412, "tomato_rotten": 0.0401 },
  "model_version": "mobilenetv2-pt-v1" }
```
- `label` = tên lớp lúc train `{loại}_{tình trạng}`; `produce_type` = loại (tiếng Anh, chữ thường: `apple`, `bellpepper`...); `condition` ∈ `fresh | rotten`; `confidence` **0..1**; `all_scores` đủ 28 lớp. Backend lưu `produce_type` vào `ai_results.produce`, map `fresh → FRESH`, `rotten → ROTTEN`, và áp ngưỡng (mục 3.3).
- Lỗi: 400 không phải ảnh / file rỗng; 422 ảnh hỏng không đọc được; **503 model chưa nạp** (thiếu/hỏng file `.pth`, service vẫn chạy). Body lỗi `{ "detail": "..." }` (mặc định FastAPI). Backend timeout 5 giây; mọi lỗi/timeout → `UNCERTAIN` + `PENDING_REVIEW` (dòng 1 bảng quy tắc mục 3.3).

**Phía backend** (v1.6, `service/AiServiceClient`, DTO `dto/ai/AiPrediction`, `AiHealth`):
- `RestClient` tới `app.ai.base-url`; read timeout `app.ai.timeout-ms` (5000), connect timeout = min(2s, timeout). `app.ai.enabled=false` → không gọi mạng, coi như AI không có kết quả.
- `POST /classify`: part `image` gửi kèm **filename + content-type của ảnh** (FastAPI trả 400 nếu part không phải `image/*`). Ảnh đã qua kiểm tra định dạng/kích thước của backend trước khi gửi.
- Lỗi gì (không kết nối được, timeout, 4xx/5xx, 503, JSON sai hợp đồng: thiếu `label` / `produce_type`, `condition` ngoài `fresh|rotten`, `confidence` ngoài 0..1) → client trả rỗng + log 1 dòng cảnh báo, **không ném lỗi** → nơi gọi áp dòng 1 (ảnh sản phẩm) hoặc trả 503 (`/admin/ai/classify`).
- `GET /health` chỉ dùng cho `GET/PUT /admin/ai/settings` (`modelVersion`, `aiOnline = model_loaded`).
- Tiền xử lý bên trong service: RGB, resize 128×128, chuẩn hoá mean/std ImageNet (giống `val_transform` lúc train). Model file `models/mobilenetv2_fruitquality_best.pth` (PyTorch, chứa luôn `class_names` + `image_size`).
- Mô hình hiện tại 28 lớp (14 loại × tươi/hỏng), accuracy test 96,78%. Hợp đồng API **không đổi** khi đổi mô hình; train lại thì tăng `model_version`.

---

## 6. Upload & file tĩnh

- Multipart field: `file` (1 ảnh) hoặc `files` (nhiều ảnh). Chấp nhận `image/jpeg`, `image/png`, `image/webp`; ≤ 5 MB/ảnh; tối đa 5 ảnh/sản phẩm. Backend kiểm tra cả content-type **và chữ ký đầu file** (file đổi đuôi thành .png vẫn bị 400). Upload nhiều ảnh: kiểm tra hết trước khi lưu — 1 ảnh sai thì không lưu ảnh nào.
- Lưu tại `UPLOAD_DIR/products/{productId}/{uuid}.{ext}`, `UPLOAD_DIR/ai/{aiResultId}.{ext}`, `UPLOAD_DIR/avatars/`, `UPLOAD_DIR/logos/` (`UPLOAD_DIR` mặc định `uploads`, tương đối theo thư mục chạy backend, đã gitignore). Trả URL tương đối `/uploads/...`; frontend ghép với origin của backend (bỏ đuôi `/api` của `VITE_API_URL`). Xoá ảnh / sản phẩm / đổi logo thì xoá luôn file cũ.
- `GET /uploads/**` công khai (Spring `ResourceHandlerRegistry`).

---

## 7. Dữ liệu mẫu (seed khi chạy lần đầu, `CommandLineRunner` hoặc `AdminSeeder`)

| Loại | Dữ liệu |
|---|---|
| Admin | `admin@nongsan.local` (hoặc `admin@nongsan.vn`) / `Admin@123` |
| Người bán (shop ACTIVE) | `taman@nongsan.vn` / `Seller@123` — shop "Vườn rau Tâm An" (Lâm Đồng); `caolanh@nongsan.vn` / `Seller@123` — "HTX Xoài Cao Lãnh" (Đồng Tháp) |
| Người bán chờ xác minh | `mocchau@nongsan.vn` / `Seller@123` — "Vườn dâu Mộc Châu" (PENDING_VERIFICATION) |
| Khách | `mai@nongsan.vn` / `Customer@123`, `nam@nongsan.vn` / `Customer@123` |
| **Seed thực tế trong code (30/09/2026)** | `AdminSeeder`: `admin@nongsan.local` / `Admin@123`. `ProductSeeder`: `seller@nongsan.local` / `Seller@123` (Vườn rau Tâm An), `caolanh@nongsan.local` / `Seller@123` (HTX Xoài Cao Lãnh), danh mục + sản phẩm mẫu. `OrderSeeder`: `customer@nongsan.local` / `Customer@123` + 6 đơn mẫu của Tâm An (2 PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED) — chỉ chạy khi bảng `orders` trống |
| Danh mục | Rau củ (Rau ăn lá, Củ quả, Nấm) · Trái cây (Trái cây nhiệt đới, Trái cây nhập khẩu) · Thực phẩm khô · Đặc sản vùng miền |
| Sản phẩm | ≥ 12 sản phẩm APPROVED chia đều 2 shop (cà chua bi, xoài cát, rau muống, chuối tiêu, khoai tây, cam sành, ớt chuông, dâu tây…), 2 sản phẩm PENDING, 1 REJECTED; ảnh placeholder |
| `aiProduceKeys` danh mục (v1.6, khớp 14 loại model biết) | **Trái cây** `mango,apple,banana,orange,strawberry,grape,guava,jujube,pomegranate` · **Củ quả** `tomato,potato,carrot,bellpepper,cucumber` · **Rau lá** `cabbage,lettuce` (model chưa có → ảnh rau lá luôn UNCERTAIN). `ProductSeeder` không chạy lại trên DB đã có dữ liệu → chạy tay `UPDATE categories SET ai_produce_keys = '…' WHERE name = N'Trái cây'` / `N'Củ quả'` (docs/1910.md mục 7.4) |
| Settings | Chỉ seed bằng script `07_settings.sql`: `ai.auto_accept_threshold=0.90`, `ai.review_threshold=0.70` (không seed `model_version`). DB do `ddl-auto` tạo thì bảng trống → backend dùng mặc định `app.ai.*` (cùng giá trị) |

---

## 8. Frontend – các trang cần có

| Khu vực | Trang |
|---|---|
| Khách hàng (`/`) | Trang chủ (danh mục + sản phẩm nổi bật) · Danh sách/tìm kiếm · Chi tiết sản phẩm (ảnh + nhãn AI, đánh giá) · Trang shop · Giỏ hàng (nhóm theo shop) · Thanh toán (chọn địa chỉ, COD) · Đơn hàng của tôi + chi tiết + huỷ · Hồ sơ, sổ địa chỉ, đổi mật khẩu · **Kiểm tra AI (🔒 Premium) + lịch sử** · Đăng ký / đăng nhập (email + nút Google) · Đăng ký bán hàng |
| Người bán (`/seller`) | Tổng quan · Sản phẩm (danh sách theo trạng thái, tạo/sửa, upload ảnh → thấy nhãn AI, submit) · Đơn hàng của shop + đổi trạng thái · Thông tin shop · Kết quả AI của shop |
| Admin (`/admin`) | Tổng quan · Sản phẩm (duyệt, có nhãn AI) + chi tiết duyệt · Đơn hàng + chi tiết · Người dùng (khách / người bán / admin) · Shop (xác minh, khoá) · Danh mục · Kiểm định AI (hàng chờ, kiểm tra nhanh, ngưỡng & thống kê — đã làm v1.6 tại `/admin/ai-review`) — theo 5 wireframe đã duyệt |

Quy ước frontend:
- Lưu JWT trong `localStorage["agri_token"]`; Axios interceptor gắn header `Authorization: Bearer <token>` và tự đăng xuất khi 401 (trừ API `/auth/**`);
- Route guard theo `role` (sử dụng component `RequireAuth`);
- Hiển thị nhãn AI bằng badge: FRESH = viền xanh, ROTTEN = nền tối/viền đỏ cảnh báo, UNCERTAIN = nét đứt vàng;
- **Mục "Kiểm tra AI" trên Navbar**: luôn hiển thị trong menu khách hàng. Nếu tài khoản `STANDARD` bấm vào thì hiển thị biểu tượng khoá 🔒 + thông báo tính năng dành riêng cho tài khoản Premium thay vì mở form tải ảnh (không ẩn hẳn để khách nhận biết tính năng tồn tại).

---

## 9. Ngoài phạm vi v1 (để dành v2)

Refresh token · quên mật khẩu qua OTP/email · thanh toán online VNPay/Momo · mã khuyến mãi · danh sách yêu thích · sản phẩm liên quan · thông báo trong app/email · kho tập trung + kiểm định AI lúc nhập kho + lô hàng/hạn dùng/FEFO · đối soát & hoa hồng người bán · chat khách–người bán · đơn vị vận chuyển tích hợp API · **cơ chế tự động nâng cấp tài khoản lên Premium** (cổng thanh toán hoặc tiêu chí tích điểm/mua hàng — schema `account_tier` và API `/api/ai/classify`, `/api/ai/history` đã sẵn sàng ở mục 3.3/4.7; trong v1 admin sẽ gán thủ công qua `PATCH /admin/users/{id}/tier` để demo tính năng).

---

## 10. Checklist cho phát triển hệ thống

1. Tạo skeleton 3 thư mục (`frontend`, `backend`, `ai`), file cấu hình môi trường.
2. Backend: entity + repository theo mục 2 → security/JWT + Google (4.1) → upload & AI client (5, 6) → seller products/images (4.8) → cart/checkout/orders (4.5, 4.6, 3.4, 3.5) → admin (4.9) → seed (7) → Swagger.
3. AI khách hàng (mục 4.7): gác cổng bằng `account_tier = PREMIUM`; admin có API gán tier để demo.
4. AI service: `ai/ai/main.py` với `/health`, `/classify` (bí danh `/predict`) theo mục 5; thiếu model thì trả 503 để backend đưa ảnh vào hàng chờ admin (web không bị chặn).
5. Frontend theo mục 8, gọi API đúng hợp đồng; dùng dữ liệu seed và mock để demo.
6. Kiểm thử luồng chính: đăng ký → đăng ký shop → admin xác minh → người bán đăng sản phẩm + ảnh (thấy nhãn AI) → admin duyệt → khách mua 2 shop 1 lần (tách 2 đơn) → người bán giao → khách đánh giá.

---

## 11. Nhật ký cập nhật & Đồng bộ Codebase (Changelog)

### Phiên bản v1.6 (19/10/2026) — Nối AI vào backend + admin kiểm định AI (nhánh `feat/ai-integration-admin-review`)
- Quyết định + ví dụ minh hoạ: [`1910.md`](1910.md) — 5 câu hỏi **chốt tạm theo phương án ★** để kịp mốc, nhóm xem lại (đổi được, phần lớn chỉ vài dòng logic).
- **Nối AI service**: ảnh sản phẩm mới gửi `POST /classify` (`AiServiceClient`), áp **bảng quy tắc 6 dòng** mục 3.3 trong `ProductAiLabeler`: 2 ngưỡng 0.90 / 0.70, chỉ ảnh **tươi** ≥ 0.90 tự chấp nhận, mọi ảnh hỏng vào hàng chờ, thêm **luật danh mục** (`produce_type` ∉ `aiProduceKeys` → UNCERTAIN). Sửa lỗi bản cũ "còn lại → AUTO_ACCEPTED". Timeout 5s, 1 ảnh lỗi thì các ảnh sau cùng lần tải không gọi AI; `app.ai.enabled=false` tắt hẳn (test H2).
- **API kiểm định AI** (mục 4.9, đủ 8 endpoint `/admin/ai/**`): hàng chờ chỉ gồm ảnh của sản phẩm PENDING / APPROVED / HIDDEN; review ACCEPT / CORRECT / RETAKE (RETAKE chỉ đổi sản phẩm PENDING → NEED_INFO); accept-bulk; thử mô hình (top 3, không lưu); ngưỡng; thống kê (thêm `byReviewStatus`, `aiUnavailable`). Settings response thêm `aiOnline`, `modelVersion` lấy từ AI `/health`.
- **Người bán**: `submit` chặn khi còn ảnh `RETAKE_REQUESTED` (mục 3.2).
- **DB**: **bảng mới `settings`** (`07_settings.sql`, có trong ERD từ đầu nhưng chưa tạo) — bỏ khoá `ai.model_version` khỏi seed. Seed `aiProduceKeys` khớp 14 loại model; DB cũ chạy tay `UPDATE` (mục 7). Không đổi bảng/cột khác. Nhãn admin sửa để train lại: dùng `ai_results` (`CORRECTED`), **không** thêm bảng riêng.
- **Cấu hình**: `AI_ENABLED`, `AI_AUTO_ACCEPT_THRESHOLD` (0.90, thay 1 ngưỡng 0.85 cũ), `AI_REVIEW_THRESHOLD` (0.70), `AI_TIMEOUT_MS` (5000).
- **Frontend**: màn `/admin/ai-review` (`AdminAiReviewPage`: Hàng chờ · Thử mô hình · Ngưỡng & thống kê), nút kiểm định từng ảnh ở trang chi tiết duyệt sản phẩm (`AiReviewActions`), badge menu "Kiểm định AI" = `pendingReview` thật; "Kết quả AI của shop" của người bán gọi `/seller/ai/results` thật.
- Test MockMvc (H2): 98/98.
- **Chưa làm**: `/users/me` (hồ sơ, avatar), reviews sản phẩm, `/api/ai/**` khách (Premium), admin orders / users status-tier / shops list-detail / categories / dashboard, `/auth/change-password`.

### Phiên bản v1.5 (12/10/2026) — AI service PyTorch (nhánh `feat/ai-pytorch-model`)
- **Model thật** do Duy train (repo gốc `github.com/buianhduy205/ai`): PyTorch MobileNetV2, 28 lớp (14 loại × tươi/hỏng), accuracy test 96,78%. Thay khung TF/Keras chạy mock cũ; file `ai/models/mobilenetv2_fruitquality_best.pth` commit vào git.
- **Hợp đồng AI (mục 5) thống nhất với CLAUDE.md mục 7**: bỏ khuôn `produce/label/raw_class/top3/inference_ms` cũ; dùng `label, produce_type, condition, confidence (0..1), all_scores, model_version`. Endpoint `/classify` (bí danh `/predict`), field `image`. Thiếu model → 503 thay vì chế độ giả lập.
- Backend **chưa** gọi AI service — việc tiếp theo là sửa `ProductAiLabeler` theo hợp đồng này.

### Phiên bản v1.4 (11/10/2026) — Luồng khách hàng + admin duyệt sản phẩm (nhánh `feat/be-customer-flow`)
- **Đã làm**: sổ địa chỉ ghi (mục 4.2: POST / PUT / DELETE / PATCH default), giỏ hàng (4.5, đủ 5 API), checkout + đơn của khách + huỷ (4.6, đủ 4 API), admin sản phẩm (4.9: list / detail / review / review-bulk). Test MockMvc (H2): 46/46.
- **Bảng mới `product_review_history`** (script `06_product_review_history.sql`) — ngoài ERD gốc, thêm để trả "lịch sử duyệt" theo 4.9. Script `05_addresses_cart.sql` bổ sung cho 2 bảng `addresses`, `cart_items` (trước chỉ do ddl-auto tạo).
- **Chốt nghiệp vụ**: địa chỉ đầu tiên tự mặc định, xoá mặc định đôn địa chỉ cũ nhất; giỏ giữ nguyên dòng hết bán; checkout gộp lỗi "không còn bán" vào `errors[]` cùng thiếu hàng, lỗi nào cũng không tạo đơn; `orderCode` suy từ id; khách huỷ chỉ PENDING/CONFIRMED; review-bulk partial success; admin UNHIDE được cả hàng seller tự ẩn.
- **Kỹ thuật**: `SHIPPING_FEE_FLAT` map vào `app.order.shipping-fee-flat` (mặc định 20000); `AppException` mang được `errors[]` (409 checkout); trừ/hoàn tồn kho bằng UPDATE có điều kiện (`ProductRepository.deductStock/restoreStock`) an toàn khi đặt đồng thời; `OrderSupport` dùng chung huỷ đơn + Order(detail) cho seller và khách; `OrderSummary` thêm `shop`.
- **Chưa làm**: `/users/me` (hồ sơ, avatar), reviews sản phẩm, `/api/ai/**` khách, admin orders / users status-tier / shops list / dashboard / ai; nối AI service thật.

### Phiên bản v1.3 (30/09/2026) — API người bán + vá bảo mật (nhánh `feat/be-seller-api`)
- **Đã làm đủ 20 endpoint mục 4.8** + `PATCH /admin/shops/{id}/status` (VERIFY/LOCK/UNLOCK). Test MockMvc (H2) + chạy thật trên SQL Server.
- **Chốt nghiệp vụ** (mục 3.1, 3.2, 3.5): sản phẩm PENDING khoá sửa (chỉ sửa tồn kho); sửa mọi field trừ tồn kho của sản phẩm APPROVED/HIDDEN → PENDING; ảnh ROTTEN không chặn submit; huỷ đơn của người bán gửi `cancelReason`; shop LOCKED không tạo/gửi duyệt sản phẩm; ADMIN không đăng ký bán hàng; người bán phải đăng nhập lại sau khi được xác minh.
- **Hợp đồng mới**: khuôn JSON Shop, SellerProduct(Detail), ProductImages, OrderSummary, SellerAiResult, dashboard summary (`aiFlags` = `{ pendingReview, retakeRequested, rotten }`); tham số `status` / `reviewStatus` nhận nhiều giá trị cách dấu phẩy; upload nhận field `files` hoặc `file`.
- **AI**: chưa gọi AI service — ảnh mới vào hàng chờ admin kiểm định thủ công (mục 3.3). Hợp đồng AI thực tế của `ai/app/main.py` là `POST /classify` field `image` (xem CLAUDE.md mục 7), khác mục 5 (`/predict`) — cần chốt lại khi nối AI.
- **Auth**: `user` trong login/google/me có thêm `phone`, `accountTier`, `shopId`, `shopStatus`.
- **Vá bảo mật**: bỏ `GET /api/users`, `/api/users/{id}` (trả entity kèm `passwordHash` cho mọi user đã đăng nhập) → thay bằng `GET /admin/users`, `/admin/users/{id}` (DTO, chỉ ADMIN). Bỏ `/api/addresses/user/{userId}` (xem được địa chỉ người khác) → `GET /users/me/addresses`, `/users/me/addresses/{id}`. `passwordHash` gắn `@JsonIgnore`.
- **DB**: thêm bảng `orders`, `order_items`, `order_status_history` đúng ERD mục 2 (không đổi thiết kế); script `03_catalog.sql`, `04_orders.sql`. Enum `ShopStatus` trong code thêm `LOCKED` (các giá trị cũ `SUSPENDED/REJECTED/INACTIVE` chưa dùng, giữ lại chờ nhóm chốt bỏ).
- Lỗi JSON sai cú pháp / enum lạ / thiếu file multipart nay trả 400 thay vì 500.

### Phiên bản v1.2 (21/09/2026) — Hợp nhất Cơ chế Tài khoản Premium & Chuẩn hoá Monorepo
- **Cơ chế Phân cấp Tài khoản (AccountTier)**:
  - Thêm enum `AccountTier: STANDARD | PREMIUM` (mặc định `STANDARD` cho mọi tài khoản đăng ký mới).
  - Thêm cột `account_tier` vào bảng `users`.
  - Giới hạn tính năng "Kiểm tra AI của khách hàng" (`POST /api/ai/classify` và `GET /api/ai/history`): bắt buộc `account_tier = PREMIUM`. Tài khoản `STANDARD` nhận lỗi 403.
  - Bổ sung API Quản trị viên: `PATCH /admin/users/{id}/tier` để gán cấp bậc tài khoản thủ công phục vụ demo đồ án.
  - Cập nhật quy ước Frontend: hiển thị biểu tượng khoá 🔒 và popup/thông báo mời nâng cấp Premium cho tài khoản `STANDARD` khi truy cập trang Kiểm định AI khách hàng.
- **Đồng bộ Kỹ thuật Monorepo**:
  - Bảo toàn cấu trúc thực tế `Nhom5/` (`frontend/`, `backend/`, `ai/`).
  - Đồng bộ Tech stack thực tế: Java 21, Spring Boot 4.1.1, Nimbus JWT (Resource Server), Vite React 19, FastAPI MobileNetV2.
  - Giữ nguyên các biến môi trường chuẩn: `DB_USERNAME`, `JWT_EXPIRATION_MINUTES=1440`.

### Phiên bản v1.1 (21/09/2026) — Đồng bộ Auth & Bảo vệ Tuyến đường
- **Frontend `AuthContext.jsx`**:
  - Nhận và xử lý trường `accessToken` trả về từ Backend `AuthResponse`, lưu token chuẩn vào `localStorage["agri_token"]`.
  - Cập nhật logic `hasRole(role)`: So sánh trực tiếp chuỗi đơn lẻ `auth.user?.role === role` (`CUSTOMER`, `SELLER`, `ADMIN`).
- **Frontend `LoginPage.jsx`**:
  - Cập nhật điều hướng chính xác theo role: `ADMIN` → `/admin`, `SELLER` → `/seller`, `CUSTOMER` → `/`.
- **Frontend `RegisterPage.jsx`**:
  - Bổ sung trường bắt buộc **"Xác nhận mật khẩu" (`confirmPassword`)** khớp với DTO Backend. Mặc định luôn tạo tài khoản `CUSTOMER`.
- **Frontend Route Protection (`App.jsx`)**:
  - Bọc component [`RequireAuth`](file:///d:/Đồ%20án%20chuyên%20ngành/Nhom5/frontend/src/components/RequireAuth.jsx) bảo vệ các tuyến đường `/seller` và `/admin`.
- **Backend `application.properties`**:
  - Cập nhật `app.jwt.expiration-minutes=1440` (24 giờ).
