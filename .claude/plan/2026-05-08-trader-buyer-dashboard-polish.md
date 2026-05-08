# Plan: Trader / Buyer Dashboard Polish

**Created:** 2026-05-08
**Status:** done
**Owner:** tienkhoa03@gmail.com
**Related:** US-T01, US-T05, US-U01, US-U02, FR-T02, FR-T12, FR-U01, FR-U02, FR-G02, NFR-A01, NFR-A02, NFR-P02, NFR-U01, NFR-U02, NFR-U03

---

## 1. Mục tiêu

Hoàn thiện chất lượng UX của 4 screen chính role trader/buyer (TraderDashboard, BuyerDashboard, BuyerMarketplace, BuyerProfileNotification): xóa hardcode còn sót, chuẩn hóa loading/empty/error states, tích hợp connection status banner (từ Phase C2), auto-refresh dashboard khi WS reconnect, real news/forecast feed thay placeholder, audit 3-click rule + design tokens. Không thêm feature nghiệp vụ mới — chỉ polish.

## 2. Scope

### In scope

- **D1. Trader Dashboard polish** — load `traderName`/`companyName` thật từ `getMe()`; thêm period filter `today | 7days | 30days` + truyền lên BE (param `period`); auto-refresh khi WS reconnect sau downtime > 30s.
- **D2. Buyer Marketplace polish** — thay `NEWS_ITEMS` mock bằng `listNews({ limit: 5 })` từ notificationService; load `buyerName` từ session; pagination "Xem thêm" thay vì load all.
- **D3. Buyer Dashboard widget polish** — empty state friendly khi chưa có order/contract; thêm KPI "Tổng chi tiêu" từ `dashboard.summary.totalSpent` (đã có ở BE từ Phase 19).
- **D4. Connection status banner shared** — component `ConnectionStatusBanner` dùng `subscribeConnectionStatus()`; nhúng vào TraderDashboard, BuyerDashboard, FarmerDashboard, BuyerDigitalTwinMonitor.
- **D5. Empty state + skeleton chuẩn hóa** — tất cả screen list (orders, proposals, contracts, news, products) dùng cùng một pattern empty state (icon + msg + CTA).
- **D6. 3-click rule audit (NFR-U01)** — verify alert → ack ≤ 2 click; home → care log ≤ 3 click; home → đăng nhu cầu mua ≤ 3 click. Ghi nhận deviation.
- **D7. Design tokens audit** — grep hardcoded color/font/spacing trong 4 screen + replace bằng tokens. Touch target 44×44 + min font 14px (NFR-U03).

### Out of scope

- Tính năng nghiệp vụ mới (đặt hàng, hợp đồng, payment escrow).
- Real-time chart streaming (chỉ refresh khi reconnect, không stream).
- Pagination infinite scroll (chỉ "Xem thêm" button).
- Multi-language (tiếng Việt only).
- Migration BE — D1 period filter dùng filter FE-side trước; nếu BE chưa hỗ trợ `period` param thì giữ FE-side slicing.

---

## 3. Tham chiếu

- `.claude/docs/requirements.md` §2.2 (FR-T02), §2.3 (FR-U01..U06), §3.3 (NFR-U01/U02/U03).
- `.claude/docs/design-system.md` (tokens, touch target, font-size).
- `.claude/docs/business-logic.md` §5 (Marketplace), §7 (Notifications).
- `/specs/frontend-ui-specification/design.md` §dashboard layouts.
- `/specs/backend-api-specification/design.md` §4.7 (`/dashboard/{trader|buyer}` response).

---

## 4. Thay đổi dự kiến

### 4.1 D1 — Trader Dashboard polish

