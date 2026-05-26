# Plan: Contract-Level Dynamic Traceability QR

**Created:** 2026-05-24
**Status:** done
**Owner:** tienkhoa03@gmail.com
**Related:** FR-G01, FR-F04, FR-F09, FR-T11, FR-U05, US-G01, US-U03, NFR-S01, NFR-A01, NFR-U03

---

## 1. Mục tiêu

Vá lỗ hổng "mã QR vườn cố định trộn dữ liệu nhiều mùa vụ" bằng cách bổ sung **mã QR cấp Hợp đồng (Contract/Lot QR)** song song với mã QR vườn hiện có. Khi người tiêu dùng quét mã trên bao bì thương phẩm, hệ thống dùng `contract_id` để khoanh vùng `start_date..end_date` và CHỈ trả về care_logs / sensorChart / chứng nhận tuân thủ thuộc đúng mùa vụ đó. Mã QR vườn (Farm QR) chuyển sang vai trò "cổng vườn" — quét vào sẽ tự động resolve sang hợp đồng đang active (Dynamic Traceability).

## 2. Scope

### In scope
- DB (contract-service): cột mới `contracts.traceability_code` UNIQUE, nullable; sinh khi contract chuyển `active` (cả `farmer_trader` lẫn `trader_buyer`). Prefix `LOT-` để phân biệt với `TR-` của vườn.
- BE (contract-service): internal endpoint cho farm-service: "resolve contract by trace code" + "resolve active contract by farm id" (đã có dạng riêng cho compliance — cần mở rộng để trả contract metadata, không chỉ compliance).
- BE (farm-service `TraceabilityService`): nâng cấp `findFarmByCode` để nhận **3 dạng code**: UUID farm, `TR-<...>` farm code, `LOT-<...>` contract code. Xác định "contract scope" → filter care_logs **strict theo `contract_id = X`** (Q3 hướng B — user sẽ backfill legacy `contract_id` thủ công sau). Khi quét Farm QR mà có `currentContractId` → tự resolve sang contract scope. Khi không có active contract → giữ chế độ "Farm Overview" cũ (toàn bộ care_logs).
- Shared DTO: bổ sung `TraceabilityDto.contract` (id, code, status, startDate, endDate, products gọn) + cờ `scope: 'contract' | 'farm-overview'`.
- FE (`TraceabilityScreen`): hiển thị banner "Lô hàng: LOT-xxxx · Mùa vụ T6/2026 – T9/2026" khi `scope='contract'`; ẩn / mở rộng các phần đã có theo nguồn dữ liệu. Khi `scope='farm-overview'` thì giữ nguyên UI cũ + ghi rõ "Vườn chưa có hợp đồng active — đang hiển thị tổng quan toàn vườn".
- FE (trader + farmer contract detail): nút "Xem mã QR truy xuất / Tải về" cho hợp đồng — hiển thị QR + chuỗi code + link `https://trustagri.vn/trace/<code>`. Reuse hộp QR đã có ở `farms/qr` nếu có (nếu chưa có, render bằng `qrcode.react` hoặc fallback `<img>` qrserver.com).
- Migration backfill: với mọi contract `status='active'` hiện hành chưa có code → sinh code và lưu (script idempotent).
- Tests: unit `TraceabilityService` (3 nhánh: LOT code, TR code có active contract, TR code không active contract); integration test quét LOT code → response chỉ chứa care_logs trong window.

### Out of scope
- Mint QR ở proposal / order — chỉ làm cho `contracts`. Order/proposal là pre-contract, chưa có "lô hàng cụ thể".
- Đổi format / xoá `farms.traceability_code` — tiếp tục giữ và backward-compatible.
- Rotate / revoke mã đã in (in lên bao bì là vĩnh viễn — nếu cần huỷ thì chỉ chuyển `contract.status` = `cancelled`, FE đánh badge).
- Tính lại / fabricate compliance certificate ngoài contract scope. Khi Farm QR fallback về `farm-overview` → KHÔNG render thẻ chứng nhận (vì không có contractId xác định).
- Blockchain / hash chain — vẫn chỉ DB + audit table (đã có ở plan 01).
- Public QR cho `trader_buyer` contracts (B2B mua đi bán lại): out of MVP — chỉ làm `farmer_trader` (thương phẩm bao tiêu) cho đồ án; entity vẫn có cột, nhưng sinh code có điều kiện `contractType='farmer_trader'`.

