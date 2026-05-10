# Plan: Refactor toàn bộ UI role Người mua (Buyer) — 4 tab Sourcing-First / Trust-First

**Created:** 2026-05-10
**Status:** done
**Owner:** tienkhoa03@gmail.com
**Related:** US-U01..U04 · FR-U01..U06 · NFR-U01 (3-Click), NFR-U02 (Zaui native), NFR-U03 (touch ≥44 / font ≥14), NFR-A01 (imputed sensor), NFR-P02 (chuyển trang <1s), NFR-C01 (bundle <20MB)

## 1. Mục tiêu

Tổ chức lại UI buyer theo triết lý **Sourcing + Trust** với 4 tab Bottom-Nav:
1. **Khám phá** (Marketplace) — FR-U01 + entry FR-G02
2. **Nguồn hàng** (Sourcing) — FR-U02, FR-U03
3. **Đơn hàng** (Orders & Contracts) — FR-U04, FR-U06
4. **Trực tiếp** (Live Farm Monitoring) — FR-U05

Tách chức năng "Hồ sơ + Thông báo" ra khỏi bottom-nav (dồn vào icon header) để dành 4 vị trí cho luồng business chính. Visual rewrite: trust badges, sticky CTA kép, step-by-step form, side-by-side proposal comparison, version-control style diff cho renegotiation, semantic gauge ("Tối ưu" thay vì 45%), timeline action feed.

## 2. Scope

### In scope
- Bottom-nav buyer đổi sang 4 tab: `discover` / `sourcing` / `orders` / `live` (sửa `roleNavModel.ts`).
- 4 màn hình tab hub mới / refactor:
  - `BuyerDiscoverScreen` — refactor từ `BuyerMarketplaceScreen` (giữ logic listProducts, đổi visual sang grid trust-badge, bỏ FAB "Đăng nhu cầu" — chuyển sang tab Sourcing).
  - `BuyerProductDetailScreen` — refactor sang 3 tabs nội dung (Sản phẩm | Hồ sơ Thương lái | Nhật ký Vườn) + sticky CTA kép (Mua ngay / Thỏa thuận đặt cọc).
  - `BuyerSourcingScreen` (mới) — tab hub Nguồn hàng: list buying-requests + bid inbox + comparison.
  - `BuyerOrdersScreen` — refactor từ `BuyerOrdersProposalsScreen`: chia 4 status tab (Chờ thương lượng / Đang đặt cọc / Hoàn tất / Đã hủy) + renegotiation diff UX. Gộp `BuyerTransactionHistoryScreen` (FR-U06) vào tab "Hoàn tất".
  - `BuyerLiveMonitorScreen` (mới) — list các đơn đang đặt cọc có farm + detail dashboard cấp cao + action timeline.
- Header chung tất cả tab buyer: avatar mini (→ profile screen), notification bell, search icon (chỉ tab Discover).
- `BuyerProfileNotificationScreen` được mở qua route `/buyer/me` (giữ nguyên, không còn trong bottom-nav nhưng vẫn truy cập qua header avatar).
- Component mới (FE): `TrustBadgeGroup`, `ProductDetailTabs`, `StepperForm`, `ProposalComparisonTable`, `OrderStatusTabs`, `ContractDiffView`, `SemanticSensorCard`, `FarmActionTimeline`, `Fab` (reuse từ trader plan nếu đã có).
- Backend bổ sung khi UI yêu cầu mà BE chưa có (xem §4.x).
- Tests: cập nhật `phase-routes-smoke.spec.ts`; visual baseline cho 4 màn mới + product detail.

### Out of scope
- KHÔNG đổi business rule: lifecycle order/contract/proposal giữ nguyên backend.
- KHÔNG đụng auth/role guard, ZMP SDK, theming tokens core.
- KHÔNG đụng các role khác (farmer/trader/guest).
- KHÔNG xóa file/route cũ trong scope plan này (chỉ redirect; cleanup riêng).
- KHÔNG implement chat (phần "Thỏa thuận đặt cọc → mở chat" tạm dùng modal/sheet text, chat thực = plan riêng).
- KHÔNG implement bản đồ thật (phần "Bản đồ vườn nhỏ" trong product detail = placeholder/coords text).

## 3. Tham chiếu

