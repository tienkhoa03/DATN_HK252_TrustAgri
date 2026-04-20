# Thiết kế lại Màn hình Farmer - Phiên bản 2.0

## 📋 Tổng quan

Thiết kế lại hoàn toàn các màn hình Farmer theo phong cách Native Zalo, ưu tiên hiển thị trực quan và tối ưu hóa thao tác chạm.

## 🎯 Cấu trúc mới

### Thay đổi từ phiên bản cũ:

**Phiên bản 1.0 (Đã implement):**
1. Farmer Monitoring Screen (Giám sát riêng)
2. Farmer Alerts Screen (Cảnh báo riêng)
3. Farmer Control Screen (Điều khiển riêng)

**Phiên bản 2.0 (Mới):**
1. **Farmer Dashboard** - Trang chủ tổng hợp (kết hợp monitoring + alerts + control)
2. **Process & Diary** - Quy trình và Nhật ký (mới hoàn toàn)
3. **Market & Connect** - Thị trường và Kết nối (mới hoàn toàn)
4. **Contracts** - Quản lý Hợp đồng (mới hoàn toàn)
5. **Farm Profile** - Hồ sơ Vườn (mới hoàn toàn)

---

## 1. 🏠 Farmer Dashboard (Trang chủ và Giám sát)

### Mục đích
Màn hình quan trọng nhất, xuất hiện ngay khi mở ứng dụng. Tập trung vào thông tin thời gian thực và tác vụ khẩn cấp để đáp ứng quy tắc 3 lần chạm.

### Chức năng bao phủ
- FR-F08 (Giám sát)
- FR-F09 (Cảnh báo)
- FR-F10 (Điều khiển)
- US-F03, US-F05

### Bố cục chi tiết

```
┌─────────────────────────────────────────┐
│ 👤 Chào chú Bảy        🌤️ 28°C  🔔    │ ← Header
├─────────────────────────────────────────┤
│ 🌦️ Widget Thời tiết                    │
│ Nhiệt độ: 28°C | Mưa: 30%              │
├─────────────────────────────────────────┤
│ ⚠️ KHU VỰC CẢNH BÁO (Ưu tiên cao)     │
│ ┌─────────────────────────────────┐   │
│ │ 🔴 Cần tưới nước ngay!          │   │ ← Alert Red nếu vượt ngưỡng
│ │ Độ ẩm đất < 40%                 │   │
│ │ [Bấm để xử lý]                  │   │
│ └─────────────────────────────────┘   │
│ HOẶC                                   │
│ ┌─────────────────────────────────┐   │
│ │ ✅ Vườn đang ổn định            │   │ ← Agri Green nếu bình thường
│ └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ 📊 LƯỚI CẢM BIẾN (2x2)                 │
│ ┌──────────┐ ┌──────────┐            │
│ │ 🌡️ 28°C  │ │ 💧 65%   │            │ ← Nhiệt độ | Độ ẩm đất
│ │ Nhiệt độ │ │ Độ ẩm   │            │
│ └──────────┘ └──────────┘            │
│ ┌──────────┐ ┌──────────┐            │
│ │ ☀️ 850   │ │ 📈 6.5   │            │ ← Ánh sáng | pH
│ │ Ánh sáng │ │ pH đất  │            │
│ └──────────┘ └──────────┘            │
├─────────────────────────────────────────┤
│ ⚡ TÁC VỤ NHANH                        │
│ ┌────┐ ┌────┐ ┌────┐                 │
│ │ 💧 │ │ 💡 │ │ 💨 │                 │ ← Nút tròn 44px
│ │Bơm │ │Đèn │ │Quạt│                 │
│ └────┘ └────┘ └────┘                 │
│ (Xanh = Bật, Xám = Tắt)              │
└─────────────────────────────────────────┘
│ [🏠] [📋] [🤝] [👤]                    │ ← Bottom Nav
│ Trang  Quy   Kết   Tài                │
│ chủ   trình  nối   khoản              │
└─────────────────────────────────────────┘
```

### Yêu cầu kỹ thuật

