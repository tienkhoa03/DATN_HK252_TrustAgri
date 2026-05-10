# Plan: Trader — Kết nối & Giao dịch UX Fixes

**Created:** 2026-05-10
**Status:** done
**Owner:** Nguyen Tien Khoa
**Related:** FR-T07, FR-T08, FR-T03, US-T03, NFR-U01

---

## 1. Mục tiêu

Ba fix riêng cho luồng trader:

1. **Navigate CTA**: Nút "Tìm nông dân" ở empty-state tab "Nông dân của tôi" (Vùng trồng) → điều hướng sang tab con "Nguồn cung" của màn Thị trường.
2. **Giao dịch / FarmerFlowPanel**: Kết nối accepted giữa trader và nông dân hiện không xuất hiện ở bất cứ tab nào trong màn Giao dịch — fix để 3 tab Mới / Đàm phán / Đã ký phản ánh đúng trạng thái.
3. **Send-connection button**: Sau khi trader gửi yêu cầu kết nối tới nông dân (MarketplaceSupplyPanel), nút "Gửi yêu cầu kết nối" vẫn hiển thị — fix để hiện badge trạng thái và ẩn nút khi đã gửi hoặc đã kết nối.

---

## 2. Scope

- **In scope:**
  - FE: `TraderSupplyMonitorScreen.tsx` — thêm nút CTA navigate
  - FE: `FarmerFlowPanel.tsx` — mở rộng "Đàm phán" để bao gồm accepted connections chưa có contract
  - FE: `MarketplaceSupplyPanel.tsx` — tải existing connections khi mount, render badge thay nút
  - BE: Không cần thay đổi schema/entity — backend `GET /connections?status=accepted` đã hỗ trợ; `ConnectionEntity` chỉ có `pending | accepted | rejected`
- **Out of scope:**
  - Tạo contract tự động khi connection được accepted
  - Phase 8 notification/WebSocket push
  - Tab "Đã ký" logic thay đổi (dùng contract service như cũ)

---

## 3. Tham chiếu

- `be/apps/contract-service/src/connections/entities/connection.entity.ts` — status: `pending | accepted | rejected`
- `be/apps/contract-service/src/connections/connections.service.ts` — `listConnections` hỗ trợ `role: incoming | outgoing`, `status: pending | accepted | rejected`
- `fe/src/services/connectionService.ts` — `ListConnectionsParams`, `ConnectionDto`, `listConnections()`
- `fe/src/screens/trader/supply-monitor/TraderSupplyMonitorScreen.tsx` — tab `my-farmers` empty state (~L880)
- `fe/src/screens/trader/transactions/flows/FarmerFlowPanel.tsx` — 3-tab render, `listConnections({ role: 'incoming', status: 'pending' })`
- `fe/src/screens/trader/marketplace/panels/MarketplaceSupplyPanel.tsx` — `handleSendConnectionRequest`, render button

---

## 4. Phân tích bug

### Bug A — "Tìm nông dân" CTA

`TraderSupplyMonitorScreen` (tab `my-farmers`): empty state hiển thị text "Hãy kết nối với nông dân" nhưng không có button thực sự. Cần thêm `<button>` gọi `navigate('/trader/market?tab=supply')`.

### Bug B — FarmerFlowPanel thiếu accepted connections

Hiện tại:
- **Mới** → `listConnections({ role: 'incoming', status: 'pending' })` ✓
- **Đàm phán** → `listContracts({ role: 'trader', status: 'pending_change' })` (chỉ contracts)
- **Đã ký** → `listContracts({ role: 'trader', status: 'active' })` (chỉ contracts)

Vấn đề: Khi một kết nối được accepted (từ cả hai chiều) mà chưa có contract, nó không hiện ở đâu cả. Trader gửi outgoing request tới farmer → accepted → không hiện ở "Mới" (chỉ incoming) và không có contract nên không hiện "Đàm phán".

Giải pháp:
- **Đàm phán** = accepted connections (cả hai chiều) + contracts `pending_change`
  - Gọi thêm `listConnections({ status: 'accepted', limit: 50 })` (không filter role để lấy cả hai chiều)
  - Merge với contracts `pending_change` hiện tại
- **Mới** = pending connections incoming (giữ nguyên, trader xử lý request từ farmer)

### Bug C — Send-connection button không ẩn

`MarketplaceSupplyPanel` call `createConnection()` thành công nhưng không update state. Nút vẫn hiện vì không có state tracking.

Giải pháp:
1. Khi mount, gọi `listConnections({ status: 'all', limit: 100 })` → build `Set<farmOwnerId>` theo status
2. Sau `createConnection()` thành công → thêm `farmOwnerId` vào local state map `connectionStatusMap`
3. Render: nếu `connectionStatusMap[farm.ownerId]` là `'pending'` → hiện badge xanh lam "Đã gửi yêu cầu"; nếu `'accepted'` → badge xanh lá "Đã kết nối"; nếu không có → hiện nút gửi

