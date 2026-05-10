# Plan: Refactor UI role Farmer theo mô hình "Execution & Compliance" 4 tab

**Created:** 2026-05-10
**Status:** done
**Owner:** tienkhoa03
**Related:** FR-F01, FR-F02, FR-F03, FR-F04, FR-F05, FR-F06, FR-F07, FR-F08, FR-F09, NFR-U01, NFR-U03, NFR-R03

## 1. Mục tiêu

Tái cấu trúc UI/UX cho vai trò **Nông dân (Farmer)** xoay quanh hai trục cốt lõi: **Thực thi (Execution)** và **Tuân thủ (Compliance)**. Bottom Navigation gọn lại còn **4 tab** thay vì 5: **Tổng quan / Vườn trồng / Giao thương / Hồ sơ**. Hệ thống đóng vai trò người giám sát + huấn luyện viên, ghép dữ liệu IoT (FR-F07/F08) với hành động canh tác (FR-F06/F09) và đầu ra thương mại (FR-F02/F03/F04/F05).

## 2. Scope

**In scope (FE-only refactor — không thêm endpoint mới)**

| Tab mới | Thay thế | Tính năng | FR |
|---|---|---|---|
| 1. Tổng quan | tab `home` cũ + `alerts` | Dynamic banner cảnh báo / contract; To-do hôm nay; Quick Action "Ghi nhật ký nhanh" | FR-F03, FR-F05, FR-F06, FR-F08, FR-F09 |
| 2. Vườn trồng | gộp tab `farm` (cũ) + `process` (cũ) thành 1 tab có 3 sub-section dạng Timeline | IoT Gauge dashboard; Timeline VietGAP; Tác vụ chèn động từ alert; Quick update CTA | FR-F06, FR-F07, FR-F08, FR-F09 |
| 3. Giao thương | gộp `connect` + `contracts` | Top tab "Tìm Thương Lái" / "Hợp Đồng Của Tôi"; Data-Diff modal cho FR-F05 | FR-F02, FR-F03, FR-F04, FR-F05 |
| 4. Hồ sơ | tab `me` cũ + nội dung Hồ sơ Vườn (Farm Lab profile) | Hồ sơ vườn + Map ghim toạ độ; Hồ sơ user (giữ lại); Lịch sử mùa vụ tự tổng hợp | FR-F01, FR-T01 |

- Đổi `roleNavModel.ts` cho farmer: 5 → 4 tab (`home`, `garden`, `trade`, `profile`).
- Routing: thêm `/farmer/garden` (gộp farm + process), `/farmer/trade` (gộp connect + contracts), giữ `/farmer/me` (mở rộng nội dung Farm Lab vào).
- Legacy redirect: `/farmer/farm` → `/farmer/me?section=farm-lab`, `/farmer/process` → `/farmer/garden?section=timeline`, `/farmer/connect` → `/farmer/trade?tab=search`, `/farmer/contracts` → `/farmer/trade?tab=contracts`.
- Tách màn lớn thành sub-component file riêng: `screens/farmer/garden/{IotDashboardSection,TimelineSection,QuickUpdateSheet}.tsx`, `screens/farmer/trade/{TraderSearchTab,ContractsTab,ContractDiffModal}.tsx`, `screens/farmer/profile/{FarmLabSection,SeasonHistorySection}.tsx`.
- Component design-system mới (nếu thiếu): `Gauge` (đã có), `Timeline`, `DiffRow`, `MapPicker` (Leaflet hoặc Zalo Map).
- Tab "Tổng quan" mới: `screens/farmer/dashboard/HomeBanner.tsx`, `TodoList.tsx`, `QuickLogFab.tsx`.

**Out of scope**
- Backend endpoint mới (forecast/news là plan riêng — `2026-05-10-01`).
- Buyer / Trader / Guest UI.
- Re-skin design-system tokens.
- Native map SDK (chỉ dùng Leaflet WebView trước).
- Migration hệ thống offline queue / Jotai atoms (giữ nguyên contract).

## 3. Tham chiếu

- `requirements.md` §FR-F01..F09, §FR-T01, §NFR-U01 (touch ≥ 44), §NFR-U03 (font ≥ 14), §NFR-R03 (snackbar VN).
- `business-logic.md` §Farmer Workflow (chăm sóc, tuân thủ tiêu chuẩn, phản hồi cảnh báo).
- `/specs/frontend-ui-specification/design.md`
  - §Farmer Dashboard
  - §Farm Profile / IoT
  - §Process & Diary
  - §Market & Connect
  - §Contracts
