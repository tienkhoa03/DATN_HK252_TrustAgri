# File Map — TrustAgri

> **Mục đích:** Cho phép Claude **target đúng file** mà KHÔNG cần Glob/Grep/ls để khám phá repo. Mỗi entry = 1 dòng (đường dẫn + ý nghĩa + feature liên quan).
>
> **Cách dùng:** Khi nhận task, tra bảng dưới → chỉ Read các file ghi rõ. Nếu task không khớp entry nào → mới Glob/Grep. Sau khi grep ra file mới quan trọng, **cập nhật map này**.
>
> **Trạng thái cập nhật:** 2026-06-02. Khi thêm/xóa folder cấp `screens/<role>/<feature>/` hoặc `apps/<service>/src/<domain>/`, cập nhật file này.

---

## 1) Backend (`be/`)

### Monorepo root
| Path | Ý nghĩa |
|------|---------|
| `be/package.json` | Workspaces + Turbo scripts (dev/build/test/lint/test:integration). |
| `be/turbo.json` | Turbo pipeline (build deps, cache). |
| `be/tsconfig.base.json` | TS config dùng chung. |
| `be/docker-compose.yml` | PostgreSQL + Redis + InfluxDB local. |
| `be/nginx/` | API Gateway config (routing 3001–3005). |
| `be/integration-tests/src/*.spec.ts` | E2E test hit nhiều service. |

### Shared lib (`be/libs/shared/src/`)
| Path | Ý nghĩa |
|------|---------|
| `dto/auth.dto.ts` | Login/register/refresh/user-profile DTO. |
| `dto/farm.dto.ts` | Farm + care-log + evidence DTO. |
| `dto/care-plan.dto.ts` | Care plan / task DTO. |
| `dto/contract.dto.ts` | Order / proposal / contract / connection / buying-request / change-request DTO. |
| `dto/monitoring.dto.ts` | Sensor reading / alert DTO. |
| `dto/iot-device.dto.ts` | IoT device pairing DTO. |
| `dto/notification.dto.ts` | Notification / news / forecast DTO. |
| `dto/trader-review.dto.ts` | Trader review + trust score DTO. |
| `dto/common.dto.ts` | Pagination, error envelope, requestId. |
| `bootstrap/` | NestJS bootstrap utils (global pipes, filters). |
| `config/` | env config schema (Joi/class-validator). |
| `decorators/` | `@CurrentUser()`, `@Public()`, role decorators. |
| `filters/` | Global exception filter (HTTP envelope). |
| `guards/` | `JwtAuthGuard`, `RolesGuard`. |
| `interceptors/` | Logging, requestId injection. |
| `logger/` | Structured JSON logger wrapper. |
| `middleware/` | requestId, rate-limit hooks. |
| `types/` | Cross-service TS types. |

### Service: `be/apps/auth-service/src/`
Cổng vào: `main.ts` (port 3001), `app.module.ts`.
| Domain folder | Ý nghĩa |
|---|---|
| `auth/auth.controller.ts` | 4 cách login: `login` (Zalo accessToken + phoneNumber/phoneToken), `password-login` (gated `AUTH_PASSWORD_LOGIN_ENABLED`), `dev-login` (gated `AUTH_DEV_LOGIN_ENABLED`), + `verify`/`logout`/`me`/`switch-role`/`users/:id`. FR-A01..A05. |
| `auth/auth.service.ts` | Logic login/JWT issue+refresh, multi-role switch, profile (`me`). |
| `auth/zalo.service.ts` | Gọi Zalo OAuth (`getProfile`) + giải mã phoneToken qua `/me/info` (`ZALO_APP_SECRET_KEY`). |
| `auth/redis.service.ts` | Session store + rate-limit dev-login theo IP. |
| `auth/guards/` | `password-login-enabled`, `dev-login-enabled`, `dev-localhost` (chặn dev-login theo env/IP). |
| `auth/entities/user.entity.ts` | User (roles[], zaloId, username/passwordHash cho password-login, trader/farmer/buyer profile). |
| `migrations/` | TypeORM migrations cho users (vd `add-roles-array`). |
| `strategies/jwt.strategy.ts` | Passport JWT strategy. |
| `health/` | `@nestjs/terminus` healthcheck. |

