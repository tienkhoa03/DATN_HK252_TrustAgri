# Plan: MVP Polish & Feature Completion

**Created:** 2026-05-08
**Status:** in-progress (Phase A done; B3/B4/B5 done; B1/B2/Phase C pending)
**Owner:** tienkhoa03@gmail.com
**Related:** US-F01..F05, US-T01..T04, US-U01..U06, US-G01..G02, FR-F01/F03/F06/F07/F08/F09, FR-T01/T05/T06/T08/T11/T12, FR-U06, FR-G01, FR-S01, NFR-A01, NFR-A02, NFR-C01, NFR-P01, NFR-P02, NFR-R02, NFR-R03, NFR-S02, NFR-U01, NFR-U02, NFR-U03

---

## 1. Mục tiêu

Đóng các gap thực tế giữa code hiện tại và spec/requirements: (A) loại bỏ mock/hardcode còn sót, kích hoạt Zalo OAuth thật; (B) bổ sung tính năng còn thiếu (IoT device, daily care plan tasks, QR render, avatar upload, notification bell global); (C) hardening NFR (offline-first, WS reconnect, bundle check, E2E golden path). Đưa MVP từ trạng thái "demo-ready" lên "staging-ready".

## 2. Scope

### In scope

- **A. Dọn mock & 4 chế độ Auth chọn qua ENV**
  - Hệ thống hỗ trợ **4 chế độ auth** chọn qua `VITE_AUTH_MODE`:
    1. `zalo-oauth` — Zalo OAuth thật (`getAccessToken` từ `zmp-sdk` → `POST /auth/login`).
    2. `zalo-token` — token Zalo thủ công từ `VITE_ZALO_API_KEY` → `POST /auth/login` (dùng khi không chạy trong Mini App env nhưng có token thật để test).
    3. `dev-seeded` — user giả seed sẵn DB với role gán sẵn → `POST /auth/dev-login` (dùng `VITE_DEV_LOGIN_SECRET` + `VITE_DEV_LOGIN_ZALO_ID`).
    4. `password` — form username/password → `POST /auth/password-login` (demo).
  - **Mode 1, 2, 3 đều biểu hiện như Zalo Mini App**: auto-bootstrap khi mở app, KHÔNG hiển thị `LoginScreen`; routing thẳng tới home theo role.
  - **Mode 4** hiển thị `LoginScreen` username/password.
  - Thay `MOCK_DEVICES`, `MOCK_REVIEWS`, `defaultTasks`, profile state cứng bằng API thật / API mới.
  - Xóa hardcode `farmName`, `currentDay/totalDays/growthStage` từ `FarmerDashboardScreen`/`FarmerProcessScreen` — đọc từ farm hiện tại + standard.
  - `TraderProfileNewsScreen`: phần "Hồ sơ công ty" gọi `GET/PUT /auth/me` với `traderProfile`.
  - Quick actions `pump/light/fan` ở `FarmerDashboardScreen`: hoặc ẩn nếu chưa có IoT command API (MVP), hoặc nối với endpoint mới (Phase B2).

- **B. Tính năng thiếu**
  - **B1. IoT device management** — module mới `monitoring-service/src/devices/` (CRUD, status, battery). FE: tab "Thiết bị IoT" trong `FarmerFarmProfileScreen` thay `MOCK_DEVICES`.
  - **B2. Daily care plan / today tasks** — module mới `farm-service/src/care-plans/` sinh task từ `standardSteps` + `farm.standardId` + lịch trồng. FE: tab "Công việc" của `FarmerProcessScreen` thay `defaultTasks`.
  - **B3. QR render thật** — dùng `qrcode` (npm) để render `traceabilityCode` thành SVG/Canvas. FE: `FarmerFarmProfileScreen`, `BuyerProductDetailScreen`.
  - **B4. Avatar upload** — `chooseImage` (ZMP SDK) → upload qua endpoint mới `POST /auth/me/avatar` (auth-service) → trả URL CDN. FE: `ProfileScreen`.
  - **B5. Notification bell global** — đưa `BuyerNotificationBell` lên shared, hiển thị trong `RoleAppShell` cho farmer + trader; click → màn list notifications dùng chung.

