# Kế hoạch: Hoàn thiện tương tác Trader ↔ Buyer + Truy xuất Standard/Farm/CareLog theo Contract

> Trạng thái: done.
> Phạm vi: BE (`contract-service`, `farm-service`, `libs/shared`) + FE (`fe/src/screens/buyer`, `fe/src/screens/trader`, services liên quan).
> Mục tiêu: gắn mọi giao dịch trader↔buyer (product, proposal, contract `trader_buyer`) vào một contract `farmer_trader` gốc, để tự động suy ra `farm`, `standard`, `standardStep`, `careLog`, `evidence` mà buyer/trader có thể truy xuất; đồng thời thêm `contractId` vào `care_log` để truy xuất theo đúng vụ/hợp đồng.

---

## 1. Hiện trạng đã có (không cần làm lại)

### 1.1. Tương tác Trader ↔ Farmer (đã hoàn thành)
- `connections` (farmer ↔ trader) với CRUD + accept/reject + auto-mark `signed` khi cả hai bên ký contract `farmer_trader`.
- `contracts` type `farmer_trader`: tạo, ký 2 bên → `active`; khi `active` → `applyStandardToFarm` và `setPlantingDate` (đã có trong `contracts.service.ts` `sign()`).
- `farm-service` care-logs (CRUD, sync offline, evidence) ràng buộc với `farmId`, `standardStepId`.

### 1.2. Tương tác Trader ↔ Buyer hiện có
**BE (`contract-service`):**
- `buying-requests`: buyer CRUD nhu cầu mua (`BuyingRequestEntity`); trader xem list không lọc; buyer chỉ thấy của mình.
- `products`: trader đăng tin bán, **đã ràng buộc `farmId` phải thuộc contract `farmer_trader` active của trader** qua `ContractsService.assertTraderFarmLinked()`. Nhưng **không lưu `sourceContractId`**; `standardCode` lưu thủ công, không suy ra từ contract gốc.
- `proposals`: trader trả lời buying-request, cũng gọi `assertTraderFarmLinked(farmId)`. **Không lưu `sourceContractId`**, `standardCode` cũng tự nhập.
- `orders`: buyer đặt từ product → trader accept → auto-create `ContractEntity{contractType:'trader_buyer', productId, farmId=null, standardId=null}`. **Không kế thừa farm/standard từ contract gốc**.
- `proposals.acceptProposal`: buyer accept proposal → auto-create `ContractEntity{contractType:'trader_buyer', proposalId, farmId=proposal.farmId, standardId=null}`. **Không kế thừa standardId**.

**FE:**
- Buyer: `marketplace`, `product-detail`, `post-buying-request`, `sourcing` (inbox proposal), `orders-proposals`, `live-monitor` (xem contract active của buyer), `transaction-history`, `digital-twin-monitor`.
- Trader: `marketplace` (feed/news/supply), `transactions` (`BuyerFlowPanel`, `FarmerFlowPanel`), `trading-orders`, `supply-monitor`, `farm-monitoring`, `library`.

### 1.3. Khoảng trống (gap) — phần cần làm
1. **Product / Proposal** chưa lưu `sourceContractId` (id contract `farmer_trader` đã ký) → không truy ngược được farm/standard/step thực tế.
2. **Contract `trader_buyer` auto-tạo** từ order/proposal có `farmId=null` hoặc chỉ có `farmId` rời rạc; `standardId` luôn `null`; không có `sourceContractId`. Khi buyer mở chi tiết, không suy ra được `standard`, `standardSteps`, `careLog`, `evidence` của vườn đang phục vụ hợp đồng đó.
3. **CareLog** trong `farm-service` không có `contractId` → khi vườn quay vòng nhiều hợp đồng/vụ, không tách được care log của một contract cụ thể (live-monitor của buyer trộn lẫn dữ liệu vụ cũ + vụ hiện tại).
4. FE buyer (`BuyerLiveMonitorScreen`, `BuyerLiveMonitorDetailScreen`, `BuyerProductDetailScreen` tab traceability) hiện chỉ hiển thị farm theo `contract.farmId` (nếu có); chưa load `standardSteps` + `careLogs` lọc theo contract.

---

## 2. Yêu cầu nghiệp vụ (chi tiết)

