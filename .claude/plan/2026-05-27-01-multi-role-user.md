# Plan: Multi-role User — 1 tài khoản Zalo có nhiều vai trò

**Created:** 2026-05-27
**Status:** done
**Owner:** Nguyen Tien Khoa
**Related:** FR-S01, US-F01, US-T01, US-U01, NFR-S02, NFR-U01

---

## 1. Mục tiêu

Cho phép 1 tài khoản Zalo sở hữu nhiều vai trò (buyer mặc định; farmer/trader do admin thêm tay qua DB). Khi login, nếu có nhiều role → hiện màn chọn role trước khi vào home. Bất kỳ lúc nào user cũng có thể chuyển role từ profile.

---

## 2. Scope

**In scope:**
- Thay `users.role` (enum đơn) → `users.roles` (text[] array).
- Default role khi tạo mới user = `['buyer']`.
- Endpoint `POST /api/v1/auth/switch-role` — phát JWT mới với active role được chọn.
- FE: `RoleSelectionScreen`, cập nhật login flow, nút chuyển role trong profile.
- Cập nhật DTOs shared (thêm `roles: UserRole[]` vào response).

**Out of scope:**
- Trang admin để thêm role (admin làm trực tiếp trên DB).
- Đăng ký role mới từ phía user (endpoint `POST /auth/register-role` — để sau).
- Thay đổi logic guard / phân quyền endpoint khác (JWT vẫn mang 1 `role` active).

---

## 3. Tham chiếu

- `requirements.md` §2.5 FR-S01 (Định danh & Phân quyền)
- `business-logic.md` §1 (Authentication & Session Management)
- `specs/backend-api-specification/design.md` §4.1 (Auth endpoints, UserProfileDto)
- `specs/frontend-ui-specification/design.md` §FR-S01 (guard route tại layout/router)

---

## 4. Thay đổi dự kiến

### Backend — `auth-service`

**Files sửa:**
- `be/apps/auth-service/src/auth/entities/user.entity.ts`
  - Xoá field `role: UserRole` (enum).
  - Thêm `roles: UserRole[]` (`simple-array` hoặc `jsonb`).
- `be/apps/auth-service/src/auth/auth.service.ts`
  - `login()`: new user → `roles: ['buyer']` thay vì `role: 'guest'`.
  - `issueSessionForUser(user, requestedRole?)`: nhận thêm tham số `requestedRole`; nếu undefined → dùng `user.roles[0]`; validate role thuộc `user.roles` trước khi đưa vào JWT.
  - `mapToProfileDto()`: trả `roles` thay vì `role`.
  - Thêm method `switchRole(userId, newRole)`: validate → gọi `issueSessionForUser(user, newRole)`.
- `be/apps/auth-service/src/auth/auth.controller.ts`
  - Thêm `POST /switch-role` endpoint (`@UseGuards(JwtAuthGuard)`).

**Files mới:**
- `be/apps/auth-service/src/migrations/<timestamp>-add-roles-array.ts`
  - Thêm cột `roles text[]` NOT NULL DEFAULT `'{buyer}'`.
  - Populate: `UPDATE users SET roles = ARRAY[role::text]`.
  - Drop cột `role`.

**Endpoints:**
| Method | Path | Request | Response |
|--------|------|---------|----------|
| `POST` | `/api/v1/auth/switch-role` | `{ role: UserRole }` (Bearer) | `AuthLoginResponseDto` (token mới) |

### Shared DTOs — `be/libs/shared/src/dto/auth.dto.ts`

- `AuthLoginResponseDto`: thêm `roles: UserRole[]`; giữ `role` (active role trong phiên).
- `AuthVerifyResponseDto`: giữ nguyên (`role` active là đủ).
- `UserProfileDto`: thêm `roles: UserRole[]`; giữ `role` (active).
- `JwtPayload`: giữ nguyên (`role` = active role).
- Thêm `AuthSwitchRoleDto` (request body): `{ role: UserRole }`.

### Frontend

**Files sửa:**
- `fe/src/state/authAtoms.ts`
  - `AuthSession`: thêm `roles: UserRole[]`.
  - Thêm `availableRolesAtom = atom(get => get(authSessionAtom)?.roles ?? ['buyer'])`.

- `fe/src/services/authService.ts`
  - Cập nhật kiểu trả về của `login()`, `devLogin()`, `passwordLogin()`: thêm `roles`.
  - Thêm `switchRole(role: UserRole): Promise<AuthSession>` → `POST /auth/switch-role`.

- `fe/src/router/routes.tsx`
  - Thêm `import` lazy `RoleSelectionScreen`.
  - Thêm route `/role-select`.
  - `RootEntry`: sau auth check `session.roles.length > 1` → navigate `/role-select`, ngược lại → `ROLE_HOME_PATH[role]`.

- `fe/src/pages/LoginScreen.tsx`
  - Sau login: if `newSession.roles.length > 1` → navigate `/role-select`, else → `ROLE_HOME_PATH[role]`.

- `fe/src/screens/shared/profile/ProfileScreen.tsx`
  - Thêm `RoleSwitcherButton` — chỉ hiện khi `availableRolesAtom.length > 1`.
  - Tap → navigate `/role-select`.

**Files mới:**
- `fe/src/pages/RoleSelectionScreen.tsx`
  - Hiển thị danh sách cards cho từng role trong `availableRolesAtom`.
  - Tap role → gọi `authService.switchRole(role)` → cập nhật `authSessionAtom` → navigate `ROLE_HOME_PATH[role]`.
  - Skeleton/spinner khi đang gọi API.
  - Không có back button (sau login) hoặc có back button (từ profile).

