# Plan: Refactor toàn bộ UI role Thương lái (Trader) — 5 tab Control Center

**Created:** 2026-05-09
**Status:** done
**Owner:** tienkhoa03@gmail.com
**Related:** US-T01..T05 · FR-T01..T12 · NFR-U01 (3-Click), NFR-U02 (Zaui native), NFR-U03 (touch ≥44, font ≥14), NFR-P02 (chuyển trang <1s), NFR-C01 (bundle <20MB)

## 1. Mục tiêu

Tổ chức lại UI trader thành 5 tab "Control Center" theo best-practice mô tả của user:
1. **Tổng quan** (Dashboard) — FR-T02
2. **Thị trường** (Marketplace) — FR-T03, FR-T04, FR-T07, FR-T12
3. **Giao dịch** (Transactions) — FR-T05, FR-T06, FR-T08, FR-T09
4. **Vùng trồng** (Farm Monitoring) — FR-T11 + entry FR-T10
5. **Hồ sơ** (Profile) — FR-T01

Vừa **đổi cấu trúc nav** (gỡ tab "Thư viện" hub vừa thêm), vừa **rewrite visual** (sparkline, FAB, top-tabs, kanban/tabbed-status, traffic-light, gauge, timeline audit, public-profile preview). Đảm bảo **mọi FR-T đã có code đều có entry-point trên UI mới**, không hồi quy nghiệp vụ.

## 2. Scope

### In scope
- Bottom-nav trader đổi sang 5 tab nêu trên (`roleNavModel.ts`).
- 5 màn hình tab hub mới:
  - `TraderDashboardScreen` — refactor visual (giữ FR-T02 logic).
  - `TraderMarketplaceScreen` — top-tabs (Mua/Bán · Nguồn cung · Bản tin & Giá).
  - `TraderTransactionsScreen` — toggle (Với Nông dân · Với Người mua) + tabbed status (Mới · Đàm phán · Đã ký).
  - `TraderFarmMonitoringScreen` — list traffic-light + detail gauge + top-right menu.
  - Mở rộng `ProfileScreen` shared (`/trader/me`) cho trader: avatar đầu, uy tín, preview public.
- Tách logic từ các màn gộp hiện tại (`TraderSupplyMonitorScreen`, `TraderTradingOrdersScreen`, `TraderProfileNewsScreen`) thành panel/sub-component reusable đặt cạnh tab mới.
- Thêm route `/trader/market`, `/trader/transactions`, `/trader/monitor`. Giữ route cũ (`/trader/supply`, `/trader/trading`, `/trader/library`, `/trader/standards`, `/trader/news`) làm **redirect** sang route mới (hoặc deep-link sub-tab) để backwards-compat (link bookmark, e2e cũ).
- Backend: thêm endpoint nhỏ nơi UI mới yêu cầu mà BE chưa có (xem §4 chi tiết). Mỗi endpoint kèm DTO trong `libs/shared`.
- Tests: cập nhật `phase-routes-smoke.spec.ts`; thêm visual baseline cho 5 màn mới.

### Out of scope
- KHÔNG đổi business rule (accept/reject, contract lifecycle giữ nguyên).
- KHÔNG đụng auth/role guard, ZMP SDK, theming tokens core.
- KHÔNG đụng các role khác (farmer/buyer/guest).
- KHÔNG xóa file/route cũ trong scope plan này (chỉ redirect; cleanup sang plan riêng).

## 3. Tham chiếu

