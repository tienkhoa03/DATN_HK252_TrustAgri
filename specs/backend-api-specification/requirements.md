# Tài liệu yêu cầu — Đặc tả API Backend (phạm vi kiến trúc cốt lõi)

## Giới thiệu

Tài liệu này định nghĩa yêu cầu backend cho TrustAgri theo kiến trúc:

- **Layered Architecture** ở cấp hệ thống: Presentation → Gateway → Business Logic → Persistence.
- **Microservices** ở tầng Business Logic, giới hạn trong phạm vi cốt lõi:
  - **Core Services:** Auth Service, Notification Service
  - **Business Domain:** Farm Service, Contract Service
  - **Monitoring Domain:** Monitoring Service

Mục tiêu là đảm bảo khả năng mở rộng, xử lý đồng thời dữ liệu IoT và khả năng vận hành ổn định theo các yêu cầu phi chức năng.

## Thuật ngữ

- **Presentation Layer:** Zalo Mini App — điểm tương tác duy nhất của người dùng.
- **Gateway Layer:** API Gateway nhận request HTTPS, xác thực, định tuyến.
- **Business Logic Layer:** Các microservice xử lý nghiệp vụ.
- **Persistence Layer:** Polyglot persistence gồm PostgreSQL, InfluxDB, Redis.
- **Transactional Flow:** Luồng xử lý nghiệp vụ giao dịch của người dùng.
- **Monitoring Flow:** Luồng xử lý giám sát môi trường và cảnh báo.

## Yêu cầu căn chỉnh kiến trúc hệ thống

### Yêu cầu 1: Tuân thủ kiến trúc bốn tầng

**User Story:** Là kiến trúc sư, tôi muốn đặc tả backend tuân thủ mô hình bốn tầng để đảm bảo phân tách trách nhiệm rõ ràng.

#### Tiêu chí chấp nhận

1. THE System SHALL mô tả rõ bốn tầng Presentation, Gateway, Business Logic, Persistence trong tài liệu `design.md` và `tasks.md`.
2. THE System SHALL quy định API Gateway là cổng vào duy nhất cho các request từ Zalo Mini App.
3. THE System SHALL không định nghĩa business service nằm ngoài năm service cốt lõi trong phạm vi tài liệu này.

### Yêu cầu 2: Tuân thủ phạm vi microservice cốt lõi

**User Story:** Là nhóm phát triển, tôi muốn phạm vi service nhất quán để tránh mở rộng không kiểm soát.

#### Tiêu chí chấp nhận

1. THE System SHALL giới hạn phạm vi service trong tài liệu này: Auth, Notification, Farm, Contract, Monitoring.
2. WHEN có FR thuộc service ngoài phạm vi THEN tài liệu SHALL đánh dấu là **out-of-scope**.
3. THE System SHALL duy trì traceability giữa yêu cầu và năm service cốt lõi.

## Yêu cầu chức năng

### Yêu cầu 3: API Gateway và định tuyến

**User Story:** Là hệ thống backend, tôi cần API Gateway làm điểm truy cập duy nhất để định tuyến và bảo mật.

#### Tiêu chí chấp nhận

1. WHEN Zalo Mini App gửi request THEN API_Gateway SHALL nhận request qua HTTPS và định tuyến đến microservice tương ứng.
2. WHEN request đến API_Gateway THEN API_Gateway SHALL xác thực Access Token trong header `Authorization`.
3. WHEN Access Token không hợp lệ THEN API_Gateway SHALL trả về HTTP 401.
4. WHEN request vượt ngưỡng rate limit THEN API_Gateway SHALL trả về HTTP 429.
5. WHEN microservice timeout THEN API_Gateway SHALL trả về HTTP 503.
6. WHEN request đi qua gateway THEN hệ thống SHALL ghi `request_id`, endpoint, `status_code`, `response_time`.

### Yêu cầu 4: Auth Service — xác thực Zalo

**User Story:** Là người dùng, tôi cần xác thực bằng Zalo ID để truy cập hệ thống mà không cần tạo tài khoản mới.

#### Tiêu chí chấp nhận

1. WHEN đăng nhập lần đầu THEN Auth_Service SHALL xác thực token với Zalo API và tạo user.
2. WHEN user đã tồn tại THEN Auth_Service SHALL cập nhật `lastLogin` và trả về ngữ cảnh user.
3. WHEN user chưa có vai trò THEN role mặc định SHALL là `guest`.
4. WHEN đăng xuất THEN Auth_Service SHALL vô hiệu hóa session trong Redis.
5. WHEN API_Gateway gọi verify THEN Auth_Service SHALL cung cấp endpoint verify token với phản hồi nhanh.