## 3. Tham chiếu

- `.claude/docs/requirements.md` §FR-G01, §FR-F04, §FR-T11, §FR-U05, §NFR-S01.
- `.claude/docs/business-logic.md` §5 (Contracts Lifecycle), §6 (Traceability & QR Code).
- `.claude/docs/architecture.md` §3 (Microservices), §5 (Cross-service).
- `.claude/docs/tech-stack.md` §PostgreSQL schemas (`contracts`, `farms`), §Redis keys (`compliance:v1:{contractId}`).
- `/specs/backend-api-specification/design.md` §4.3 (TraceabilityDto), §4.4.x (Contracts).
- Plan tiền nhiệm: `.claude/plan/2026-05-24-01-traceability-aggregation-pipeline.md` (đã giải quyết audit `isEdited`, internal endpoints, compliance certificate).
- Mã hiện hữu:
  - `be/apps/farm-service/src/traceability/traceability.service.ts` (`findFarmByCode`, `getByQrCode`).
  - `be/apps/farm-service/src/traceability/internal-clients.ts` (HTTP client tới contract + monitoring).
  - `be/apps/farm-service/src/farms/entities/farm.entity.ts` (`traceabilityCode`, `currentContractId`).
  - `be/apps/farm-service/src/care-logs/care-logs.service.ts` (đã stamp `contract_id` khi tạo log).
  - `be/apps/contract-service/src/contracts/entities/contract.entity.ts` (chưa có `traceabilityCode`).
  - `be/apps/contract-service/src/contracts/contracts.service.ts` (line ~580–648: khối "bothSigned" — chỗ trigger setCurrentContract).
  - `be/apps/contract-service/src/contracts/compliance.service.ts.getActiveComplianceForFarm` (mẫu để mở rộng resolve contract metadata).
  - `be/apps/contract-service/src/contracts/internal-contracts.controller.ts`.
  - `fe/src/screens/shared/traceability/TraceabilityScreen.tsx`.
  - `fe/src/services/traceabilityService.ts`.
  - `fe/src/router/routes.tsx` (routes `/trace`, `/trace/:code` — không cần đổi).

## 4. Thay đổi dự kiến

### 4.1. DB migration (contract-service)

File mới: `be/apps/contract-service/migrations/<ts>-contract-traceability-code.sql`

```sql
ALTER TABLE contracts
  ADD COLUMN traceability_code VARCHAR(32) UNIQUE;

CREATE INDEX idx_contracts_traceability_code ON contracts(traceability_code);

-- Backfill: với mọi contract đã active hoặc completed, sinh code idempotent.
UPDATE contracts
SET traceability_code = 'LOT-' || REPLACE(SUBSTRING(id::text, 1, 12), '-', '')
WHERE traceability_code IS NULL
  AND contract_type = 'farmer_trader'
  AND status IN ('active','pending_change','in_settlement','completed');
```

Cập nhật `ContractEntity`:
```ts
@Index('idx_contracts_traceability_code')
@Column({ name: 'traceability_code', type: 'varchar', length: 32, nullable: true, unique: true })
traceabilityCode: string | null;
```

### 4.2. Sinh mã trong contract-service

**File sửa:** `be/apps/contract-service/src/contracts/contracts.service.ts` (khối `bothSigned`, sau `entity.status = 'active'`).

```ts
if (bothSigned && entity.contractType === 'farmer_trader' && !entity.traceabilityCode) {
  entity.traceabilityCode = `LOT-${entity.id.replace(/-/g, '').slice(0, 12)}`;
}
```

Lưu cùng `contractRepo.save(entity)` đang có. Idempotent: nếu đã có → bỏ qua.

### 4.3. Internal endpoint (contract-service) — resolve contract by code & by farm

