# Plan: Sửa lỗi role Farmer + cải tổ trang "Tôi"

**Created:** 2026-05-10
**Status:** done
**Owner:** tienkhoa03
**Related:** FR-T01, FR-F01, FR-F06, FR-F07, FR-F08, FR-F09, FR-T02, NFR-R03, NFR-U03

## 1. Mục tiêu

Khắc phục một loạt lỗi trên các tab của vai trò **Farmer** (Trang chủ, Vườn, Quy trình, Kết nối, Tôi) đang chặn luồng demo MVP:
- `GET /api/v1/dashboard/farmer` 5xx → trang chủ "lỗi nội bộ".
- `GET /api/v1/monitoring/farms/:farmId/{latest,alerts,history}` lỗi.
- `GET /api/v1/farms/farm-001/care-plan/today` 400 (Validation failed: uuid expected) — FE đang truyền `farm-001` thay cho UUID thật.
- `GET /api/v1/traders/search` 500 → tab Kết nối báo "Không thể tìm kiếm".
- Tab Thị trường (con của Kết nối) đang dùng dữ liệu tĩnh (`genPriceHistory`, news cứng) — phải gọi API thực hoặc hiển thị empty-state đúng.
- FAB "Thêm vườn" bị bottom-nav che (đặt `bottom: 24`).
- Trang "Hồ sơ của tôi" → đổi thành "Tôi"; hiển thị `userId`, `zaloId`, `lastLogin`; khoá chỉnh sửa `displayName` & `phone`; lấy 2 trường này từ Zalo SDK lúc đăng nhập, lưu DB, render từ DB.

## 2. Scope

**In scope**
- BE
  - `auth-service`: pipeline đăng nhập Zalo lưu thêm `phone` (qua ZMP `getPhoneNumber`); `updateMe()` cấm sửa `displayName`/`phone`; trả về `lastLogin` chuẩn.
  - `contract-service`: chẩn đoán & sửa `getFarmerDashboard()` + `searchTraders` (root cause cho 500/5xx, ví dụ table `trader_reviews` chưa migrate, `synchronize` chưa chạy, hoặc lỗi forwardAuth).
  - `monitoring-service`: chẩn đoán 4xx/5xx ở `farm-access.guard` (fail-closed quá rộng), `latest`/`alerts`/`history` controller, ParseUUID nếu thiếu.
  - `farm-service`: care-plan controller — không cần đổi (đã ParseUUIDPipe). Bug nằm ở FE truyền `farm-001`.
- FE
  - `FarmerDashboardScreen`: sau lần fix FE/BE, đảm bảo guard offline + skeleton hợp lý; FAB không bị che.
  - `FarmerFarmProfileScreen`: nâng FAB `bottom` lên (`>= 88px`) để tránh bottom-nav.
  - `FarmerProcessScreen`: bỏ default `farmId='farm-001'`; resolve `farmId` từ `listFarms({ownerId})` giống dashboard; nếu chưa có vườn → empty state hướng dẫn tạo vườn (giống dashboard). Hook `useCarePlan(null)` không gọi API.
  - `FarmerMarketConnectScreen`:
    - Tab Thị trường: gọi service mới (`marketService`) đọc `/api/v1/markets/forecasts?cropType=…` + `/api/v1/markets/news` (nếu BE chưa có endpoint, hiển thị empty-state có CTA "Cập nhật sau" — KHÔNG render mock).
    - Tab Đối tác: giữ luồng hiện tại sau khi BE search trả 200.
  - `ProfileScreen`:
    - Đổi label header / tab "Của tôi" → "Tôi" (kiểm `roleNavModel.ts` + screen title).
    - InfoRow đầy đủ: `User ID`, `Zalo ID`, `Đăng nhập gần nhất`, `Tên hiển thị`, `Số điện thoại`, `Email`, `Ngày tham gia`.
    - Form Edit: bỏ field `displayName` & `phone`; chỉ còn email + role-specific.
- Shared
  - `UserProfileUpdateDto`: bỏ optional `displayName`, `phone` (hoặc ignore ở `updateMe`).
  - `AuthLoginResponseDto`: nếu cần, thêm `phone` (nhưng phone đã có trong UserProfileDto qua `/auth/me`).

**Out of scope**
- Reset DB, viết migration mới cho các table khác.
- Re-design tab Thị trường (chỉ thay mock → API/empty-state).
- Phase trader / buyer (không liên quan).

## 3. Tham chiếu

