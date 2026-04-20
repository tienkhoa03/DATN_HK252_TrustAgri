# Implementation Plan - Hệ thống Thiết kế Giao diện Zalo Mini App Nông nghiệp

## 📋 Quy tắc chung cho Screen Implementation

**Tất cả các màn hình (screens) phải tuân thủ:**
1. ✅ Tạo file `.demo.tsx` với interactive demo
2. ✅ Thêm link đến demo trong `src/pages/index.tsx`
3. ✅ Tạo file `.example.tsx` với các ví dụ sử dụng
4. ✅ Tạo file `.README.md` với tài liệu đầy đủ
5. ✅ Export component trong file `index.ts` của thư mục
6. ✅ **QUAN TRỌNG**: Kiểm tra tất cả icons đã tồn tại trong `src/design-system/tokens/icons.ts` trước khi sử dụng

**Thông tin Demo chuẩn (sử dụng cho tất cả màn hình):**
- **Tên nông dân:** Tiến Khoa
- **Tên Farm Lab:** Sầu riêng Monthong
- **Demo phải có:** Nút "Quay về màn hình chính" với styling chuẩn (xem FarmerProcessScreen.demo.tsx)
- **Props interface:** Demo component phải nhận `onBack?: () => void` prop
- **Back button styling:** Sử dụng pattern chuẩn với backBarStyles và backButtonStyles từ design tokens

**Quy tắc Icon (QUAN TRỌNG - Tránh lỗi runtime):**
1. **Trước khi sử dụng icon**, kiểm tra icon đã có trong `src/design-system/tokens/icons.ts`
2. **Nếu icon chưa có**, thêm vào đúng category:
   - `navigationIcons`: home, user, settings, notification
   - `agricultureIcons`: temperature, humidity, light, alert, plant, farm, etc.
   - `actionIcons`: add, edit, delete, search, filter, camera, check, info, play, close, alert-triangle, trending-up
3. **Sau khi thêm icon token**, thêm SVG path tương ứng trong `src/design-system/components/Icon/Icon.tsx`
4. **Test icon** hiển thị đúng trước khi commit

**Mục đích:** Đảm bảo tất cả màn hình có thể xem và test dễ dàng từ trang chủ demo với thông tin nhất quán, và tránh lỗi icon undefined.

---

- [x] 1. Thiết lập cấu trúc dự án và Design Tokens





  - Tạo cấu trúc thư mục cho design system
  - Định nghĩa Design Tokens (colors, typography, spacing, icons)
  - Cấu hình TypeScript và build tools
  - Thiết lập testing framework (Jest, fast-check)
  - _Requirements: 2.1-2.6, 3.1-3.6, 4.1-4.6, 9.1_

- [ ]* 1.1 Viết property test cho Color Palette Compliance
  - **Property 1: Color Palette Compliance**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.2**

- [x] 2. Implement Color System





  - Tạo color tokens với tất cả màu đã định nghĩa
  - Implement color validation utilities
  - Tạo semantic color mappings
  - Export colors trong nhiều formats (JS, CSS, JSON)
  - _Requirements: 2.1-2.6, 8.2_

- [ ]* 2.1 Viết property test cho Primary Button Color
  - **Property 2: Primary Button Color Consistency**
  - **Validates: Requirements 2.1**

- [ ]* 2.2 Viết property test cho Status Color Mapping
  - **Property 3, 4, 5: Status Color Consistency**
  - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 3. Implement Typography System





  - Tạo typography tokens (font families, sizes, weights, line heights)
  - Implement platform-specific font loading (iOS/Android)
  - Tạo typography scale utilities
  - Implement minimum font size validation
  - _Requirements: 3.1-3.6, 8.3, 9.1_

- [ ]* 3.1 Viết property test cho Typography Scale Compliance
  - **Property 6: Typography Scale Compliance**
  - **Validates: Requirements 3.3, 3.4, 3.5, 3.6, 8.3**

