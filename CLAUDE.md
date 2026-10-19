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
backend/   Spring Boot 4.1.1, Java 17+ (pom), Maven wrapper      ← xem mục 5
frontend/  React 19 + Vite 8, react-router 7, axios, MUI 9         ← xem mục 6
ai/        Python FastAPI + PyTorch (MobileNetV2, 28 lớp)           ← xem mục 7
CLAUDE.md  file này
```

## 4. Lệnh thường dùng

| Việc | Lệnh |
|------|------|
| Backend chạy | `cd backend && mvnw.cmd -DskipTests package && java -jar target\backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=local` → http://localhost:8080 (xem cảnh báo `spring-boot:run` bên dưới) |
| Backend test | `cd backend && mvnw.cmd test` (chạy trên H2, không cần SQL Server) |
| Swagger | http://localhost:8080/swagger-ui (không phải `/swagger-ui.html`) — Health: http://localhost:8080/api/health |
| Frontend | `cd frontend && npm install && npm run dev` → http://localhost:5173 |
| Frontend lint/build | `npm run lint` · `npm run build` |
| AI service | `cd ai && python -m venv .venv && .venv\Scripts\activate && pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt && uvicorn ai.main:app --reload --port 8000` → http://localhost:8000/docs |

**Cấu hình cục bộ (không commit):**
- Backend: copy `backend/src/main/resources/application-local.properties.example` → `application-local.properties`, chạy với profile `local`. Hoặc đặt biến môi trường `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AI_SERVICE_URL`, `AI_ENABLED` (mặc định `true`; máy không chạy AI service đặt `false` để khỏi chờ timeout), `AI_AUTO_ACCEPT_THRESHOLD` (0.90) / `AI_REVIEW_THRESHOLD` (0.70) (ngưỡng mặc định khi bảng `settings` trống, mục 7), `AI_TIMEOUT_MS` (5000), `CORS_ALLOWED_ORIGINS`, `SHIPPING_FEE_FLAT` (phí ship mỗi đơn, mặc định 20000).
- Frontend: copy `frontend/.env.example` → `.env`.
- AI: model `ai/models/mobilenetv2_fruitquality_best.pth` **có trong git** (~9 MB), không cần tải riêng. Dataset (`ai/dataset/`) không commit.

**JDK:** pom đặt `java.version=17` (đổi từ 21 ở commit `c2ad04f`, 02/10). Nhóm **không ràng buộc** phiên bản: máy dùng JDK nào ≥ 17 cũng được (17/21/24/25 đều build — `--release 17`). Branch `appmod/java-upgrade-*` là của tool nâng cấp Java tự tạo, không làm việc trên đó.

**⚠️ `mvnw.cmd spring-boot:run` có thể lỗi `Could not find or load main class ...BackendApplication`** trên máy có đường dẫn project chứa dấu tiếng Việt/khoảng trắng (VD `D:\Đồ án chuyên ngành\Nhom5`) — nghi do Maven build classpath argfile bị vỡ trên Windows với path dạng này (đã xác nhận 28/09/2026, thử cả `-Dspring-boot.run.fork=false` cũng không hết). Class vẫn compile ra bình thường (`target/classes` có đủ `.class`). **Cách chạy ổn định đã test thật**: đóng gói jar rồi chạy trực tiếp bằng `java -jar` (lệnh ở bảng trên) — né hoàn toàn bước tính classpath của plugin. `run_backend.bat` / `backend/run.bat` hiện vẫn gọi `spring-boot:run` nên có thể dính lỗi này — nếu máy bạn gặp, đổi 2 file đó sang cách `java -jar` ở trên.

## 5. Backend — quy ước

Package `com.nhom5.backend.*`:

| Package | Chứa gì |
|---------|---------|
| `config` | `SecurityConfig` (JWT, CORS, phân quyền theo URL, 401/403 JSON), `JwtConfig` (encoder/decoder HS256), `OpenApiConfig`, `JpaConfig`, `AppProperties` (map `app.*`), `AdminSeeder` (tạo ADMIN đầu tiên) |
| `controller` | `@RestController`, prefix `/api/...`, chỉ nhận request → gọi service → trả `ApiResponse`. Mẫu: `AuthController`, `HealthController` |
| `service` | Toàn bộ nghiệp vụ, `@Service @RequiredArgsConstructor @Transactional`; client gọi AI cũng ở đây (`AiServiceClient`, mục 7). Mẫu: `AuthService` |
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
- Lỗi nghiệp vụ cần liệt kê từng mục (vd checkout thiếu hàng) → `AppException.conflict(msg, List<FieldError>)` → JSON có `errors[]`. Tồn kho: **không** `product.setStockQuantity` trong luồng đặt/huỷ đơn, dùng `ProductRepository.deductStock/restoreStock` (UPDATE có điều kiện). Logic huỷ đơn + khuôn Order(detail) dùng chung ở `service/OrderSupport`. Mã đơn: `util/OrderCodes` (suy từ id).
- Tham số lọc enum nhiều giá trị (`status=REJECTED,NEED_INFO`) và phân trang dùng `util/QueryParams`. Ảnh upload qua `FileStorageService` (JPG/PNG/WEBP ≤ 5 MB, kiểm tra chữ ký file, lưu `app.upload.dir`, trả `/uploads/...`).
- **Role**: 1 cột `role` trong `users`. Đăng ký thường **luôn** tạo `CUSTOMER`. `SELLER` chỉ có qua API đăng ký shop (tuần 4) và admin duyệt. `ADMIN` chỉ có qua `AdminSeeder` (`app.admin.*`).
- **JWT**: HS256, secret `app.jwt.secret`, hạn `app.jwt.expiration-minutes` (mặc định 60). Claims: `sub` = userId (string), `email`, `role` = `"CUSTOMER"|"SELLER"|"ADMIN"`, `iat`, `exp`, `iss = nhom5-backend`. Sinh bằng `JwtService`; xác thực do resource-server làm (claim `role` → `ROLE_xxx`). Client gửi `Authorization: Bearer <token>`. Trong controller lấy user hiện tại bằng `@AuthenticationPrincipal Jwt jwt` → `Long.parseLong(jwt.getSubject())`.
- **API auth** (`AuthController`):
  - `POST /api/auth/register` `{fullName, email, password, confirmPassword}` → 201 `data: { userId }`, không tự đăng nhập.
  - `POST /api/auth/login` `{email, password}` → `data: { accessToken, tokenType: "Bearer", expiresIn (giây), user }`.
  - `POST /api/auth/google` `{idToken}` → giống login; email mới → tạo user `provider=GOOGLE`, email đã có → đăng nhập + liên kết `provider_id`. Cần `GOOGLE_CLIENT_ID`, thiếu thì 503.
  - `GET /api/auth/me` → `data: user`. `user = { id, fullName, email, phone, role, accountTier, provider, avatarUrl, active, createdAt, shopId, shopStatus }` (`shopId/shopStatus` null nếu chưa đăng ký bán; sau khi admin xác minh shop phải đăng nhập lại để JWT mang role SELLER).
  - Google login: frontend lấy ID token từ Google Identity Services, backend xác minh bằng JWKS của Google (`GoogleTokenVerifier`), không dùng OAuth2 redirect flow, không thêm google-api-client.
  - OAuth Client (loại Web) nằm ở project Google Cloud **AgriFresh AI** (`agrifresh-ai`), tạo 05/10/2026. Authorized JavaScript origins: `http://localhost:5173`, `http://localhost` — deploy domain khác thì thêm origin. App đang ở chế độ *Testing*: chỉ Gmail trong **Audience → Test users** đăng nhập được, thành viên mới phải được thêm vào. Client ID điền **giống nhau** ở `app.google.client-id` (backend) và `VITE_GOOGLE_CLIENT_ID` (frontend); không cần client secret.
