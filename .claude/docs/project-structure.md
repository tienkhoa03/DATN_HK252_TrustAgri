# Project Structure — TrustAgri

> **Lưu ý:** Đây là tổng quan layout + naming convention. Để tra đường dẫn cụ thể của 1 feature/screen/service, dùng [`file-map.md`](./file-map.md) — granular hơn và luôn được giữ đồng bộ với code.

## Root Directory Layout

```
trustagri/
├── be/                          # Backend monorepo (NestJS + Turbo) — có docker-compose.yml + package.json riêng
├── fe/                          # Frontend (Zalo Mini App) — package.json riêng
├── specs/                       # Đặc tả gốc (backend-api-specification, frontend-ui-specification)
├── docs/                        # Reference: postgres/influxdb/redis_database_design, apis, deploy, GAP_ANALYSIS, TODO
├── scripts/                     # seed-influx.sh
├── .github/                     # workflows/visual-regression.yml, copilot-instructions.md
├── .claude/                     # Claude Code metadata (docs/, rules/, agents/, commands/, plan/)
├── CLAUDE.md                    # Project overview & conventions
└── README.md
```
> Không có `package.json` / `docker-compose.yml` ở repo root — mỗi workspace (`be/`, `fe/`) tự quản. `npm run docker:up` chạy trong `be/`.

---

## Backend (`be/`)

### Structure
```
be/
├── package.json                 # Workspace root (Turbo + npm workspaces)
├── tsconfig.base.json           # TypeScript base config (shared)
├── turbo.json                   # Turbo pipeline config
├── docker-compose.yml           # PostgreSQL + Redis + InfluxDB (local dev)
├── nginx/                       # API Gateway config (routing 3001–3005)
│
├── apps/                        # 5 microservices — mỗi service: main.ts + app.module.ts + <domain>/ folders
│   ├── auth-service/  (3001)    # auth (4 login modes, JWT, multi-role, profile), zalo.service, redis session
│   ├── farm-service/  (3002)    # farms, care-logs (+sync), care-plans, standards, traceability, clients
│   ├── contract-service/ (3003) # buying-requests, proposals, orders, contracts(+audit), contract-change-requests,
│   │                            #   connections, products, trader-reviews, dashboard, clients
│   ├── monitoring-service/(3004)# sensors (InfluxDB+traceability snapshot), devices, alerts, gateway (Socket.IO), clients
│   └── notification-service/(3005)# notifications (in-app/Zalo ZNS), news, forecasts, clients
│        # Mỗi <domain>/: <domain>.controller.ts · <domain>.service.ts · <domain>.module.ts · entities/ · dto/
│        # Mỗi service cũng có: strategies/jwt.strategy.ts · health/ · migrations/ · clients/ (HTTP cross-service)
│
├── libs/shared/src/             # @trustagri/shared — prebuilt trước dev/build
│   ├── dto/                     # DTO chia sẻ: auth, farm, care-plan, contract, monitoring, iot-device,
│   │                            #   notification, forecast, trader-review, common
│   ├── decorators/ guards/ filters/ interceptors/ logger/ middleware/ config/ bootstrap/ types/
│   └── index.ts                 # Public export barrel
│
└── integration-tests/src/*.spec.ts  # E2E tests hit nhiều service + DB thật
```

### Key Folders Explained