- **C. Hardening NFR**
  - **C1. Offline-first farms list** — cache `listFarms` vào localStorage; render từ cache khi offline (NFR-A02).
  - **C2. WS reconnect/heartbeat** — exponential backoff trong `useMonitoring`/`monitoringService`; ping/pong 30s (NFR-A01, NFR-X01).
  - **C3. Bundle size CI check** — script `npm run build:check` chạy trên CI, fail nếu > 18MB (buffer 2MB cho NFR-C01).
  - **C4. E2E golden path** — Playwright: guest QR → buyer order → trader proposal → farmer care log → acknowledge alert.
  - **C5. Integration tests gap** — bổ sung test cho luồng care-log sync conflict, contract change-request lifecycle, traceability public.

### Out of scope

- Payment escrow, chat service, push notification thực qua ZNS/SMS (giữ stub).
- Predictive price/imputation model thật (giữ heuristic hiện tại).
- Admin panel.
- Multi-language ngoài tiếng Việt.
- Reviews/rating cho `GuestProductDetailScreen` (MOCK_REVIEWS giữ tạm hoặc xóa khỏi UI nếu không có API).

---

## 3. Tham chiếu

- `.claude/docs/requirements.md` §2 (FR), §3 (NFR), §4 (traceability matrix)
- `.claude/docs/architecture.md` §2.3, §5.3, §5.4, §5.5
- `.claude/docs/business-logic.md` §1, §2, §3, §4, §6, §7, §8
- `.claude/docs/tech-stack.md` (DB schema, ZMP SDK, Axios)
- `.claude/docs/design-system.md` (tokens, touch target, font)
- `/specs/backend-api-specification/design.md` — endpoint contract (KHÔNG sửa)
- `/specs/frontend-ui-specification/design.md` — screen layout
- `/specs/backend-api-specification/tasks.md` Phase 1, 6, 7, 18
- `/specs/frontend-ui-specification/tasks.md` Phase 1, 3, 5, 6, 18, 20

---

## 4. Thay đổi dự kiến

### 4.1 Group A — Dọn mock & 4-mode Auth

#### A1. Multi-mode authentication (chọn qua ENV)

**Mục tiêu:** Một codebase chạy được 4 phương án auth bằng cách đổi biến env, KHÔNG cần đổi code khi build.

**Env config (FE)**

```
# Chế độ auth: bắt buộc 1 trong 4
VITE_AUTH_MODE=zalo-oauth | zalo-token | dev-seeded | password

# Mode 'zalo-token' — token Zalo dán thủ công
VITE_ZALO_API_KEY=<zalo-access-token>

# Mode 'dev-seeded' — secret + zaloId của user đã seed
VITE_DEV_LOGIN_SECRET=<min-16-chars>
VITE_DEV_LOGIN_ZALO_ID=<seeded-zalo-id>

# Mode 'password' — không cần thêm gì FE; user gõ trực tiếp
```

**Env config (BE auth-service)**

```
AUTH_DEV_LOGIN_ENABLED=true|false        # bật mode 3
DEV_LOGIN_SECRET=<min-16-chars>
AUTH_PASSWORD_LOGIN_ENABLED=true|false   # bật mode 4
NODE_ENV=development                      # mode 3, 4 chỉ chạy khi !=production
```

**Frontend — sửa file**

- `fe/src/config/env.ts` — mở rộng `AUTH_MODE` thành union 4 giá trị `'zalo-oauth' | 'zalo-token' | 'dev-seeded' | 'password'`. Thêm validate: nếu `AUTH_MODE=zalo-token` mà thiếu `VITE_ZALO_API_KEY` → throw startup error; tương tự `dev-seeded` cần đủ secret + zaloId.
- File mới: `fe/src/services/authStrategy.ts` — export `bootstrapAuthSession(): Promise<AuthSession>` chọn nhánh theo `ENV.AUTH_MODE`:
  - `zalo-oauth` → import động `getAccessToken` từ `zmp-sdk/apis` → `authService.login(token)`.
  - `zalo-token` → `authService.login(ENV.ZALO_API_KEY)`.
  - `dev-seeded` → `authService.devLogin(ENV.DEV_LOGIN_SECRET, ENV.DEV_LOGIN_ZALO_ID)`.
  - `password` → throw `RequirePasswordLoginError` (handler ở RootEntry chuyển sang `/login`).
