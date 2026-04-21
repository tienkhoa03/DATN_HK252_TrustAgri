# Kế hoạch triển khai Frontend (song song theo tính năng, map 1-1 với Backend)

## Mục tiêu

- Mỗi **Phase = một tính năng** map 1-1 với `specs/backend-api-specification/tasks.md` (cùng số phase, cùng tên).
- Mỗi Phase ở frontend có **hai task**:
  - **`[FE Task]`** — dựng UI component + `mockService` giả lập độ trễ, trả **đúng hợp đồng JSON** của backend (camelCase, theo `design.md`).
  - **`[Integration Task]`** — gỡ mock, gọi Axios thực tế tới Gateway, xử lý lỗi theo `ErrorResponse` + snackbar tiếng Việt.
- Frontend luôn chuẩn bị mock **trước** khi backend xong để chạy song song.
- Ghi chú lỗi đã gặp và guardrail triển khai được lưu tại **`agent-notes.md`** trong cùng thư mục.
- Chính sách xóa dữ liệu: **mặc định soft delete** cho dữ liệu nghiệp vụ; FE phải hiển thị trạng thái xóa phù hợp và không giả định hard delete trừ dữ liệu không cần lưu vết.

**Chú thích**

- `[ ]` chưa thực hiện
- `[x]` hoàn thành

**Công cụ dùng chung**

- Instance Axios `src/api/client.ts` + interceptor (`Authorization: Bearer`, chuẩn hóa `ErrorResponse`).
- Jotai atoms cho auth / phiên.
- React Query (khuyến nghị) cho cache server.
- `zmp-ui`: `ZMPRouter` + `AnimationRoutes` + role guard.

---

## Phase 0: Nền tảng frontend (Prerequisite)

- [x] **`[FE Task]` 0.1:** Cài `axios`, (tùy chọn) `@tanstack/react-query`, `socket.io-client`. Tạo `src/api/client.ts`, `src/api/interceptors.ts`, `src/api/errors.ts` (parse `ErrorResponse` backend). Dựng khung route (`ZMPRouter` + `AnimationRoutes`) + role guard rỗng. Tạo thư mục `src/services/mocks/` + helper `withMockDelay(payload, minMs, maxMs)` và cờ `VITE_USE_MOCK`.

- [x] **`[Integration Task]` 0.2:** Cấu hình `VITE_API_BASE_URL` trỏ tới API Gateway, bật HTTPS-only ở môi trường không local. Xác minh instance Axios gửi đúng header + parse lỗi chuẩn qua smoke call `POST /api/v1/auth/verify`.

---

## Phase 1: Đăng nhập qua Zalo và quản lý phiên (FR-S01)

- [x] **`[FE Task]` 1.1:** Dựng `LoginScreen` bằng primitive Zaui, tạo `mockAuthService` với `login` / `verify` / `logout` trả JSON đúng `design.md` (`{ accessToken, refreshToken, userId, role, expiresAt }`). Tạo hook `useAuth`, file atoms `authAtoms.ts`, xử lý 401 trong interceptor.

- [x] **`[Integration Task]` 1.2:** Gỡ `mockAuthService`, gọi Axios trực tiếp `POST /api/v1/auth/login`, `verify`, `logout`. Tích hợp `getAccessToken()` từ ZMP SDK, kiểm thử đăng nhập end-to-end + điều hướng theo role.

---

## Phase 2: Hồ sơ người dùng đa vai trò (FR-T01, FR-U*)

- [x] **`[FE Task]` 2.1:** Dựng `ProfileScreen` cho ba role (`farmer` / `trader` / `buyer`) với các khối `traderProfile`, `farmerProfile`, `buyerProfile`. Tạo `mockProfileService.getMe()` / `updateMe()` trả `UserProfileDto`.

- [x] **`[Integration Task]` 2.2:** Gỡ mock, dùng Axios `GET` / `PUT /api/v1/auth/me`. Tích hợp optimistic update và xử lý lỗi 400.

---

## Phase 3: Hồ sơ vườn (Farm Profile) (FR-F01, FR-T07)

- [x] **`[FE Task]` 3.1:** Dựng `FarmerFarmProfileScreen`, phần tìm vườn trên `TraderSupplyMonitorScreen` và màn chi tiết vườn thương lái. Tạo `mockFarmService` (`listFarms`, `getFarm`, `createFarm`, `updateFarm`, `deleteFarm`) trả `FarmDto` và `ListResponse<FarmDto>`. Trạng thái rỗng + skeleton loading.

