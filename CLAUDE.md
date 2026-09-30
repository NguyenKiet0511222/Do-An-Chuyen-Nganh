# CLAUDE.md — Nhóm 5: Sàn nông sản tích hợp AI phân loại chất lượng qua ảnh

Bộ nhớ chung cho Claude Code và thành viên nhóm. Đọc trước khi code. Đổi kiến trúc/quy ước thì sửa file này trong cùng PR.
Tài liệu gốc:
- Đặc tả + lộ trình 10 tuần: https://docs.google.com/document/d/1P3Km5mr04dpobGkg5GQQJQCycblGKlW9/edit
- Thiết kế auth (đăng ký/đăng nhập/phân quyền, Hà viết): https://docs.google.com/document/d/1zs8B7gs4j4jjKnYCWq3yFq3NYwvYiNR0/edit
- **Đặc tả API & Nghiệp vụ (Single Source of Truth)**: [`docs/api.md`](docs/api.md)


## 1. Dự án

Sàn TMĐT nông sản **nhiều người bán**. Người bán đăng sản phẩm kèm ảnh → **AI** gắn nhãn (loại nông sản, tươi/hỏng, % tin cậy) → **Admin chỉ kiểm duyệt** (không tự đăng hàng) → khách mua và thấy nhãn chất lượng.
Vai trò: `CUSTOMER`, `SELLER`, `ADMIN`. Đồ án 10 tuần, mốc kiểm tra tuần 3 / 5 / 7 / 9 (mục 9).

## 2. Kiến trúc — nguyên tắc KHÔNG được vi phạm

```
React (frontend) ──HTTP/JSON──▶ Spring Boot (backend = cổng duy nhất) ──JPA──▶ SQL Server
                                          └──────REST──────▶ AI service (Python FastAPI)
```

- Frontend **chỉ** gọi Spring Boot, và chỉ qua `frontend/src/services/api.js`. Không gọi thẳng AI service, không gọi DB.
- Spring Boot gọi AI service như một REST API bình thường (`app.ai.base-url`). **AI không được chặn tiến độ web**: AI tắt/lỗi thì vẫn cho đăng sản phẩm, đưa vào hàng chờ admin.
- Backend chỉ trả JSON (khuôn `ApiResponse`), không render HTML.
- Ưu tiên chạy được end-to-end (mục tiêu tuần 5) rồi mới tối ưu/làm đẹp.
- Cách làm mỗi feature: **backend trước → test bằng Postman/Swagger → mới gắn vào frontend.**

## 3. Cấu trúc repo

```
backend/   Spring Boot 4.1.1, Java 21 (pom), Maven wrapper       ← xem mục 5
frontend/  React 19 + Vite 8, react-router 7, axios, MUI 9         ← xem mục 6
ai/        Python FastAPI + TensorFlow/Keras (MobileNetV2)          ← xem mục 7
CLAUDE.md  file này
```

## 4. Lệnh thường dùng

| Việc | Lệnh |
|------|------|
| Backend chạy | `cd backend && mvnw.cmd -DskipTests package && java -jar target\backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local` → http://localhost:8080 (xem cảnh báo `spring-boot:run` bên dưới) |
| Backend test | `cd backend && mvnw.cmd test` (chạy trên H2, không cần SQL Server) |
| Swagger | http://localhost:8080/swagger-ui.html — Health: http://localhost:8080/api/health |
| Frontend | `cd frontend && npm install && npm run dev` → http://localhost:5173 |
| Frontend lint/build | `npm run lint` · `npm run build` |
| AI service | `cd ai && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000` → http://localhost:8000/docs |

**Cấu hình cục bộ (không commit):**
- Backend: copy `backend/src/main/resources/application-local.properties.example` → `application-local.properties`, chạy với profile `local`. Hoặc đặt biến môi trường `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AI_SERVICE_URL`, `CORS_ALLOWED_ORIGINS`.
- Frontend: copy `frontend/.env.example` → `.env`.
- AI: đặt model vào `ai/models/` (gitignore).

**JDK:** pom đặt `java.version=21`; máy có JDK 24/25 vẫn build được (`--release 21`). Không tự đổi `java.version` khi chưa thống nhất nhóm. Branch `appmod/java-upgrade-*` là của tool nâng cấp Java tự tạo, không làm việc trên đó.

