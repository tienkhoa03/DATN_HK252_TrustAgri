# TrustAgri — TODO còn lại sau đợt fix compile errors

> Tạo: 2026-05-20 — Trạng thái: 7 lỗi TS còn lại trên FE + spec audit chưa thực hiện.
> BE đã build sạch (turbo build success); BE chưa được audit lại theo spec.

## A. Tóm tắt đã làm

### Backend
- `npm run build` (turbo) cho 7 packages — **PASS**, không có compile error.

### Frontend
- TS errors giảm từ **69 → 7**. Đã fix:
  - `fe/tsconfig.json`: thêm `es2018` vào lib (cho `Promise.finally`) và `node` vào types.
  - `fe/src/design-system/tokens/colors.ts`: đổi tên `getNearestValidColor` → `getDefaultColorFallback` để tránh trùng tên với `utils/errorHandling.ts`.
  - `fe/src/design-system/tokens/icons.ts`: đổi tên `SensorType` → `SensorIconKey` để tránh trùng với version ở `components/SensorDisplay`/`services/monitoringService`.
  - `fe/src/design-system/utils/grid.ts`: sửa import (`spacing.getSpacing` không tồn tại → dùng `getSpacing`, `padding` trực tiếp).
  - `fe/src/design-system/utils/errorHandling.example.tsx`: `size="xxLarge"` → `size="xLarge"`.
  - `fe/src/design-system/components/Button/Button.example.tsx`: bỏ `style` prop (Button không nhận `style`).
  - `fe/src/screens/buyer/post-buying-request/BuyerPostBuyingRequestScreen.{demo,example}.tsx`: viết lại theo API mới (component không còn nhận `buyerName/onSubmit/onCancel`).
  - `fe/src/screens/trader/standard-library/TraderStandardLibraryScreen.{demo,example}.tsx`: bỏ props `onCreateStandard/onEditStandard/onDeleteStandard/standards` (component giờ self-fetch).
  - `fe/src/pages/index.tsx`: loại bỏ 4 demo screens không còn tồn tại (`FarmerProcessScreenDemo`, `FarmerMarketConnectScreenDemo`, `FarmerFarmProfileScreenDemo`, `FarmerContractsScreenDemoSimple`) và import `FarmerDashboardScreenDemo` thẳng từ file demo.
  - `fe/src/pages/index.tsx` + `pages/index-step-by-step.tsx` + `screens/trader/standard-library/TraderStandardLibraryScreen.tsx`: `Text.Title size="xSmall"` → `size="small"` (zmp-ui chỉ hỗ trợ `xLarge|large|normal|small`).
  - `fe/src/screens/farmer/alerts/FarmerAlertListScreen.tsx`: `fontSize.xSmall` → `fontSize.small`.
  - `fe/src/screens/farmer/garden/FarmerGardenListScreen.tsx`: khai báo `let statusColor: string` để tránh TS narrow xuống literal type `"#3EBB6C"`.
  - `fe/src/screens/farmer/trade/TraderSearchTab.tsx` + `screens/trader/marketplace/panels/MarketplaceSupplyPanel.tsx`: bổ sung type `DerivedConnectionStatus = 'negotiating' | 'signed'` (UI-only) để cùng tồn tại với `ConnectionDto.status` của BE; cập nhật `STATUS_LABEL/STATUS_COLOR/STATUS_PRIORITY` để bao gồm `cancelled`.
  - `fe/src/services/contractService.ts`: thêm `in_settlement` vào `ContractDto.status` để khớp BE (`apps/contract-service/src/contracts/entities/contract.entity.ts` đã có 6 trạng thái) và bỏ duplicate `'pending_signature'` ở `ListContractsParams.status`.
  - `fe/src/design-system/tokens/__tests__/colors.test.ts`: đổi reference theo tên mới (`getDefaultColorFallback`).

## B. Lỗi TypeScript còn lại trên FE (7 lỗi)