- `.claude/docs/requirements.md` §2.2 (FR-T01..T12), §3.3 (NFR-U).
- `.claude/docs/business-logic.md` §Trader workflows.
- `.claude/docs/design-system.md` — tokens; component primitives `Card`, `EmptyState`, `Chart`, `SensorDisplay`, `SensorLineChart`.
- `/specs/frontend-ui-specification/design.md` §Trader screens (cross-check naming + flow).
- `/specs/backend-api-specification/design.md` §Dashboard, §Contracts, §Connections, §Compliance — kiểm endpoint hiện có trước khi quyết định bổ sung.
- File hiện hữu cần đọc khi thực hiện:
  - `fe/src/navigation/roleNavModel.ts:26-32, 82-103`
  - `fe/src/router/routes.tsx:86-103, 236-246`
  - `fe/src/screens/trader/dashboard/TraderDashboardScreen.tsx`
  - `fe/src/screens/trader/supply-monitor/TraderSupplyMonitorScreen.tsx`
  - `fe/src/screens/trader/trading-orders/TraderTradingOrdersScreen.tsx`
  - `fe/src/screens/trader/profile-news/TraderProfileNewsScreen.tsx`
  - `fe/src/screens/shared/profile/ProfileScreen.tsx`
  - `fe/src/services/dashboardService.ts`, `connectionService.ts`, `contractService.ts`, `marketplaceService.ts`, `buyingRequestService.ts`, `orderService.ts`, `newsForecastService.ts`, `farmService.ts`, `monitoringService.ts`, `proposalService.ts`, `standardService.ts`.

## 4. Thay đổi dự kiến

### 4.0 Nav & Routing (FE)
**Sửa `fe/src/navigation/roleNavModel.ts`:**
```ts
const TRADER_TABS: RoleNavItem[] = [
  { id: 'home',        label: 'Tổng quan',  path: '/trader',              icon: 'home' },
  { id: 'market',      label: 'Thị trường', path: '/trader/market',       icon: 'shopping-cart' },
  { id: 'transactions',label: 'Giao dịch',  path: '/trader/transactions', icon: 'package' },
  { id: 'monitor',     label: 'Vùng trồng', path: '/trader/monitor',      icon: 'farm' },
  { id: 'me',          label: 'Hồ sơ',      path: '/trader/me',           icon: 'user' },
];
```
- `resolveActiveNavId` trader cập nhật: `/trader/market*` → `market`; `/trader/transactions*`, `/trader/connections`, `/trader/trading*` → `transactions`; `/trader/monitor*`, `/trader/supply*`, `/trader/standards*` → `monitor`; `/trader/me*` → `me`; `/trader/news*`, `/trader/library*` → `market` (deep-link sub-tab `news`).

**Sửa `fe/src/router/routes.tsx`:**
- Thêm `lazy` cho `TraderMarketplaceScreen`, `TraderTransactionsScreen`, `TraderFarmMonitoringScreen`.
- Thêm `<Route path="market" />`, `<Route path="transactions" />`, `<Route path="monitor" />`.
- Giữ route cũ (`supply`, `trading`, `library`, `standards`, `news`) nhưng đổi `element` thành component nhỏ `RedirectTo({ to })` (dùng `useNavigate` replace) trỏ về route mới + query để mở đúng sub-tab. Ví dụ `/trader/news` → `/trader/market?tab=news`; `/trader/standards` → `/trader/monitor?modal=standards` (mở modal/page nội bộ).

### 4.1 Tab 1 — Tổng quan (FR-T02)
**File sửa:** `fe/src/screens/trader/dashboard/TraderDashboardScreen.tsx`.

Visual rewrite:
- Header (xin chào + công ty + kỳ thống kê) — giữ.
- **Top metrics** ngang đầu — 3 ô lớn:
  - "Đơn hàng chờ duyệt" — tap → `/trader/transactions?flow=buyers&status=pending`.
  - "Yêu cầu kết nối mới" — tap → `/trader/transactions?flow=farmers&status=pending`.
  - "Cảnh báo vùng trồng" — tap → `/trader/monitor?filter=alert`.
- **Sparkline** trong mỗi card metrics (component mới `design-system/components/Sparkline.tsx`, lazy import; render từ series 7 ngày).
- Đoạn "Đơn hàng theo trạng thái" giữ nhưng convert sang chip ngang.
- Hai chart "Xu hướng nhu cầu mua" + "Top crops" giữ.
- Action center cũ (3 thẻ to) bỏ vì đã có top metrics tap-through (NFR-U01).

