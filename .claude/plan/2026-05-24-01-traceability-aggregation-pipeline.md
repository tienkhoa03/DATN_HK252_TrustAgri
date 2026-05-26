# Plan: Traceability Aggregation Pipeline (4 layers)

**Created:** 2026-05-24
**Status:** done
**Owner:** tienkhoa03@gmail.com
**Related:** FR-G01, US-G01, FR-F09, FR-T11, FR-T10, FR-F06, NFR-A01, NFR-R03, NFR-U03

---

## 1. Mục tiêu

Nâng cấp endpoint truy xuất nguồn gốc `GET /api/v1/traceability/:code` từ "trả 4 trường rời rạc" sang **pipeline tổng hợp 4 lớp** (Identity → Process Compliance → IoT Monitoring → Compliance Verification), đồng thời vá lỗ hổng **tính bất biến** của `care_logs` bằng bảng audit. Mục tiêu là biến trang quét QR thành **bằng chứng kiểm chứng được** rằng cây trồng đã được chăm sóc đúng chuẩn từ gieo hạt đến thu hoạch.

## 2. Scope

### In scope
- BE: extend `TraceabilityDto` + `TraceabilityService` (farm-service) để cộng thêm: identity mở rộng, đối chiếu chuẩn (deviation + late), snapshot môi trường từ Redis, thẻ "Compliance Certificate" (đọc/snapshot từ contract-service).
- BE: bảng mới `care_audit_logs` + trigger/hook ghi sử a/sửa/xoá care_log; trả về cờ `isEdited` trên timeline truy xuất.
- BE: endpoint nội bộ trên monitoring-service trả `currentEnvironment` (Redis snapshot) cho farm-service gọi không cần JWT (X-Internal secret).
- BE: endpoint nội bộ trên contract-service đọc `compliance:v1:{contractId}` (READ-ONLY, không tính lại) cho farm-service gọi để hiển thị thẻ chứng nhận trên trang public.
- FE: refactor `TraceabilityScreen` thêm 4 section tương ứng + cảnh báo trực quan (badge "Lệch" / "Trễ" / "Đã sửa"), hiển thị evidences (thumbnail), thẻ "Chứng nhận tuân thủ hợp đồng".
- Shared DTO (`@trustagri/shared`): mở rộng `TraceabilityDto` (additive, không breaking).

### Out of scope
- Tính lại compliance cho contract bất kỳ ở public endpoint (chỉ đọc snapshot cache, nếu thiếu thì hiển thị "Chưa có chứng nhận").
- Hard immutability bằng blockchain / hash chain — bản này chỉ dùng audit table + chặn UPDATE field nhạy cảm ở service layer.
- Thay đổi cấu trúc compliance score (giữ nguyên thuật toán hiện tại trong `ComplianceService`).
- I18n cho ngôn ngữ ngoài tiếng Việt.

## 3. Tham chiếu

- `.claude/docs/requirements.md` §FR-G01, §FR-F09, §FR-T11, §NFR-A01.
- `.claude/docs/business-logic.md` §6 (Traceability & QR Code), §3 (Care Log), §4 (Monitoring), §8 (Standard Process & Compliance).
- `.claude/docs/architecture.md` §3.1, §3.2, §5.5 (Imputed sensor data).
- `.claude/docs/tech-stack.md` §PostgreSQL schemas, §Redis keys.
- `/specs/backend-api-specification/design.md` §4.3 (TraceabilityDto), §4.4.5 (ComplianceDto).
- Mã hiện hữu:
  - `be/apps/farm-service/src/traceability/traceability.service.ts`
  - `be/apps/farm-service/src/care-logs/{entities,service,controller}/*`
  - `be/apps/farm-service/src/standards/entities/standard-step.entity.ts`
  - `be/apps/contract-service/src/contracts/compliance.service.ts`
  - `be/apps/monitoring-service/src/sensors/services/redis-sensor.service.ts`
  - `be/libs/shared/src/dto/{farm,contract}.dto.ts`
  - `fe/src/screens/shared/traceability/TraceabilityScreen.tsx`

## 4. Thay đổi dự kiến

### 4.1. Lớp 1 — Identity Layer (mở rộng)

**Backend (farm-service):**
- `TraceabilityService.getByQrCode`: bổ sung vào `dto.farm`: `area`, `plantingDate`, `ownerDisplayName` (KHÔNG trả `ownerPhone` — PII, đã ẩn theo NFR-S01).
- Không thêm cột DB — dữ liệu đã có sẵn trong `farms`.

