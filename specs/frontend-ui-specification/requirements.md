# Tài liệu yêu cầu — Kết nối ứng dụng Frontend (routing và API)

## Giới thiệu

Đặc tả này định nghĩa yêu cầu cho **giai đoạn phát triển tiếp theo** của frontend TrustAgri Zalo Mini App: **routing kiểu production** giữa các màn hình (thay mô hình hub demo) và **thay dữ liệu mock trong component bằng tích hợp API thật**, đồng thời giữ quy ước đã hoàn thành trong:

- **`fe/specs/screen-folder-refactoring`** — thư mục theo tính năng `src/screens/{buyer,farmer,guest,trader}/<kebab-feature>/`, tên file màn hình PascalCase, barrel `index.ts`.
- **`fe/specs/zalo-ui-design-system`** — UX gần gũi Zalo, design token (`src/design-system`), Zaui (`zmp-ui`), ràng buộc hiệu năng và khả năng tiếp cận.

Hợp đồng backend và thứ tự giao hàng nằm trong **`specs/backend-api-specification/design.md`**; có thể căn chỉnh với **`specs/backend-api-specification/tasks.md`**.

## Thuật ngữ

- **Màn hình production:** component màn chính (ví dụ `BuyerMarketplaceScreen.tsx`) không hậu tố `.demo` / `.example`, dùng trong điều hướng phát hành.
- **Màn hình demo:** `*.demo.tsx` cho demo tách biệt và hub cũ trong `src/pages/index.tsx`.
- **ZMP Router:** routing khai báo bằng `ZMPRouter`, `AnimationRoutes`, `Route` từ `zmp-ui` (không dùng `react-router-dom` làm router chính trừ khi có phê duyệt rõ cho build không-ZMP).
- **Tầng API:** instance Axios dùng chung, interceptor và module service kiểu trong `src/api` và `src/services`.
- **Role:** `farmer` | `trader` | `buyer` | `guest` — ánh xạ nhóm route và phân quyền.
- **Gateway:** một `baseURL` HTTP cho tiền tố `/api/v1` do API Gateway công bố.

## Yêu cầu

### Yêu cầu 1: Routing production với ZMP Router

**User Story:** Là người dùng, tôi muốn điều hướng giữa các màn chính bằng URL ổn định và chuyển cảnh nhất quán với Zalo Mini App để ứng dụng giống sản phẩm hoàn chỉnh chứ không phải bộ chọn màn cho developer.

#### Tiêu chí chấp nhận

1. THE System SHALL khai báo route ứng dụng chính bằng `ZMPRouter` và `Route` từ `zmp-ui` trong `src/components/layout.tsx` (hoặc module router riêng được import tại đó).
2. THE System SHALL đăng ký ít nhất một route **home theo role** (guest, buyer, farmer, trader) và route lồng / anh em cho luồng chính (marketplace, dashboard, profile, …) như **bảng route trong tài liệu thiết kế**.
3. WHEN điều hướng giữa các route THEN THE System SHALL giữ hành vi chuyển cảnh native Zalo qua `AnimationRoutes` trừ khi có ngoại lệ được ghi rõ.
4. THE System SHALL NOT dùng `react-router-dom` làm router chính cho build ZMP nếu không có ADR trong thư mục spec này.

### Yêu cầu 2: Điểm vào phù hợp role và deep link

**User Story:** Là người dùng có role cụ thể, tôi muốn app mở đúng trải nghiệm home và hỗ trợ deep link tới màn quan trọng khi nền tảng cho phép, để bookmark và thông báo trỏ đúng view.

#### Tiêu chí chấp nhận

1. WHEN ứng dụng xác định role người đã xác thực THEN THE System SHALL điều hướng hoặc redirect tới đường dẫn home tương ứng role.
2. THE System SHALL hỗ trợ tham số query hoặc path cho màn **theo tài nguyên** (ví dụ `productId`, `farmId`, mã QR) theo tài liệu thiết kế.
3. WHEN người mở route không được phép THEN THE System SHALL hiển thị trải nghiệm forbidden / redirect nhất quán (không màn trắng).

### Yêu cầu 3: Tách hub demo developer

**User Story:** Là developer, tôi muốn launcher demo nội bộ vẫn dùng được mà không làm ô nhiễm mô hình điều hướng production.

#### Tiêu chí chấp nhận