DTO: `DashboardTraderDto` cần bổ sung 3 series sparkline.
- **BE thay đổi (S):**
  - `apps/contract-service` (hoặc service đang serve `/dashboard/trader`): thêm 3 mảng `pendingOrdersSeries`, `pendingConnectionsSeries`, `monitoringAlertsSeries` (mỗi phần tử `{ date, value }`, 7 ngày gần nhất).
  - DTO: cập nhật `be/libs/shared/src/dto/dashboard.dto.ts` (hoặc tương ứng) — thêm 3 field optional (chấp nhận `undefined` để FE fallback chart cũ).

### 4.2 Tab 2 — Thị trường (FR-T03, FR-T04, FR-T07, FR-T12)
**File mới:**
- `fe/src/screens/trader/marketplace/TraderMarketplaceScreen.tsx` — top-tabs container.
- `fe/src/screens/trader/marketplace/panels/MarketplaceFeedPanel.tsx` — sub-tab "Mua / Bán" (gộp products của mình + buying requests).
- `fe/src/screens/trader/marketplace/panels/MarketplaceSupplyPanel.tsx` — sub-tab "Nguồn cung" (FR-T07).
- `fe/src/screens/trader/marketplace/panels/MarketplaceNewsPanel.tsx` — sub-tab "Bản tin & Giá" (FR-T12).
- `fe/src/screens/trader/marketplace/index.ts` — barrel.
- `fe/src/components/trader/Fab.tsx` — Floating Action Button (44×44, NFR-U03) reuse.

Logic:
- Top-tabs lấy URL query `?tab=feed|supply|news` để hỗ trợ deep-link.
- **MarketplaceFeedPanel**:
  - Trên cùng toggle ngang "Tin bán của tôi" / "Nhu cầu thu mua" (UI in-tab).
  - Reuse logic: `listProducts/createProduct/updateProduct/deleteProduct` từ `marketplaceService` (hiện trong `TraderTradingOrdersScreen` tab `my-products`); `listBuyingRequests` + `createProposal` (tab `buying-requests`).
  - FAB "+" → modal/screen `CreateProductForm` (giữ form hiện hữu, tách thành component `MarketplaceProductForm`).
- **MarketplaceSupplyPanel**:
  - Reuse phần "Tìm kiếm" của `TraderSupplyMonitorScreen` (search farm + filter crop/region) làm component.
  - Bộ lọc sâu (NEW): chứng nhận (VietGAP/GlobalGAP/Hữu cơ — dropdown), sản lượng (range), vị trí (đã có).
  - Toggle list/map (mock map placeholder nếu không có lib map; ưu tiên list cho MVP).
  - CTA card → `createConnection` (FR-T07).
- **MarketplaceNewsPanel**:
  - Reuse `listNews/createNews/updateNews` + `listForecasts/createForecast/updateForecast` từ `newsForecastService` (hiện trong `TraderProfileNewsScreen` 2 tab "news"+"forecasts").
  - Toggle nội bộ "Tin tức" / "Dự báo".
  - FAB "Soạn tin" (riêng) → form đăng nhanh (date, title, content, optional price table).

DTO/BE:
- FR-T07 filter: kiểm tra `farmService.listFarms` có hỗ trợ `certifications[]`, `minCapacity`, `maxCapacity` chưa. Nếu chưa → **mở rộng query string + service** (BE-S):
  - Thêm query params trong `apps/farm-service` `GET /farms`: `certifications=vietgap,globalgap`, `minCapacity`, `maxCapacity`.
  - DTO: cập nhật `be/libs/shared/src/dto/farm.dto.ts` (hoặc tương ứng) — request DTO; response giữ.

