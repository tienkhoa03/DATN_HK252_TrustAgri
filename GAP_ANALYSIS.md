# Gap Analysis — Đối chiếu Báo cáo ĐATN vs Code hiện tại

> **Phạm vi:** Zalo Mini App (`fe/`) + Backend NestJS (`be/apps/*`)
> **Ngoài phạm vi:** Mô hình AI bổ khuyết P-MIMP, Kafka/Message Broker, các hạng mục được thesis ghi là "ngoài phạm vi" / "hướng phát triển tiếp theo"
> **Ngày tạo:** 2026-05-28

## 0. Tổng quan kết quả

| Phân hệ | Done | Partial | Missing |
|---------|:----:|:-------:|:-------:|
| Nông dân (FR-F01 → FR-F09) | 9 | 0 | 0 |
| Thương lái (FR-T01 → FR-T12) | 10 | 2 | 0 |
| Người mua (FR-U01 → FR-U06) | 6 | 0 | 0 |
| Khách / Guest (FR-G01 → FR-G03) | 2 | 1 | 0 |
| Core (FR-S01) | 1 | 0 | 0 |
| **Tổng FR** | **28** | **3** | **0** |
| NFR đo được | 8 | 2 | 0 |
| Kiến trúc & Convention | 9 | 1 | 0 |

**Kết luận chung:** Không có FR nào hoàn toàn thiếu. Khoảng trống còn lại chủ yếu nằm ở: (i) `apis.md` sai khớp với code, (ii) một vài endpoint aggregate / biểu đồ giá ở FE còn mock, (iii) schema JSON `forecastData` chưa được chuẩn hóa ở BE, (iv) một số polish convention nhỏ.

---

## 1. Phân hệ Nông dân — Trạng thái

| FR | Mô tả | Trạng thái | Bằng chứng |
|----|-------|-----------|------------|
| FR-F01 | Quản lý hồ sơ vườn | ✅ Done | `fe/src/screens/farmer/profile/FarmerProfileScreen.tsx`, `FarmLabSection.tsx`; BE `farms.controller.ts` CRUD `/api/v1/farms` |
| FR-F02 | Tìm/lọc thương lái + gửi yêu cầu kết nối | ✅ Done | `fe/src/screens/farmer/trade/TraderSearchTab.tsx`; BE `GET /api/v1/traders/search`, `POST /api/v1/connections` |
| FR-F03 | Yêu cầu kết nối đến + accept/reject | ✅ Done | `fe/src/screens/shared/connections/ConnectionRequestsScreen.tsx`, `FarmerConnectionDetailScreen.tsx` |
| FR-F04 | Danh sách hợp đồng bao tiêu | ✅ Done | `fe/src/screens/farmer/trade/ContractsTab.tsx`; BE `GET /api/v1/contracts` |
| FR-F05 | Nhận yêu cầu thay đổi hợp đồng + accept/reject | ✅ Done | `fe/src/screens/shared/contract-change-requests/ContractChangeRequestsPanel.tsx` |
| FR-F06 | Xem chi tiết quy trình canh tác (VietGAP/GlobalGAP) | ✅ Done | `StandardInfoModal.tsx`, `TimelineSection.tsx`, `StepDetailSheet.tsx` |
| FR-F07 | Sensor real-time (nhiệt độ, độ ẩm, ánh sáng, pH) | ✅ Done | `fe/src/screens/farmer/garden/IotDashboardSection.tsx`; BE `GET /api/v1/monitoring/farms/:farmId/latest` + history + WS |
| FR-F08 | Cảnh báo tự động khi vượt ngưỡng | ✅ Done | `fe/src/screens/farmer/alerts/FarmerAlertListScreen.tsx`, `subscribeToFarmAlerts` |
| FR-F09 | Cập nhật chăm sóc + minh chứng (online + offline) | ✅ Done | `QuickUpdateSheet.tsx`, `careLogOfflineQueue.ts` (IndexedDB + `clientRecordId`), `careLogAutoSync.ts` |