**File sửa:** `be/apps/contract-service/src/contracts/internal-contracts.controller.ts`
- `GET /contracts/internal/by-trace-code/:code` → trả `InternalContractRefDto`.
- `GET /contracts/internal/farms/:farmId/active-contract` → trả `InternalContractRefDto` của contract `farmer_trader` `status='active'` mới nhất (tách khỏi `getActiveComplianceForFarm` để không nhập nhằng).

`InternalContractRefDto` (shared, thêm vào `contract.dto.ts`):
```ts
export interface InternalContractRefDto {
  id: string;
  traceabilityCode: string | null;
  contractType: 'farmer_trader' | 'trader_buyer';
  status: ContractStatus;
  farmId: string | null;
  standardId: string | null;
  standardName: string | null;
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  plantingDate: string | null;
  productName: string | null;
  quantity: number;
  unit: string;
}
```

**File sửa:** `compliance.service.ts` — tách method mới `getContractRefByCode(code)` và `getActiveContractRefForFarm(farmId)` chỉ trả metadata (KHÔNG đụng Redis compliance). Giữ `getActiveComplianceForFarm` nguyên trạng cho luồng cũ.

Cả 2 endpoint dùng `TraceabilityInternalGuard` đã có (`X-Traceability-Internal`).

### 4.4. Farm-service `TraceabilityService` — Dynamic Resolution

**File sửa:** `be/apps/farm-service/src/traceability/traceability.service.ts`.

Thuật toán mới:

```
input: code (string)

1. Phân loại code:
   - regex /^LOT-/        → mode = 'contract'
   - regex /^TR-/         → mode = 'farm'
   - UUID                 → mode = 'farm' (fallback)
   - else                 → 404

2. Resolve contract scope:
   if mode === 'contract':
     contract = internal call: GET /contracts/internal/by-trace-code/:code
     if !contract or !contract.farmId → 404
     farm = farmRepo.findOne(id=contract.farmId, withDeleted:true)
     scope = 'contract'

   else (mode === 'farm'):
     farm = findFarmByCode(code)  // logic cũ (UUID + TR- + withDeleted)
     if farm.currentContractId:
       contract = internal call: GET /contracts/internal/farms/:farmId/active-contract
       scope = contract ? 'contract' : 'farm-overview'
     else
       contract = null
       scope = 'farm-overview'

3. Load care_logs:
   if scope === 'contract':
     careLogRepo.find({
       where: {
         farmId: farm.id,
         contractId: contract.id,   // Q3 hướng B — strict filter
       },
       relations: ['evidences', 'standardStep'],
       order: { performedAt: 'ASC' },
       take: 500,
     });
     standardId = contract.standardId ?? farm.standardId
   else
     // giữ logic cũ — toàn bộ care_logs farm
     standardId = farm.standardId

4. Compliance certificate:
   if scope === 'contract' && contract.id:
     gọi internal endpoint hiện có (`/contracts/internal/farms/:farmId/active-compliance`) NHƯNG
     mở rộng thêm `/contracts/internal/:contractId/compliance` (READ-ONLY) — vì với LOT code, contract có thể không còn 'active' (mùa vụ đã kết thúc) → endpoint `farms/:farmId/active-compliance` sẽ 404.
   else
     undefined (ẩn thẻ chứng nhận)

5. sensorChart, currentEnvironment:
   - sensorChart: nếu scope === 'contract' → đổi `from/to` thành contract window (capped tại 90 ngày để bảo vệ InfluxDB). Nếu scope === 'farm-overview' → giữ 7 ngày gần nhất.
   - currentEnvironment: chỉ render khi scope === 'farm-overview' (vì "hiện tại" không hợp lý cho mùa vụ đã đóng). Nếu scope === 'contract' nhưng status === 'active' → vẫn render.

6. Build DTO + return.
```

Tham khảo thêm: `compliance.service.ts.filterLogsByContractWindow` đã có công thức quy đổi `startDate/endDate` → ms — copy y nguyên (range inclusive UTC).

### 4.5. Shared DTO mở rộng

**File sửa:** `be/libs/shared/src/dto/farm.dto.ts` — additive.