### 4.3 Tab 3 — Giao dịch (FR-T05, FR-T06, FR-T08, FR-T09)
**File mới:**
- `fe/src/screens/trader/transactions/TraderTransactionsScreen.tsx` — container, toggle 2 flow + status tabs.
- `fe/src/screens/trader/transactions/flows/FarmerFlowPanel.tsx` — flow "Với Nông dân" (FR-T08, FR-T09).
- `fe/src/screens/trader/transactions/flows/BuyerFlowPanel.tsx` — flow "Với Người mua" (FR-T05, FR-T06).
- `fe/src/screens/trader/transactions/components/RequestCard.tsx` — card có CTA Accept/Reject (button tương phản, color tokens).
- `fe/src/screens/trader/transactions/components/ContractDetailModal.tsx` — chi tiết hợp đồng + **timeline audit**.
- `fe/src/screens/trader/transactions/components/StatusTabbedList.tsx` — tabbed list (Mới · Đàm phán · Đã ký).

Logic:
- URL query `?flow=farmers|buyers&status=pending|negotiating|signed` deep-link từ Dashboard.
- **FarmerFlowPanel**:
  - Status "Mới" → `listConnections({ direction: 'incoming', status: 'pending' })` (FR-T08) — RequestCard accept/reject.
  - Status "Đàm phán" → connection accepted nhưng contract chưa ký, hoặc contract `pending_review` (FR-T09).
  - Status "Đã ký" → contracts active với farmers (FR-T09).
  - Click contract → ContractDetailModal có **Timeline audit** (đọc `contract.changeRequests` + `contract.history` nếu có).
- **BuyerFlowPanel**:
  - Status "Mới" → `listOrders({ status: 'pending' })` (FR-T05) — RequestCard accept/reject.
  - Status "Đàm phán" → orders accepted/proposals pending (FR-T05) + contract `pending_review` (FR-T06).
  - Status "Đã ký" → contracts active với buyers (FR-T06).
- ContractDetailModal: side-by-side timeline `events: { createdAt, actor, action, before, after }`.

DTO/BE:
- **Contract change-request audit (BE-M)**:
  - Cần check `apps/contract-service`: nếu chưa expose change history → thêm endpoint `GET /api/v1/contracts/:id/history` trả mảng event.
  - Entity migration: thêm bảng `contract_change_event` nếu chưa có (id, contractId, actor, action, before jsonb, after jsonb, createdAt). Nếu đã có audit ở DB nhưng chưa expose → chỉ thêm controller/service.
  - DTO: `ContractHistoryEventDto` trong `libs/shared`.
- Connection list: `listConnections` đã có `direction='incoming'`, `status` — verify; nếu không có `status='negotiating'` thì FE lọc client-side.

### 4.4 Tab 4 — Vùng trồng (FR-T11 + entry FR-T10)
**File mới:**
- `fe/src/screens/trader/farm-monitoring/TraderFarmMonitoringScreen.tsx` — list view + top-right menu.
- `fe/src/screens/trader/farm-monitoring/components/FarmTrafficLightCard.tsx` — card với badge xanh/vàng/đỏ.
- `fe/src/screens/trader/farm-monitoring/components/FarmMonitoringDetail.tsx` — detail gauge + side-by-side compare.
- `fe/src/design-system/components/Gauge.tsx` — component gauge (SVG arc, lazy).

Logic:
- List farms có hợp đồng active (filter từ `listContracts({status: 'active'})` + lookup `getFarm`).
- Compliance status → traffic light:
  - Đọc `getContractCompliance(contractId)` trả `{ score, violations[] }` (đã có trong `contractService`).
  - Map: score ≥80 = xanh, 50-79 = vàng, <50 = đỏ. (Ngưỡng cần confirm backend; nếu BE đã có `complianceLevel` enum dùng thẳng.)
- Top-right menu (icon `more-vertical`/`book`) → mở **modal/page Standards Library** (reuse `TraderStandardLibraryScreen` content qua component `TraderStandardLibraryPanel`).
- Detail view:
  - Sensor gauge (temp, humidity, light) — reuse `useMonitoring` + `SensorDisplay`, override visual sang gauge.
  - Bảng so sánh side-by-side: cột trái = care logs từ `listCareLogs(farmId)`, cột phải = standard từ `standardService.listStandards` filter theo crop+season → đối chiếu actual vs expected.
