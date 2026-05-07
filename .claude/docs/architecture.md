# Architecture — TrustAgri

> **Mục đích:** Mô tả lý do + cấu trúc kiến trúc cấp hệ thống. Đọc khi cần ra quyết định về service boundary, data flow, công nghệ. Workflow chi tiết xem [`business-logic.md`](./business-logic.md). Stack chi tiết xem [`tech-stack.md`](./tech-stack.md).

---

## 1. Mô hình tổng thể

**Layered Architecture** (4 tầng) + **Microservices** ở tầng Business Logic.

```
┌──────────────────────────────────────────────┐
│ 1. Presentation — Zalo Mini App (React + ZMP) │  ← User devices
└────────────────────┬─────────────────────────┘
                     │ HTTPS / WebSocket
┌────────────────────▼─────────────────────────┐
│ 2. Gateway — API Gateway (REST/HTTPS)         │  ← Single entry point
│    Auth, rate-limit, routing                  │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│ 3. Business Logic — 5 NestJS microservices    │
│  ┌──────────┬──────────┬──────────┐           │
│  │ Core     │ Domain   │Monitoring│           │
│  │ Auth     │ Farm     │ (sensors,│           │
│  │ Notify   │ Contract │  alerts) │           │
│  └──────────┴──────────┴──────────┘           │
└────────────────────┬─────────────────────────┘
                     │
┌────────────────────▼─────────────────────────┐
│ 4. Persistence — Polyglot                    │
│  PostgreSQL │ InfluxDB │ Redis                │
└──────────────────────────────────────────────┘
```

---

## 2. Tầng & Trách nhiệm

### 2.1 Presentation Layer
- **Công nghệ:** Zalo Mini App (React 18 + TypeScript + zmp-ui).
- **Trách nhiệm:** UI cho Farmer / Trader / Buyer / Guest. Offline-first cho care log (NFR-A02).
- **Lý do dùng ZMP:** Tận dụng hệ sinh thái Zalo, Zalo ID, ZNS notification, không cần install riêng.

### 2.2 Gateway Layer
- **API Gateway** REST/HTTPS — cổng duy nhất.
- **Trách nhiệm:** Định tuyến theo path → service tương ứng; verify JWT (cache Redis 60s); HTTPS termination; rate limiting.

### 2.3 Business Logic Layer (Microservices)

| Nhóm | Service | Vai trò |
|------|---------|---------|
| **Core** | Auth Service | Zalo OAuth, JWT issue/verify, user profile. |
| **Core** | Notification Service | Multi-channel send (Zalo ZNS/OA, email, SMS); event consumer. |
| **Domain** | Farm Service | Hồ sơ vườn, nhật ký, evidence, standards (VietGAP/GlobalGAP), traceability. |
| **Domain** | Contract Service | Orders, proposals, contracts, connections, products marketplace. |
| **Monitoring** | Monitoring Service | Sensor ingest, threshold alerts, WebSocket push, historical query. |

Ports dev: 3001 (auth), 3002 (farm), 3003 (contract), 3004 (monitoring), 3005 (notification).

### 2.4 Persistence Layer (Polyglot)

| DB | Use case | Lý do |
|----|----------|-------|
| **PostgreSQL 15** | Transactional: users, farms, contracts, orders, audit logs. | ACID, FK integrity. |
| **InfluxDB 2** | Time-series: sensor readings (temp/humidity/light/moisture). | Tối ưu write throughput + range query. |
| **Redis 7** | Session, latest sensor state, JWT verify cache, pub/sub events. | Mili-giây latency. |

---

## 3. Data Flow

### 3.1 Transactional Flow (nghiệp vụ)
```
ZMP → API Gateway → Farm/Contract/Auth Service → PostgreSQL
                                              → Redis (session/cache)
```
Phục vụ: hồ sơ, hợp đồng, nhật ký chăm sóc.

### 3.2 Monitoring Flow (giám sát)
```
IoT Sensor → Gateway → Monitoring Service → InfluxDB (write)
                                          → Redis (latest state)
                                          → Threshold check
                                              ↓ vượt ngưỡng
                                          Notification Service
                                              ↓
                                          Zalo notification + WS push
```