- `.claude/docs/requirements.md` §1.3 (US-U01..U04), §2.3 (FR-U01..U06), §3 (NFR).
- `.claude/docs/business-logic.md` §Buyer workflows, §Connection/Contract change-request.
- `.claude/docs/design-system.md` — tokens; primitives `Card`, `EmptyState`, `Chart`, `SensorDisplay`, `SensorLineChart`, `DigitalTwinViewer`, `Icon`.
- `/specs/frontend-ui-specification/design.md` §Buyer screens (cross-check naming + flow).
- `/specs/backend-api-specification/design.md` §Products, §Buying Requests, §Proposals, §Orders, §Contracts, §Monitoring, §Care Logs.
- File hiện hữu cần đọc khi thực hiện:
  - `fe/src/navigation/roleNavModel.ts:18-23, 72-84`
  - `fe/src/router/routes.tsx:46-66, 220-230`
  - `fe/src/screens/buyer/marketplace/BuyerMarketplaceScreen.tsx`
  - `fe/src/screens/buyer/product-detail/BuyerProductDetailScreen.tsx`
  - `fe/src/screens/buyer/orders-proposals/BuyerOrdersProposalsScreen.tsx`
  - `fe/src/screens/buyer/post-buying-request/BuyerPostBuyingRequestScreen.tsx`
  - `fe/src/screens/buyer/digital-twin-monitor/BuyerDigitalTwinMonitorScreen.tsx`
  - `fe/src/screens/buyer/transaction-history/BuyerTransactionHistoryScreen.tsx`
  - `fe/src/screens/buyer/profile-notification/BuyerProfileNotificationScreen.tsx`
  - `fe/src/screens/buyer/dashboard/BuyerDashboardScreen.tsx`
  - `fe/src/screens/shared/contract-change-requests/*`
  - Services: `marketplaceService.ts`, `buyingRequestService.ts`, `proposalService.ts`, `orderService.ts`, `contractService.ts`, `monitoringService.ts`, `farmService.ts`, `careLogService.ts` (nếu có).
  - Hooks: `useMonitoring.ts`, `useTrustScore.ts`, `useProfile.ts`.

## 4. Thay đổi dự kiến

### 4.0 Nav & Routing (FE)

**Sửa `fe/src/navigation/roleNavModel.ts`:**
```ts
const BUYER_TABS: RoleNavItem[] = [
  { id: 'discover', label: 'Khám phá',  path: '/buyer',         icon: 'shopping-cart' },
  { id: 'sourcing', label: 'Nguồn hàng', path: '/buyer/sourcing', icon: 'plus-circle' },
  { id: 'orders',   label: 'Đơn hàng',   path: '/buyer/orders',   icon: 'package' },
  { id: 'live',     label: 'Trực tiếp',  path: '/buyer/live',     icon: 'eye' }, // hoặc 'video'/'farm'
];
```
- `resolveActiveNavId` buyer cập nhật:
  - `/buyer` hoặc `/buyer/products*` → `discover`.
  - `/buyer/sourcing*` (mới), `/buyer/request*` (legacy) → `sourcing`.
  - `/buyer/orders*`, `/buyer/history*` (legacy) → `orders`.
  - `/buyer/live*` (mới), `/buyer/monitor*` (legacy) → `live`.
  - `/buyer/me*` → KHÔNG highlight tab (truy cập qua header avatar).

**Sửa `fe/src/router/routes.tsx`:**
- Thêm `lazy` cho `BuyerSourcingScreen`, `BuyerLiveMonitorScreen`.
- Đổi `<Route path="orders" element={...}/>` sang `BuyerOrdersScreen` mới (đổi tên file/folder hoặc giữ folder `orders-proposals` và rename component — chọn rename **component** giữ folder để giảm churn).
- Thêm `<Route path="sourcing" element={<BuyerSourcingScreen />}/>` và `<Route path="live" element={<BuyerLiveMonitorScreen />}/>`.
- Thêm `<Route path="live/:orderId" element={<BuyerLiveMonitorDetail />}/>` cho deep-link đơn cụ thể.
- Giữ route legacy:
  - `/buyer/request` → `<RedirectTo to="/buyer/sourcing?action=create" />`.
  - `/buyer/monitor` → `<RedirectTo to="/buyer/live" />` (giữ `BuyerDigitalTwinMonitorScreen` làm sub-route detail nếu cần demo).
  - `/buyer/history` → `<RedirectTo to="/buyer/orders?status=completed" />`.

**Component header dùng chung 4 tab buyer** (có thể tách `fe/src/screens/buyer/components/BuyerHeader.tsx`):
- Avatar mini (tap → `/buyer/me`).
- `BuyerNotificationBell` (đã có).
- Search icon (chỉ tab discover; tap → mở search overlay).

### 4.1 Tab 1 — Khám phá (Marketplace) — FR-U01

**File refactor:** `fe/src/screens/buyer/marketplace/BuyerMarketplaceScreen.tsx` → đổi tên export `BuyerDiscoverScreen` (giữ folder, alias export cũ vẫn được, hoặc thêm barrel re-export).