- Filter `?filter=alert` từ Dashboard → chỉ hiển thị card vàng/đỏ.

DTO/BE:
- Reuse hết. Nếu compliance chưa có `level` enum → FE compute. (Optional: BE thêm field `complianceLevel: 'green'|'yellow'|'red'` trong `ComplianceDto` cho consistency — **BE-S optional**.)

### 4.5 Tab 5 — Hồ sơ (FR-T01)
**File sửa:** `fe/src/screens/shared/profile/ProfileScreen.tsx`.

Visual rewrite:
- Layout dạng **menu list** thay vì form trực tiếp.
- Block đầu: avatar lớn + companyName + uy tín (`trustScore /5` hoặc badge sao).
- Menu items: "Thông tin doanh nghiệp", "Liên hệ", "Năng lực thu mua", "Bảo mật", "Đăng xuất".
- Mỗi item → form edit dạng modal/sheet (giữ `updateProfile` logic hiện có).
- **Nút "Xem trước giao diện công khai"** ở đầu → mở modal preview (render giống cách buyer/farmer thấy trader card).

DTO/BE:
- Reuse `GET /auth/me`. Public preview render hoàn toàn từ data đã có (companyName, region, capacity, trustScore, trader-related products) — KHÔNG cần endpoint mới.
- Nếu BE đã có `GET /api/v1/traders/:id/public` (cần kiểm tra `apps/auth-service` hoặc shared) → dùng. Nếu không → render preview từ `traderProfile` + `listProducts({traderId: me.id})`.
- Trường logo/license/description ở `TraderProfileNewsScreen` cũ là local-only — **bỏ** trong scope plan này (BE chưa hỗ trợ; nếu user muốn giữ → plan riêng + migration).

### 4.6 Shared
- `libs/shared/src/dto/dashboard.dto.ts` — thêm series sparkline (4.1).
- `libs/shared/src/dto/farm.dto.ts` — thêm filter query (4.2).
- `libs/shared/src/dto/contract.dto.ts` — thêm `ContractHistoryEventDto` (4.3).
- `libs/shared` rebuild trước khi cross-service consume.

## 5. Acceptance criteria

### Nav & routing
- [ ] Bottom-nav trader hiển thị đúng 5 tab: Tổng quan / Thị trường / Giao dịch / Vùng trồng / Hồ sơ.
- [ ] Highlight tab đúng cho mọi sub-route (kể cả deep-link `?tab=...&status=...`).
- [ ] Routes cũ (`/trader/supply`, `/trader/trading`, `/trader/library`, `/trader/standards`, `/trader/news`) auto-redirect sang route mới + sub-tab tương ứng.

### Tab Dashboard (FR-T02)
- [ ] 3 top-metric cards có sparkline 7 ngày, tap mỗi card điều hướng đúng sub-tab Transactions/Monitor.
- [ ] Lazy chart vẫn hoạt động, không vỡ NFR-P02 (<1s).
- [ ] Reconnect refetch + ConnectionStatusBanner giữ nguyên.

### Tab Marketplace (FR-T03/04/07/12)
- [ ] 3 sub-tabs hoạt động độc lập, switch không reload toàn page.
- [ ] FAB "+" tạo sản phẩm bán (sub-tab Mua/Bán) — flow `createProduct` thành công + snackbar.
- [ ] Sub-tab Nguồn cung filter cert/sản lượng/vị trí trả kết quả đúng (kiểm tra request params đúng spec mới).
- [ ] FAB "Soạn tin" sub-tab Bản tin & Giá tạo bản tin nhanh.