- Test: `@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")` (H2), MockMvc. Mẫu: `AuthControllerTest`, `HealthControllerTest`. `AdminSeeder` cũng chạy trong test → có sẵn `admin@nongsan.local / Admin@123`. Profile test đặt `app.ai.enabled=false` (không gọi AI thật); test cần kết quả AI thì mock `AiServiceClient` bằng `@MockitoBean` — mẫu `SellerProductAiFlowTest`, `AdminAiReviewFlowTest`.

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
- Gọi API: thêm hàm vào `services/api.js` theo nhóm (`authApi`, `productApi`, `orderApi`, `aiApi`, `sellerApi`, `adminApi` — có nhóm con, vd `adminApi.ai`), dùng `unwrap` để lấy `data` từ `ApiResponse`. Interceptor đã tự gắn Bearer token và tự logout khi 401.
- Auth: `useAuth()` → `{ user, token, isAuthenticated, login, logout, hasRole }`; token trong `localStorage["agri_token"]`. Nút Google: `components/GoogleLoginButton.jsx` (dùng ở Login + Register) — phải là nút do Google tự vẽ (`renderButton`) vì chỉ nó trả **ID token**; nút tự vẽ/`useGoogleLogin` trả access token, backend từ chối. Route cần quyền bọc bằng `<RequireAuth roles={[...]}>` (không truyền `roles` = chỉ cần đăng nhập). `LoginPage` gọi API thật — **không thêm lại "đăng nhập giả"/mock login** (đã gỡ 05/10).
- **Người xem chưa đăng nhập** xem được trang chủ, sản phẩm, chi tiết, trang shop. Thao tác cần tài khoản (thêm giỏ, mua ngay, giỏ hàng, thanh toán, đơn của tôi, tài khoản, Kiểm tra AI) phải đăng nhập: route bọc `RequireAuth`, nút bấm dùng `useRequireLogin()` (đã gắn sẵn trong `CartContext.addToCart`, trả `false` khi chưa đăng nhập). Đăng nhập xong `LoginPage` đưa về trang cũ (`location.state.from`).
- Giỏ hàng tạm lưu `localStorage["agri_cart_<userId>"]` (mỗi tài khoản một giỏ) cho tới khi có `/api/cart` (tuần 5).
- Thêm trang dashboard mới: tạo file trong `pages/seller|admin/`, thêm `<Route>` con trong `App.jsx`, thêm mục menu trong `NAV_BY_ROLE` của `DashboardLayout.jsx`.
- Kiểm định AI (admin): `pages/admin/AdminAiReviewPage.jsx` (`/admin/ai-review`, 3 tab Hàng chờ · Thử mô hình · Ngưỡng & thống kê), component con trong `pages/admin/components/Ai*.jsx`, hằng số/tiện ích chung ở `aiReview.js` (màu badge nhãn theo api.md mục 8). `AiReviewActions` dùng lại ở `AdminProductDetailPage`. Badge menu "Kiểm định AI" lấy `pendingReview` từ `adminApi.ai.getStatistics()`; thao tác làm đổi hàng chờ thì gọi `notifyAiPendingChanged()` để badge tải lại. Ảnh `/uploads/...` hiển thị qua `resolveAssetUrl` trong `api.js`.
- Fallback mock trong `api.js` (products/orders/ai) chỉ để dev không bị chặn — **xoá khi backend có API tương ứng**.
- Chạy `npm run lint` trước khi PR (oxlint: rules-of-hooks, only-export-components → vì thế context tách 3 file).