**File mới:**
- `fe/src/components/buyer/TrustBadgeGroup.tsx` — render dãy badge nhỏ (VietGAP, Có dữ liệu IoT, Hỗ trợ đặt cọc, GlobalGAP, Hữu cơ). Input: `{ certifications?: string[]; hasIot?: boolean; supportsDeposit?: boolean }`.

**Visual rewrite:**
- Header trust-first: avatar nhỏ + tên buyer + notification bell + search icon (xem §4.0).
- News banner giữ (slide ngang).
- **Visual-First Grid 2 cột**: card to, ảnh ≥120×120, overlay top-left là **TrustBadgeGroup** (max 2 badge nổi nhất; 3+ → "+1"); overlay top-right là tag giá nếu cần.
- Card content: tên ngắn + cropType + giá lớn + dòng phụ "Thương lái: {name}" + button "Xem chi tiết" (thay nút "Mua ngay" cũ — vì quyết định mua ở Detail page).
- Bỏ FAB "+" trong tab này (chuyển hoàn toàn sang tab Sourcing).
- Filter bar mới (chip ngang, sticky dưới search): "Tất cả · Có IoT · VietGAP · Hỗ trợ đặt cọc · Sẵn hàng" — client-side filter trên products list (NFR-U03 chip ≥44).

**File refactor:** `fe/src/screens/buyer/product-detail/BuyerProductDetailScreen.tsx`.

**Visual rewrite:**
- Slider hình ảnh giữ.
- **3 tabs nội dung** (component mới `ProductDetailTabs`):
  - Tab "Thông tin Sản phẩm": tên, mô tả, giá, đơn vị, tiêu chuẩn, thông số chất lượng (đã có `QUALITY_SPECS`).
  - Tab "Hồ sơ Thương lái": tên, trustScore (`useTrustScore`), khu vực, năng lực, link "Xem nông sản khác của thương lái" → `/buyer/products?traderId=...` (filter ngầm trong Discover).
  - Tab "Nhật ký Vườn trồng" (Farm Lab): farm info (location/area/crop), recent care logs (top 5 — `careLogService.listCareLogs(farmId)` hoặc public endpoint), nhỏ chart sensor 24h (reuse `SensorLineChart` nếu có data, hoặc skeleton "Chỉ hiện khi đặt cọc").
- **Sticky Footer CTA kép** (overlay):
  - Nếu `product.harvestStatus === 'available'` (đã có hàng): nút "Mua ngay" (primary lớn) → flow tạo Order ngay.
  - Nếu `product.harvestStatus === 'upcoming'` hoặc `supportsDeposit` true: nút "Thỏa thuận đặt cọc" (secondary) → mở sheet step-by-step deposit (chia bước: số lượng → giá đặt cọc → ngày giao → xác nhận).
  - Khi cả 2 cùng available: render 2 nút side-by-side (50/50, mỗi nút ≥44 cao).

**Backend (BE-S):**
- Cần xác nhận `ProductDto` có flag `supportsDeposit`/`harvestStatus`/`hasIotData` chưa. Kiểm `be/libs/shared/src/dto/marketplace.dto.ts` + `apps/contract-service` (hoặc service serve `/products`).
- Nếu chưa có → bổ sung 3 field optional + migration nhẹ:
  - `supportsDeposit: boolean` (default `false`).
  - `harvestStatus: 'available' | 'upcoming' | 'sold_out'` (default `available` để FE tương thích ngược).
  - `hasIotData: boolean` (compute server-side từ farm liên kết — có sensor active hay không; có thể compute on-the-fly).
- Nếu cần data farm history/care log public cho **detail** trước khi đặt cọc → kiểm `farmService.getPublicFarm(farmId)` + `careLogService.listPublicCareLogs(farmId, { limit: 5 })`. Nếu không có endpoint public → giới hạn FE chỉ hiện info công khai trader đã set; chi tiết sensor/care log đầy đủ chỉ unlock sau khi đặt cọc (đúng FR-U05).

### 4.2 Tab 2 — Nguồn hàng (Sourcing) — FR-U02, FR-U03

**File mới:**
- `fe/src/screens/buyer/sourcing/BuyerSourcingScreen.tsx` — container.
- `fe/src/screens/buyer/sourcing/panels/SourcingListPanel.tsx` — danh sách buying-requests của buyer (đang mở / đã có đề xuất / đã đóng).
- `fe/src/screens/buyer/sourcing/panels/SourcingInboxPanel.tsx` — chi tiết 1 buying-request: list proposals từ trader.
- `fe/src/screens/buyer/sourcing/components/StepperForm.tsx` — generic stepper UI (3-step).
- `fe/src/screens/buyer/sourcing/components/CreateBuyingRequestStepper.tsx` — implement 3 bước:
  - Bước 1: Loại nông sản + Số lượng + Đơn vị (kg/tấn).
  - Bước 2: Tiêu chuẩn chất lượng (VietGAP/GlobalGAP/Hữu cơ multi-select) + ghi chú yêu cầu khác.
  - Bước 3: Giá kỳ vọng + Tiền cọc + Ngày giao → Xác nhận.