### 3.3 Real-time push
- **WebSocket** (Socket.IO): `wss://.../monitoring/farms/:farmId` đẩy sensor data + alerts về client.
- **Fallback:** REST GET history nếu WS lỗi.

---

## 4. Lý do chọn Microservices (không monolith)

1. **IoT scalability:** Lưu lượng sensor cao → monitoring có thể scale độc lập. Nếu monolith bị bottleneck ở monitoring sẽ kéo sập business flow.
2. **Separation of Concerns:** Domain ACID (PostgreSQL/REST) vs Monitoring high-throughput (InfluxDB/MQTT) yêu cầu pattern trái ngược → tách dễ phát triển + deploy độc lập.
3. **Polyglot Persistence:** InfluxDB cho time-series, Redis cho real-time state, PostgreSQL cho ACID — mỗi service chọn DB phù hợp.
4. **Khả năng mở rộng (NFR-X01 ≥ 500 concurrent):** Scale-out per-service.

---

## 5. Cross-cutting Concerns

### 5.1 Authentication & Authorization
- Zalo OAuth → JWT (24h) + refresh token rotation.
- API Gateway verify JWT, cache 60s Redis.
- Role-based access (FR-S01): farmer / trader / buyer / guest.

### 5.2 Logging & Observability
- Structured JSON logs (`requestId`, `userId`, `action`, `duration`).
- Health checks `/health` (NestJS Terminus).
- Sensitive fields BẮT BUỘC `[REDACTED]` ở warn/error.

### 5.3 Error handling
- NestJS exceptions → format `{ error: { code, message }, requestId }`.
- Frontend: snackbar friendly message (NFR-R03), parse `error.code`.

### 5.4 Offline / Sync
- Frontend queue (localStorage/IndexedDB) cho care log khi offline.
- Endpoint `POST /care-logs/sync` nhận batch, sort theo client timestamp.
- Idempotent qua client-generated UUID → tránh duplicate.

### 5.5 Imputed sensor data (NFR-A01)
- Khi sensor mất tín hiệu, Monitoring Service trả `value` từ model dự đoán + `isImputed=true`.
- Frontend hiển thị bình thường, có thể đánh dấu nhỏ (chấm xám).

---

## 6. Deployment Topology

### Dev
- Backend: `npm run dev` (turbo parallel) — services 3001–3005.
- Frontend: `npm run start` — ZMP dev server 3000.
- DBs: Docker Compose (`npm run docker:up`).

### Production
- Mỗi service một Docker image.
- API Gateway: Kong / Nginx / managed gateway.
- Frontend: ZMP deploy → Zalo Platform.
- DBs: Managed (RDS, Elastic Cloud, Redis Cloud).

---

## 7. Quyết định kiến trúc (ADR-style ngắn)

| # | Quyết định | Lý do |
|---|-----------|-------|
| 1 | ZMP thay vì native app | Hệ sinh thái Zalo, không cần cài riêng, Zalo ID có sẵn. |
| 2 | Microservices thay vì monolith | IoT scaling + polyglot persistence. |
| 3 | NestJS thay vì Go/Java | Node ecosystem rộng, decorator-based, IO-non-blocking phù hợp gateway / business. |
| 4 | InfluxDB thay vì PostgreSQL TimescaleDB | Tối ưu time-series natively + query nhanh cho dashboard. |
| 5 | Jotai + React Query thay vì Redux | Giảm boilerplate, atom granular, cache server tách rời client state. |
| 6 | Tailwind + design-system custom thay vì zmp-ui only | zmp-ui thiếu primitive (chart, dashboard); design tokens cần custom (Agri Green). |

---

## 8. References
- Stack chi tiết: [`tech-stack.md`](./tech-stack.md)
- Workflow: [`business-logic.md`](./business-logic.md)
- Cấu trúc thư mục: [`project-structure.md`](./project-structure.md)
- Yêu cầu nghiệp vụ: [`requirements.md`](./requirements.md)
