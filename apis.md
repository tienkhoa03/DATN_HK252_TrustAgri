# TrustAgri — Danh sách API backend đã hiện thực

Tài liệu được sinh từ các `@Controller` trong `be/apps/*`. Toàn bộ HTTP handler (trừ health check) dùng tiền tố **`/api/v1`** (`applyTrustagriHttpStack` trong `@trustagri/shared`). **`GET /health`** không có tiền tố `api/v1` (được exclude khỏi global prefix).

Mỗi service chạy cổng riêng khi dev (tham chiếu `main.ts` / biến môi trường): auth **3001**, notification **3002**, farm **3003**, contract **3004**, monitoring **3005**. Production thường gộp qua API Gateway — đường dẫn tương đối giữ nguyên.

---

## Auth Service (`be/apps/auth-service`)

| Method | Path | Mô tả ngắn |
|--------|------|------------|
| GET | `/health` | Kiểm tra sức khỏe service + PostgreSQL (Terminus). |
| POST | `/api/v1/auth/login` | Đăng nhập Zalo (`zaloAccessToken`), phát hành JWT + session Redis. |
| POST | `/api/v1/auth/password-login` | Đăng nhập username/password (bật khi `AUTH_PASSWORD_LOGIN_ENABLED=true`). |
| POST | `/api/v1/auth/dev-login` | JWT dev (bật khi `AUTH_DEV_LOGIN_ENABLED`, giới hạn IP/secret). |
| POST | `/api/v1/auth/verify` | Xác thực JWT + session Redis. |
| POST | `/api/v1/auth/logout` | Thu hồi session Redis / đăng xuất. |
| GET | `/api/v1/auth/me` | Hồ sơ người dùng hiện tại (`UserProfileDto`). |
| PUT | `/api/v1/auth/me` | Cập nhật hồ sơ của chính user đăng nhập. |

---

## Farm Service (`be/apps/farm-service`)

| Method | Path | Mô tả ngắn |
|--------|------|------------|
| GET | `/health` | Health check service + DB. |
| POST | `/api/v1/farms` | Tạo vườn (farmer). |
| GET | `/api/v1/farms` | Danh sách vườn (lọc, phân trang). |
| GET | `/api/v1/farms/:id` | Chi tiết một vườn. |
| PUT | `/api/v1/farms/:id` | Cập nhật vườn (chủ vườn). |
| DELETE | `/api/v1/farms/:id` | Xóa vườn (chủ vườn, có điều kiện nghiệp vụ). |
| GET | `/api/v1/standards` | Danh sách tiêu chuẩn canh tác (lọc `ownerTraderId`). |
| GET | `/api/v1/standards/:id` | Chi tiết tiêu chuẩn kèm bước (steps). |
| POST | `/api/v1/standards` | Tạo tiêu chuẩn (trader). |
| PUT | `/api/v1/standards/:id` | Cập nhật tiêu chuẩn (trader sở hữu). |
| DELETE | `/api/v1/standards/:id` | Xóa mềm tiêu chuẩn (trader sở hữu). |
| GET | `/api/v1/farms/:farmId/care-logs` | Danh sách nhật ký chăm sóc (phân trang). |
| POST | `/api/v1/farms/:farmId/care-logs` | Tạo nhật ký chăm sóc (chủ vườn). |
| POST | `/api/v1/farms/:farmId/care-logs/sync` | Đồng bộ batch offline (conflict theo thời gian). |
| POST | `/api/v1/farms/:farmId/evidence` | Lưu metadata minh chứng (ảnh đã upload). |
| GET | `/api/v1/farms/:farmId/care-plan/today` | Kế hoạch chăm sóc trong ngày. |
| POST | `/api/v1/farms/:farmId/care-plan/tasks/:standardStepId/complete` | Đánh dấu hoàn thành một bước trong kế hoạch. |
| GET | `/api/v1/traceability/qr/:code` | **Public** — tra cứu truy xuất theo mã QR (không JWT). |

---

## Contract Service (`be/apps/contract-service`)