### Tab Transactions (FR-T05/06/08/09)
- [ ] Toggle 2 flow + 3 status tab vận hành đúng.
- [ ] RequestCard có 2 nút Accept (primary) / Reject (gray-red) ≥44×44, tương phản (NFR-U03).
- [ ] Accept/Reject gọi đúng service và refresh list.
- [ ] ContractDetailModal hiển thị timeline audit (>=1 event tạo lúc contract created, các change request sau).

### Tab Farm Monitoring (FR-T10/11)
- [ ] List farm có badge traffic-light đúng theo compliance score.
- [ ] Filter `?filter=alert` ẩn farm xanh.
- [ ] Detail render gauge cho 3 sensor (temp/humidity/light) + bảng side-by-side care log vs standard.
- [ ] Top-right menu mở Standards Library (FR-T10) — CRUD standards vẫn hoạt động.

### Tab Profile (FR-T01)
- [ ] Layout menu list mới với avatar/uy tín đầu trang.
- [ ] Edit thông tin qua modal/sheet, save thành công gọi `PUT /auth/me`.
- [ ] Nút "Xem trước giao diện công khai" mở modal render trader card đúng cách buyer thấy.

### NFR
- [ ] NFR-U01: Mọi feature core ≤3 thao tác từ home (vd: Home → Giao dịch → Accept order = 2 thao tác).
- [ ] NFR-U03: Touch target ≥44×44, font ≥14, không hardcode color/font/spacing.
- [ ] NFR-C01: Bundle vẫn <20MB sau khi thêm component (lazy split các panel lớn).
- [ ] Imputed sensor data (NFR-A01) hiển thị bình thường trong gauge, có chấm xám đánh dấu.

### Tests
- [ ] `fe/src/tests/e2e/regression/phase-routes-smoke.spec.ts` thêm 5 route mới.
- [ ] Visual baseline Playwright cập nhật cho 5 màn (`npm run test:visual`).
- [ ] Unit test cho `roleNavModel.resolveActiveNavId` cho mọi nhánh trader mới.
- [ ] Backend integration test cho endpoint mới (history audit nếu add).

## 6. Bước thực hiện (cho /implementation-plan)

### Phase 0 — Foundation (commit 1)
1. Cập nhật `roleNavModel.ts` — đổi 5 tab + `resolveActiveNavId`.
2. Tạo route stub `/trader/market`, `/trader/transactions`, `/trader/monitor` trong `routes.tsx` trỏ tạm tới placeholder screen.
3. Tạo `RedirectTo` component + áp cho route cũ.
4. Cập nhật `phase-routes-smoke.spec.ts` cơ bản.
5. Build + lint pass.

### Phase 1 — Tab Dashboard (commit 2)
6. **BE (nếu cần sparkline series):** thêm 3 series vào dashboard endpoint + DTO shared. Rebuild shared.
7. Tạo `Sparkline.tsx` (design-system).
8. Refactor `TraderDashboardScreen` — top-metric cards có sparkline + tap-through routing.
9. Bỏ block "Trung tâm tác vụ" cũ, gộp logic vào top-metric cards.
10. Test unit + visual.

### Phase 2 — Tab Marketplace (commit 3)
11. **BE (nếu cần):** thêm filter `certifications`/`capacity` cho `GET /farms`.
12. Tạo skeleton `TraderMarketplaceScreen` + 3 panel.
13. Migrate logic `my-products` + `buying-requests` từ `TraderTradingOrdersScreen` → `MarketplaceFeedPanel`.
14. Migrate logic search farms từ `TraderSupplyMonitorScreen` → `MarketplaceSupplyPanel` + thêm filter UI.
15. Migrate logic news/forecasts từ `TraderProfileNewsScreen` → `MarketplaceNewsPanel`.
16. FAB component + 2 instance ("+", "Soạn tin").
17. Test unit + visual.

