# Hướng dẫn: Denormalize displayName và farmName vào các Service

## Bối cảnh kỹ thuật (đọc trước khi làm)

- **TypeORM `synchronize: true`** đang bật ở tất cả service trong môi trường dev → **không cần viết migration**. Chỉ cần thêm field vào entity class, service tự sync DB khi restart.
- **`@nestjs/axios` chưa cài** → dùng **native `fetch()`** (Node 20 global, không cần install thêm gì).
- **Auth endpoint** `GET /api/v1/auth/users/:userId` đã `@Public()` → gọi trực tiếp, không cần token.
- **Farm endpoint** `GET /api/v1/farms/:id` **yêu cầu JWT** → cần thêm `@Public()` vào endpoint đó trước.

---

## Quyết định thiết kế

| Vấn đề | Quyết định |
|--------|-----------|
| Stale data (user đổi tên sau khi tạo entity) | Chấp nhận — không xử lý trong scope này |
| Cross-service call thất bại | Graceful: lưu `null`, không reject request tạo entity |
| Cột mới | Tất cả `nullable: true` — entity cũ có null là bình thường, frontend fallback về label ID |
| Backfill data cũ | Không cần — dev data thưa, null là chấp nhận được |

---

## Phạm vi: Cột cần thêm vào từng entity

### Contract Service

| Entity (bảng) | Cột mới |
|---------------|---------|
| `contracts` | `partyFarmerName`, `partyTraderName`, `partyBuyerName`, `farmName` |
| `connections` | `fromUserName`, `toUserName`, `farmName` |
| `orders` | `buyerDisplayName`, `traderDisplayName` |
| `products` | `traderDisplayName`, `farmName` |
| `proposals` | `traderDisplayName`, `farmName` |
| `buying_requests` | `buyerDisplayName` |
| `trader_reviews` | `traderDisplayName`, `buyerDisplayName` |
| `contract_audit_logs` | `actorDisplayName` |
| `contract_change_requests` | `requestedByName`, `respondedByName` |

### Farm Service

| Entity (bảng) | Cột mới |
|---------------|---------|
| `farms` | `ownerDisplayName` |
| `care_logs` | `performedByName` |
| `standards` | `ownerTraderName` |

### Monitoring Service

| Entity (bảng) | Cột mới |
|---------------|---------|
| `alerts` | `farmName`, `acknowledgedByName` |
| `iot_devices` | `farmName` |
| `sensor_devices` | `farmName` |

### Notification Service

| Entity (bảng) | Cột mới |
|---------------|---------|
| `forecasts` | `traderDisplayName` |
| `news_articles` | `traderDisplayName` |

---

## Thứ tự thực hiện

```
Bước 1 → Mở public farm endpoint
Bước 2 → Tạo AuthClientService và FarmClientService
Bước 3 → Cập nhật Entity classes (TypeORM tự sync DB)
Bước 4 → Cập nhật Shared DTOs + rebuild
Bước 5 → Cập nhật Service create/update methods
Bước 6 → Cập nhật Response builders (toDto)
Bước 7 → Cập nhật Frontend
```

---

## Bước 1 — Mở public farm endpoint

File: `be/apps/farm-service/src/farms/farms.controller.ts`

Tìm handler `GET /api/v1/farms/:id` và thêm decorator `@Public()` vào (import từ `@trustagri/shared`).

Mục đích: để các service khác gọi lấy farm name mà không cần JWT. Farm name không phải thông tin nhạy cảm.

---

## Bước 2 — Tạo HTTP client services

Tạo 2 file dùng chung ở **mỗi service** cần (contract-service, monitoring-service, notification-service, farm-service):

### `src/clients/auth-client.service.ts`

- Class `AuthClientService`, decorator `@Injectable()`
- Inject `ConfigService` để đọc `AUTH_SERVICE_URL` (default: `http://localhost:3001`)
- Method `getUserDisplayName(userId: string): Promise<string | null>`:
  - Gọi `fetch(`${AUTH_SERVICE_URL}/api/v1/auth/users/${userId}`)`
  - Parse JSON, trả về `data.displayName`
  - Bọc toàn bộ trong `try/catch`, khi lỗi trả về `null` (không throw)
  - Set `signal: AbortSignal.timeout(3000)` để giới hạn 3 giây

### `src/clients/farm-client.service.ts`

- Class `FarmClientService`, decorator `@Injectable()`
- Inject `ConfigService` để đọc `FARM_SERVICE_URL` (default: `http://localhost:3002`)
- Method `getFarmName(farmId: string): Promise<string | null>`:
  - Gọi `fetch(`${FARM_SERVICE_URL}/api/v1/farms/${farmId}`)`
  - Parse JSON, trả về `data.name`
  - Bọc trong `try/catch`, khi lỗi trả về `null`
  - Set timeout 3 giây

### Đăng ký vào module

Trong `app.module.ts` (hoặc từng domain module nếu dùng scoped), thêm `AuthClientService` và `FarmClientService` vào `providers`. Không cần import `HttpModule`.

### Thêm env vars