| Method | Path | Mô tả ngắn |
|--------|------|------------|
| GET | `/health` | Health check service + DB. |
| GET | `/api/v1/traders/search` | Tìm thương lái (region, crop, trust score…). |
| GET | `/api/v1/farmers/search` | Tìm nông dân / nguồn cung. |
| GET | `/api/v1/connections` | Danh sách kết nối (incoming/outgoing, status). |
| POST | `/api/v1/connections` | Gửi yêu cầu kết nối (farmer/trader). |
| POST | `/api/v1/connections/:id/accept` | Chấp nhận kết nối. |
| POST | `/api/v1/connections/:id/reject` | Từ chối kết nối. |
| POST | `/api/v1/connections/:id/negotiate` | Chuyển sang đàm phán (accepted → negotiating). |
| POST | `/api/v1/connections/:id/sign` | Xác nhận ký hợp tác (negotiating → signed). |
| GET | `/api/v1/products` | **Public** — danh sách sản phẩm chợ. |
| GET | `/api/v1/products/:id` | **Public** — chi tiết sản phẩm. |
| POST | `/api/v1/products` | Tạo sản phẩm (trader). |
| PUT | `/api/v1/products/:id` | Cập nhật sản phẩm (trader chủ sở hữu). |
| DELETE | `/api/v1/products/:id` | Xóa mềm sản phẩm (trader chủ sở hữu). |
| GET | `/api/v1/buying-requests` | Danh sách nhu cầu mua (buyer/trader). |
| GET | `/api/v1/buying-requests/:id` | Chi tiết nhu cầu mua. |
| POST | `/api/v1/buying-requests` | Tạo nhu cầu mua (buyer). |
| PUT | `/api/v1/buying-requests/:id` | Cập nhật (buyer chủ sở hữu). |
| DELETE | `/api/v1/buying-requests/:id` | Xóa mềm (buyer chủ sở hữu). |
| GET | `/api/v1/orders` | Danh sách đơn (buyer/trader). |
| GET | `/api/v1/orders/:id` | Chi tiết đơn. |
| POST | `/api/v1/orders` | Buyer đặt mua từ sản phẩm marketplace. |
| POST | `/api/v1/orders/:id/accept` | Trader xác nhận đơn → tạo hợp đồng. |
| POST | `/api/v1/orders/:id/reject` | Trader từ chối đơn. |
| POST | `/api/v1/orders/:id/cancel` | Buyer hủy đơn (trước khi xác nhận). |
| GET | `/api/v1/proposals` | Danh sách đề xuất (buyer/trader). |
| POST | `/api/v1/proposals` | Trader gửi đề xuất cho buying request. |
| POST | `/api/v1/proposals/:id/accept` | Buyer chấp nhận → tạo hợp đồng. |
| POST | `/api/v1/proposals/:id/reject` | Buyer từ chối đề xuất. |
| GET | `/api/v1/contracts` | Danh sách hợp đồng (lọc role, status, thời gian). |
| GET | `/api/v1/contracts/:id/audit-logs` | Nhật ký thay đổi trạng thái hợp đồng. |
| GET | `/api/v1/contracts/:id/compliance` | Đối chiếu tuân thủ quy trình so với nhật ký / tiêu chuẩn. |
| GET | `/api/v1/contracts/:id` | Chi tiết hợp đồng. |
| POST | `/api/v1/contracts` | Tạo hợp đồng thủ công (trader/admin). |
| GET | `/api/v1/contracts/:id/change-requests` | Danh sách yêu cầu chỉnh sửa hợp đồng. |
| POST | `/api/v1/contracts/:id/change-requests` | Tạo yêu cầu thay đổi điều khoản. |
| POST | `/api/v1/contracts/:id/change-requests/:changeId/accept` | Chấp nhận yêu cầu thay đổi. |
| POST | `/api/v1/contracts/:id/change-requests/:changeId/reject` | Từ chối yêu cầu thay đổi. |
| GET | `/api/v1/dashboard/trader` | Dashboard tổng hợp cho thương lái. |
| GET | `/api/v1/dashboard/farmer` | Dashboard tổng hợp cho nông dân. |
| GET | `/api/v1/dashboard/buyer` | Dashboard tổng hợp cho người mua. |
| POST | `/api/v1/traders/:traderId/reviews` | Buyer tạo đánh giá thương lái. |
| GET | `/api/v1/traders/:traderId/reviews` | Danh sách đánh giá của một thương lái. |
| GET | `/api/v1/traders/:traderId/trust-score` | Điểm tin cậy (trust score) thương lái. |
| PATCH | `/api/v1/reviews/:id` | Cập nhật đánh giá (theo quyền sở hữu). |
| DELETE | `/api/v1/reviews/:id` | Xóa đánh giá (theo quyền sở hữu). |

