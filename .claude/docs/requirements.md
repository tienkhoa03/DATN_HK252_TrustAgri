# Requirements — TrustAgri

> **Mục đích:** Catalog đầy đủ User Stories (US), Functional Requirements (FR), Non-Functional Requirements (NFR). Đây là **single source of truth** cho phạm vi nghiệp vụ. Khi viết code/tests phải trace được tới mã yêu cầu (ví dụ `FR-F01`, `US-T03`).

---

## 1. User Stories

### 1.1 Phân hệ Nông dân (Farmer)

| Mã | Tên | User Story |
|----|-----|------------|
| US-F01 | Dự đoán giá / Đặt cọc | Là Nông dân, tôi muốn xem giá nông sản dự đoán hoặc nhận cam kết đặt cọc trước, để yên tâm sản xuất và đảm bảo nguồn thu. |
| US-F02 | Hướng dẫn quy trình | Là Nông dân, tôi muốn nhận hướng dẫn chi tiết về quy trình chăm sóc cây đạt chuẩn, để cây trồng phát triển đúng yêu cầu giám sát. |
| US-F03 | Theo dõi môi trường | Là Nông dân, tôi muốn xem thông số thời tiết / khí hậu / cảm biến từ xa, để đề xuất phương án chăm sóc kịp thời. |
| US-F04 | Đầu ra ổn định | Là Nông dân, tôi muốn kết nối với đơn vị thu mua ổn định, để không phải lo tìm thị trường tiêu thụ. |
| US-F05 | Cập nhật hành động chăm sóc | Là Nông dân, tôi muốn cập nhật hành động chăm sóc + đăng minh chứng để chứng minh đã làm đúng quy trình. |

### 1.2 Phân hệ Thương lái (Trader)

| Mã | Tên | User Story |
|----|-----|------------|
| US-T01 | Dự báo & Thống kê | Là Thương lái, tôi muốn xem dashboard thống kê nhu cầu thị trường + đơn pre-order, để ra quyết định thu mua. |
| US-T02 | Thiết lập quy trình chuẩn | Là Thương lái (QC), tôi muốn tạo & chuẩn hóa bộ quy trình canh tác, để áp dụng thống nhất cho các nông hộ. |
| US-T03 | Kết nối & Điều phối | Là Thương lái, tôi muốn nhận yêu cầu đặt cọc từ buyer và tìm nông hộ phù hợp gửi yêu cầu sản xuất. |
| US-T04 | Giám sát tuân thủ | Là Thương lái, tôi muốn giám sát canh tác qua IoT + nhật ký điện tử, để đảm bảo tuân thủ quy trình. |
| US-T05 | Công bố thông tin | Là Thương lái, tôi muốn đăng tin thị trường + dự báo giá, để cung cấp thông tin minh bạch. |

### 1.3 Phân hệ Người mua (Buyer/User)

| Mã | Tên | User Story |
|----|-----|------------|
| US-U01 | Ổn định giá | Là Người mua, tôi muốn cam kết giá hàng hóa ổn định / được dự báo trước, để chủ động kế hoạch tài chính. |
| US-U02 | Đặt hàng trước | Là Người mua, tôi muốn đặt hàng trước khi cần, để đảm bảo nguồn cung. |
| US-U03 | Minh bạch thông tin | Là Người mua, tôi muốn xem xuất xứ + dữ liệu giám sát quá trình nuôi trồng, để đảm bảo chất lượng. |
| US-U04 | Yêu cầu chất lượng | Là Người mua, tôi muốn gửi yêu cầu cụ thể về chất lượng sản phẩm, để thu mua đúng ý muốn. |

### 1.4 Phân hệ Khách (Guest)

| Mã | Tên | User Story |
|----|-----|------------|
| US-G01 | Truy xuất nhanh | Là người tiêu dùng vãng lai, tôi muốn quét QR kiểm tra nguồn gốc tại quầy kệ, không cần tải app / đăng ký. |
| US-G02 | Tìm hiểu thông tin | Là khách hàng tiềm năng, tôi muốn xem trước thông tin thị trường + nông sản, để quyết định có tham gia đặt cọc. |

---

## 2. Functional Requirements (FR)

### 2.1 Phân hệ Nông dân (Farmer Module)

