# Tài liệu Yêu cầu - Hệ thống Thiết kế Giao diện Zalo Mini App Nông nghiệp

## Giới thiệu

Hệ thống thiết kế giao diện người dùng cho ứng dụng Zalo Mini App nông nghiệp nhằm giải quyết rào cản công nghệ đối với nông dân, đồng thời đảm bảo tính minh bạch thông tin cho người mua và thương lái. Hệ thống được xây dựng dựa trên triết lý Native Zalo và Tối giản hóa, với mục tiêu tạo trải nghiệm liền mạch như một tính năng có sẵn của Zalo.

Ứng dụng hỗ trợ ba vai trò chính: Nông dân (quản lý vườn, giám sát môi trường, kết nối thương lái), Thương lái (quản lý nguồn cung, bán hàng, giám sát quy trình), và Người mua (đặt hàng, truy xuất nguồn gốc, giám sát vườn trồng). Hệ thống tích hợp IoT để thu thập dữ liệu môi trường thời gian thực và sử dụng mô hình Digital Twin để trực quan hóa trạng thái cây trồng.

## Bảng thuật ngữ

- **Zalo Mini App**: Nền tảng ứng dụng nhỏ gọn chạy trong ứng dụng Zalo
- **Native-like**: Phong cách thiết kế gần gũi với nền tảng gốc
- **Digital Twin**: Bản sao số - mô hình trực quan hóa trạng thái sinh trưởng cây trồng
- **3-Click Rule**: Quy tắc 3 lần chạm - mọi thông tin quan trọng phải truy cập được trong tối đa 3 thao tác
- **Farm Lab**: Tên khu vực canh tác trong ứng dụng
- **Dashboard**: Bảng điều khiển hiển thị thông tin tổng quan
- **IoT**: Internet of Things - các cảm biến thu thập dữ liệu môi trường
- **Zaui**: Thư viện giao diện chuẩn của Zalo
- **System Font**: Phông chữ hệ thống (San Francisco cho iOS, Roboto cho Android)
- **Outline Icon**: Biểu tượng phong cách nét mảnh
- **RGB**: Chế độ màu hiển thị cho thiết bị di động
- **VietGAP**: Tiêu chuẩn thực hành nông nghiệp tốt của Việt Nam
- **GlobalGAP**: Tiêu chuẩn thực hành nông nghiệp tốt toàn cầu
- **Sensor**: Cảm biến thu thập dữ liệu môi trường
- **Alert**: Cảnh báo khi thông số vượt ngưỡng
- **TLS/SSL**: Giao thức bảo mật truyền tải dữ liệu
- **PII**: Personally Identifiable Information - Thông tin định danh cá nhân
- **QR Code**: Mã vạch hai chiều để truy xuất nguồn gốc

## Yêu cầu

### Yêu cầu 1: Tuân thủ Triết lý Thiết kế Native Zalo

**User Story:** Là người dùng ứng dụng Zalo Mini App, tôi muốn giao diện ứng dụng nông nghiệp cảm thấy như một phần tự nhiên của Zalo, để tôi có thể sử dụng ngay mà không cần học cách thao tác mới.

#### Tiêu chí chấp nhận

1. WHEN người dùng mở ứng dụng THEN hệ thống SHALL hiển thị giao diện tuân thủ ngôn ngữ thiết kế Native-like của Zalo
2. WHEN ứng dụng được tải xuống THEN hệ thống SHALL đảm bảo dung lượng gói tin dưới 20MB
3. WHEN các thành phần giao diện được render THEN hệ thống SHALL sử dụng các component tuân thủ quy chuẩn kỹ thuật của Zalo Mini App
4. WHEN người dùng tương tác với các điều khiển THEN hệ thống SHALL phản hồi theo pattern tương tác chuẩn của Zalo

### Yêu cầu 2: Hệ thống Màu sắc Nhất quán

**User Story:** Là nhà phát triển, tôi muốn có một hệ thống màu sắc được định nghĩa rõ ràng, để đảm bảo tính nhất quán và dễ bảo trì trong toàn bộ ứng dụng.

#### Tiêu chí chấp nhận