- **apps/** — Independent microservices; each has own `package.json`, `tsconfig`, database migrations. Port 3001–3005.
- **libs/shared/** — Prebuilt before dev/start; exports DTOs, decorators, guards, filters, logger used across services.
- **integration-tests/** — Full-stack tests hitting real services + databases.
- **Chi tiết từng domain folder + endpoint:** xem [`file-map.md`](./file-map.md).

---

## Frontend (`fe/`)

### Structure
```
fe/
├── package.json                 # ZMP + Vite + test scripts
├── vite.config.ts              # Vite + ZMP plugin config
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind + design tokens
├── jest.config.js               # Jest unit test config
├── playwright.config.ts         # Playwright E2E config
│
├── src/
│   ├── app.ts                   # Root App component (no JSX extension)
│   │
│   ├── pages/                   # Entry/bootstrap screens (KHÔNG phải legacy)
│   │   ├── AppInitScreen.tsx    # Splash + auto-login theo VITE_AUTH_MODE
│   │   ├── LoginScreen.tsx      # Form login (mode 'password')
│   │   ├── RoleSelectionScreen.tsx # Chọn role khi user có nhiều role
│   │   └── index*.tsx           # Dev hub (index / index-debug / index-step-by-step)
│   │
│   ├── screens/                 # Feature-based pages by role (chi tiết: file-map.md)
│   │   ├── farmer/              # dashboard, garden, trade, alerts, connections, profile
│   │   ├── trader/              # dashboard, marketplace, library, standard-library,
│   │   │                        # farm-monitoring, supply-monitor, trading-orders,
│   │   │                        # transactions, connections, profile-news
│   │   ├── buyer/               # dashboard, marketplace, product-detail, sourcing,
│   │   │                        # post-buying-request, orders-proposals, transaction-history,
│   │   │                        # live-monitor, profile-notification, components
│   │   ├── guest/               # home-market-news, product-detail, traceability-scan
│   │   └── shared/              # traceability, contracts, contract-change-requests,
│   │                            # connections, notifications, news-feed, profile, standards
│   │
│   ├── components/              # Shared non-screen components
│   │   │                        # layout, NotificationBell, ConnectionStatusBanner, TrustWebRouter,
│   │   ├── ErrorBoundary/       #   ChunkErrorBoundary
│   │   ├── RedirectTo/  buyer/  trader/   # role-scoped shared bits
│   │   └── clock.tsx logo.tsx layout.tsx
│   │
│   ├── design-system/           # Custom tokens & primitives (trên nền zmp-ui)
│   │   ├── components/          # Alert, Button, Card, Chart, DigitalTwinViewer, EmptyState,
│   │   │                        #   Gauge, Icon, MapPicker, QRCode, SensorDisplay, SensorLineChart,
│   │   │                        #   Sparkline, Timeline, DiffRow
│   │   ├── layouts/             # ScreenLayout, Header, BottomNavigation, TabNavigation
│   │   ├── tokens/              # colors.ts, spacing.ts, typography.ts, icons.ts, grid.ts
│   │   ├── utils/               # theme/ThemeProvider, validators, errorHandling, spacing, grid
│   │   └── index.ts
│   │
│   ├── services/                # API layer per domain (axios → map DTO → model). 1 file/feature.
│   │                            #   auth, farm, careLog(+offlineQueue/autoSync), carePlan, standard,
│   │                            #   traceability, monitoring, device, connection, contract(+changeRequest),
│   │                            #   order, proposal, buyingRequest, marketplace, dashboard, traderReview,
│   │                            #   notification(+navigation), newsForecast, evidenceUpload, mock(+mocks/)
│   │
│   ├── hooks/                   # useAuth, useFarms, useCarePlan, useDevices, useMonitoring, useProfile,
│   │                            #   useStandards, useTraderReviews, useTrustScore, useStableOpenSnackbar
│   │
│   ├── state/                   # Jotai atoms: authAtoms, authSessionStorage, monitoringAtoms,
│   │                            #   notificationBadgeAtom, resetOnLogout
│   │
│   ├── api/                     # client.ts (axios + auth interceptor), interceptors.ts, errors.ts,
│   │                            #   monitoringSocket.ts (Socket.IO)
│   │
│   ├── router/                  # routes.tsx (tổng route map), RoleGuard.tsx, RequireRole.tsx, roleHome.ts
│   ├── navigation/              # RoleAppShell.tsx, RoleBottomNav.tsx, roleNavModel.ts (shell + bottom nav)
│   │
│   ├── config/env.ts            # Mọi VITE_ env (fail-fast): AUTH_MODE, API base, TRACE base, contract version
│   ├── utils/                   # lazyLoad, uuid, cache, imageOptimization, performance, displayLabels
│   ├── css/                     # app.scss, tailwind.scss
│   ├── tests/                   # unit/, integration/, e2e/(+regression/), visual/, __mocks__/, setup.ts
│   └── static/                  # Static assets (bg.svg, icons)
│
└── scripts/
    └── check-bundle-size.js     # Verify bundle < 20MB
```

### Key Folders Explained

- **pages/** — Bootstrap + auth entry screens (AppInit/Login/RoleSelection) + dev hub; NOT legacy.
- **screens/** — Page-level components by role + feature (kebab-case folder, PascalCase `*Screen.tsx`).
- **design-system/** — Custom tokens + primitives built on top of `zmp-ui`. BẮT BUỘC import tokens, không hardcode.
- **services/** — Wrap axios calls + transform DTO → model + error handling. Component không gọi axios trực tiếp.
- **state/** — Global state via Jotai (auth/session/monitoring badge).
- **api/** — Axios instance with interceptors (auth headers, error parsing, 401 → logout).
- **Chi tiết file + ý nghĩa:** xem [`file-map.md`](./file-map.md).

---

## Specs Directory (`specs/`)

```
specs/
├── backend-api-specification/   # Backend requirements & contracts
│   ├── requirements.md          # User stories, acceptance criteria
│   ├── design.md                # API endpoints, data models, flow diagrams
│   ├── tasks.md                 # Implementation roadmap
│   ├── agent-notes.md           # Notes for AI assistant
│   └── ...
│
└── frontend-ui-specification/   # Frontend requirements
    ├── requirements.md          # User stories (routing, integration)
    ├── design.md                # Screen wireframes, interaction flows
    ├── implementation_plan_fe.md # Frontend roadmap
    ├── tasks.md                 # Task breakdown
    └── agent-notes.md
```

---

## Naming Conventions

### Backend
- **Files:** kebab-case for non-class files; PascalCase for entity/service/controller names (e.g., `farm.entity.ts`, `FarmService`).
- **Folders:** kebab-case (e.g., `care-logs/`, `contract-change-requests/`).
- **DB Columns:** snake_case (e.g., `owner_id`, `crop_type`); mapped from camelCase class properties via TypeORM.

### Frontend
- **Screen Folders:** kebab-case (e.g., `buyer/dashboard`, `farmer/care-log`).
- **Screen Files:** PascalCase (e.g., `BuyerDashboardScreen.tsx`).
- **Component Files:** PascalCase (e.g., `Card.tsx`, `Modal.tsx`).
- **Hook Files:** camelCase (e.g., `useAuth.ts`, `useFarm.ts`).
- **Utility/Service Files:** camelCase (e.g., `formatters.ts`, `authService.ts`).

---

## Dependency Graph Summary

```
Frontend (fe/)
  ↓ (HTTP/WebSocket)
API Gateway
  ↓
Backend Services (be/apps/*)
  ↓ (query/command)
Databases
  - PostgreSQL (transactional: users, farms, contracts, connections)
  - InfluxDB (time-series: sensor readings)
  - Redis (session, cache, latest state)
```