- [ ]* 3.2 Viết property test cho Platform Font Consistency
  - **Property 7: Platform Font Consistency**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 3.3 Viết property test cho Minimum Font Size
  - **Property 8: Minimum Font Size Constraint**
  - **Validates: Requirements 3.6**

- [x] 4. Implement Icon System





  - Tạo icon tokens và mappings
  - Integrate Zaui icon library
  - Tạo custom agriculture icons (outline style)
  - Implement icon component với size variants
  - _Requirements: 4.1-4.6, 8.4_

- [ ]* 4.1 Viết property test cho Icon Style Consistency
  - **Property 9: Icon Style Consistency**
  - **Validates: Requirements 4.1, 8.4**

- [ ]* 4.2 Viết property test cho Navigation Icon Source
  - **Property 10: Navigation Icon Source**
  - **Validates: Requirements 4.2**

- [ ]* 4.3 Viết property test cho Sensor Icon Mapping
  - **Property 11: Sensor Icon Mapping**
  - **Validates: Requirements 4.3, 4.4, 4.5, 4.6**

- [x] 5. Implement Spacing System





  - Tạo spacing tokens (xs, sm, md, lg, xl, xxl)
  - Implement spacing utilities
  - Tạo layout grid system
  - _Requirements: 8.1_

- [x] 6. Checkpoint - Đảm bảo tất cả tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Core Button Component





  - Tạo Button component với variants (primary, secondary, outline, text)
  - Implement size variants (small, medium, large)
  - Implement states (default, hover, active, disabled, loading)
  - Add accessibility attributes (ARIA labels, keyboard navigation)
  - Ensure minimum touch target 44x44px
  - _Requirements: 2.1, 8.1, 9.4_

- [ ]* 7.1 Viết unit tests cho Button component
  - Test all variants render correctly
  - Test all states work properly
  - Test accessibility attributes
  - _Requirements: 2.1, 8.1_

- [x] 8. Implement Card Component





  - Tạo Card component với title, subtitle, image, status
  - Implement card layouts
  - Add shadow và border radius
  - Implement onClick handler
  - _Requirements: 8.1_

- [ ]* 8.1 Viết unit tests cho Card component
  - Test card renders with all props
  - Test status colors
  - Test onClick behavior
  - _Requirements: 8.1_

- [x] 9. Implement SensorDisplay Component





  - Tạo SensorDisplay component cho temperature, humidity, light
  - Implement status color mapping (normal, warning, danger)
  - Add icon mapping per sensor type
  - Implement imputed data labeling
  - Display timestamp
  - _Requirements: 4.3-4.6, 12.2-12.6_

- [ ]* 9.1 Viết unit tests cho SensorDisplay component
  - Test sensor type icon mapping
  - Test status color mapping
  - Test imputed data label
  - _Requirements: 4.3-4.6, 12.2-12.6_

- [x] 10. Implement Alert Component





  - Tạo Alert component với severity levels (info, warning, error, success)
  - Implement color mapping per severity
  - Add icon per severity type
  - Implement action button và dismissible functionality
  - _Requirements: 2.3, 2.4, 13.1-13.4_

- [ ]* 10.1 Viết unit tests cho Alert component
  - Test severity color mapping
  - Test icon display
  - Test action và dismiss functionality
  - _Requirements: 2.3, 2.4, 13.1-13.4_

- [x] 11. Implement Chart Component





  - Tạo Chart component với types (line, bar, area)
  - Implement axis configuration
  - Add color mapping (Agri Green for positive, Alert Red for negative)
  - Implement grid và legend options
  - Optimize for mobile display
  - _Requirements: 6.1, 7.2, 17.1, 17.2_

- [ ]* 11.1 Viết unit tests cho Chart component
  - Test chart types render correctly
  - Test color mapping
  - Test axis configuration
  - _Requirements: 6.1, 7.2, 17.1_

