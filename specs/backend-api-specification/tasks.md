# Kế hoạch triển khai Backend (song song theo tính năng, map 1-1 với Frontend)

## Mục tiêu

- Mỗi **Phase = một tính năng** phủ rõ FR/US cụ thể.
- Mỗi Phase ở backend chỉ có **một task `[BE Task]`**: triển khai API bằng **NestJS** (Clean Architecture, module-based).
- Task `[FE Task]` và `[Integration Task]` nằm trong `specs/frontend-ui-specification/tasks.md` để map 1-1 theo số Phase và tên Phase.
- Toàn bộ JSON response dùng **camelCase** theo `design.md`.
- Ghi chú lỗi đã gặp và guardrail triển khai được lưu tại **`agent-notes.md`** trong cùng thư mục.
- Chính sách xóa dữ liệu: **mặc định soft delete** cho mọi thực thể nghiệp vụ; chỉ **hard delete** khi dữ liệu không cần lưu vết lịch sử/audit.

**Chú thích**

- `[ ]` chưa thực hiện
- `[x]` hoàn thành

---

## Phase 0: Nền tảng hạ tầng (Prerequisite, không có phần FE tương ứng)

- [x] **Task 0.1 (BE):** Khởi tạo workspace NestJS monorepo (Nx hoặc Turborepo) cho năm service: `auth-service`, `notification-service`, `farm-service`, `contract-service`, `monitoring-service`. Thư viện dùng chung: DTO, error filter, logger, auth guard, config module. Cấp phát PostgreSQL + InfluxDB + Redis qua Docker Compose. Thiết lập API Gateway (NestJS standalone hoặc nginx + upstream) chuyển tiếp `/api/v1/*` về service tương ứng.

---

## Phase 1: Đăng nhập qua Zalo và quản lý phiên (FR-S01)

- [x] **Task 1.1 (BE):** Triển khai `POST /api/v1/auth/login`, `POST /api/v1/auth/verify`, `POST /api/v1/auth/logout` trong `auth-service`. Xác thực `zaloAccessToken` với Zalo API, tạo/cập nhật user, phát hành JWT, lưu session vào Redis. Response dùng `{ accessToken, refreshToken, userId, role, expiresAt }` (camelCase). Hợp đồng lỗi `ErrorResponse` chuẩn với `401 UNAUTHORIZED` khi token sai.

---

## Phase 2: Hồ sơ người dùng đa vai trò (FR-T01, FR-F01 liên quan profile, FR-U*)

- [x] **Task 2.1 (BE):** Triển khai `GET /api/v1/auth/me` và `PUT /api/v1/auth/me` trả/cập nhật `UserProfileDto` với các khối con `traderProfile`, `farmerProfile`, `buyerProfile` theo role. Validate bằng `class-validator`, role-guard để chỉ chủ sở hữu sửa được profile của mình.

---

## Phase 3: Hồ sơ vườn (Farm Profile) (FR-F01, FR-T07)

- [x] **Task 3.1 (BE):** Triển khai module `farms` trong `farm-service` với `POST /api/v1/farms`, `GET /api/v1/farms` (lọc `region`, `cropType`, `ownerId`, phân trang), `GET /api/v1/farms/:id`, `PUT /api/v1/farms/:id`, `DELETE /api/v1/farms/:id` (**soft delete**). Ràng buộc: chỉ cho xóa khi không có hợp đồng `active` tham chiếu. Response theo `FarmDto` (camelCase).

---

## Phase 4: Thư viện quy trình canh tác chuẩn (FR-T10, FR-F06)

- [x] **Task 4.1 (BE):** Triển khai module `standards` trong `farm-service`: `GET /api/v1/standards` (lọc `ownerTraderId`), `GET /api/v1/standards/:id` (kèm `steps`), `POST /api/v1/standards` (chỉ trader), `PUT /api/v1/standards/:id`, `DELETE /api/v1/standards/:id` (**soft delete**). Seed sẵn VietGAP + GlobalGAP + Hữu cơ (`ownerTraderId = null`). Response theo `StandardDto`.

---

## Phase 5: Nhật ký chăm sóc + minh chứng + đồng bộ offline (FR-F05, FR-F09)

- [x] **Task 5.1 (BE):** Triển khai module `care-logs` trong `farm-service`: `GET /api/v1/farms/:id/care-logs`, `POST /api/v1/farms/:id/care-logs`, `POST /api/v1/farms/:id/care-logs/sync` (batch, idempotent theo `clientRecordId`, xử lý conflict theo `performedAt`), `POST /api/v1/farms/:id/evidence`. Phát hiện `deviation` khi `standardStepId` không khớp trình tự. Response đồng bộ theo `CareLogSyncResponse`.