**⚠️ `mvnw.cmd spring-boot:run` có thể lỗi `Could not find or load main class ...BackendApplication`** trên máy có đường dẫn project chứa dấu tiếng Việt/khoảng trắng (VD `D:\Đồ án chuyên ngành\Nhom5`) — nghi do Maven build classpath argfile bị vỡ trên Windows với path dạng này (đã xác nhận 28/09/2026, thử cả `-Dspring-boot.run.fork=false` cũng không hết). Class vẫn compile ra bình thường (`target/classes` có đủ `.class`). **Cách chạy ổn định đã test thật**: đóng gói jar rồi chạy trực tiếp bằng `java -jar` (lệnh ở bảng trên) — né hoàn toàn bước tính classpath của plugin. `run_backend.bat` / `backend/run.bat` hiện vẫn gọi `spring-boot:run` nên có thể dính lỗi này — nếu máy bạn gặp, đổi 2 file đó sang cách `java -jar` ở trên.

## 5. Backend — quy ước

Package `com.nhom5.backend.*`:

| Package | Chứa gì |
|---------|---------|
| `config` | `SecurityConfig` (JWT, CORS, phân quyền theo URL, 401/403 JSON), `JwtConfig` (encoder/decoder HS256), `OpenApiConfig`, `JpaConfig`, `AppProperties` (map `app.*`), `AdminSeeder` (tạo ADMIN đầu tiên) |
| `controller` | `@RestController`, prefix `/api/...`, chỉ nhận request → gọi service → trả `ApiResponse`. Mẫu: `AuthController`, `HealthController` |
| `service` | Toàn bộ nghiệp vụ, `@Service @RequiredArgsConstructor @Transactional`; client gọi AI cũng ở đây. Mẫu: `AuthService` |
| `security` | `JwtService` (sinh token), `GoogleTokenVerifier` (xác minh ID token Google qua JWKS), `RestAuthenticationHandler` (401/403 → ApiResponse) |
| `repository` | `JpaRepository<Entity, Long>` mỗi entity một interface. Mẫu: `UserRepository` |
| `entity` | `@Entity extends BaseEntity` (id, createdAt, updatedAt tự động); enum `Role`, `AuthProvider`. Chuỗi tiếng Việt dùng `@Nationalized` (→ NVARCHAR) |
| `dto.request` / `dto.response` | `record`, tên `XxxRequest` / `XxxResponse`; **không** trả entity thẳng ra ngoài |
| `exception` | `AppException` (có HttpStatus) + `GlobalExceptionHandler` |

Quy tắc:
- **Mọi response** là `ApiResponse<T>`: `{ "success": true, "message": null, "data": ... }`. Lỗi: `success=false`, `message` tiếng Việt. Lỗi nghiệp vụ → `throw AppException.notFound("...")`, đừng tự build ResponseEntity lỗi. 401/403 từ tầng filter cũng ra khuôn này.
- Validate input bằng `@Valid` + jakarta annotations trên request record, message tiếng Việt; lỗi validate trả 400 với `data = { field: message }`.
- Constructor injection qua Lombok `@RequiredArgsConstructor`; không `@Autowired` trên field.
- URL & quyền (`SecurityConfig`):
  - Public: `/api/health`, `POST /api/auth/register|login|google`, `GET /api/products/**`, `GET /api/categories/**`, `GET /uploads/**` (ảnh upload), Swagger.
  - `/api/auth/me` và mọi thứ còn lại: cần JWT. `POST /api/seller/register` → mọi user đã đăng nhập; `/api/seller/**` còn lại → `SELLER` hoặc `ADMIN`; `/api/admin/**` → `ADMIN`.
  - Kiểm tra sâu hơn (vd: seller chỉ sửa sản phẩm của mình) làm trong service — mẫu: `SellerShopService.requireShop(userId)` + `findByIdAndShopId`, tài nguyên của shop khác trả 404.