- Sửa `fe/src/router/routes.tsx` `RootEntry`:
  - Nếu đã có session → navigate role home.
  - Nếu mode ∈ {`zalo-oauth`, `zalo-token`, `dev-seeded`} → gọi `bootstrapAuthSession()` → set Jotai → navigate role home (UX: spinner toàn màn, KHÔNG show LoginScreen — biểu hiện như Zalo Mini App).
  - Nếu mode = `password` → navigate `/login`.
  - Bỏ logic `ENV.USE_MOCK` khỏi RootEntry; `USE_MOCK` chỉ giữ cho mock service layer (nếu còn cần) — KHÔNG quyết định auth nữa.
- Sửa `fe/src/pages/LoginScreen.tsx` — chỉ render khi `AUTH_MODE=password`. Form username/password → `passwordLogin()`. Nếu user navigate tới `/login` ở mode khác → redirect "/" (an toàn).
- Xóa / deprecate `fe/src/services/mockAuthBootstrap.ts` (hoặc reduce thành nhánh trong `authStrategy.ts` nếu vẫn cần mock pure FE).

**Backend — sửa/giữ**

- Giữ `POST /auth/login`, `POST /auth/dev-login`, `POST /auth/password-login` như hiện tại (đã implement).
- Đảm bảo `dev-login` & `password-login` reject khi `NODE_ENV=production` hoặc cờ env tương ứng tắt (đã có guard).
- Bổ sung tài liệu SQL seed dev users với 3 role (farmer, trader, buyer) + zaloId cố định, ví dụ:
  - `dev-farmer-001` / role=farmer
  - `dev-trader-001` / role=trader
  - `dev-buyer-001`  / role=buyer
- File seed: `be/apps/auth-service/src/migrations/seeds/dev-users.sql` (nếu chưa có).

**Acceptance**

- `VITE_AUTH_MODE=zalo-oauth` + chạy trong Zalo Mini App env → vào "/" → spinner → đăng nhập Zalo SDK thật → vào role home. KHÔNG thấy `LoginScreen`.
- `VITE_AUTH_MODE=zalo-token` + token hợp lệ → vào "/" → spinner → `POST /auth/login` thành công → role home. KHÔNG thấy `LoginScreen`.
- `VITE_AUTH_MODE=dev-seeded` + secret + zaloId hợp lệ + user đã seed → vào "/" → spinner → `POST /auth/dev-login` → role home. KHÔNG thấy `LoginScreen`.
- `VITE_AUTH_MODE=password` → vào "/" → redirect `/login` → form username/password → `POST /auth/password-login` → role home.
- Sai mode hoặc thiếu env bắt buộc → throw startup error rõ ràng (không silent fallback).
- Logout ở mọi mode → clear Jotai + redirect đúng entry mode (mode 1-3 retry bootstrap; mode 4 về `/login`).
- Switch mode bằng đổi env + rebuild — KHÔNG cần sửa code.

#### A2. Xóa hardcode farmName/growthStage/tasks/devices

**Frontend**
- `fe/src/screens/farmer/dashboard/FarmerDashboardScreen.tsx`: bỏ default `farmName="Farm Lab A"`, `currentDay/totalDays/growthStage` cứng; đọc từ `farmSummary` + `selectedFarm` (load `getFarm` nếu cần).
- `fe/src/screens/farmer/process/FarmerProcessScreen.tsx`: bỏ `defaultTasks`; thay bằng `useCarePlan(farmId)` (Phase B2). Tạm hiển thị empty state khi B2 chưa xong.
- `fe/src/screens/farmer/farm-profile/FarmerFarmProfileScreen.tsx`: chuyển `MOCK_DEVICES` sang `useDevices(farmId)` (Phase B1).
- `fe/src/screens/guest/product-detail/GuestProductDetailScreen.tsx`: ẩn block "Đánh giá" nếu chưa có API (hoặc giữ stub có comment rõ ràng).
- `fe/src/screens/farmer/dashboard/FarmerDashboardScreen.tsx`: ẩn quick actions `pump/light/fan` nếu chưa có command API (giữ B2 sau).

#### A3. TraderProfileNewsScreen — Hồ sơ thật

**Frontend**
- Sửa `fe/src/screens/trader/profile-news/TraderProfileNewsScreen.tsx`: dùng `getMe()` + `updateMe({ traderProfile, displayName, phone, email })`. Bỏ `companyProfile` local state.