### 1. `src/hooks/useStableOpenSnackbar.ts:3` — TS2614 SnackbarOptions không export
```
import type { SnackbarOptions } from 'zmp-ui/snackbar-provider';
```
**Cách fix:**
- Kiểm tra `fe/node_modules/zmp-ui/snackbar-provider/index.d.ts` xem tên hiện tại của type options là gì (có thể đã đổi thành `SnackbarProps`, `OpenSnackbarOptions`, hoặc parameter của `openSnackbar`).
- Nếu không export, suy ra type từ `useSnackbar()` của zmp-ui:
  ```ts
  type SnackbarOptions = Parameters<ReturnType<typeof useSnackbar>['openSnackbar']>[0];
  ```
- Nếu cách trên không lấy được type, fallback an toàn:
  ```ts
  type SnackbarOptions = { type?: 'success' | 'error' | 'info' | 'warning'; text?: string; duration?: number; icon?: boolean; action?: { text: string; onClick?: () => void } };
  ```

### 2. `src/pages/AppInitScreen.tsx:518` — TS2322 Spinner không nhận `size`
```tsx
{status === 'loading' ? <Spinner size="small" /> : null}
```
**Cách fix:** zmp-ui `Spinner` không có prop `size`. Bỏ prop đó:
```tsx
{status === 'loading' ? <Spinner /> : null}
```
Nếu cần spinner nhỏ hơn, wrap trong `<div style={{ fontSize: 14 }}>` hoặc dùng CSS scale.

### 3-5. Test integration files — TS2724 FarmerProcessScreen không tồn tại
- `src/tests/integration/navigation-flows.test.tsx:13`
- `src/tests/integration/theme-consistency.test.tsx:16`
- `src/tests/integration/user-flows.test.tsx:13`

Cùng pattern:
```ts
import { FarmerProcessScreen } from '../../screens/farmer';
```
**Cách fix:** Screen `FarmerProcessScreen` đã bị xóa khỏi refactor. Các test này test luồng nông dân nên cần map sang screen mới phù hợp:
- Quy trình + nhật ký giờ nằm trong `FarmerGardenMonitorScreen` (theo dõi quy trình) hoặc các thành phần trong `FarmerGardenScreen`.
- Mở từng test, đọc xem nó assert hành vi gì:
  - Nếu test luồng "log chăm sóc / quy trình" → đổi sang `FarmerGardenMonitorScreen` (`fe/src/screens/farmer/garden/FarmerGardenMonitorScreen.tsx`).
  - Nếu test luồng dashboard → đổi sang `FarmerDashboardScreen`.
- Sau đó cập nhật cả assertion text / data-testid theo screen mới.

### 6. `src/tests/visual/helpers.ts:92` — TS2353 `clip` không hợp lệ
```ts
clip: await element.boundingBox().then(box => { ... })
```
**Cách fix:** Playwright `locator.screenshot()` không có option `clip` (chỉ `page.screenshot()` mới có). Hai lựa chọn:
- Bỏ `clip` (locator screenshot tự crop theo bounding box):
  ```ts
  await element.screenshot({ path: ..., type: 'png' });
  ```
- Hoặc đổi sang `page.screenshot({ clip: {...} })` nếu bắt buộc kiểm soát vùng chụp.

### 7. `src/utils/performance.ts:327` — TS2339 `domLoading` deprecated
```ts
'DOM Processing': `${(perfData.domComplete - perfData.domLoading).toFixed(2)}ms`,
```
**Cách fix:** `domLoading` đã bị xóa khỏi `PerformanceNavigationTiming`. Thay bằng `responseEnd` (hoặc `domInteractive`) là metric tương đương:
```ts
'DOM Processing': `${(perfData.domComplete - perfData.responseEnd).toFixed(2)}ms`,
```

## C. Spec audit (chưa thực hiện — phạm vi lớn)

Người dùng yêu cầu audit cả BE và FE theo `/specs/backend-api-specification/` và `/specs/frontend-ui-specification/`. Đây là việc nặng, đề xuất chia task:

