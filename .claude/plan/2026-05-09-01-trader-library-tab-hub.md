# Plan: Đổi tab "Thư viện" của Trader thành hub gồm 2 mục — Tiêu chuẩn canh tác & Tin tức/Dự báo

**Created:** 2026-05-09
**Status:** done
**Owner:** tienkhoa03@gmail.com
**Related:** FR-T10, FR-T12, US-T02, US-T05, NFR-U01 (3-Click Rule)

## 1. Mục tiêu

Hiện tab "Thư viện" ở bottom nav của trader đang link cứng tới `/trader/standards` (Bộ tiêu chuẩn canh tác). Trang `/trader/news` (Tin tức & Dự báo — FR-T12) đã implement nhưng KHÔNG có entry point trên UI → trader chỉ vào được bằng cách gõ URL trực tiếp.

Mục tiêu: biến tab "Thư viện" thành **trang hub** liệt kê 2 module quản trị nội dung của trader (Tiêu chuẩn canh tác + Tin tức & Dự báo), giữ các trang con hiện hữu, không phá vỡ flow đã có.

## 2. Scope

### In scope
- Tạo màn hình hub mới `TraderLibraryHubScreen` tại route `/trader/library`.
- Hub render 2 card lớn (touch target ≥ 44×44, NFR-U03), navigate sang `/trader/standards` và `/trader/news`.
- Cập nhật `roleNavModel.ts`:
  - Tab `library` đổi `path` thành `/trader/library`.
  - `resolveActiveNavId` cho trader: `/trader/library` cũng map về tab `library` (giữ nguyên rule cho `/trader/standards`, `/trader/news`).
- Thêm route mới trong `fe/src/router/routes.tsx`.
- Có nút back / bottom-nav vẫn highlight đúng tab khi vào sub-page.

### Out of scope
- KHÔNG đổi nội dung `TraderStandardLibraryScreen` (FR-T10) — chỉ đổi entry.
- KHÔNG sửa `TraderProfileNewsScreen` (FR-T12) — chỉ đổi entry. (Tab "Doanh nghiệp" bên trong vẫn giữ tạm; cleanup riêng nếu cần.)
- KHÔNG đụng backend / DTO / shared.
- KHÔNG đụng ZMP SDK / auth.

## 3. Tham chiếu

- `.claude/docs/requirements.md` §2.2 (FR-T10, FR-T12), §3.3 (NFR-U01 3-Click Rule).
- `.claude/docs/design-system.md` — token colors / spacing / typography.
- `fe/src/navigation/roleNavModel.ts:26-32, 82-93` — bottom nav trader hiện tại.
- `fe/src/router/routes.tsx:233-242` — block route trader.
- `fe/src/screens/trader/standard-library/TraderStandardLibraryScreen.tsx` — reuse style/icon pattern cho card.
- `/specs/frontend-ui-specification/design.md` — kiểm tra naming convention màn hình hub (nếu spec có nhắc).

## 4. Thay đổi dự kiến

### Frontend

**File mới:**
- `fe/src/screens/trader/library/TraderLibraryHubScreen.tsx` — màn hub, 2 card.
- `fe/src/screens/trader/library/index.ts` — barrel export.

**File sửa:**
- `fe/src/screens/trader/index.ts` — re-export hub mới.
- `fe/src/router/routes.tsx`:
  - Thêm `lazy` import `TraderLibraryHubScreen`.
  - Thêm `<Route path="library" element={<TraderLibraryHubScreen />} />` trong block `/trader`.
- `fe/src/navigation/roleNavModel.ts`:
  - Đổi `TRADER_TABS` item `library` → `path: '/trader/library'`.
  - Trong `resolveActiveNavId` (block trader): mở rộng điều kiện match → `pathname.startsWith('/trader/library') || pathname.startsWith('/trader/standards') || pathname.startsWith('/trader/news')` đều trả `'library'`.
- `fe/src/tests/e2e/regression/phase-routes-smoke.spec.ts` — thêm `/trader/library` vào danh sách smoke (giữ `/trader/news`, `/trader/standards`).