**Files**
- `fe/src/screens/trader/dashboard/TraderDashboardScreen.tsx`:
  - Bỏ default `traderName='Thương lái'`, `companyName='Công ty TNHH Nông sản'`.
  - Add `useEffect` gọi `getMe()` → set `traderName = profile.displayName`, `companyName = profile.traderProfile?.companyName ?? '-'`.
  - Add period option `'today'` (1 day) + truyền `period` query param tới `fetchTraderDashboard({ period })` nếu service hỗ trợ; fallback FE-side slicing nếu không.
  - Add `useEffect(subscribeConnectionStatus(...))` — khi nhận `'connected'` với `downtimeMs > 30s` → refetch dashboard.

**Acceptance**
- Mở dashboard → thấy đúng tên + công ty từ session, không phải default placeholder.
- Đổi period → biểu đồ + KPI cập nhật đúng.
- Tắt WS > 30s rồi bật lại → dashboard tự refetch + hiện toast "Đã đồng bộ lại".

### 4.2 D2 — Buyer Marketplace polish

**Files**
- `fe/src/screens/buyer/marketplace/BuyerMarketplaceScreen.tsx`:
  - Xóa `NEWS_ITEMS` array.
  - Add `useState<NewsArticleDto[]>` + `useEffect` gọi `listNews({ limit: 5, category: 'price_forecast' })` từ `newsForecastService`.
  - Empty state khi BE không có news: ẩn banner thay vì hiện mock.
  - `buyerName` default lấy từ `useProfile().profile?.displayName`.
  - List `listProducts({ page, limit: 12 })` thay vì load all; nút "Xem thêm" tăng page.

**Acceptance**
- News banner hiện 3-5 bài thật từ BE; ẩn khi BE rỗng.
- Marketplace load 12 product đầu, click "Xem thêm" load thêm 12.
- Tên buyer trong header là `displayName` thật.

### 4.3 D3 — Buyer Dashboard widget polish

**Files**
- `fe/src/screens/buyer/dashboard/BuyerDashboardScreen.tsx`:
  - Empty state khi `data.totalOrders === 0` + `totalContracts === 0`: hiện CTA "Bắt đầu đặt hàng đầu tiên" → navigate `/buyer/request`.
  - Add KPI tile `data.summary.totalSpent` (nếu BE trả) — format VNĐ.

**Acceptance**
- Buyer mới (chưa có đơn) thấy CTA đặt hàng thay vì 0/0/0 lạnh lùng.
- Buyer có đơn thấy KPI "Tổng chi tiêu" đúng số.

### 4.4 D4 — ConnectionStatusBanner

**Files mới**
- `fe/src/components/ConnectionStatusBanner.tsx`:
  - Subscribe `subscribeConnectionStatus()` từ `monitoringSocket`.
  - Hiển thị banner khi status = `'reconnecting'` hoặc `'disconnected'`.
  - Auto-hide 3s khi `'connected'` với `downtimeMs > 30s` (toast "Đã kết nối lại").
  - Style: top-mounted, color theo severity (yellow/red/green).

**Wire vào**
- `TraderDashboardScreen`, `BuyerDashboardScreen`, `FarmerDashboardScreen`, `BuyerDigitalTwinMonitorScreen`.

**Acceptance**
- Tắt mạng → banner đỏ "Mất kết nối — đang thử lại…" hiện ngay.
- Bật lại → banner xanh "Đã kết nối lại" 3s rồi tự ẩn.

### 4.5 D5 — Empty state + skeleton chuẩn hóa

**Files mới**
- `fe/src/design-system/components/EmptyState/EmptyState.tsx`:
  - Props: `icon: string` (emoji or IconName), `title: string`, `description?: string`, `cta?: { label, onClick }`.
  - Style: center, min-height 200, padding lg, color text.secondary.

**Replace usage trong**
- `BuyerOrdersProposalsScreen`, `BuyerTransactionHistoryScreen`, `TraderTradingOrdersScreen`, `FarmerContractsScreen`, `FarmerAlertListScreen`.

**Acceptance**
- Mỗi list rỗng → hiện EmptyState với icon + msg + CTA phù hợp.
- Code grep `(textAlign: 'center'|fontSize: 48)` cho list-empty: không còn duplicate inline.

### 4.6 D6 — 3-click rule audit (NFR-U01)

