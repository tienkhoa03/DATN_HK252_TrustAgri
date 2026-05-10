# Plan: Đánh giá thương lái & Trust Score do người mua chấm

**Created:** 2026-05-09
**Status:** done
**Owner:** tienkhoa03@gmail.com
**Related:** FR-T01 (uy tín thương lái), FR-U06 (lịch sử giao dịch), US-U03 (minh bạch), US-T01/T03 (kết nối & uy tín). NFR-S03 (HTTPS), NFR-U01 (3-click), NFR-R03 (friendly error).

## 1. Mục tiêu

Cho phép **người mua (buyer)** chấm điểm 1–5 sao + bình luận tùy chọn cho **thương lái (trader)** sau khi có giao dịch hoàn tất. Lưu các bản ghi đánh giá trong bảng riêng. **Không lưu điểm trung bình tĩnh** — `trustScore` sẽ được tính trên-cầu (live AVG) khi API cần.

## 2. Scope

### In scope
- Thêm bảng `trader_reviews` trong **contract-service** (DB chia với orders/contracts/connections).
- API CRUD review do buyer thực hiện + API `GET /traders/:id/trust-score` tính trung bình live.
- Bỏ `trustScore` cố định trong `users.trader_profile` (JSONB) khỏi nguồn truy vấn — thay bằng aggregate JOIN `trader_reviews` ở các nơi đang đọc / sort theo trustScore.
- FE buyer: nút "Đánh giá thương lái" trong order/contract đã hoàn tất + modal 1–5 sao + comment.
- FE trader: tab/section trong `TraderProfileLayout` hiện điểm trung bình thật + danh sách đánh giá nhận được.
- FE buyer khi xem product detail / trader public preview: điểm sao = giá trị tính live (thay text hardcode).
- Shared DTO + e2e smoke test cho luồng đánh giá.

### Out of scope
- Đánh giá farmer / đánh giá buyer (chỉ trader).
- Moderation / báo cáo review xấu (admin tool — cho lần sau).
- Tổng hợp theo product/contract level (chỉ trader-level).
- Push notification cho trader khi nhận review (có thể publish event nhưng KHÔNG triển khai consumer trong plan này).
- Backfill `trustScore` cũ thành review giả lập.

## 3. Tham chiếu

- `.claude/docs/requirements.md` §2.2 FR-T01, §2.3 FR-U06, §1.3 US-U03.
- `.claude/docs/business-logic.md` §workflow buyer/trader (sau khi order completed).
- `.claude/docs/architecture.md` §2.3 service boundaries (contract-service sở hữu lifecycle order → review thuộc về đây).
- `.claude/rules/10-backend.md` (DTO shared, error format, soft delete, FK cross-service tại DB).
- `.claude/rules/20-frontend.md` (service layer, React Query, design tokens).
- `/specs/backend-api-specification/design.md` §Connections, §Auth (cross-check naming endpoint, không tạo trùng).
- File hiện hữu cần đọc khi thực hiện:
  - `be/apps/auth-service/src/auth/entities/user.entity.ts` (`trader_profile.trustScore` — sẽ deprecate)
  - `be/libs/shared/src/dto/auth.dto.ts:45-50,96-110` (`UserProfileDto.traderProfile.trustScore`, `TraderProfileUpdateDto.trustScore`)
  - `be/apps/contract-service/src/connections/connections.service.ts:79-83, 107` (raw SQL đang dùng `trader_profile->>'trustScore'`)
  - `be/apps/contract-service/src/orders/entities/order.entity.ts` (status `'completed'` — gate đánh giá)
  - `fe/src/screens/shared/profile/TraderProfileLayout.tsx:125, 189-206, 585-587, 720-739`
  - `fe/src/screens/buyer/product-detail/BuyerProductDetailScreen.tsx:380-389` (đang hardcode `4.8 (127 đánh giá)`)
  - `fe/src/screens/buyer/orders-proposals/BuyerOrdersProposalsScreen.tsx`, `BuyerTransactionHistoryScreen.tsx` (đặt entry-point đánh giá)
  - `fe/src/services/connectionService.ts`, `authService.ts` (mock & API hiện đang đọc `trustScore`)

## 4. Thay đổi dự kiến

### 4.1 Backend — Service: **contract-service**

#### Migration / Entity mới

`be/apps/contract-service/src/trader-reviews/entities/trader-review.entity.ts`:

