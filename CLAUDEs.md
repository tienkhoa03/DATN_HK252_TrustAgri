# TrustAgri — Project Documentation

> **Agent context loading protocol:** Đọc đúng doc theo task, KHÔNG re-explore toàn repo mỗi prompt. Xem [`.claude/rules/00-context-loading.md`](.claude/rules/00-context-loading.md).

## Documentation Source of Truth

Tất cả mô tả chi tiết về dự án nằm trong [`.claude/docs/`](.claude/docs/). Index theo nhu cầu:

| Cần... | Đọc |
|--------|-----|
| **Target file/folder cụ thể** (BE domain, FE screen, service, DTO) | [`.claude/docs/file-map.md`](.claude/docs/file-map.md) — **TRA TRƯỚC Glob/Grep** |
| Yêu cầu nghiệp vụ (US/FR/NFR + traceability) | [`.claude/docs/requirements.md`](.claude/docs/requirements.md) |
| Kiến trúc hệ thống + ADR | [`.claude/docs/architecture.md`](.claude/docs/architecture.md) |
| Workflow nghiệp vụ chi tiết | [`.claude/docs/business-logic.md`](.claude/docs/business-logic.md) |
| Stack, DB schema, env, integration | [`.claude/docs/tech-stack.md`](.claude/docs/tech-stack.md) |
| Cấu trúc thư mục + naming | [`.claude/docs/project-structure.md`](.claude/docs/project-structure.md) |
| Design tokens (color/font/icon/spacing) | [`.claude/docs/design-system.md`](.claude/docs/design-system.md) |
| Thuật ngữ Việt-Anh, mã US/FR/NFR | [`.claude/docs/glossary.md`](.claude/docs/glossary.md) |

**Specs gốc** (KHÔNG sửa): `/specs/backend-api-specification/`, `/specs/frontend-ui-specification/`.

## Sub-agents

- `backend-developer` — implement BE NestJS task. Read `.claude/agents/backend-developer.md`.
- `frontend-developer` — implement FE ZMP task. Read `.claude/agents/frontend-developer.md`.
- `code-reviewer` — review changed code.
- `spec-aligner` — verify code khớp specs + docs.

## Slash commands

- `/make-plan <feature>` — sinh plan vào `.claude/plan/<date>-<slug>.md`. KHÔNG code.
- `/implementation-plan <slug>` — đọc plan + thực thi từng bước, cập nhật status.

## Rules

- [`.claude/rules/00-context-loading.md`](.claude/rules/00-context-loading.md) — protocol đọc context.
- [`.claude/rules/10-backend.md`](.claude/rules/10-backend.md) — quy ước BE.
- [`.claude/rules/20-frontend.md`](.claude/rules/20-frontend.md) — quy ước FE.

## Quick Commands

### Backend (Monorepo with Turbo)
- **Dev**: `npm run dev` — Start all services with turbo in parallel
- **Build**: `npm run build` — Compile all packages/services
- **Test**: `npm run test` — Run Jest tests across all workspaces
- **Lint**: `npm run lint` — Run ESLint across services
- **Docker**: `npm run docker:up` — Start PostgreSQL, Redis, InfluxDB
- **Integration Tests**: `npm run test:integration` — Run integration test suite

### Frontend (Zalo Mini App)
- **Dev**: `npm run start` — Start Zalo dev server via ZMP CLI
- **Build**: `npm run build` — Build Vite bundle for ZMP
- **Deploy**: `npm run deploy` — Deploy to Zalo platform
- **Test**: `npm run test` — Jest unit tests
- **Visual**: `npm run test:visual` — Playwright E2E tests
- **Bundle Check**: `npm run build:check` — Verify bundle size < 20MB

## Architecture Overview

**Layered + Microservices:**
- **Presentation:** Zalo Mini App (React, ZMP SDK)
- **Gateway:** API Gateway (HTTPS, rate limit, auth routing)
- **Business Logic:** 5 NestJS microservices
  - Auth Service (Zalo OAuth, JWT, Redis sessions)
  - Farm Service (profiles, care logs, traceability)
  - Contract Service (orders, proposals, connections)
  - Monitoring Service (sensors, time-series, alerts, WebSocket)
  - Notification Service (multi-channel, async events)
- **Persistence:** PostgreSQL (transactional), InfluxDB (time-series), Redis (cache/session)

## Coding Conventions

### Backend (NestJS + TypeScript)

**Structure per service:**
```
src/
  <domain>/
    controllers/
    services/
    entities/
    dto/
    <domain>.module.ts
```

