# Cập nhật Yêu cầu Demo cho Screens

## 📋 Tóm tắt

Đã cập nhật tất cả các task implementation screens trong `tasks.md` để yêu cầu tạo demo file và link vào trang chủ.

## 🎯 Mục đích

Đảm bảo tất cả màn hình được implement đều có:
1. ✅ Demo tương tác để test
2. ✅ Link từ trang chủ để dễ truy cập
3. ✅ Tài liệu và examples đầy đủ

## 📝 Các thay đổi

### 1. Thêm quy tắc chung vào đầu tasks.md

```markdown
## 📋 Quy tắc chung cho Screen Implementation

**Tất cả các màn hình (screens) phải tuân thủ:**
1. ✅ Tạo file `.demo.tsx` với interactive demo
2. ✅ Thêm link đến demo trong `src/pages/index.tsx`
3. ✅ Tạo file `.example.tsx` với các ví dụ sử dụng
4. ✅ Tạo file `.README.md` với tài liệu đầy đủ
5. ✅ Export component trong file `index.ts` của thư mục

**Mục đích:** Đảm bảo tất cả màn hình có thể xem và test dễ dàng từ trang chủ demo.
```

### 2. Cập nhật các task đã hoàn thành

#### Task 17: Farmer Monitoring Screen ✅
```markdown
- [x] 17. Implement Farmer Monitoring Screen
  - Tạo Farmer monitoring screen layout
  - Integrate DigitalTwinViewer component
  - Add environment sensors grid (3 columns)
  - Implement active alerts section
  - Ensure 3-click rule compliance
  - **Create .example.tsx file with demo scenarios** ✅
  - **Add link to demo in src/pages/index.tsx** ✅
  - _Requirements: 5.1-5.3, 11.1-11.4, 12.1-12.6_
```

#### Task 18: Farmer Alerts Screen ✅
```markdown
- [x] 18. Implement Farmer Alerts Screen
  - Tạo Farmer alerts screen layout
  - Implement alert list với priority sorting
  - Add filter functionality
  - Implement view và dismiss actions
  - Use correct colors per severity (Red for critical, Yellow for warning)
  - **Create .demo.tsx file with interactive demo** ✅
  - **Add link to demo in src/pages/index.tsx** ✅
  - _Requirements: 13.1-13.4_
```

#### Task 19: Farmer Control Screen ✅
```markdown
- [x] 19. Implement Farmer Control Screen
  - Tạo device control screen
  - Implement toggle switches với clear states
  - Add immediate visual feedback
  - Use Agri Green for active, Neutral Gray/Alert Red for inactive/error
  - **Create .demo.tsx file with interactive demo** ✅
  - **Add link to demo in src/pages/index.tsx** ✅
  - _Requirements: 14.1-14.4_
```

### 3. Cập nhật các task chưa hoàn thành

Tất cả các task từ 20-24 đã được thêm yêu cầu:

#### Task 20: Trader Dashboard Screen
```markdown
- [ ] 20. Implement Trader Dashboard Screen
  - Tạo Trader dashboard layout
  - Add key metrics cards (Orders, Farms, Revenue)
  - Implement market trends chart
  - Add recent orders list
  - Use outline icons for clean look
  - Optimize for 4G network loading
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: 7.1, 7.2, 17.1-17.4_
```

#### Task 21: Trader Product Management Screen
```markdown
- [ ] 21. Implement Trader Product Management Screen
  - Tạo product listing screen với card layout
  - Implement product form với price, image, standards fields
  - Add image upload với preview
  - Show confirmation với Agri Green color
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: 18.1-18.4_
```

#### Task 22: Buyer Product Browsing Screen
```markdown
- [ ] 22. Implement Buyer Product Browsing Screen
  - Tạo product browsing screen
  - Implement 2-column grid layout
  - Add search và filter functionality
  - Display product cards với image, name, price
  - Add buy button với Zalo Blue color
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: 20.1-20.4_
```

#### Task 23: Guest Origin Tracking Screen
```markdown
- [ ] 23. Implement Guest Origin Tracking Screen
  - Tạo QR scan screen
  - Implement origin information display
  - Add farm information card
  - Show cultivation timeline với icons
  - Display environment data chart
  - Ensure accessible without login
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: 22.1-22.4_
```

#### Task 24: Public News Screen
```markdown
- [ ] 24. Implement Public News Screen
  - Tạo news listing screen với card layout
  - Add thumbnail images
  - Implement price trend chart (Green for up, Red for down)
  - Use Body Text 16px for readability
  - Ensure accessible without login
  - **Create .demo.tsx file with interactive demo**
  - **Add link to demo in src/pages/index.tsx**
  - _Requirements: 23.1-23.4_
```

## 📚 Tài liệu hỗ trợ

