# Tài liệu thiết kế — Kết nối ứng dụng Frontend (routing và API)

## Tổng quan

Tài liệu mô tả cách frontend TrustAgri phát triển từ **UI tĩnh + mock data** sang **Zalo Mini App đã nối dây**: routing khai báo bằng **primitive router `zmp-ui`**, tầng **Axios** dùng chung căn chỉnh với **`specs/backend-api-specification/design.md`**, và thay mock dần trong thư mục tính năng **`src/screens/**`** (theo **`fe/specs/screen-folder-refactoring`**), giữ UX và token **`fe/specs/zalo-ui-design-system`**.

## Mục tiêu và phạm vi không làm

**Mục tiêu**

- Điều hướng giống production giữa các màn chính theo role.
- Một HTTP client, interceptor JWT, xử lý lỗi có cấu trúc.
- Tầng service + hook tách transport khỏi màn trình bày.
- Lazy load component route để giữ kích thước gói Mini App.

**Không thuộc giai đoạn này**

- Thay thư viện Zaui bằng thư viện component khác.
- Triển khai microservice backend (thuộc spec backend).
- Property-based test cho UI (tùy chọn; ưu tiên unit/E2E theo Yêu cầu §13).

## Kiến trúc

### Lớp (layered view)

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation: src/pages/*, src/screens/<role>/<feature>/*   │
│  (Zmp Page, Box, Text; design-system Button, Card, Icon)     │
├─────────────────────────────────────────────────────────────┤
│  Composition: wrapper route mỏng / container (tùy chọn)       │
├─────────────────────────────────────────────────────────────┤
│  Data hooks: src/hooks/useXxx.ts                              │
├─────────────────────────────────────────────────────────────┤
│  Services: src/services/xxxService.ts (hàm REST)            │
├─────────────────────────────────────────────────────────────┤
│  Transport: src/api/client.ts + interceptors + errors.ts    │
├─────────────────────────────────────────────────────────────┤
│  State: Jotai atoms (auth, snapshot realtime tùy chọn)        │
│  Tùy chọn: cache React Query                                  │
└─────────────────────────────────────────────────────────────┘
```

### Vị trí router

- **File sở hữu:** `src/components/layout.tsx` — tiếp tục bọc cây với `App`, `SnackbarProvider`, `ZMPRouter`, `AnimationRoutes`.
- **Tách file:** có thể tách danh sách phần tử route sang `src/router/routes.tsx` (hoặc `routes.config.ts`) export hàm `AppRoutes()` để `layout.tsx` gọn hơn.
- **Import:** màn hình import từ thư mục tính năng đã refactor, ví dụ `import { BuyerMarketplaceScreen } from '@/screens/buyer/marketplace'`.

### Cấu hình môi trường

| Biến | Mục đích |
|----------|----------|
| `VITE_API_BASE_URL` | Origin Gateway (ví dụ `https://api.example.com`) — client nối tiền tố `/api/v1` trong `env.ts` hoặc `baseURL` đã gồm version (chọn một quy ước và ghi trong code). |

Không commit secret; token lấy runtime từ auth ZMP, không từ `.env`.

## Bảng route (MVP minh họa)

Đường dẫn tương đối gốc Mini App. Điều chỉnh theo IA cuối; giữ path **kebab-case** khớp tên thư mục.

### Khách (`guest`)

| Path | Component màn (production) | Thư mục tính năng |
|------|---------------------------|------------------|
| `/` | `GuestHomeMarketNewsScreen` | `screens/guest/home-market-news` |
| `/guest/products/:productId` | `GuestProductDetailScreen` | `screens/guest/product-detail` |
| `/guest/trace/:code` | `GuestTraceabilityScanResultScreen` | `screens/guest/traceability-scan` |

### Người mua (`buyer`)

| Path | Màn hình | Thư mục tính năng |
|------|----------|-------------------|
| `/buyer` | `BuyerMarketplaceScreen` | `screens/buyer/marketplace` |
| `/buyer/products/:productId` | `BuyerProductDetailScreen` | `screens/buyer/product-detail` |
| `/buyer/orders` | `BuyerOrdersProposalsScreen` | `screens/buyer/orders-proposals` |
| `/buyer/request` | `BuyerPostBuyingRequestScreen` | `screens/buyer/post-buying-request` |
| `/buyer/monitor` | `BuyerDigitalTwinMonitorScreen` | `screens/buyer/digital-twin-monitor` |
| `/buyer/me` | `BuyerProfileNotificationScreen` | `screens/buyer/profile-notification` |

### Nông dân (`farmer`)

| Path | Màn hình | Thư mục tính năng |
|------|----------|-------------------|
| `/farmer` | `FarmerDashboardScreen` | `screens/farmer/dashboard` |
| `/farmer/farm` | `FarmerFarmProfileScreen` | `screens/farmer/farm-profile` |
| `/farmer/process` | `FarmerProcessScreen` | `screens/farmer/process` |
| `/farmer/connect` | `FarmerMarketConnectScreen` | `screens/farmer/market-connect` |
| `/farmer/contracts` | `FarmerContractsScreen` | `screens/farmer/contracts` |

### Thương lái (`trader`)

| Path | Màn hình | Thư mục tính năng |
|------|----------|-------------------|
| `/trader` | `TraderDashboardScreen` | `screens/trader/dashboard` |
| `/trader/supply` | `TraderSupplyMonitorScreen` | `screens/trader/supply-monitor` |
| `/trader/trading` | `TraderTradingOrdersScreen` | `screens/trader/trading-orders` |
| `/trader/standards` | `TraderStandardLibraryScreen` | `screens/trader/standard-library` |
| `/trader/news` | `TraderProfileNewsScreen` | `screens/trader/profile-news` |

### Hub developer (mặc định không phải production)

| Path | Mục đích |
|------|----------|
| `/dev/screens` | Launcher cũ: lazy `*.demo.tsx` cho QA / kiểm tra trực quan |

**Gợi ý điều hướng:** ưu tiên API điều hướng `zmp-ui` / `zmp-sdk` cho stack trong Mini App; tránh nhân đôi lịch sử bằng thư viện router thứ hai.

## HTTP Client

### Instance Axios (`src/api/client.ts`)

- `baseURL` từ `src/config/env.ts`.
- Timeout hợp lý (ví dụ 15s cho mobile).
- Mặc định `Content-Type: application/json`.

### Interceptors (`src/api/interceptors.ts`)

**Request**

- Đọc bearer token từ store Jotai (hoặc getter async).
- Tùy chọn: gắn `X-Request-Id` nếu sản phẩm yêu cầu correlation phía client.

**Response**

- Chuẩn hóa lỗi Axios thành `ApiError` (`src/api/errors.ts`) theo dạng backend:

```typescript
interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId: string;
  };
}
```

- Map `401` → xóa auth atoms + `openSnackbar` / modal + redirect route an toàn.
- Map `429` → thông báo «quá nhiều yêu cầu» + tùy chọn một lần retry trễ cho **GET** (idempotent).

### WebSocket (Monitoring, tùy chọn)

- Module `src/api/monitoringSocket.ts` (tên linh hoạt): client Socket.io, sự kiện `subscribe_farm`, xử lý `sensor_update`.
- Đẩy cập nhật vào atom Jotai; REST vẫn là nguồn sự thật khi cold start.

## Ánh xạ service và màn hình

| File màn | Endpoint chính (xem `specs/backend-api-specification/design.md`) | Module service |
|----------|-------------------------------------------------------------------|----------------|
| `FarmerDashboardScreen.tsx` | monitoring latest / history / alerts | `monitoringService.ts` |
| `FarmerFarmProfileScreen.tsx` | chi tiết farm | `farmService.ts` |
| `FarmerProcessScreen.tsx` | care logs, sync | `farmService.ts` |
| `FarmerMarketConnectScreen.tsx` | tìm thương lái, kết nối | `contractService.ts` (hoặc `traderService.ts`) |
| `FarmerContractsScreen.tsx` | hợp đồng / compliance | `contractService.ts` |
| `BuyerMarketplaceScreen.tsx` | tìm sản phẩm | `marketplaceService.ts` |
| `BuyerProductDetailScreen.tsx` | chi tiết sản phẩm | `marketplaceService.ts` |
| `BuyerPostBuyingRequestScreen.tsx` | tạo order | `contractService.ts` |
| `BuyerOrdersProposalsScreen.tsx` | proposals / orders | `contractService.ts` |
| `BuyerDigitalTwinMonitorScreen.tsx` | farm + monitoring | `farmService.ts` + `monitoringService.ts` |
| `BuyerProfileNotificationScreen.tsx` | notifications | `notificationService.ts` |
| `GuestTraceabilityScanResultScreen.tsx` | QR traceability | `traceabilityService.ts` |
| `TraderTradingOrdersScreen.tsx` | sản phẩm + orders / proposals | `marketplaceService.ts` + `contractService.ts` |
| `TraderSupplyMonitorScreen.tsx` | farms + monitoring + kết nối | composite hooks |

**Thư viện tiêu chuẩn / tin tức / màn analytics nặng:** có thể giữ mock hoặc một phần — ghi cờ trong hook theo `tasks.md`.

## Ma trận traceability chức năng (mục 4.3.1 / 4.3.2)

| Mục chức năng | Route / màn FE | Service / hook FE | Phụ thuộc backend |
|---|---|---|---|
| US-F01, FR-F04 | `/farmer/contracts`, `FarmerContractsScreen` | `contractService`, `useContracts` | `GET /api/v1/contracts` |
| US-F02, FR-F06 | `/farmer/process`, `/trader/standards` | `farmService`, `standardsService` | `/api/v1/standards*`, trường quy trình farm/hợp đồng |
| US-F03, FR-F07, FR-F08 | `/farmer`, `FarmerDashboardScreen` | `monitoringService`, hook socket | API latest / history / alerts |
| US-F04, FR-F02, FR-F03 | `/farmer/connect` | hook tìm thương lái + kết nối | search + connections + danh sách pending |
| US-F05, FR-F09 | `/farmer/process` | hook care log + upload minh chứng | care-log + metadata evidence |
| US-T01, FR-T02 | `/trader`, `TraderDashboardScreen` | `dashboardService` | endpoint dashboard |
| US-T02, FR-T10 | `/trader/standards` | `standardsService` | API thư viện tiêu chuẩn |
| US-T03, FR-T03, FR-T04, FR-T05 | `/trader/trading` | `contractService`, `marketplaceService` | products, buying-requests, proposals, orders |
| US-T04, FR-T11 | `/trader/supply` | hook compliance / monitoring | compliance + monitoring |
| US-T05, FR-T12 | `/trader/news` | `newsService` | CRUD tin thương lái + tin public |
| US-U01, FR-U01 | `/buyer`, `/buyer/products/:id` | `marketplaceService` | danh sách / chi tiết sản phẩm |
| US-U02, FR-U02 | `/buyer/request` | `buyingRequestService` | API buying-request |
| US-U03, FR-U03, FR-U05 | `/buyer/orders`, `/buyer/monitor` | `contractService`, `farmService`, `monitoringService` | proposal + contract + monitoring |
| US-U04, FR-U04 | panel thay đổi trên `/buyer/orders` | hook change-request | API change-request hợp đồng |
| FR-U06 | `/buyer/history` (route mới) | `orderHistoryService` | `GET /api/v1/orders`, `GET /api/v1/contracts` |
| US-G01, FR-G01 | `/guest/trace/:code` | `traceabilityService` | API traceability |
| US-G02, FR-G02 | widget khách trên `/` | `publicNewsService`, `publicForecastService` | tin public + dự báo |
| US-G03, FR-G03 | `/`, `/guest/products/:id` | `marketplaceService` | products public |
| FR-S01 | guard route tại layout/router | `useAuth` + auth atoms | auth verify / login / logout |

### Chính sách BE-GAP

- Hàng nào chưa có endpoint backend ổn định SHALL đánh dấu `BE-GAP` trong `tasks.md`, kèm:
  - hành vi UI tạm (mock / chỉ đọc / tắt),
  - owner (BE/FE),
  - điều kiện mở khóa (hợp đồng endpoint + payload mẫu).

## Căn chỉnh thiết kế phi chức năng (4.3.3)

- **Sẵn sàng / offline-first:** hiển thị cache và hàng đợi đồng bộ care log; gắn nhãn dữ liệu cũ / offline rõ ràng.
- **Hiệu năng:** lazy load theo route và placeholder nhẹ để giữ độ trễ chuyển cảnh nhận thức thấp.
- **Độ tin cậy:** error boundary tập trung + chuẩn hóa interceptor, tránh crash / màn trắng.
- **Tương thích:** giữ mô hình render ZMP-first và ràng buộc layout responsive từ spec design system.
- **Bảo mật / quyền riêng tư:** guard role, không log token, chỉ HTTPS với Gateway ngoài local.

## Quản trị thiết kế UI (4.3.4 – 4.3.6)

### Triết lý và công cụ

- **Native Zalo + tối giản:** vỏ route và tương tác chung cảm giác như tính năng gốc Zalo.
- **Stack ZMP-first:** `zmp-ui` (`App`, `Page`, `Box`, `Text`, `Route`, `AnimationRoutes`) và wrapper design-system hiện có.
- **Ý thức bundle:** tách code theo route và tái sử dụng component để giữ gói Mini App trong ngưỡng mục tiêu.

### Quy tắc tương tác theo role

- **Ưu tiên nông dân — quy tắc 3 lần chạm:**
  - Danh sách/chi tiết cảnh báo và tạo/cập nhật care log trong ≤ 3 lần chạm từ `/farmer`.
  - Cảnh báo ưu tiên và gợi ý hành động nằm phía trên fold.
- **Thương lái / người mua — ưu tiên thông tin:**
  - Khối dashboard / thống kê / xu hướng có thể dày hơn nhưng vẫn phân cấp và spacing token rõ.
- **Khách — khám phá không ma sát:**
  - Route public cho QR và sản phẩm / tin không cần auth gate.

### Hợp đồng token trực quan (không trôi)

#### Bảng màu (chế độ RGB mobile)

| Token | Hex | Cách dùng |
|---|---|---|
| Zalo Blue | `#0068FF` | CTA chính, nhấn mạnh điều hướng, liên kết hành động |
| Agri Green | `#3EBB6C` | Trạng thái tích cực, sinh trưởng, ngữ cảnh nông nghiệp |
| Alert Red | `#F50000` | Cảnh báo nghiêm trọng, lỗi / hủy |
| Warning Yellow | `#FFCC00` | Cảnh báo, suy giảm |
| Neutral Gray | `#F7F7F8` | Nền, viền nhẹ |

#### Typography

| Cấp | Cỡ | Dùng cho |
|---|---|---|
| Heading 1 | `22px` | Tiêu đề màn, tên Farm Lab |
| Heading 2 | `18px` | Tiêu đề nhóm chỉ số, tiêu đề mục |
| Body | `16px` | Nội dung chính, log, chi tiết |
| Tối thiểu thông tin quan trọng | `14px` | Ngưỡng dưới cho thông tin cần đọc |

Chính sách font:

- iOS: họ San Francisco hệ thống
- Android: Roboto hệ thống

#### Icon

- Phong cách mặc định: **outline**.
- Icon hệ thống / điều hướng: icon tương thích Zaui (home, user, setting, notification).
- Icon ngữ nghĩa nông nghiệp:
  - nhiệt độ → nhiệt kế
  - độ ẩm → giọt nước
  - ánh sáng → mặt trời
  - cảnh báo → tam giác cảnh báo

### Chính sách trực quan hóa dữ liệu

- Dashboard chính ưu tiên biểu đồ / mô hình hơn bảng số thô.
- Ngữ cảnh digital twin thể hiện tăng trưởng / sức khỏe bằng gợi ý trực quan và màu token.
- Giá trị số thô nên kèm màu trạng thái / icon / ngữ cảnh xu hướng khi có thể.

## Quy ước state

| Vấn đề | Cách làm |
|---------|----------|
| Phiên auth | Jotai atoms trong `src/state/authAtoms.ts` |
| Snapshot monitoring | Atom Jotai tùy chọn, cập nhật socket + seed từ REST |
| Danh sách / chi tiết server | React Query **khuyến nghị** (`useQuery`, `useMutation`) với key `['farms', farmId]` … |
| State UI tạm | `useState` trong màn |

## Tích hợp UI / design system

- Import primitive từ `src/design-system/components/*` và token từ `src/design-system/tokens/*` như màn hiện có.
- Dùng layout Zaui (`Page`, `Box`, `Text`, …) cho vỏ nhất quán (**zalo-ui-design-system**).
- Trạng thái loading và lỗi dùng cùng ngữ nghĩa màu (Agri Green tốt, Alert Red nguy hiểm, Warning Yellow cảnh báo).

## Kiểm thử

- **Unit:** parse `errors.ts`, mapper DTO trong `services/*.ts`.
- **Component:** test RTL hiện có nếu có; bổ sung cho hook với Axios mock.
- **E2E:** smoke Playwright: mở app → home theo role → một lần điều hướng.

## Phụ thuộc

Thêm khi triển khai (theo dõi trong `tasks.md`):

- `axios` (bắt buộc)
- `@tanstack/react-query` (tùy chọn, khuyến nghị)
- `socket.io-client` (tùy chọn, khi WebSocket Monitoring sống)

## Tham chiếu

| Tài liệu | Đường dẫn |
|----------|-----------|
| Quy ước thư mục màn (đã xong) | `fe/specs/screen-folder-refactoring/requirements.md` |
| Design system Zalo UI (đã xong) | `fe/specs/zalo-ui-design-system/requirements.md`, `design.md` |
| API backend | `specs/backend-api-specification/design.md` |
| Kế hoạch giao backend | `specs/backend-api-specification/tasks.md` |

## Phiên bản tài liệu

- **Phiên bản:** 1.1  
- **Phạm vi:** Giai đoạn routing + nối API (sau UI tĩnh, sau refactor thư mục)  
- **Ghi chú:** Văn bản chuẩn hóa tiếng Việt có dấu; thuật ngữ kỹ thuật giữ nguyên.