1. THE System SHALL chuyển hub legacy «chọn màn demo» khỏi trải nghiệm `/` duy nhất sang route **chỉ dev** (ví dụ `/dev/screens`) hoặc cổng tương đương.
2. WHEN build production (hoặc `NODE_ENV === 'production'`) THEN THE System SHALL ẩn hoặc tắt hub dev trừ khi feature flag bật rõ.
3. THE System SHALL lazy-load `*.demo.tsx` chỉ từ route dev hoặc điểm vào kiểu Storybook, không từ route production chính.

### Yêu cầu 4: HTTP client và header xác thực

**User Story:** Là developer, tôi muốn một HTTP client dùng chung có interceptor để mọi service gắn JWT và xử lý lỗi nhất quán.

#### Tiêu chí chấp nhận

1. THE System SHALL cung cấp instance Axios dùng chung với `baseURL` cấu hình qua `import.meta.env.VITE_*`.
2. THE System SHALL gắn `Authorization: Bearer <token>` cho request cần bảo vệ theo luồng auth ZMP / backend.
3. WHEN server trả `401 Unauthorized` THEN THE System SHALL xóa trạng thái phiên và điều hướng hoặc nhắc đăng nhập lại theo tài liệu thiết kế.
4. THE System SHALL parse lỗi API có cấu trúc (`error.code`, `message`, `requestId`) theo **`specs/backend-api-specification/design.md`**.

### Yêu cầu 5: UX lỗi và loading toàn cục

**User Story:** Là người dùng, tôi muốn phản hồi rõ khi request lỗi hoặc đang chạy, phù hợp mẫu Zalo UI.

#### Tiêu chí chấp nhận

1. THE System SHALL hiển thị lỗi API qua `SnackbarProvider` / mẫu Zaui đã dùng trong `layout.tsx` (hoặc wrapper mỏng), với nội dung tiếng Việt cho mã thường gặp (400, 401, 403, 404, 429, 503).
2. WHEN gặp `429` THEN THE System SHALL hiển thị thông báo thân thiện, không vòng lặp retry tự động vô hạn.
3. THE System SHALL hiển thị trạng thái loading trên view dữ liệu chính (skeleton, spinner hoặc vô hiệu hóa hành động) mà không chặn toàn bộ Mini App trừ khi có lý do.

### Yêu cầu 6: Dữ liệu miền Farm trên màn nông dân

**User Story:** Là nông dân, tôi muốn hồ sơ vườn và nhật ký chăm sóc phản ánh dữ liệu server để bản ghi khớp backend.

#### Tiêu chí chấp nhận

1. THE System SHALL tải chi tiết vườn qua `GET /api/v1/farms/:id` (và danh sách qua `GET /api/v1/farms` khi áp dụng) cho `FarmerFarmProfileScreen` và luồng liên quan.
2. THE System SHALL tải và thay đổi care log qua `POST /api/v1/farms/:id/care-logs` và `POST /api/v1/farms/:id/care-logs/sync` theo thiết kế backend.
3. THE System SHALL gỡ hoặc khóa dữ liệu vườn / thiết bị hardcode mặc định khi đã có dữ liệu API, vẫn giữ fallback UI cho trạng thái rỗng theo design system.

### Yêu cầu 7: Giám sát và cảnh báo trên dashboard

**User Story:** Là nông dân (và role khác khi áp dụng), tôi muốn tóm tắt cảm biến trực tiếp và cảnh báo từ Monitoring Service để biểu đồ môi trường khớp thực tế.

#### Tiêu chí chấp nhận

1. THE System SHALL lấy đọc mới nhất qua `GET /api/v1/monitoring/farms/:farmId/latest` cho widget đang dùng mock cảm biến.
2. THE System SHALL lấy lịch sử biểu đồ qua `GET /api/v1/monitoring/farms/:farmId/history` với query đã ghi trong spec backend.
3. THE System SHALL liệt kê và acknowledge cảnh báo qua `GET /api/v1/monitoring/farms/:farmId/alerts` và `POST /api/v1/monitoring/alerts/:id/acknowledge`.
4. WHEN có cập nhật WebSocket THEN THE System MAY đăng ký theo hợp đồng backend và gộp vào state client mà không phá vỡ render REST-first.

### Yêu cầu 8: Luồng hợp đồng, marketplace và truy xuất khách

**User Story:** Là người mua, thương lái hoặc khách, tôi muốn đơn hàng, sản phẩm, đề xuất, kết nối và truy xuất dùng dữ liệu backend.

#### Tiêu chí chấp nhận