**Polish nhỏ (không phải gap):**
- `FarmerConnectionDetailScreen.tsx` đang dùng `useLocation` từ `react-router-dom` → cân nhắc đổi sang `zmp-ui` để đồng bộ convention (xem mục §7).
- `ConnectionRequestsScreen` hiển thị thông tin kết nối cơ bản, không gồm "quantity/quality/process/deposit" như mô tả FR-F03 trong thesis. Nếu muốn bám sát mô tả, mở rộng `ConnectionDto` ở BE để mang theo `proposalNotes` hoặc liên kết hợp đồng dự kiến.

---

## 2. Phân hệ Thương lái — Trạng thái

| FR | Mô tả | Trạng thái | Ghi chú |
|----|-------|-----------|---------|
| FR-T01 | Hồ sơ thương nhân | ✅ Done | `TraderProfileNewsScreen.tsx` tab profile |
| FR-T02 | Dashboard thống kê | ⚠️ **Partial** | Có `fetchTraderDashboard`, nhưng chưa có aggregate "xu hướng nhu cầu thị trường" tách rời theo crop |
| FR-T03 | Đăng sản phẩm + đăng nhu cầu mua từ nông dân | ✅ Done | `MarketplaceFeedPanel.tsx`, `MarketplaceSupplyPanel.tsx` |
| FR-T04 | Phản hồi buying-request của buyer | ✅ Done | `proposalService.createProposal` |
| FR-T05 | Xử lý đơn từ buyer | ✅ Done | `TraderTradingOrdersScreen.tsx` |
| FR-T06 | Quản lý hợp đồng với buyer | ✅ Done | `BuyerFlowPanel.tsx`, `ContractDetailModal.tsx` |
| FR-T07 | Tìm nông dân + gửi yêu cầu kết nối | ✅ Done | `TraderSupplyMonitorScreen.tsx` |
| FR-T08 | Xử lý yêu cầu kết nối từ nông dân | ✅ Done | `FarmerFlowPanel.tsx` |
| FR-T09 | Quản lý hợp đồng sản xuất (gồm điều chỉnh quy trình) | ✅ Done | hỗ trợ `standardId` trong change-request |
| FR-T10 | Thư viện quy trình chuẩn (VietGAP/GlobalGAP/Hữu cơ) | ✅ Done | `TraderStandardLibraryScreen.tsx` CRUD đầy đủ |
| FR-T11 | Giám sát tuân thủ — sensor + đối chiếu standards + care actions | ✅ Done | `TraderFarmMonitoringScreen.tsx`, `FarmTrafficLightCard.tsx`, `GET /api/v1/contracts/:id/compliance` |
| FR-T12 | Đăng tin tức + bảng giá + dự báo | ⚠️ **Partial** | `forecastData` là JSON tự do, chưa có DTO/validator chuẩn ở BE |

---

## 3. Phân hệ Người mua — Trạng thái

| FR | Mô tả | Trạng thái |
|----|-------|-----------|
| FR-U01 | Tra cứu sản phẩm + chi tiết trader + farm history + đặt mua/đặt cọc | ✅ Done |
| FR-U02 | Đăng nhu cầu mua | ✅ Done (`CreateBuyingRequestStepper`) |
| FR-U03 | Xử lý đề xuất từ trader | ✅ Done (`ProposalComparisonTable`) |
| FR-U04 | Quản lý đơn đặt cọc + change-request | ✅ Done |
| FR-U05 | Giám sát vườn hợp đồng (env + growth + care actions) | ✅ Done (`BuyerLiveMonitorScreen`) |
| FR-U06 | Lịch sử giao dịch | ✅ Done (`BuyerTransactionHistoryScreen`) |

**Polish:**
- `BuyerProductDetailScreen.tsx` dùng `useParams` từ `react-router-dom` → đổi sang `zmp-ui` (xem §7).
- `BuyerDigitalTwinMonitorScreen.tsx` được note là deprecated (replaced by `BuyerLiveMonitorScreen`) nhưng vẫn nằm trong source → cân nhắc xóa hoặc archive để giảm bundle (xem §7).