- [x] 12. Implement DigitalTwinViewer Component





  - Tạo DigitalTwinViewer component
  - Implement plant model rendering (2D/3D)
  - Add growth stage visualization (seedling, vegetative, flowering, fruiting)
  - Implement health status color mapping (healthy, stressed, diseased)
  - Add animation for state transitions
  - _Requirements: 6.1-6.4, 21.1, 21.2_

- [ ]* 12.1 Viết property test cho Plant State Synchronization
  - **Property 14: Plant State Synchronization**
  - **Validates: Requirements 6.2**

- [ ]* 12.2 Viết property test cho Leaf Color State Mapping
  - **Property 15: Leaf Color State Mapping**
  - **Validates: Requirements 6.3**

- [ ]* 12.3 Viết unit tests cho DigitalTwinViewer component
  - Test growth stage rendering
  - Test health status colors
  - Test animation transitions
  - _Requirements: 6.1-6.4, 21.1, 21.2_

- [x] 13. Checkpoint - Đảm bảo tất cả component tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement Layout Components





  - Tạo ScreenLayout component (header, content, footer structure)
  - Implement Header component với navigation
  - Implement BottomNavigation component
  - Implement TabNavigation component
  - Ensure responsive layout cho different screen sizes (360px-414px)
  - _Requirements: 1.1, 8.1_

- [ ]* 14.1 Viết unit tests cho Layout components
  - Test layout structure
  - Test navigation rendering
  - Test responsive behavior
  - _Requirements: 1.1, 8.1_

- [x] 15. Implement Theme System





  - Tạo ThemeProvider component
  - Implement theme configuration
  - Add platform detection (iOS/Android)
  - Implement theme validation
  - Export theme utilities
  - _Requirements: 1.1, 3.1, 3.2, 8.1-8.5_

- [ ]* 15.1 Viết property test cho Component Library Consistency
  - **Property 12: Component Library Consistency**
  - **Validates: Requirements 1.3, 8.1, 9.4**

- [ ]* 15.2 Viết property test cho Native-like Component Usage
  - **Property 21: Native-like Component Usage**
  - **Validates: Requirements 1.1, 1.3**

- [x] 16. Implement Validation Utilities





  - Tạo color validation functions
  - Implement typography validation
  - Add icon style validation
  - Implement component compliance checker
  - Add accessibility validation (touch targets, contrast ratios)
  - _Requirements: 8.1-8.5, 10.1-10.5_

- [ ]* 16.1 Viết property test cho Design System Extensibility
  - **Property 19: Design System Extensibility**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ]* 16.2 Viết property test cho Backward Compatibility
  - **Property 20: Backward Compatibility**
  - **Validates: Requirements 10.5**

- [x] 17. Implement Farmer Dashboard Screen (Trang chủ và Giám sát)





  - **Màn hình quan trọng nhất - xuất hiện khi mở app**
  - Thanh tiêu đề: Lời chào + ảnh đại diện + icon chuông thông báo
  - Widget thời tiết thu gọn (nhiệt độ + khả năng mưa)
  - Khu vực cảnh báo ưu tiên cao (Alert Red nếu vượt ngưỡng, Agri Green nếu ổn)
  - Lưới cảm biến 2x2: Nhiệt độ, Độ ẩm đất, Ánh sáng, pH
  - Thanh tác vụ nhanh: Nút tròn 44px cho Máy bơm, Đèn, Quạt (Zalo Blue/Gray)
  - Bottom Navigation: Trang chủ, Quy trình, Kết nối, Tài khoản
  - **Tuân thủ quy tắc 3 lần chạm**
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: 5.1-5.3, 11.1-11.4, 12.1-12.6, 13.1-13.4, 14.1-14.4_

- [ ]* 17.1 Viết integration test cho 3-click rule
  - Test navigation to alerts within 3 clicks
  - Test navigation to care tasks within 3 clicks
  - _Requirements: 5.1, 5.2_