- Tham số lọc enum nhiều giá trị (`status=REJECTED,NEED_INFO`) và phân trang dùng `util/QueryParams`. Ảnh upload qua `FileStorageService` (JPG/PNG/WEBP ≤ 5 MB, kiểm tra chữ ký file, lưu `app.upload.dir`, trả `/uploads/...`).
- **Role**: 1 cột `role` trong `users`. Đăng ký thường **luôn** tạo `CUSTOMER`. `SELLER` chỉ có qua API đăng ký shop (tuần 4) và admin duyệt. `ADMIN` chỉ có qua `AdminSeeder` (`app.admin.*`).
- **JWT**: HS256, secret `app.jwt.secret`, hạn `app.jwt.expiration-minutes` (mặc định 60). Claims: `sub` = userId (string), `email`, `role` = `"CUSTOMER"|"SELLER"|"ADMIN"`, `iat`, `exp`, `iss = nhom5-backend`. Sinh bằng `JwtService`; xác thực do resource-server làm (claim `role` → `ROLE_xxx`). Client gửi `Authorization: Bearer <token>`. Trong controller lấy user hiện tại bằng `@AuthenticationPrincipal Jwt jwt` → `Long.parseLong(jwt.getSubject())`.
- **API auth** (`AuthController`):
  - `POST /api/auth/register` `{fullName, email, password, confirmPassword}` → 201 `data: { userId }`, không tự đăng nhập.
  - `POST /api/auth/login` `{email, password}` → `data: { accessToken, tokenType: "Bearer", expiresIn (giây), user }`.
  - `POST /api/auth/google` `{idToken}` → giống login; email mới → tạo user `provider=GOOGLE`, email đã có → đăng nhập + liên kết `provider_id`. Cần `GOOGLE_CLIENT_ID`, thiếu thì 503.
  - `GET /api/auth/me` → `data: user`. `user = { id, fullName, email, phone, role, accountTier, provider, avatarUrl, active, createdAt, shopId, shopStatus }` (`shopId/shopStatus` null nếu chưa đăng ký bán; sau khi admin xác minh shop phải đăng nhập lại để JWT mang role SELLER).
  - Google login: frontend lấy ID token từ Google Identity Services, backend xác minh bằng JWKS của Google (`GoogleTokenVerifier`), không dùng OAuth2 redirect flow, không thêm google-api-client.
- Test: `@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")` (H2), MockMvc. Mẫu: `AuthControllerTest`, `HealthControllerTest`. `AdminSeeder` cũng chạy trong test → có sẵn `admin@nongsan.local / Admin@123`.

## 6. Frontend — quy ước

```
src/
  pages/customer/   trang khách (Home, Products, AIClassifier)  → CSS THUẦN trong index.css
  pages/auth/       Login, Register                              → MUI
  pages/seller/     dashboard người bán                          → MUI
  pages/admin/      dashboard quản trị                           → MUI
  layouts/          CustomerLayout (Navbar/Footer/CartDrawer), DashboardLayout (MUI AppBar+Drawer, prop role)
  components/       dùng chung: ProductCard, Navbar, RequireAuth, StatCardGrid, ComingSoon...
  context/          pattern 3 file: XxxContext.jsx (Provider) + xxxContextInstance.js + useXxx.js
  services/api.js   NƠI DUY NHẤT gọi axios; aiService.js chỉ còn mock demo
  data/             mock data, xoá dần khi có API thật
  theme.js          theme MUI (màu đồng bộ biến CSS)
```

- **Khu khách hàng dùng CSS thuần** (design system đã có trong `index.css`, biến `--primary`...), **khu seller/admin/auth dùng MUI**. Không trộn: không nhét MUI vào trang khách, không viết CSS tay dài cho dashboard.
- Icon: `lucide-react` ở mọi nơi (kể cả trong MUI).
- Text giao diện + comment: tiếng Việt. Tên biến/hàm/file: tiếng Anh. Component `PascalCase.jsx`, hook `useXxx.js`.
- Gọi API: thêm hàm vào `services/api.js` theo nhóm (`authApi`, `productApi`, `orderApi`, `aiApi`, sắp tới `sellerApi`, `adminApi`), dùng `unwrap` để lấy `data` từ `ApiResponse`. Interceptor đã tự gắn Bearer token và tự logout khi 401.
- Auth: `useAuth()` → `{ user, token, isAuthenticated, login, logout, hasRole }`; token trong `localStorage["agri_token"]`. Route cần quyền bọc bằng `<RequireAuth roles={[...]}>` (đang TODO trong `App.jsx`).
- **TODO khi gắn API auth vào FE**: backend trả `accessToken` (không phải `token`) và `user.role` là **chuỗi** (không phải mảng `roles`) → sửa `AuthContext.login/hasRole`, `LoginPage`, `Navbar`, `RequireAuth` cho khớp mục 5.
- Thêm trang dashboard mới: tạo file trong `pages/seller|admin/`, thêm `<Route>` con trong `App.jsx`, thêm mục menu trong `NAV_BY_ROLE` của `DashboardLayout.jsx`.
- Fallback mock trong `api.js` (products/orders/ai) chỉ để dev không bị chặn — **xoá khi backend có API tương ứng**.
- Chạy `npm run lint` trước khi PR (oxlint: rules-of-hooks, only-export-components → vì thế context tách 3 file).

## 7. AI service — contract

`POST {app.ai.base-url}/classify`, form-data field `image` → JSON:

