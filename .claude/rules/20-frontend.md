# Rule: Frontend Development

**Tham chiếu:** [`.claude/docs/design-system.md`](../docs/design-system.md), [`.claude/docs/tech-stack.md`](../docs/tech-stack.md), [`.claude/docs/project-structure.md`](../docs/project-structure.md), `/specs/frontend-ui-specification/`.

## Stack bắt buộc
- React 18.3 + TypeScript 5.3.
- Vite 5.2 + `zmp-vite-plugin`.
- `zmp-ui` cho UI primitives, `zmp-sdk` cho Zalo APIs.
- Tailwind CSS 3.4 + design tokens (`fe/src/design-system/tokens/`).
- Jotai (auth/global), React Query 5 (server cache).
- Axios 1.15 (interceptors trong `fe/src/api/axios.ts`).
- Routing: **ZMP Router/Route** (`zmp-ui`). KHÔNG dùng `react-router-dom` cho navigation chính.

## Cấu trúc

```
fe/src/
  screens/<role>/<kebab-feature>/
    <PascalCaseScreen>.tsx
    index.ts                        # barrel
  components/                        # shared, non-screen
  design-system/{tokens,components}/
  services/<feature>Service.ts       # API + map DTO → model
  hooks/use*.ts
  state/*Atom.ts                     # Jotai
  api/axios.ts                       # interceptors
  config/env.ts                      # Vite env
```

## Pattern

### Component
- Functional + hooks. Default export khi 1 component / file.
- Lazy load màn nặng: `React.lazy()` + `Suspense` skeleton.

### Service layer
- Mỗi feature: `fe/src/services/<feature>Service.ts`.
- Service gọi axios → map DTO → model. Component KHÔNG gọi axios trực tiếp.

### State
- Auth (token, role, userId): Jotai atoms tại `state/authAtom.ts`.
- Server data (farms, contracts, sensor): React Query, key pattern `[domain, id, filters]`.
- KHÔNG dùng Redux.

### Error UX
- Snackbar friendly message (NFR-R03). Parse `error.code` từ backend.
- 401 → clear session + redirect login.
- Network fail → toast retry, KHÔNG retry tự động loop (NFR — respect 429).

### Design System
- BẮT BUỘC import từ `design-system/tokens/`. KHÔNG hardcode màu/font/spacing.
- Touch target ≥ 44×44px, min font 14px (NFR-U03).
- Native-like: dùng `zmp-ui` trước, custom design-system component khi cần.
- Charts: `design-system/components/Chart.tsx`.

## Offline & Sync
- Care log offline: queue trong `localStorage`/IndexedDB với client UUID.
- Reconnect → POST `/care-logs/sync` batch theo timestamp (NFR-R02).
- Idempotent qua client UUID, không duplicate.

## Imputed sensor data (NFR-A01)
- Khi `isImputed=true` từ Monitoring → vẫn render bình thường, có thể đánh dấu nhỏ (chấm xám / icon).
- KHÔNG hiển thị "lỗi" / "không có dữ liệu".

## Bundle (NFR-C01)
- Bundle < 20MB. Dùng `npm run build:check` verify.
- KHÔNG nhúng custom font (dùng system font).
- Code split heavy screen.

## Test
- Unit: Jest, `fe/src/tests/unit/`.
- E2E / Visual: Playwright, `fe/src/tests/e2e/`.
- Visual regression: `npm run test:visual`.

## Convention
- Screen file: PascalCase + suffix `Screen` (`FarmerDashboardScreen.tsx`).
- Folder: kebab-case (`buyer/dashboard`, `farmer/care-log`).
- Hook: camelCase, prefix `use` (`useAuth.ts`).
- Service / util: camelCase (`authService.ts`, `formatters.ts`).
- Component (non-screen): PascalCase.