### Service: `be/apps/farm-service/src/`
Cổng vào: `main.ts` (port 3002), `app.module.ts`.
| Domain folder | Ý nghĩa |
|---|---|
| `farms/` | Farm CRUD + farm profile + ownership. FR-F01..F03. |
| `care-logs/` | Care log CRUD + offline sync endpoint + audit. FR-F04, NFR-R02. |
| `care-plans/` | Crop care plan templates + task generation. |
| `standards/` | Farming standards reference (VietGAP, Organic...). Có `standards.seeder.ts`. |
| `traceability/` | Public traceability + contract-level QR + aggregation pipeline. FR-T01..T03. Gọi monitoring qua `internal-clients.ts`. |
| `clients/` | HTTP clients tới auth/monitoring/contract service. |
| `strategies/` | JWT strategy. |

### Service: `be/apps/contract-service/src/`
Cổng vào: `main.ts` (port 3003), `app.module.ts`.
| Domain folder | Ý nghĩa |
|---|---|
| `buying-requests/` | Buyer post buying request. FR-B01. |
| `proposals/` | Trader/farmer phản hồi proposal. FR-B02. |
| `orders/` | Order lifecycle khi proposal accepted. FR-B03. |
| `contracts/` | Contract lifecycle + audit + compliance check. Có `contract-audit.service.ts`, `compliance.service.ts`. FR-C01..C03. |
| `contract-change-requests/` | Đề xuất sửa contract, approval flow. FR-C04. |
| `connections/` | Farmer ↔ Trader marketplace connection. FR-M01..M02. |
| `products/` | Product catalog (trader/farmer publish). |
| `trader-reviews/` | Review + trust score aggregation. FR-M03. |
| `dashboard/` | KPI/Aggregation cho dashboard từng role. |
| `clients/` | HTTP clients sang farm/auth/notification. |
| `strategies/` | JWT strategy. |

### Service: `be/apps/monitoring-service/src/`
Cổng vào: `main.ts` (port 3004), `app.module.ts`.
| Domain folder | Ý nghĩa |
|---|---|
| `sensors/` | Sensor reading ingest (InfluxDB) + query latest/history + traceability snapshot. Có `traceability-monitoring.controller.ts`. FR-M01..M03 (monitoring). |
| `devices/` | IoT device pairing + status. |
| `alerts/` | Threshold rule, alert generation, async dispatch. FR-M04. |
| `gateway/` | Socket.IO WebSocket gateway (real-time stream). NFR-realtime. |
| `clients/` | HTTP clients sang farm/notification. |
| `strategies/` | JWT strategy. |

### Service: `be/apps/notification-service/src/`
Cổng vào: `main.ts` (port 3005), `app.module.ts`.
| Domain folder | Ý nghĩa |
|---|---|
| `notifications/` | In-app (DB) + Zalo ZNS (`zns-adapter.service.ts`). Tiêu thụ event async qua **Redis pub/sub** (`redis-event-consumer.service.ts`, channels `alert.created` / `contract.changed` / `connection.requested`). `farm-lookup.service.ts` resolve user. FR-N01..N02. |
| `news/` | News feed CRUD. FR-N03. |
| `forecasts/` | Weather/market forecast feed. FR-N04. |
| `clients/` | HTTP clients sang auth/farm (resolve user/farm). |
| `strategies/` | JWT strategy. |

> **Async events (Redis pub/sub):** producer là `alerts/services/alert-publisher.service.ts` (monitoring), `contract-change-requests/services/contract-event-publisher.service.ts` + `connections/services/connection-publisher.service.ts` (contract); consumer là notification-service. Đây là kênh cross-service KHÔNG đồng bộ (khác HTTP `clients/`).

> **Quy luật chung mọi domain folder BE:** `<domain>.controller.ts` (thin router) · `<domain>.service.ts` (logic) · `<domain>.module.ts` (wiring) · `entities/` (TypeORM) · `dto/` (validate). Để hiểu API endpoint của 1 domain → đọc `*.controller.ts`. Để hiểu logic → đọc `*.service.ts`.