**Acceptance**
- Mở tab "Hồ sơ" → load real profile; sửa → `PUT /auth/me` thành công, snackbar; reload lại đúng dữ liệu.

---

### 4.2 Group B — Tính năng thiếu

#### B1. IoT device management

**Backend** (`be/apps/monitoring-service/`)
- File mới: `src/devices/devices.module.ts`, `devices.controller.ts`, `devices.service.ts`, `dto/{create,update,query}-device.dto.ts`, `entities/device.entity.ts` (tái dùng `sensor-device.entity.ts` hiện có nếu fit).
- Endpoint:
  - `GET    /api/v1/monitoring/farms/:farmId/devices` — list (auth: chủ farm/trader hợp đồng).
  - `POST   /api/v1/monitoring/farms/:farmId/devices` — create.
  - `PATCH  /api/v1/monitoring/devices/:id` — update name/status.
  - `DELETE /api/v1/monitoring/devices/:id` — soft delete.
- DB migration: bảng `iot_devices` (id, farmId, name, status, batteryLevel, lastUpdate, sensorTypes[], createdAt, deletedAt).
- DTO mới trong `be/libs/shared/src/dto/monitoring.dto.ts`: `IotDeviceDto`, `CreateIotDeviceDto`.

**Frontend**
- Service mới: `fe/src/services/deviceService.ts` (`listDevices`, `createDevice`, `updateDevice`, `deleteDevice`).
- Hook mới: `fe/src/hooks/useDevices.ts`.
- Sửa `FarmerFarmProfileScreen.tsx` — thay `MOCK_DEVICES` block bằng list từ hook + form thêm/sửa device.

**Acceptance**
- Farmer xem danh sách thiết bị thật, thêm/sửa/xóa hoạt động; battery & status hiển thị đúng.
- Trader có hợp đồng với farm thấy được list (read-only).

#### B2. Daily care plan / today tasks

**Backend** (`be/apps/farm-service/`)
- Module mới: `src/care-plans/`.
- Endpoint:
  - `GET /api/v1/farms/:farmId/care-plan/today` — trả `Task[]` sinh từ `farm.standardId` + `farm.plantingDate` + offset `step.expectedDurationDays`.
  - `POST /api/v1/farms/:farmId/care-plan/tasks/:taskId/complete` — đánh dấu hoàn thành (link care log nếu có).
- DTO mới `DailyTaskDto { id, title, description, dueAt, hasGuide, guideContent, standardStepId, completed }`.
- Logic: chiếu standard.steps theo planting date → filter task của ngày hiện tại; merge với care logs để tính `completed`.

**Frontend**
- Service `fe/src/services/carePlanService.ts`.
- Hook `useCarePlan(farmId)`.
- Sửa `FarmerProcessScreen.tsx` tab "Công việc" — dùng hook, bỏ `defaultTasks`.

**Acceptance**
- Mở tab "Công việc" → list task hôm nay từ standard; check task → POST complete; refresh thấy đúng trạng thái.

#### B3. QR code render

**Frontend**
- Add lib: `qrcode.react` (~10KB) hoặc `qrcode` (canvas).
- Component mới: `fe/src/design-system/components/QRCode/QRCode.tsx`.
- Sửa `FarmerFarmProfileScreen.tsx` — block QR render `https://trustagri.vn/trace?code=${farm.traceabilityCode}` thành QR thật.
- Sửa `BuyerProductDetailScreen.tsx` (nếu có hiển thị QR) — tương tự.

**Acceptance**
- QR render được, scan bằng app camera trỏ đúng URL guest traceability.
- Bundle tăng < 30KB (kiểm `npm run build:check`).

#### B4. Avatar upload

**Backend** (`be/apps/auth-service/`)
- Endpoint: `POST /api/v1/auth/me/avatar` — multipart, lưu file (MVP: lưu local path / S3 stub), trả `{ avatarUrl }` + cập nhật `users.avatar_url`.
- Validate: max 2MB, type `image/*`.

**Frontend**
- Sửa `fe/src/services/authService.ts` — thêm `uploadAvatar(file: Blob)`.
- Sửa `fe/src/screens/shared/profile/ProfileScreen.tsx` — nút "Đổi ảnh", gọi `chooseImage` (zmp-sdk) → upload → cập nhật atom.