### Yêu cầu 5: Farm Service — quản lý hồ sơ vườn

**User Story:** Là nông dân, tôi cần quản lý hồ sơ vườn để giới thiệu năng lực sản xuất và theo dõi canh tác.

#### Tiêu chí chấp nhận

1. WHEN tạo Farm Lab THEN Farm_Service SHALL lưu tên, vị trí, diện tích, loại cây, tiêu chuẩn vào PostgreSQL.
2. WHEN cập nhật Farm Lab THEN Farm_Service SHALL validate dữ liệu và cập nhật nhật ký thay đổi.
3. WHEN lấy danh sách Farm Lab THEN Farm_Service SHALL hỗ trợ phân trang và lọc theo tiêu chí cần thiết.
4. WHEN xóa Farm Lab THEN Farm_Service SHALL kiểm tra ràng buộc hợp đồng đang active trước khi xóa.

### Yêu cầu 6: Farm Service — nhật ký chăm sóc và minh chứng

**User Story:** Là nông dân, tôi cần cập nhật hành động chăm sóc và minh chứng để đối chiếu với quy trình đã cam kết.

#### Tiêu chí chấp nhận

1. WHEN ghi care log THEN Farm_Service SHALL lưu `action`, `notes`, `timestamp` và liên kết bước quy trình.
2. WHEN thêm evidence THEN Farm_Service SHALL lưu thông tin `fileUrl` và liên kết `care_log`.
3. WHEN đồng bộ dữ liệu offline THEN Farm_Service SHALL xử lý conflict theo `timestamp`.
4. WHEN care log lệch quy trình THEN Farm_Service SHALL đánh dấu `deviation` để phục vụ kiểm soát tuân thủ.

### Yêu cầu 7: Monitoring Service — xử lý dữ liệu cảm biến

**User Story:** Là hệ thống, tôi cần xử lý dữ liệu cảm biến thời gian thực để hiển thị dashboard và đánh giá rủi ro.

#### Tiêu chí chấp nhận

1. WHEN dữ liệu cảm biến được publish THEN Monitoring_Service SHALL xử lý và lưu vào InfluxDB.
2. WHEN có dữ liệu mới THEN Monitoring_Service SHALL cập nhật Redis latest state.
3. WHEN dữ liệu là imputed THEN Monitoring_Service SHALL đánh dấu `isImputed` (JSON camelCase theo `design.md`).
4. WHEN client request dữ liệu latest THEN Monitoring_Service SHALL ưu tiên đọc Redis để giảm độ trễ.

### Yêu cầu 8: Monitoring Service — cảnh báo ngưỡng

**User Story:** Là nông dân/thương lái, tôi cần cảnh báo vượt ngưỡng để xử lý kịp thời.

#### Tiêu chí chấp nhận

1. WHEN chỉ số vượt ngưỡng THEN Monitoring_Service SHALL tạo alert `warning` / `danger`.
2. WHEN alert được tạo THEN Monitoring_Service SHALL publish sự kiện `alert.created`.
3. WHEN user acknowledge alert THEN Monitoring_Service SHALL cập nhật trạng thái acknowledged.
4. WHEN cần gửi thông báo THEN Notification_Service SHALL nhận sự kiện và gửi kênh Zalo.

### Yêu cầu 9: Monitoring Service — thời gian thực và lịch sử

**User Story:** Là người dùng, tôi cần xem dữ liệu mới nhất và lịch sử để phân tích xu hướng.

#### Tiêu chí chấp nhận

1. WHEN client subscribe farm THEN Monitoring_Service SHALL xác thực quyền truy cập và push dữ liệu qua WebSocket.
2. WHEN truy vấn lịch sử THEN Monitoring_Service SHALL hỗ trợ khoảng thời gian, loại cảm biến, interval aggregation.
3. WHEN truy vấn lịch sử phức tạp THEN Monitoring_Service SHALL cache kết quả trên Redis với TTL phù hợp.

### Yêu cầu 10: Contract Service — đơn hàng, đề xuất, hợp đồng

**User Story:** Là người mua và thương lái, tôi cần quản lý đơn hàng, đề xuất và hợp đồng để khớp nối giao dịch.

#### Tiêu chí chấp nhận

1. WHEN người mua tạo order THEN Contract_Service SHALL lưu order với trạng thái phù hợp.
2. WHEN thương lái gửi proposal THEN Contract_Service SHALL lưu proposal và cho phép buyer phản hồi.
3. WHEN proposal được chấp nhận THEN Contract_Service SHALL tạo/cập nhật lifecycle order–hợp đồng nhất quán.
4. WHEN hợp đồng thay đổi THEN Contract_Service SHALL lưu lịch sử thay đổi và cập nhật trạng thái.