Vào file `.env` của từng service thêm:
```
AUTH_SERVICE_URL=http://localhost:3001
FARM_SERVICE_URL=http://localhost:3002
```

---

## Bước 3 — Cập nhật Entity classes

Với mỗi entity trong danh sách phạm vi, thêm các TypeORM column mới. Tất cả `nullable: true`, type `varchar`.

**Ví dụ cho `contract.entity.ts`:**
```typescript
@Column({ name: 'party_farmer_name', type: 'varchar', nullable: true })
partyFarmerName: string | null;

@Column({ name: 'party_trader_name', type: 'varchar', nullable: true })
partyTraderName: string | null;

@Column({ name: 'party_buyer_name', type: 'varchar', nullable: true })
partyBuyerName: string | null;

@Column({ name: 'farm_name', type: 'varchar', nullable: true })
farmName: string | null;
```

Làm tương tự cho tất cả entity theo bảng phạm vi ở trên.

Sau khi sửa entity, **restart service** → TypeORM tự động `ALTER TABLE ... ADD COLUMN`.

---

## Bước 4 — Cập nhật Shared DTOs

File: `be/libs/shared/src/dto/`

Thêm optional field vào từng DTO:

**`contract.dto.ts`:**
- `ContractDto`: thêm `partyFarmerName?: string | null`, `partyTraderName?: string | null`, `partyBuyerName?: string | null`, `farmName?: string | null`
- `ConnectionDto`: thêm `fromUserName?: string | null`, `toUserName?: string | null`, `farmName?: string | null`
- `OrderDto`: thêm `buyerDisplayName?: string | null`, `traderDisplayName?: string | null`
- `ProductDto`: thêm `traderDisplayName?: string | null`, `farmName?: string | null`
- `ProposalDto`: thêm `traderDisplayName?: string | null`, `farmName?: string | null`
- `BuyingRequestDto`: thêm `buyerDisplayName?: string | null`
- `TraderReviewDto`: thêm `traderDisplayName?: string | null`, `buyerDisplayName?: string | null`
- `ContractAuditLogDto`: thêm `actorDisplayName?: string | null`
- `ContractChangeRequestDto`: thêm `requestedByName?: string | null`, `respondedByName?: string | null`

**`farm.dto.ts`:**
- `FarmDto`: thêm `ownerDisplayName?: string | null`
- `CareLogDto`: thêm `performedByName?: string | null`
- `StandardDto`: thêm `ownerTraderName?: string | null`

**`monitoring.dto.ts`** (hoặc file DTO tương ứng trong monitoring-service):
- `AlertDto`: thêm `farmName?: string | null`, `acknowledgedByName?: string | null`
- `IotDeviceDto`: thêm `farmName?: string | null`

Sau khi sửa, rebuild shared lib:
```
npm run build -w @trustagri/shared
```

---

## Bước 5 — Cập nhật Service create/update methods

Đây là bước core. Với mỗi method `create()` trong service:

**Nguyên tắc:**
1. Inject `AuthClientService` và/hoặc `FarmClientService` vào constructor của domain service
2. Sau khi validate input, gọi các client **song song** bằng `Promise.allSettled()`
3. Extract kết quả từ settled promises (chỉ lấy khi `status === 'fulfilled'`)
4. Gán vào entity trước khi `save()`

**Mapping cần làm theo service:**

`ContractsService.create()`:
- Gọi `authClient.getUserDisplayName(partyFarmerId)` → `partyFarmerName`
- Gọi `authClient.getUserDisplayName(partyTraderId)` → `partyTraderName`
- Gọi `authClient.getUserDisplayName(partyBuyerId)` nếu có → `partyBuyerName`
- Gọi `farmClient.getFarmName(farmId)` nếu có → `farmName`

`ConnectionsService.create()`:
- Gọi `authClient.getUserDisplayName(fromUserId)` → `fromUserName`
- Gọi `authClient.getUserDisplayName(toUserId)` → `toUserName`
- Gọi `farmClient.getFarmName(farmId)` nếu có → `farmName`

`OrdersService.create()`:
- Gọi `authClient.getUserDisplayName(buyerId)` → `buyerDisplayName`
- Gọi `authClient.getUserDisplayName(traderId)` → `traderDisplayName`

`OrdersService.accept()` (khi trader accept order để tạo contract):
- Contract tự động tạo ở đây — đảm bảo contract entity cũng được gán names

`ProductsService.create()`:
- Gọi `authClient.getUserDisplayName(traderId)` → `traderDisplayName`
- Gọi `farmClient.getFarmName(farmId)` nếu có → `farmName`

`ProposalsService.create()`:
- Gọi `authClient.getUserDisplayName(traderId)` → `traderDisplayName`
- Gọi `farmClient.getFarmName(farmId)` nếu có → `farmName`

`BuyingRequestsService.create()`:
- Gọi `authClient.getUserDisplayName(buyerId)` → `buyerDisplayName`

`TraderReviewsService.create()`:
- Gọi `authClient.getUserDisplayName(traderId)` → `traderDisplayName`
- Gọi `authClient.getUserDisplayName(buyerId)` → `buyerDisplayName`