**Acceptance**
- Đổi ảnh thành công, hiển thị mới; lỗi 2MB trả friendly message.

#### B5. Notification bell global

**Frontend**
- Promote `fe/src/screens/buyer/components/BuyerNotificationBell.tsx` → `fe/src/components/NotificationBell.tsx` (role-agnostic).
- Sửa `fe/src/navigation/RoleAppShell.tsx` — render bell trong header cho `farmer/trader/buyer` (không cho guest).
- Click bell → navigate `/notifications` (route mới shared) — màn list notifications dùng `notificationService.list`.
- Route mới `/notifications` (shared, lazy).

**Acceptance**
- Mọi role đăng nhập đều thấy bell + badge count chính xác; click → list notifications + tap item → `linkTo` navigate đúng.

---

### 4.3 Group C — Hardening NFR

#### C1. Offline-first farms list (NFR-A02)

**Frontend**
- Sửa `fe/src/services/farmService.ts` — sau mỗi `listFarms` thành công, lưu vào `localStorage[farms:cache:<ownerId>]`.
- Sửa `fe/src/hooks/useFarms.ts` — khi `navigator.onLine === false` HOẶC request fail với NETWORK_ERROR, đọc cache; gắn flag `fromCache=true` để UI hiển thị banner "Đang offline — dữ liệu lưu cục bộ".

**Acceptance**
- Bật airplane mode → mở `FarmerFarmProfileScreen` → vẫn xem được list đã cache, banner offline hiển thị.

#### C2. WebSocket reconnect & heartbeat

**Frontend**
- Sửa `fe/src/services/monitoringService.ts` (hoặc nơi WS init) — exponential backoff (1s, 2s, 4s, ... max 30s), max 10 retries; ping `'ping'` mỗi 25s, expect `'pong'` trong 5s, ngược lại đóng + reconnect.
- Hiển thị toast khi mất WS > 30s + retry success.

**Acceptance**
- Tắt server / mạng → console log retry; bật lại → reconnect tự động + tiếp tục push.

#### C3. Bundle size CI check (NFR-C01)

- Sửa `fe/package.json` script `build:check` — fail nếu `dist/` > 18MB.
- Thêm GitHub Actions / pre-push hook chạy `npm run build:check` (nếu có CI yaml).

**Acceptance**
- Bundle hiện tại < 18MB; build check pass; cố ý import lib lớn → fail.

#### C4. E2E Playwright golden path

- File mới: `fe/src/tests/e2e/golden-path.spec.ts`.
- Kịch bản:
  1. Guest scan QR (mock product code) → traceability page render OK.
  2. Buyer login (dev-login) → đăng nhu cầu mua.
  3. Trader login → tạo proposal cho buying request đó.
  4. Buyer accept proposal → contract created.
  5. Farmer login → log care, sync, acknowledge alert giả.
- Run: `npm run test:visual` xanh.

#### C5. Integration tests gap

**Backend** (`be/integration-tests/`)
- File mới: `care-log-sync-conflict.spec.ts` — gửi cùng `clientRecordId` 2 lần → chỉ accept lần đầu.
- File mới: `contract-change-request-lifecycle.spec.ts` — create → status `pending_change` → accept → apply diff.
- File mới: `traceability-public.spec.ts` — gọi `/traceability/qr/:code` không header auth → 200; sai code → 404 friendly.

---

## 5. Acceptance criteria (tổng)

- [ ] Tất cả mock/hardcode liệt kê ở §4.1 đã thay bằng API thật hoặc bị ẩn rõ ràng.
- [ ] 4 chế độ auth (`zalo-oauth` / `zalo-token` / `dev-seeded` / `password`) đều hoạt động end-to-end khi đổi `VITE_AUTH_MODE`; mode 1/2/3 không hiện `LoginScreen`; mode 4 hiện form username/password.
- [ ] Sai/thiếu env bắt buộc cho mode đang chọn → throw startup error rõ ràng (KHÔNG silent fallback).
- [ ] IoT devices, daily tasks, QR render, avatar upload, notification bell hoạt động cho role tương ứng.
- [ ] Offline farms list xem được không cần mạng (NFR-A02).
- [ ] WS auto-reconnect khi mất mạng tạm thời (NFR-A01 giữ liên tục).
- [ ] Bundle < 18MB; CI check tự động (NFR-C01).
- [ ] Playwright golden path xanh.
- [ ] Integration tests mới xanh.
- [ ] 3-click rule (NFR-U01) cho `alert→ack` và `home→care log` vẫn đảm bảo.
- [ ] Không có hardcode màu/font/spacing ngoài `design-system/tokens/`.
- [ ] Touch target ≥ 44px, font ≥ 14px (NFR-U03).
- [ ] Mọi endpoint mới có `@UseGuards(JwtAuthGuard)` trừ public.