**Đo**
- Path: home → alert tap → ack → 2 click. ✅ (đã có trên FarmerDashboard).
- Path: home → care log → save → cần verify ≤ 3 click.
- Path: buyer home → đăng nhu cầu → 1 click (FAB) ✅.

**Files**
- Document trong `.claude/docs/usability-audit.md` (mới) — bảng path + click count.

**Acceptance**
- Bảng trong audit doc cho thấy mọi core flow ≤ 3 click. Deviation note.

### 4.7 D7 — Design tokens audit

**Files**
- 4 screen: `TraderDashboardScreen`, `BuyerDashboardScreen`, `BuyerMarketplaceScreen`, `BuyerProfileNotificationScreen`.
- Grep regex: `color:\s*['"]#`, `fontSize:\s*['"]\d+px`, `padding:\s*['"]\d+px` (hardcode ngoài tokens).
- Replace bằng `colors.*`, `fontSize.*`, `spacing.*`.

**Acceptance**
- Grep trên 4 screen → 0 match hardcoded color (trừ alpha overlay `${color}18` cho phép).
- Touch target ≥ 44px (button height); font ≥ 14px cho thông tin quan trọng.

---

## 5. Acceptance criteria (tổng)

- [ ] Trader/Buyer dashboard load tên + company từ profile thật, không default placeholder.
- [ ] Buyer marketplace news + product load qua API, ẩn block khi rỗng.
- [ ] `ConnectionStatusBanner` hiển thị đúng 3 trạng thái + auto-hide khi reconnected.
- [ ] `EmptyState` component dùng chung ở ≥ 5 list screen.
- [ ] Audit doc 3-click rule confirm hoặc note deviation.
- [ ] 0 hardcoded color/font/spacing ngoài tokens trong 4 screen.
- [ ] TS typecheck pass; lint pass.
- [ ] FE bundle size sau polish vẫn ≤ 18MB (CI check).

---

## 6. Bước thực hiện (cho /implementation-plan)

### Order: D7 → D5 → D4 → D1 → D2 → D3 → D6 (audit cuối)

1. **D7** Audit tokens trong 4 screen + replace hardcode.
2. **D5** Tạo `EmptyState` component + replace usage trong 5 list screen.
3. **D4** Tạo `ConnectionStatusBanner` + wire vào 4 dashboard/monitor screen.
4. **D1** TraderDashboard: getMe wire + period filter mở rộng + reconnect refetch.
5. **D2** BuyerMarketplace: news từ API + product pagination + buyerName từ profile.
6. **D3** BuyerDashboard: empty state CTA + KPI totalSpent.
7. **D6** 3-click rule audit doc + commit `.claude/docs/usability-audit.md`.
8. **Final verify** typecheck + lint + bundle check.

---

## 7. Risks / Open questions

- **R1.** `dashboardService.fetchTraderDashboard()` có hỗ trợ `period` param? Nếu không → BE migration cần (out of scope D1, fallback FE slicing).
- **R2.** `data.summary.totalSpent` có trong `DashboardBuyerDto` chưa? Nếu Phase 19 BE chỉ làm cho `/orders` query → có thể cần kiểm tra DTO trước khi render KPI.
- **R3.** WS reconnect refetch có thể gây rate limit nếu downtime liên tục → debounce: chỉ refetch nếu lần refetch gần nhất > 60s.
- **R4.** `NotificationDto.linkTo` may not cover all entry paths (e.g., `/buyer/orders/:orderId`) — không phải scope plan này, chỉ trace.

---

## 8. Estimate

- **Effort:** M (~3 ngày × 1 FE dev).
- **Order:** D7+D5 song song (tooling) → D4 → D1+D2+D3 song song (independent screens) → D6 audit.
- **Critical path:** D4 ConnectionStatusBanner cần xong trước D1/D3 vì 2 screen kia wire banner vào.
- **Parallelizable:** D2 ‖ D3 ‖ D7 (mỗi screen độc lập); D6 cuối cùng.