#### Header
- Lời chào động: "Chào {tên nông dân}"
- Ảnh đại diện nhỏ (32x32px)
- Icon chuông thông báo (badge count nếu có)
- Widget thời tiết: Nhiệt độ + icon + khả năng mưa

#### Khu vực Cảnh báo
- **Trạng thái nguy hiểm:**
  - Background: Alert Red (#F50000) với opacity 10%
  - Border: Alert Red 2px
  - Icon: ⚠️ rung nhẹ (animation)
  - Nút hành động: Zalo Blue
- **Trạng thái bình thường:**
  - Background: Agri Green (#3EBB6C) với opacity 10%
  - Border: Agri Green 2px
  - Icon: ✅
  - Text: "Vườn đang ổn định"

#### Lưới Cảm biến (2x2)
- **Trạng thái bình thường:**
  - Background: White
  - Icon: Agri Green
  - Font size: 24px (số), 14px (label)
- **Trạng thái cảnh báo:**
  - Background: Warning Yellow (#FFCC00) opacity 20%
  - Icon: Rung nhẹ
  - Border: Warning Yellow 2px
- **Trạng thái nguy hiểm:**
  - Background: Alert Red opacity 20%
  - Icon: Rung mạnh
  - Border: Alert Red 2px

#### Thanh Tác vụ Nhanh
- Nút tròn: 44x44px (đảm bảo touch target)
- Icon: 24px
- **Trạng thái Bật:**
  - Background: Zalo Blue (#0068FF)
  - Icon: White
- **Trạng thái Tắt:**
  - Background: Neutral Gray (#F7F7F8)
  - Icon: Gray (#666666)

#### Bottom Navigation
- 4 tabs cố định
- Active state: Zalo Blue
- Inactive state: Gray
- Badge count trên icon nếu cần

---

## 2. 📋 Process & Diary (Quy trình và Nhật ký)

### Mục đích
Giúp nông dân tuân thủ quy trình canh tác chuẩn (VietGAP/GlobalGAP) và cung cấp dữ liệu cho Digital Twin.

### Chức năng bao phủ
- FR-F07 (Xem quy trình)
- US-F02 (Hướng dẫn)
- FR-S04 (Cập nhật nhật ký)

### Bố cục chi tiết

```
┌─────────────────────────────────────────┐
│ Quy trình & Nhật ký            [Menu]  │ ← Header
├─────────────────────────────────────────┤
│ 📊 TIẾN ĐỘ MÙA VỤ                      │
│ ┌─────────────────────────────────┐   │
│ │ ████████░░░░░░░░░░░░░░░░░░░░░░ │   │ ← Progress bar
│ │ Ngày 15/90 - Giai đoạn Ra hoa  │   │
│ └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ ✅ CÔNG VIỆC HÔM NAY                   │
│ ┌─────────────────────────────────┐   │
│ │ ☐ 08:00 - Bón phân NPK         │   │ ← Checkbox
│ │   Liều lượng: 50g/cây          │   │
│ │   [Xem hướng dẫn]              │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ ☑ 10:00 - Kiểm tra sâu bệnh    │   │ ← Checked
│ │   Đã hoàn thành lúc 10:15      │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ ☐ 16:00 - Tỉa cành             │   │
│ │   Tỉa cành yếu và lá già      │   │
│ │   [Xem hướng dẫn]              │   │
│ └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│                                    [📷] │ ← Floating Camera Button
└─────────────────────────────────────────┘
│ [🏠] [📋] [🤝] [👤]                    │
└─────────────────────────────────────────┘
```

### Yêu cầu kỹ thuật

#### Thanh Tiến độ
- Progress bar với % hoàn thành
- Text hiển thị: "Ngày X/Y - Giai đoạn Z"
- Màu: Agri Green cho phần đã hoàn thành

#### Danh sách Công việc
- Checkbox lớn (24x24px) dễ chạm
- Thời gian hiển thị rõ ràng
- Nút "Xem hướng dẫn" mở Modal

#### Modal Hướng dẫn
- Tiêu đề công việc
- Nội dung văn bản hoặc video
- Nút đóng rõ ràng

#### Floating Action Button (Camera)
- Vị trí: Góc dưới phải
- Kích thước: 56x56px
- Icon: Camera 24px
- Background: Zalo Blue
- Shadow: 0 4px 8px rgba(0,0,0,0.2)
- **Chức năng:**
  - Bấm → Mở camera ngay lập tức
  - Chụp ảnh → Tự động gán vào nhật ký ngày hôm đó
  - Hiển thị preview và nút Lưu/Hủy

---

## 3. 🤝 Market & Connect (Thị trường và Kết nối)

### Mục đích
Nông dân tìm kiếm đầu ra và quản lý mối quan hệ với thương lái.

### Chức năng bao phủ
- FR-F02 (Tra cứu thị trường)
- FR-F03 (Tìm đối tác)
- FR-F04 (Quản lý yêu cầu kết nối)
- US-F04

### Bố cục chi tiết

```
┌─────────────────────────────────────────┐
│ Thị trường & Kết nối           [Menu]  │
├─────────────────────────────────────────┤
│ [Thị trường] [Đối tác]                 │ ← Tabs
├─────────────────────────────────────────┤
│ TAB ĐỐI TÁC (Mặc định)                 │
├─────────────────────────────────────────┤
│ 📬 LỜI MỜI KẾT NỐI (2)                 │
│ ┌─────────────────────────────────┐   │
│ │ 👤 Công ty TNHH Nông sản XYZ   │   │
│ │ ⭐ Điểm uy tín: 4.8/5.0        │   │
│ │ 🌾 Cần mua: Cà chua hữu cơ     │   │
│ │ [✅ Chấp nhận] [❌ Từ chối]    │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ 👤 Thương lái Nguyễn Văn A     │   │
│ │ ⭐ Điểm uy tín: 4.5/5.0        │   │
│ │ 🌾 Cần mua: Rau sạch           │   │
│ │ [✅ Chấp nhận] [❌ Từ chối]    │   │
│ └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ 🔍 TÌM KIẾM ĐỐI TÁC                    │
│ ┌─────────────────────────────────┐   │
│ │ [🔍 Tìm thương lái...]         │   │ ← Search bar
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ 👤 Công ty ABC                 │   │
│ │ ⭐ 4.9/5.0 | 📍 TP.HCM         │   │
│ │ [Gửi yêu cầu kết nối]          │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
│ [🏠] [📋] [🤝] [👤]                    │
└─────────────────────────────────────────┘
```

### Tab Thị trường

```
┌─────────────────────────────────────────┐
│ TAB THỊ TRƯỜNG                          │
├─────────────────────────────────────────┤
│ 📈 GIÁ NÔNG SẢN 7 NGÀY QUA             │
│ ┌─────────────────────────────────┐   │
│ │     Biểu đồ đường              │   │
│ │   /\    /\                     │   │
│ │  /  \  /  \  /\                │   │
│ │ /    \/    \/  \               │   │
│ └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ 📊 DỰ BÁO XU HƯỚNG                     │
│ ┌─────────────────────────────────┐   │
│ │ 🌾 Cà chua: ↗️ Tăng 5%         │   │ ← Green
│ │ 🥬 Rau xanh: ↘️ Giảm 3%        │   │ ← Red
│ │ 🥕 Cà rốt: → Ổn định           │   │ ← Gray
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Yêu cầu kỹ thuật

#### Lời mời Kết nối
- Card với border Warning Yellow (có lời mời mới)
- Hiển thị: Tên, Điểm uy tín (⭐), Loại nông sản
- **Nút Chấp nhận:**
  - Background: Agri Green
  - Text: White
  - Size: 44px height
- **Nút Từ chối:**
  - Background: Neutral Gray
  - Text: Gray
  - Size: 44px height

#### Tìm kiếm
- Search bar với icon 🔍
- Placeholder: "Tìm thương lái..."
- Kết quả hiển thị dạng list
- Nút "Gửi yêu cầu kết nối": Zalo Blue

---

## 4. 📄 Contracts (Quản lý Hợp đồng)

### Mục đích
Theo dõi cam kết bao tiêu và xử lý thay đổi pháp lý.

### Chức năng bao phủ
- FR-F05 (Quản lý hợp đồng)
- FR-F06 (Xử lý thay đổi)
- US-F01

### Bố cục chi tiết

```
┌─────────────────────────────────────────┐
│ Quản lý Hợp đồng               [Menu]  │
├─────────────────────────────────────────┤
│ DANH SÁCH HỢP ĐỒNG                      │
│ ┌─────────────────────────────────┐   │
│ │ ✅ Đang thực hiện              │   │ ← Green badge
│ │ 👤 Công ty TNHH ABC            │   │
│ │ 🌾 Sản lượng: 500kg            │   │
│ │ 📅 Thu hoạch: 15/02/2025       │   │
│ │ [Xem chi tiết]                 │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ ⚠️ Yêu cầu thay đổi            │   │ ← Yellow badge
│ │ 👤 Thương lái Nguyễn Văn B     │   │
│ │ 🌾 Sản lượng: 300kg            │   │
│ │ 📅 Thu hoạch: 20/02/2025       │   │
│ │ [Xem chi tiết]                 │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
│ [🏠] [📋] [🤝] [👤]                    │
└─────────────────────────────────────────┘
```

### Chi tiết Hợp đồng

```
┌─────────────────────────────────────────┐
│ ← Chi tiết Hợp đồng            [Menu]  │
├─────────────────────────────────────────┤
│ HỢP ĐỒNG #12345                         │
│ Công ty TNHH ABC                        │
├─────────────────────────────────────────┤
│ ĐIỀU KHOẢN                              │
│ • Sản lượng: 500kg                      │
│ • Giá: 25,000đ/kg                       │
│ • Ngày thu hoạch: 15/02/2025           │
│   ⚠️ Thay đổi: 20/02/2025              │ ← Highlighted
│ • Tiêu chuẩn: VietGAP                   │
│ • Đặt cọc: 5,000,000đ                   │
├─────────────────────────────────────────┤
│ LÝ DO THAY ĐỔI                          │
│ "Do thời tiết không thuận lợi, cần      │
│ dời ngày thu hoạch thêm 5 ngày"         │
└─────────────────────────────────────────┘
│ [✅ Đồng ý thay đổi] [❌ Từ chối]      │ ← Sticky Footer
└─────────────────────────────────────────┘
```

### Yêu cầu kỹ thuật

#### Danh sách Hợp đồng
- **Badge "Đang thực hiện":**
  - Background: Agri Green
  - Text: White
- **Badge "Yêu cầu thay đổi":**
  - Background: Warning Yellow
  - Text: Black

#### Chi tiết Hợp đồng
- Phần thay đổi được highlight:
  - Background: Warning Yellow opacity 30%
  - Icon: ⚠️
  - Text: Bold

#### Sticky Footer
- Cố định ở đáy màn hình
- 2 nút full width
- **Đồng ý:** Agri Green
- **Từ chối:** Alert Red

---

## 5. 👤 Farm Profile (Hồ sơ Vườn)

### Mục đích
Quản lý thông tin định danh và thiết lập phần cứng.

### Chức năng bao phủ
- FR-F01 (Hồ sơ vườn)
- Quản lý thiết bị IoT

### Bố cục chi tiết

```
┌─────────────────────────────────────────┐
│ Hồ sơ Vườn                     [✏️]    │ ← Edit button
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────┐   │
│ │     [Ảnh toàn cảnh vườn]       │   │ ← Hero image
│ └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ THÔNG TIN CHUNG                         │
│ 🏡 Farm Lab A                           │
│ 📏 Diện tích: 2 hecta                   │
│ 📍 Địa chỉ: Mỹ Tho, Tiền Giang         │
│ ┌─────────────────────────────────┐   │
│ │     [Bản đồ nhỏ]               │   │
│ └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ MÃ QR VƯỜN                              │
│ ┌─────────────────────────────────┐   │
│ │                                 │   │
│ │        [QR Code lớn]            │   │ ← For traceability
│ │                                 │   │
│ └─────────────────────────────────┘   │
│ Quét để xem thông tin truy xuất         │
├─────────────────────────────────────────┤
│ QUẢN LÝ THIẾT BỊ IOT                    │
│ ┌─────────────────────────────────┐   │
│ │ 📡 Node Cảm biến #1            │   │
│ │ 🔋 Pin: 85% | 🟢 Online        │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ 📡 Node Cảm biến #2            │   │
│ │ 🔋 Pin: 45% | 🟢 Online        │   │
│ └─────────────────────────────────┘   │
│ ┌─────────────────────────────────┐   │
│ │ 📡 Node Cảm biến #3            │   │
│ │ 🔋 Pin: 15% | 🔴 Offline       │   │
│ └─────────────────────────────────┘   │
│ [+ Thêm thiết bị]                       │
└─────────────────────────────────────────┘
│ [🏠] [📋] [🤝] [👤]                    │
└─────────────────────────────────────────┘
```

### Yêu cầu kỹ thuật

#### Thông tin Chung
- Hero image: 16:9 ratio
- Nút Edit: Icon ✏️ ở góc trên
- Bản đồ: Tích hợp Google Maps hoặc Zalo Maps

#### Mã QR
- Kích thước: 200x200px
- Có thể download hoặc share
- Link đến trang truy xuất nguồn gốc (Guest screen)

#### Quản lý Thiết bị
- **Trạng thái Pin:**
  - > 50%: Green
  - 20-50%: Yellow
  - < 20%: Red
- **Trạng thái Kết nối:**
  - Online: 🟢 Green
  - Offline: 🔴 Red
- Nút "Thêm thiết bị": Zalo Blue

---

## 📊 So sánh Phiên bản

| Tính năng | V1.0 (Cũ) | V2.0 (Mới) |
|-----------|-----------|------------|
| Số màn hình | 3 | 5 |
| Dashboard tổng hợp | ❌ | ✅ |
| Quy tắc 3 lần chạm | Một phần | ✅ Đầy đủ |
| Quy trình canh tác | ❌ | ✅ |
| Quản lý hợp đồng | ❌ | ✅ |
| Thị trường | ❌ | ✅ |
| Hồ sơ vườn | Cơ bản | ✅ Đầy đủ |
| Camera nhật ký | ❌ | ✅ |
| Widget thời tiết | ❌ | ✅ |
| Quick actions | ❌ | ✅ |

---

## 🎯 Ưu điểm Thiết kế Mới

### 1. Tối ưu hóa Workflow
- Dashboard tổng hợp giúp nông dân nắm bắt tình hình ngay lập tức
- Quy tắc 3 lần chạm được tuân thủ nghiêm ngặt
- Quick actions giúp điều khiển thiết bị nhanh chóng

### 2. Hỗ trợ Quy trình
- Màn hình Process & Diary giúp tuân thủ VietGAP/GlobalGAP
- Camera tích hợp giúp ghi nhật ký dễ dàng
- Hướng dẫn chi tiết cho từng công việc

### 3. Kết nối Thị trường
- Tìm kiếm và kết nối thương lái dễ dàng
- Quản lý lời mời và yêu cầu kết nối
- Theo dõi giá thị trường và xu hướng

### 4. Quản lý Hợp đồng
- Theo dõi cam kết bao tiêu
- Xử lý thay đổi điều khoản minh bạch
- Lưu trữ lịch sử hợp đồng

### 5. Quản lý Thiết bị
- Theo dõi trạng thái IoT nodes
- Cảnh báo pin yếu và mất kết nối
- Dễ dàng thêm thiết bị mới

---

## 🚀 Kế hoạch Triển khai

### Phase 1: Refactor màn hình cũ
1. Refactor Monitoring Screen → Dashboard Screen
2. Tích hợp Alerts vào Dashboard
3. Tích hợp Control vào Dashboard (Quick Actions)

### Phase 2: Implement màn hình mới
4. Implement Process & Diary Screen
5. Implement Market & Connect Screen
6. Implement Contracts Screen
7. Implement Farm Profile Screen

### Phase 3: Testing & Polish
8. Integration testing
9. User acceptance testing
10. Performance optimization

---

## 📝 Notes

- Tất cả màn hình phải có demo file
- Tất cả màn hình phải link vào trang chủ
- Tuân thủ design tokens và color system
- Đảm bảo touch targets >= 44x44px
- Responsive cho màn hình 360px-414px