- `fe/src/screens/buyer/sourcing/components/ProposalComparisonTable.tsx` — bảng side-by-side các proposal. Cột: Thương lái (avatar + tên + trustScore) | Giá đề xuất | Năng lực vườn (tên farm + sensor health) | Thời gian | Action (Chấp nhận/Từ chối).
- `fe/src/screens/buyer/sourcing/index.ts` — barrel.

**Logic:**
- URL query `?action=create` từ legacy redirect → mở stepper modal/sheet ngay.
- URL query `?id=<buyingRequestId>` → mở Inbox panel với proposals.
- **SourcingListPanel**:
  - Reuse `listBuyingRequests({ buyerId: 'me' })` từ `buyingRequestService`.
  - Card: cropType + quantity + status badge (open/matched/closed) + count proposals (vd "3 đề xuất mới").
  - FAB lớn góc phải (44+) → mở `CreateBuyingRequestStepper`.
- **SourcingInboxPanel**:
  - Header: nội dung buying-request (read-only).
  - Body: ProposalComparisonTable cho list proposals.
  - Tap row trader → mở mini sheet "Hồ sơ thương lái" (reuse logic Tab 2 trong product detail nếu cần).
- **ProposalComparisonTable**:
  - Mobile-friendly: nếu screen <380px hoặc >3 proposals → fallback sang **list-card mode** với highlight ô khác biệt (mặc định row mode side-by-side).
  - Highlight ô "tốt nhất" (giá thấp nhất / trustScore cao nhất) bằng border xanh nhẹ.
  - Buttons "Chấp nhận" / "Từ chối" gọi `acceptProposal` / `rejectProposal` từ `proposalService`.

**Stepper component design:**
- `StepperForm` nhận `steps: { id, title, render: (state, setState) => ReactNode, validate?: (state) => string | null }[]` + initial state + onSubmit.
- Hiển thị progress bar trên cùng (3 dots/lines) + nút "Quay lại" / "Tiếp theo" / "Hoàn tất".
- Lưu draft trong `sessionStorage` key `buyer-sourcing-draft` (NFR-R02 — không mất khi switch tab).

**Backend:**
- `listProposals({ buyingRequestId })` cần verify hỗ trợ filter theo buying-request. Nếu chưa có → **BE-S**:
  - `apps/contract-service` (hoặc service serve `/proposals`): thêm query `buyingRequestId` cho `GET /api/v1/proposals`.
  - DTO: cập nhật `be/libs/shared/src/dto/proposal.dto.ts` query DTO.
- `ProposalDto` cần đính kèm `traderTrustScore` + `farmId` + `farmName` để render so sánh. Nếu thiếu → **BE-S**:
  - Server-side join khi return `ProposalDto` (extend response).
  - Hoặc FE fetch riêng: `useTrustScore(traderId)` + `getFarm(farmId)` per row (acceptable cho MVP, nhưng N+1 — chấp nhận với cap ≤ 5 proposals/req).
- Decision: ưu tiên BE-S join để giảm round-trip. Nếu BE busy → fallback FE N+1 với memo.

### 4.3 Tab 3 — Đơn hàng (Orders & Contracts) — FR-U04, FR-U06

**File refactor:** `fe/src/screens/buyer/orders-proposals/BuyerOrdersProposalsScreen.tsx` → đổi tên export `BuyerOrdersScreen` (giữ folder, hoặc rename folder thành `orders` — chọn **giữ folder** để giảm churn).

**File mới:**
- `fe/src/screens/buyer/orders-proposals/components/OrderStatusTabs.tsx` — 4 tab: `negotiating` (Chờ thương lượng) / `deposited` (Đang đặt cọc) / `completed` (Hoàn tất) / `cancelled` (Đã hủy).
- `fe/src/screens/buyer/orders-proposals/components/ContractDiffView.tsx` — render diff của contract change-request (before/after, line đỏ/xanh).
- `fe/src/screens/buyer/orders-proposals/components/RenegotiationCard.tsx` — card hiện thị change-request kèm action Approve/Reject.

**Visual rewrite:**
- 4 status tabs (top, sticky):
  - **Chờ thương lượng**: orders status `pending`/`accepted` chưa có contract; proposals chưa accept (dồn từ tab "Đề xuất" cũ vào đây dạng sub-list).
  - **Đang đặt cọc**: orders/contracts status `deposited`/`active` (đã đặt cọc, đang chờ thu hoạch/giao).
  - **Hoàn tất**: orders/contracts `completed` (gộp logic FR-U06 từ `BuyerTransactionHistoryScreen`). Bỏ route `/buyer/history` (redirect).
  - **Đã hủy**: orders `cancelled` + contracts `cancelled`.
