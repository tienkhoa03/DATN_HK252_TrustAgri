# TrustAgri — TODO sau khi hoàn thành audit + fix

> Cập nhật: 2026-05-20 (lượt 2). Trạng thái: **BE build PASS · FE tsc 0 lỗi · audit spec đã chạy + fix các bug rõ ràng**.

## A. Đã hoàn thành (lượt này)

### A.1 — 7 lỗi TS còn lại của lượt 1
- `useStableOpenSnackbar.ts`: bỏ import `SnackbarOptions` từ subpath, suy ra type từ `Parameters<ReturnType<typeof useSnackbar>['openSnackbar']>[0]`.
- `AppInitScreen.tsx`: bỏ prop `size="small"` không hợp lệ trên `<Spinner />`.
- `tests/integration/{navigation-flows,theme-consistency,user-flows}.test.tsx`: alias `FarmerProcessScreen` → `FarmerGardenMonitorScreen` (screen kế thừa "quy trình + nhật ký").
- `tests/visual/helpers.ts`: thay `locator.screenshot({ clip })` (không hợp lệ) bằng `page.screenshot({ clip })` khi cần padding.
- `utils/performance.ts`: thay `perfData.domLoading` (deprecated) bằng `perfData.responseEnd`.

### A.2 — Bug từ Backend spec audit
- `apps/contract-service/src/contracts/dto/contract-query.dto.ts`: thêm `farmId` filter (vá HIGH bug — monitoring-service WS access check call `GET /contracts?farmId=...&status=active`, nhưng BE không có filter `farmId` → trả về toàn bộ active contracts → lỗ hổng phân quyền). Đồng thời thêm `in_settlement` vào enum status để khớp entity.
- `apps/contract-service/src/contracts/contracts.service.ts`: thêm `qb.andWhere('c.farmId = :farmId', ...)` trong `buildContractListQuery` để filter thực sự áp dụng.

### A.3 — Bug từ Frontend spec audit
- `fe/src/services/contractService.ts`: thêm case `'in_settlement'` (label "Đang quyết toán") vào `contractStatusLabelVi` để không hiển thị raw enum cho user.
- `fe/src/services/careLogAutoSync.ts` (mới): module kích hoạt `drainCareLogQueue()` khi browser `online` event, group queue theo `farmId`, gọi `syncCareLogs()`, dequeue trên success (idempotent qua `clientRecordId`). Tuân thủ **NFR-R02**.
- `fe/src/app.ts`: gọi `initCareLogAutoSync()` ngay khi app khởi động.
- `fe/src/screens/farmer/connections/FarmerConnectionDetailScreen.tsx` + `screens/trader/connections/TraderConnectionDetailScreen.tsx`: thay `fontSize: '10px'` (vi phạm NFR-U03) bằng `fontSize.small` (14px) cho stage label progress bar.
- `fe/src/api/monitoringSocket.ts`: `getOrCreateSocket()` trả `null` khi không có token thay vì mở handshake bị 403; `subscribeToFarm()` no-op khi không kết nối được.
- `fe/src/router/routes.tsx`: gỡ lazy import `BuyerDigitalTwinMonitorScreen` (đã được thay bằng `BuyerLiveMonitorScreen`, không còn route nào sử dụng).

### A.4 — Verify
- `cd be && npm run build` → 7/7 PASS (turbo cached).
- `cd fe && npx tsc --noEmit` → **0 errors**.
- `cd fe && npx jest src/design-system/tokens/__tests__/colors.test.ts` → 38/38 PASS (xác nhận rename `getNearestValidColor` → `getDefaultColorFallback` không break test).

## B. Phát hiện còn lại từ audit — KHÔNG fix tự động (cần quyết định)