### Phase 3 — Tab Transactions (commit 4)
18. **BE (nếu cần):** endpoint `GET /contracts/:id/history` + DTO.
19. Tạo `TraderTransactionsScreen` + toggle flow + tabbed status.
20. Migrate logic `orders` + `contracts(buyer)` từ `TraderTradingOrdersScreen` → `BuyerFlowPanel`.
21. Migrate logic `connections(incoming)` + `contracts(farmer)` từ `TraderSupplyMonitorScreen` → `FarmerFlowPanel`.
22. `RequestCard` + `ContractDetailModal` (có timeline audit).
23. Deep-link query handler từ Dashboard.
24. Test unit + visual.

### Phase 4 — Tab Farm Monitoring (commit 5)
25. Tạo `Gauge.tsx` (design-system).
26. Tạo `TraderFarmMonitoringScreen` + `FarmTrafficLightCard` + `FarmMonitoringDetail`.
27. Migrate logic monitoring từ `TraderSupplyMonitorScreen` (panel sensor) → detail panel.
28. Top-right menu → mở `TraderStandardLibraryPanel` (extract từ `TraderStandardLibraryScreen`).
29. Side-by-side compare care log vs standard.
30. Test unit + visual.

### Phase 5 — Tab Profile (commit 6)
31. Refactor `ProfileScreen` shared cho trader (menu list + avatar header + uy tín first).
32. Modal/sheet edit từng nhóm field.
33. Modal "Xem trước giao diện công khai" — render trader-card preview.
34. Đảm bảo farmer/buyer profile UI không bị ảnh hưởng (regression test).
35. Test unit + visual.

### Phase 6 — Cleanup & polish (commit 7)
36. Verify E2E smoke pass cho TẤT CẢ 5 route mới + 5 route cũ (redirect).
37. Visual regression Playwright update baseline.
38. `npm run build:check` đảm bảo bundle <20MB (NFR-C01).
39. Manual test flow Dashboard → tap card → đến đúng list lọc đúng.
40. Đánh dấu plan `Status: done`.

## 7. Risks / Open questions

- **R1 (BE coupling):** Nếu BE chưa có `contract history` audit thì Phase 3 cần BE work. Có thể Phase 3 ship trước với UI placeholder timeline (chỉ created/signed event lấy từ contract record), audit chi tiết bổ sung sau.
- **R2 (Sparkline data):** Nếu BE không thể thêm series 7 ngày kịp → Phase 1 dùng placeholder static line từ demand trend hiện có.
- **R3 (Standards modal vs page):** Mở Standards Library trong modal hay full page? Đề xuất full-page (slide-over) để giữ Form CRUD. Nếu UX không ổn → chuyển sang sub-route `/trader/monitor/standards`.
- **R4 (RedirectTo state loss):** Redirect từ `/trader/news` → `/trader/market?tab=news` mất state form đang nhập. Chấp nhận (link cũ chỉ là entry, không lưu state).
- **R5 (Visual rewrite scope):** "Full visual rewrite" có thể dài hơn ước lượng nếu polish kỹ; mỗi phase mất thêm ~1-2 ngày polish nếu cần pixel-perfect.
- **Q1:** Backend có sẵn `complianceLevel` enum `green/yellow/red` chưa? (Phase 4 cần xác nhận khi đọc `contractService.ts`.)
- **Q2:** Spec FE chính thức có mockup riêng cho 5 tab này không? Nếu có cần align trước khi UI lệch.
- **Q3:** Có cần data migration cho route bookmarks (vd push notification hiện link `/trader/news/:id`)? Notification service nên review.

## 8. Estimate

- **Effort tổng:** **L** (~5–8 ngày dev/test với 1 dev FE + ~1–2 ngày BE cho 2-3 endpoint nhỏ).
- **Order:**
  1. BE-side gaps (Phase 1 sparkline DTO, Phase 3 contract history) — làm song song hoặc trước Phase tương ứng.
  2. FE Phase 0 → 5 tuần tự, mỗi phase commit độc lập (rollback dễ).
  3. Phase 6 cleanup + bundle check.
- **Khả năng parallel:** BE/FE có thể song song nếu DTO contract đã chốt (libs/shared) trước.