- `/specs/backend-api-specification/design.md` §4.2 farms / §4.3 care-logs / §4.4 contracts / §4.5 monitoring / §4.6 connections.
- `.claude/docs/design-system.md` — token color/spacing/typography.

## 4. Thay đổi dự kiến

### Frontend

#### 4.1 Navigation & Routing
- `fe/src/navigation/roleNavModel.ts`
  - Thay `FARMER_TABS` từ 5 → 4 mục:
    ```
    { home,   'Tổng quan',  '/farmer',         'home'   }
    { garden, 'Vườn trồng', '/farmer/garden',  'farm'   }
    { trade,  'Giao thương','/farmer/trade',   'shopping-cart' }
    { profile,'Hồ sơ',      '/farmer/me',      'user'   }
    ```
  - Cập nhật `resolveActiveNavId('farmer', …)`: legacy paths đều map về tab tương ứng.
- `fe/src/router/routes.tsx`
  - Thêm route `/farmer/garden` → `<FarmerGardenScreen />` (component mới gộp farm-profile + process).
  - Thêm route `/farmer/trade` → `<FarmerTradeScreen />` (gộp market-connect + contracts).
  - Xoá route `/farmer/process`, `/farmer/connect`, `/farmer/contracts` ở mức bottom-nav, thay bằng redirect tới tab gộp + section/sub-tab query.
  - Giữ `/farmer/alerts`, `/farmer/connections` cho deep-link nội bộ (mở từ banner / contract list).

#### 4.2 Tab "Tổng quan" — `screens/farmer/dashboard/`
- `FarmerDashboardScreen.tsx` (refactor)
  - Bỏ phần inline IoT cards / chart history (chuyển vào tab Vườn trồng). Dashboard giờ chỉ hiển thị **3 khối**:
    1. **Dynamic Banner** (`HomeBanner.tsx`)
       - Ưu tiên tô đỏ khi có IoT alert chưa ack (lấy từ `useMonitoring().alerts`); CTA "Xem cách xử lý" → mở Bottom-Sheet hướng dẫn / `/farmer/garden?focusAlert=:id`.
       - Khi không alert IoT, kiểm tra contract pending (`/contracts?status=pending`) hoặc connection request → banner cam "Bạn có 2 yêu cầu hợp tác mới" → CTA `/farmer/trade?tab=search`.
       - Nếu không có gì → banner xanh "Mọi thứ ổn" + KPI compliance % từ dashboard summary.
    2. **To-do List** (`TodoList.tsx`) — extract từ `useCarePlan(resolvedFarmId).tasks`. Tối đa 5 dòng + "Xem tất cả" → `/farmer/garden?section=timeline`.
       - Mỗi dòng: checkbox + tiêu đề + dueTime + nút "Cập nhật ngay" (mở QuickLog).
    3. **Quick Action FAB** (`QuickLogFab.tsx`) — Nút lớn ngay giữa, mở Bottom-Sheet "Ghi nhật ký nhanh":
       - Camera (ZMP `chooseImage` sourceType camera) → preview ảnh → textarea note → submit `createCareLog` (action mặc định = `inspection`).
       - Auto-link standard step nếu user đang chạm vào timeline trước đó (lưu `lastTouchedStepId` ở Jotai).
- KPI tóm tắt (compliance %, recentAlerts, careLogCount, activeContracts) lấy từ `fetchFarmerDashboard()` hiện có — render dạng 4 chip nhỏ phía dưới banner.

#### 4.3 Tab "Vườn trồng" — `screens/farmer/garden/`
- File mới: `FarmerGardenScreen.tsx`
- 3 section dọc, scroll trong cùng Page (không tab ngang):
  1. **IoT Dashboard Section** (`IotDashboardSection.tsx`)
     - Dùng component `Gauge` đã có cho 4 sensor (temperature, humidity, light, soil_moisture). Mỗi gauge: vòng tròn % + base-line ngưỡng chuẩn (warning/danger từ `SENSOR_THRESHOLDS`).
     - Trạng thái normal → xanh; warning → cam; danger → đỏ + mini-text "Vượt ngưỡng".
     - Tap vào gauge → mở `SensorDetailModal` chứa `SensorLineChart` 24h (re-use service hiện có).
     - Imputed flag (`isImputed`) → chấm xám nhỏ ở góc gauge (NFR-A01).
  2. **Timeline Section** (`TimelineSection.tsx`)
     - Trục dọc (vertical timeline) các bước VietGAP/GlobalGAP từ `useStandard(farm.standardId)`.
     - Mỗi node: number bubble + title + description ngắn + chip status (`pending|in-progress|completed|missed|alert-suggested`).
     - **Inject động**: nếu có alert FR-F08 chưa ack → chèn 1 node "Cảnh báo: Tưới thêm nước" giữa các node thường, badge đỏ.
     - Nút "Cập nhật" trên mỗi node → mở `QuickUpdateSheet` ở chế độ pre-fill `standardStepId`.
  3. **Quick Update Sheet** (`QuickUpdateSheet.tsx`)
     - Bottom-sheet 3 bước (camera → note → submit) tối giản theo brief.
     - Phía trên có chip standardStep đang chọn (read-only).
     - Camera button: ZMP `chooseImage(sourceType: ['camera'], count: 3)` → upload qua `uploadEvidence` sau khi `createCareLog` thành công.
     - Submit → optimistic insert vào timeline; toast tiếng Việt thành công/lỗi.