### 1. SCREEN_DEMO_TEMPLATE.md
File template chi tiết hướng dẫn cách tạo demo cho mỗi screen:
- Checklist đầy đủ
- Code templates
- Ví dụ cụ thể
- Quy tắc và best practices

### 2. Ví dụ tham khảo
Các screen đã implement đúng chuẩn:
- ✅ FarmerMonitoringScreen (5 demo scenarios)
- ✅ FarmerAlertsScreen (interactive demo)
- ✅ FarmerControlScreen (interactive demo với controls)

## 🎮 Cấu trúc Demo hiện tại

### Trang chủ (src/pages/index.tsx)

```
┌─────────────────────────────────────┐
│  🌾 Farmer Monitoring Screen Demo  │
├─────────────────────────────────────┤
│  📊 Màn hình Giám sát               │
│  [✅ Hoạt động bình thường]         │
│  [⚠️ Cảnh báo nhiệt độ cao]         │
│  [🚨 Tình trạng nguy hiểm]          │
│  [🌱 Giai đoạn mầm]                 │
│  [📊 Dữ liệu bổ khuyết]             │
│                                     │
│  🔔 Màn hình Cảnh báo               │
│  [🔔 Quản lý Cảnh báo]              │
│                                     │
│  🎛️ Màn hình Điều khiển             │
│  [🎛️ Điều khiển Thiết bị]          │
│                                     │
│  🔜 Sắp có thêm...                  │
│  [ ] Trader Dashboard               │
│  [ ] Product Management             │
│  [ ] Product Browsing               │
│  [ ] Origin Tracking                │
│  [ ] News Screen                    │
└─────────────────────────────────────┘
```

## ✅ Lợi ích

### 1. Dễ dàng test
- Tất cả màn hình có thể test từ một nơi
- Không cần chạy nhiều file riêng lẻ
- Demo controls giúp test nhanh các tính năng

### 2. Dễ dàng demo cho stakeholders
- Một URL duy nhất để demo tất cả
- Menu rõ ràng, dễ điều hướng
- Có thể demo trên điện thoại

### 3. Dễ dàng phát triển
- Template rõ ràng để follow
- Ví dụ cụ thể để tham khảo
- Checklist đầy đủ để không bỏ sót

### 4. Dễ dàng maintain
- Tất cả demo ở một nơi
- Dễ cập nhật khi có thay đổi
- Dễ kiểm tra tính nhất quán

## 🚀 Workflow cho task tiếp theo

Khi implement một screen mới:

1. **Đọc template:** `.kiro/specs/zalo-ui-design-system/SCREEN_DEMO_TEMPLATE.md`

2. **Implement component:** Tạo file `.tsx` chính

3. **Tạo demo:** Tạo file `.demo.tsx` với interactive controls

4. **Tạo examples:** Tạo file `.example.tsx` với các ví dụ

5. **Tạo docs:** Tạo file `.README.md` với tài liệu

6. **Export:** Cập nhật `index.ts`

7. **Link vào trang chủ:** Cập nhật `src/pages/index.tsx`
   - Import demo component
   - Thêm vào type DemoScreen
   - Thêm button vào menu
   - Thêm case vào renderDemoScreen

8. **Test:** Chạy `npm start` và test demo

9. **Complete task:** Mark task as completed

## 📊 Tiến độ

### Đã hoàn thành (3/8 screens)
- ✅ Task 17: Farmer Monitoring Screen
- ✅ Task 18: Farmer Alerts Screen
- ✅ Task 19: Farmer Control Screen

### Chưa hoàn thành (5/8 screens)
- ⏳ Task 20: Trader Dashboard Screen
- ⏳ Task 21: Trader Product Management Screen
- ⏳ Task 22: Buyer Product Browsing Screen
- ⏳ Task 23: Guest Origin Tracking Screen
- ⏳ Task 24: Public News Screen

## 🎯 Mục tiêu

Khi hoàn thành tất cả tasks, trang chủ demo sẽ có:
- 8+ màn hình demo
- 4 vai trò người dùng (Farmer, Trader, Buyer, Guest)
- 15+ demo scenarios
- Tất cả có interactive controls
- Tất cả có activity logs
- Tất cả responsive và accessible

## 📝 Notes

- Tất cả các yêu cầu demo đã được đánh dấu **bold** trong tasks.md
- Template chi tiết có sẵn tại SCREEN_DEMO_TEMPLATE.md
- Các screen đã hoàn thành có thể dùng làm reference
- Mọi screen mới phải follow cùng pattern để đảm bảo consistency

---

**Cập nhật bởi:** Kiro AI Agent
**Ngày:** 2024
**Mục đích:** Đảm bảo tất cả screens có demo và dễ dàng test/demo