---

## 4. Phân hệ Khách / Guest — Trạng thái

| FR | Mô tả | Trạng thái |
|----|-------|-----------|
| FR-G01 | Truy xuất công khai qua QR | ✅ Done (`TraceabilityScreen.tsx`, route public `/trace/:code`) |
| FR-G02 | Tin tức + dự báo + biểu đồ giá (không login) | ⚠️ **Partial** — biểu đồ giá 7 ngày hiện **mock dữ liệu ở FE** |
| FR-G03 | Marketplace public | ✅ Done |

---

## 5. NFR (Yêu cầu phi chức năng)

| NFR | Trạng thái | Bằng chứng |
|-----|-----------|------------|
| NFR-A01 — Imputed sensor data có marker, KHÔNG render "lỗi" | ✅ Done | `IotDashboardSection.tsx`, `SensorLineChart.tsx`, `EnvironmentSnapshotCard.tsx`, `SemanticSensorCard.tsx` |
| NFR-R03 — Snackbar friendly messages | ✅ Done | 70+ file dùng `useStableOpenSnackbar` + `toXxxViMessage(err)` |
| 401 → clear session + redirect login | ✅ Done | `fe/src/api/interceptors.ts` lines 36-41 |
| Care log offline queue (IndexedDB + clientUUID + `/care-logs/sync`) | ✅ Done | `careLogOfflineQueue.ts` + `careLogAutoSync.ts` |
| Touch target ≥ 44×44, min font 14px | ✅ Done | Quan sát qua design tokens |
| HTTPS-only ở prod | ✅ Done | API Gateway prod xử lý |
| Bundle < 20MB | 🟡 **Cần đo** | Chạy `npm run build:check` để xác nhận |
| Performance: <3s app start, <1s nav | 🟡 **Cần đo** | Lazy split đã làm; chạy Lighthouse/Playwright benchmark |
| No PII at warn/error level | 🟡 **Cần verify** | Spot-check `auth-service` log statements |

---

## 6. Kiến trúc & Convention

| Tiêu chí | Trạng thái |
|----------|-----------|
| ZMP Router cho navigation chính | ✅ Done |
| Không screen gọi axios trực tiếp | ✅ Done (`grep` 0 matches) |
| Service layer per feature | ✅ Done (27 service files) |
| Jotai cho auth + React Query cho server cache | ✅ Done |
| Axios interceptor trong `fe/src/api/` | ✅ Done |
| Lazy-load heavy screens | ✅ Done (toàn bộ trong `routes.tsx`) |
| Design tokens (không hardcode) | ✅ Done (100+ file import từ `@/design-system/tokens`) |
| NestJS structure | ✅ Done |
| Shared DTO trong `be/libs/shared/` | ✅ Done |
| `apis.md` đồng bộ với code | ⚠️ **Partial** — 2 dòng sai + thiếu vài endpoint mới |
| `react-router-dom` không dùng cho main nav | ✅ Done với cảnh báo nhỏ (5 file dùng `useParams`/`useLocation` ở vị trí phụ) |

---

# 7. DANH SÁCH CÔNG VIỆC CẦN LÀM

> Sắp xếp theo độ ưu tiên. Mỗi item có WHAT / WHERE / HOW.

## 🔴 CRITICAL — Sửa sớm (ảnh hưởng spec & doc)

### TASK-1: Sửa `apis.md` cho khớp code thực tế

**WHAT:** `apis.md` đang liệt kê 2 endpoint không tồn tại trong code và thiếu một vài endpoint đã hiện thực.

**WHERE:** `c:/Users/ntkhoa/Code/TrustAgri/apis.md`

**HOW:**
1. Xóa 2 dòng:
   - `POST /api/v1/connections/:id/negotiate`
   - `POST /api/v1/connections/:id/sign`

   → Lý do: workflow đàm phán/ký diễn ra ở **contract layer**, không phải connection layer. FE `TraderSearchTab.tsx` đã có comment xác nhận hai trạng thái `negotiating`/`signed` chỉ là UI-only derived state.