---

## 2) Frontend (`fe/src/`)

### App-level
| Path | Ý nghĩa |
|------|---------|
| `app.ts` | Root component bootstrap. |
| `pages/AppInitScreen.tsx` | Splash/bootstrap — chạy auth theme theo `VITE_AUTH_MODE` (auto-login zalo/dev, hoặc hiện LoginScreen). |
| `pages/LoginScreen.tsx` · `RoleSelectionScreen.tsx` | Form login (mode `password`) + chọn role khi user có nhiều role. |
| `pages/index.tsx` · `index-debug.tsx` · `index-step-by-step.tsx` | Dev hub screens (chỉ dev). |
| `router/routes.tsx` | **Tổng route map** — biết screen nào ở path nào, role gì. |
| `router/RoleGuard.tsx` · `RequireRole.tsx` · `roleHome.ts` | Role-based routing guards + home redirect. |
| `navigation/RoleAppShell.tsx` · `RoleBottomNav.tsx` · `roleNavModel.ts` | App shell + bottom nav theo role. |
| `api/client.ts` | Axios instance + auth interceptor. |
| `api/interceptors.ts` · `errors.ts` | 401 → logout, error envelope parser. |
| `api/monitoringSocket.ts` | Socket.IO client cho realtime sensor. |
| `config/env.ts` | **Mọi Vite env** đọc tại đây (fail-fast). 4 `VITE_AUTH_MODE`: `zalo-oauth`/`zalo-token`/`dev-seeded`/`password`. Còn API base, TRACE base, contract version. |
| `utils/` | `lazyLoad.tsx`, `uuid.ts`, `cache.ts`, `imageOptimization.ts`, `performance.ts`, `displayLabels.ts`. |

### Design system (`fe/src/design-system/`)
| Path | Ý nghĩa |
|------|---------|
| `tokens/colors.ts` · `spacing.ts` · `typography.ts` · `icons.ts` | Tokens — BẮT BUỘC import từ đây, KHÔNG hardcode. |
| `components/` | Primitives: `Alert`, `Button`, `Card`, `Chart`, `DigitalTwinViewer`, `EmptyState`, `Gauge`, `Icon`, `MapPicker`, `QRCode`, `SensorDisplay`, `SensorLineChart`, `Sparkline`, `Timeline`, `DiffRow`. |
| `layouts/` | Layout primitives. |

### Services (`fe/src/services/`) — API layer per domain
| File | Ý nghĩa |
|------|---------|
| `authService.ts` + `authStrategy.ts` + `mockAuthBootstrap.ts` + `zaloAccessToken.ts` | Auth flow per `VITE_AUTH_MODE`: `authStrategy.ts` chọn endpoint (login / password-login / dev-login), `zaloAccessToken.ts` lấy token + getPhoneNumber từ zmp-sdk, multi-role switch. |
| `farmService.ts` + `farmsCache.ts` | Farm CRUD + cache. |
| `careLogService.ts` + `careLogOfflineQueue.ts` + `careLogAutoSync.ts` | Care log CRUD + offline IndexedDB queue + sync. |
| `carePlanService.ts` | Care plan. |
| `standardService.ts` | Farming standards. |
| `traceabilityService.ts` | Public traceability fetch. |
| `monitoringService.ts` | Sensor data REST. |
| `deviceService.ts` | IoT device pairing. |
| `connectionService.ts` | Farmer↔Trader connection. |
| `contractService.ts` + `contractChangeRequestService.ts` | Contract + change request. |
| `orderService.ts` + `proposalService.ts` + `buyingRequestService.ts` | Order/proposal/buying-request. |
| `marketplaceService.ts` | Marketplace search/list. |
| `dashboardService.ts` | Dashboard KPI per role. |
| `traderReviewService.ts` | Review + trust score. |
| `notificationService.ts` + `notificationNavigation.ts` | Notification list + deep-link routing. |
| `newsForecastService.ts` | News + forecast feed. |
| `evidenceUploadService.ts` | Upload evidence (image). |
| `mockService.ts` + `mocks/` | Mock data (dev/test). |