---

## 6. Bước thực hiện (cho /implementation-plan)

> Order tổng: A1 → A2/A3 song song với B1/B3 → B2/B4/B5 → C1/C2 → C3/C4/C5.

### Phase A — Dọn mock & 4-mode Auth (1 sprint) — ✅ DONE

1. **A1.0** ✅ Mở rộng `fe/src/config/env.ts` với union `AUTH_MODE` 4 giá trị + validate startup (fail-fast nếu thiếu env).
2. **A1.1** ✅ Tạo `fe/src/services/authStrategy.ts` chứa `bootstrapAuthSession()` + `RequirePasswordLoginError`.
3. **A1.2** ✅ Sửa `RootEntry` trong `routes.tsx` — gọi `bootstrapAuthSession()` cho mode 1/2/3 (auto-bootstrap, biểu hiện như Mini App), redirect `/login` cho mode 4.
4. **A1.3** ✅ Viết lại `LoginScreen.tsx` — form username/password; guard redirect "/" nếu mode != password.
5. **A1.4** ✅ Seed `be/scripts/seed-dev-users.sql` đã có sẵn (4 role: farmer/trader/buyer/guest) + cập nhật `fe/.env.example` mô tả 4 mode.
6. **A1.5** ⚠️ Smoke test thủ công — TS typecheck pass cho file đã sửa; user cần test thực tế bằng đổi `VITE_AUTH_MODE` + rebuild.
7. **A2** ✅ Xóa hardcode/mock:
   - `FarmerDashboardScreen`: bỏ default `farmName="Farm Lab A"`; ẩn Quick Actions pump/light/fan; ẩn card "Giai đoạn sinh trưởng".
   - `FarmerProcessScreen`: xóa `defaultTasks`; bỏ default props `currentDay/totalDays/growthStage/farmName="Sầu riêng Monthong"`; tab Công việc hiện empty state.
   - `FarmerFarmProfileScreen`: xóa `MOCK_DEVICES` + `SENSOR_LABELS`; thay bằng placeholder "sắp ra mắt".
   - `GuestProductDetailScreen`: xóa `MOCK_REVIEWS` + block đánh giá.
8. **A3** ✅ `TraderProfileNewsScreen` — load `getMe()` khi mở tab Hồ sơ; `handleSaveProfile()` gọi `updateMe({ phone, email, traderProfile })`. Hỗ trợ trustScore read-only.

### Phase B — Feature gaps (2 sprint) — partial

4. **B1** ⏸ BE: tạo migration `iot_devices` + module `devices`. **DEFERRED** — cần BE entity mới + module + shared DTO; nên có session riêng để test kỹ.
5. **B1** ⏸ FE: `deviceService.ts` + `useDevices` hook + tab Devices. **DEFERRED** — phụ thuộc B1 BE. Hiện FarmerFarmProfileScreen show placeholder "sắp ra mắt".
6. **B2** ⏸ BE: module `care-plans` + endpoint `today`/`complete`. **DEFERRED** — cần thêm cột `farms.planting_date` trước (DB migration); phụ thuộc B1 entity pattern.
7. **B2** ⏸ FE: `carePlanService.ts` + `useCarePlan` + tab "Công việc". **DEFERRED** — phụ thuộc B2 BE. Hiện FarmerProcessScreen show empty state.
8. **B3** ✅ FE: cài `qrcode.react@^4.2.0`; component `fe/src/design-system/components/QRCode/QRCode.tsx`; replace icon QR trong `FarmerFarmProfileScreen` bằng QR thật từ `traceabilityCode` (fallback compute từ `farm.id`). Thêm field `traceabilityCode?: string` vào `FarmDto`.
9. **B4** ✅ BE: KHÔNG cần endpoint riêng — dùng existing `PUT /auth/me { avatarUrl }` với data URL. Đơn giản hóa cho MVP (avatar lưu base64 trong DB). Production cần migrate sang multipart + S3 (R3 trong plan).
10. **B4** ✅ FE: `uploadAvatar(blob)` trong `authService.ts` (max 200KB, convert base64 → updateMe); nút "📷" trong `ProfileScreen` ProfileHero (ZMP `chooseImage` + browser fallback file input).
11. **B5** ✅ FE: tạo `fe/src/components/NotificationBell.tsx` (role-agnostic); `BuyerNotificationBell` chuyển thành wrapper backward-compat; tạo route `/notifications` + `fe/src/screens/shared/notifications/NotificationsScreen.tsx` (list + read + readAll). Lưu ý: chưa tự động render bell trong `RoleAppShell` (cần thiết kế top header chung — out of scope session này).