```
trader_reviews
  id            uuid PK
  trader_id     uuid  NOT NULL  (FK cross-service → users.user_id)
  buyer_id      uuid  NOT NULL  (FK cross-service → users.user_id)
  order_id      uuid  NULL      (FK → orders.id ON DELETE SET NULL, nullable để vẫn cho review từ contract trực tiếp)
  rating        int   NOT NULL  CHECK (rating BETWEEN 1 AND 5)
  comment       text  NULL      (max 500 chars enforce ở DTO)
  created_at    timestamptz default now()
  updated_at    timestamptz default now()
  deleted_at    timestamptz NULL  (soft delete)
  UNIQUE (buyer_id, order_id) WHERE order_id IS NOT NULL  -- partial unique: 1 review/buyer/order
  INDEX idx_trader_reviews_trader_id (trader_id)
  INDEX idx_trader_reviews_buyer_id  (buyer_id)
```

DDL bằng raw SQL migration (giống pattern `connections` / `orders`). Thêm vào `apps/contract-service/src/migrations/` (folder mới — các service khác đang dùng `synchronize:true` dev nên kiểm tra cách bootstrap migration hiện tại trước, fallback: thêm entity vào `forFeature` để TypeORM auto-create).

#### Module + files mới

```
be/apps/contract-service/src/trader-reviews/
  trader-reviews.module.ts
  trader-reviews.controller.ts
  trader-reviews.service.ts
  entities/trader-review.entity.ts
  dto/
    create-trader-review.dto.ts          (nội bộ — class-validator)
    update-trader-review.dto.ts
    list-trader-reviews-query.dto.ts     (pagination)
```

Đăng ký `TraderReviewsModule` trong `apps/contract-service/src/app.module.ts`.

#### Endpoint

| Method | Path | Auth/Role | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/traders/:traderId/reviews` | JwtAuthGuard + `buyer` | Buyer tạo review. Body: `CreateTraderReviewDto { orderId?, rating, comment? }`. Validate: tồn tại order `completed` giữa buyerId & traderId (nếu có `orderId`); nếu không truyền `orderId` → reject (giai đoạn này yêu cầu phải gắn order để chống spam). 409 nếu đã review order đó. |
| `GET` | `/api/v1/traders/:traderId/reviews` | JwtAuthGuard | List paginated `ListResponse<TraderReviewDto>`. Query: `page`, `limit`, sort mặc định `created_at DESC`. |
| `GET` | `/api/v1/traders/:traderId/trust-score` | JwtAuthGuard | `{ traderId, average: number\|null, count: number }` — `AVG(rating) FILTER (WHERE deleted_at IS NULL)` + `COUNT(*)`. Round 1 chữ số. |
| `PATCH` | `/api/v1/reviews/:id` | JwtAuthGuard + chủ sở hữu (buyer_id == userId) | Sửa rating/comment trong 7 ngày. |
| `DELETE` | `/api/v1/reviews/:id` | JwtAuthGuard + chủ sở hữu | Soft delete (`deleted_at = now()`). |

Lỗi nghiệp vụ:
- `403` không phải buyer hoặc không phải chủ review.
- `404` traderId không tồn tại / role không phải trader.
- `409` đã review cùng order.
- `400` rating ngoài 1..5.
- Format chuẩn `{ error: { code, message }, requestId }`.

Logger structured (`requestId, userId, action="review.create", traderId, rating`). Không log comment ở level info.

#### Refactor chỗ đang đọc `trustScore` cũ

- `connections.service.ts` `searchTraders`:
  - Thay điều kiện `(u.trader_profile->>'trustScore')::numeric >= $X` bằng:
    `LEFT JOIN ( SELECT trader_id, AVG(rating)::numeric AS avg_rating, COUNT(*) AS rc FROM trader_reviews WHERE deleted_at IS NULL GROUP BY trader_id ) tr ON tr.trader_id = u.user_id`
    rồi filter `tr.avg_rating >= $X` và `ORDER BY tr.avg_rating DESC NULLS LAST`.
  - SELECT thêm `tr.avg_rating, tr.rc` để map vào `traderProfile.trustScore` (nếu vẫn giữ DTO field).
  - Giữ nguyên field `trustScore` trong `UserProfileDto.traderProfile` nhưng nguồn = `avg_rating` (computed). Đổi comment cho rõ.
- `auth-service.controller GET /me`: vẫn trả `traderProfile.trustScore` nhưng FE sẽ ưu tiên endpoint trust-score riêng (auth không có quyền truy DB contract). → Đặt `trustScore` thành `null` trong response của auth-service (trader_profile JSONB nhưng đọc field về `null` ở mapping). FE phải gọi `/traders/:id/trust-score` để lấy giá trị thật.
- Giữ JSONB column nguyên trạng (không drop) để tránh migration phá dữ liệu seed; chỉ stop ghi/đọc cho mục đích trustScore.

#### Shared DTO mới (`be/libs/shared/src/dto/trader-review.dto.ts`)

```ts
export interface TraderReviewDto {
  id: string;
  traderId: string;
  buyerId: string;
  buyerDisplayName?: string;
  orderId?: string;
  rating: number;       // 1..5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustScoreDto {
  traderId: string;
  average: number | null; // null khi chưa có review
  count: number;
}