```json
{ "label": "fresh_apple", "produce_type": "apple", "condition": "fresh",
  "confidence": 0.93, "all_scores": { "...": 0.0 }, "model_version": "mock-0.1" }
```

- `condition`: `fresh` | `rotten`. `confidence` 0..1.
- Backend so `confidence` với `app.ai.auto-accept-threshold` (mặc định 0.85): ≥ ngưỡng → tự chấp nhận nhãn; < ngưỡng → hàng chờ admin kiểm định. Admin chỉnh ngưỡng ở tuần 7.
- Nhãn admin sửa phải được lưu (bảng riêng) để retrain — thiết kế bảng này ngay trong ERD.
- Không có file model → service chạy mock (ổn định theo hash ảnh). Đổi model không được đổi tên field.
- Chi tiết chạy/nạp model: `ai/README.md`.

**Quyết định cách làm model (chốt 15/09/2026):**
- Kỹ thuật: **Transfer Learning MobileNetV2** (không train CNN từ đầu, không dùng Cloud Vision API trả phí) — nhẹ, phù hợp đồ án, khớp khung `ai/app/classifier.py` đã viết sẵn.
- Dữ liệu: bắt đầu bằng dataset Kaggle **"Fruits fresh and rotten for classification"** (baseline tuần 3, 6 lớp táo/chuối/cam × tươi/hỏng) → tuần 6 bổ sung ảnh rau củ Việt Nam tự chụp.
- Train ở **Google Colab** (GPU miễn phí) — notebook có sẵn: `ai/notebooks/01_train_baseline_mobilenetv2.ipynb`, hướng dẫn từng bước bằng tiếng Việt, tự in ra `class_names` để đồng bộ với `LABELS` trong `classifier.py`.
- Tiền xử lý ảnh dùng `tf.keras.applications.mobilenet_v2.preprocess_input` — **phải giống hệt** giữa lúc train (notebook) và lúc phục vụ (`classifier.py`), nếu lệch model vẫn chạy nhưng đoán sai.
- "Điểm độ tươi %" hiển thị trên web = **dùng thẳng `confidence`** model trả về cho nhãn nó chọn — không train model hồi quy điểm số riêng (không có dataset cho việc đó).
- Giải thích đầy đủ (thuật ngữ, vì sao MobileNetV2, so sánh model, bản đồ bước↔file) cho người chưa biết AI: [`ai/docs/GIAI-THICH-AI.md`](ai/docs/GIAI-THICH-AI.md).

## 8. Database

- SQL Server, DB `nongsan_db`. ERD do **Duy & Hà** thiết kế — **mọi thay đổi bảng/cột phải báo nhóm** trước khi sửa entity.
- ⚠️ 27–28/09/2026: `pom.xml`/`application.properties` từng bị đổi ngầm sang MySQL (commit `dd58cd6`) rồi đổi lại SQL Server (đã chốt lại với cả nhóm: **giữ SQL Server**, khớp `docs/api.md` và ERD gốc). Không tự đổi engine DB lần nữa mà không hỏi — kể cả khi máy cá nhân cài sẵn MySQL cho tiện.
- Instance SQL Server phải **bật TCP/IP cổng 1433** (SQL Server Configuration Manager → Protocols → Enable → restart service) thì backend mới connect được — mặc định cài đặt để tắt. Nếu backend báo `TCP/IP connection ... has failed`, đây là nguyên nhân số 1.
- Script tạo DB/bảng: `backend/src/main/resources/db/` — chạy theo số thứ tự trong SSMS **trước khi** start backend (`01_create_database.sql`, `02_users.sql`, `03_catalog.sql` shop/danh mục/sản phẩm/ảnh/ai_results, `04_orders.sql` đơn hàng). Thêm bảng mới = thêm file `05_xxx.sql` + entity tương ứng. ⚠️ `02_users.sql` chưa có cột `phone`, `status`, `account_tier` mà entity `User` đã có (ddl-auto tự thêm) — cần cập nhật script.
- Kiểm tra script bằng sqlcmd: dùng `-S tcp:localhost,1433` (máy có thể có nhiều instance; `-S localhost` đi shared memory vào instance khác → "Login failed").
- Bảng: `snake_case`, số nhiều (`users`, `products`, `order_items`); entity map bằng `@Table(name=...)`, `@Column(name=...)`; chuỗi tiếng Việt `@Nationalized`.
- Dev dùng `ddl-auto=update` (`JPA_DDL_AUTO`) để không vỡ khi ai đó quên chạy script, nhưng script SQL vẫn là nguồn chuẩn của schema.