## 7. AI service — contract

`POST {app.ai.base-url}/classify` (bí danh `/predict`), form-data field `image` → JSON (chốt 12/10/2026, AI theo backend):

```json
{ "label": "apple_fresh", "produce_type": "apple", "condition": "fresh",
  "confidence": 0.9312, "all_scores": { "apple_fresh": 0.9312, "...": 0.0 }, "model_version": "mobilenetv2-pt-v1" }
```

- `label` = tên lớp lúc train dạng `{loại}_{tình trạng}`; `condition`: `fresh` | `rotten`; `confidence` **0..1** (không phải %).
- Lỗi: 400 không phải ảnh/rỗng, 422 ảnh hỏng, **503 chưa nạp được model** (service vẫn chạy, `GET /health` báo `model_loaded: false`) → backend coi như AI lỗi, đưa ảnh vào hàng chờ admin.
- Backend gọi qua `service/AiServiceClient` (RestClient; part `image` **kèm content-type của ảnh** — FastAPI từ chối nếu thiếu; timeout `app.ai.timeout-ms` 5s). Lỗi gì (tắt, timeout, 4xx/5xx, 503, JSON sai hợp đồng) cũng trả `Optional.empty()` + log warn, không ném lỗi. `app.ai.enabled=false` → không gọi mạng. Tải nhiều ảnh: 1 ảnh lỗi thì các ảnh sau cùng lần tải không gọi AI nữa.
- **Gắn nhãn** (`ProductAiLabeler`, 2 ngưỡng — chốt 19/10/2026, [`docs/1910.md`](docs/1910.md) mục 1; thay quy tắc 1 ngưỡng 0.85 cũ). Xét từ trên xuống, gặp dòng đầu tiên khớp thì dừng:
  1. AI tắt / lỗi / timeout / 503 → `UNCERTAIN`, confidence 0, `PENDING_REVIEW`.
  2. `produce_type` ∉ `aiProduceKeys` của danh mục (trống → lấy của danh mục cha; cả hai trống → bỏ qua luật này) → `UNCERTAIN`, `PENDING_REVIEW`. Bù cho việc model không có lớp "không nhận ra" (vd ảnh rau muống bị đoán là dưa leo).
  3. confidence < `review_threshold` (0.70) → `UNCERTAIN`, `PENDING_REVIEW`.
  4. `condition = rotten` → `ROTTEN`, `PENDING_REVIEW` (ảnh hỏng **luôn** có admin xem).
  5. fresh, confidence < `auto_accept_threshold` (0.90) → `FRESH`, `PENDING_REVIEW`.
  6. fresh, confidence ≥ 0.90 → `FRESH`, `AUTO_ACCEPTED`.