### Yêu cầu 11: Contract Service — kết nối nông dân–thương lái

**User Story:** Là nông dân và thương lái, tôi cần tìm kiếm và quản lý kết nối hợp tác.

#### Tiêu chí chấp nhận

1. WHEN tìm kiếm đối tác THEN Contract_Service SHALL hỗ trợ lọc theo khu vực, loại cây (`cropType`), điểm tín nhiệm (`trustScore`).
2. WHEN gửi/chấp nhận/từ chối kết nối THEN Contract_Service SHALL cập nhật trạng thái request và ghi audit.
3. WHEN trạng thái kết nối thay đổi THEN hệ thống SHALL có sự kiện để thông báo phía liên quan.

### Yêu cầu 12: Notification Service — đa kênh gửi tin

**User Story:** Là người dùng, tôi cần nhận thông báo kịp thời từ các sự kiện quan trọng.

#### Tiêu chí chấp nhận

1. WHEN Notification_Service nhận sự kiện THEN Notification_Service SHALL xác định người nhận và kênh gửi.
2. WHEN gửi thất bại THEN Notification_Service SHALL retry theo exponential backoff.
3. WHEN user xem danh sách notification THEN Notification_Service SHALL trả về danh sách có trạng thái unread/read.
4. WHEN user đánh dấu đã đọc THEN Notification_Service SHALL cập nhật `readAt`.

## Yêu cầu phi chức năng

### Yêu cầu 13: Polyglot persistence

**User Story:** Là kiến trúc sư, tôi cần tối ưu lưu trữ theo loại dữ liệu để đảm bảo hiệu năng.

#### Tiêu chí chấp nhận

1. THE System SHALL dùng PostgreSQL cho dữ liệu giao dịch và nghiệp vụ có cấu trúc.
2. THE System SHALL dùng InfluxDB cho dữ liệu chuỗi thời gian từ cảm biến.
3. THE System SHALL dùng Redis cho cache và trạng thái thời gian thực.

### Yêu cầu 14: Khả năng mở rộng và đồng thời

**User Story:** Là hệ thống, tôi cần mở rộng khi lưu lượng IoT và request người dùng tăng.

#### Tiêu chí chấp nhận

1. WHEN traffic tăng THEN Gateway và các service SHALL hỗ trợ scale ngang.
2. WHEN có nhiều kết nối thời gian thực THEN Monitoring_Service SHALL duy trì độ trễ thấp theo mục tiêu hệ thống.
3. WHEN backlog sự kiện tăng THEN kiến trúc consumer SHALL cho phép tăng workers.

### Yêu cầu 15: Sẵn sàng và đồng bộ offline

**User Story:** Là nông dân, tôi cần tiếp tục thao tác khi mất mạng và đồng bộ lại sau đó.

#### Tiêu chí chấp nhận

1. WHEN client offline THEN dữ liệu care log SHALL được xếp hàng để đồng bộ sau.
2. WHEN kết nối hồi phục THEN hệ thống SHALL đồng bộ theo thứ tự thời gian và xử lý conflict.
3. WHEN đồng bộ thất bại THEN client SHALL có cơ chế retry và thông báo trạng thái.

### Yêu cầu 16: Bảo mật, audit và quyền riêng tư

**User Story:** Là quản trị viên, tôi cần đảm bảo dữ liệu và truy cập được bảo vệ.

#### Tiêu chí chấp nhận

1. THE System SHALL bảo vệ dữ liệu truyền tải bằng HTTPS/TLS.
2. THE System SHALL che thông tin nhạy cảm trong log.
3. THE System SHALL duy trì audit log cho các hành động quan trọng.
4. THE System SHALL hỗ trợ thu hồi token và kiểm soát truy cập theo vai trò.

### Yêu cầu 17: Khả năng quan sát và vận hành

**User Story:** Là DevOps, tôi cần theo dõi sức khỏe hệ thống để vận hành ổn định.

#### Tiêu chí chấp nhận

1. Mỗi service SHALL có endpoint health check.
2. Hệ thống SHALL thu thập metrics và log có cấu trúc.
3. Hệ thống SHALL hỗ trợ backup/recovery cho datastore chính theo chính sách vận hành.

### Yêu cầu 18: Traceability và kiểm soát phạm vi

**User Story:** Là nhóm dự án, tôi cần traceability rõ ràng để đảm bảo tài liệu và triển khai đồng bộ.

#### Tiêu chí chấp nhận

1. `requirements`, `design`, `tasks` SHALL nhất quán với phạm vi service cốt lõi.
2. Mọi thay đổi ngoài phạm vi SHALL được đánh dấu **out-of-scope** trong tài liệu, không đưa vào kế hoạch triển khai hiện tại.