- Mỗi card: tên sản phẩm + thương lái + giá + status badge + (nếu có change-request pending) banner "Yêu cầu thay đổi điều khoản — Xem so sánh →".
- **Renegotiation UX (FR-U04)**:
  - Tap banner → mở `ContractDiffView` modal/sheet.
  - Diff hiển thị 2 cột: "Hiện tại" (gray) | "Đề xuất mới" (highlight). Mỗi field thay đổi → row có border đỏ ở "Hiện tại" + xanh ở "Đề xuất mới".
  - Field tracked: `deliveryDate`, `quantity`, `pricePerUnit`, `qualityStandardCode`, `depositAmount`, `notes`.
  - 2 nút footer: "Đồng ý thay đổi" (primary green) → `approveContractChangeRequest(id)`; "Từ chối" (secondary red) → `rejectContractChangeRequest(id)`.
  - Reuse logic từ `ContractChangeRequestsPanel` (đã có ở `screens/shared/contract-change-requests`) — extract diff renderer ra component riêng.

**Logic:**
- URL query `?status=negotiating|deposited|completed|cancelled` deep-link.
- Listing source:
  - Tab `negotiating`: `listProposals({ buyerId: 'me', status: 'pending' })` + `listOrders({ status: ['pending','accepted'] })`.
  - Tab `deposited`: `listOrders({ status: ['deposited','active'] })` + `listContracts({ role: 'buyer', status: 'active' })`.
  - Tab `completed`: `listOrders({ status: 'completed', includeSummary: true })` + `listContracts({ role: 'buyer', status: 'completed' })`.
  - Tab `cancelled`: `listOrders({ status: ['cancelled','rejected'] })` + `listContracts({ role: 'buyer', status: 'cancelled' })`.
- Mỗi tab có pagination + filter date range (giữ logic từ `BuyerTransactionHistoryScreen`).

**Backend (BE-M nếu chưa có):**
- Endpoint `GET /api/v1/contracts/:id/change-requests` (list change-requests) đã có theo `ContractChangeRequestsPanel` — verify `contractService.listChangeRequests` exists.
- Endpoint `POST /api/v1/contracts/:id/change-requests/:changeId/approve` & `.../reject` — verify exist.
- Nếu chưa có hoặc chưa expose `before`/`after` snapshot trong DTO → **BE-S**:
  - DTO: `ContractChangeRequestDto { id, contractId, requestedBy, status, before: ContractTermsSnapshot, after: ContractTermsSnapshot, requestedAt, resolvedAt }`.
  - Migration: `contract_change_request` table phải có `before_snapshot jsonb` + `after_snapshot jsonb` (nếu chưa có thì thêm).

### 4.4 Tab 4 — Trực tiếp (Live Farm Monitoring) — FR-U05

**File mới:**
- `fe/src/screens/buyer/live-monitor/BuyerLiveMonitorScreen.tsx` — list cards các đơn đang đặt cọc có farm sensor.
- `fe/src/screens/buyer/live-monitor/BuyerLiveMonitorDetailScreen.tsx` — detail 1 farm: dashboard cấp cao + timeline.
- `fe/src/screens/buyer/live-monitor/components/SemanticSensorCard.tsx` — card sensor với label semantic ("Tối ưu" / "Cảnh báo" / "Bình thường") + thanh màu (xanh/vàng/đỏ).
- `fe/src/screens/buyer/live-monitor/components/FarmActionTimeline.tsx` — timeline social-media-style các care log: avatar nông dân + thời gian + action + ảnh.
- `fe/src/screens/buyer/live-monitor/index.ts` — barrel.

**Visual:**
- **List screen** (`/buyer/live`):
  - Card mỗi đơn: ảnh farm + tên cây trồng + tên farm + status badge (xanh/vàng/đỏ tổng quát) + "Xem trực tiếp →".
  - Empty state: "Chưa có đơn đặt cọc nào — đặt cọc để theo dõi vườn trồng".
  - Source: `listContracts({ role: 'buyer', status: ['active','deposited'] })` → mỗi contract → resolve `farmId`.
