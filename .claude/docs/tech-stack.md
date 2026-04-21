# Tech Stack — TrustAgri

## Overview

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Presentation** | Zalo Mini App (React) | Latest ZMP SDK | Mobile UI for farmers, traders, buyers |
| **Framework** | NestJS | 10.4 | Backend microservices framework |
| **Frontend** | React + TypeScript | 18.3 | Component library, state management |
| **UI Library** | zmp-ui + design-system | Latest | Zalo native components + custom tokens |
| **Build** | Vite + Turbo | 5.2, 2.3 | Fast build, monorepo orchestration |
| **ORM** | TypeORM | 0.3 | PostgreSQL entity mapping |
| **Database** | PostgreSQL / InfluxDB / Redis | 15 / 2 / 7 | Polyglot persistence |
| **Auth** | Zalo OAuth + JWT + Passport | — | SSO via Zalo, session management |
| **State** | Jotai + React Query | 2.12, 5.99 | Global atoms + server cache |
| **HTTP** | Axios | 1.15 | API requests + interceptors |
| **Testing** | Jest + Playwright | 29.7, 1.57 | Unit + E2E tests |
| **Monorepo** | npm workspaces + Turbo | — | Shared libs, parallel builds |

---

## Backend Stack

### Core Framework
- **NestJS 10.4** — Modular, decorator-based framework for building scalable Node.js APIs.
- **TypeScript 5.3** — Static typing for backend services.
- **Express 4.18** — HTTP server (underlying NestJS transport).

### Database & Persistence

#### PostgreSQL 15
**Use case:** Transactional, structured data (users, farms, contracts, orders, audit logs)

**Key Schemas:**

- **auth-service:**
  - `users` — User profiles (id, zaloId, email, phone, role, createdAt, updatedAt, deletedAt)
  - Sessions (user_id, token, expiresAt) — managed in Redis, not persisted to DB

- **farm-service:**
  - `farms` — Farm profiles (id, owner_id FK, name, location JSONB, area, cropType, standardId, traceabilityCode, createdAt, updatedAt, deletedAt)
  - `care_logs` — Care actions (id, farm_id, action, notes, timestamp, deviation, createdAt)
  - `evidence` — Evidence attachments (id, care_log_id, fileUrl, fileType, createdAt)
  - `standards` — Farming process templates (id, name, steps, version, createdAt)
  - Indexes: `idx_farms_owner_id`, `idx_farms_standard_id`, `idx_care_logs_farm_id`

- **contract-service:**
  - `orders` (buying requests) — (id, buyer_id, product_id, quantity, description, status, createdAt, updatedAt)
  - `proposals` — Trader responses (id, order_id, trader_id, price, terms, status, createdAt, updatedAt)
  - `contracts` — Agreements (id, buyer_id, farmer_id, farm_id, products, terms, status, startDate, endDate, createdAt, updatedAt, deletedAt)
  - `contract_audit_logs` — Change history (id, contract_id, fieldChanged, oldValue, newValue, changedBy, changedAt)
  - `connections` — Marketplace requests (id, farmer_id, trader_id, status, createdAt, updatedAt)
  - `products` — Product catalog (id, name, description, cropType, unit, createdAt)
  - Indexes on FK columns (buyer_id, farmer_id, order_id, etc.)

- **monitoring-service:**
  - `alerts` — Threshold alerts (id, farm_id, sensor_type, severity, message, acknowledgedAt, createdAt)
  - No sensor data stored here (see InfluxDB)

#### InfluxDB 2.x
**Use case:** Time-series data from IoT sensors (temperature, humidity, light, moisture)

**Measurement structure:**
```
measurement: sensor_readings
tags: farm_id, sensor_id, sensor_type (temperature, humidity, light, moisture)
fields: value (float), isImputed (bool)
timestamp: UTC nanoseconds
```

**Query Pattern:** Range queries (e.g., last 24h, last 7 days) with aggregation (mean, max, min).

#### Redis 7.x
**Use case:** Session storage, cache, real-time state

**Keys:**
- `session:<userId>:<token>` — Session data (user context, expiry)
- `farm:<farmId>:latest` — Latest sensor readings (cache, TTL = 5 min)
- `alert:<farmId>` — Latest alerts (pub/sub for notifications)

---

### Validation & DTO Transformation

- **class-validator** — Decorators for input validation (`@IsString()`, `@IsEmail()`, etc.)
- **class-transformer** — Serialize/deserialize with `@Type()`, `@Transform()`, `@Exclude()`