- [x] **`[Integration Task]` 3.2:** Gọi `/api/v1/farms*` qua Axios, map `FarmDto` camelCase vào view model, xử lý 403 khi không phải chủ sở hữu. `DELETE /farms/:id` tuân thủ **soft delete** (item bị ẩn khỏi list mặc định sau khi xóa).

---

## Phase 4: Thư viện quy trình canh tác chuẩn (FR-T10, FR-F06)

- [x] **`[FE Task]` 4.1:** Dựng `TraderStandardLibraryScreen` (CRUD) và `FarmerProcessScreen` (đọc tiêu chuẩn + bước). Tạo `mockStandardService` trả `StandardDto` + `StandardStepDto`.

- [x] **`[Integration Task]` 4.2:** Gọi `/api/v1/standards*`, role-guard trader cho CRUD, hiển thị dữ liệu seed VietGAP / GlobalGAP trên màn nông dân.

---

## Phase 5: Nhật ký chăm sóc + minh chứng + đồng bộ offline (FR-F05, FR-F09)

- [x] **`[FE Task]` 5.1:** Dựng `FarmerProcessScreen` (form nhật ký + upload minh chứng) + hàng đợi offline (IndexedDB). Tạo `mockCareLogService` (`list`, `create`, `syncBatch`, `uploadEvidence`) trả `CareLogDto`, `CareLogSyncResponse`. Hiển thị `synced` | `pending` | `conflict`.

- [x] **`[Integration Task]` 5.2:** Gọi `/api/v1/farms/:id/care-logs*` và `/evidence`, kích hoạt đồng bộ batch khi `online`. Xử lý `conflict` bằng hộp thoại (gộp / giữ local / giữ server).

---

## Phase 6: Giám sát cảm biến — latest và history (FR-F07, FR-T11, FR-U05)

- [x] **`[FE Task]` 6.1:** Dựng `FarmerDashboardScreen`, `TraderSupplyMonitorScreen`, `BuyerDigitalTwinMonitorScreen` với biểu đồ (line/area). Tạo `mockMonitoringService.getLatest` / `getHistory` trả `SensorReadingDto` với `isImputed` rõ ràng. Legend phân biệt imputed và thực đo.

- [x] **`[Integration Task]` 6.2:** Gọi `GET /api/v1/monitoring/farms/:farmId/latest` và `history` + đăng ký WebSocket `subscribe_farm`. Gộp realtime vào state Jotai; REST vẫn là nguồn sự thật khi cold start.

---

## Phase 7: Cảnh báo ngưỡng và acknowledge (FR-F08)

- [x] **`[FE Task]` 7.1:** Dựng thẻ cảnh báo trên `FarmerDashboardScreen` + màn danh sách cảnh báo. Tạo `mockAlertService.listAlerts` / `acknowledge` trả `AlertDto` với `severity`, `suggestedAction`, `acknowledged`.

- [x] **`[Integration Task]` 7.2:** Gọi `GET /api/v1/monitoring/farms/:farmId/alerts` và `POST .../acknowledge`. Đồng bộ badge realtime qua WebSocket + cập nhật badge thông báo (Phase 15).

---

## Phase 8: Kết nối nông dân — thương lái (FR-F02, FR-F03, FR-T07, FR-T08)

- [x] **`[FE Task]` 8.1:** Dựng `FarmerMarketConnectScreen` (tìm thương lái + gửi), `TraderSupplyMonitorScreen` (tìm nông dân), `ConnectionRequestsScreen` (danh sách incoming/outgoing, chấp nhận/từ chối). Tạo `mockConnectionService` (`searchTraders`, `searchFarmers`, `list`, `create`, `accept`, `reject`) trả `ConnectionDto`.

- [x] **`[Integration Task]` 8.2:** Gọi `GET /api/v1/traders/search`, `/farmers/search`, `/connections*`. Hiển thị push notification khi có yêu cầu mới (liên kết Phase 15).

---

## Phase 9: Chợ nông sản (sản phẩm) (FR-T03, FR-U01, FR-G03)