## 9. Lộ trình & mốc kiểm tra

| Tuần | Web | AI | Mốc |
|------|-----|----|-----|
| 1-2 | Chốt đề tài, ERD, đặc tả API (Swagger), khung repo | EDA + tiền xử lý dataset | |
| 3 | Đăng ký/đăng nhập/Google/JWT (BE+FE) | Train baseline MobileNetV2 6 lớp | ⭐ Demo đăng nhập có token |
| 4 | API + trang sản phẩm/danh mục; seller đăng ký shop + đăng sản phẩm | Đóng gói FastAPI | |
| 5 | Giỏ hàng, đặt hàng, thanh toán, quản lý đơn | Nối Spring Boot ↔ AI | ⭐ Mua hàng end-to-end có nhãn AI |
| 6 | Admin: dashboard, duyệt sản phẩm, đơn, user, danh mục | Dataset rau củ, train v2 | |
| 7 | Màn kiểm định AI + ngưỡng tin cậy, hoàn thiện seller, test tích hợp | | ⭐ Toàn hệ thống chạy thông |
| 8 | Test toàn diện, sửa lỗi, responsive, báo cáo chương 3-4 | | |
| 9 | Báo cáo chương 1-5, slide, video, Docker (nếu kịp) | | ⭐ Bản hoàn chỉnh |
| 10 | Sửa theo GVHD, tổng duyệt | | Bảo vệ |

Phân công chi tiết từng tuần: file sheet của nhóm (ngoài repo).

## 10. Git

- Không code trực tiếp trên `main`. Nhánh theo tính năng: `feat/be-auth-jwt`, `feat/fe-seller-products`, `feat/ai-fastapi`, `fix/...`, `docs/...`.
- Commit: `type(scope): mô tả` — `feat(be): thêm API đăng nhập`, `fix(fe): giỏ hàng mất khi reload`.
- PR vào `main`, ít nhất 1 người review. Chạy `mvnw.cmd test` và `npm run lint` trước khi mở PR.
- Không commit: `application-local.properties`, `.env`, `ai/models/*`, dataset, `node_modules`, `target`.

## 11. Không làm

- Không cho frontend gọi thẳng AI service / DB, không thêm biến kiểu `VITE_AI_API_URL`.
- Không trả entity JPA ra ngoài controller; không trả JSON ngoài khuôn `ApiResponse`.
- Không dùng thư viện JWT khác (jjwt...) hay google-api-client — đã có Nimbus trong Spring Security.
- Không đổi Spring Boot / Java version, không thêm UI library khác ngoài MUI, khi chưa hỏi nhóm.
- Không sửa schema DB "cho tiện" mà không báo; không hardcode secret/mật khẩu trong code.

## 12. Trạng thái hiện tại (cập nhật 30/09/2026 — tuần 3-4)

- Backend (nhánh `feat/be-seller-api`): **đủ 20 API người bán** (`/api/seller/**`: shop, logo, dashboard, sản phẩm + ảnh + gửi duyệt + ẩn/tồn kho, đơn hàng + chuyển trạng thái, kết quả AI) + `PATCH /api/admin/shops/{id}/status` + `GET /api/admin/users` + `GET /api/users/me/addresses`. Bảng đơn hàng đã có (seed 6 đơn mẫu, `customer@nongsan.local / Customer@123`), **chưa có checkout / giỏ hàng / API khách cho đơn**. Chi tiết quy tắc + khuôn JSON: api.md v1.3.
- **AI chưa nối**: ảnh sản phẩm mới vào hàng chờ admin (UNCERTAIN/PENDING_REVIEW) qua `ProductAiLabeler` — nối AI thì chỉ sửa class này. Hợp đồng AI thực tế (`POST /classify`, field `image`) lệch api.md mục 5 (`/predict`) — chốt khi nối.
- Còn trả entity ra ngoài: `ShopController` (`/api/shops/**`) — cần đổi sang DTO khi làm trang shop công khai (§4.4).
- Lịch sử (13/09): khung config/security/JWT/Swagger/exception + auth hoàn chỉnh phía backend, test pass trên H2.
- Frontend: khu khách hàng hoàn chỉnh với mock data; khung MUI cho seller/admin/auth; **chưa gắn API auth thật** (xem TODO mục 6).
- AI: khung FastAPI chạy mock; chưa có model.
- Việc tiếp theo: chạy script SQL + test Postman auth → gắn auth vào FE (mốc tuần 3) → ERD các bảng còn lại (tuần 2) → API sản phẩm/danh mục (tuần 4).