- **Detail screen** (`/buyer/live/:contractId`):
  - Header: tên cây + farm + nông dân + thời gian dự kiến giao.
  - **Top section — Dashboard cấp cao** (3 cards `SemanticSensorCard`):
    - Nhiệt độ: status semantic + giá trị thực kèm trong ngoặc — vd "Nhiệt độ: Tối ưu (28°C)".
    - Độ ẩm đất: tương tự — "Độ ẩm đất: Tối ưu (45%)".
    - Ánh sáng: tương tự.
    - Mỗi card có thanh ngang biểu đồ màu (xanh/vàng/đỏ theo ngưỡng).
    - Imputed → chấm xám nhỏ góc trên (NFR-A01).
  - **Action Timeline** (FarmActionTimeline):
    - Card mỗi sự kiện: avatar farmer + tên + thời gian (relative "10:00 sáng nay") + nội dung "Vừa bón phân hữu cơ" + ảnh nếu có.
    - Source: `careLogService.listCareLogs(farmId, { limit: 20 })`.
    - Pull-to-refresh hoặc nút "Tải thêm".
  - **CTA**: button nhỏ "Xem mô hình 3D" → mở `BuyerDigitalTwinMonitorScreen` cũ (giữ làm sub-feature, route `/buyer/live/:contractId/twin`).

**Semantic mapping (FE compute):**
- Nhiệt độ: 22-30°C = optimal (xanh); 18-22 hoặc 30-34 = chú ý (vàng); ngoài = cảnh báo (đỏ).
- Độ ẩm đất: 35-65% = optimal; 25-35 hoặc 65-80 = chú ý; ngoài = cảnh báo.
- Ánh sáng: cây-specific — generic 2000-10000 lux = optimal.
- Threshold lý tưởng nên đọc từ standard của contract (`standardService.getStandard(contract.standardCode)`) nếu BE có. Fallback: default thresholds trong FE constants.

**Backend (BE-S):**
- Endpoint `GET /api/v1/farms/:id/care-logs?limit=20` cho buyer auth (chỉ với contract active của buyer) — verify.
  - Nếu chưa có → cần endpoint hoặc reuse `careLogService.listCareLogs` với guard backend kiểm `buyer.contract.farmId === requestedFarmId`.
- `CareLogDto` cần có `actor` (farmer name + avatar) + `imageUrl`. Verify; nếu thiếu actor → BE join, nếu thiếu image → optional.
- `getStandard(code)` — nếu chưa có endpoint hoặc DTO chưa có thresholds → fallback FE default.
- Sensor data dùng `useMonitoring` hiện có (subscribe WebSocket). Verify buyer được phép subscribe farmId của contract đặt cọc.

### 4.5 Header & Profile

**File mới:**
- `fe/src/screens/buyer/components/BuyerHeader.tsx` — header chung 4 tab buyer (avatar mini + tên + notification bell + optional search icon prop).

**File giữ:** `BuyerProfileNotificationScreen` route `/buyer/me`. Truy cập qua tap avatar trong header. KHÔNG hiện trong bottom-nav.

### 4.6 Shared & Backend tổng

DTO mới/cập nhật trong `be/libs/shared/src/dto/`:
- `marketplace.dto.ts` — thêm `supportsDeposit`, `harvestStatus`, `hasIotData` cho `ProductDto` (4.1).
- `proposal.dto.ts` — thêm `traderTrustScore`, `farmId`, `farmName` cho `ProposalDto` + query `buyingRequestId` (4.2).
- `contract.dto.ts` — verify `ContractChangeRequestDto.before/after` snapshot (4.3).
- `care-log.dto.ts` — verify `actor`, `imageUrl` (4.4).

Backend tasks tóm gọn:
- (BE-S) Mở rộng ProductDto + service tính `hasIotData`.
- (BE-S) Filter `buyingRequestId` cho `/proposals` + extend ProposalDto.
- (BE-M nếu thiếu) Schema/endpoint contract change-request snapshot before/after.
- (BE-S) Buyer-scoped care-log list endpoint (nếu chưa có).

Sequence: BE DTO chốt → rebuild `libs/shared` → FE bắt đầu Phase 1+. Nếu BE chậm → FE dùng adapter local/mock service trong cùng feature flag để unblock visual.

## 5. Acceptance criteria

### Nav & routing
- [ ] Bottom-nav buyer hiển thị đúng 4 tab: Khám phá / Nguồn hàng / Đơn hàng / Trực tiếp.
- [ ] Highlight tab đúng cho mọi sub-route + deep-link query (`?status=...`, `?action=create`, `?id=...`).
- [ ] Routes legacy (`/buyer/request`, `/buyer/monitor`, `/buyer/history`) auto-redirect sang route mới + sub-tab.
- [ ] Tap avatar header dẫn đến `/buyer/me` (profile-notification).

### Tab Khám phá (FR-U01)
- [ ] Grid 2 cột với TrustBadgeGroup overlay top-left ≤ 2 badge nổi bật.
- [ ] Filter chip ngang lọc client-side (Có IoT / VietGAP / Hỗ trợ đặt cọc / Sẵn hàng).
- [ ] Product detail có 3 tabs nội dung (Sản phẩm / Hồ sơ Thương lái / Nhật ký Vườn).
- [ ] Sticky footer CTA kép — render đúng theo `harvestStatus`/`supportsDeposit`.
- [ ] Tap "Thỏa thuận đặt cọc" mở stepper sheet, "Mua ngay" mở flow tạo order.