| # | Yêu cầu | Lý do |
|---|---------|-------|
| R1 | Mỗi `product` (trader đăng bán) bắt buộc gắn với 1 `contract` type `farmer_trader` đã ký, đang `active`. Suy ra `farmId`, `standardId`, `farmName`, `standardName` từ contract đó. | Đảm bảo nông sản trader bán có nguồn gốc rõ và buyer thấy được chuẩn canh tác. |
| R2 | Mỗi `proposal` (trader trả buying-request) cũng gắn với 1 `contract farmer_trader` đã ký. Suy ra farm/standard tương tự. | Đề xuất từ trader phải đính kèm vườn + chuẩn để buyer ra quyết định. |
| R3 | Khi auto-create `contract trader_buyer` từ `order` hoặc `proposal.accept`: copy `sourceContractId`, `farmId`, `standardId`, `farmName`, `standardName` từ contract `farmer_trader` gốc. | Buyer mở contract → có đủ thông tin truy xuất. |
| R4 | `care_logs` trong farm-service thêm `contract_id` (nullable, FK cross-service tới `contracts.id`). Khi farmer ghi log: nếu vườn đang có contract `farmer_trader` `active` thì auto gán `contractId` đó. | Truy xuất care log theo contract khi vườn có nhiều vụ. |
| R5 | Endpoint `GET /api/v1/care-logs` thêm filter `contractId`, `farmId`. Endpoint cho buyer/trader (cross-service): `GET /api/v1/contracts/:id/care-logs` (qua `contract-service` → gọi `farm-service`). | Buyer xem live-monitor một contract chỉ thấy log của contract đó. |
| R6 | FE Buyer `live-monitor` + `product-detail` truy xuất care log theo `contractId`; hiển thị standard step progression và evidences. | Trải nghiệm truy xuất nguồn gốc end-to-end. |
| R7 | FE Trader khi tạo product/proposal: bước chọn "vườn" thay bằng "chọn contract farmer_trader active"; FE tự điền farm, standard. | Đồng bộ ràng buộc backend, giảm lỗi user. |

> **Nguyên tắc:** Không thêm endpoint ngoài `/specs/backend-api-specification/`; chỉ mở rộng tham số/response cho endpoint sẵn có. Nếu phải bổ sung endpoint nội bộ (vd `contract → care-log proxy`) phải đăng ký rõ trong design + log trong commit.

---

## 3. Các bước thực hiện

### Bước 0 — Trước khi code

- [ ] Đọc lại `.claude/docs/business-logic.md` (mục trader-buyer, traceability) và `.claude/docs/architecture.md` (cross-service FK).
- [ ] Kiểm tra `/specs/backend-api-specification/design.md` để chắc chắn các trường mới (`sourceContractId`, `contractId` trên care log) khớp spec; nếu không, **dừng và cảnh báo user** (theo `.claude/rules/00-context-loading.md`).
- [ ] Xác nhận với user về:
  - Tên cột (`source_contract_id` vs `farmer_trader_contract_id`).
  - Quy tắc khi product gắn vào contract `farmer_trader` đã `completed`/`cancelled`: tự ẩn product? hay chỉ chặn tạo mới?
  - Khi farm có >1 contract `farmer_trader` cùng `active` (hệ thống hiện cấm — `assertFarmHasNoOngoingContract`): vẫn giữ nguyên 1-vườn-1-contract-active.

### Bước 1 — Shared DTO + Constants (`be/libs/shared/src/dto/contract.dto.ts`)

- [ ] Thêm field optional vào `ProductDto`, `CreateProductDto`, `UpdateProductDto`:
  - `sourceContractId?: string` (UUID, required khi create).
  - `standardId?: string`, `standardName?: string | null` (denorm, server tự điền).
- [ ] Thêm field tương tự vào `ProposalDto`, `CreateProposalDto`:
  - `sourceContractId: string` (bắt buộc).
  - `standardId?: string`, `standardName?: string | null` (denorm).
- [ ] Thêm `sourceContractId?: string` vào `ContractDto` (contract `trader_buyer` mới).
- [ ] Thêm `contractId?: string` vào `CareLogDto`, `CreateCareLogDto`, `SyncCareLogsDto.items[]` (trong `farm.dto.ts`).
- [ ] Rebuild shared lib (`npm run build` trong workspace shared) — turbo sẽ pick up khi dev.

### Bước 2 — Backend `contract-service`