| Mã | Tên | Mô tả |
|----|-----|-------|
| FR-F01 | Quản lý hồ sơ vườn | CRUD Farm Lab: vị trí, diện tích, loại cây, lịch sử canh tác. |
| FR-F02 | Tìm kiếm & Kết nối đối tác | Lọc thương lái theo khu vực / loại nông sản / tín nhiệm; gửi yêu cầu kết nối kèm hồ sơ. |
| FR-F03 | Quản lý yêu cầu hợp tác | Hiển thị yêu cầu kết nối từ thương lái; chấp nhận / từ chối. |
| FR-F04 | Quản lý hợp đồng | Lưu danh sách hợp đồng bao tiêu đã xác nhận; theo dõi trạng thái + điều khoản. |
| FR-F05 | Xử lý thay đổi hợp đồng | Thông báo yêu cầu điều chỉnh từ thương lái; chấp nhận / từ chối. |
| FR-F06 | Xem quy trình canh tác | Hiển thị tiêu chuẩn (VietGAP, GlobalGAP) cho từng mùa vụ / đơn hàng. |
| FR-F07 | Giám sát thông số môi trường | Hiển thị real-time sensor data (temperature, humidity, light). |
| FR-F08 | Cảnh báo & Gợi ý tác vụ | Auto-alert khi vượt ngưỡng + đề xuất hành động khắc phục. |
| FR-F09 | Cập nhật hành động chăm sóc | Ghi nhận hành động + upload minh chứng (ảnh / file). |

### 2.2 Phân hệ Thương lái (Trader Module)

| Mã | Tên | Mô tả |
|----|-----|-------|
| FR-T01 | Quản lý hồ sơ thương nhân | CRUD profile: liên hệ, năng lực, uy tín. |
| FR-T02 | Bảng điều khiển | Dashboard: xu hướng nhu cầu, biến động thị trường, trạng thái đơn hàng. |
| FR-T03 | Đăng tin & Quản lý mặt hàng | Đăng nông sản bán + nhu cầu thu mua. |
| FR-T04 | Phản hồi nhu cầu mua | Xem nhu cầu buyer đăng công khai; gửi yêu cầu kết nối / đề xuất cung cấp. |
| FR-T05 | Xử lý đơn từ Người mua | Xem yêu cầu mua hàng; chấp nhận (gửi kết nối + cam kết) / từ chối. |
| FR-T06 | Quản lý hợp đồng tiêu thụ | Lifecycle hợp đồng với buyer: gửi/thay đổi/duyệt điều khoản, lịch sử. |
| FR-T07 | Tìm kiếm nguồn cung | Tra cứu Farm Lab; gửi yêu cầu kết nối nông dân. |
| FR-T08 | Xử lý kết nối từ Nông dân | Xem yêu cầu connection từ nông dân; chấp nhận / từ chối. |
| FR-T09 | Quản lý hợp đồng sản xuất | Quản lý bao tiêu với nông dân: thay đổi điều khoản (kể cả quy trình canh tác). |
| FR-T10 | Quản trị Bộ tiêu chuẩn canh tác | CRUD thư viện quy trình chuẩn (VietGAP / GlobalGAP / Hữu cơ). |
| FR-T11 | Giám sát & Đối chiếu | Hiển thị sensor data của vườn có hợp đồng + đối chiếu với chuẩn → đánh giá tuân thủ. |
| FR-T12 | Quản trị Tin tức & Thị trường | Biên tập/đăng bản tin nông vụ, bảng giá, dự báo. |

### 2.3 Phân hệ Người mua (Buyer/User Module)

| Mã | Tên | Mô tả |
|----|-----|-------|
| FR-U01 | Tra cứu & Đặt hàng | Xem nông sản công khai + thông tin trader + lịch sử canh tác; đặt mua / đặt cọc. |
| FR-U02 | Đăng nhu cầu mua hàng | Đăng tin tìm nguồn hàng (chủng loại, số lượng, chuẩn, giá kỳ vọng). |
| FR-U03 | Xử lý đề xuất cung cấp | Xem proposal từ trader; chấp nhận / từ chối. |
| FR-U04 | Quản lý đơn đặt cọc | Theo dõi đơn deposit; gửi/duyệt yêu cầu điều chỉnh tiêu chí. |
| FR-U05 | Giám sát vườn trồng | Xem sensor data + hành động chăm sóc cho hợp đồng đã đặt cọc. |
| FR-U06 | Lịch sử giao dịch | Tra cứu đơn đã hoàn tất + trạng thái xử lý. |

### 2.4 Phân hệ Khách & Public (Guest)

