# Project Structure — TrustAgri

> **Lưu ý:** Đây là tổng quan layout + naming convention. Để tra đường dẫn cụ thể của 1 feature/screen/service, dùng [`file-map.md`](./file-map.md) — granular hơn và luôn được giữ đồng bộ với code.

## Root Directory Layout

```
trustagri/
├── be/                          # Backend monorepo (NestJS + Turbo)
├── fe/                          # Frontend (Zalo Mini App)
├── specs/                       # Business & technical specifications
├── CLAUDE.md                    # Project overview & conventions
├── .claude/                     # Claude Code metadata
│   └── docs/                    # This documentation suite
├── .github/                     # GitHub Actions workflows
├── docker-compose.yml           # Local dev databases
└── package.json                 # Root workspace package
```

---

## Backend (`be/`)

### Structure
```
be/
├── package.json                 # Workspace root (Turbo + npm workspaces)
├── tsconfig.json                # TypeScript base config
├── turbo.json                   # Turbo pipeline config
│
├── apps/                        # Microservices
│   ├── auth-service/            # Authentication & authorization
│   │   ├── src/
│   │   │   ├── auth/            # Auth controller, service, JWT strategy
│   │   │   ├── main.ts          # Entry point (NestJS bootstrap)
│   │   │   └── app.module.ts    # Service module wiring
│   │   └── package.json
│   │
│   ├── farm-service/            # Farm profiles, care logs, evidence
│   │   ├── src/
│   │   │   ├── farms/           # Farm CRUD (controller, service, entity, DTO)
│   │   │   ├── care-logs/       # Care log CRUD + sync
│   │   │   ├── standards/       # Farming standards reference
│   │   │   ├── app.module.ts    # Module wiring
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── contract-service/        # Orders, proposals, connections
│   │   ├── src/
│   │   │   ├── orders/          # Buying requests → orders lifecycle
│   │   │   ├── proposals/       # Trader proposals to buyer
│   │   │   ├── contracts/       # Contract lifecycle & audit log
│   │   │   ├── connections/     # Farmer ↔ Trader marketplace
│   │   │   ├── products/        # Product catalog
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── monitoring-service/      # Sensor data, alerts, WebSocket
│   │   ├── src/
│   │   │   ├── sensors/         # Sensor readings (InfluxDB)
│   │   │   ├── alerts/          # Threshold alerts
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── notification-service/    # Multi-channel notifications
│       ├── src/
│       │   ├── notifications/   # Email, SMS, Zalo
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── package.json
│
├── libs/                        # Shared code
│   └── shared/                  # DTOs, interfaces, constants
│       ├── src/
│       │   ├── dto/             # Shared DTO interfaces
│       │   ├── constants/       # Business constants
│       │   └── index.ts         # Public export barrel
│       └── package.json
│
└── integration-tests/           # End-to-end test suite
    ├── src/
    │   ├── auth.spec.ts         # Auth flow tests
    │   ├── farm.spec.ts         # Farm CRUD tests
    │   └── ...
    └── package.json
```

### Key Folders Explained