- **Ngưỡng** ở bảng `settings` (`ai.auto_accept_threshold`, `ai.review_threshold`), đọc/ghi qua `AiSettingsService`; admin đổi bằng `PUT /api/admin/ai/settings`, không cần restart, áp cho ảnh tải lên sau đó (không gắn lại nhãn cũ). Thiếu dòng → mặc định `app.ai.auto-accept-threshold` / `app.ai.review-threshold`. `model_version` **không** lưu ở `settings` — đọc từ `GET /health`. Toàn bộ API kiểm định AI: api.md mục 4.9.
- **Nhãn admin sửa để train lại**: dùng luôn `ai_results` (`review_status = CORRECTED`, `final_label`, `produce`, `image_url`), **không** thêm bảng riêng; ghi chú admin nối sau ghi chú AI (chốt 19/10/2026, chờ nhóm xác nhận — [`docs/1910.md`](docs/1910.md) mục 5). Lấy dữ liệu: `SELECT image_url, produce, label AS ai_label, final_label FROM ai_results WHERE review_status = 'CORRECTED'`.
- Đổi model không được đổi tên field; train lại thì tăng `MODEL_VERSION`.
- Chi tiết chạy/train lại: `ai/README.md`.

**Quyết định cách làm model** (chốt 15/09/2026, cập nhật 12/10/2026 khi nhận model thật của Duy — repo gốc `github.com/buianhduy205/ai`):
- Kỹ thuật: **Transfer Learning MobileNetV2** (không train CNN từ đầu, không dùng Cloud Vision API trả phí). Framework **PyTorch + torchvision** (bản khung TF/Keras cũ đã bỏ).
- Model hiện tại: **28 lớp** = 14 loại (táo, chuối, ớt chuông, cà rốt, dưa leo, nho, ổi, táo tàu, xoài, cam, lựu, khoai tây, dâu, cà chua) × fresh/rotten. Test 4.410 ảnh: **accuracy 96,78%**, F1 96,72%; lớp yếu `bellpepper_rotten` (recall 0,61). Chi tiết `ai/results/`.
- Pipeline: `preprocessing/preprocess.py` (chia 70/15/15, seed 42) → `training/train.py` (train toàn mạng, Adam lr 1e-3, 10 epoch, lưu theo val accuracy) → `training/evaluate.py`. Checkpoint `.pth` chứa luôn `class_names` + `image_size` nên không phải chép tay danh sách nhãn.
- Tiền xử lý ảnh: resize 128×128 + chuẩn hoá mean/std ImageNet — **phải giống hệt** giữa `val_transform` (train) và `ai/ai/main.py` (phục vụ), nếu lệch model vẫn chạy nhưng đoán sai.
- "Điểm độ tươi %" hiển thị trên web = **dùng thẳng `confidence`** model trả về cho nhãn nó chọn — không train model hồi quy điểm số riêng (không có dataset cho việc đó).
- Giải thích đầy đủ (thuật ngữ, vì sao MobileNetV2, so sánh model, bản đồ bước↔file) cho người chưa biết AI: [`ai/docs/GIAI-THICH-AI.md`](ai/docs/GIAI-THICH-AI.md).