- [x] 18. Implement Farmer Process & Diary Screen (Quy trình và Nhật ký)





  - **Giúp tuân thủ quy trình VietGAP/GlobalGAP**
  - Thanh tiến độ mùa vụ (ví dụ: Ngày 15/90 - Giai đoạn Ra hoa)
  - Danh sách công việc (To-do List) với checkbox
  - Chi tiết hướng dẫn (Modal với văn bản/video)
  - Floating Action Button (Camera) để chụp ảnh cây trồng
  - Ảnh tự động gán vào nhật ký canh tác
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-F07, US-F02, FR-S04_

- [x] 19. Implement Farmer Market & Connect Screen (Thị trường và Kết nối)




  - **Tab Thị trường:**
  - Biểu đồ giá 7 ngày qua
  - Dự báo xu hướng giá tuần tới
  - **Tab Đối tác (Mặc định):**
  - Lời mời kết nối từ thương lái (Tên, Điểm uy tín, Loại nông sản)
  - Nút Chấp nhận (Xanh) và Từ chối (Xám)
  - Tìm kiếm thương lái uy tín trong khu vực
  - Nút Gửi yêu cầu kết nối
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-F02, FR-F03, FR-F04, US-F04_

- [x] 19.1 Implement Farmer Contracts Screen (Quản lý Hợp đồng)





  - **Theo dõi cam kết bao tiêu**
  - Danh sách hợp đồng dạng thẻ dọc
  - Thẻ "Đang thực hiện" (màu xanh): Tên thương lái, Sản lượng, Ngày thu hoạch
  - Thẻ "Yêu cầu thay đổi" (màu vàng): Highlight phần thay đổi
  - Chi tiết hợp đồng với điều khoản
  - Sticky Footer: Nút Đồng ý/Từ chối thay đổi
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-F05, FR-F06, US-F01_

- [x] 19.2 Implement Farmer Farm Profile Screen (Hồ sơ Vườn)





  - **Quản lý thông tin định danh và thiết bị**
  - Ảnh toàn cảnh vườn + Tên Farm Lab + Diện tích + Địa chỉ
  - Tích hợp bản đồ nhỏ
  - Nút Chỉnh sửa thông tin
  - Mã QR Vườn lớn (cho truy xuất nguồn gốc)
  - Quản lý thiết bị IoT: Danh sách Node cảm biến
  - Hiển thị trạng thái Pin và Kết nối (Online/Offline)
  - Nút Thêm thiết bị
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-F01, 11.1-11.4_

- [x] 20. Implement Trader Dashboard Screen (Bảng điều khiển Quản trị)






  - **Màn hình trung tâm giúp thương lái nắm bắt bức tranh toàn cảnh**
  - **Khu vực Tổng quan (Overview Cards):**
  - 4 thẻ thống kê: Doanh thu ước tính, Đơn hàng mới, Số nông hộ, Sản lượng dự kiến
  - **Biểu đồ Xu hướng thị trường:**
  - Biểu đồ đường hiển thị biến động giá 7 hoặc 30 ngày
  - **Trung tâm Tác vụ (Action Center):**
  - Yêu cầu kết nối: Số nông dân mới gửi hồ sơ (thẻ màu)
  - Đơn hàng mới: Số người mua vừa đặt cọc
  - Cảnh báo rủi ro: Farm Lab có chỉ số vi phạm quy trình
  - Use outline icons for clean look
  - Optimize for 4G network loading
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-T02, FR-T12, US-T01, 7.1, 7.2, 17.1-17.4_