### C.1 Backend spec audit
**File spec:** `specs/backend-api-specification/design.md` (+ `requirements.md`, `tasks.md`).

**Cách thực hiện:**
1. Đọc spec, list ra tất cả endpoint + DTO contracts.
2. Đối chiếu với code BE:
   - **Endpoints**: dùng `grep` tìm `@Controller`/`@Get`/`@Post` ở `apps/*/src/**/*.controller.ts`. Đảm bảo path + method khớp spec.
   - **DTOs**: so sánh `libs/shared/src/dto/*.dto.ts` với schema spec.
   - **Status enums**: spec ghi gì → entity ghi đúng vậy.
   - **Validation rules** (`@IsString`, `@IsEnum`, `@Min`, …): khớp spec yêu cầu.
3. Đối với mỗi mismatch:
   - Nếu spec đúng, code sai → sửa code.
   - Nếu code đúng + đã release, spec lỗi thời → ghi note vào file `.claude/docs/architecture.md` (KHÔNG sửa /specs).
4. Có thể giao việc này cho sub-agent `spec-aligner` (xem `.claude/agents/spec-aligner.md`):
   ```
   Agent({ subagent_type: 'spec-aligner', description: 'BE spec audit', prompt: 'Audit BE code in be/ vs specs/backend-api-specification/. Report mismatches by category (endpoints, DTOs, validation, errors). Do NOT fix yet — produce a punch list.' })
   ```

### C.2 Frontend spec audit
**File spec:** `specs/frontend-ui-specification/design.md` (+ `requirements.md`, `tasks.md`).

**Cách thực hiện:**
1. Đọc spec, liệt kê screens, navigation flows, contract states UI cần hiển thị.
2. Đối chiếu code:
   - **Screen files** (`fe/src/screens/<role>/...`) vs spec mục "Screens".
   - **Design tokens**: spec nói màu/font/spacing → code phải import từ `fe/src/design-system/tokens/` (KHÔNG hardcode). Dùng `grep "#[0-9A-F]\{6\}"` để tìm hex hardcode.
   - **Routing**: `fe/src/router/routes.tsx` phải dùng ZMP Router/Route, không `react-router-dom` cho main nav.
   - **API services**: `fe/src/services/*Service.ts` phải gọi đúng endpoint BE spec.
3. Đặc biệt lưu ý các vùng vừa refactor (theo commits gần đây):
   - Disconnect connections (`feat: implement disconnect functionality...`).
   - Standards trader-specific filtering.
   - Contract + care log mới (`feat: enhance contract and care log services...`).
   - Monitoring WebSocket JWT + farm UI management.
4. Có thể giao cho `spec-aligner` tương tự BE.

## D. Việc cải thiện thêm (không bắt buộc, không phải lỗi)

- **`pages/index.tsx`** là dev launcher cho demo screens. Sau khi cleanup, role "farmer" chỉ còn 1 nút (Dashboard). Quyết định: xóa luôn role-farmer block, hoặc giữ để test dashboard.
- **`pages/index-step-by-step.tsx`** chỉ là debug page; xét xem có còn dùng không. Nếu không, xóa.
- **Stale `.example.tsx`/`.demo.tsx`** đã rewrite ngắn lại nhưng vẫn có thể tinh giản tiếp nếu không cần dev gallery.
- **Run unit tests** sau khi sửa: `cd fe && npm test` để chắc không break test (đặc biệt `colors.test.ts` đã đổi tên hàm).
- **Vite build check**: `cd fe && npm run build:check` để verify bundle < 20MB (NFR-C01).

## E. Lệnh tiện ích để verify

```bash
# BE
cd be && npm run build           # turbo build all
cd be && npm run lint            # eslint
cd be && npm run test            # jest unit

# FE
cd fe && npx tsc --noEmit        # type check (đang còn 7 lỗi)
cd fe && npm run lint            # eslint
cd fe && npm run test            # jest unit
cd fe && npm run build           # vite production build
cd fe && npm run build:check     # bundle size
```