- Bỏ `FarmerProcessScreen` cũ. CRUD vườn (tạo/sửa/xoá farm) chuyển hết sang tab Hồ sơ.
- Resolve `farmId` UUID cùng cơ chế hiện có (`listFarms({ownerId})` → first farm). Nếu không có farm → render empty CTA → tab Hồ sơ.

#### 4.4 Tab "Giao thương" — `screens/farmer/trade/`
- File mới: `FarmerTradeScreen.tsx`
- **Top Tab Navigation** (2 tab) bằng `Tabs` từ zmp-ui hoặc custom:
  - **Tab "Tìm Thương Lái"** (`TraderSearchTab.tsx`)
    - List View card thương lái — tái dùng search hiện tại nhưng card thiết kế lại:
      - Avatar + tên + chip "Loại nông sản thu mua" (`cropType`).
      - Vòng tròn lớn "Chỉ số uy tín" (TrustScore 0-5) — màu theo dải.
      - Region + capacity nhỏ.
      - CTA chính: **"Gửi hồ sơ năng lực"** (button primary) → tạo connection request + đính kèm thông tin farm hiện tại (farmId, cropType, area).
    - Filter chip ngang trên cùng: region / cropType / minTrustScore.
  - **Tab "Hợp Đồng Của Tôi"** (`ContractsTab.tsx`)
    - 3 sub-status pill (segmented): **Chờ duyệt / Đang chạy / Lịch sử**. Đếm số ở mỗi pill.
    - Card hợp đồng: counterparty + cropType + qty/price + ngày → tap mở `ContractDetailDrawer`.
    - Khi `status='pending_change'` (FR-F05) → card có badge "Yêu cầu thay đổi" → tap mở `ContractDiffModal`.
- **`ContractDiffModal.tsx`** — UX cốt lõi cho FR-F05
  - Render 2 cột "Cũ" / "Mới" cạnh nhau, dùng `DiffRow` so sánh từng field (`quantity`, `pricePerUnit`, `deliveryDate`, `qualityRequirements`...).
  - Field thay đổi → highlight đỏ in đậm + icon mũi tên `→`.
  - Footer: 2 nút "Chấp nhận" (primary green) / "Từ chối" (outline red); nút "Đề xuất khác" (text only) → mở form counter-proposal.
  - Confirm dialog phụ trước khi `acceptContractChange`/`rejectContractChange` → tránh tap nhầm.
- Component `DiffRow` mới trong `design-system/components/DiffRow/`.

#### 4.5 Tab "Hồ sơ" — `screens/farmer/profile/`
- File mới: `FarmerProfileScreen.tsx` (route `/farmer/me`) thay cho `ProfileScreen` shared khi role=farmer.
- Layout dọc:
  1. **User Info** (giữ từ ProfileScreen shared) — name/phone read-only, zaloId/userId/lastLogin (đã đặt ra trong plan `2026-05-10-01`, có thể merge).
  2. **Farm Lab Section** (`FarmLabSection.tsx`)
     - Hiển thị danh sách farm dưới dạng card lớn (đã có ở `FarmerFarmProfileScreen`). Tái dùng `useFarms()`, `createFarm`, `updateFarm`, `deleteFarm`.
     - Mỗi card: tên + cropType + diện tích + standardId + ảnh QR.
     - Tap card → expand thành form chỉnh sửa inline (không chuyển trang).
     - **Map Picker** (`MapPicker.tsx`)
       - Thay block toạ độ tĩnh hiện tại bằng Leaflet (CDN, lazy import) để user **ghim** vị trí GPS:
         - Click vào map → set `location.lat`, `location.lng`.
         - Marker draggable.
         - Search box (Nominatim) optional.
       - Lưu vào `FarmDto.location.lat/lng` (đã có schema).
     - FAB "+ Thêm vườn" — đặt `bottom: 88` (avoid bottom nav).
  3. **Lịch sử mùa vụ** (`SeasonHistorySection.tsx`)
     - Tự động group `careLogs` theo từng mùa vụ (computed: cluster theo `plantingDate` + harvest event).
     - Hiển thị card mỗi mùa: cropType, ngày trồng → ngày thu, sản lượng (lấy từ `OrderEntity`/`Contract` nếu có), số nhật ký, tỉ lệ tuân thủ.
     - Empty-state nếu chưa có mùa vụ hoàn tất.