```ts
export interface TraceabilityContractContextDto {
  id: string;
  traceabilityCode: string;       // LOT-xxxx
  status: 'pending_signature' | 'active' | 'pending_change' | 'in_settlement' | 'completed' | 'cancelled';
  startDate: string;              // YYYY-MM-DD
  endDate: string;                // YYYY-MM-DD
  plantingDate?: string | null;
  standardName?: string | null;
  productName?: string | null;
  quantity?: number;
  unit?: string;
}

export interface TraceabilityDto {
  // ... fields cũ
  scope: 'contract' | 'farm-overview';
  contract?: TraceabilityContractContextDto;
}
```

Lưu ý: `productCode` (đang là echo input code) giữ nguyên — khi quét LOT thì productCode = LOT-xxx, khi quét TR thì productCode = TR-xxx.

**File sửa:** `be/libs/shared/src/dto/contract.dto.ts` — thêm `InternalContractRefDto` (interface, no class-validator vì internal-only).

`be/libs/shared` cần `npm run build` trước khi cả 2 service consume.

### 4.6. Frontend — `TraceabilityScreen` & service

**`fe/src/services/traceabilityService.ts`:** map field mới (`scope`, `contract`) vào `TraceabilityDto` re-export.

**`fe/src/screens/shared/traceability/TraceabilityScreen.tsx`:**
- Thêm banner phía dưới "Hero" và trên "Identity":
  - `scope === 'contract' && contract.status === 'cancelled'`: banner ĐỎ "⚠️ Hợp đồng đã huỷ — dữ liệu chỉ mang tính lịch sử, không còn hiệu lực thương mại." (Q1).
  - `scope === 'contract'` (các status khác): card xanh lá nền nhạt, "📦 Lô hàng LOT-xxxx · Mùa vụ {startDate}–{endDate} · {productName} {quantity} {unit}" + badge `status` (active / completed / in_settlement / pending_change).
  - `scope === 'farm-overview' && !contract`: banner vàng cảnh báo "Vườn này chưa có hợp đồng đang hiệu lực — đang hiển thị tổng quan toàn vườn (dữ liệu có thể đến từ nhiều mùa vụ trước đó)."
- Card "Tiêu chuẩn & chứng nhận": ưu tiên `contract.standardName` khi có (nguồn từ hợp đồng — chính xác hơn `data.standard.name` lấy từ farm).
- `ComplianceCertificateCard`: chỉ render khi `scope === 'contract'`.
- `EnvironmentSnapshotCard`: chỉ render khi scope farm-overview hoặc contract status='active'. Khi contract đã `completed` → ẩn (đã viết ở mục 4.4 step 5).
- Sensor chart description: cập nhật text "Dữ liệu trong khoảng hợp đồng từ {startDate} đến {endDate}" khi scope='contract'.

**Component mới `ContractContextBanner.tsx`** (`fe/src/screens/shared/traceability/`): nhận `contract` + `scope`, render banner. Dùng tokens `colors.semantic.success` / `colors.semantic.warning` (KHÔNG hardcode).