---

## Monitoring Service (`be/apps/monitoring-service`)

| Method | Path | Mô tả ngắn |
|--------|------|------------|
| GET | `/health` | Health check service + DB/indicators. |
| GET | `/api/v1/monitoring/farms/:farmId/latest` | Snapshot mới nhất cảm biến (Redis / fallback InfluxDB). |
| GET | `/api/v1/monitoring/farms/:farmId/history` | Chuỗi thời gian đọc cảm biến (`from`/`to`/interval…). |
| GET | `/api/v1/monitoring/farms/:farmId/alerts` | Danh sách cảnh báo theo vườn (lọc, phân trang). |
| POST | `/api/v1/monitoring/alerts/:id/acknowledge` | Đánh dấu đã xử lý / đã xem cảnh báo. |
| GET | `/api/v1/monitoring/farms/:farmId/devices` | Danh sách thiết bị IoT gắn vườn. |
| POST | `/api/v1/monitoring/farms/:farmId/devices` | Đăng ký thiết bị IoT cho vườn. |
| PATCH | `/api/v1/monitoring/devices/:id` | Cập nhật thiết bị. |
| DELETE | `/api/v1/monitoring/devices/:id` | Xóa mềm thiết bị. |
| GET | `/api/v1/monitoring/traceability/farms/:farmId/sensor-chart` | **Public** (guard nội bộ) — dữ liệu biểu đồ cảm biến cho trang QR truy xuất. |

---

## Notification Service (`be/apps/notification-service`)

| Method | Path | Mô tả ngắn |
|--------|------|------------|
| GET | `/health` | Health check service + DB. |
| GET | `/api/v1/notifications` | Danh sách thông báo của user (phân trang, lọc). |
| POST | `/api/v1/notifications/read-all` | Đánh dấu đã đọc toàn bộ. |
| POST | `/api/v1/notifications/:id/read` | Đánh dấu đã đọc một thông báo. |
| GET | `/api/v1/forecasts` | **Public** — danh sách dự báo thị trường / giá. |
| POST | `/api/v1/forecasts` | Tạo bản ghi dự báo (trader). |
| PUT | `/api/v1/forecasts/:id` | Cập nhật dự báo (trader). |
| GET | `/api/v1/news` | **Public** — danh sách tin tức / thị trường. |
| GET | `/api/v1/news/:id` | **Public** — chi tiết bài tin. |
| POST | `/api/v1/news` | Tạo bài tin (trader). |
| PUT | `/api/v1/news/:id` | Cập nhật bài tin (trader). |

---

## Ghi chú phụ trợ

- **JWT & vai trò**: Hầu hết route dùng `JwtAuthGuard` + `RolesGuard` toàn cục; các endpoint đánh dấu **Public** trong bảng bỏ qua JWT cho GET/POST tương ứng (hoặc chỉ một phần method như `forecasts`/`news`).
- **Health**: Mỗi service có `GET /health` riêng khi gọi trực tiếp cổng service; qua gateway có thể chuẩn hóa một đường health duy nhất.
- **Cập nhật**: Khi thêm controller mới, đồng bộ lại file này hoặc sinh tự động từ OpenAPI nếu sau này có spec Swagger.