2. Bổ sung các endpoint đã hiện thực nhưng `apis.md` chưa liệt kê:
   - `GET /api/v1/contracts/linked-farms` (trong `contracts.controller.ts:64`)
   - `PATCH /api/v1/contracts/:id/sign` (workflow ký hợp đồng — nếu có)
   - `POST /api/v1/contracts/:id/reject` (nếu có)
   - Cập nhật mô tả `apis.md` rằng việc tạo hợp đồng tự động khi `acceptProposal`/`acceptOrder`

3. **Khuyến nghị:** dùng Swagger để tự sinh `apis.md` (controller đã có `@ApiTags`):
   ```bash
   # Mỗi service có Swagger UI tại /api/docs khi chạy dev
   # Có thể export OpenAPI JSON → markdown bằng tool như widdershins
   ```

**Acceptance:** Đối chiếu từng dòng trong `apis.md` với `@Controller`/`@Get`/`@Post` decorators trong `be/apps/**/*.controller.ts` không lệch.

---

### TASK-2: Hoàn thiện biểu đồ giá thực cho Guest (FR-G02)

**WHAT:** Biểu đồ "Xu hướng giá 7 ngày" trên trang home của Guest hiện đang **mock data ở FE**. Thesis yêu cầu hiển thị biểu đồ giá lấy từ dữ liệu thực.

**WHERE:**
- FE chính: `fe/src/screens/guest/home-market-news/GuestHomeMarketNewsScreen.tsx`
- Service FE: `fe/src/services/newsForecastService.ts`
- BE (tùy chọn): `be/apps/notification-service/src/forecasts/forecasts.controller.ts`

**HOW (Option A — chỉ làm ở FE, không động BE):**

1. Mở `GuestHomeMarketNewsScreen.tsx`, tìm phần `priceData` đang mock.
2. Thay bằng `listForecasts({ category: 'price_forecast' })` từ `newsForecastService`.
3. Parse `forecastData.priceSeries[]` → render qua component `Chart`/`Sparkline` trong design-system.
4. Filter theo `cropType` user chọn (hoặc default top 3 cropType).

**HOW (Option B — BE bổ sung endpoint aggregate, đẹp hơn):**

1. Tạo endpoint mới trong `forecasts.controller.ts`:
   ```typescript
   @Get('price-trends')
   @ApiQuery({ name: 'cropType', required: false })
   @ApiQuery({ name: 'days', required: false })
   async getPriceTrends(
     @Query('cropType') cropType?: string,
     @Query('days') days: number = 7,
   ): Promise<PriceTrendDto[]> {
     return this.forecastsService.aggregatePriceTrends(cropType, days);
   }
   ```
2. Service: aggregate từ bảng `forecasts` (cột `forecastData` JSON), group by `cropType` + day.
3. FE: thêm method `getPriceTrends(cropType?, days?)` trong `newsForecastService.ts`, dùng React Query key `['forecasts', 'price-trends', cropType, days]`.
4. Thay mock data trong `GuestHomeMarketNewsScreen.tsx` bằng call mới.

**Acceptance:** Mở app trong vai Guest, thấy biểu đồ giá load từ network call (không phải hardcode), thay đổi `cropType` thì biểu đồ đổi.

---

## 🟠 HIGH — Tăng tính nhất quán & tin cậy

### TASK-3: Chuẩn hóa schema `forecastData` (FR-T12)

**WHAT:** Trường `forecastData` đang là JSON tự do, FE tự định nghĩa type `PriceSeriesRow` / `DemandSeriesRow`. Không có validator ở BE → dữ liệu có thể bị méo, khó query sau này.

**WHERE:**
- Shared DTO: `be/libs/shared/src/dto/forecast-payload.dto.ts` (file mới)
- BE service: `be/apps/notification-service/src/forecasts/forecasts.service.ts`
- FE: `fe/src/services/newsForecastService.ts`

**HOW:**