- `requirements.md` §FR-T01 (Tài khoản & hồ sơ), §FR-F01 (Hồ sơ vườn), §FR-F06 (Quy trình), §FR-F07/§FR-F08 (Dashboard farmer/Monitoring), §FR-F09 (Care log), §FR-T02 (Kết nối).
- `business-logic.md` §Auth, §Farmer dashboard, §Trader search.
- `/specs/backend-api-specification/design.md`
  - §4.1 `/auth/*` (login, me, update me, logout)
  - §4.2 `/farms/:id/care-plan/today`
  - §4.4.7 `/dashboard/farmer`
  - §4.5 `/monitoring/farms/:farmId/{latest,alerts,history}`
  - §4.6 `/traders/search`, `/connections/*`
- `/specs/frontend-ui-specification/design.md`
  - §Farmer Dashboard
  - §Farmer Process & Diary
  - §Farmer Market & Connect
  - §Profile (vai trò chung)

## 4. Thay đổi dự kiến

### Backend

#### 4.1 contract-service / dashboard
- File: `apps/contract-service/src/dashboard/dashboard.service.ts`
  - Bọc `getFarmerDashboard()` vào try/catch toàn cục — log structured + ném `ServiceUnavailableException` thay vì để service crash.
  - `forwardAuth()`: nếu thiếu Authorization → trả 401 thay vì 400 (đang BadRequest, dễ nhầm là FE bug).
  - Khi `fetchFarmerFarmIds` trả `[]` → vẫn trả DTO với 0/0/0 (đã có nhưng compliance call nhánh hơi mơ hồ; double-check).
- Test: thêm spec gọi với user không có farm → 200 + recentAlerts=0.

#### 4.2 contract-service / connections (search 500)
- File: `apps/contract-service/src/connections/connections.service.ts`
  - Bọc try/catch; log raw SQL + params khi lỗi → tìm root cause (nghi: bảng `trader_reviews` chưa được sync vì `synchronize=true` chỉ chạy khi service start mới).
  - Nếu `trader_reviews` chưa tồn tại trong DB của user → migrate thủ công bằng cách thêm bootstrap script `ensureTraderReviewsTable()` (kiểm tra `to_regclass('public.trader_reviews')` và `CREATE TABLE IF NOT EXISTS`) — KHÔNG dùng TypeORM migrations chéo service.
  - Acceptance: `GET /traders/search` (no params) → 200, `items: []`.
- Test: integration test "should return 200 with empty list when no traders".

#### 4.3 monitoring-service / FarmAccessGuard
- File: `apps/monitoring-service/src/sensors/guards/farm-access.guard.ts`
  - Logic chính xác nhưng nếu `farm-service` lỗi (501) → return false thay vì throw, hiện đang return false thầm lặng dẫn tới ForbiddenException khó hiểu. Giữ behavior nhưng chuẩn hoá message.
  - Thêm `ParseUUIDPipe` ở 3 controller (sensors / alerts) để fail-fast khi `farmId` không phải UUID — tránh trả 5xx mơ hồ.
  - Acceptance: chủ vườn gọi `latest|alerts|history` → 200; không phải chủ → 403; farm không tồn tại → 404 (qua farm-service).

#### 4.4 auth-service / Zalo login + update
- File: `apps/auth-service/src/auth/zalo.service.ts`, `auth.service.ts`, `auth.controller.ts`
  - Thêm DTO `ZaloLoginRequestDto { accessToken: string; phoneToken?: string; phoneNumber?: string }`.
  - FE gọi `getPhoneNumber()` từ ZMP SDK → gửi `phoneToken` (server-decoded) HOẶC plain `phoneNumber` lên `/auth/login`.
  - `login()`: nếu nhận được phone → cập nhật `user.phone` (chỉ ghi đè nếu đang null hoặc thay đổi).
  - `updateMe()`: bỏ ghi đè `displayName`/`phone` từ DTO (silent ignore + log warn). Update đảm bảo idempotent.
- File: `libs/shared/src/dto/user-profile-update.dto.ts`
  - Đánh dấu `displayName` và `phone` là deprecated/ignored (hoặc xoá hẳn nếu FE không dùng).
- Acceptance:
  - Đăng nhập lần đầu Zalo → DB có `display_name`, `phone`, `last_login`.
  - `PUT /auth/me { displayName: "…", phone: "…" }` → response giữ nguyên giá trị từ Zalo (không update).
  - `GET /auth/me` → trả `userId`, `zaloId`, `displayName`, `phone`, `lastLogin`.

### Frontend

#### 4.5 FarmerProcessScreen — fix farmId UUID
- File: `fe/src/screens/farmer/process/FarmerProcessScreen.tsx`
  - Bỏ default `farmId = 'farm-001'`.
  - Thêm logic resolve giống `FarmerDashboardScreen`: lấy session.userId → `listFarms({ ownerId })` → chọn farm đầu (hoặc cho dropdown sau).
  - Empty-state khi user chưa có farm → CTA → tab Vườn.
  - Truyền `resolvedFarmId` vào `useCarePlan` và các hành động `createCareLog`, `enqueue`, ...
