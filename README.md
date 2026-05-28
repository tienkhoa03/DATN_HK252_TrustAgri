# TrustAgri

> Nền tảng kết nối **Nông dân – Thương lái – Người mua** trên Zalo Mini App, kèm giám sát IoT thời gian thực và truy xuất nguồn gốc nông sản qua QR.

TrustAgri là đồ án Capstone xây dựng một hệ sinh thái nông nghiệp số gồm: Zalo Mini App (frontend), 5 NestJS microservices (backend), persistence đa hệ (PostgreSQL + InfluxDB + Redis) và API Gateway Nginx. Mục tiêu: giúp nông dân có đầu ra ổn định, thương lái giám sát tuân thủ quy trình canh tác, người mua biết rõ nguồn gốc, và khách vãng lai có thể quét QR truy xuất ngay tại quầy.

---

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Kiến trúc tổng thể](#kiến-trúc-tổng-thể)
- [Tech Stack](#tech-stack)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Khởi chạy nhanh (Local Dev)](#khởi-chạy-nhanh-local-dev)
- [Triển khai Production](#triển-khai-production)
- [Kiểm thử](#kiểm-thử)
- [Scripts thường dùng](#scripts-thường-dùng)
- [Tài liệu](#tài-liệu)
- [Quy ước Code](#quy-ước-code)
- [Đóng góp](#đóng-góp)

---

## Tính năng chính

### Phân hệ Nông dân (Farmer)
- Quản lý hồ sơ vườn (Farm Lab): vị trí, diện tích, loại cây, lịch sử canh tác.
- Cập nhật nhật ký chăm sóc kèm minh chứng (ảnh, ghi chú) — hỗ trợ **offline-first**, tự sync khi reconnect.
- Theo dõi cảm biến môi trường (nhiệt độ, độ ẩm, ánh sáng) realtime + nhận cảnh báo khi vượt ngưỡng.
- Nhận / xử lý yêu cầu kết nối + hợp đồng bao tiêu từ thương lái.

### Phân hệ Thương lái (Trader)
- Dashboard nhu cầu thị trường, danh sách đơn pre-order.
- Quản trị bộ tiêu chuẩn canh tác (VietGAP, GlobalGAP, Hữu cơ).
- Tìm kiếm Farm Lab, gửi yêu cầu kết nối, đàm phán điều khoản hợp đồng.
- Giám sát realtime cảm biến + nhật ký của các vườn đã ký hợp đồng → đối chiếu tuân thủ.

### Phân hệ Người mua (Buyer)
- Tra cứu nông sản công khai, đặt cọc, đặt hàng trước.
- Đăng nhu cầu mua hàng (chủng loại, số lượng, tiêu chuẩn, giá kỳ vọng).
- Xem proposal từ trader, theo dõi giám sát canh tác cho hợp đồng đã đặt cọc.

### Phân hệ Khách (Guest)
- Quét QR truy xuất nguồn gốc — không cần đăng nhập (`/trace/:code`).
- Xem tin tức, dự báo giá, chợ nông sản nổi bật.

### Cross-cutting
- Đăng nhập qua **Zalo OAuth** + JWT; phân quyền theo vai trò (Farmer / Trader / Buyer / Guest).
- **Multi-role**: 1 user có thể giữ nhiều vai trò và chuyển đổi linh hoạt.
- **Imputed data** (NFR-A01): khi cảm biến mất tín hiệu, hệ vẫn trả giá trị dự đoán + cờ `isImputed=true` — KHÔNG hiển thị "lỗi".
- **WebSocket** push sensor + alert qua Socket.IO; fallback REST khi WS lỗi.
- **Audit log** đầy đủ cho thay đổi hợp đồng & yêu cầu kết nối.

---

## Kiến trúc tổng thể

**Layered + Microservices** — 4 tầng, business logic chia thành 5 service độc lập.

```
┌──────────────────────────────────────────────────────┐
│  Presentation — Zalo Mini App (React 18 + zmp-ui)     │
└────────────────────────┬─────────────────────────────┘
                         │  HTTPS / WebSocket
┌────────────────────────▼─────────────────────────────┐
│  API Gateway — Nginx (auth, rate-limit, routing)      │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  Business Logic — 5 NestJS microservices              │
│  ┌──────────┬──────────────┬──────────┬──────────┐    │
│  │  Auth    │ Notification │  Farm    │ Contract │    │
│  │  3001    │    3002      │  3003    │   3004   │    │
│  └──────────┴──────────────┴──────────┴──────────┘    │
│                  ┌─────────────┐                      │
│                  │ Monitoring  │                      │
│                  │    3005     │                      │
│                  └─────────────┘                      │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│  Persistence — Polyglot                               │
│  PostgreSQL 15  │  InfluxDB 2  │  Redis 7             │
│  (transactional)│ (time-series) │ (session/cache/PS)  │
└──────────────────────────────────────────────────────┘
```

| Service | Port | Vai trò |
|---------|------|---------|
| `auth-service` | 3001 | Zalo OAuth, JWT issue/verify, user & role profile. |
| `notification-service` | 3002 | Multi-channel notify (Zalo ZNS, email, SMS), event consumer. |
| `farm-service` | 3003 | Hồ sơ vườn, care log + sync, evidence, standards, traceability QR. |
| `contract-service` | 3004 | Orders, proposals, contracts, connections, products marketplace. |
| `monitoring-service` | 3005 | Sensor ingest (Influx), threshold alerts, WebSocket push, imputed data. |
| `api-gateway` (nginx) | 3006 | Cổng duy nhất từ FE vào BE — route theo path, HTTPS termination. |

Chi tiết ADR + data flow: [`.claude/docs/architecture.md`](.claude/docs/architecture.md).

---

## Tech Stack

### Backend (`be/`)

| Layer | Tech | Version |
|-------|------|---------|
| Framework | NestJS | 10.4 |
| Language | TypeScript | 5.3 |
| ORM | TypeORM | 0.3 |
| Validation | class-validator + class-transformer | 0.14 / 0.5 |
| Auth | Passport JWT + @nestjs/jwt | 4.0 / 10.2 |
| Realtime | Socket.IO (monitoring WS) | 4.x |
| Health | @nestjs/terminus | 10.2 |
| Monorepo | npm workspaces + Turbo | 2.3 |
| Test | Jest (unit) + custom integration suite | 29.7 |

### Frontend (`fe/`)

| Layer | Tech | Version |
|-------|------|---------|
| Framework | React + TypeScript | 18.3 / 5.3 |
| Build | Vite + zmp-vite-plugin | 5.2 |
| UI | zmp-ui + design-system tokens | latest |
| Styling | Tailwind CSS + SASS | 3.4 |
| State (global) | Jotai | 2.12 |
| State (server) | React Query | 5.99 |
| HTTP | Axios | 1.15 |
| Realtime | socket.io-client | 4.8 |
| SDK | zmp-sdk | latest |
| Test | Jest 29.7 (unit) + Playwright 1.57 (E2E + visual regression) | — |

### Persistence

| DB | Use case |
|----|----------|
| **PostgreSQL 15** | Transactional: users, farms, contracts, orders, care_logs, audit_logs. ACID + FK integrity. |
| **InfluxDB 2** | Time-series: sensor readings (temperature / humidity / light / moisture) + `isImputed`. |
| **Redis 7** | Sessions, JWT verify cache (60s), latest sensor state, pub/sub event bus. |

Schema chi tiết: [`postgres_database_design.md`](./postgres_database_design.md), [`influxdb_database_design.md`](./influxdb_database_design.md), [`redis_database_design.md`](./redis_database_design.md).

---

## Cấu trúc thư mục

```
trustagri/
├── be/                              # Backend monorepo (NestJS + Turbo)
│   ├── apps/
│   │   ├── auth-service/            # Zalo OAuth, JWT, user profile
│   │   ├── farm-service/            # Farm, care log, standards, traceability
│   │   ├── contract-service/        # Orders, proposals, contracts, connections
│   │   ├── monitoring-service/      # Sensors, alerts, WebSocket
│   │   └── notification-service/    # Multi-channel notifications
│   ├── libs/shared/                 # DTOs, constants, types (prebuild)
│   ├── integration-tests/           # End-to-end test suite
│   ├── nginx/                       # API Gateway config
│   ├── docker-compose.yml           # DB + services + gateway stack
│   └── turbo.json                   # Pipeline cache
│
├── fe/                              # Zalo Mini App
│   ├── src/
│   │   ├── screens/                 # farmer/ trader/ buyer/ guest/ shared/
│   │   ├── components/              # Layout + shared UI
│   │   ├── design-system/           # tokens + design-system components
│   │   ├── services/                # API + business logic per feature
│   │   ├── hooks/                   # Custom hooks (useAuth, useFarms, ...)
│   │   ├── state/                   # Jotai atoms (auth, monitoring, ...)
│   │   ├── api/                     # Axios instance + interceptors
│   │   ├── router/                  # ZMP Routes + role guards
│   │   └── tests/                   # unit/ + e2e/
│   ├── playwright.config.ts
│   └── vite.config.mts
│
├── specs/
│   ├── backend-api-specification/   # requirements / design / tasks (source of truth)
│   └── frontend-ui-specification/   # requirements / design / tasks
│
├── .claude/
│   ├── docs/                        # Single source of truth (xem mục Tài liệu)
│   ├── rules/                       # 00-context-loading, 10-backend, 20-frontend
│   ├── agents/                      # Subagent profiles
│   └── plan/                        # Implementation plans (slug theo ngày)
│
├── scripts/seed-influx.sh           # Seed dữ liệu mẫu cho InfluxDB
├── CLAUDE.md                        # Quick reference cho AI agent
├── deploy_instruction.md            # Hướng dẫn deploy
└── README.md                        # ← bạn đang đọc
```

Tra đường dẫn cụ thể của 1 feature/screen/service: [`.claude/docs/file-map.md`](.claude/docs/file-map.md).

---

## Yêu cầu môi trường

| Tool | Version tối thiểu |
|------|-------------------|
| Node.js | 20.x |
| npm | 10.9.x |
| Docker + Docker Compose | 24.x / v2 |
| Git | 2.40+ |
| Zalo Mini App CLI (`zmp`) | latest — [hướng dẫn cài](https://mini.zalo.me/docs/dev-tools/cli/intro/) |

Khuyến nghị: VS Code + [Zalo Mini App Extension](https://mini.zalo.me/docs/dev-tools).

---

## Khởi chạy nhanh (Local Dev)

### 1. Clone & cài deps

```bash
git clone <repo-url> trustagri
cd trustagri

# Backend deps (npm workspaces)
cd be && npm install

# Frontend deps
cd ../fe && npm install
```

### 2. Khởi động databases (PostgreSQL + Redis + InfluxDB)

```bash
cd be
npm run docker:up
```

Lệnh này dùng `be/docker-compose.yml` để chạy:
- PostgreSQL 15 → `localhost:5432`
- Redis 7 → `localhost:6379`
- InfluxDB 2 → `localhost:8086`

Stack đầy đủ (cả 5 service + nginx gateway) chạy được bằng `docker-compose up` — xem [Triển khai Production](#triển-khai-production).

### 3. Tạo file `.env`

Tạo `be/.env` (tham khảo biến trong `docker-compose.yml`):

```env
# Postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=trustagri
POSTGRES_PASSWORD=trustagri_secret
POSTGRES_DB=trustagri

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# InfluxDB
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=trustagri-influx-token
INFLUXDB_ORG=trustagri
INFLUXDB_BUCKET=sensor_data

# JWT / Zalo OAuth
JWT_SECRET=replace-me
ZALO_APP_ID=...
ZALO_APP_SECRET=...

# CORS (FE dev origins)
FE_ORIGINS=http://localhost:3000,http://localhost:3006,http://localhost:5173

# Inter-service URLs (local dev)
AUTH_SERVICE_URL=http://localhost:3001
NOTIFICATION_SERVICE_URL=http://localhost:3002
FARM_SERVICE_URL=http://localhost:3003
CONTRACT_SERVICE_URL=http://localhost:3004
MONITORING_SERVICE_URL=http://localhost:3005
```

Frontend tạo `fe/.env` (tham khảo `fe/src/config/env.ts`):

```env
VITE_API_BASE_URL=http://localhost:3006   # qua nginx gateway
VITE_WS_BASE_URL=ws://localhost:3005      # trực tiếp tới monitoring
VITE_TRACE_BASE_URL=http://localhost:3006/trace
```

### 4. Chạy backend (tất cả service song song)

```bash
cd be
npm run dev
```

Turbo sẽ build `@trustagri/shared` trước, sau đó chạy 5 service trên các port 3001–3005.

### 5. Chạy frontend (Zalo Mini App)

```bash
cd fe
npm run start         # zmp start — dev server ở http://localhost:3000
```

Mở `http://localhost:3000` trên trình duyệt hoặc quét QR bằng Zalo để test trên device.

### 6. (Tùy chọn) Seed dữ liệu InfluxDB

```bash
bash scripts/seed-influx.sh
```

Tham khảo `seed_influxdb.md` cho chi tiết payload + dataset.

---

## Triển khai Production

Stack đầy đủ (5 service + nginx gateway + 3 DB) đóng gói trong `be/docker-compose.yml`:

```bash
cd be
docker-compose up -d --build
```

Sau khi up:
- Gateway: `http://<host>:3006` → forward tới các service nội bộ.
- Frontend deploy lên Zalo Platform:

```bash
cd fe
npm run build:check    # build + verify bundle < 20MB (NFR-C01)
npm run login          # zmp login lần đầu
npm run deploy         # zmp deploy
```

Hướng dẫn từng bước chi tiết (env, SSL, scaling): [`deploy_instruction.md`](./deploy_instruction.md).

---

## Kiểm thử

### Backend

```bash
cd be
npm run test                # Jest unit tests (mọi workspace)
npm run test:integration    # Integration tests (be/integration-tests/)
npm run lint                # ESLint
```

### Frontend

```bash
cd fe
npm run test                # Jest unit
npm run test:coverage       # Jest + coverage report
npm run test:visual         # Playwright E2E + visual regression
npm run test:visual:headed  # Chạy có UI
npm run test:e2e:regression # Suite regression đầy đủ
npm run build:check         # Verify bundle < 20MB
```

Quy ước tên test: `should <expected behavior> when <condition>`.

---

## Scripts thường dùng

### Backend (`be/`)

| Lệnh | Tác dụng |
|------|----------|
| `npm run dev` | Chạy tất cả service song song qua Turbo |
| `npm run build` | Build toàn bộ workspaces |
| `npm run start:all` | Chạy đã build (production-like) |
| `npm run lint` | ESLint toàn repo |
| `npm run test` | Jest unit toàn repo |
| `npm run test:integration` | Suite integration |
| `npm run docker:up` | Up DB containers |
| `npm run docker:down` | Down DB containers |

### Frontend (`fe/`)

| Lệnh | Tác dụng |
|------|----------|
| `npm run start` | ZMP dev server (port 3000) |
| `npm run build` | Vite production bundle |
| `npm run build:check` | Build + verify bundle size |
| `npm run deploy` | `zmp deploy` lên Zalo Platform |
| `npm run test` / `:watch` / `:coverage` | Jest |
| `npm run test:visual` / `:headed` / `:debug` / `:update` | Playwright |

---

## Tài liệu

Single source of truth nằm trong `.claude/docs/`. Đọc theo nhu cầu:

| Cần... | Đọc |
|--------|-----|
| Tra file/folder cụ thể | [`.claude/docs/file-map.md`](.claude/docs/file-map.md) |
| Yêu cầu nghiệp vụ (US/FR/NFR + traceability) | [`.claude/docs/requirements.md`](.claude/docs/requirements.md) |
| Kiến trúc hệ thống + ADR | [`.claude/docs/architecture.md`](.claude/docs/architecture.md) |
| Workflow nghiệp vụ chi tiết | [`.claude/docs/business-logic.md`](.claude/docs/business-logic.md) |
| Stack + DB schema + env + integration | [`.claude/docs/tech-stack.md`](.claude/docs/tech-stack.md) |
| Cấu trúc thư mục + naming | [`.claude/docs/project-structure.md`](.claude/docs/project-structure.md) |
| Design tokens (màu, font, spacing, icon) | [`.claude/docs/design-system.md`](.claude/docs/design-system.md) |
| Thuật ngữ Việt–Anh + mã US/FR/NFR | [`.claude/docs/glossary.md`](.claude/docs/glossary.md) |
| Audit khả năng dùng | [`.claude/docs/usability-audit.md`](.claude/docs/usability-audit.md) |

**Specs gốc** (KHÔNG sửa nếu không có chỉ thị rõ ràng):
- `specs/backend-api-specification/{requirements,design,tasks}.md`
- `specs/frontend-ui-specification/{requirements,design,tasks}.md`

---

## Quy ước Code

### Chung
- Trace mã yêu cầu: comment / commit message ghi `FR-*`, `US-*`, `NFR-*` liên quan.
- Comment 1 dòng, chỉ giải thích **WHY** non-obvious. Không multi-line block.
- Soft delete (`deletedAt`), không hard delete.

### Backend ([`.claude/rules/10-backend.md`](.claude/rules/10-backend.md))
- Cấu trúc: `<domain>/{controllers, services, entities, dto}/<domain>.module.ts`.
- DTO chia sẻ: `be/libs/shared/src/dto/` (rebuild shared trước cross-service).
- Throw NestJS exceptions (`NotFoundException`, `ForbiddenException`, `ConflictException`, …) — format `{ error: { code, message }, requestId }`.
- Log structured JSON; PII / token → `[REDACTED]`.
- File kebab-case, class PascalCase, DB column snake_case.
- KHÔNG dùng TypeORM relations cross-service; FK enforce qua migration.

### Frontend ([`.claude/rules/20-frontend.md`](.claude/rules/20-frontend.md))
- Screen: `fe/src/screens/<role>/<kebab-feature>/<PascalCase>Screen.tsx` + `index.ts` barrel.
- Service-layer: component KHÔNG gọi axios trực tiếp — qua `fe/src/services/<feature>Service.ts`.
- Routing chính dùng **ZMP Router/Route** (`zmp-ui`); KHÔNG dùng `react-router-dom` cho navigation chính (chỉ dev screens).
- State: Jotai (auth), React Query (server cache) — KHÔNG Redux.
- BẮT BUỘC import từ `fe/src/design-system/tokens/`. KHÔNG hardcode màu/font/spacing.
- Touch target ≥ 44×44px, min font 14px (NFR-U03).
- Bundle < 20MB (NFR-C01); code-split màn hình nặng bằng `React.lazy()` + `Suspense`.
- Care log offline: queue trong localStorage/IndexedDB, sync qua `POST /care-logs/sync` (idempotent qua client UUID).
- Sensor data có `isImputed=true` → vẫn render bình thường, có thể đánh dấu nhỏ. KHÔNG hiện "lỗi".

---

## Đóng góp

1. Đọc `.claude/rules/00-context-loading.md` trước khi sửa code.
2. Tạo branch từ `main`, đặt tên theo pattern `<type>/<scope>-<slug>` (vd: `feat/farm-care-log-evidence`).
3. Trace mã FR/US/NFR vào commit message.
4. Chạy `npm run lint && npm run test` trước khi push.
5. PR phải pass CI (`.github/workflows/`) + có description rõ ràng (scope, screenshots nếu là UI).

Subagent hỗ trợ:
- `backend-developer` — implement BE task.
- `frontend-developer` — implement FE task.
- `code-reviewer` — review diff.
- `spec-aligner` — verify code khớp specs + docs.

Slash command:
- `/make-plan <feature>` — sinh implementation plan vào `.claude/plan/<date>-<slug>.md`.
- `/implementation-plan <slug>` — thực thi plan đã có, cập nhật trạng thái.

---

## License

UNLICENSED — Capstone Project, FPT University. Mã nguồn dùng cho mục đích học thuật.