---

## 5. Thay đổi dự kiến

### Frontend Only

#### `fe/src/screens/trader/supply-monitor/TraderSupplyMonitorScreen.tsx`
- Import `useNavigate` từ `zmp-ui`
- Trong `renderMyFarmersTab()`, empty-state block: thêm `<button>` "Tìm nông dân" với `onClick={() => navigate('/trader/market?tab=supply')}`

#### `fe/src/screens/trader/transactions/flows/FarmerFlowPanel.tsx`
- Thêm state: `acceptedConnections: ConnectionDto[]`, `acceptedConnLoading`
- `loadContracts` → đổi tên thành `loadNegotiatingTab`, gọi thêm `listConnections({ status: 'accepted', limit: 50 })` song song với `listContracts` hiện tại
- `renderNegotiatingTab()`: render `acceptedConnections` (dạng ConnectionCard đơn giản) + contracts `pending_change` (dạng ContractInfoCard)
- Tách render ConnectionCard nhỏ trong cùng file (hiển thị: tên placeholder farmer, ngày kết nối, badge "Đã kết nối")

#### `fe/src/screens/trader/marketplace/panels/MarketplaceSupplyPanel.tsx`
- Thêm state: `connectionStatusMap: Record<string, 'pending' | 'accepted'>` (key = farmOwnerId)
- Thêm `loadExistingConnections()` trong `useEffect` khi mount: call `listConnections({ status: 'all', limit: 100 })`, lọc connections có `fromRole = 'trader'` (outgoing) và `toRole = 'farmer'` → map `toUserId → status`
- `handleSendConnectionRequest()`: sau khi thành công, update `connectionStatusMap[farmOwnerId] = 'pending'`
- Render "Gửi yêu cầu kết nối" button: thay bằng conditional:
  - `'accepted'` → badge xanh lá "Đã kết nối"
  - `'pending'` → badge xanh lam "Đã gửi yêu cầu"
  - `undefined` → nút gửi yêu cầu (giữ nguyên)

### Backend
- Không cần thay đổi — API đã đủ

---

## 6. Acceptance criteria

- [x] FR-T07: Tìm kiếm nguồn cung — nút "Tìm nông dân" ở Vùng trồng điều hướng sang đúng tab Nguồn cung
- [x] FR-T08: Xử lý kết nối từ Nông dân — Giao dịch "Mới" hiện pending incoming; "Đàm phán" hiện accepted connections + pending_change contracts; "Đã ký" hiện active contracts
- [x] FR-T07: Gửi yêu cầu — sau khi gửi, nút ẩn và badge trạng thái hiển thị đúng
- [x] NFR-U01: Điều hướng không vượt quá 3 click
- [x] NFR-U03: Touch target ≥ 44×44px cho mọi button/badge mới
- [x] Không hardcode màu — dùng design tokens

---

## 7. Bước thực hiện (cho /implementation-plan)

1. **[FE] Fix A — CTA navigate**: Trong `TraderSupplyMonitorScreen.tsx`, import `useNavigate`, thêm button "Tìm nông dân" vào empty-state của tab `my-farmers`.
2. **[FE] Fix C — Connection status badge**: Trong `MarketplaceSupplyPanel.tsx`, thêm state `connectionStatusMap`, load existing connections khi mount, conditional render button/badge.
3. **[FE] Fix B — FarmerFlowPanel "Đàm phán"**: Trong `FarmerFlowPanel.tsx`, load accepted connections song song với contracts, merge render trong tab "Đàm phán".
4. **Test & verify**: Kiểm tra UI qua trình duyệt — gửi kết nối từ MarketplaceSupplyPanel, confirm badge đổi; mở Giao dịch → Đàm phán, confirm accepted connections hiện; Vùng trồng empty state → bấm "Tìm nông dân" → đến đúng tab.

---

## 8. Risks / Open questions

- `listConnections({ status: 'all' })` trả cả hai chiều (incoming + outgoing) vì backend `listConnectionsBothDirections` được gọi khi không có `role` filter. Cần test kỹ để không hiện kết nối của role khác.
- Nếu farmer cũng là `fromUserId` trong accepted connection (farmer sent to trader, trader accepted), connection sẽ hiện ở "Đàm phán" của trader — đây là đúng nghiệp vụ.
- `connectionStatusMap` chỉ load outgoing từ trader; nếu farmer gửi trước và trader accept, cần xử lý `incoming` accepted luôn.

---

## 9. Estimate

- Effort: **S** (3 file FE, không BE)
- Order: FE only, 3 independent fix → thực hiện tuần tự từ đơn giản đến phức tạp (A → C → B)