**Shared DTO (`farm.dto.ts`):**
```ts
farm: Pick<FarmDto, 'id' | 'name' | 'location' | 'cropType' | 'area' | 'plantingDate' | 'ownerDisplayName'>;
```

### 4.2. Lớp 2 — Process Compliance Layer (cốt lõi)

**Backend (farm-service `TraceabilityService`):**
- Query thêm `evidences` qua `relations: ['evidences', 'standardStep']` cho mỗi care_log.
- Nếu `farm.standardId` tồn tại: load toàn bộ `standard_steps` (sorted theo `order`).
- Tính cho từng care_log trong timeline:
  - `stepOrder` = step.order (nếu liên kết).
  - `expectedDayOffset` = cộng dồn `expected_duration_days` của các step trước + step hiện tại.
  - `actualDayOffset` = `(performedAt - plantingDate) / 86400000` (làm tròn ngày).
  - `isLate` = `actualDayOffset - expectedDayOffset > tolerance` (tolerance = 2 ngày, hằng số).
  - `deviation` đã có sẵn ở entity.
- Tính summary `process`:
  - `totalSteps`, `completedSteps` (step có ít nhất 1 care_log không deviation + không isLate).
  - `deviationCount` = số care_log có `deviation=true`.
  - `lateCount` = số care_log có `isLate=true`.
  - `coverageRatio` = completedSteps / totalSteps.
- Nếu farm KHÔNG có standard: trả `process: null` — FE render dạng "Quy trình tự do".

**Shared DTO mở rộng:**
```ts
careLogTimeline: Array<{
  id: string;
  action: string;
  standardStepTitle?: string;
  standardStepOrder?: number;
  performedAt: string;
  notes?: string;
  deviation: boolean;
  isLate: boolean;
  isEdited: boolean;          // ← từ Lớp 2b
  evidences: Array<Pick<EvidenceDto, 'fileUrl' | 'mimeType' | 'capturedAt'>>;
}>;
process?: {
  totalSteps: number;
  completedSteps: number;
  deviationCount: number;
  lateCount: number;
  coverageRatio: number;
  steps: Array<{ order: number; title: string; expectedDurationDays: number | null; completed: boolean }>;
};
```

**Frontend (`TraceabilityScreen`):**
- Section mới "🛡️ Đối chiếu quy trình chuẩn": progress bar `completedSteps / totalSteps`, đếm số lệch / số trễ.
- Mỗi `timelineEvent` thêm badge: 🟥 "Lệch quy trình", 🟧 "Trễ X ngày", 🟦 "Đã sửa" (Lớp 2b).
- Render thumbnail evidence (max 3 ảnh, click để xem full bằng `<Modal>` hoặc native viewer). Mime != image → icon file.

### 4.2b. Lớp 2 — Immutability sub-layer (bảng mới)

**Backend (farm-service):**
- DB migration mới `<timestamp>-care-audit-logs.ts` (TypeORM `synchronize:false` nên cần script SQL):
  ```sql
  CREATE TABLE care_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_log_id UUID NOT NULL,
    action VARCHAR(16) NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE')),
    changed_by VARCHAR(64),
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_care_audit_care_log_id ON care_audit_logs (care_log_id);
  CREATE INDEX idx_care_audit_changed_at ON care_audit_logs (changed_at);
  ```
- Entity `CareAuditLogEntity` (mới).
- Trong `CareLogsService.update / softDelete / create`: thêm `auditRepo.save({...})` cùng transaction (`@Transactional` hoặc dùng `QueryRunner`).
- `TraceabilityService`: với mỗi care_log, kiểm tra tồn tại bất kỳ audit `action='UPDATE'` → set `isEdited=true`.
- Cấm UPDATE các cột "đã đóng dấu": `action`, `performed_at`, `farm_id` — service throw `ConflictException` nếu cố sửa.
- Vẫn cho phép sửa `notes` (chưa đóng dấu) nhưng vẫn ghi audit.

**Frontend:** badge "Đã chỉnh sửa" hiển thị tooltip "Bản ghi đã sửa — thông tin gốc lưu trong sổ kiểm toán hệ thống".

### 4.3. Lớp 3 — IoT Monitoring Layer (Redis snapshot)