### Phase C — Hardening (1 sprint)

12. **C1** FE: cache `listFarms` localStorage + offline banner. Test airplane mode.
13. **C2** FE: WS reconnect + heartbeat trong `monitoringService`. Verify với server kill.
14. **C3** Script `build:check` 18MB threshold + CI hook.
15. **C4** Playwright golden path.
16. **C5** Integration tests BE (care-log conflict, contract change-request, traceability).

### Phase D — Final verify

17. Audit lại tokens (color/font/spacing) toàn bộ screen mới.
18. Run `npm run lint` BE + FE; `npm run test`; `npm run build:check`; `npm run test:visual`.
19. Cập nhật `agent-notes.md` (nếu phát sinh guardrail mới).

---

## 6.1 Blockers / Deferred

- **B1 IoT Devices** — Deferred to next session. Cần: entity `IotDeviceEntity` (id, farmId, name, status, batteryLevel, lastUpdate, sensorTypes[]); module `devices` trong `monitoring-service`; DTO trong `@trustagri/shared`; service `deviceService` FE; tab/CRUD UI thay placeholder hiện tại.
- **B2 Daily Care Plan** — Deferred to next session. Phụ thuộc:
  - Cột mới `farms.planting_date date` (migration).
  - Logic compute today's tasks từ `standard.steps[].expectedDurationDays` + planting_date.
  - Endpoint `GET /farms/:id/care-plan/today` + `POST /care-plan/tasks/:taskId/complete`.
- **B5 RoleAppShell bell integration** — Bell component + route đã sẵn. Render trong shell cần thiết kế top header thống nhất cho farmer/trader/buyer (hiện mỗi screen có header riêng) — out of scope session này.

## 7. Risks / Open questions

- **R1.** Zalo OAuth chỉ chạy được trên Zalo Mini App env thật; testing cần ZMP dev account.
- **R2.** B2 (care plan) phụ thuộc `farm.plantingDate` — entity hiện tại có chưa? Nếu thiếu → migration thêm column `planting_date date`.
- **R3.** B4 avatar upload — chưa rõ có S3/CDN. Tạm dùng local disk + `/uploads/avatars/<uuid>.jpg` cho MVP; doc rõ là không production-ready.
- **R4.** B5 notification bell — đã có `notificationService` nhưng chưa rõ realtime. Tạm poll 30s; sau thêm WS.
- **R5.** C2 reconnect — cần align với Socket.IO config (nếu dùng socket.io-client built-in retry, có thể chỉ cần config).
- **R6.** A1 nếu Zalo SDK trả token nhưng BE Zalo verify lỗi → cần test với credentials thật hay mock Zalo API.
- **Open.** Quick actions IoT (`pump/light/fan`) — có scope command API trong roadmap không? Nếu có → Phase B6.

---

## 8. Estimate

- **Effort:** XL (~3 sprint × 2 dev — 1 BE + 1 FE).
- **Order:** Phase A (1 wk) → Phase B (2 wk parallel BE/FE) → Phase C (1 wk) → Phase D (2 days).
- **Critical path:** A1 (Zalo) → B1/B2 (BE migrations) → B5 (depend B1 stable).
- **Parallelizable:** A2/A3 ‖ B3 ‖ C3; C1/C2 ‖ C4/C5.