**Example:**
```typescript
export class CreateFarmDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => FarmLocationDto)
  location: FarmLocationDto;

  @IsNumber()
  @Min(0.1)
  area: number;
}
```

### Authentication & Authorization

- **Passport.js + @nestjs/passport** — Pluggable auth strategies.
- **@nestjs/jwt** — JWT signing and verification.
- **Zalo OAuth** — First-time login: exchange Zalo token for JWT; subsequent: verify JWT via API Gateway.

**Flow:**
1. Client sends Zalo code → Auth Service
2. Auth Service calls Zalo API, creates/updates user
3. Auth Service returns JWT + refresh token
4. Client includes JWT in `Authorization: Bearer <token>` header
5. API Gateway / other services verify JWT (via Auth Service `/verify` endpoint or local key)

### Logging & Observability

- **Logger from @nestjs/common** — Structured logging with log levels (debug, log, warn, error).
- **Health Checks via @nestjs/terminus** — `/health` endpoint for each service.
- **Structured Logs:** Log JSON with `requestId`, `userId`, `action`, `duration`; redact sensitive fields.

### Configuration

- **@nestjs/config** — Load env vars from `.env` files (NODE_ENV, DB_HOST, DB_PORT, JWT_SECRET, etc.).
- **Validation:** ConfigService validates required vars at startup.

### Error Handling

**NestJS Built-in Exceptions:**
- `NotFoundException` (404)
- `BadRequestException` (400)
- `ForbiddenException` (403)
- `ConflictException` (409)
- `UnauthorizedException` (401)

**Custom Exception Filters:** Catch and format all errors as `{ error: { code, message }, requestId }`.

---

## Frontend Stack

### Core Framework
- **React 18.3** — Component library, hooks-based architecture.
- **TypeScript 5.3** — Type safety for React components.
- **ZMP SDK (latest)** — Zalo Mini App platform APIs (login, payment, notification).
- **zmp-ui (latest)** — Zalo UI component library (Button, Text, Header, etc.).

### Build Tools
- **Vite 5.2** — Fast bundler with HMR.
- **zmp-vite-plugin (latest)** — Vite plugin for ZMP build optimization.
- **Turbo (monorepo root)** — Parallel build + caching (not in fe/ but at be/ root).

### Styling
- **Tailwind CSS 3.4** — Utility-first CSS framework.
- **SASS 1.76** — Scoped styles for components (`.module.scss`).
- **PostCSS** — CSS transformations (autoprefixer, Tailwind directives).

**Design Tokens (custom):**
```typescript
// colors.ts
export const colors = {
  primary: '#0068FF',        // Zalo Blue
  success: '#3EBB6C',        // Agri Green
  warning: '#FFCC00',        // Warning Yellow
  danger: '#F50000',         // Alert Red
  neutral: '#F7F7F8',        // Neutral Gray
};

// typography.ts
export const fontSize = {
  h1: '22px',
  h2: '18px',
  body: '16px',
  small: '14px',  // Minimum for readability
};

// spacing.ts
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
};
```

### State Management

#### Jotai
**Usage:** Global atoms for auth (token, userId, role, profile)

**Example:**
```typescript
// state/authAtom.ts
export const userAtom = atom<User | null>(null);
export const tokenAtom = atom<string | null>(null);
export const roleAtom = atom<'farmer' | 'trader' | 'buyer' | 'guest'>('guest');
```

#### React Query
**Usage:** Server-side cache for API data (farms, contracts, notifications)

**Keys pattern:**
```typescript
queryKey: ['farms', userId]
queryKey: ['contracts', farmId, { status: 'active' }]
```

### HTTP & API Integration

#### Axios
**Instance setup:**
```typescript
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.trustagri.vn/api/v1',
  timeout: 10000,
});

// Auth interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = getTokenFromAtom();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
axiosInstance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      // Clear session, redirect to login
    }
    throw parseApiError(err);
  }
);
```

#### API Services
**Pattern:**
```typescript
// services/farmService.ts
export async function fetchFarmList(userId: string): Promise<Farm[]> {
  const response = await axiosInstance.get<ListResponse<FarmDto>>('/farms', {
    params: { ownerId: userId },
  });
  return response.data.items.map(toFarmModel);
}
```

### Component Architecture

**Design-System Components:**
```typescript
// design-system/components/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ variant, size, children, onClick }) => {
  // Implementation with tokens
};
```