### Config / env vars

Không cần thêm env var mới.

---

## 5. Acceptance criteria

- [ ] **FR-S01**: user đăng nhập lần đầu → role mặc định `buyer`.
- [ ] **FR-S01**: user có 1 role → vào thẳng home, không qua màn chọn.
- [ ] **FR-S01**: user có 2+ role → hiện `RoleSelectionScreen`, chọn xong mới vào home.
- [ ] **FR-S01**: sau khi vào app, user có thể chuyển role từ profile → hệ thống phát JWT mới, điều hướng đúng home role mới.
- [ ] JWT vẫn chứa 1 `role` active → các guard/endpoint hiện tại không bị break.
- [ ] `POST /auth/switch-role` trả 403 nếu role không thuộc `user.roles`.
- [ ] User mới tạo có `roles = ['buyer']`, không còn `'guest'` làm default.
- [ ] **NFR-U01**: từ home → chuyển role ≤ 3 tap (profile → role select → tap role).
- [ ] Unit test: `AuthService.switchRole` — happy path + forbidden case.
- [ ] FE: `RoleSelectionScreen` render đúng roles, gọi `switchRole`, navigate đúng path.

---

## 6. Bước thực hiện (cho `/implementation-plan`)

### BE steps (thực hiện trước)

1. **[BE-1] Shared DTO update** — sửa `be/libs/shared/src/dto/auth.dto.ts`:
   - Thêm `roles: UserRole[]` vào `AuthLoginResponseDto`, `UserProfileDto`.
   - Thêm class `AuthSwitchRoleDto { role: UserRole }` với validator.
   - Rebuild shared: `cd be && npm run build --workspace=libs/shared`.

2. **[BE-2] DB Migration** — tạo file migration `<timestamp>-add-roles-array.ts`:
   - ADD COLUMN `roles text[]` DEFAULT `'{buyer}'` NOT NULL.
   - UPDATE tất cả row từ `role` → `roles`.
   - DROP COLUMN `role` (và enum type nếu cần).

3. **[BE-3] UserEntity** — sửa `user.entity.ts`:
   - Xoá `role` field.
   - Thêm `roles: UserRole[]` với `@Column({ type: 'simple-array', default: 'buyer' })`.

4. **[BE-4] AuthService** — sửa `auth.service.ts`:
   - `login()`: new user → `roles: ['buyer']`.
   - `issueSessionForUser(user, requestedRole?)`: active role logic.
   - `mapToProfileDto()`: map `roles`.
   - Thêm `async switchRole(userId, newRole)` method.

5. **[BE-5] AuthController + endpoint** — sửa `auth.controller.ts`:
   - `POST /switch-role` → `switchRole(userId, body.role)`.

6. **[BE-6] Unit tests** — thêm test cases vào `auth.service.spec.ts`:
   - `switchRole` happy path.
   - `switchRole` → forbidden khi role không thuộc `user.roles`.

### FE steps (sau khi BE-1 done)

7. **[FE-1] authAtoms** — sửa `fe/src/state/authAtoms.ts`:
   - Thêm `roles: UserRole[]` vào `AuthSession`.
   - Thêm `availableRolesAtom`.

8. **[FE-2] authService** — sửa `fe/src/services/authService.ts`:
   - Cập nhật response types để nhận `roles`.
   - Thêm `switchRole(role)` function.

9. **[FE-3] RoleSelectionScreen** — tạo `fe/src/pages/RoleSelectionScreen.tsx`:
   - Cards theo role icon + label (Nông dân 🌱 / Thương lái 🏪 / Người mua 🛒).
   - Loading state khi gọi `switchRole`.
   - Error snackbar nếu thất bại.

10. **[FE-4] routes.tsx** — thêm route `/role-select`, cập nhật `RootEntry` logic.

11. **[FE-5] LoginScreen** — cập nhật navigate sau login.

12. **[FE-6] ProfileScreen** — thêm `RoleSwitcherButton`.

13. **[FE-7] authSessionStorage** — kiểm tra `resetOnLogout.ts` và `authSessionStorage.ts` để đảm bảo `roles` được persist/clear đúng.

14. **[Verify]** — chạy app với user có 2 roles (seed thủ công qua SQL), test full flow.

---

## 7. Risks / Open questions

| # | Mô tả | Mức | Xử lý |
|---|-------|-----|-------|
| R1 | `simple-array` TypeORM dùng dấu phẩy → không support giá trị có dấu phẩy; nhưng UserRole values không có dấu phẩy → an toàn. | Low | — |
| R2 | Migration DROP COLUMN `role` — nếu có service khác query cột này → break. Kiểm tra: chỉ `auth-service` dùng `users` table trực tiếp. | Low | grep cross-service trước khi chạy migration |
| R3 | Existing seeded dev users có `role = 'farmer'/'trader'` → sau migration `roles = ['farmer']/['trader']` (correct). User `role = 'guest'` → `roles = ['guest']` → không còn auto-buyer. Cần update seed script. | Medium | Sửa seed SQL để dùng `roles` array |
| R4 | `authSessionStorage.ts` persist session → cần include `roles` field khi lưu/đọc. | Medium | Handle ở FE-7 |

---

## 8. Estimate

- **Effort:** M (Medium — ~1–2 ngày)
- **Order:** BE (steps 1–6) → FE (steps 7–14)
- **Parallel:** BE-2 (migration) và BE-3 (entity) có thể làm song song sau BE-1.