**Backend (monitoring-service — endpoint nội bộ mới):**
- `GET /api/v1/monitoring/internal/farms/:farmId/current-environment`
  - Bảo vệ bằng header `X-Traceability-Internal` so với env `TRACEABILITY_INTERNAL_SECRET` (đã dùng cho `sensor-chart`).
  - Đọc qua `RedisSensorService.getLatest(farmId)`.
  - Response:
    ```ts
    Array<{ sensorType: string; value: number; recordedAt: string; isImputed?: boolean }>
    ```
  - Nếu Redis miss tất cả → trả `[]` (FE sẽ ẩn card, KHÔNG hiện lỗi — NFR-A01 không yêu cầu fabricate cho public traceability).

**Backend (farm-service):**
- `TraceabilityService.fetchCurrentEnvironment(farmId)` gọi endpoint trên (giống `fetchSensorChart`). Timeout 5s, fallback `[]`.
- Append vào DTO: `currentEnvironment`.

**Frontend:** Section "🌡️ Môi trường hiện tại" (card grid 2 cột) **đặt phía trên** chart 7 ngày, cho cảm giác "tại đây — bây giờ". Hiển thị dấu chấm xám nếu `isImputed`.

### 4.4. Lớp 4 — Compliance Verification Layer

**Backend (contract-service — endpoint nội bộ mới):**
- `GET /api/v1/contracts/internal/farms/:farmId/active-compliance`
  - Bảo vệ bằng `X-Traceability-Internal` (cùng secret).
  - Tìm contract `status='active'` mới nhất gắn `farm_id=:farmId`. Nếu không có → 404.
  - Đọc `compliance:v1:{contractId}` từ Redis. Nếu cache hit → trả luôn. Nếu miss → trả `{status: 'pending'}` (KHÔNG tự gọi `ComplianceService.getCompliance` vì cần JWT user). Tuỳ chọn nâng cấp: spawn 1 job nội bộ tính lại (out of scope MVP).
- Trả về:
  ```ts
  {
    contractId: string;
    standardCode?: string;
    totalSteps?: number;
    completedSteps?: number;
    deviationCount?: number;
    complianceScore?: number;     // 0..1
    lastComputedAt?: string;
    status: 'verified' | 'pending' | 'none';
  }
  ```

**Backend (farm-service):**
- `TraceabilityService.fetchComplianceCertificate(farmId)` gọi endpoint trên. Append vào DTO: `complianceCertificate?`.

**Frontend:** Thẻ "🏅 Chứng nhận tuân thủ hợp đồng":
- `verified` → background xanh, hiển thị score %, completed/total steps, thời gian xác thực.
- `pending` → nền vàng, "Đang tính toán, vui lòng quay lại sau".
- `none` hoặc thiếu → ẩn section.

### 4.5. Shared & cấu hình
- Update `be/libs/shared/src/dto/farm.dto.ts` — additive, KHÔNG đổi tên trường hiện có.
- Update `be/libs/shared/src/index.ts` re-exports nếu thêm type mới.
- `npm run build` ở `be/libs/shared` trước khi dev BE/FE.
- Env mới (nếu chưa): `TRACEABILITY_INTERNAL_SECRET` ở cả 3 service (farm, monitoring, contract). Document trong `tech-stack.md` (sau khi merge).

### 4.6. Files mới / sửa (tóm tắt)

**BE (farm-service):**
- M `be/apps/farm-service/src/traceability/traceability.service.ts`
- M `be/apps/farm-service/src/traceability/traceability.module.ts` (import CareAuditLogEntity)
- N `be/apps/farm-service/src/care-logs/entities/care-audit-log.entity.ts`
- M `be/apps/farm-service/src/care-logs/care-logs.service.ts` (transactional audit)
- M `be/apps/farm-service/src/care-logs/care-logs.module.ts`
- N `be/apps/farm-service/migrations/<ts>-care-audit-logs.sql` (hoặc tạo migration runner nếu chưa có)
- N `be/apps/farm-service/src/traceability/internal-clients.ts` (gọi monitoring + contract)

**BE (monitoring-service):**
- M `be/apps/monitoring-service/src/sensors/sensors.controller.ts` (thêm internal route)
- M `be/apps/monitoring-service/src/sensors/sensors.module.ts`
- N `be/apps/monitoring-service/src/sensors/internal.guard.ts` (kiểm `X-Traceability-Internal`)

**BE (contract-service):**
- M `be/apps/contract-service/src/contracts/contracts.controller.ts` (thêm internal route)
- M `be/apps/contract-service/src/contracts/compliance.service.ts` (thêm method `getActiveComplianceForFarm`)
- N `be/apps/contract-service/src/contracts/internal.guard.ts`