## 8. Database

- SQL Server, DB `nongsan_db`. ERD do **Duy & Hà** thiết kế — **mọi thay đổi bảng/cột phải báo nhóm** trước khi sửa entity.
- ⚠️ 27–28/09/2026: `pom.xml`/`application.properties` từng bị đổi ngầm sang MySQL (commit `dd58cd6`) rồi đổi lại SQL Server (đã chốt lại với cả nhóm: **giữ SQL Server**, khớp `docs/api.md` và ERD gốc). Không tự đổi engine DB lần nữa mà không hỏi — kể cả khi máy cá nhân cài sẵn MySQL cho tiện. **Lần 2** (02/10, commit `c2ad04f`): mặc định trong `application.properties` lại bị đổi sang MySQL → 05/10 đổi về SQL Server, nhóm chốt lại **giữ SQL Server**. Máy nào muốn thử DB khác thì chỉ ghi đè trong `application-local.properties` của mình, không sửa `application.properties`.
- Instance SQL Server phải **bật TCP/IP cổng 1433** (SQL Server Configuration Manager → Protocols → Enable → restart service) thì backend mới connect được — mặc định cài đặt để tắt. Nếu backend báo `TCP/IP connection ... has failed`, đây là nguyên nhân số 1.
- Script tạo DB/bảng: `backend/src/main/resources/db/` — chạy theo số thứ tự trong SSMS **trước khi** start backend (`01_create_database.sql`, `02_users.sql`, `03_catalog.sql` shop/danh mục/sản phẩm/ảnh/ai_results, `04_orders.sql` đơn hàng, `05_addresses_cart.sql` sổ địa chỉ + giỏ, `06_product_review_history.sql` lịch sử duyệt sản phẩm — **bảng mới 11/10, ngoài ERD gốc**, `07_settings.sql` ngưỡng AI dạng key-value — **bảng mới 19/10, đã có trong ERD api.md mục 2** nhưng trước đó chưa tạo; entity `Setting`). Thêm bảng mới = thêm file `08_xxx.sql` + entity tương ứng. DB đã có dữ liệu từ trước 19/10: chạy `07_settings.sql` rồi chạy tay `UPDATE categories SET ai_produce_keys = 'mango,apple,banana,orange,strawberry,grape,guava,jujube,pomegranate' WHERE name = N'Trái cây';` và `... = 'tomato,potato,carrot,bellpepper,cucumber' WHERE name = N'Củ quả';` (seeder không chạy lại — [`docs/1910.md`](docs/1910.md) mục 7.4). ⚠️ `02_users.sql` chưa có cột `phone`, `status`, `account_tier` mà entity `User` đã có (ddl-auto tự thêm) — cần cập nhật script.
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
- Không commit: `application-local.properties`, `.env`, dataset (`ai/dataset/`), `node_modules`, `target`, `.venv`. Riêng file model `ai/models/*.pth` **được commit** (chốt 12/10/2026, ~9 MB/lần train — chỉ commit bản tốt nhất, đừng commit checkpoint thử nghiệm).