export class CreateTraderReviewDto {
  @IsUUID() orderId: string;          // bắt buộc giai đoạn này
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() @MaxLength(500) comment?: string;
}

export class UpdateTraderReviewDto {
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() @MaxLength(500) comment?: string;
}
```

Export trong `be/libs/shared/src/index.ts`. Rebuild shared trước khi BE/FE dùng.

#### Test
- Unit (`trader-reviews.service.spec.ts`): create OK, create rejected khi không có completed order, create 409 khi duplicate, AVG đúng với 0/1/N reviews, soft delete loại khỏi trung bình.
- Integration (`be/integration-tests/trader-reviews.spec.ts`): happy path POST → GET trust-score thay đổi.

### 4.2 Frontend — Role: **buyer** + **trader**

#### Service mới

`fe/src/services/traderReviewService.ts`:
- `listTraderReviews(traderId, { page, limit })`
- `getTrustScore(traderId)` → `TrustScoreDto`
- `createTraderReview(traderId, { orderId, rating, comment })`
- `updateTraderReview(reviewId, patch)`
- `deleteTraderReview(reviewId)`
Mock counterpart `fe/src/services/mocks/mockTraderReviewService.ts` để demo chạy không cần BE.

#### Hook

`fe/src/hooks/useTrustScore.ts` (React Query, key `['trust-score', traderId]`, staleTime 60s).
`fe/src/hooks/useTraderReviews.ts` (key `['trader-reviews', traderId, page]`).

#### Buyer

- Entry-point đánh giá:
  - `BuyerOrdersProposalsScreen.tsx` & `BuyerTransactionHistoryScreen.tsx`: với mỗi order có `status === 'completed'` → thêm CTA "Đánh giá thương lái". CTA disabled nếu đã review (tra cứu qua list reviews of trader filter buyerId = self, hoặc thêm field `reviewedAt` vào order DTO sau — giai đoạn này chấp nhận query reviews của buyer hiện tại).
- Component mới `fe/src/components/buyer/TraderReviewModal.tsx`: modal sao 1–5 + textarea ≤500 char, Save → POST.
- `BuyerProductDetailScreen.tsx`: thay block hardcode `4.8 (127 đánh giá)` (line ~380) bằng `useTrustScore(product.traderId)`. Khi `count === 0` hiển thị "Chưa có đánh giá".

#### Trader

- `TraderProfileLayout.tsx`:
  - Header chip điểm sao + số reviews — đọc `useTrustScore(profile.userId)` thay cho `profile.traderProfile.trustScore`.
  - Thêm menu row mới `📝 Đánh giá từ người mua` → mở sub-screen / modal list reviews paginated (read-only cho trader).
  - Public preview modal: cũng đọc trust score qua hook để khớp số thực.

#### Routing
- Không cần route mới (modal/inline). Nếu muốn deep-link list reviews trader → optional route `/trader/reviews` (sub-screen). Chấp nhận không thêm route trong plan này.

#### Tests
- Unit `traderReviewService.spec.ts` (axios mock).
- E2E smoke (`fe/src/tests/e2e/regression/trader-reviews.spec.ts`): buyer login → tìm order completed seed → đánh giá → reload trader profile → score thay đổi.
- Visual baseline: thêm/cập nhật ảnh `TraderProfileLayout` (chip score) + `TraderReviewModal`.

### 4.3 Shared / Cross-cutting

- DTO mới trong `be/libs/shared` (đã liệt kê §4.1).
- Không cần env var mới.
- Notification (out of scope): publish event `trader.review.created` để Notification Service tiêu thụ về sau — chừa hook `connectionPublisher`-style nhưng KHÔNG implement consumer.

## 5. Acceptance criteria

- [ ] FR-T01: trader profile hiển thị trust score do thực tế đánh giá quyết định (không hardcode).
- [ ] FR-U06: từ lịch sử giao dịch buyer truy cập đánh giá ≤ 3 thao tác (NFR-U01).
- [ ] US-U03: buyer xem được điểm + số lượt đánh giá của trader trước khi đặt hàng.
- [ ] DB: bảng `trader_reviews` tạo đúng schema, partial unique `(buyer_id, order_id)` chống duplicate.
- [ ] API: 5 endpoint hoạt động, validate role buyer cho create, owner cho update/delete; format lỗi đúng.
- [ ] Trust score = `AVG(rating)` thực thời, không có cột trung bình tĩnh nào được tăng/giảm.
- [ ] FE buyer: nút đánh giá chỉ hiện ở order `completed`; nộp duplicate → snackbar friendly (NFR-R03).
- [ ] FE trader: chip & list review hiển thị giá trị live; rỗng → "Chưa có đánh giá".
- [ ] `searchTraders` filter `trustScore=X` vẫn chạy (đổi nguồn sang JOIN aggregate, không 500).
- [ ] Test: unit + integration BE pass; FE service unit pass; smoke e2e pass.
- [ ] Bundle vẫn < 20MB (NFR-C01) — chỉ thêm modal nhỏ.

## 6. Bước thực hiện (cho /implementation-plan)

1. **Shared DTO**: tạo `trader-review.dto.ts`, export, build `@trustagri/shared`.
2. **Entity + module**: tạo `TraderReviewEntity`, `TraderReviewsModule`, đăng ký vào `app.module.ts` contract-service. Verify TypeORM tạo bảng (dev `synchronize`).
3. **Migration script** (hoặc raw SQL bootstrap): index, partial unique, check constraint.
4. **Service + controller BE**: implement create/list/trust-score/update/delete; guard role + ownership; throw đúng exceptions.
5. **Refactor `connections.service.searchTraders`**: thay `trader_profile->>'trustScore'` bằng JOIN aggregate; map vào DTO.
6. **Auth-service mapping**: stop trả `trustScore` từ JSONB (set `null`); cập nhật DTO comment.
7. **BE unit + integration tests**; commit checkpoint 1.
8. **FE service + hooks**: `traderReviewService`, `useTrustScore`, `useTraderReviews`, mock service.
9. **FE buyer**: `TraderReviewModal`; entry-points trong `BuyerOrdersProposalsScreen` + `BuyerTransactionHistoryScreen`; thay hardcode trong `BuyerProductDetailScreen`.
10. **FE trader**: `TraderProfileLayout` đổi sang hook trust score + menu "Đánh giá từ người mua"; sub-screen list reviews (read-only).
11. **FE tests**: unit service + smoke e2e + visual baseline.
12. **Update docs**: ghi chú trong `.claude/docs/business-logic.md` (workflow đánh giá), `requirements.md` không sửa (vẫn ánh xạ FR-T01/FR-U06).
13. **Verify**: chạy `npm run dev` BE+FE, login buyer demo, hoàn tất order seed, đánh giá, reload trader profile → score đúng.

## 7. Risks / Open questions

- **Q1**: Có cần check `order.status === 'completed'` mới cho phép review, hay cho phép sau `accepted`? → Đề xuất bắt buộc `completed` (tránh review sớm). Confirm với user.
- **Q2**: Một buyer được review **một order/một lần** hay **một trader/một lần**? → Đề xuất per-order (partial unique đã chuẩn bị); per-trader sẽ dễ thiên lệch. Confirm.
- **Q3**: TTL chỉnh sửa review (đề xuất 7 ngày) — có muốn cho phép sửa vô thời hạn? Plan mặc định 7 ngày, sẽ đặt constant trong service.
- **Q4**: Auth-service cross-service: `searchTraders` join sang `trader_reviews` chỉ chạy được nếu hai bảng cùng DB. Cần confirm contract-service & auth-service có dùng **chung 1 DB** hay tách. Theo `tech-stack.md` các service khác bảng nhưng cùng PostgreSQL instance dev → join được. Production phải re-confirm. Nếu tách hẳn DB → đổi sang gọi HTTP từ connections.service tới `/trust-score` từng trader (n+1, tốn). Default plan giả định cùng DB instance.
- **Q5**: Trader có quyền **xem tên buyer** đã đánh giá không? Plan: hiển thị `displayName`. Nếu cần ẩn → flag.

## 8. Estimate

- Effort: **M** (BE ~1 ngày, FE ~1 ngày, test ~0.5 ngày).
- Order of execution: **BE first** (DTO → entity → endpoint → refactor searchTraders), sau đó FE service + UI. FE có thể song song dùng mock trong khi BE đang dev.
