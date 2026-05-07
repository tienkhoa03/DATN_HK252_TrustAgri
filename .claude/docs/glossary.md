# Glossary — TrustAgri

> **Mục đích:** Thuật ngữ Việt-Anh + định nghĩa nghiệp vụ. Tránh nhầm lẫn khi đặt tên biến / API.

---

## A. Vai trò người dùng (Roles)

| VN | EN | Mã code | Ghi chú |
|----|----|---------|--------|
| Nông dân / Người chăm sóc cây | Farmer | `farmer` | Chủ Farm Lab, log care actions. |
| Thương lái / Đơn vị trung gian | Trader | `trader` | Trung gian bao tiêu + phân phối. |
| Người mua / Người thuê cây | Buyer | `buyer` | End consumer / B2B buyer. Trong code có thể là `user`. |
| Khách vãng lai | Guest | `guest` | Chưa đăng nhập, chỉ truy xuất QR + tin tức. |

---

## B. Khái niệm nghiệp vụ chính

| VN | EN | Định nghĩa |
|----|----|-----------|
| Hồ sơ vườn | Farm / Farm Lab | Đơn vị quản lý: vị trí, diện tích, loại cây, lịch sử canh tác. |
| Nhật ký canh tác | Care Log | Một hành động chăm sóc (watering, pest control...) kèm timestamp, evidence. |
| Minh chứng | Evidence | Ảnh/file đính kèm care log. |
| Quy trình canh tác chuẩn | Standard / Farming Standard | Template VietGAP/GlobalGAP/Hữu cơ với các step + due date. |
| Bước trong quy trình | Step | Một mắt xích của Standard (vd: chuẩn bị đất, gieo hạt). |
| Mã truy xuất | Traceability Code | `TR-<12chars>` unique cho mỗi farm; in trên QR. |
| Cảm biến | Sensor | Thiết bị IoT đo temp/humidity/light/moisture. |
| Cảnh báo | Alert | Sự kiện vượt ngưỡng được persist + push notification. |
| Dữ liệu ước lượng | Imputed data | Sensor mất tín hiệu → model dự đoán; `isImputed=true`. |
| Yêu cầu mua | Order / Buying Request | Buyer đăng cần mua; chứa tiêu chí + giá kỳ vọng. |
| Đề xuất | Proposal | Trader phản hồi Order (giá, terms, delivery). |
| Hợp đồng | Contract | Cam kết bao tiêu khi Proposal được chấp nhận. |
| Yêu cầu kết nối | Connection | Liên kết Farmer ↔ Trader (chuỗi cung ứng). |
| Đặt cọc | Deposit | Buyer đặt trước khi sản xuất; ổn định giá đầu ra. |
| Bao tiêu | Forward contract / Off-take | Trader cam kết mua toàn bộ sản lượng. |
| Bản tin / Dự báo giá | News / Price forecast | Trader (FR-T12) đăng để minh bạch thông tin. |

---

## C. Kỹ thuật

| Thuật ngữ | Ý nghĩa |
|-----------|--------|
| ZMP | Zalo Mini App — platform của Zalo. |
| Zaui | Zalo App UI — design system của Zalo. |
| ZNS | Zalo Notification Service — kênh push notification chính thức. |
| OA | Official Account — kênh broadcast của Zalo. |
| Polyglot Persistence | Nhiều loại DB cho từng dữ liệu phù hợp. |
| Soft delete | `deletedAt IS NOT NULL`, không xóa thật. |
| Audit log | Bảng ghi nhận lịch sử thay đổi (`who, when, what`). |
| 3-Click Rule | Tính năng cốt lõi ≤ 3 chạm từ home (NFR-U01). |
| MAE | Mean Absolute Error — metric đánh giá sai số dữ liệu (NFR-R01). |

---

## D. Mã yêu cầu

- `US-<role><nn>` — User Story (vd: `US-F01`, `US-T03`).
- `FR-<role><nn>` — Functional Requirement.
- `NFR-<category><nn>` — Non-Functional (A=Avail, P=Perf, U=Usability, R=Reliab, C=Compat, S=Security, X=Scale).

---

## E. References
- Catalog đầy đủ: [`requirements.md`](./requirements.md)
- Workflow: [`business-logic.md`](./business-logic.md)