**Trader / Farmer contract detail:** thêm nút "🏷️ Mã QR lô hàng" mở modal hiển thị:
- QR code (dùng `qrcode.react` — verify đã có trong deps; nếu chưa, fallback `<img src="https://api.qrserver.com/v1/create-qr-code/?data=...">` *(KHÔNG fallback ra ngoài hệ thống nếu policy không cho — confirm ở Risks)*.
- Chuỗi `traceabilityCode` + nút Copy.
- Hướng dẫn "In dán lên bao bì lô hàng".
File mới: `fe/src/screens/shared/contracts/ContractQrCodeModal.tsx`. Inject vào trader contract detail screen + farmer contract detail screen (PascalCase paths).

### 4.7. Files mới / sửa (tóm tắt)

**BE (contract-service):**
- N `be/apps/contract-service/migrations/<ts>-contract-traceability-code.sql`
- M `be/apps/contract-service/src/contracts/entities/contract.entity.ts` (column `traceabilityCode`)
- M `be/apps/contract-service/src/contracts/contracts.service.ts` (sinh code khi `bothSigned`)
- M `be/apps/contract-service/src/contracts/internal-contracts.controller.ts` (+2 endpoints)
- M `be/apps/contract-service/src/contracts/compliance.service.ts` (+ 2 method `getContractRefByCode`, `getActiveContractRefForFarm`)
- M `be/apps/contract-service/src/contracts/contracts.module.ts` (nếu cần inject thêm dependency)

**BE (farm-service):**
- M `be/apps/farm-service/src/traceability/traceability.service.ts` (dynamic resolution, contract-window filter)
- M `be/apps/farm-service/src/traceability/internal-clients.ts` (thêm `fetchContractByCode`, `fetchActiveContractForFarm`, mở rộng `fetchComplianceCertificate` nhận `contractId` thay vì `farmId` để xử lý completed contract)

**BE (shared):**
- M `be/libs/shared/src/dto/farm.dto.ts` (+ `TraceabilityContractContextDto`, mở rộng `TraceabilityDto`)
- M `be/libs/shared/src/dto/contract.dto.ts` (+ `InternalContractRefDto`)

**FE:**
- M `fe/src/services/traceabilityService.ts` (map field mới)
- M `fe/src/screens/shared/traceability/TraceabilityScreen.tsx` (banner + conditional rendering)
- N `fe/src/screens/shared/traceability/ContractContextBanner.tsx`
- M `fe/src/screens/shared/traceability/index.ts` (barrel)
- N `fe/src/screens/shared/contracts/ContractQrCodeModal.tsx`
- M trader contract detail screen + farmer contract detail screen (tìm screen hiện có; nếu chưa có nút QR thì thêm)

**Tests:**
- N `be/apps/contract-service/src/contracts/contracts.service.qr-mint.spec.ts` (sinh code khi `bothSigned`, idempotent).
- M `be/apps/farm-service/src/traceability/traceability.service.spec.ts` (3 nhánh: LOT code, TR có active contract, TR không có active contract).
- N `be/integration-tests/test/traceability-contract-qr.e2e-spec.ts` (end-to-end: tạo contract → activate → fetch LOT code → assert care_logs filter đúng window).

### 4.8. Cấu hình & env
- Không thêm env mới — tái dùng `TRACEABILITY_INTERNAL_SECRET` đã có ở cả 3 service.
- Document field mới trong `tech-stack.md` khi merge (sau implementation).

## 5. Acceptance criteria

- [ ] FR-G01: scan `LOT-<code>` (public, no-auth) → trả `scope='contract'` + chỉ care_logs trong window contract.
- [ ] FR-G01 (Farm QR): scan `TR-<code>` của farm CÓ active contract → tự resolve, `scope='contract'`, hiển thị banner "Lô hàng …".
- [ ] FR-G01 (Farm QR fallback): scan `TR-<code>` của farm KHÔNG có active contract → `scope='farm-overview'`, banner cảnh báo, ẨN thẻ chứng nhận.
- [ ] FR-F04 / FR-T09: khi contract `farmer_trader` chuyển sang `active` (`bothSigned`) → `traceability_code` được sinh, UNIQUE constraint giữ vững.
- [ ] FR-U05: buyer của contract truy cập `/trace/LOT-xxx` → thấy đúng dữ liệu mùa vụ mình đặt cọc.
- [ ] FR-T11: timeline trong scope='contract' chỉ chứa care_logs có `contract_id` khớp đúng contract (test: tạo 1 contract C1, log 1 care stamp C1 + 1 care stamp NULL + 1 care stamp C2 → API chỉ trả log của C1).
- [ ] Q1 — Contract `cancelled`: scan LOT- của contract đã huỷ vẫn trả 200 + banner đỏ; KHÔNG 404, KHÔNG ẩn dữ liệu lịch sử.
- [ ] Compliance certificate fetch theo `contract.id` thay vì `farm.id` khi scope='contract' → contract đã `completed` vẫn lấy được cache (test).
- [ ] NFR-S01: response public KHÔNG chứa PII (`partyFarmerPhone`, `partyBuyerPhone`, ownerId).
- [ ] NFR-A01: nếu monitoring service trả [], `EnvironmentSnapshotCard` ẩn — KHÔNG hiện "lỗi".
- [ ] NFR-U03: banner `ContractContextBanner` font ≥ 14px, touch target nút QR ≥ 44×44.
- [ ] Backward-compat: scan UUID farm hoặc `TR-` cũ vẫn hoạt động — không break integration test `traceability-public.spec.ts` đã có.
- [ ] Idempotent: chạy lại migration backfill 2 lần không sinh duplicate / không lỗi UNIQUE.

## 6. Bước thực hiện (cho /implementation-plan)

1. **Shared DTO** — thêm `InternalContractRefDto`, `TraceabilityContractContextDto`, mở rộng `TraceabilityDto.scope/contract`. `npm run build` ở `be/libs/shared`.
2. **Contract entity + migration** — thêm column `traceability_code`, viết SQL backfill cho contract `farmer_trader` đang `active`/`completed`.
3. **Mint code khi `bothSigned`** — sửa `ContractsService.signContract` (block sau `entity.status='active'`). Viết unit test idempotent.
4. **Internal endpoints contract-service** — `by-trace-code/:code` + `farms/:farmId/active-contract` (read-only metadata). Reuse `TraceabilityInternalGuard`.
5. **Mở rộng compliance fetch** — endpoint mới `/contracts/internal/:contractId/compliance` đọc Redis bằng contractId trực tiếp (tách khỏi farm). Cập nhật `fetchComplianceCertificate` ở farm-service nhận `contractId`.
6. **TraceabilityService dynamic resolution** — refactor `getByQrCode` theo thuật toán §4.4. Tách helper `resolveScope(code)` để dễ test.
7. **Care log window filter** — dùng TypeORM `Between` cho `performedAt`.
8. **FE service + DTO mapping** — map `scope`, `contract` từ response.
9. **FE TraceabilityScreen** — thêm `ContractContextBanner`, conditional render compliance / environment.
10. **FE ContractQrCodeModal** — install / verify `qrcode.react`; render QR + copy + hướng dẫn. Wire vào trader & farmer contract detail.
11. **Tests** — BE unit (mint, resolve, filter), integration end-to-end, FE Playwright snapshot trang `/trace/LOT-xxx`.
12. **Verify thủ công** — chạy `npm run dev` BE + FE, tạo 1 contract farmer_trader, ký 2 bên, quét QR LOT, verify đủ banner + timeline filtered.

## 7. Risks / Open questions

### Decisions (đã chốt với owner)
- **Q1 — Cancelled contract:** giữ QR, scan trả 200 + banner đỏ "Hợp đồng đã huỷ".
- **Q2 — Thời điểm mint `LOT-`:** ở `signContract` khi `bothSigned` (hướng B).
- **Q3 — Filter care_logs:** strict theo `care_logs.contract_id = contract.id` (hướng B). Owner sẽ làm sạch legacy `contract_id=NULL` trong DB sau khi merge — KHÔNG cần migration backfill trong scope plan này.

### Open
- **Library QR `qrcode.react`:** nếu chưa có trong `fe/package.json` cần thêm — kiểm tra bundle impact (≈ 15KB, OK theo NFR-C01). Fallback CDN qrserver.com bị chặn ở môi trường offline-first → KHÔNG nên dùng.
- **Trader_buyer contract:** đồ án scope là chuỗi farmer→trader→buyer; nếu buyer cũng cần QR riêng cho lô hàng họ nhận → out of MVP, ghi nhận để mở rộng.
- **`/trace/:code` route đã hỗ trợ string code** — không cần đổi router, nhưng cần verify deep link từ Zalo OA hoạt động với `LOT-` (encode `/` không có vấn đề; LOT- là plain ASCII).
- **Hợp đồng `pending_change`** (đang yêu cầu điều chỉnh): scan QR vẫn trả như `active` — banner vẫn xanh, status badge "đang yêu cầu điều chỉnh". Confirm OK.

## 8. Estimate

- **Effort:** M (3–4 ngày dev, 1 ngày test).
- **Order of execution:** BE first (1 → 7), FE từ step 8 song song (DTO contract đã rõ sau step 1).