1. Tạo file `be/libs/shared/src/dto/forecast-payload.dto.ts`:
   ```typescript
   import { IsArray, IsEnum, IsNumber, IsString, ValidateNested } from 'class-validator';
   import { Type } from 'class-transformer';

   export enum ForecastRiskLevel {
     LOW = 'low',
     MEDIUM = 'medium',
     HIGH = 'high',
   }

   export class PriceSeriesItemDto {
     @IsString() date!: string;       // ISO date
     @IsNumber() price!: number;      // VND/kg
   }

   export class DemandSeriesItemDto {
     @IsString() date!: string;
     @IsNumber() demand!: number;     // index 0-100
   }

   export class ForecastPayloadDto {
     @ValidateNested({ each: true })
     @Type(() => PriceSeriesItemDto)
     @IsArray()
     priceSeries!: PriceSeriesItemDto[];

     @ValidateNested({ each: true })
     @Type(() => DemandSeriesItemDto)
     @IsArray()
     demandSeries!: DemandSeriesItemDto[];

     @IsEnum(ForecastRiskLevel) riskLevel!: ForecastRiskLevel;
   }
   ```

2. Re-export trong `be/libs/shared/src/dto/index.ts`.

3. Trong `CreateForecastDto` / `UpdateForecastDto`, thay `forecastData: any` bằng `@ValidateNested() @Type(() => ForecastPayloadDto) forecastData: ForecastPayloadDto`.

4. FE: import type chuẩn này, xóa định nghĩa local trong `newsForecastService.ts` và `TraderProfileNewsScreen.tsx`.

**Acceptance:** Tạo forecast với `forecastData` sai schema → BE trả 400 với message rõ ràng.

---

### TASK-4: Bổ sung UI audit-log cho hợp đồng (FR-T06 polish)

**WHAT:** BE đã có `GET /api/v1/contracts/:id/audit-logs` nhưng FE chỉ dùng sơ trong `ContractDetailModal`. Buyer/farmer không có cách xem lịch sử thay đổi điều khoản hợp đồng.

**WHERE:** `fe/src/screens/trader/transactions/components/ContractDetailModal.tsx` (hoặc tạo modal/drawer riêng nếu modal quá to)

**HOW:**

1. Thêm tab thứ ba "Lịch sử thay đổi" trong `ContractDetailModal`.
2. Call `contractService.listContractAuditLogs(contractId)` (đã có hoặc cần thêm).
3. Hiển thị danh sách audit theo timeline:
   ```
   [Time] [Actor] [Action] [Field] [Old → New]
   ```
4. Dùng helper `formatDiffValue` đã có trong `ContractChangeRequestsPanel.tsx` để format diff.
5. Đảm bảo cả 3 vai trò (farmer/trader/buyer) đều có thể xem.

**Acceptance:** Mở chi tiết hợp đồng → tab "Lịch sử thay đổi" hiển thị đúng diff từng lần cập nhật.

---

### TASK-5: Mở rộng FR-T02 — Aggregate "xu hướng nhu cầu thị trường"

**WHAT:** Dashboard thương lái có biểu đồ tổng quan nhưng không có chỉ tiêu "xu hướng nhu cầu thị trường" tách riêng theo cropType.

**WHERE:**
- BE: `be/apps/contract-service/src/dashboard/dashboard.service.ts` (hoặc tương đương)
- FE: `fe/src/screens/trader/dashboard/TraderDashboardScreen.tsx`

**HOW:**

1. Trong `dashboard.service.ts` ở contract-service, thêm method `getMarketTrendsForTrader(traderId)`:
   - Aggregate từ `buying_requests` (số lượng buyer cùng cropType trong 30 ngày), group by `cropType`.
   - Aggregate từ `orders` đã hoàn thành (sản lượng đã giao theo cropType).
   - Trả về `{ cropType, demand: number, supply: number, trend: 'up'|'flat'|'down' }[]`.

2. Bổ sung route `GET /api/v1/dashboard/trader/market-trends` (hoặc gộp vào response chính của `/dashboard/trader`).

3. FE `TraderDashboardScreen.tsx`: thêm card "Xu hướng nhu cầu thị trường" hiển thị table/bar chart.