1. THE System SHALL tích hợp `BuyerPostBuyingRequestScreen` với `POST /api/v1/orders` và endpoint danh sách liên quan khi backend đã công bố.
2. THE System SHALL tích hợp màn danh sách / chi tiết sản phẩm với `GET /api/v1/products` và `GET /api/v1/products/:id` theo thiết kế backend.
3. THE System SHALL tích hợp truy xuất khách với `GET /api/v1/traceability/qr/:code` (public, không auth).
4. THE System SHALL tích hợp kết nối thị trường nông dân với `GET /api/v1/traders/search` và endpoint kết nối (`POST /api/v1/connections`, luồng chấp nhận) theo backend.
5. WHERE đường REST «danh sách hợp đồng / đơn theo user» chưa chốt THEN THE System SHALL ghi khoảng trống trong `tasks.md` và phối hợp spec backend trước khi tự đặt URL.

### Yêu cầu 9: Thông báo

**User Story:** Là người mua, tôi muốn trung tâm thông báo phản ánh trạng thái server.

#### Tiêu chí chấp nhận

1. THE System SHALL thay mảng thông báo hardcode trong `BuyerProfileNotificationScreen` bằng `GET /api/v1/notifications` và `POST /api/v1/notifications/:id/read` khi Notification Service sẵn sàng.
2. THE System SHALL giữ style chưa đọc bằng design token (Agri Green / Zalo Blue / Warning theo **zalo-ui-design-system**).

### Yêu cầu 10: Quy ước quản lý state

**User Story:** Là developer, tôi muốn sở hữu state rõ ràng cho auth và snapshot realtime dùng chung.

#### Tiêu chí chấp nhận

1. THE System SHALL lưu trường phiên (token, `userId`, `role`, profile) bằng **Jotai** atoms (đã có trong `package.json`) hoặc ghi rõ lộ trình thay thế.
2. THE System MAY dùng `@tanstack/react-query` cho cache server; nếu dùng THEN THE System SHALL ghi quy ước query key trong tài liệu thiết kế.
3. THE System SHALL tránh nhân đôi cùng một thực thể server ở nhiều global store không liên quan mà không có chiến lược invalidate.

### Yêu cầu 11: Tuân thủ thư mục màn hình và export

**User Story:** Là developer, tôi muốn file router và service mới tuân thủ refactor thư mục đã hoàn thành.

#### Tiêu chí chấp nhận

1. WHEN import màn trong router THEN THE System SHALL import từ barrel `src/screens/<role>/<feature>/` hoặc đường dẫn rõ ràng khớp **`fe/specs/screen-folder-refactoring`**.
2. THE System SHALL giữ tên file component **PascalCase** và thư mục tính năng **kebab-case** cho mọi thư mục tính năng mới.
3. THE System SHALL không chuyển màn hình về cấu trúc phẳng theo role.

### Yêu cầu 12: Tuân thủ design system Zalo UI

**User Story:** Là người dùng, tôi muốn màn gắn API vẫn nhất quán hình vi và giao diện với design system.

#### Tiêu chí chấp nhận

1. WHEN sửa màn để nối dữ liệu THEN THE System SHALL dùng primitive design-system (`src/design-system/components`, token) theo **`fe/specs/zalo-ui-design-system`**.
2. THE System SHALL không làm giảm khả năng tiếp cận (body tối thiểu 14px, vùng chạm 44×44 khi spec yêu cầu).
3. THE System SHALL giữ lazy load có ý thức bundle cho route nặng theo mục tiêu hiệu năng design system.

### Yêu cầu 13: Kiểm thử tự động cho lớp kết nối

**User Story:** Là người bảo trì, tôi muốn regression test cho header auth, mapper và điều hướng quan trọng.

#### Tiêu chí chấp nhận

1. THE System SHALL thêm unit test cho mapper API và parse lỗi dưới `src/services` hoặc `src/api` (Jest đã cấu hình).
2. THE System SHALL thêm ít nhất một smoke test Playwright (hoặc E2E chuẩn dự án) «mở app → route home theo role» khi routing ổn định.
3. THE System SHALL ghi cách chạy test trong tài liệu thiết kế hoặc `README` gốc nếu chưa có.

### Yêu cầu 14: Traceability phủ chức năng mục 4.3

**User Story:** Là nhóm sản phẩm, chúng tôi muốn traceability rõ từ US/FR hệ thống tới màn, service và endpoint để không sót luồng khi triển khai.

#### Tiêu chí chấp nhận