- [x] 21. Implement Trader Supply & Monitor Screen (Quản lý Nguồn cung và Giám sát)





  - **Quản lý mạng lưới nông dân và giám sát tuân thủ quy trình**
  - **Tab Danh sách Nông dân (My Farmers):**
  - Hiển thị: Tên, Loại cây, Trạng thái vụ mùa, Thanh chỉ số tin cậy (Compliance Score)
  - **Tab Tìm kiếm Nguồn cung:**
  - Tích hợp bản đồ số hiển thị vị trí Farm Lab
  - Bộ lọc theo loại nông sản và năng lực sản xuất
  - **Tab Yêu cầu kết nối (Pending Requests):**
  - Danh sách hồ sơ nông dân xin gia nhập
  - Xem chi tiết lịch sử canh tác
  - Nút Chấp nhận/Từ chối
  - **Chi tiết Giám sát:**
  - Dữ liệu IoT thời gian thực của vườn
  - Tự động đối chiếu với quy trình chuẩn
  - Khoanh đỏ vùng dữ liệu sai lệch
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-T07, FR-T08, FR-T09, FR-T11, US-T04_

- [x] 22. Implement Trader Trading & Orders Screen (Sàn giao dịch và Đơn hàng)




  - **Thực hiện nghiệp vụ thương mại với Người mua**
  - **Tab Kho hàng (My Products):**
  - Quản lý tin đăng bán
  - Nút Tạo tin mới: nhập thông tin, tải ảnh, thiết lập giá và đặt cọc
  - **Tab Nhu cầu mua (Buying Requests):**
  - Danh sách yêu cầu tìm nguồn hàng từ người mua
  - Nút Báo giá/Kết nối để gửi đề xuất
  - **Tab Quản lý Đơn hàng (Orders):**
  - Trạng thái: Chờ xác nhận → Đã đặt cọc → Đang giao → Hoàn tất
  - **Chi tiết Đơn hàng:**
  - Thông tin người mua, số tiền đã cọc
  - Nút Gán nguồn cung (chọn lô hàng từ vườn nông dân)
  - Kích hoạt truy xuất nguồn gốc
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-T03, FR-T04, FR-T05, FR-T06, US-T03, 18.1-18.4_

- [x] 23. Implement Trader Standard Library Screen (Thư viện Quy trình)





  - **Thiết lập và chuẩn hóa chất lượng đầu vào**
  - **Danh sách Quy trình:**
  - Hiển thị các bộ tiêu chuẩn đã tạo (VD: Quy trình Bưởi VietGAP)
  - **Công cụ Tạo/Sửa quy trình:**
  - Giao diện biểu mẫu thêm giai đoạn phát triển
  - Các giai đoạn: Gieo hạt, Nảy mầm, Ra hoa, Thu hoạch
  - **Thiết lập tham số:**
  - Cài đặt ngưỡng môi trường cho từng giai đoạn
  - VD: Giai đoạn ra hoa - Nhiệt độ 25-30°C
  - Căn cứ cho AI tự động cảnh báo rủi ro
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-T10, US-T02_

- [x] 24. Implement Trader Profile & News Screen (Hồ sơ và Tin tức)





  - **Quản lý thương hiệu và truyền thông thị trường**
  - **Phần Thông tin Doanh nghiệp:**
  - Chỉnh sửa: Logo, Tên đơn vị, Giấy phép, Mô tả năng lực
  - Hiển thị công khai cho Nông dân và Người mua
  - **Phần Quản lý Tin tức:**
  - Trình soạn thảo văn bản đơn giản
  - Viết bài: Dự báo giá, Chia sẻ kỹ thuật canh tác
  - **Lịch sử đăng bài:**
  - Danh sách bài viết đã đăng
  - Số lượt xem và tương tác
  - Đo lường mức độ quan tâm thị trường
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-T01, FR-T12, US-T05_