**Acceptance:** Dashboard trader hiển thị section riêng cho market trends.

---

## 🟡 MEDIUM — Polish code

### TASK-6: Chuyển 5 file `react-router-dom` sang `zmp-ui`

**WHAT:** 5 màn hình dùng `useParams` / `useLocation` từ `react-router-dom`. Quy ước nội bộ (`CLAUDE.md`, `.claude/rules/20-frontend.md`) yêu cầu ưu tiên `zmp-ui` để đồng bộ.

**WHERE:**
- `fe/src/screens/shared/traceability/TraceabilityScreen.tsx`
- `fe/src/screens/guest/product-detail/GuestProductDetailScreen.tsx`
- `fe/src/screens/buyer/product-detail/BuyerProductDetailScreen.tsx`
- `fe/src/screens/trader/connections/TraderConnectionDetailScreen.tsx`
- `fe/src/screens/farmer/connections/FarmerConnectionDetailScreen.tsx`

**HOW:**

```typescript
// TRƯỚC:
import { useParams, useLocation } from 'react-router-dom';

// SAU:
import { useParams, useLocation } from 'zmp-ui';
```

(API giống nhau vì `zmp-ui` re-export từ react-router-dom bên dưới — đổi import là đủ.)

**Acceptance:** `grep -r "from 'react-router-dom'" fe/src/screens` → 0 matches.

---

### TASK-7: Dọn dẹp màn deprecated `BuyerDigitalTwinMonitorScreen`

**WHAT:** Trang `BuyerDigitalTwinMonitorScreen.tsx` đã được note là deprecated (replaced by `BuyerLiveMonitorScreen`) nhưng vẫn nằm trong source, làm tăng bundle.

**WHERE:** `fe/src/screens/buyer/digital-twin-monitor/`

**HOW:**

1. Kiểm tra `routes.tsx` không còn route nào trỏ vào màn này.
2. Grep imports: `grep -r "BuyerDigitalTwinMonitor" fe/src` → đảm bảo không còn import.
3. Xóa toàn bộ folder, hoặc nếu muốn giữ lại tham khảo thì move sang `fe/src/screens/__archive__/`.
4. Chạy `npm run build:check` để verify bundle giảm.

**Acceptance:** Bundle size trước/sau có chênh lệch giảm + không có import dangling.

---

### TASK-8: Bổ sung UI xóa/sửa đánh giá thương lái (nếu chưa có)

**WHAT:** BE có `PATCH /api/v1/reviews/:id` và `DELETE /api/v1/reviews/:id`. Cần kiểm tra FE có UI cho buyer edit/delete review của chính mình không.

**WHERE:** `fe/src/components/buyer/TraderReviewModal.tsx` hoặc nơi tương đương trong `BuyerProductDetailScreen.tsx`.

**HOW:**

1. Trong `TraderReviewModal`, nếu review thuộc về user hiện tại → hiển thị 2 nút "Sửa" / "Xóa".
2. Nút "Sửa" → reopen modal với data có sẵn, gọi `traderReviewService.updateReview(id, payload)`.
3. Nút "Xóa" → confirm dialog → `traderReviewService.deleteReview(id)`.
4. Sau thao tác → invalidate React Query key `['trader-reviews', traderId]`.

**Acceptance:** Buyer có thể sửa/xóa review của mình; orphan endpoint không còn.

---

## 🟢 LOW — Validation cuối trước khi nộp

### TASK-9: Đo lường performance & bundle size (NFR-C01, NFR perf)

**WHAT:** Thesis ghi `Bundle < 20MB`, `<3s khởi động`, `<1s nav transitions`. Cần con số đo thực tế để báo cáo.

**WHERE:** N/A (chạy script)

**HOW:**

```bash
# 1. Bundle size
cd fe
npm run build:check    # script này cần verify bundle < 20MB

# 2. Performance benchmark
npm run test:visual    # Playwright benchmark

# 3. Lighthouse (chạy preview build)
npm run build
npx serve dist
# Mở Chrome DevTools → Lighthouse → Mobile profile → Run audit
```