1. THE System SHALL duy trì ma trận traceability trong `design.md` / `tasks.md` liên kết `US-F*`, `US-T*`, `US-U*`, `US-G*` và `FR-*` tới route, màn, hàm service và endpoint backend.
2. WHEN thiếu endpoint backend bắt buộc THEN THE System SHALL đánh dấu `BE-GAP` trong `tasks.md` kèm owner và hành vi UI tạm (mock / chỉ đọc / tắt).
3. THE System SHALL phủ các module người dùng mục 4.3.2: Nông dân, Thương lái, Người mua, Khách và lõi auth.

### Yêu cầu 15: Hoàn thiện UX module Nông dân (FR-F01…FR-F09)

**User Story:** Là nông dân, tôi muốn đủ use case cốt lõi trên điều hướng production và luồng dữ liệu, không chỉ mock trên dashboard.

#### Tiêu chí chấp nhận

1. THE System SHALL nối route và màn: hồ sơ vườn, kết nối thị trường, hợp đồng, nhật ký quy trình, dashboard giám sát.
2. THE System SHALL hỗ trợ UI danh sách hợp đồng và xử lý thay đổi hợp đồng khi endpoint backend sẵn sàng.
3. THE System SHALL hiển thị tiêu chuẩn quy trình và luồng minh chứng với fallback khi chưa có dịch vụ Media.
4. THE System SHALL phản ánh nội dung cảnh báo + gợi ý hành động từ payload backend (hoặc fallback tạm đã ghi trong spec).

### Yêu cầu 16: Hoàn thiện UX module Thương lái (FR-T01…FR-T12)

**User Story:** Là thương lái, tôi muốn profile, dashboard, tiêu chuẩn, điều phối nguồn và đăng tin thị trường khớp yêu cầu chức năng hệ thống.

#### Tiêu chí chấp nhận

1. THE System SHALL có màn/route quản lý profile thương lái và nối khi có API profile.
2. THE System SHALL nối CRUD thư viện tiêu chuẩn tới endpoint `/standards*` (hoặc đánh dấu `BE-GAP` rõ ràng).
3. THE System SHALL hỗ trợ tiếp nhận nhu cầu người mua, phản hồi đề xuất và xử lý kết nối nguồn trong luồng thương lái.
4. THE System SHALL có giao diện đăng tin / thị trường thương lái khớp API nội dung và quyền.

### Yêu cầu 17: Hoàn thiện UX module Người mua (FR-U01…FR-U06)

**User Story:** Là người mua, tôi muốn đủ vòng đời mua từ tìm kiếm tới đặt trước và theo dõi lịch sử.

#### Tiêu chí chấp nhận

1. THE System SHALL hỗ trợ duyệt/tìm sản phẩm, chi tiết, tạo yêu cầu/đặt trước, chấp nhận/từ chối đề xuất và theo dõi đơn.
2. THE System SHALL hỗ trợ đăng nhu cầu mua (`FR-U02`) và xem phản hồi thương lái khi API sẵn sàng.
3. THE System SHALL hỗ trợ route/view lịch sử giao dịch (`FR-U06`) với phân trang và lọc khi API danh sách ổn định.
4. THE System SHALL hỗ trợ UI đàm phán thay đổi hợp đồng cho quản lý đặt cọc (`FR-U04`) khi API sẵn sàng.

### Yêu cầu 18: Tính năng Khách và công khai (FR-G01…FR-G03)

**User Story:** Là khách, tôi muốn khám phá sản phẩm và xác minh nguồn gốc nhanh mà không cần đăng nhập.

#### Tiêu chí chấp nhận

1. THE System SHALL có điểm vào truy xuất public với tham số đường dẫn mã QR và trạng thái lỗi rõ khi mã không hợp lệ.
2. THE System SHALL có route khám phá sản phẩm public và nguồn dữ liệu từ endpoint public.
3. THE System SHALL hiển thị tin thị trường / dự báo giá public khi endpoint public analytics sống.

### Yêu cầu 19: Ràng buộc phi chức năng frontend (mục 4.3.3)

**User Story:** Là stakeholder, chúng tôi cần triển khai FE giữ các ràng buộc khả dụng/hiệu năng/độ tin cậy đã nêu ở cấp hệ thống.

#### Tiêu chí chấp nhận

1. THE System SHALL giữ tương tác chuyển route dưới mục tiêu ~1 giây cho điều hướng thường trên thiết bị tiêu chuẩn (best effort: lazy load, cache, skeleton).
2. THE System SHALL giữ hành vi offline-first cho trang list/detail đã cache và hàng đợi đồng bộ care log khi đã triển khai.
3. THE System SHALL hiển thị UI phục hồi thân thiện cho lỗi mạng/dịch vụ thay vì màn trắng / crash.
4. THE System SHALL đảm bảo responsive cho bề rộng mobile phổ biến và giữ ràng buộc đọc của design system.