---

## Phase 6: Giám sát cảm biến — latest và history (FR-F07, FR-T11, FR-U05)

- [x] **Task 6.1 (BE):** Triển khai module `sensors` trong `monitoring-service`: `GET /api/v1/monitoring/farms/:farmId/latest` (đọc Redis, fallback InfluxDB), `GET /api/v1/monitoring/farms/:farmId/history` (`from`, `to`, `interval`, `sensorType`). Trường `isImputed: boolean` rõ ràng. Phân quyền: chủ nông trại, thương lái có hợp đồng, người mua có order/hợp đồng với farm đó. Kèm WebSocket gateway `/ws/monitoring` cho `subscribe_farm` + push sự kiện `sensor_update`.

---

## Phase 7: Cảnh báo ngưỡng và acknowledge (FR-F08)

- [x] **Task 7.1 (BE):** Triển khai module `alerts` trong `monitoring-service`: `GET /api/v1/monitoring/farms/:farmId/alerts` (lọc `status`, `severity`), `POST /api/v1/monitoring/alerts/:id/acknowledge`. Khi cảm biến vượt ngưỡng → tạo alert và publish sự kiện `alert.created` lên message bus để Notification Service xử lý. Response theo `AlertDto`, kèm `suggestedAction` theo loại cảm biến.

---

## Phase 8: Kết nối nông dân — thương lái (FR-F02, FR-F03, FR-T07, FR-T08)

- [x] **Task 8.1 (BE):** Triển khai module `connections` trong `contract-service`: `GET /api/v1/traders/search` (lọc `region`, `cropType`, `trustScore`), `GET /api/v1/farmers/search`, `GET /api/v1/connections` (lọc `role=incoming|outgoing`, `status`), `POST /api/v1/connections`, `POST /api/v1/connections/:id/accept`, `POST /api/v1/connections/:id/reject`. Publish sự kiện `connection.requested` và `connection.updated` cho Notification Service.

---

## Phase 9: Chợ nông sản (sản phẩm marketplace) (FR-T03, FR-U01, FR-G03)

- [x] **Task 9.1 (BE):** Triển khai module `products` trong `contract-service`: `GET /api/v1/products` (public, lọc `cropType`, `region`, `priceMin`, `priceMax`, `traderId`), `GET /api/v1/products/:id` (public), `POST /api/v1/products` (trader), `PUT /api/v1/products/:id`, `DELETE /api/v1/products/:id` (soft delete). Response theo `ProductDto`.

---

## Phase 10: Nhu cầu mua hàng từ người mua (FR-U02, FR-T04)

- [x] **Task 10.1 (BE):** Triển khai module `buying-requests` trong `contract-service`: `GET /api/v1/buying-requests` (lọc `status`, `cropType`, `region`), `GET /api/v1/buying-requests/:id`, `POST /api/v1/buying-requests` (buyer), `PUT /api/v1/buying-requests/:id`, `DELETE /api/v1/buying-requests/:id` (**soft delete**). Response theo `BuyingRequestDto`.

---

## Phase 11: Đơn hàng và đề xuất (FR-U01, FR-U03, FR-T04, FR-T05)

- [x] **Task 11.1 (BE):** Triển khai module `orders` và `proposals` trong `contract-service`. Endpoint: `GET/POST /api/v1/orders`, `/orders/:id/accept`, `/orders/:id/reject`, `/orders/:id/cancel`; `GET/POST /api/v1/proposals`, `/proposals/:id/accept`, `/proposals/:id/reject`. Quy tắc chuyển trạng thái `pending → accepted|rejected → contracted|cancelled`. Khi `proposal.accept` hoặc `order.accept` → tạo bản ghi hợp đồng tương ứng (liên kết Phase 12).

---

## Phase 12: Hợp đồng (vòng đời contract) (FR-F04, FR-T06, FR-T09, FR-U06)

- [x] **Task 12.1 (BE):** Triển khai module `contracts` trong `contract-service`: `GET /api/v1/contracts` (lọc `role`, `status`, `from`, `to`, phân trang), `GET /api/v1/contracts/:id`, `POST /api/v1/contracts` (admin/trader thủ công). Phân biệt `contractType = farmer_trader` và `trader_buyer`. Response theo `ContractDto`. Audit log mọi thay đổi trạng thái.

---

## Phase 13: Yêu cầu thay đổi hợp đồng (FR-F05, FR-T06, FR-T09, FR-U04)

- [x] **Task 13.1 (BE):** Triển khai module `contract-change-requests` trong `contract-service`: `GET /api/v1/contracts/:id/change-requests`, `POST /api/v1/contracts/:id/change-requests`, `POST /.../change-requests/:changeId/accept`, `POST /.../change-requests/:changeId/reject`. Đặt `contract.status = pending_change` khi có yêu cầu, rollback về `active` khi `rejected`, áp dụng diff khi `accepted`. Publish sự kiện `contract.changed`.