- Acceptance: `GET /farms/<UUID>/care-plan/today` 200, không còn 400 uuid.

#### 4.6 FarmerFarmProfileScreen — FAB không bị che
- File: `fe/src/screens/farmer/farm-profile/FarmerFarmProfileScreen.tsx`
  - Đổi `bottom: 24` → `bottom: 88` (≥ 56px nav + 16 gap) cho FAB ở renderList (line ~527).
  - Đảm bảo `paddingBottom` content ≥ 80 (đã có 80 nhưng FAB chồng với nội dung — tăng lên 96).
- Acceptance: trên iPhone SE size, FAB hiển thị trên bottom nav, không bị che.

#### 4.7 FarmerMarketConnectScreen — tab Thị trường
- File: `fe/src/screens/farmer/market-connect/FarmerMarketConnectScreen.tsx`
  - Loại bỏ `genPriceHistory`, `genPriceForecast`, news tĩnh.
  - Tạo `fe/src/services/marketService.ts`:
    - `fetchPriceForecast(cropType, days=7)` → `/api/v1/markets/forecasts?cropType=…&days=7`
    - `fetchMarketNews(cropType, limit=5)` → `/api/v1/markets/news?cropType=…&limit=5`
  - Khi BE chưa có endpoint (hiện tại): service throw `NotImplemented` → screen render empty-state có hint "Tính năng đang được cập nhật". KHÔNG fallback sang mock.
  - (Stretch) Nếu BE có thể thêm `/api/v1/markets/forecasts` đơn giản đọc bảng giá tĩnh (nông sản), có thể wire trong cùng PR.
- Acceptance: tab Thị trường KHÔNG hiện chart giả lập; empty-state có icon + text rõ ràng.

#### 4.8 ProfileScreen — đổi "Của tôi" → "Tôi", khoá tên/sđt, thêm thông tin
- File: `fe/src/screens/shared/profile/ProfileScreen.tsx`
  - Bỏ FormField `displayName`, `phone` trong nhánh `isEditing`. Giữ Email + role-specific.
  - InfoRow nhánh view: thêm `User ID`, `Zalo ID`, `Đăng nhập gần nhất` (đã có), `Tên hiển thị`, `Số điện thoại`, `Email`, `Ngày tham gia`. Thứ tự gợi ý: name → phone → email → zalo → user → tham gia → last login.
  - Đảm bảo `formatDateTime(lastLogin)` đẹp (đã có).
- File: `fe/src/navigation/roleNavModel.ts`, `fe/src/components/layout.tsx` (hoặc tab def)
  - Đổi label từ "Của tôi" / "Hồ sơ của tôi" → "Tôi".
- File: `fe/src/screens/shared/profile/TraderProfileLayout.tsx` (nếu có "của tôi" hardcode) — kiểm tra & đồng bộ.
- Acceptance: tab cuối ở bottom-nav hiển thị "Tôi"; UI profile có 7 InfoRow như trên; không còn input cho name/phone.

### Shared
- `be/libs/shared/src/dto/user-profile-update.dto.ts`: deprecate `displayName`, `phone` — nếu đơn giản: vẫn validate nhưng `updateMe` ignore.
- `be/libs/shared/src/dto/auth-login.dto.ts`: thêm `phoneToken?: string` & `phoneNumber?: string`.

### Config / DB
- `auth-service`: thêm env `ZALO_PHONE_DECRYPT_*` (nếu cần Zalo Phone API). Tài liệu hoá trong `.env.example`.
- `contract-service`: kiểm tra `synchronize=true` ở dev (tech-stack.md) — đủ để tạo bảng `trader_reviews` khi service restart.

## 5. Acceptance criteria

- [ ] Trang Trang chủ farmer load thành công, sensor cards + alerts hiển thị (200 OK cho `dashboard/farmer`, `monitoring/.../{latest,alerts,history}`).
- [ ] Tab Vườn: nút "+ Thêm vườn" hiện đầy đủ, không bị che bởi bottom nav (test trên 360×640 và 390×844).
- [ ] Tab Quy trình: không còn lỗi `Validation failed (uuid is expected)`. Khi user chưa có farm → hiển thị empty state.
- [ ] Tab Kết nối / Đối tác: search trader không lỗi 500; danh sách trả về (≥0 items).
- [ ] Tab Kết nối / Thị trường: không hiển thị mock; có data thật từ API hoặc empty-state rõ ràng.
- [ ] Tab Tôi:
  - [ ] Title hiển thị "Tôi" thay vì "Của tôi".
  - [ ] Hiển thị User ID, Zalo ID, Đăng nhập gần nhất.
  - [ ] Tên hiển thị + SĐT chỉ đọc; nút Sửa không hiện 2 ô input này.
  - [ ] PUT `/auth/me` thử ghi displayName/phone → BE ignore.