### Yêu cầu 20: Bảo mật / quyền riêng tư trên client (FR-S01 + NFR bảo mật)

**User Story:** Là người dùng, tôi cần dữ liệu theo role và phiên được xử lý an toàn trong Mini App.

#### Tiêu chí chấp nhận

1. THE System SHALL áp dụng route guard theo role dựa trên ngữ cảnh role từ backend verify.
2. THE System SHALL không ghi token nhạy cảm vào log không an toàn và SHALL xóa state phiên khi logout / 401.
3. THE System SHALL chỉ gọi backend qua URL Gateway HTTPS ở môi trường không local.

### Yêu cầu 21: Triết lý Native Zalo + tối giản (4.3.5)

**User Story:** Là người dùng Zalo Mini App, tôi muốn giao diện gần gũi và đơn giản để dùng ngay không phải học lại mô hình tương tác.

#### Tiêu chí chấp nhận

1. THE System SHALL ưu tiên mẫu tương tác native Zalo và component tương thích Zaui cho điều hướng, form, phản hồi và chuyển trang.
2. THE System SHALL tránh paradigm UI không native mâu thuẫn với mental model Mini App trừ khi được phê duyệt trong tài liệu thiết kế.
3. THE System SHALL tuân thủ ràng buộc kích thước gói tải theo hướng dẫn Zalo Mini App, mục tiêu dưới 20 MB.
4. THE System SHALL giữ luồng quan trọng tối giản trực quan (tiết lộ dần, khối nội dung gọn, hành động chính rõ).

### Yêu cầu 22: UX theo phân khúc người dùng (4.3.5)

**User Story:** Là các role khác nhau, chúng tôi cần độ sâu tương tác phù hợp: nông dân thao tác nhanh, thương lái/người mua giàu thông tin.

#### Tiêu chí chấp nhận

1. THE System SHALL áp dụng quy tắc 3 lần chạm cho nông dân: xem cảnh báo và cập nhật care log trong tối đa 3 lần chạm từ home nông dân.
2. THE System SHALL đặt hành động ưu tiên trên màn nông dân (cảnh báo, tóm tắt giám sát, chăm sóc) phía trên phân tích phụ.
3. THE System SHALL cung cấp màn thương lái/người mua với khối thông tin dày hơn (thống kê, xu hướng, truy xuất) mà không giảm khả năng đọc.

### Yêu cầu 23: Hợp đồng màu, typography và icon (4.3.6)

**User Story:** Là nhóm thiết kế và kỹ sư, chúng tôi cần token trực quan rõ trong spec để bàn giao UI khớp luận án.

#### Tiêu chí chấp nhận

1. THE System SHALL dùng chế độ màu RGB mobile và giữ ngữ nghĩa bảng màu:
   - Zalo Blue `#0068FF`
   - Agri Green `#3EBB6C`
   - Alert Red `#F50000`
   - Warning Yellow `#FFCC00`
   - Neutral Gray `#F7F7F8`
2. THE System SHALL dùng font hệ thống:
   - iOS: họ San Francisco
   - Android: Roboto
3. THE System SHALL áp dụng thang typography:
   - Heading 1: 22px
   - Heading 2: 18px
   - Body: 16px
   - Thông tin quan trọng SHALL NOT nhỏ hơn 14px
4. THE System SHALL dùng icon dạng outline với icon điều hướng Zaui và icon ngữ nghĩa nông nghiệp (nhiệt kế, giọt nước, mặt trời, tam giác cảnh báo) khi áp dụng.

### Yêu cầu 24: Trình bày ưu tiên trực quan hóa dữ liệu (4.3.5)

**User Story:** Là người dùng cuối, tôi muốn nắm trạng thái vườn nhanh qua chỉ báo và biểu đồ, không chỉ bảng số.

#### Tiêu chí chấp nhận

1. THE System SHALL ưu tiên biểu đồ / mô hình giám sát hơn bảng số thô trên dashboard chính.
2. THE System SHALL có chỉ báo trực quan tăng trưởng/sức khỏe cho ngữ cảnh digital twin khi backend hỗ trợ.
3. WHEN chỉ có giá trị thô THEN THE System SHALL mã hóa trực quan gọn (màu trạng thái / icon / xu hướng kiểu sparkline) thay vì danh sách không cấu trúc.