**Pattern UI hub (reference design-system):**
- `Page` từ `zmp-ui` + header tiêu đề "Thư viện" / mô tả ngắn.
- 2 card stacked dọc:
  - Card 1: Icon `book` + tiêu đề "Tiêu chuẩn canh tác" + mô tả "Quản trị bộ quy trình VietGAP / GlobalGAP / Hữu cơ" + chevron right → `navigate('/trader/standards')`.
  - Card 2: Icon `edit` (hoặc `news`/`megaphone` nếu có) + tiêu đề "Tin tức & Dự báo" + mô tả "Đăng bản tin nông vụ, bảng giá, dự báo xu hướng" + chevron right → `navigate('/trader/news')`.
- Dùng tokens: `colors`, `spacing`, `fontSize`, `fontWeight` (KHÔNG hardcode).
- Touch target ≥ 44×44 (NFR-U03), padding ≥ `spacing.md`.
- `useNavigate` từ `react-router-dom` (đang dùng cho nav nội bộ — confirm pattern qua `routes.tsx`; nếu repo dùng ZMP Router chuyển hướng khác thì follow pattern đó).

### Backend
- Không đổi.

### Shared
- Không đổi.

## 5. Acceptance criteria

- [ ] Trader đăng nhập → bottom-nav tab "Thư viện" → vào `/trader/library` (hub).
- [ ] Hub hiển thị 2 card: "Tiêu chuẩn canh tác" + "Tin tức & Dự báo".
- [ ] Tap card 1 → mở `TraderStandardLibraryScreen`; tap card 2 → mở `TraderProfileNewsScreen`. Bottom-nav vẫn highlight tab "Thư viện".
- [ ] 3-Click Rule (NFR-U01): từ home trader → tap tab Thư viện → tap card Tin tức = 2 thao tác → mở được màn quản trị tin tức.
- [ ] Gõ trực tiếp URL `/trader/standards` hoặc `/trader/news` vẫn hoạt động (không regression).
- [ ] E2E smoke pass cho 3 route: `/trader/library`, `/trader/standards`, `/trader/news`.
- [ ] Visual regression Playwright (nếu có baseline) chấp nhận hoặc cập nhật cho hub mới.
- [ ] Không hardcode color/font/spacing — import từ `design-system/tokens`.
- [ ] Bundle size không vượt mốc (NFR-C01) — hub là màn nhỏ, lazy load.

## 6. Bước thực hiện (cho /implementation-plan)

1. Tạo `fe/src/screens/trader/library/TraderLibraryHubScreen.tsx` với 2 card (props: dùng `useNavigate`).
2. Tạo `fe/src/screens/trader/library/index.ts` barrel; cập nhật `fe/src/screens/trader/index.ts`.
3. Sửa `fe/src/router/routes.tsx`: import lazy + thêm `<Route path="library" />`.
4. Sửa `fe/src/navigation/roleNavModel.ts`: đổi `path` của tab `library`, mở rộng match trong `resolveActiveNavId`.
5. Thêm `/trader/library` vào `phase-routes-smoke.spec.ts`.
6. Build + `npm run lint` + `npm run test` (Jest) trong `fe/`.
7. Manual test trên ZMP dev: bottom-nav highlight đúng cho cả 3 route, navigate hoạt động.
8. Commit: feat(fe/trader): chuyển tab Thư viện thành hub gồm Tiêu chuẩn & Tin tức (FR-T10, FR-T12).

## 7. Risks / Open questions

- **Q1:** Có nên rename màn `TraderProfileNewsScreen` không (vì nó còn tab "Doanh nghiệp" — vốn nên ở `/trader/me`)? → **Out of scope** lần này, đánh TODO follow-up.
- **Q2:** Spec FE chính thức có mockup hub này chưa? Nếu có UI khác → align với spec, KHÔNG ép theo plan.
- **Q3:** Nếu repo có nguyên tắc "ZMP Router thay vì react-router-dom cho navigation chính" → check `routes.tsx` đang dùng gì (file dùng `Route` từ react-router-dom theo dấu hiệu hiện tại; nếu khác, tuân theo file hiện hữu).
- **R1:** Visual regression có thể fail do baseline cũ khi tab "library" trỏ thẳng standards. Cập nhật baseline có chủ đích.

## 8. Estimate

- Effort: **S** (1 màn hình mới, sửa 2-3 file routing/nav, ~1-2 giờ).
- Order of execution: FE-only, không cần BE.