### Hooks (`fe/src/hooks/`)
`useAuth.ts`, `useFarms.ts`, `useCarePlan.ts`, `useDevices.ts`, `useMonitoring.ts`, `useProfile.ts`, `useStandards.ts`, `useTraderReviews.ts`, `useTrustScore.ts`, `useStableOpenSnackbar.ts`.

### State (`fe/src/state/`)
`authAtoms.ts` (token, userId, currentRole), `authSessionStorage.ts`, `monitoringAtoms.ts`, `notificationBadgeAtom.ts`, `resetOnLogout.ts`.

### Screens per role (`fe/src/screens/`)

**Farmer (`farmer/`)** — Bottom nav: dashboard / garden / trade / alerts / profile.
| Folder | Screen chính | Ý nghĩa |
|---|---|---|
| `dashboard/` | `FarmerDashboardScreen.tsx` + `HomeBanner`, `QuickLogFab`, `TodoList` | Home banner + todo + nhật ký nhanh. |
| `garden/` | `FarmerGardenScreen` / `FarmerGardenListScreen` / `FarmerGardenMonitorScreen` + `IotDashboardSection`, `QuickUpdateSheet`, `StepDetailSheet`, `TimelineSection` | Vườn: list + monitor IoT + timeline. |
| `trade/` | `FarmerTradeScreen` + `ContractsTab`, `TraderSearchTab` | Tab thương mại (contract + tìm trader). |
| `alerts/` | `FarmerAlertListScreen` | Danh sách alert. |
| `connections/` | `FarmerConnectionDetailScreen` | Chi tiết kết nối trader. |
| `profile/` | `FarmerProfileScreen` + `FarmLabSection`, `SeasonHistorySection` | Hồ sơ farmer + lab + lịch sử mùa vụ. |

**Trader (`trader/`)** — Bottom nav: dashboard / marketplace / library / transactions / profile-news.
| Folder | Screen chính | Ý nghĩa |
|---|---|---|
| `dashboard/` | `TraderDashboardScreen` | KPI nguồn cung + lệnh. |
| `marketplace/` | `TraderMarketplaceScreen` (+ `panels/`) | Tìm farm + product. |
| `library/` | `TraderLibraryHubScreen` | Hub thư viện (standard + farm + trust score). |
| `standard-library/` | `TraderStandardLibraryScreen` | Tra standards. |
| `farm-monitoring/` | `TraderFarmMonitoringScreen` (+ `components/`) | Theo dõi sensor farm đã kết nối. |
| `supply-monitor/` | `TraderSupplyMonitorScreen` | Theo dõi nguồn cung. |
| `trading-orders/` | `TraderTradingOrdersScreen` | Quản lý lệnh. |
| `transactions/` | `TraderTransactionsScreen` (+ `components/`: `ContractDetailModal`, `CreateFarmerContractModal`, `SelectConnectionModal`, `RequestCard`, `StatusTabbedList`; `flows/`: `FarmerFlowPanel`, `BuyerFlowPanel`) | Giao dịch + flow ký contract (farmer & buyer). Contract dùng screen ở `shared/contracts`. |
| `connections/` | `TraderConnectionDetailScreen` | Chi tiết kết nối farmer. |
| `profile-news/` | `TraderProfileNewsScreen` | Hồ sơ trader + news. |

**Buyer (`buyer/`)** — Bottom nav: dashboard / marketplace / orders / sourcing / profile.
| Folder | Screen chính | Ý nghĩa |
|---|---|---|
| `dashboard/` | `BuyerDashboardScreen` | KPI buyer. |
| `marketplace/` | `BuyerMarketplaceScreen` | Browse sản phẩm. |
| `product-detail/` | `BuyerProductDetailScreen` + `ProductDetailTabs` | Chi tiết sản phẩm + traceability tab. |
| `sourcing/` | `BuyerSourcingScreen` (+ `panels/`, `components/`) | Tìm nguồn cung. |
| `post-buying-request/` | `BuyerPostBuyingRequestScreen` | Đăng yêu cầu mua. |
| `orders-proposals/` | `BuyerOrdersProposalsScreen` + `BuyerOrdersScreen` (+ `components/`) | Order + proposal tabs. |
| `transaction-history/` | `BuyerTransactionHistoryScreen` | Lịch sử giao dịch. |
| `live-monitor/` | `BuyerLiveMonitorScreen` / `Detail` (+ `components/`: `SemanticSensorCard`, `FarmActionTimeline`) | Live sensor monitor (thay digital-twin cũ). |
| `profile-notification/` | `BuyerProfileNotificationScreen` | Hồ sơ + notification settings. |
| `components/` | Shared buyer-only components. | |