#### 2.1. Migration mới
- [ ] Tạo migration `apps/contract-service/src/migrations/<timestamp>-add-source-contract-id.ts`:
  - `products`: thêm `source_contract_id uuid NULL`, index, **không** FK TypeORM (cross-table cùng service nhưng vẫn tránh ManyToOne nặng).
  - `proposals`: thêm `source_contract_id uuid NULL`, index.
  - `contracts`: thêm `source_contract_id uuid NULL`, index (cho contract type `trader_buyer`).
  - Backfill: với product/proposal hiện có, set `source_contract_id` = contract `farmer_trader` active hiện tại của trader cùng `farmId` (nếu có; nếu không thì để NULL và log warning).

#### 2.2. Entities
- [ ] `ProductEntity`: thêm `sourceContractId` column + index `idx_products_source_contract_id`.
- [ ] `ProposalEntity`: thêm `sourceContractId` + index.
- [ ] `ContractEntity`: thêm `sourceContractId` + index `idx_contracts_source_contract_id`.

#### 2.3. `ContractsService` (helper mới)
- [ ] Thêm method `getActiveFarmerTraderContract(contractId, traderId)`:
  - Tải contract theo `id`, đảm bảo `contractType='farmer_trader'`, `status='active'`, `partyTraderId=traderId`, chưa `deletedAt`.
  - Throw `BadRequestException` nếu không khớp.
  - Return entity (đã có `farmId`, `standardId`, `farmName`, `standardName`).
- [ ] Giữ `assertTraderFarmLinked` cho tương thích nhưng đánh dấu deprecated trong comment (nếu chỉ còn 1 nơi dùng thì xóa luôn).

#### 2.4. `ProductsService.createProduct`
- [ ] Nhận `sourceContractId` từ DTO. Gọi `getActiveFarmerTraderContract(sourceContractId, traderId)`.
- [ ] Lưu `sourceContractId`, `farmId = sourceContract.farmId`, `farmName = sourceContract.farmName`, `standardCode/standardId = sourceContract.standardId`, `standardName = sourceContract.standardName`.
- [ ] `updateProduct`: cho phép đổi `sourceContractId` (re-validate); cấm đổi `farmId` rời rạc.
- [ ] Xem xét tự ẩn (`status='inactive'`) khi source contract chuyển sang `completed`/`cancelled` — **thực hiện ở event publisher** nếu đã có, hoặc skip nếu user chỉ muốn enforce lúc tạo.

#### 2.5. `ProposalsService.createProposal`
- [ ] Yêu cầu `sourceContractId` thay (hoặc bổ sung) `farmId` trong DTO. Gọi `getActiveFarmerTraderContract`.
- [ ] Suy ra `farmId`, `farmName`, `standardId`, `standardName` từ contract; lưu vào proposal.

#### 2.6. `OrdersService.createContractFromOrder`
- [ ] Khi auto-create contract `trader_buyer` từ order: load `product.sourceContractId`; nếu có → tải contract gốc → copy `farmId`, `standardId`, `farmName`, `standardName` vào contract mới; gán `contract.sourceContractId`.
- [ ] Nếu product không có `sourceContractId` (legacy) → để `null` và log warning.

#### 2.7. `ProposalsService.createContractFromProposal`
- [ ] Tương tự, copy `sourceContractId` + standard từ proposal.sourceContract.

#### 2.8. Controllers
- [ ] Cập nhật Swagger `@ApiProperty` cho các DTO mới.
- [ ] Thêm/giữ endpoint `GET /api/v1/contracts/:id/care-logs` (proxy tới farm-service) hoặc tận dụng `GET /api/v1/care-logs?contractId=...` (xem 3.3).

### Bước 3 — Backend `farm-service`

#### 3.1. Migration
- [ ] `apps/farm-service/src/migrations/<timestamp>-add-care-log-contract-id.ts`: thêm `care_logs.contract_id uuid NULL`, index `idx_care_logs_contract_id`.
- [ ] Không thêm FK TypeORM (cross-service); FK enforce ở mức DB nếu cùng cluster hoặc bỏ qua nếu khác cluster (xem `architecture.md`).
- [ ] Backfill: với care log hiện có, set `contract_id` = contract `farmer_trader` `active` của vườn nếu duy nhất; nếu không xác định thì để NULL.

#### 3.2. Entity + DTO
- [ ] `CareLogEntity`: thêm `contractId: string | null` + index.
- [ ] `ListCareLogsQueryDto`: thêm `contractId?: string` (UUID v4).