**Acceptance:** Bundle < 20MB; Lighthouse Performance score > 80; First Contentful Paint < 3s.

---

### TASK-10: Verify không log PII (NFR Security)

**WHAT:** Quy tắc nội bộ yêu cầu sensitive data (token, password, phone) phải `[REDACTED]` ở log level warn/error.

**WHERE:** `be/apps/auth-service/src/**/*.ts`

**HOW:**

```bash
# Grep sensitive keywords trong log statements
grep -rn "logger\.\(warn\|error\|log\)" be/apps/auth-service/src/ | grep -iE "zaloAccessToken|password|phone|accessToken|refreshToken"
```

- Nếu có match → kiểm tra context. Token/password phải thay bằng `[REDACTED]` hoặc bỏ hẳn khỏi log.
- Tương tự cho `be/apps/contract-service`, `farm-service` (có thể log `phone`, `displayName` nếu có).

**Acceptance:** `grep` không trả về case nào log nguyên text token/password.

---

# 8. Bảng theo dõi hoàn thành

Đánh dấu `[x]` khi hoàn tất:

## Critical
- [ ] **TASK-1** — Sửa `apis.md` cho khớp code
- [ ] **TASK-2** — Biểu đồ giá thực cho Guest (FR-G02)

## High
- [ ] **TASK-3** — Chuẩn hóa schema `forecastData` (FR-T12)
- [ ] **TASK-4** — UI audit-log hợp đồng (FR-T06 polish)
- [ ] **TASK-5** — Aggregate xu hướng nhu cầu thị trường (FR-T02)

## Medium
- [ ] **TASK-6** — Chuyển 5 file `react-router-dom` → `zmp-ui`
- [ ] **TASK-7** — Dọn `BuyerDigitalTwinMonitorScreen`
- [ ] **TASK-8** — UI sửa/xóa review thương lái

## Low (Validation)
- [ ] **TASK-9** — Đo bundle size + performance benchmark
- [ ] **TASK-10** — Verify không log PII

---

# 9. Phụ lục — Bằng chứng tra cứu nhanh

## Endpoint backend đã có nhưng FE có thể chưa dùng

| Endpoint | File controller | Ghi chú |
|----------|-----------------|---------|
| `GET /api/v1/contracts/linked-farms` | `contracts.controller.ts:64` | Có thể dành cho aggregate; xác nhận có dùng không |
| `GET /api/v1/contracts/internal/farms/:farmId/active-compliance` | `internal-contracts.controller.ts` | **Internal API** — không gọi từ FE (OK) |
| `PATCH /api/v1/reviews/:id`, `DELETE /api/v1/reviews/:id` | `trader-reviews.controller.ts` | Verify UI có edit/delete (TASK-8) |

## FE feature đang mock dữ liệu (cần BE)

| FE component | Mock đang dùng | BE cần cung cấp |
|--------------|---------------|------------------|
| `GuestHomeMarketNewsScreen.tsx` — `priceData` 7 ngày | Hardcode trong file | `GET /api/v1/forecasts/price-trends` (TASK-2) |

## Convention violations còn lại

| Vi phạm | File | Mức độ |
|---------|------|--------|
| `react-router-dom` import | 5 file (xem TASK-6) | Low (chỉ dùng cho `useParams`/`useLocation`) |
| Schema `forecastData` không validate | `be/apps/notification-service/src/forecasts/**` | Medium (TASK-3) |

---

# 10. Map ngược FR → File hiện thực

> Bảng đối chiếu nhanh cho mục đích chấm điểm spec-compliance.