- [ ] Test:
  - [ ] BE: integration test cho `searchTraders empty`, `getFarmerDashboard noFarm`, `updateMe ignore name+phone`.
  - [ ] FE: unit test `ProfileScreen` snapshot view-mode (đảm bảo 7 InfoRow); regression e2e cho `phase-routes-smoke` không hỏng.
- [ ] NFR-R03: Snackbar tiếng Việt đúng cho mọi nhánh lỗi mới (UNAUTHORIZED / NETWORK / SERVICE_UNAVAILABLE).
- [ ] NFR-U03: touch target FAB ≥ 44px (đã 56px), font ≥ 14px (giữ nguyên).

## 6. Bước thực hiện (cho /implementation-plan)

1. **BE-monitoring** — thêm `ParseUUIDPipe` cho `farmId` trên 3 controller + cải thiện log/error trong `farm-access.guard.ts`. Restart service, verify 3 endpoint /latest /alerts /history với UUID thật.
2. **BE-contract/connections** — bọc try/catch + bootstrap `ensureTraderReviewsTable()` để search trader 200 OK. Verify `GET /traders/search`.
3. **BE-contract/dashboard** — đảm bảo `getFarmerDashboard()` không 500 khi user 0 farm; chuẩn hoá log + error mapping.
4. **BE-auth** — DTO login mở rộng nhận `phoneNumber`; `login()` lưu phone vào DB; `updateMe()` ignore displayName/phone (log warn).
5. **Shared DTO build** — cập nhật `UserProfileUpdateDto`, `AuthLoginRequestDto` trong `be/libs/shared/src/dto/`; chạy `npm run build --workspace=@trustagri/shared` trước services.
6. **FE-process** — bỏ default `farmId='farm-001'`, resolve UUID từ `listFarms`, thêm empty-state.
7. **FE-farm-profile** — nâng FAB bottom 24 → 88, paddingBottom content 80 → 96.
8. **FE-market-connect** — tạo `marketService.ts`, thay mock thành API call + empty-state cho tab Thị trường.
9. **FE-auth/login** — gọi ZMP `getPhoneNumber()` (best-effort, fail-soft), gửi kèm `phoneNumber` lên `/auth/login`.
10. **FE-profile** — đổi "Của tôi" → "Tôi" (nav + title), bỏ input name/phone trong edit form, thêm InfoRow user/zalo/lastLogin.
11. **Test** — viết unit/integration cho từng phần thay đổi BE/FE; chạy `npm run test` BE + FE; chạy `npm run test:visual` FE smoke.
12. **Manual smoke** — login bằng Zalo dev hoặc password-login → đi qua 5 tab farmer + 1 tab Tôi; xác minh acceptance.

## 7. Risks / Open questions

- **Zalo phone permission**: `getPhoneNumber()` của ZMP SDK trả `token` cần backend giải mã qua Zalo Open API (cần `secret_key`). Nếu chưa có cấu hình production, dùng nhánh `phoneNumber` plain text (chỉ dev) hoặc giữ phone null đến khi user nhập tay (yêu cầu có thể nới lỏng tạm). **→ Hỏi PM**.
- **Endpoint `/markets/forecasts` & `/markets/news`** chưa có trong specs / BE. Tạm thời FE hiển thị empty-state. Có nên scope endpoint mới vào plan này không? **→ Hỏi PM**.
- **`trader_reviews` table** đã có entity nhưng nếu DB hiện tại do `synchronize=true` chạy ở lần khởi động trước khi feature merge thì có thể chưa có. Nên backstop bằng `ensureTraderReviewsTable()` để search luôn 200 trên dev/staging.
- **Đổi label "Của tôi" → "Tôi"**: kiểm phụ thuộc i18n (`vi-VN.json` nếu có) — TrustAgri hiện hardcode VN nên ít rủi ro.

## 8. Estimate

- **Effort:** L (3 services BE + 4 screens FE + DTO + test).
- **Order of execution:**
  1. BE first (monitoring, dashboard, search, auth) — vì FE cần BE đúng để verify.
  2. Shared DTO rebuild.
  3. FE screens (process → farm-profile → market-connect → profile).
  4. Tests + smoke cuối.
- **Suggested commits:** 6–8 commit nhỏ (mỗi tab + BE module).