- [x] **`[FE Task]` 9.1:** Dựng `BuyerMarketplaceScreen`, `BuyerProductDetailScreen`, `GuestHomeMarketNewsScreen` (danh sách sản phẩm public), `GuestProductDetailScreen`, `TraderTradingOrdersScreen` (CRUD thương lái). Tạo `mockMarketplaceService` trả `ProductDto`.

- [x] **`[Integration Task]` 9.2:** Gọi `/api/v1/products*` (khách public không cần auth). Lọc + phân trang + role-guard CRUD cho trader.

---

## Phase 10: Nhu cầu mua hàng từ người mua (FR-U02, FR-T04)

- [x] **`[FE Task]` 10.1:** Dựng `BuyerPostBuyingRequestScreen` (tạo/sửa/hủy) và tab «Nhu cầu công khai» trên `TraderTradingOrdersScreen`. Tạo `mockBuyingRequestService` trả `BuyingRequestDto`.

- [x] **`[Integration Task]` 10.2:** Gọi `/api/v1/buying-requests*`, tích hợp sang Phase 11 khi thương lái gửi proposal.

---

## Phase 11: Đơn hàng và đề xuất (FR-U01, FR-U03, FR-T04, FR-T05)

- [x] **`[FE Task]` 11.1:** Dựng `BuyerOrdersProposalsScreen`, `TraderTradingOrdersScreen`, `FarmerContractsScreen` (mức tạo từ proposal). Tạo `mockOrderService` + `mockProposalService` trả `OrderDto`, `ProposalDto`, hỗ trợ accept/reject/cancel.

- [x] **`[Integration Task]` 11.2:** Gọi `/api/v1/orders*` và `/proposals*`. Đảm bảo state machine `pending → accepted|rejected → contracted|cancelled` phản ánh đúng UI; chuyển sang Phase 12 khi tạo hợp đồng.

---

## Phase 12: Hợp đồng (vòng đời contract) (FR-F04, FR-T06, FR-T09, FR-U06)

- [x] **`[FE Task]` 12.1:** Dựng `FarmerContractsScreen`, tab hợp đồng trên `TraderTradingOrdersScreen`, tab hợp đồng trên `BuyerOrdersProposalsScreen`. Tạo `mockContractService` (`list`, `get`, `create`) trả `ContractDto` kèm lọc `role`, `status`.

- [x] **`[Integration Task]` 12.2:** Gọi `/api/v1/contracts*`. Hiển thị vòng đời + audit log minh bạch.

---

## Phase 13: Yêu cầu thay đổi hợp đồng (FR-F05, FR-T06, FR-T09, FR-U04)

- [x] **`[FE Task]` 13.1:** Dựng `ContractChangeRequestsPanel` nhúng trong màn hợp đồng (nông dân / thương lái / người mua). Tạo `mockContractChangeService` trả `ContractChangeRequestDto` với diff `{ oldValue, newValue }`.

- [x] **`[Integration Task]` 13.2:** Gọi `/api/v1/contracts/:id/change-requests*`. Cập nhật `contract.status = pending_change` khi có yêu cầu và rollback khi từ chối.

---

## Phase 14: Đối chiếu tuân thủ quy trình (FR-T11)

- [x] **`[FE Task]` 14.1:** Dựng tab «Tuân thủ» trên `TraderSupplyMonitorScreen`: thanh tiến độ `completedSteps/totalSteps`, danh sách `deviations`, `complianceScore`. Tạo `mockComplianceService.getCompliance` trả `ComplianceDto`.

- [x] **`[Integration Task]` 14.2:** Gọi `GET /api/v1/contracts/:id/compliance`, làm mới theo nút «Cập nhật», hiển thị `lastComputedAt`.

---

## Phase 15: Trung tâm thông báo (FR-F08 in-app + dùng chung)

- [x] **`[FE Task]` 15.1:** Dựng `BuyerProfileNotificationScreen`, chuông thông báo trên navigation, toast nội tuyến. Tạo `mockNotificationService` (`list`, `read`, `readAll`) trả `NotificationDto` + số badge.

- [x] **`[Integration Task]` 15.2:** Gọi `/api/v1/notifications*`. Dùng `notification.linkTo` để điều hướng tới cảnh báo / hợp đồng / kết nối tương ứng.

---

## Phase 16: Tin tức thị trường và dự báo (FR-T12, FR-G02)