### Tab Nguồn hàng (FR-U02, FR-U03)
- [ ] FAB "+" mở `CreateBuyingRequestStepper` — 3 bước, validate từng bước, draft lưu sessionStorage.
- [ ] List buying-requests hiển thị status + count proposals chính xác.
- [ ] Tap 1 buying-request → Inbox panel hiển thị proposals + bảng so sánh.
- [ ] Highlight giá thấp nhất / trustScore cao nhất.
- [ ] Action Accept/Reject gọi service đúng, list refresh.

### Tab Đơn hàng (FR-U04, FR-U06)
- [ ] 4 status tabs (negotiating / deposited / completed / cancelled) load đúng nguồn data.
- [ ] Banner change-request pending hiển thị trên card có change-request `pending`.
- [ ] `ContractDiffView` hiển thị side-by-side với highlight đỏ/xanh đúng các field thay đổi.
- [ ] Approve/Reject change-request gọi đúng endpoint, refresh card.
- [ ] Tab Hoàn tất chứa data trước đây ở `/buyer/history` (orders + contracts completed) + filter date range hoạt động.

### Tab Trực tiếp (FR-U05)
- [ ] List chỉ contracts active/deposited của buyer → có sensor.
- [ ] Detail render 3 SemanticSensorCard với label semantic + giá trị thực + thanh màu.
- [ ] Imputed sensor (NFR-A01) có chấm xám đánh dấu, KHÔNG hiện lỗi.
- [ ] Action Timeline hiển thị care logs với avatar farmer + thời gian + ảnh (nếu có).
- [ ] Empty state hiển thị khi chưa có đơn đặt cọc.

### NFR
- [ ] NFR-U01: Mọi feature core ≤3 thao tác (vd Home → Khám phá → Tap product = 2 thao tác; Home → Nguồn hàng → FAB → Bước 1 = 3 thao tác để bắt đầu form).
- [ ] NFR-U03: Touch target ≥44×44 (FAB, chip filter, stepper button); font ≥14; KHÔNG hardcode color/font/spacing.
- [ ] NFR-A01: Imputed sensor render bình thường + dấu nhỏ phân biệt.
- [ ] NFR-C01: Bundle <20MB sau thêm component (lazy split các panel lớn, đặc biệt `BuyerLiveMonitorDetailScreen` + `BuyerDigitalTwinMonitorScreen`).
- [ ] NFR-P02: Switch tab/sub-tab <1s.

### Tests
- [ ] `fe/src/tests/e2e/regression/phase-routes-smoke.spec.ts` thêm 4 route mới + verify legacy redirect.
- [ ] Visual baseline Playwright cập nhật cho 4 màn mới + product detail.
- [ ] Unit test cho `roleNavModel.resolveActiveNavId` cho mọi nhánh buyer mới.
- [ ] Unit test `StepperForm` (validate, prev/next, submit, draft save/restore).
- [ ] Unit test `ContractDiffView` (so sánh trước/sau, render highlight đúng field).
- [ ] Backend integration test cho endpoint mới (proposal join, change-request snapshot, care-log buyer-scoped).

## 6. Bước thực hiện (cho /implementation-plan)

### Phase 0 — Foundation (commit 1)
1. Cập nhật `roleNavModel.ts` — đổi 4 tab buyer + `resolveActiveNavId`.
2. Tạo route stub `/buyer/sourcing`, `/buyer/live`, `/buyer/live/:orderId` trỏ tạm placeholder.
3. Đổi route `/buyer/request`, `/buyer/monitor`, `/buyer/history` thành `RedirectTo`.
4. Tạo `BuyerHeader` component dùng chung.
5. Cập nhật `phase-routes-smoke.spec.ts` cơ bản.
6. Build + lint pass.

### Phase 1 — Tab Khám phá + Product Detail (commit 2)
7. **BE (nếu cần)**: thêm `supportsDeposit`/`harvestStatus`/`hasIotData` vào ProductDto + service compute. Rebuild shared.
8. Tạo `TrustBadgeGroup` component.
9. Refactor `BuyerMarketplaceScreen` → grid trust-badge + filter chip + bỏ FAB.
10. Tạo `ProductDetailTabs` component.
11. Refactor `BuyerProductDetailScreen` → 3 tabs nội dung + sticky CTA kép.
12. Test unit + visual.