### B.1 — Spec drift (code có tính năng, spec chưa cập nhật)
Các tính năng đang chạy ổn trong code nhưng KHÔNG có trong `/specs/backend-api-specification/design.md`. Theo `.claude/rules/00-context-loading.md`, **KHÔNG sửa /specs**. Cần user quyết định: cập nhật spec hay rút tính năng?
- **trader-reviews module** (BE) — `POST/GET /traders/:id/reviews`, `GET /trust-score`, `PATCH/DELETE /reviews/:id` + bảng `trader_reviews`. Code chạy trong production, FE đã dùng.
- **care-plans module** (BE) — `GET /farms/:id/care-plan/today`, `POST /tasks/:stepId/complete`. FE đã dùng.
- **devices module** (BE/monitoring) — 4 IoT device CRUD endpoints. **CẢNH BÁO**: code có TODO chưa implement ownership guard — endpoint hiện chỉ có JWT global. Trader nào có token là có thể CRUD device của farm bất kỳ. Cần ưu tiên fix nếu giữ module.
- **DELETE /connections/:id** (BE) + status `'cancelled'` — disconnect/cancel flow. FE đã wire qua `disconnectConnection()` và `cancelConnection()`. Hai hàm là duplicate y hệt (cùng gọi `DELETE`), nên gỡ một.
- **PATCH /contracts/:id/sign**, **POST /contracts/:id/reject**, **GET /contracts/linked-farms** (BE) — undocumented endpoints.
- **GET /auth/users/:userId** (BE) — public summary, dùng nội bộ giữa services. Chỉ trả `UserPublicSummaryDto` (không PII).
- **includedTraderId** filter trên `GET /standards` (BE+FE) — chưa có trong spec nhưng đã wire FE.
- **Extra DTO fields** ở `ContractDto/CareLogDto/ConnectionDto/FarmDto/StandardDto` — các trường denorm (`partyFarmerName`, `farmName`, …) hữu ích cho UI nhưng chưa có trong spec.
- **`admin` role**, **`purchasedCropTypes`** trong `UserProfileDto.traderProfile` — chưa có trong spec.

→ **Đề xuất:** chạy 1 lượt sync spec (cập nhật `specs/backend-api-specification/design.md`) cho các tính năng đã release thay vì rút code. Việc này nên do tech lead làm chứ KHÔNG tự động.

### B.2 — Bug kiến trúc lớn cần user quyết
- **B1/B3 (audit)**: `disconnectConnection` và `cancelConnection` ở `connectionService.ts` là duplicate (cùng gọi `DELETE`). Quyết định giữ 1 + rename hay phân biệt qua params? Hiện đang work nhưng không sạch.
- **B4 (audit)**: `TrustWebRouter` dùng `react-router-dom` (`BrowserRouter`/`MemoryRouter`/`Outlet`/`useLocation`) trong khi `.claude/rules/20-frontend.md` cấm cho main nav. Comment trong code nói là do basename issue với ZMP. Cần ADR chính thức nếu giữ.
- **H1**: `listStandards({ ownerTraderId: 'null', limit: 100 })` ở `CreateFarmerContractModal.tsx:80` — đã verify BE handle string `'null'` như "system standards (ownerTraderId IS NULL)" tại `standards.service.ts:55`. Convention OK nhưng dễ gây nhầm; có thể tách thành param riêng `systemOnly=true`.
- **H2/H3**: route renames (`/farmer/farm` → `/farmer/garden`, `/buyer/request` → `/buyer/sourcing?action=create`) chưa update trong spec.
- **M8**: `TraderSupplyMonitorScreen` dùng `listFarms()` cho tab "search-supply" thay vì `searchFarmers()` (FR-T07). Hệ quả: connect button có thể bị spam request. Cần refactor.
- **M10**: 401 mid-session không redirect rõ ràng tới `/login` — phụ thuộc `RootEntry` re-render. Cần thêm explicit `navigate('/login')` trong interceptor (cần access đến router).

### B.3 — Style / accessibility minor
- **M1/L1**: `AppInitScreen.tsx` có nhiều hardcoded hex + font 11-13px. Là dev/smoke screen tại `/init`, có thể chấp nhận; nếu muốn sạch thì refactor sang tokens.
- **L5**: `colors.background.tertiary` không có trong spec design-system (`.claude/docs/design-system.md`). Cần thêm vào docs hoặc dùng `secondary`.

### B.4 — Soft-delete chưa áp dụng
- **LOW**: `standards.service.ts:160` hard-delete steps khi update standard. Tuân `tasks.md` policy nên dùng `softRemove`. Audit relevance cho compliance tracing.

## C. Lệnh verify cuối

```bash
# BE
cd be && npm run build           # turbo build → PASS
cd be && npm run lint            # eslint
cd be && npm run test            # jest unit + integration

# FE
cd fe && npx tsc --noEmit        # type check → 0 errors
cd fe && npm run lint            # eslint
cd fe && npm run test            # jest unit
cd fe && npm run build           # vite production build
cd fe && npm run build:check     # bundle size < 20MB (NFR-C01)
cd fe && npm run test:visual     # playwright visual regression
```

## D. File audit log đầy đủ

Nếu cần xem lại từng finding chi tiết (severity, file:line, fix rec):
- Lần BE audit + FE audit chạy qua `spec-aligner` sub-agent vào 2026-05-20 ~18:35; transcript ở `~/.claude/tasks/...` (đã tóm tắt trong commit history nếu commit).