- [x] **`[FE Task]` 16.1:** Dựng `TraderProfileNewsScreen` (CRUD tin + dự báo), `GuestHomeMarketNewsScreen` (feed tin public + widget dự báo). Tạo `mockNewsService`, `mockForecastService` trả `NewsArticleDto`, `ForecastDto`.

- [x] **`[Integration Task]` 16.2:** Gọi `/api/v1/news*` và `/forecasts*`, role-guard trader cho `POST`/`PUT`. Route khách không gửi header auth.

---

## Phase 17: Dashboard thống kê (FR-T02 + tóm tắt nông dân / người mua)

- [x] **`[FE Task]` 17.1:** Dựng `TraderDashboardScreen`, phần KPI trên `FarmerDashboardScreen`, widget `BuyerDashboardScreen` với chart / khối số (ưu tiên trực quan hóa theo mục 4.3.5). Tạo `mockDashboardService` trả `DashboardTraderDto` (và tương đương).

- [x] **`[Integration Task]` 17.2:** Gọi `GET /api/v1/dashboard/{trader|farmer|buyer}`. Tuân thủ ngưỡng bundle / hiệu năng bằng lazy load biểu đồ.

---

## Phase 18: Truy xuất nguồn gốc công khai (FR-G01)

- [x] **`[FE Task]` 18.1:** Dựng `GuestTraceabilityScanResultScreen`: timeline care log + biểu đồ cảm biến + badge tiêu chuẩn. Tạo `mockTraceabilityService.getByQrCode` trả `TraceabilityDto`. UI 404 thân thiện khi mã không hợp lệ.

- [x] **`[Integration Task]` 18.2:** Gọi `GET /api/v1/traceability/qr/:code` (không gửi header `Authorization`). Render nhanh khi quét QR.

---

## Phase 19: Lịch sử giao dịch người mua (FR-U06)

- [x] **`[FE Task]` 19.1:** Thêm route `/buyer/history` và màn `BuyerTransactionHistoryScreen` với lọc `status`, `from`, `to` + phân trang. Tái sử dụng mock order/contract kèm query `includeSummary=true`.

- [x] **`[Integration Task]` 19.2:** Gọi `GET /api/v1/orders?buyerId=me&...` và `GET /api/v1/contracts?role=buyer&...`, hiển thị KPI tóm tắt (`totalSpent`, `completedCount`).

---

## Phase 20: Quality gate tích hợp cuối (hardening)

- [x] **`[FE Task]` 20.1:** Audit cuối: gỡ sạch mọi `mockService` còn lại; kiểm tra token màu / typography / icon theo mục 4.3.6; xác minh quy tắc 3 lần chạm cho nông dân (`alert`, `care-log`); bundle < 20 MB; responsive 4,7"–6,7". Unit test `errors.ts` + mapper service. E2E Playwright: khách QR → đặt hàng người mua → proposal thương lái → care log nông dân → acknowledge cảnh báo.

- [x] **`[Integration Task]` 20.2:** Regression E2E toàn chuỗi Phase 1–19 trên môi trường staging với Gateway thật. Đóng băng hợp đồng API phiên bản 5.0.

---

## Quy tắc quản trị

- [ ] Mọi thay đổi hợp đồng API phải cập nhật **đồng thời** `design.md` và phase tương ứng trong **cả hai** file `tasks.md` (backend và frontend).
- [ ] Mọi mock service bắt buộc trả JSON **đúng camelCase** theo `design.md`; không tự ý đổi tên trường.
- [ ] Phase chỉ được coi là hoàn thành khi cả task backend (trong file BE), `[FE Task]` và `[Integration Task]` đều `[x]`.
- [ ] Nếu backend chậm, frontend vẫn chạy mock; task tích hợp có thể gom sprint sau nhưng **không xóa** checkbox.
- [ ] Mọi luồng `DELETE` trên UI mặc định phải mô phỏng và tích hợp theo **soft delete**; chỉ dùng hard delete khi BE đặc tả rõ dữ liệu không cần lưu vết.

---

**Phiên bản:** 5.0  
**Trạng thái:** Kế hoạch FE song song theo tính năng, map 1-1 với BE, phủ FR mục 4.3.1/4.3.2 và NFR/UI mục 4.3.3 / 4.3.5 / 4.3.6.