### Phase 2 — Tab Nguồn hàng (commit 3)
13. **BE (nếu cần)**: filter `buyingRequestId` cho `/proposals` + extend ProposalDto.
14. Tạo `StepperForm` generic + `CreateBuyingRequestStepper` 3-bước.
15. Tạo `BuyerSourcingScreen` + `SourcingListPanel`.
16. Tạo `SourcingInboxPanel` + `ProposalComparisonTable`.
17. Wire deep-link `?action=create`, `?id=...`.
18. Test unit + visual.

### Phase 3 — Tab Đơn hàng (commit 4)
19. **BE (nếu cần)**: contract change-request snapshot before/after.
20. Refactor `BuyerOrdersProposalsScreen` → 4 status tabs (gộp logic Transaction History).
21. Tạo `OrderStatusTabs`, `RenegotiationCard`, `ContractDiffView`.
22. Wire approve/reject change-request flow.
23. Migrate logic FR-U06 từ `BuyerTransactionHistoryScreen` vào tab "Hoàn tất".
24. Test unit + visual.

### Phase 4 — Tab Trực tiếp (commit 5)
25. **BE (nếu cần)**: buyer-scoped care-log endpoint + verify CareLogDto.
26. Tạo `SemanticSensorCard` + `FarmActionTimeline`.
27. Tạo `BuyerLiveMonitorScreen` + `BuyerLiveMonitorDetailScreen`.
28. Migrate `BuyerDigitalTwinMonitorScreen` thành sub-route `/buyer/live/:contractId/twin`.
29. Wire `useMonitoring` + threshold mapping.
30. Test unit + visual + verify imputed marker (NFR-A01).

### Phase 5 — Cleanup & polish (commit 6)
31. Verify E2E smoke pass cho TẤT CẢ 4 route mới + 3 route legacy redirect.
32. Visual regression Playwright update baseline.
33. `npm run build:check` đảm bảo bundle <20MB (NFR-C01).
34. Manual test 3-Click Rule cho 4 luồng cốt lõi (xem product, đăng nhu cầu, duyệt change-request, xem live).
35. Đánh dấu plan `Status: done`.

## 7. Risks / Open questions

- **R1 (BE coupling — proposal join)**: Nếu BE không kịp join `traderTrustScore`/`farmId`/`farmName` trong ProposalDto → FE fallback N+1 fetch (acceptable cho MVP, cap 5 proposals).
- **R2 (Contract change-request snapshot)**: Nếu BE chưa lưu before/after snapshot → ContractDiffView không có data so sánh ⇒ Phase 3 cần BE work trước. Plan mitigations: ship banner-only "Có yêu cầu thay đổi" (không có diff chi tiết) làm fallback.
- **R3 (Buyer access farm sensor/care-log)**: Phải bảo đảm guard backend chỉ buyer có contract active mới subscribe được. Nếu hiện chưa có → cần bổ sung guard trước khi Phase 4 ship (tránh leak farmer data).
- **R4 (Threshold semantic sensor)**: Hardcode FE threshold có thể không phù hợp mọi cây trồng. Mitigation: đọc từ standard contract; nếu không có thì hiển thị nhưng có disclaimer.
- **R5 (Bundle size)**: Thêm 4 màn mới + components có thể đẩy bundle gần ngưỡng 20MB. Mitigation: lazy split panel; reuse component design-system; verify `build:check`.
- **Q1**: ProductDto hiện tại có field nào tương đương `supportsDeposit`/`harvestStatus` chưa? (Cần đọc `marketplace.dto.ts` thực tế trước khi BE-S Phase 1.)
- **Q2**: ContractChangeRequest đã có endpoint approve/reject chưa, hay chỉ có list/create? (Cần kiểm `contractService.ts` + spec backend.)
- **Q3**: Có nên giữ `BuyerDashboardScreen` (hiện đang nhúng trong `BuyerMarketplaceScreen`) hay bỏ? Đề xuất: gọn lại thành 3 metric chip nhỏ trong header tab Khám phá, không full screen — confirm UX ưu tiên.
- **Q4**: Nút "Mua ngay" với hàng có sẵn → flow hiện tại có cần checkout/payment hay chỉ tạo order pending? (Spec backend/business-logic.)
- **Q5**: Có cần hỗ trợ chat trader trong Sourcing không? Plan này KHÔNG implement chat — confirm out-of-scope.

## 8. Estimate

- **Effort tổng:** **L** (~6–9 ngày dev/test với 1 dev FE + ~2–3 ngày BE cho 3-4 endpoint nhỏ + DTO update).
- **Order:**
  1. BE-side gaps song song hoặc trước Phase tương ứng (đặc biệt Phase 3 contract diff + Phase 4 care-log scope).
  2. FE Phase 0 → 4 tuần tự, mỗi phase commit độc lập (rollback dễ).
  3. Phase 5 cleanup + bundle check.
- **Khả năng parallel:** BE/FE song song nếu DTO contract đã chốt (libs/shared) trước.