**Patterns:**
- **Dependency Injection:** Use `@Injectable()` + constructor injection; NestJS IoC container.
- **Entities:** TypeORM `@Entity()` with validation decorators; camelCase properties map to snake_case DB columns.
- **DTOs:** `class-validator` + `class-transformer` for request/response; use `@Type()`, `@Transform()`.
- **Services:** Plain classes with business logic; handle transactions via repositories; use `Logger` from `@nestjs/common`.
- **Controllers:** Thin routers; validate via `@Body()`, `@Param()` with DTO + `@UsePipes(ValidationPipe)`.
- **Error Handling:** Throw `NotFoundException`, `ForbiddenException`, `ConflictException` — NestJS converts to HTTP; log sensitive data only at warn/error with `[REDACTED]`.
- **Comments:** One-line comments only (e.g., `// Mã QR truy xuất công khai`); no multi-line blocks unless explaining non-obvious algorithm.
- **Naming:** camelCase for properties/methods; PascalCase for classes; `snake_case` in DB migrations.

### Frontend (React + TypeScript + Zalo)

**Structure:**
```
src/
  screens/
    <role>/<kebab-feature>/
      <PascalCaseScreen>.tsx
      index.ts (barrel)
  components/         # Shared UI, design-system primitives
  design-system/      # tokens, theme, design-system components
  services/           # API, business logic
  hooks/              # Custom React hooks
  state/              # Jotai atoms, global state
  api/                # Axios instance, interceptors
  config/             # env, constants
```

**Patterns:**
- **Components:** Functional components with hooks; default export if single component per file.
- **Routing:** ZMP Router + Route from `zmp-ui`; no `react-router-dom` for main navigation (dev screens only).
- **State:** Jotai atoms for auth (token, role, userId) and session; React Query for server data; avoid Redux.
- **API Integration:** Axios with auth interceptor; services in `src/services` call API and return DTOs.
- **Error Handling:** Snackbar for user-facing errors; console/log for dev errors; parse backend error structure (`error.code`, `message`).
- **UI Library:** Zalo UI components (`zmp-ui`), design tokens from `src/design-system/tokens`; min body text 14px, touch target 44×44.
- **Lazy Loading:** Code-split heavy screens with `React.lazy()` + `Suspense`.
- **Naming:** PascalCase files for screens/components; kebab-case folders for features; camelCase for variables/functions.

## Core Libraries

### Backend
- **Framework:** NestJS 10.4
- **ORM:** TypeORM 0.3 (PostgreSQL, multi-service foreign keys via migrations)
- **Validation:** class-validator, class-transformer
- **Auth:** Passport JWT, @nestjs/jwt
- **Real-time (optional):** Socket.IO for WebSocket monitoring
- **Config:** @nestjs/config (env-based)
- **Health:** @nestjs/terminus (health checks)
- **Monorepo:** Turbo 2.3 (workspaces: apps/*, libs/shared)
- **Shared:** @trustagri/shared (DTOs, constants, types — prebuilt before dev/build)

### Frontend
- **Framework:** React 18.3 + TypeScript
- **Build:** Vite 5.2 + ZMP Vite Plugin
- **UI Library:** zmp-ui (Zalo Design System), custom `src/design-system`
- **Styling:** Tailwind CSS 3.4 + SASS (scoped styles in components)
- **State:** Jotai 2.12 (auth), React Query 5.99 (server cache)
- **HTTP:** Axios 1.15 (API interceptors)
- **Real-time:** Socket.IO client 4.8 (monitoring WebSocket)
- **SDK:** zmp-sdk (latest — Zalo Mini App APIs)
- **Testing:** Jest 29.7 (unit), Playwright 1.57 (E2E/visual)

## Environment & Deployment

**Dev:**
- Backend: services run on localhost:3001–3005 (turbo dev parallel)
- Frontend: ZMP dev server on localhost:3000 (hot reload)
- DB: Docker containers (PostgreSQL 15, Redis 7, InfluxDB 2)

**Production:**
- API Gateway handles HTTPS + routing
- Microservices behind gateway (no direct exposure)
- Frontend: ZMP deploy command (publishes to Zalo Platform)
- Session: Redis + JWT tokens; refresh token rotation
- Monitoring: Structured logs + metrics to observability stack (elastic/datadog)

## Special Notes

- **Cross-Service Calls:** via HTTP (internal or service-discovery mesh); FK relationships enforced in DB migrations, not TypeORM.
- **Offline Sync:** Frontend queues care-log updates; backend merges on reconnect per timestamp.
- **Rate Limiting:** API Gateway; frontend respects 429 (no auto-retry loop).
- **Traceability:** QR code minted per farm (`TR-<farmId>`); public endpoint for tracing.
- **Audit:** Contract changes, connection requests logged; important actions written to audit table.

## Documentation Files

See `./.claude/docs/` for detailed specs:
- **project-structure.md** — Directory layout, folder purposes
- **tech-stack.md** — Dependencies, database schemas, integration points
- **business-logic.md** — Core workflows (auth, farm management, monitoring, contracts)