- Khi user role ≠ farmer → vẫn dùng `ProfileScreen` shared (không impact trader/buyer).

### Backend

KHÔNG sửa schema/endpoint. Refactor này chỉ FE. Một số API hiện có sẽ được dùng kết hợp:
- `GET /api/v1/dashboard/farmer` — KPI banner.
- `GET /api/v1/monitoring/farms/:farmId/{latest,alerts,history}` — IoT section.
- `GET /api/v1/farms/:farmId/care-plan/today` — To-do list.
- `GET /api/v1/standards/:id` — Timeline VietGAP.
- `GET /api/v1/farms?ownerId=…` + farm CRUD — Hồ sơ.
- `GET /api/v1/connections`, `/api/v1/contracts`, `/api/v1/contract-change-requests` — tab Giao thương.
- `POST /api/v1/farms/:farmId/care-logs`, `/care-plan/tasks/:id/complete`, `/evidences` — Quick log.

### Shared
- Không thêm DTO. Có thể bổ sung type FE `FarmerHomeBannerKind = 'iot-alert' | 'contract-pending' | 'connection-request' | 'all-good'` trong `fe/src/state/farmerHomeAtom.ts` (nội bộ FE).

## 5. Acceptance criteria

- [ ] Bottom Navigation farmer chỉ còn 4 tab; tab cũ "Quy trình" và "Kết nối" biến mất khỏi nav.
- [ ] Mọi route cũ (`/farmer/process`, `/farmer/connect`, `/farmer/contracts`, `/farmer/farm`) redirect đúng tới tab mới.
- [ ] Tab Tổng quan:
  - [ ] Banner đổi 3 trạng thái (alert đỏ / contract cam / all-good xanh).
  - [ ] To-do list lấy đúng từ `care-plan/today`; tap "Cập nhật" mở QuickLog.
  - [ ] FAB QuickLog tạo care-log với ảnh + note thành công (smoke).
- [ ] Tab Vườn trồng:
  - [ ] 4 Gauge IoT hiển thị đúng giá trị + base-line ngưỡng; trạng thái màu theo `sensorStatus()`.
  - [ ] Timeline render đầy đủ bước theo `standardId`; alert được inject động ở vị trí phù hợp.
  - [ ] Tap node → mở QuickUpdateSheet với standardStepId pre-fill.
- [ ] Tab Giao thương:
  - [ ] Top tab 2 mục hoạt động; URL query `?tab=` đồng bộ.
  - [ ] Search trader: trustScore vòng tròn rõ ràng; CTA "Gửi hồ sơ năng lực" tạo connection thành công.
  - [ ] Hợp đồng: 3 segmented hoạt động; pending_change mở `ContractDiffModal`.
  - [ ] DiffModal highlight field thay đổi đúng; accept/reject gọi đúng API.
- [ ] Tab Hồ sơ:
  - [ ] Hiển thị User Info read-only (giữ acceptance từ plan 01).
  - [ ] Farm Lab section: list + create + edit + delete; MapPicker ghim được GPS, save về `location.lat/lng`.
  - [ ] FAB "+ Thêm vườn" không bị bottom nav che.
  - [ ] Lịch sử mùa vụ tự tổng hợp ≥ 1 card khi có ≥ 5 careLog hợp lệ; empty-state khi chưa có.
- [ ] NFR-U01: tap target ≥ 44×44 cho mọi nút mới.
- [ ] NFR-U03: font body ≥ 14, chỉ dùng token từ `design-system/tokens/`.
- [ ] NFR-R03: Snackbar tiếng Việt cho mọi nhánh API mới.
- [ ] Bundle: `npm run build:check` < 20MB sau khi thêm Leaflet (lazy-import). Nếu vượt → đổi sang map đơn giản hơn (vd. tile static + chỉ marker).
- [ ] Test:
  - [ ] Unit Jest cho `HomeBanner` 3 trạng thái, `DiffRow` highlight đúng, `Timeline` inject alert.
  - [ ] Playwright e2e regression: cập nhật `phase-routes-smoke.spec.ts` cho 4 tab; thêm `farmer-refactor.spec.ts` smoke 4 tab.

