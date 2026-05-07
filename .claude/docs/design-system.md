# Design System — TrustAgri

> **Mục đích:** Quy chuẩn UI cho Zalo Mini App. Mọi screen / component **phải** tuân thủ. Tokens nằm tại `fe/src/design-system/tokens/`.

---

## 1. Triết lý

- **Native-like:** Cảm giác như tính năng có sẵn của Zalo → giảm thời gian học. Dùng `zmp-ui` làm baseline, design-system custom layer ở trên.
- **Tối ưu kỹ thuật:** Bundle < 20MB (NFR-C01) → System fonts, lazy-load icon nặng.
- **Trực quan hóa dữ liệu:** Ưu tiên biểu đồ + hình ảnh hơn bảng số. Trạng thái cây thể hiện qua màu sắc lá / icon.
- **3-Click Rule (Farmer):** Cảnh báo + ghi nhật ký phải truy cập ≤ 3 chạm từ home (NFR-U01).

---

## 2. Bảng màu (Color Palette)

### Màu chủ đạo (Primary)
| Token | Hex | Vai trò |
|-------|-----|---------|
| `--color-primary` / Zalo Blue | `#0068FF` | Nút hành động chính, navigation, link |
| `--color-success` / Agri Green | `#3EBB6C` | Chỉ số tốt, icon cây, thiên nhiên |

### Màu chức năng (Functional)
| Token | Hex | Vai trò |
|-------|-----|---------|
| `--color-danger` / Alert Red | `#F50000` | Cảnh báo nguy hiểm (temp quá cao, lỗi) |
| `--color-warning` / Warning Yellow | `#FFCC00` | Cảnh báo nhẹ (lá vàng, cần bón phân) |
| `--color-neutral` / Neutral Gray | `#F7F7F8` | Background, border, không gian thoáng |

**Quy tắc:**
- Cảnh báo nguy hiểm BẮT BUỘC dùng red `#F50000` + icon tam giác.
- Trạng thái OK / sinh trưởng tốt dùng green `#3EBB6C`.
- Không tự ý thêm màu mới — nếu cần state mới, đề xuất extend tokens.

---

## 3. Typography

### Font Family
- **iOS:** San Francisco (system)
- **Android:** Roboto (system)
- **Lý do:** Tuân thủ chuẩn ZMP, tối ưu bundle (không nhúng font custom).

### Scale (lớn hơn mức trung bình để Farmer dễ đọc)
| Cấp | Size | Dùng cho |
|-----|------|---------|
| H1 | 22px | Tiêu đề màn hình, tên Farm Lab |
| H2 | 18px | Tên chỉ số môi trường, tiêu đề mục |
| Body | 16px | Nội dung, nhật ký canh tác |
| Small | 14px | **Min** cho thông tin quan trọng (NFR-U03) |

**Cấm:** size < 14px cho thông tin cần đọc.

---

## 4. Iconography

### Phong cách
- **Outline (nét mảnh)** — hiện đại, phù hợp dashboard nhiều dữ liệu.

### Bộ Icon Zalo (điều hướng)
- Home, User, Settings, Notification → từ thư viện Zaui.

### Bộ Icon Nông nghiệp (custom)
| Khái niệm | Hình | Note |
|-----------|------|------|
| Nhiệt độ | Nhiệt kế | dùng cho `sensor_type=temperature` |
| Độ ẩm | Giọt nước | `sensor_type=humidity` |
| Ánh sáng | Mặt trời | `sensor_type=light` |
| Cảnh báo | Tam giác | luôn pair với `--color-danger` hoặc `--color-warning` |

---

## 5. Spacing

| Token | Value | Use |
|-------|-------|-----|
| `xs` | 4px | giữa icon & text |
| `sm` | 8px | giữa item trong list |
| `md` | 16px | padding card, list section |
| `lg` | 24px | padding screen, section break |

---

## 6. Layout & Component Rules

- **Touch target ≥ 44×44px** (NFR-U03).
- **Card / Modal** dùng `--color-neutral` background + 8px border radius.
- **Charts:** dùng `Chart.tsx` từ `fe/src/design-system/components/`. Sparkline cho dashboard, line/bar cho trang chi tiết.
- **Form input:** label trên, error đỏ dưới, placeholder gray.
- **Loading states:** Skeleton block thay vì spinner (giảm cảm giác chậm).
- **Empty states:** Có illustration + CTA, không để màn hình trắng.

---

## 7. Tần suất tham chiếu

Khi viết FE component:
1. Import màu / spacing / font từ `fe/src/design-system/tokens/`. **KHÔNG hardcode.**
2. Dùng `zmp-ui` primitives (Button, Text, Header) trước. Custom design-system component chỉ khi `zmp-ui` thiếu.
3. Test responsive 4.7"–6.7" (NFR-C03).

---

## 8. References
- Tokens: `fe/src/design-system/tokens/{colors,spacing,typography}.ts`
- Components: `fe/src/design-system/components/`
- NFR đầy đủ: [`requirements.md`](./requirements.md) §3