**Guest (`guest/`)** — Public screens.
| Folder | Ý nghĩa |
|---|---|
| `home-market-news/` | Trang chào + news. |
| `product-detail/` | Product detail public. |
| `traceability-scan/` | QR scan → traceability (FR-T01). |

**Shared (`shared/`)** — Multi-role screens.
| Folder | Ý nghĩa |
|---|---|
| `traceability/` | `TraceabilityScreen` + cards: `ComplianceCertificateCard`, `ContractContextBanner`, `EnvironmentSnapshotCard`, `ProcessComplianceCard`. FR-T01..T03. |
| `contracts/` | `ContractQrCodeModal` (contract-level QR). |
| `contract-change-requests/` | `ContractChangeRequestsPanel`. |
| `connections/` | `ConnectionRequestsScreen`. |
| `notifications/` | `NotificationsScreen`. |
| `news-feed/` | `NewsFeedScreen`. |
| `profile/` | `ProfileScreen` + `TraderProfileLayout`. |
| `standards/` | `StandardInfoModal`. |

### Components root (`fe/src/components/`)
`layout.tsx`, `clock.tsx`, `logo.tsx`, `NotificationBell.tsx`, `ConnectionStatusBanner.tsx`, `TrustWebRouter.tsx`, `ErrorBoundary/`, `RedirectTo/`, `buyer/`, `trader/`.

---

## 3) Specs & Database design

| File | Khi nào đọc |
|---|---|
| `specs/backend-api-specification/requirements.md` | US/Acceptance backend (chi tiết hơn `docs/requirements.md`). |
| `specs/backend-api-specification/design.md` | **API endpoint contract** — đọc trước khi gọi/sửa endpoint. |
| `specs/backend-api-specification/tasks.md` | Roadmap BE (tham khảo). |
| `specs/frontend-ui-specification/design.md` | Wireframe + interaction. |
| `specs/frontend-ui-specification/requirements.md` | US frontend. |
| `docs/apis.md` | Quick reference API list (root `docs/`, không phải `.claude/docs`). |
| `docs/postgres_database_design.md` | Schema chi tiết PostgreSQL (users/farms/contracts...). |
| `docs/influxdb_database_design.md` · `docs/seed_influxdb.md` | Time-series schema sensor + hướng dẫn seed. |
| `docs/redis_database_design.md` | Cache/session keys. |
| `docs/web_socket_problem.md` | Ghi chú vấn đề WebSocket monitoring. |
| `docs/deploy_instruction.md` · `docs/deploy_instruction_railway.md` | Hướng dẫn deploy (chung + Railway). |
| `docs/GAP_ANALYSIS.md` · `docs/TODO.md` · `docs/todo_plan.md` | Gap analysis + backlog. |

---

## 4) Quy tắc dùng file-map này

1. **Trước Glob/Grep:** tra bảng trên. Nếu có entry → Read trực tiếp file đó.
2. **Khi sửa 1 feature BE:** Read 3 file là đủ context cho hầu hết task → `<domain>.controller.ts` + `<domain>.service.ts` + DTO trong `be/libs/shared/src/dto/<domain>.dto.ts`. Entity + module chỉ đọc khi cần.
3. **Khi sửa 1 screen FE:** Read screen file + service file tương ứng (mapping rõ trên bảng services).
4. **KHÔNG list directory** nếu file-map đã chỉ rõ — tốn token vô ích.
5. **Khi thấy folder/file mới quan trọng (do task hoặc grep):** cập nhật map này thay vì để Claude lần sau lại phải khám phá.