#### 3.3. `CareLogsService`
- [ ] `listCareLogs(farmId, query)`: nếu `query.contractId` có → `where.contractId = ...`.
- [ ] `createCareLog`: sau khi `requireFarmOwner`, nếu farm có contract `farmer_trader` `active` duy nhất → tự gán `entity.contractId = activeContract.id`.
  - Cần gọi cross-service `contract-service` (qua HTTP client). Tránh round-trip mỗi lần ghi: có thể cache theo `farmId` (TTL ngắn) hoặc denorm `current_contract_id` lên `farm.entity.ts` khi contract chuyển sang `active` (lúc đó `contracts.service.sign()` đã gọi `farmClient.applyStandardToFarm` → mở rộng thêm `setCurrentContract`).
  - **Khuyến nghị:** thêm cột `farms.current_contract_id` + farm-service method `setCurrentContract(farmId, contractId | null)`; gọi từ `contract-service.contracts.service.sign()` (khi `active`) và khi contract chuyển sang `completed/cancelled` (set `null`).
- [ ] `syncCareLogs`: tương tự, áp `contractId` mặc định từ farm.currentContractId.
- [ ] `toDto`: trả `contractId`.

#### 3.4. FarmClientService (contract-service)
- [ ] Thêm method `setCurrentContract(farmId, contractId | null, authorization?)` gọi farm-service.
- [ ] `farm-service` mở endpoint internal: `PATCH /api/v1/internal/farms/:id/current-contract` (đã có pattern `applyStandardToFarm` ở `2e3b3ef`, làm tương tự).

#### 3.5. Hooks trong `ContractsService.sign()`
- [ ] Khi contract `farmer_trader` chuyển sang `active`: gọi `setCurrentContract(farmId, contract.id)`.
- [ ] Khi `farmer_trader` chuyển sang `completed`/`cancelled` (cần điểm thoát trạng thái — kiểm tra `contract-change-requests` và logic hoàn tất hợp đồng): gọi `setCurrentContract(farmId, null)`.

### Bước 4 — Frontend (`fe/src`)

#### 4.1. Services
- [ ] `services/marketplaceService.ts` (hoặc `productService.ts`): expose `sourceContractId` ở `ProductDto`; thêm form field khi tạo product.
- [ ] `services/proposalService.ts`: thêm `sourceContractId` vào `CreateProposalDto`.
- [ ] `services/careLogService.ts` (FE): thêm `contractId` vào query params và DTO.
- [ ] Thêm helper `listTraderActiveFarmerContracts()` gọi `GET /api/v1/contracts?role=trader&status=active&contractType=farmer_trader` (nếu chưa có; tận dụng `contracts.controller`).

#### 4.2. Màn Trader — tạo Product / Proposal
- [ ] `MarketplaceSupplyPanel` / `TraderTradingOrdersScreen` (chỗ trader tạo tin bán): thay phần chọn "vườn" bằng combobox "chọn hợp đồng với nông dân" (hiển thị `farmName — standardName — startDate`).
- [ ] Khi chọn xong → đổ readonly farm + standard.
- [ ] Trong `BuyerFlowPanel` (trader trả buying-request) cũng dùng cùng combobox.

#### 4.3. Màn Buyer — Live Monitor + Product Detail
- [ ] `BuyerLiveMonitorDetailScreen`: dùng `contract.sourceContractId` (hoặc trực tiếp `contract.farmId/standardId`) để fetch:
  - `GET /api/v1/standards/:id` để render danh sách step.
  - `GET /api/v1/care-logs?farmId=&contractId=` (qua proxy nếu cần) để render timeline + evidence.
- [ ] `BuyerProductDetailScreen.ProductDetailTabs`: tab "Nguồn gốc" hiện chỉ có UI mẫu — kết nối thật theo `product.sourceContractId` để hiển thị standard + care log mới nhất.

#### 4.4. Buyer Live Monitor (list)
- [ ] Lọc contract type `trader_buyer` `active` + có `sourceContractId` để vào màn detail; cảnh báo "chưa truy xuất được" nếu legacy contract thiếu `sourceContractId`.

#### 4.5. Validation/Hiển thị UX
- [ ] Thông báo lỗi tiếng Việt khi trader chọn contract không hợp lệ ("Hợp đồng với nông dân đã hết hiệu lực").
- [ ] Snackbar khi tải care-log lỗi (giữ pattern `useStableOpenSnackbar`).
- [ ] Empty state cho live monitor (không có care log).

### Bước 5 — Test