| Mã | Tên | Mô tả |
|----|-----|-------|
| FR-G01 | Truy xuất nguồn gốc | Quét QR (no-auth) → xem Farm Lab + nhật ký + biểu đồ giám sát. |
| FR-G02 | Xem tin tức & Dự báo giá | Đọc bản tin, dự báo thời tiết, biến động giá (no-auth). |
| FR-G03 | Tham quan chợ nông sản | Xem nông sản chào bán + Farm Lab nổi bật để thu hút đăng ký. |

### 2.5 Core / Cross-cutting

| Mã | Tên | Mô tả |
|----|-----|-------|
| FR-S01 | Định danh & Phân quyền | Dùng Zalo ID xác thực + phân quyền theo vai trò Farmer / Trader / Buyer / Guest. |

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Tính sẵn sàng (Availability)
- **NFR-A01:** Hiển thị thông số môi trường (temp/humidity/light) liên tục **kể cả khi cảm biến mất tín hiệu** — KHÔNG hiện lỗi / dữ liệu trống. (Imputed data.)
- **NFR-A02:** Offline-first — danh sách vườn, nhật ký đã tải vẫn xem được khi mất Internet.
- **NFR-A03:** Uptime ≥ 99,5% trong giờ hành chính.

### 3.2 Hiệu năng (Performance)
- **NFR-P01:** Khởi động app < 3 giây (từ tap → main UI ready).
- **NFR-P02:** Chuyển trang / mở chi tiết < 1 giây.
- **NFR-P03:** Load Digital Twin model không treo > 2 giây trên thiết bị phổ thông.

### 3.3 Tính khả dụng (Usability)
- **NFR-U01:** **3-Click Rule** — tính năng cốt lõi (xem cảnh báo, ghi nhật ký) ≤ 3 thao tác từ home.
- **NFR-U02:** Tuân thủ Zaui design system — native-like UX.
- **NFR-U03:** Min font size 14px cho thông tin quan trọng; touch target ≥ 44×44.

### 3.4 Tính tin cậy (Reliability)
- **NFR-R01:** Sai số dữ liệu hiển thị vs thực tế ≤ 5% (MAE).
- **NFR-R02:** Offline care log auto-sync khi reconnect, KHÔNG mất mát.
- **NFR-R03:** Friendly error messages — không crash / treo.

### 3.5 Tính tương thích (Compatibility)
- **NFR-C01:** Bundle size **< 20MB** (chuẩn ZMP).
- **NFR-C02:** Chạy đầy đủ Android + iOS qua Zalo.
- **NFR-C03:** Responsive 4.7"–6.7".

### 3.6 Bảo mật & Riêng tư (Security & Privacy)
- **NFR-S01:** Tuân thủ Zalo privacy; PII lưu an toàn, chỉ dùng vận hành.
- **NFR-S02:** Auth qua Zalo Access Token — không cho giả mạo.
- **NFR-S03:** Mọi traffic FE↔BE qua HTTPS.

### 3.7 Khả năng mở rộng (Scalability)
- **NFR-X01:** Backend chịu tải đồng thời ≥ 500 kết nối IoT + user mà không gián đoạn.

---

## 4. Traceability Matrix (US → FR → Service)

| User Story | FR liên quan | Service backend chính |
|------------|--------------|----------------------|
| US-F01 | FR-F02, FR-F03, FR-F04, FR-T05 | Contract Service |
| US-F02 | FR-F06, FR-T10 | Farm Service |
| US-F03 | FR-F07, FR-F08 | Monitoring Service |
| US-F04 | FR-F02, FR-F03 | Contract Service |
| US-F05 | FR-F09 | Farm Service |
| US-T01 | FR-T02 | Contract Service + Monitoring Service |
| US-T02 | FR-T10 | Farm Service (standards) |
| US-T03 | FR-T03..T09 | Contract Service |
| US-T04 | FR-T11 | Monitoring Service + Farm Service |
| US-T05 | FR-T12 | (out of MVP) |
| US-U01..U04 | FR-U01..U06 | Contract Service |
| US-G01 | FR-G01 | Farm Service (public) |
| US-G02 | FR-G02, FR-G03 | (read-only views) |

---

## 5. References
- Specs gốc: `/specs/backend-api-specification/requirements.md`, `/specs/frontend-ui-specification/requirements.md`
- Workflow chi tiết: [`business-logic.md`](./business-logic.md)
- Kiến trúc: [`architecture.md`](./architecture.md)
- Design tokens: [`design-system.md`](./design-system.md)