- [x] 25. Implement Buyer Marketplace Home Screen (Trang chủ và Chợ Nông sản)





  - **Điểm chạm đầu tiên để tìm kiếm sản phẩm**
  - **Thanh tìm kiếm (Search Bar):**
  - Tìm theo tên nông sản hoặc tên Farm Lab
  - **Banner Tin tức:**
  - Slide chạy ngang hiển thị dự báo giá và tiêu điểm nông vụ
  - **Nút tác vụ nhanh:**
  - Nút Đăng nhu cầu mua (Floating Action Button)
  - **Danh sách Nông sản (Product Feed):**
  - Lưới 2 cột với thẻ sản phẩm
  - Hình ảnh thumbnail hấp dẫn
  - Tên sản phẩm (VD: Bưởi Da Xanh - Vườn chú Bảy)
  - Nhãn Tiêu chuẩn: Tag màu xanh (VietGAP/GlobalGAP)
  - Giá bán dự kiến hoặc Giá đặt cọc
  - Nút Mua ngay hoặc Đặt trước
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-U01, FR-U02, FR-G02, 20.1-20.4_

- [x] 26. Implement Buyer Product Detail & Pre-order Screen (Chi tiết Sản phẩm và Đặt cọc)





  - **Thuyết phục người mua qua dữ liệu minh bạch**
  - **Slider hình ảnh:**
  - Ảnh chụp thực tế sản phẩm và video vườn trồng
  - **Thông tin định danh:**
  - Tên Thương lái, Tên Nông hộ, Địa chỉ vườn (bản đồ nhỏ)
  - **Hồ sơ năng lực vườn:**
  - Tóm tắt lịch sử vụ mùa trước (VD: Đã cung cấp 5 tấn đạt chuẩn)
  - **Thông số cam kết:**
  - Độ ngọt, Kích thước, Không dư lượng thuốc BVTV
  - **Khu vực Đặt hàng (Sticky Footer):**
  - Hiển thị Giá đặt cọc (30-50% giá trị)
  - Nút Đặt cọc ngay (gọi ZaloPay)
  - Nút Chat với Thương lái (dẫn đến Zalo chat)
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-U01, FR-G01_

- [x] 27. Implement Buyer Digital Twin Monitor Screen (Giám sát Bản sao số)





  - **Tính năng quan trọng nhất cho đơn hàng đã đặt cọc**
  - **Mô hình Cây trồng 3D/2D (Visual Stage):**
  - Chiếm 50% màn hình phía trên
  - Hình ảnh cây mô phỏng thay đổi theo thời gian thực
  - Trạng thái thay đổi: nắng gắt, ra hoa, etc.
  - **Nhãn dữ liệu nổi (Overlay):**
  - Bong bóng nhỏ hiển thị Nhiệt độ, Độ ẩm trên hình cây
  - **Dòng thời gian Nhật ký (Timeline):**
  - Trục dọc từ gieo hạt đến hiện tại
  - Mỗi mốc sự kiện (Bón phân, Tưới nước) có icon
  - Nút Xem ảnh để xem hình thực tế nông dân chụp
  - **Camera trực tiếp:**
  - Nút xem ảnh mới nhất hoặc video từ Farm Lab
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-U05, US-U03, US-U05_

- [x] 28. Implement Buyer Orders & Proposals Screen (Quản lý Đơn hàng và Đề xuất)





  - **Quản lý giao dịch và tương tác với thương lái**
  - **Tab Chờ xác nhận (Proposals):**
  - Danh sách Báo giá/Đề xuất từ thương lái
  - Mỗi thẻ: Tên thương lái, Giá chào, Nguồn gốc (link Farm Lab)
  - Hai nút: Chấp nhận (tạo đơn cọc) và Từ chối
  - **Tab Đang thực hiện (Active Orders):**
  - Danh sách đơn hàng đã đặt cọc
  - Thanh trạng thái: Đã cọc → Đang canh tác → Chờ thu hoạch → Đang giao
  - Nút Giám sát vườn (chuyển sang màn hình Bản sao số)
  - **Tab Lịch sử (History):**
  - Đơn hàng đã hoàn tất để mua lại hoặc đánh giá
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-U03, FR-U04, FR-U06_