- [ ] BE unit (`*.spec.ts`):
  - `products.service.spec.ts`: createProduct với sourceContract hợp lệ / không active / khác trader.
  - `proposals.service.spec.ts`: createProposal + acceptProposal copy đầy đủ field.
  - `orders.service.spec.ts`: createContractFromOrder copy field.
  - `contracts.service.spec.ts`: hook `setCurrentContract` được gọi đúng lúc.
  - `care-logs.service.spec.ts`: createCareLog auto-set contractId; listCareLogs filter theo contractId.
- [ ] BE integration (`be/integration-tests/`):
  - Flow trader đăng product → buyer mua → contract auto-tạo có đủ farm/standard.
  - Flow buyer post buying-request → trader propose → buyer accept → contract auto-tạo có đủ farm/standard.
  - Flow farmer ghi care log với farm có contract → care log có contractId.
- [ ] FE unit: nếu có service helper, viết unit cho `listTraderActiveFarmerContracts`, map DTO.
- [ ] FE Playwright (`fe/src/tests/e2e/`): chỉ thêm nếu user yêu cầu — mặc định skip.

---

## 4. Lưu ý và rủi ro

1. **Data backfill**: legacy product/proposal/contract `trader_buyer`/care_log không có cột mới — backfill bằng heuristic, log warning những bản ghi không match được. Không xóa.
2. **Cross-service consistency**: care_log gắn `contractId` nhưng contract sống ở `contract-service`. Khi contract bị xóa cứng (không nên có) → care_log mồ côi. Vẫn đảm bảo soft-delete `deletedAt`.
3. **1 farm — 1 contract `farmer_trader` active**: hiện đã enforce bởi `assertFarmHasNoOngoingContract`. Tận dụng để `farms.current_contract_id` deterministic.
4. **Trader tạo product khi contract `farmer_trader` chưa `active` (mới `pending_signature`)**: chặn rõ ràng — yêu cầu `getActiveFarmerTraderContract` throw nếu status khác `active`.
5. **API Gateway / Auth**: endpoint internal `setCurrentContract` cần header internal hoặc JWT service-to-service như `applyStandardToFarm` đang dùng (tham khảo commit `2e3b3ef`).
6. **Không tạo endpoint mới ngoài spec**: nếu spec gốc (`/specs/backend-api-specification/design.md`) chưa có `currentContractId` trên farm hoặc query `contractId` trên care-log → **dừng, hỏi user trước khi implement**.
7. **Đừng đụng** `react-router-dom` cho navigation chính (theo `.claude/rules/00-context-loading.md`).
8. **Design tokens**: mọi component mới phải dùng tokens trong `fe/src/design-system/tokens/`.
9. **Trace mã FR/US**: trong commit message và comment 1-dòng (`// FR-G01 truy xuất care log theo contract`).
10. **Soft delete**: cột `deletedAt` đã có ở các bảng — không cần thêm.

---

## 5. Thứ tự khuyến nghị thực thi (PR nhỏ, độc lập)

1. **PR-1**: Shared DTO + migration `source_contract_id` (products, proposals, contracts) — chưa đổi logic, chỉ schema + DTO optional.
2. **PR-2**: BE logic — `ProductsService` / `ProposalsService` / `OrdersService` / `ContractsService` (auto-copy field, `getActiveFarmerTraderContract`).
3. **PR-3**: Migration + entity + DTO cho `care_logs.contract_id` + `farms.current_contract_id` + endpoint internal `setCurrentContract`, hook trong `contracts.service.sign()`.
4. **PR-4**: BE care-log service auto-gán contractId + filter list.
5. **PR-5**: FE Trader — chọn contract khi tạo product/proposal.
6. **PR-6**: FE Buyer — live monitor + product detail truy xuất care log theo contract.
7. **PR-7**: Tests & polish (snackbar, empty state, swagger).

---

## 6. Tiêu chí hoàn thành

- [ ] Trader chỉ tạo được product/proposal khi đã có contract `farmer_trader` `active`.
- [ ] Mọi contract `trader_buyer` mới đều có `sourceContractId`, `farmId`, `standardId` đầy đủ.
- [ ] Care log mới có `contractId` (khi vườn đang trong contract active).
- [ ] Buyer mở contract `trader_buyer` → thấy được standard steps + timeline care log + evidence của contract đó, không lẫn vụ khác.
- [ ] Unit test + integration test xanh; `npm run lint` clean ở cả `be/` và `fe/`.
- [ ] Spec/docs cập nhật nếu thêm trường (đề xuất cập nhật `.claude/docs/business-logic.md` mục traceability).