## 6. Bước thực hiện (cho /implementation-plan)

1. **Navigation & Routing skeleton**
   - Update `roleNavModel.ts` (4 tab) + `routes.tsx` (route mới + redirect cũ).
   - Tạo file rỗng `FarmerGardenScreen.tsx`, `FarmerTradeScreen.tsx`, `FarmerProfileScreen.tsx` placeholder.
   - Verify build + e2e cũ không vỡ; các route cũ redirect.
2. **Design-system primitives**
   - Tạo `design-system/components/Timeline/` (vertical timeline với inject node).
   - Tạo `design-system/components/DiffRow/`.
   - Tạo `design-system/components/MapPicker/` (lazy Leaflet).
   - Unit test cho mỗi component.
3. **Tab Tổng quan** — refactor `FarmerDashboardScreen.tsx`
   - Tách `HomeBanner`, `TodoList`, `QuickLogFab`.
   - Loại bỏ phần IoT cũ khỏi screen này (ghi rõ commit log).
4. **Tab Vườn trồng**
   - Implement `IotDashboardSection` (Gauge × 4 + chart modal).
   - Implement `TimelineSection` (render standard steps + inject alerts).
   - Implement `QuickUpdateSheet` (camera + note + submit).
5. **Tab Giao thương**
   - Implement `TraderSearchTab` (card mới với TrustScore vòng tròn, CTA "Gửi hồ sơ năng lực").
   - Implement `ContractsTab` (segmented + cards).
   - Implement `ContractDiffModal` (DiffRow + accept/reject).
6. **Tab Hồ sơ**
   - Tạo `FarmerProfileScreen` (compose User Info + FarmLabSection + SeasonHistorySection).
   - Tích hợp `MapPicker` vào edit form.
   - Compute & render `SeasonHistorySection`.
7. **Test & polish**
   - Update `phase-routes-smoke.spec.ts`.
   - Thêm `farmer-refactor.spec.ts` Playwright.
   - Manual smoke trên mobile viewport (375×812 + 360×640).
   - `npm run build:check` để xác nhận bundle < 20MB.
8. **Cleanup**
   - Xoá file legacy: `FarmerProcessScreen.tsx`, `FarmerMarketConnectScreen.tsx`, `FarmerContractsScreen.tsx`, `FarmerFarmProfileScreen.tsx` sau khi mọi nơi đã trỏ sang screen mới (giữ `index.ts` re-export tạm 1 release nếu cần backward-compat).

## 7. Risks / Open questions

- **Bundle size + Leaflet**: thêm thư viện map có thể đẩy bundle vượt 20MB (NFR-C01). Mitigation: lazy-import Leaflet chỉ khi mở MapPicker; fallback về input toạ độ thủ công nếu network không tải được tile. **→ Cần đo build:check sau prototype.**
- **Camera permission ngoài Zalo Mini App**: dev browser không có `chooseImage` → fallback file input (đã có pattern). Đảm bảo Quick Log hoạt động cả 2 môi trường.
- **`SeasonHistorySection`** dùng heuristic group theo plantingDate — backend chưa có concept "mùa vụ". Có nên thêm `season` entity vào BE (out-of-scope) hay client compute? **→ Tạm client compute; gắn TODO mở rộng sau.**
- **Top tab vs URL query**: cần đảm bảo back/forward Zalo browser hoạt động khi tab thay đổi (push state qua `useNavigate` thay setState).
- **Migration data**: tất cả route cũ đã được redirect — nhưng deep-link từ notification cũ (vd. push notify trỏ `/farmer/contracts/:id`) cần kiểm tra để không 404.
- **Trùng lặp với plan `2026-05-10-01`**: plan đó đã chạm `roleNavModel.ts` và `ProfileScreen`. Cần thực hiện plan 01 trước, plan này build trên kết quả đó.

## 8. Estimate

- **Effort:** XL (4 tab refactor + 3 component design-system + test).
- **Order of execution:**
  1. Hoàn thành plan `2026-05-10-01` (bug fix + Profile rework) trước.
  2. Plan này: bước 1–2 (skeleton + design-system) có thể merge sớm, low-risk.
  3. Bước 3–6 mỗi tab thành 1 PR riêng để review dễ.
  4. Bước 7–8 sau khi 4 tab xanh.
- **Suggested PR breakdown:** 6 PR — Nav/Routing, DS primitives, Tab Home, Tab Garden, Tab Trade, Tab Profile + cleanup.