- [x] 29. Implement Buyer Post Buying Request Screen (Đăng nhu cầu mua)





  - **Chủ động tìm nguồn hàng theo ý muốn**
  - **Form nhập liệu (Step-by-step):**
  - Bước 1: Chọn loại nông sản (Dropdown)
  - Bước 2: Nhập số lượng (kg/tấn) và Khoảng giá mong muốn
  - Bước 3: Chọn tiêu chuẩn (VietGAP, GlobalGAP, Hữu cơ)
  - Bước 4: Mô tả chi tiết (VD: Bưởi size lớn, vỏ xanh không sẹo)
  - **Nút Đăng tin:**
  - Nút lớn màu Zalo Blue ở cuối form
  - Sau khi đăng, hiển thị trên màn hình Thương lái
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-U02, US-U04_

- [x] 30. Implement Buyer Profile & Notification Screen (Tài khoản và Thông báo)





  - **Quản lý thông tin cá nhân và thông báo**
  - **Thông tin cá nhân:**
  - Ảnh đại diện và tên từ Zalo
  - **Trung tâm thông báo:**
  - Danh sách thông báo: Cây đã ra hoa, Đơn hàng xác nhận, Nhắc thanh toán
  - **Ví QR/Mã nhận hàng:**
  - Mã QR để thương lái/vận chuyển quét khi giao hàng
  - Xác nhận đã nhận đủ hàng
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-S03, FR-F06, FR-T06_

- [x] 31. Implement Guest Home & Market News Screen (Trang chủ Khách và Tin tức thị trường)





  - **Màn hình mặc định khi chưa đăng nhập**
  - **Thanh tiêu đề (Header):**
  - Logo ứng dụng và thanh tìm kiếm
  - Nút Đăng nhập/Đăng ký nổi bật (Zalo Blue)
  - **Khu vực Tin tức nổi bật (News Slider):**
  - Trượt ngang các bản tin: Dự báo giá, Cảnh báo thời tiết, Kỹ thuật canh tác
  - **Biểu đồ giá cả (Market Widget):**
  - Xu hướng tăng/giảm nông sản chủ lực (Bưởi, Xoài, Sầu riêng) 7 ngày
  - Bấm vào để xem chi tiết
  - **Danh sách Nông sản nổi bật (Featured Products):**
  - Sản phẩm đang được đặt cọc nhiều nhất
  - Mỗi thẻ: Hình ảnh, Tên sản phẩm, Tên Farm Lab, Giá tham khảo
  - **Thông báo quyền hạn:**
  - Dòng thông báo: "Bạn đang xem ở chế độ Khách. Hãy đăng nhập để đặt cọc và xem camera giám sát"
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-G02, FR-G03, US-G02, 23.1-23.4_

- [x] 32. Implement Guest Traceability Scan Result Screen (Truy xuất nguồn gốc - Quét QR)




  - **Màn hình quan trọng nhất cho Khách khi quét QR trên bao bì**
  - **Ảnh bìa và Định danh:**
  - Ảnh chụp thực tế sản phẩm tại vườn
  - Tên sản phẩm (VD: Bưởi Da xanh Cô Ba) và Tên Farm Lab
  - **Chứng nhận chất lượng:**
  - Huy hiệu (Badges): VietGAP, GlobalGAP, OCOP
  - **Biểu đồ Giám sát môi trường (Environmental Charts):**
  - 3 biểu đồ đường từ ra hoa đến thu hoạch:
  - Nhiệt độ trung bình
  - Độ ẩm đất (chứng minh cây đủ nước)
  - Không sử dụng thuốc BVTV (dựa nhật ký)
  - **Nhật ký canh tác tóm tắt (Timeline Preview):**
  - 3 mốc quan trọng: Xuống giống, Bón phân lần cuối, Thu hoạch
  - Mỗi mốc có ảnh minh chứng nhỏ
  - **Nút Kêu gọi hành động (Sticky Footer):**
  - Nút lớn: "Đăng nhập để xem chi tiết toàn bộ quá trình và đặt mua vụ sau"
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-G01, US-G01, 22.1-22.4_