---

## Phase 14: Đối chiếu tuân thủ quy trình (FR-T11)

- [x] **Task 14.1 (BE):** Triển khai `GET /api/v1/contracts/:id/compliance` trong `contract-service`, gọi cross-service tới `farm-service` (care logs + standard steps) và `monitoring-service` (lịch sử cảm biến). Tính `complianceScore`, liệt kê `deviations`. Cache Redis TTL 5 phút. Response theo `ComplianceDto`.

---

## Phase 15: Trung tâm thông báo (FR-F08 in-app, dùng chung)

- [x] **Task 15.1 (BE):** Triển khai module `notifications` trong `notification-service`: consumer sự kiện `alert.created`, `contract.changed`, `connection.requested`. Endpoint `GET /api/v1/notifications` (phân trang, `unreadOnly`), `POST /api/v1/notifications/:id/read`, `POST /api/v1/notifications/read-all`. Adapter gửi ZNS/OA với exponential backoff retry (tối đa 3 lần). Response theo `NotificationDto`.

---

## Phase 16: Tin tức thị trường và dự báo (FR-T12, FR-G02)

- [x] **Task 16.1 (BE):** Triển khai module `news` và `forecasts` trong `notification-service`: `GET /api/v1/news` (public, lọc `category`), `GET /api/v1/news/:id`, `POST/PUT /api/v1/news` (chỉ trader), tương tự cho `/forecasts` (lọc `region`, `type`). Response theo `NewsArticleDto`, `ForecastDto`.

---

## Phase 17: Dashboard thống kê (FR-T02 và tương đương farmer/buyer)

- [x] **Task 17.1 (BE):** Triển khai module `dashboard` trong `contract-service`: `GET /api/v1/dashboard/trader`, `GET /api/v1/dashboard/farmer`, `GET /api/v1/dashboard/buyer`. Tính từ orders/buying-requests/connections + gọi Monitoring Service cho chỉ số nông dân. Cache Redis TTL 2 phút. Response theo `DashboardTraderDto` và DTO tương ứng.

---

## Phase 18: Truy xuất nguồn gốc công khai (FR-G01)

- [x] **Task 18.1 (BE):** Triển khai `GET /api/v1/traceability/qr/:code` trong `farm-service` (**public**, bỏ qua auth guard ở whitelist Gateway). Kết hợp `FarmDto` + `StandardDto` + timeline care log + biểu đồ cảm biến (gọi Monitoring Service). Response theo `TraceabilityDto`. Rate limit chặt hơn (theo IP) vì public.

---

## Phase 19: Lịch sử giao dịch người mua (FR-U06)

- [x] **Task 19.1 (BE):** Mở rộng `GET /api/v1/orders` và `GET /api/v1/contracts` trong `contract-service` để hỗ trợ lọc `buyerId=me`, `status`, `from`, `to`, `page`, `limit`. Bổ sung trường tổng hợp tùy chọn `summary = { totalSpent, completedCount }` khi query `includeSummary=true`.

---

## Phase 20: Quality gate tích hợp cuối (hardening)

- [x] **Task 20.1 (BE):** Hoàn thiện cross-cutting: global `ExceptionFilter` map sang `ErrorResponse`, `ValidationPipe` whitelist + transform, structured log + correlation `requestId`, health check mỗi service, rate limit Gateway, audit log cho thao tác ghi, integration test (Testcontainers PostgreSQL/Redis/Influx) + e2e cho: auth flow, farm CRUD, đồng bộ care-log, acknowledge alert, order→proposal→contract, change-request hợp đồng, QR traceability, dashboard.

---

## Quy tắc quản trị

- [ ] Mọi thay đổi hợp đồng API phải cập nhật **đồng thời** `design.md` và Phase tương ứng trong **cả hai** file `tasks.md` (BE và FE).
- [ ] JSON response của mọi endpoint phải dùng **camelCase**; không trả về `snake_case`.
- [ ] Mọi endpoint publish sự kiện phải kèm luồng tới Notification Service khi tác động tới người dùng.
- [ ] Mặc định mọi endpoint `DELETE` của thực thể nghiệp vụ phải là **soft delete** (ví dụ `deletedAt`, `isDeleted`, `status=deleted`) và loại khỏi API list mặc định; chỉ dùng **hard delete** cho dữ liệu không cần lưu vết.

---

**Phiên bản:** 5.0  
**Trạng thái:** Kế hoạch BE song song theo tính năng, map 1-1 với FE, phủ 100% FR mục 4.3.1/4.3.2.