| FR | File FE chính | Endpoint BE chính |
|----|---------------|---------------------|
| FR-F01 | `farmer/profile/FarmerProfileScreen.tsx` | `farms.controller.ts` |
| FR-F02 | `farmer/trade/TraderSearchTab.tsx` | `GET /traders/search` + `POST /connections` |
| FR-F03 | `shared/connections/ConnectionRequestsScreen.tsx` | `POST /connections/:id/accept|reject` |
| FR-F04 | `farmer/trade/ContractsTab.tsx` | `GET /contracts` |
| FR-F05 | `shared/contract-change-requests/ContractChangeRequestsPanel.tsx` | `POST /contracts/:id/change-requests/:id/accept|reject` |
| FR-F06 | `farmer/garden/TimelineSection.tsx`, `StandardInfoModal.tsx` | `GET /standards/:id` |
| FR-F07 | `farmer/garden/IotDashboardSection.tsx` | `GET /monitoring/farms/:id/latest` + WS |
| FR-F08 | `farmer/alerts/FarmerAlertListScreen.tsx` | `GET /monitoring/farms/:id/alerts` |
| FR-F09 | `farmer/garden/QuickUpdateSheet.tsx` + `careLogOfflineQueue.ts` | `POST /farms/:id/care-logs` + `/care-logs/sync` |
| FR-T01 | `trader/profile-news/TraderProfileNewsScreen.tsx` | `GET|PUT /auth/me` |
| FR-T02 | `trader/dashboard/TraderDashboardScreen.tsx` | `GET /dashboard/trader` **(thiếu market-trends — TASK-5)** |
| FR-T03 | `trader/marketplace-feed/MarketplaceFeedPanel.tsx` | `POST /products`, `POST /buying-requests` |
| FR-T04 | `trader/marketplace-feed/MarketplaceFeedPanel.tsx` | `POST /proposals` |
| FR-T05 | `trader/trading-orders/TraderTradingOrdersScreen.tsx` | `POST /orders/:id/accept|reject` |
| FR-T06 | `trader/transactions/components/ContractDetailModal.tsx` | `GET /contracts/:id/audit-logs` **(thiếu UI — TASK-4)** |
| FR-T07 | `trader/supply-monitor/TraderSupplyMonitorScreen.tsx` | `GET /farmers/search` |
| FR-T08 | `trader/farmer-flow/FarmerFlowPanel.tsx` | `POST /connections/:id/accept|reject` |
| FR-T09 | `trader/farmer-flow/CreateFarmerContractModal.tsx` | `POST /contracts/:id/change-requests` |
| FR-T10 | `trader/standard-library/TraderStandardLibraryScreen.tsx` | CRUD `/standards` |
| FR-T11 | `trader/farm-monitoring/TraderFarmMonitoringScreen.tsx`, `FarmTrafficLightCard.tsx` | `GET /contracts/:id/compliance` |
| FR-T12 | `trader/profile-news/TraderProfileNewsScreen.tsx` | `POST /news` + `POST /forecasts` **(thiếu schema — TASK-3)** |
| FR-U01 | `buyer/marketplace/BuyerMarketplaceScreen.tsx` | `GET /products` + `POST /orders` |
| FR-U02 | `buyer/post-buying-request/CreateBuyingRequestStepper.tsx` | `POST /buying-requests` |
| FR-U03 | `buyer/sourcing-inbox/SourcingInboxPanel.tsx` | `POST /proposals/:id/accept|reject` |
| FR-U04 | `buyer/orders/BuyerOrdersScreen.tsx` | change-requests |
| FR-U05 | `buyer/live-monitor/BuyerLiveMonitorScreen.tsx` | `GET /monitoring/farms/:id/latest` |
| FR-U06 | `buyer/transaction-history/BuyerTransactionHistoryScreen.tsx` | `GET /orders` + `GET /contracts` |
| FR-G01 | `shared/traceability/TraceabilityScreen.tsx` | `GET /traceability/qr/:code` (public) |
| FR-G02 | `guest/home-market-news/GuestHomeMarketNewsScreen.tsx` | `GET /news` + `GET /forecasts` **(biểu đồ giá mock — TASK-2)** |
| FR-G03 | `guest/home-market-news/GuestHomeMarketNewsScreen.tsx`, `guest/product-detail/GuestProductDetailScreen.tsx` | `GET /products` (public) |
| FR-S01 | `LoginScreen.tsx`, `RoleGuard.tsx`, `authService.ts` | `POST /auth/login` + `/verify` + JWT/Redis |