- [x] 33. Implement Guest Product Detail Screen (Chi tiết Nông sản - Chế độ xem thử)





  - **Giống màn hình Buyer nhưng bị giới hạn tính năng**
  - **Thông tin sản phẩm:**
  - Hình ảnh, mô tả hương vị, quy cách đóng gói
  - Địa chỉ vườn trồng (có bản đồ)
  - **Phần bị làm mờ (Blurred Section):**
  - Camera giám sát thời gian thực bị làm mờ
  - Mô hình Bản sao số (Digital Twin) bị làm mờ hoặc đè ổ khóa
  - **Thông báo mở khóa:**
  - Dòng chữ trên phần mờ: "Tính năng Giám sát vườn và Bản sao số chỉ dành cho thành viên đã đặt cọc"
  - **Khu vực Đánh giá (Reviews):**
  - Đánh giá 5 sao từ người mua trước (Social Proof)
  - **Thanh tác vụ giới hạn:**
  - Nút "Đặt cọc" thay bằng "Đăng ký để mua ngay"
  - Bấm vào chuyển sang màn hình xin quyền Zalo ID (Login)
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: FR-G03_

- [x] 34. Checkpoint - Đảm bảo tất cả screen tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 35. Implement Error Handling




  - Add color validation error handling
  - Implement typography validation error handling
  - Add icon style validation error handling
  - Implement asset loading error fallbacks
  - Add font loading error fallbacks
  - Implement theme configuration error handling
  - _Requirements: 8.1-8.5_

- [ ]* 35.1 Viết unit tests cho error handling
  - Test validation errors throw correctly
  - Test fallback mechanisms work
  - Test error messages are clear
  - _Requirements: 8.1-8.5_

- [x] 36. Implement Performance Optimizations





  - Optimize bundle size to stay under 20MB
  - Implement lazy loading for screens
  - Optimize image assets
  - Add code splitting
  - Implement caching strategies
  - _Requirements: 1.2, 9.2, 9.3, 24.3_

- [ ]* 36.1 Viết performance tests
  - Test bundle size is under 20MB
  - Test component render times
  - Test screen load times
  - _Requirements: 1.2, 9.2, 24.3_

- [ ] 37. Implement Accessibility Features
  - Add ARIA labels to all interactive components
  - Ensure minimum touch targets 44x44px
  - Implement keyboard navigation
  - Test color contrast ratios
  - Add screen reader support
  - _Requirements: 8.1_

- [ ]* 37.1 Viết accessibility tests
  - Test touch target sizes
  - Test color contrast ratios
  - Test ARIA labels present
  - Test keyboard navigation
  - _Requirements: 8.1_

- [x] 38. Create Documentation





  - Write component API documentation
  - Create usage examples for each component
  - Document design tokens
  - Create pattern library
  - Write migration guides
  - _Requirements: 10.1-10.5_

- [x] 39. Setup Visual Regression Testing





  - Configure visual regression testing tool
  - Capture baseline snapshots for all components
  - Capture baseline snapshots for all screens
  - Test on multiple screen sizes (360px, 375px, 414px)
  - _Requirements: 8.1-8.5_

- [ ]* 39.1 Viết visual regression tests
  - Test component snapshots
  - Test screen snapshots
  - Test on iOS and Android
  - _Requirements: 8.1-8.5_

- [x] 40. Final Integration Testing





  - Test complete user flows for Farmer role
  - Test complete user flows for Trader role
  - Test complete user flows for Buyer role
  - Test complete user flows for Guest role
  - Verify 3-click rule across all critical paths
  - Test theme consistency across all screens
  - _Requirements: 1.1-1.4, 5.1-5.3, 8.1-8.5_

- [ ]* 40.1 Viết integration tests
  - Test navigation flows
  - Test data flow between components
  - Test theme application
  - _Requirements: 1.1-1.4, 8.1-8.5_


- [x] 41. Final Checkpoint - Đảm bảo tất cả tests pass




  - Ensure all tests pass, ask the user if questions arise.
