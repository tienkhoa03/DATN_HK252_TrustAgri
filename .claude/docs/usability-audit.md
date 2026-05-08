# Usability Audit — 3-Click Rule (NFR-U01)

**Date:** 2026-05-08  
**Auditor:** tienkhoa03@gmail.com  
**Scope:** Core user flows verified via code inspection

---

## 3-Click Rule Definition

> Every core action must be reachable from the home screen within **≤ 3 taps/clicks**.

---

## Audit Table

| Flow | Role | Path | Click Count | Status | Notes |
|------|------|------|-------------|--------|-------|
| Alert → Acknowledge | Farmer | FarmerDashboard → tap alert → tap "Xác nhận" button | 2 | ✅ Pass | FarmerDashboardScreen alerts section → `acknowledgeAlert` inline |
| Home → Care Log (new) | Farmer | FarmerDashboard → FAB "+" → save | 2–3 | ✅ Pass | FAB opens form; user fills + submits = 3 |
| Home → Đăng nhu cầu mua | Buyer | BuyerMarketplace → FAB "+" | 1 | ✅ Pass | FAB directly calls `onPostBuyingRequest` |
| Home → Xem đơn hàng | Buyer | BuyerMarketplace → BuyerDashboard scroll → tab "Đang thực hiện" | 2 | ✅ Pass | BuyerDashboardScreen embedded in marketplace page |
| Home → Kết nối nông dân | Trader | TraderDashboard → "Kết nối chờ xử lý" card | 1 | ✅ Pass | Action card directly visible on dashboard |
| Home → Tạo sản phẩm | Trader | TraderTradingOrders → tab "Kho hàng" → FAB "+" | 2 | ✅ Pass | Tab switch + FAB |
| Home → Xem hợp đồng | Farmer | FarmerDashboard → bottom nav "Hợp đồng" | 1 | ✅ Pass | Bottom nav direct link |
| Home → Đặt hàng sản phẩm | Buyer | BuyerMarketplace → product card → "Mua ngay" | 2 | ✅ Pass | Product grid is on home screen |
| Notification → Navigate | All | NotificationBell tap → list → tap notification | 2 | ✅ Pass | `notificationLinkToAppPath` resolves deep link |

---

## Deviations

| Flow | Current Clicks | Target | Issue |
|------|---------------|--------|-------|
| Home → Xem lịch sử giao dịch | 3+ | ≤3 | BuyerTransactionHistory requires bottom nav → tab switch; acceptable since not a core flow |
| Home → IoT Sensor detail | 3 | ≤3 | FarmerDashboard → select farm → sensor card = 3 (borderline) |

---

## Conclusion

All **core flows** (FR-T02, FR-U01, FR-F07, FR-F08) comply with the ≤ 3-click rule.  
Two non-core flows are at the boundary; no action required per current MVP scope.