## 11. Không làm

- Không cho frontend gọi thẳng AI service / DB, không thêm biến kiểu `VITE_AI_API_URL`.
- Không trả entity JPA ra ngoài controller; không trả JSON ngoài khuôn `ApiResponse`.
- Không dùng thư viện JWT khác (jjwt...) hay google-api-client — đã có Nimbus trong Spring Security.
- Không đổi Spring Boot / Java version, không thêm UI library khác ngoài MUI, khi chưa hỏi nhóm.
- Không sửa schema DB "cho tiện" mà không báo; không hardcode secret/mật khẩu trong code.

## 12. Trạng thái hiện tại (cập nhật 19/10/2026 — tuần 6)

- Backend: **đủ 20 API người bán** (`/api/seller/**`) + **luồng khách hàng** (nhánh `feat/be-customer-flow`, 11/10): sổ địa chỉ đủ CRUD + mặc định, giỏ `/api/cart`, checkout tách đơn theo shop + trừ kho + `/api/orders` xem/huỷ, **admin duyệt sản phẩm** `/api/admin/products` (list/detail/review/review-bulk, lịch sử duyệt) + `PATCH /api/admin/shops/{id}/status` + `GET /api/admin/users`. Chi tiết quy tắc + khuôn JSON: api.md v1.6.
- **AI đã nối vào backend + admin kiểm định AI xong** (nhánh `feat/ai-integration-admin-review`, 19/10): ảnh sản phẩm mới gọi `POST /classify` và áp bảng quy tắc mục 7; `/api/admin/ai/**` đủ 8 endpoint (hàng chờ, review ACCEPT/CORRECT/RETAKE, accept-bulk, thử mô hình, ngưỡng, thống kê); bảng `settings`; `submit` chặn ảnh `RETAKE_REQUESTED`. Test H2 98/98. 5 quyết định trong [`docs/1910.md`](docs/1910.md) **chốt tạm theo phương án ★ — chờ nhóm xác nhận**.
- **Còn thiếu backend** (theo api.md): `/users/me` + avatar, reviews sản phẩm, `/api/ai/**` khách (Premium), admin orders / users status-tier / shops list-detail / categories / dashboard, `/auth/change-password`.
- Còn trả entity ra ngoài: `ShopController` (`/api/shops/**`) — cần đổi sang DTO khi làm trang shop công khai (§4.4).
- Lịch sử (13/09): khung config/security/JWT/Swagger/exception + auth hoàn chỉnh phía backend, test pass trên H2.
- Frontend: đã tích hợp API thật cho giỏ hàng (`/api/cart`), thanh toán (`/api/orders/checkout`), đơn hàng (`/api/orders`), sổ địa chỉ (`/api/users/me/addresses` với dữ liệu 63 tỉnh/thành, quận/huyện, phường/xã), và admin duyệt sản phẩm (`/api/admin/products` đơn lẻ + duyệt hàng loạt). Auth đã gắn API thật (mật khẩu + Google). 19/10: màn **Kiểm định AI** `/admin/ai-review` (API thật), nút kiểm định từng ảnh ở trang chi tiết duyệt sản phẩm, badge menu = số ảnh chờ thật, "Kết quả AI của shop" của người bán gọi `/api/seller/ai/results` thật. Badge "Sản phẩm" / "Đơn hàng" ở menu admin vẫn viết cứng.
- AI (12/10): **đã có model thật** PyTorch MobileNetV2 28 lớp (accuracy 96,78%) do Duy train; FastAPI `ai/ai/main.py` trả đúng hợp đồng mục 7, thiếu model thì 503 thay vì mock.
- Việc tiếp theo: nhóm xác nhận `docs/1910.md` (DB cũ chạy `07_settings.sql` + `UPDATE ai_produce_keys`, mục 8) → hoàn thiện admin orders / dashboard (`aiPendingReview`, `aiRottenFlags`) / users / shops / categories (tuần 6) → test tích hợp toàn hệ thống (mốc tuần 7).