- **apps/** — Independent microservices; each has own `package.json`, `tsconfig`, database migrations.
- **libs/shared/** — Prebuilt before dev/start; exports DTOs, types, validation rules used across services.
- **integration-tests/** — Full-stack tests hitting real services + databases.

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
│   ├── screens/                 # Feature-based page structure (chi tiết trong file-map.md)
│   │   ├── farmer/              # dashboard, garden, trade, alerts, connections, profile
│   │   ├── trader/              # dashboard, marketplace, library, standard-library,
│   │   │                        # farm-monitoring, supply-monitor, trading-orders,
│   │   │                        # transactions, contracts, connections, profile-news
│   │   ├── buyer/               # dashboard, marketplace, product-detail, sourcing,
│   │   │                        # post-buying-request, orders-proposals, transaction-history,
│   │   │                        # digital-twin-monitor, live-monitor, profile-notification
│   │   ├── guest/               # home-market-news, product-detail, traceability-scan
│   │   └── shared/              # traceability, contracts, contract-change-requests,
│   │                            # connections, notifications, news-feed, profile, standards
│   │
│   ├── components/              # Shared UI components (non-screen)
│   │   ├── layout/              # Main layout wrapper
│   │   │   ├── Layout.tsx       # Root layout + ZMP Router setup
│   │   │   └── Sidebar.tsx      # Navigation sidebar (if needed)
│   │   ├── common/              # Generic components (Card, Modal, etc.)
│   │   └── ...
│   │
│   ├── design-system/           # Zalo design tokens & primitives
│   │   ├── components/          # Design-system components (Button, Input, etc.)
│   │   │   └── Chart.tsx        # Reusable chart component
│   │   ├── tokens/              # Design tokens (colors, spacing, typography)
│   │   │   ├── colors.ts        # Color palette (Zalo Blue, Agri Green, etc.)
│   │   │   ├── spacing.ts       # Margin/padding scale
│   │   │   └── typography.ts    # Font sizes, weights, line heights
│   │   └── index.ts
│   │
│   ├── services/                # Business logic & API layer
│   │   ├── farmService.ts       # Farm CRUD API calls
│   │   ├── authService.ts       # Auth flows (Zalo OAuth, login/logout)
│   │   ├── dashboardService.ts  # Dashboard data fetching
│   │   ├── notificationService.ts
│   │   └── ...
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts           # Auth state + login/logout
│   │   ├── useFarms.ts          # Farm query/mutation
│   │   ├── useMonitoring.ts     # Sensor data hook
│   │   ├── useStableOpenSnackbar.ts
│   │   └── ...                  # useCarePlan, useDevices, useProfile, useStandards,
│   │                            # useTraderReviews, useTrustScore
│   │
│   ├── state/                   # Jotai atoms (global state)
│   │   ├── authAtoms.ts         # Token, userId, currentRole
│   │   ├── authSessionStorage.ts
│   │   ├── monitoringAtoms.ts
│   │   ├── notificationBadgeAtom.ts
│   │   └── resetOnLogout.ts
│   │
│   ├── api/                     # HTTP client
│   │   ├── axios.ts             # Axios instance + interceptors
│   │   └── types.ts             # API response types
│   │
│   ├── router/                  # Routing setup (if separated from Layout)
│   │   ├── routes.ts            # Route definitions
│   │   └── guards.ts            # Role-based route guards
│   │
│   ├── config/                  # Environment & constants
│   │   ├── env.ts               # Vite env vars
│   │   ├── constants.ts         # App constants, endpoints
│   │   └── ...
│   │
│   ├── utils/                   # Helper functions
│   │   ├── formatters.ts        # Number, date, currency formatters
│   │   ├── validators.ts        # Form validation
│   │   └── ...
│   │
│   ├── css/                     # Global styles
│   │   ├── index.css            # Global reset + utilities
│   │   └── tailwind.css         # Tailwind directives
│   │
│   ├── pages/                   # Legacy: demo/reference (optional)
│   │   └── index.tsx            # Dev hub screen (future: remove)
│   │
│   ├── tests/                   # Unit & E2E tests
│   │   ├── unit/
│   │   │   ├── services/        # Service unit tests
│   │   │   └── hooks/           # Hook unit tests
│   │   ├── e2e/                 # Playwright tests
│   │   └── ...
│   │
│   └── static/                  # Static assets (icons, images)
│
└── scripts/
    └── check-bundle-size.js     # Verify bundle < 20MB
```

### Key Folders Explained

- **screens/** — Page-level components organized by role + feature. Each feature is a folder with kebab-case name, containing a PascalCase component.
- **design-system/** — Zalo UI tokens and reusable primitives (not from `zmp-ui` but custom design-system components built on top).
- **services/** — Business logic that wraps API calls and transforms data (MapToDTO, error handling).
- **hooks/** — React hooks for common logic (auth, data fetching, UI state).
- **state/** — Global state using Jotai atoms (minimal, focused on auth + session).
- **api/** — Axios instance with interceptors (auth headers, error parsing, 401 handling).

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