**Shared:**
- M `be/libs/shared/src/dto/farm.dto.ts` (mở rộng `TraceabilityDto` + `CareLogTimelineItemDto`)
- M `be/libs/shared/src/dto/contract.dto.ts` (thêm `ComplianceCertificateDto` nếu cần re-shape)

**FE:**
- M `fe/src/services/traceabilityService.ts` (map field mới)
- M `fe/src/screens/shared/traceability/TraceabilityScreen.tsx` (4 section + badge)
- N `fe/src/screens/shared/traceability/ComplianceCertificateCard.tsx`
- N `fe/src/screens/shared/traceability/ProcessComplianceCard.tsx`
- N `fe/src/screens/shared/traceability/EnvironmentSnapshotCard.tsx`
- M `fe/src/screens/shared/traceability/index.ts` (barrel)

## 5. Acceptance criteria

- [ ] FR-G01: scan QR public (no-auth) trả về đầy đủ Identity + Process + IoT + Compliance Certificate.
- [ ] FR-F09 trace: mọi care_log có cờ `isEdited` chính xác (test: tạo log → sửa notes → assert `isEdited=true`).
- [ ] FR-T11: timeline đánh dấu đúng `deviation=true` và `isLate=true` so với `plantingDate + expectedDurationDays`.
- [ ] Care_log không cho UPDATE `action`, `performedAt`, `farmId` (test trả 409).
- [ ] Cache miss `compliance:v1:{contractId}` → endpoint trả `status='pending'` thay vì 500.
- [ ] NFR-A01: nếu `RedisSensorService.getLatest` rỗng, public traceability vẫn render đầy đủ các section khác, KHÔNG crash, KHÔNG hiện "lỗi".
- [ ] NFR-S01: response public KHÔNG chứa `ownerPhone`, `ownerId`, JWT, hoặc PII khác.
- [ ] NFR-U03: badge + thẻ chứng nhận đều ≥ 14px font, touch target ≥ 44×44 (CTA chứng nhận).
- [ ] FE bundle size không tăng > 50KB (NFR-C01).
- [ ] Test: unit cho `TraceabilityService` (4 nhánh: full data / missing standard / missing planting_date / Redis miss); integration test cho audit hook + immutable fields.

## 6. Bước thực hiện (cho /implementation-plan)

1. **Shared DTO** — mở rộng `TraceabilityDto` (additive); build `@trustagri/shared`.
2. **DB migration** — `care_audit_logs` table + entity.
3. **CareLogsService audit hook** — wrap create/update/softDelete trong transaction + audit insert. Chặn cập nhật cột đóng dấu.
4. **TraceabilityService — Identity & Process** — load evidences/steps, compute `isLate`, summary `process`, `isEdited` từ audit.
5. **monitoring-service internal endpoint** — `/internal/farms/:farmId/current-environment` + guard.
6. **TraceabilityService — IoT snapshot** — gọi internal endpoint, gắn `currentEnvironment`.
7. **contract-service internal endpoint** — `/internal/farms/:farmId/active-compliance` (read-only Redis), guard.
8. **TraceabilityService — Compliance card** — gọi và gắn `complianceCertificate`.
9. **FE TraceabilityScreen refactor** — 4 sub-component, badges, thumbnails evidence.
10. **Tests** — unit + integration (BE), Playwright snapshot (FE).
11. **Verify** — manual QR scan flow guest mode → đủ 4 lớp; thử farm thiếu standard / Redis empty / không contract → vẫn render.

## 7. Risks / Open questions

- **Quyền đọc `compliance:v1:*` từ farm-service:** cần thống nhất secret và document trong `tech-stack.md`. Nếu org muốn dùng mTLS thay vì shared secret thì plan này cần điều chỉnh.
- **Backfill audit cho care_logs đã có:** sẽ bỏ qua (cờ `isEdited=false` cho dữ liệu lịch sử). Cần xác nhận stakeholder chấp nhận.
- **`expected_duration_days` có thể null** → các step null không tham gia tính isLate.
- **Public không thấy thumbnail evidence khi `file_url` private** — cần policy: evidence được mark public khi farmer chọn "share QR". MVP: trả URL nguyên gốc, đánh dấu mở task riêng nếu cần tách public/private.
- **Cấm UPDATE action/performedAt** có thể phá UX hiện tại nếu FE đã cho phép sửa — cần audit trước.

## 8. Estimate

- **Effort:** M (4–6 ngày dev, 1 ngày test).
- **Order of execution:** BE first (1 → 8), parallel FE từ step 4 (DTO đã rõ).