1. WHEN các nút hành động chính được hiển thị THEN hệ thống SHALL sử dụng màu Zalo Blue (#0068FF)
2. WHEN các chỉ số môi trường ở trạng thái tốt được hiển thị THEN hệ thống SHALL sử dụng màu Agri Green (#3EBB6C)
3. WHEN cảnh báo nguy hiểm xuất hiện THEN hệ thống SHALL sử dụng màu Alert Red (#F50000)
4. WHEN cảnh báo cần chú ý xuất hiện THEN hệ thống SHALL sử dụng màu Warning Yellow (#FFCC00)
5. WHEN màu nền và đường viền được render THEN hệ thống SHALL sử dụng màu Neutral Gray (#F7F7F8)
6. WHEN màu sắc được áp dụng THEN hệ thống SHALL sử dụng chế độ màu RGB cho thiết bị di động

### Yêu cầu 3: Hệ thống Typography Tối ưu

**User Story:** Là nông dân sử dụng ứng dụng, tôi muốn văn bản hiển thị rõ ràng và dễ đọc, để tôi có thể nhanh chóng nắm bắt thông tin quan trọng về cây trồng của mình.

#### Tiêu chí chấp nhận

1. WHEN ứng dụng chạy trên iOS THEN hệ thống SHALL sử dụng phông chữ San Francisco
2. WHEN ứng dụng chạy trên Android THEN hệ thống SHALL sử dụng phông chữ Roboto
3. WHEN tiêu đề màn hình được hiển thị THEN hệ thống SHALL sử dụng Heading 1 với kích thước 22px
4. WHEN tiêu đề mục được hiển thị THEN hệ thống SHALL sử dụng Heading 2 với kích thước 18px
5. WHEN nội dung thông tin được hiển thị THEN hệ thống SHALL sử dụng Body Text với kích thước 16px
6. WHEN thông tin quan trọng được hiển thị THEN hệ thống SHALL không sử dụng cỡ chữ dưới 14px

### Yêu cầu 4: Hệ thống Biểu tượng Trực quan

**User Story:** Là người dùng, tôi muốn các biểu tượng rõ ràng và dễ nhận biết, để tôi có thể hiểu nhanh ý nghĩa mà không cần đọc nhiều chữ.

#### Tiêu chí chấp nhận

1. WHEN biểu tượng được hiển thị THEN hệ thống SHALL sử dụng phong cách Outline với nét mảnh
2. WHEN các icon điều hướng chuẩn được sử dụng THEN hệ thống SHALL lấy từ thư viện Zaui
3. WHEN thông số nhiệt độ được hiển thị THEN hệ thống SHALL sử dụng biểu tượng nhiệt kế
4. WHEN thông số độ ẩm được hiển thị THEN hệ thống SHALL sử dụng biểu tượng giọt nước
5. WHEN thông số ánh sáng được hiển thị THEN hệ thống SHALL sử dụng biểu tượng mặt trời
6. WHEN cảnh báo được hiển thị THEN hệ thống SHALL sử dụng biểu tượng tam giác cảnh báo

### Yêu cầu 5: Tối ưu hóa cho Nông dân - Quy tắc 3 lần chạm

**User Story:** Là nông dân, tôi muốn truy cập nhanh các thông tin cảnh báo và tác vụ chăm sóc quan trọng, để tôi có thể phản ứng kịp thời với tình trạng cây trồng.

#### Tiêu chí chấp nhận

1. WHEN nông dân cần truy cập thông tin cảnh báo quan trọng THEN hệ thống SHALL cho phép truy cập với tối đa 3 lần thao tác
2. WHEN nông dân cần truy cập tác vụ chăm sóc THEN hệ thống SHALL cho phép truy cập với tối đa 3 lần thao tác
3. WHEN giao diện được thiết kế THEN hệ thống SHALL ưu tiên các thao tác phổ biến nhất ở vị trí dễ tiếp cận

### Yêu cầu 6: Trực quan hóa Dữ liệu cho Nông dân

**User Story:** Là nông dân, tôi muốn thấy trạng thái cây trồng qua hình ảnh trực quan thay vì bảng số liệu, để tôi có thể nắm bắt tình hình nhanh chóng mà không cần phân tích số liệu phức tạp.

#### Tiêu chí chấp nhận

1. WHEN dữ liệu sinh trưởng cây trồng được hiển thị THEN hệ thống SHALL ưu tiên sử dụng biểu đồ và mô hình Digital Twin thay vì bảng số liệu thô
2. WHEN trạng thái cây thay đổi THEN hệ thống SHALL đồng bộ hóa thành hình ảnh trực quan
3. WHEN màu sắc lá cây thay đổi THEN hệ thống SHALL phản ánh trạng thái sinh trưởng tương ứng
4. WHEN giao diện hiển thị thông tin nông nghiệp THEN hệ thống SHALL sử dụng tông màu xanh lá đặc trưng

### Yêu cầu 7: Dashboard Thông tin cho Thương lái và Người mua

**User Story:** Là thương lái hoặc người mua, tôi muốn xem thông tin thị trường và truy xuất nguồn gốc chi tiết, để tôi có thể đưa ra quyết định mua bán chính xác.

#### Tiêu chí chấp nhận

1. WHEN thương lái truy cập ứng dụng THEN hệ thống SHALL hiển thị bảng điều khiển thống kê thị trường
2. WHEN biểu đồ biến động giá được hiển thị THEN hệ thống SHALL cung cấp dữ liệu trực quan và dễ đọc
3. WHEN người mua cần truy xuất nguồn gốc THEN hệ thống SHALL cung cấp công cụ truy xuất chi tiết
4. WHEN dashboard được hiển thị THEN hệ thống SHALL tập trung vào tính thông tin với nhiều dữ liệu

### Yêu cầu 8: Tính Nhất quán Giao diện

**User Story:** Là người dùng, tôi muốn trải nghiệm nhất quán trên toàn bộ ứng dụng, để tôi không bị nhầm lẫn khi chuyển đổi giữa các màn hình khác nhau.

#### Tiêu chí chấp nhận

1. WHEN các component giao diện được sử dụng THEN hệ thống SHALL áp dụng từ thư viện thành phần đồng nhất
2. WHEN màu sắc được áp dụng THEN hệ thống SHALL tuân thủ bảng màu đã định nghĩa
3. WHEN typography được áp dụng THEN hệ thống SHALL tuân thủ quy tắc phân cấp đã định nghĩa
4. WHEN biểu tượng được sử dụng THEN hệ thống SHALL tuân thủ phong cách Outline đã định nghĩa
5. WHEN các tương tác phức tạp được thiết kế THEN hệ thống SHALL đảm bảo tính nhất quán với các pattern đã thiết lập

### Yêu cầu 9: Tối ưu hóa Hiệu năng

**User Story:** Là người dùng ở khu vực nông thôn với mạng 4G, tôi muốn ứng dụng tải nhanh và mượt mà, để tôi có thể sử dụng hiệu quả ngay cả khi kết nối mạng không ổn định.

#### Tiêu chí chấp nhận

1. WHEN phông chữ được tải THEN hệ thống SHALL sử dụng System Font để tối ưu tốc độ tải
2. WHEN assets được tải THEN hệ thống SHALL đảm bảo tổng dung lượng không vượt quá 20MB
3. WHEN giao diện được render THEN hệ thống SHALL tối ưu cho hạ tầng mạng 4G tại khu vực nông thôn
4. WHEN component được sử dụng THEN hệ thống SHALL ưu tiên các component native của Zalo Mini App

### Yêu cầu 10: Khả năng Bảo trì và Mở rộng

**User Story:** Là nhà phát triển, tôi muốn hệ thống thiết kế dễ bảo trì và mở rộng, để tôi có thể thêm tính năng mới mà không làm ảnh hưởng đến tính nhất quán của ứng dụng.

#### Tiêu chí chấp nhận

1. WHEN màu sắc mới cần được thêm vào THEN hệ thống SHALL cho phép mở rộng bảng màu mà không vi phạm quy tắc hiện có
2. WHEN component mới được tạo THEN hệ thống SHALL tuân thủ các quy tắc thiết kế đã định nghĩa
3. WHEN typography cần điều chỉnh THEN hệ thống SHALL duy trì tính nhất quán với quy tắc phân cấp
4. WHEN biểu tượng mới được thêm vào THEN hệ thống SHALL tuân thủ phong cách Outline đã thiết lập
5. WHEN hệ thống thiết kế được cập nhật THEN hệ thống SHALL đảm bảo tương thích ngược với các component hiện có

### Yêu cầu 11: Giao diện Quản lý Hồ sơ Vườn (Nông dân)

**User Story:** Là nông dân, tôi muốn quản lý thông tin hồ sơ vườn của mình một cách dễ dàng, để tôi có thể giới thiệu năng lực sản xuất với thương lái.

#### Tiêu chí chấp nhận

1. WHEN nông dân truy cập màn hình quản lý Farm Lab THEN hệ thống SHALL hiển thị form nhập liệu với các trường vị trí, diện tích, loại cây trồng và lịch sử canh tác
2. WHEN nông dân cập nhật thông tin vườn THEN hệ thống SHALL lưu trữ và hiển thị xác nhận cập nhật thành công
3. WHEN thông tin vườn được hiển thị THEN hệ thống SHALL sử dụng biểu tượng và màu sắc phù hợp với ngữ cảnh nông nghiệp
4. WHEN form nhập liệu được hiển thị THEN hệ thống SHALL đảm bảo các trường bắt buộc được đánh dấu rõ ràng

### Yêu cầu 12: Giao diện Giám sát Môi trường Thời gian Thực (Nông dân)

**User Story:** Là nông dân, tôi muốn xem các thông số môi trường của vườn theo thời gian thực, để tôi có thể nắm bắt tình hình và phản ứng kịp thời.

#### Tiêu chí chấp nhận

1. WHEN dữ liệu cảm biến được cập nhật THEN hệ thống SHALL hiển thị thông số mới trong vòng 5 giây
2. WHEN nhiệt độ được hiển thị THEN hệ thống SHALL sử dụng biểu tượng nhiệt kế và màu sắc phù hợp với trạng thái
3. WHEN độ ẩm được hiển thị THEN hệ thống SHALL sử dụng biểu tượng giọt nước và màu sắc phù hợp với trạng thái
4. WHEN ánh sáng được hiển thị THEN hệ thống SHALL sử dụng biểu tượng mặt trời và màu sắc phù hợp với trạng thái
5. WHEN thông số vượt ngưỡng an toàn THEN hệ thống SHALL hiển thị cảnh báo với màu Alert Red hoặc Warning Yellow
6. WHEN dữ liệu là dữ liệu bổ khuyết THEN hệ thống SHALL gán nhãn phân biệt với dữ liệu thực

### Yêu cầu 13: Giao diện Cảnh báo và Gợi ý Tác vụ (Nông dân)

**User Story:** Là nông dân, tôi muốn nhận cảnh báo rõ ràng và gợi ý tác vụ cụ thể, để tôi có thể xử lý kịp thời các vấn đề với cây trồng.

#### Tiêu chí chấp nhận

1. WHEN thông số môi trường vượt ngưỡng THEN hệ thống SHALL hiển thị cảnh báo với biểu tượng tam giác và màu Alert Red
2. WHEN cảnh báo được hiển thị THEN hệ thống SHALL đề xuất tác vụ chăm sóc cụ thể bằng văn bản dễ hiểu
3. WHEN cảnh báo quan trọng xuất hiện THEN hệ thống SHALL đảm bảo người dùng có thể truy cập trong tối đa 3 lần chạm
4. WHEN nhiều cảnh báo cùng xuất hiện THEN hệ thống SHALL sắp xếp theo mức độ ưu tiên với màu sắc phân biệt

### Yêu cầu 14: Giao diện Điều khiển Tác vụ Tự động (Nông dân)

**User Story:** Là nông dân, tôi muốn điều khiển các thiết bị tự động từ ứng dụng, để tôi có thể chăm sóc cây trồng từ xa một cách thuận tiện.

#### Tiêu chí chấp nhận

1. WHEN màn hình điều khiển được hiển thị THEN hệ thống SHALL hiển thị các nút bật/tắt thiết bị với trạng thái rõ ràng
2. WHEN người dùng kích hoạt thiết bị THEN hệ thống SHALL hiển thị phản hồi trực quan ngay lập tức
3. WHEN thiết bị đang hoạt động THEN hệ thống SHALL sử dụng màu Agri Green để chỉ trạng thái
4. WHEN thiết bị tắt hoặc lỗi THEN hệ thống SHALL sử dụng màu Neutral Gray hoặc Alert Red

### Yêu cầu 15: Giao diện Tìm kiếm và Kết nối Đối tác (Nông dân)

**User Story:** Là nông dân, tôi muốn tìm kiếm và kết nối với thương lái phù hợp, để tôi có thể bán sản phẩm với giá tốt hơn.

#### Tiêu chí chấp nhận

1. WHEN màn hình tìm kiếm được hiển thị THEN hệ thống SHALL cung cấp bộ lọc theo khu vực, loại nông sản và đánh giá
2. WHEN danh sách thương lái được hiển thị THEN hệ thống SHALL hiển thị thông tin cơ bản và đánh giá tín nhiệm
3. WHEN nông dân gửi yêu cầu kết nối THEN hệ thống SHALL hiển thị xác nhận và trạng thái yêu cầu
4. WHEN thao tác tìm kiếm được thực hiện THEN hệ thống SHALL đảm bảo tuân thủ quy tắc 3 lần chạm

### Yêu cầu 16: Giao diện Quản lý Hợp đồng (Nông dân & Thương lái)

**User Story:** Là người dùng, tôi muốn xem và quản lý các hợp đồng của mình một cách rõ ràng, để tôi có thể theo dõi các cam kết và điều khoản.

#### Tiêu chí chấp nhận

1. WHEN danh sách hợp đồng được hiển thị THEN hệ thống SHALL hiển thị trạng thái với màu sắc phân biệt
2. WHEN chi tiết hợp đồng được xem THEN hệ thống SHALL hiển thị đầy đủ thông tin số lượng, chất lượng, quy trình và đặt cọc
3. WHEN yêu cầu thay đổi hợp đồng xuất hiện THEN hệ thống SHALL hiển thị thông báo với màu Warning Yellow
4. WHEN người dùng chấp nhận hoặc từ chối THEN hệ thống SHALL cung cấp nút hành động rõ ràng với màu Zalo Blue

### Yêu cầu 17: Giao diện Dashboard Thương lái

**User Story:** Là thương lái, tôi muốn xem tổng quan thống kê và xu hướng thị trường, để tôi có thể đưa ra quyết định kinh doanh chính xác.

#### Tiêu chí chấp nhận

1. WHEN dashboard được hiển thị THEN hệ thống SHALL sử dụng biểu đồ trực quan thay vì bảng số liệu thô
2. WHEN xu hướng thị trường được hiển thị THEN hệ thống SHALL sử dụng màu Agri Green cho xu hướng tích cực và Alert Red cho xu hướng tiêu cực
3. WHEN nhiều dữ liệu được hiển thị THEN hệ thống SHALL sử dụng biểu tượng Outline để tạo cảm giác tinh gọn
4. WHEN dashboard được render THEN hệ thống SHALL đảm bảo tải nhanh và mượt mà trên mạng 4G

### Yêu cầu 18: Giao diện Quản lý Mặt hàng (Thương lái)

**User Story:** Là thương lái, tôi muốn đăng và quản lý các mặt hàng nông sản, để tôi có thể tiếp cận người mua hiệu quả.

#### Tiêu chí chấp nhận

1. WHEN form đăng mặt hàng được hiển thị THEN hệ thống SHALL cung cấp các trường giá, hình ảnh, tiêu chuẩn với giao diện rõ ràng
2. WHEN hình ảnh được tải lên THEN hệ thống SHALL hiển thị preview và trạng thái tải
3. WHEN mặt hàng được lưu THEN hệ thống SHALL hiển thị xác nhận với màu Agri Green
4. WHEN danh sách mặt hàng được hiển thị THEN hệ thống SHALL sử dụng card layout với hình ảnh và thông tin cơ bản

### Yêu cầu 19: Giao diện Giám sát Quy trình Canh tác (Thương lái)

**User Story:** Là thương lái, tôi muốn giám sát và đối chiếu quy trình canh tác của nông dân, để tôi có thể đảm bảo chất lượng sản phẩm.

#### Tiêu chí chấp nhận

1. WHEN dữ liệu giám sát được hiển thị THEN hệ thống SHALL so sánh với quy trình chuẩn bằng biểu đồ trực quan
2. WHEN mức độ tuân thủ cao THEN hệ thống SHALL sử dụng màu Agri Green
3. WHEN có sai lệch THEN hệ thống SHALL sử dụng màu Warning Yellow hoặc Alert Red tùy mức độ
4. WHEN quy trình chuẩn được hiển thị THEN hệ thống SHALL sử dụng biểu tượng phù hợp cho từng bước

### Yêu cầu 20: Giao diện Tra cứu và Đặt hàng (Người mua)

**User Story:** Là người mua, tôi muốn tra cứu và đặt mua nông sản dễ dàng, để tôi có thể mua hàng chất lượng với thông tin minh bạch.

#### Tiêu chí chấp nhận

1. WHEN danh sách sản phẩm được hiển thị THEN hệ thống SHALL hiển thị hình ảnh, giá và thông tin thương lái
2. WHEN người mua xem chi tiết sản phẩm THEN hệ thống SHALL hiển thị lịch sử canh tác và dữ liệu giám sát
3. WHEN người mua đặt hàng THEN hệ thống SHALL cung cấp nút hành động rõ ràng với màu Zalo Blue
4. WHEN đơn hàng được xác nhận THEN hệ thống SHALL hiển thị thông báo thành công với màu Agri Green

### Yêu cầu 21: Giao diện Giám sát Vườn trồng (Người mua)

**User Story:** Là người mua đã đặt cọc, tôi muốn giám sát trạng thái cây trồng thời gian thực, để tôi có thể yên tâm về chất lượng sản phẩm.

#### Tiêu chí chấp nhận

1. WHEN màn hình giám sát được hiển thị THEN hệ thống SHALL hiển thị mô hình Digital Twin của cây trồng
2. WHEN trạng thái cây thay đổi THEN hệ thống SHALL cập nhật màu sắc và hình ảnh tương ứng
3. WHEN thông số môi trường được hiển thị THEN hệ thống SHALL sử dụng biểu tượng và màu sắc nhất quán với phân hệ nông dân
4. WHEN dữ liệu là dữ liệu bổ khuyết THEN hệ thống SHALL gán nhãn phân biệt rõ ràng

### Yêu cầu 22: Giao diện Truy xuất Nguồn gốc (Khách)

**User Story:** Là khách vãng lai, tôi muốn quét mã QR để xem nguồn gốc sản phẩm, để tôi có thể tin tưởng vào chất lượng nông sản.

#### Tiêu chí chấp nhận

1. WHEN mã QR được quét THEN hệ thống SHALL hiển thị thông tin Farm Lab, nhật ký canh tác và biểu đồ giám sát
2. WHEN thông tin nguồn gốc được hiển thị THEN hệ thống SHALL sử dụng layout dễ đọc với biểu tượng trực quan
3. WHEN biểu đồ môi trường được hiển thị THEN hệ thống SHALL sử dụng màu sắc nhất quán với hệ thống
4. WHEN người dùng chưa đăng nhập THEN hệ thống SHALL vẫn hiển thị đầy đủ thông tin truy xuất

### Yêu cầu 23: Giao diện Tin tức và Dự báo (Công khai)

**User Story:** Là người dùng, tôi muốn xem tin tức nông nghiệp và dự báo giá, để tôi có thể cập nhật thông tin thị trường.

#### Tiêu chí chấp nhận

1. WHEN danh sách tin tức được hiển thị THEN hệ thống SHALL sử dụng card layout với hình ảnh thumbnail
2. WHEN biểu đồ giá được hiển thị THEN hệ thống SHALL sử dụng màu Agri Green cho xu hướng tăng và Alert Red cho xu hướng giảm
3. WHEN tin tức được đọc THEN hệ thống SHALL sử dụng typography dễ đọc với Body Text 16px
4. WHEN người dùng chưa đăng nhập THEN hệ thống SHALL vẫn cho phép xem tin tức công khai

### Yêu cầu 24: Yêu cầu Phi chức năng - Hiệu năng

**User Story:** Là người dùng ở khu vực nông thôn, tôi muốn ứng dụng phản hồi nhanh, để tôi có thể sử dụng hiệu quả ngay cả khi mạng không ổn định.

#### Tiêu chí chấp nhận

1. WHEN dữ liệu cảm biến được cập nhật THEN hệ thống SHALL hiển thị trên giao diện trong vòng 5 giây
2. WHEN giao diện được render THEN hệ thống SHALL tối ưu cho mạng 4G tại khu vực nông thôn
3. WHEN ứng dụng được tải xuống THEN hệ thống SHALL đảm bảo dung lượng dưới 20MB
4. WHEN người dùng thao tác THEN hệ thống SHALL phản hồi ngay lập tức với feedback trực quan

### Yêu cầu 25: Yêu cầu Phi chức năng - Bảo mật

**User Story:** Là người dùng, tôi muốn thông tin cá nhân và dữ liệu của tôi được bảo mật, để tôi có thể yên tâm sử dụng ứng dụng.

#### Tiêu chí chấp nhận

1. WHEN dữ liệu được truyền tải THEN hệ thống SHALL sử dụng giao thức TLS/SSL
2. WHEN người dùng đăng nhập THEN hệ thống SHALL sử dụng cơ chế định danh Zalo ID
3. WHEN thông tin cá nhân được hiển thị THEN hệ thống SHALL tuân thủ quy định bảo vệ dữ liệu của Zalo
4. WHEN dữ liệu nhạy cảm được xử lý THEN hệ thống SHALL đảm bảo chỉ người dùng có quyền mới truy cập được