**Screen Components:**
```typescript
// screens/farmer/dashboard/FarmerDashboardScreen.tsx
export const FarmerDashboardScreen: React.FC = () => {
  const [data, setData] = useState<Dashboard | null>(null);
  // Fetch from service
  // Render with design-system components
};
```

### Routing

**ZMP Router + Route:**
```typescript
import { ZMPRouter, Route, AnimationRoutes } from 'zmp-ui';

export const Router: React.FC = () => (
  <ZMPRouter>
    <AnimationRoutes>
      <Route path="/farmer/home" element={<FarmerHomeScreen />} />
      <Route path="/farmer/dashboard" element={<FarmerDashboardScreen />} />
      {/* ... */}
    </AnimationRoutes>
  </ZMPRouter>
);
```

### Testing

- **Jest 29.7** — Unit tests for services, hooks, utils.
- **Playwright 1.57** — E2E and visual regression tests.
- **React Testing Library 16.3** — Component rendering tests.

**Test Scripts:**
```bash
npm run test                          # Jest
npm run test:visual                   # Playwright headless
npm run test:visual:headed            # Playwright with browser
npm run test:e2e:regression           # Regression suite
npm run test:e2e:regression:staging   # Against staging backend
```

---

## Integration Points

### Gateway ↔ Auth Service
- **Endpoint:** `POST /auth/verify` — Verify JWT token
- **Request:** `{ token: string }`
- **Response:** `{ userId: string, role: string, valid: boolean }`
- **Cache:** Redis with 60s TTL to reduce auth latency

### Gateway ↔ Farm Service
- **Endpoints:**
  - `GET /farms` — List user farms
  - `POST /farms` — Create farm
  - `GET /farms/:id` — Get farm detail
  - `POST /farms/:id/care-logs` — Add care log
  - `POST /farms/:id/care-logs/sync` — Sync offline care logs

### Monitoring Service ↔ Notification Service
- **Event:** `alert.created` — Published via event bus / message queue
- **Payload:** `{ farmId, alertId, severity, message, timestamp }`
- **Consumer:** Notification Service sends Zalo notification

### Frontend ↔ Monitoring Service (WebSocket)
- **URL:** `wss://api.trustagri.vn/ws/monitoring/:farmId`
- **Auth:** JWT in query param or header
- **Message:** `{ sensorType, value, timestamp, isImputed }`
- **Fallback:** REST GET for historical data if WebSocket unavailable

---

## Environment Configuration

### Backend `.env`
```
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trustagri
DB_USER=postgres
DB_PASSWORD=<secret>
JWT_SECRET=<secret>
JWT_EXPIRY=24h
REDIS_URL=redis://localhost:6379
INFLUXDB_URL=http://localhost:8086
INFLUXDB_ORG=trustagri
INFLUXDB_BUCKET=sensor_readings
INFLUXDB_TOKEN=<secret>
```

### Frontend `.env.local`
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_ZMP_ID=<zalo_app_id>
```

---

## Deployment

### Development
- **Backend:** `npm run dev` — Turbo starts all services in parallel on ports 3001–3005
- **Frontend:** `npm run start` — ZMP dev server on port 3000
- **Databases:** Docker Compose (`npm run docker:up`)

### Production
- **Backend:** Docker images per service, Kubernetes / Docker Swarm orchestration
- **Frontend:** `npm run build` → Vite bundle → `npm run deploy` → Zalo Platform
- **API Gateway:** Kong, Nginx, or managed API gateway
- **Databases:** Managed PostgreSQL, InfluxDB, Redis (AWS RDS, Elastic Cloud, etc.)

---

## Key Dependencies Summary

**Backend Root `package.json`:**
```json
{
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.3.3"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.15",
    "@nestjs/core": "^10.4.15",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/platform-express": "^10.4.15",
    "@nestjs/terminus": "^10.2.3",
    "@nestjs/typeorm": "^10.0.2",
    "typeorm": "^0.3.20",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1"
  }
}
```

**Frontend `package.json`:**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "axios": "^1.15.0",
    "jotai": "^2.12.1",
    "@tanstack/react-query": "^5.99.1",
    "zmp-ui": "latest",
    "zmp-sdk": "latest",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "vite": "^5.2.13",
    "tailwindcss": "^3.4.3",
    "jest": "^29.7.0",
    "playwright": "^1.57.0"
  }
}
```