`AlertsService.create()`:
- Gọi `farmClient.getFarmName(farmId)` → `farmName`

`AlertsService.acknowledge()`:
- Gọi `authClient.getUserDisplayName(userId)` → `acknowledgedByName`

`IotDevicesService.create()` và `SensorDevicesService.create()`:
- Gọi `farmClient.getFarmName(farmId)` → `farmName`

`FarmsService.create()`:
- Gọi `authClient.getUserDisplayName(ownerId)` → `ownerDisplayName`

`CareLogsService.create()`:
- Gọi `authClient.getUserDisplayName(performedBy)` → `performedByName`

`StandardsService.create()`:
- Gọi `authClient.getUserDisplayName(ownerTraderId)` → `ownerTraderName`

`ForecastsService.create()` và `NewsArticlesService.create()`:
- Gọi `authClient.getUserDisplayName(traderId)` → `traderDisplayName`

`ContractAuditLogService` (khi ghi log):
- Gọi `authClient.getUserDisplayName(actorUserId)` → `actorDisplayName`

`ContractChangeRequestsService.create()` và `.respond()`:
- Gọi `authClient` cho `requestedBy` / `respondedBy` → `requestedByName` / `respondedByName`

---

## Bước 6 — Cập nhật Response builders (toDto)

Tìm các hàm `toDto()`, `mapToDto()`, hoặc object literal return trong mỗi service. Thêm các field mới vào response — chỉ map từ entity, không gọi thêm HTTP:

```typescript
// Ví dụ ContractsService.toDto(entity)
return {
  ...existingFields,
  partyFarmerName: entity.partyFarmerName ?? null,
  partyTraderName: entity.partyTraderName ?? null,
  partyBuyerName: entity.partyBuyerName ?? null,
  farmName: entity.farmName ?? null,
};
```

Làm tương tự cho tất cả service theo danh sách phạm vi.

---

## Bước 7 — Cập nhật Frontend

### 7.1 Cập nhật DTO interfaces trong service files

**`fe/src/services/contractService.ts`** — `ContractDto`:
```typescript
partyFarmerName?: string | null;
partyTraderName?: string | null;
partyBuyerName?: string | null;
farmName?: string | null;
```

**`fe/src/services/connectionService.ts`** — `ConnectionDto`:
```typescript
fromUserName?: string | null;
toUserName?: string | null;
farmName?: string | null;
```

Làm tương tự cho `OrderDto`, `ProductDto`, `ProposalDto`, `BuyingRequestDto`, `TraderReviewDto`, và các DTO monitoring/farm tương ứng trong frontend service files.

### 7.2 Cập nhật hiển thị trong components

Pattern chung: **luôn fallback về label ID** nếu field mới là null. Không xóa các hàm helper hiện tại (`partyFarmerLabel`, `partyBuyerLabel`, ...).

Grep các pattern sau trong `fe/src/` để tìm chỗ cần sửa:

| Tìm pattern | Thay bằng |
|-------------|-----------|
| `partyFarmerLabel(contract.partyFarmerId)` | `contract.partyFarmerName ?? partyFarmerLabel(contract.partyFarmerId)` |
| `partyBuyerLabel(contract.partyBuyerId)` | `contract.partyBuyerName ?? partyBuyerLabel(contract.partyBuyerId)` |
| `Nông dân #${...slice(0,8)}` | `conn.fromUserName ?? conn.toUserName ?? \`Nông dân #${...slice(0,8)}\`` |
| `farmId.slice(0,8)` trong label | `farmName ?? \`Vườn #${farmId.slice(0,8)}\`` |
| `performedBy.slice(0,8)` | `performedByName ?? \`...\`` |

**Màn hình chính cần kiểm tra:**
- `fe/src/screens/trader/transactions/flows/FarmerFlowPanel.tsx` — `ContractInfoCard`
- `fe/src/screens/trader/transactions/components/ContractDetailModal.tsx`
- `fe/src/screens/trader/transactions/components/SelectConnectionModal.tsx`
- `fe/src/screens/trader/transactions/flows/BuyerFlowPanel.tsx`
- `fe/src/screens/farmer/` — các màn hiển thị contract và care log
- `fe/src/screens/buyer/` — các màn order và contract

---

## Lưu ý quan trọng

1. **Không cần migration, không cần install package mới** — chỉ sửa entity class rồi restart.
2. **`Promise.allSettled`** thay vì `Promise.all` trong create methods — nếu 1 call lỗi, entity vẫn tạo thành công với field null.
3. **Không gọi HTTP trong list endpoints** — denorm đã lưu trong DB, chỉ SELECT là đủ. Tuyệt đối không gọi N HTTP calls để enrich list.
4. **Rebuild shared lib** mỗi khi sửa `be/libs/shared/src/dto/`:
   ```
   npm run build -w @trustagri/shared
   ```
5. **Farm endpoint** phải được thêm `@Public()` trước khi chạy (Bước 1) — nếu quên, `FarmClientService` sẽ nhận 401 và trả về null cho tất cả farm names.
