# Business Logic — TrustAgri

## Core Workflows

### 1. Authentication & Session Management

**Actors:** User (via ZMP client), Auth Service, API Gateway

**Flow:**

```
1. User taps "Login with Zalo" in ZMP client
   → ZMP SDK calls Zalo OAuth → receives Zalo code

2. Frontend sends: POST /api/v1/auth/login
   Payload: { zaloCode, zaloState }

3. Auth Service calls Zalo API with code
   → Zalo returns accessToken + user profile (id, name, phone)

4. Auth Service creates/updates user in DB
   - If first login: creates user with default role = 'guest'
   - Updates lastLogin timestamp

5. Auth Service returns: { token (JWT), refreshToken, userId, role }

6. Frontend stores token in Jotai authAtom
   - Sets Authorization header for all future requests

7. API Gateway intercepts requests
   → Calls Auth Service /verify endpoint with token
   → Caches result in Redis (60s TTL)
   → Routes to appropriate service if valid

8. When logout: Frontend clears token
   → Auth Service invalidates session in Redis
```

**Error Handling:**
- Invalid Zalo code → 400 Bad Request
- User not found (edge case) → auto-create with guest role
- Expired token → Gateway returns 401, frontend redirects to login

---

### 2. Farm Profile Management

**Actors:** Farmer, Farm Service, PostgreSQL

**Create Farm:**

```
1. Farmer fills form:
   - Name, Location (province, district, coords), Area, Crop Type, Standard

2. Frontend: POST /api/v1/farms
   Payload: CreateFarmDto { name, location, area, cropType, standardId? }

3. Farm Service:
   - Validates input (area > 0, location has required fields)
   - Generates traceability code: TR-<first12CharsOfUUID>
   - Creates FarmEntity in PostgreSQL
   - Returns FarmDto to frontend

4. Frontend shows success notification, navigates to farm detail
```

**Update Farm:**

```
1. Farmer edits farm details on farm profile screen

2. Frontend: PATCH /api/v1/farms/:farmId
   Payload: UpdateFarmDto { name?, location?, cropType? }

3. Farm Service:
   - Checks ownership (ownerId matches userId)
   - Updates FarmEntity fields
   - Logs change to audit (optional)
   - Returns updated FarmDto

4. Frontend updates React Query cache
```

**List Farms:**

```
1. Frontend: GET /api/v1/farms
   Query params: { ownerId, page, limit, cropType? }

2. Farm Service:
   - Queries FarmEntity by ownerId
   - Applies filters (cropType, date range)
   - Paginates (default 20 per page)
   - Returns ListResponse<FarmDto>

3. Frontend caches result in React Query
   → Dashboard shows farmer's farms
```

**Delete Farm:**

```
1. Farmer taps delete on farm profile

2. Frontend: DELETE /api/v1/farms/:farmId

3. Farm Service:
   - Checks no active contracts exist (prevent orphaning)
   - If contracts exist → 409 Conflict
   - Soft-delete: set deletedAt timestamp
   - Logs deletion to audit

4. Frontend removes from list
```

---

### 3. Care Log & Evidence Workflow

**Actors:** Farmer, Farm Service, PostgreSQL, Frontend (offline queue)

**Add Care Log (online):**

```
1. Farmer on care-log screen:
   - Selects farm
   - Logs action (e.g., "watering", "pest control")
   - Adds notes + timestamp
   - Optionally attaches evidence (photo/document URL)

2. Frontend: POST /api/v1/farms/:farmId/care-logs
   Payload: CreateCareLogDto {
     action,
     notes,
     timestamp,
     stepId?, // linked process step
     evidence?: { fileUrl, fileType }
   }

3. Farm Service:
   - Creates CareLogEntity + EvidenceEntity (if provided)
   - Links to farm + optional standard step
   - Stores timestamp (used for offline sync ordering)
   - Returns CareLogDto

4. Frontend updates React Query cache, shows success
```

**Add Care Log (offline):**

```
1. Farmer taps "Add Care Log" while offline
   → Frontend creates CareLogDto with local timestamp
   → Stores in localStorage / IndexedDB queue

2. When connection restored:
   - Frontend syncs queue: POST /api/v1/farms/:farmId/care-logs/sync
     Payload: { logs: [CareLogDto], since: timestamp }

3. Farm Service (sync endpoint):
   - Accepts list of care logs
   - Sorts by timestamp (client-side ordering)
   - Creates each log in order
   - Returns created logs with server-assigned IDs

4. Frontend clears queue, updates cache with returned IDs
```

**Conflict Resolution (offline sync):**

```
If user created care log while offline, and timestamp overlaps with 
another device's log for same farm:

- Server sorts all by timestamp + creation order
- No data loss (both preserved in sequence)
- Frontend syncs full farm log history after sync success
```

---

### 4. Monitoring & Alerts

**Actors:** Sensor (IoT device), Monitoring Service, InfluxDB, Redis, Notification Service, Frontend

**Sensor Data Ingestion:**

```
1. IoT Sensor publishes data (HTTP or MQTT → gateway)
   Payload: { farmId, sensorId, sensorType, value, timestamp }
   Example: { farmId: "uuid-123", sensorType: "temperature", value: 28.5 }

2. Monitoring Service consumes message:
   - Validates farm ownership (sensor linked to farm)
   - Writes to InfluxDB with farm_id, sensor_type tags
   - Updates latest state in Redis:
     farm:uuid-123:latest = { temperature: 28.5, humidity: 65, ... }

3. Service checks thresholds:
   - If value exceeds alert threshold (e.g., temp > 35°C):
     - Creates AlertEntity in PostgreSQL
     - Publishes alert.created event
   - If within range: just updates cache
```

**Alert Creation & Notification:**

```
1. Monitoring Service detects threshold breach
   - Creates Alert: { farmId, sensorType, severity (warning/danger), message }
   - Publishes event: { alertId, farmId, severity, message }

2. Notification Service consumes alert event:
   - Looks up farmer contact (Zalo ID, phone, email)
   - Sends Zalo notification with alert summary
   - Stores notification record in DB

3. Frontend (if subscribed to farm via WebSocket):
   - Receives real-time update
   - Updates dashboard alerts widget
   - Highlights alert in UI (red border, sound?)

4. Farmer can:
   - View full alert detail
   - Acknowledge alert: PATCH /api/v1/monitoring/alerts/:id
   - Service updates acknowledgedAt, publishes event
```

**Dashboard Real-Time Data:**

```
1. Farmer opens dashboard → subscribed to farm monitoring
   WebSocket: wss://api/monitoring/farms/uuid-123
   Auth: Token in header or query param

2. Monitoring Service:
   - Validates farm access (user owns or has permission)
   - Maintains open connection
   - Pushes new sensor readings every 5-10 seconds

3. Frontend:
   - Receives { sensorType, value, timestamp }
   - Updates dashboard charts in real-time
   - Falls back to REST GET if WebSocket unavailable

4. Lazy-load chart component with Suspense
   - Skeleton while loading
   - Line chart with trend (sparkline)
   - Last 24h by default, user can expand
```

**Query Historical Data:**

```
1. Frontend: GET /api/v1/monitoring/farms/:farmId/history
   Query: { sensorType, startDate, endDate, interval: "1h" }
   Example: ?sensorType=temperature&startDate=2026-04-15&interval=1h

2. Monitoring Service:
   - Queries InfluxDB for range
   - Aggregates by interval (mean, max, min)
   - Caches result in Redis (TTL 10 min)
   - Returns: ChartDataPoint[] { label, value }

3. Frontend:
   - Renders chart with historical trend
   - User can zoom / pan if implemented
```

---

### 5. Contracts & Marketplace

**Actors:** Buyer, Farmer, Trader, Contract Service, PostgreSQL

**Buyer Posts Buying Request:**

```
1. Buyer on "Post Buying Request" screen:
   - Selects crop type, quantity, desired quality, price range, location
   - Adds optional notes, delivery timeframe

2. Frontend: POST /api/v1/orders
   Payload: CreateOrderDto {
     cropType,
     quantity,
     unit,
     qualityRequirement,
     priceRange: { min, max },
     deliveryLocation,
     notes?
   }

3. Contract Service:
   - Creates Order in PostgreSQL (status: "open")
   - Returns OrderDto

4. System notifies traders (push notification, email)
```

**Trader Posts Proposal:**

```
1. Trader browses open orders, taps "Make Proposal"

2. Frontend: POST /api/v1/proposals
   Payload: CreateProposalDto {
     orderId,
     traderId,
     farmId?,  // If farmer-trader wants to propose
     price,
     deliveryDate,
     paymentTerms,
     certifications?  // Proof of quality
   }

3. Contract Service:
   - Creates Proposal (status: "pending")
   - Notifies buyer

4. Buyer sees proposals, can:
   - Accept: POST /api/v1/proposals/:id/accept → creates Contract
   - Reject: POST /api/v1/proposals/:id/reject → status = "rejected"
```

**Contract Created & Lifecycle:**

```
1. When proposal accepted:
   - Contract Service creates Contract
   - Links: { buyer_id, farmer_id?, trader_id?, farmId, productId, terms }
   - Status: "pending_signature" (placeholder; currently in MVP maybe just "active")

2. Contract lifecycle:
   - active: product delivery period
   - in_settlement: payment verification
   - completed: both parties confirm
   - cancelled: either party cancels (reason logged)

3. On status change:
   - Logs to contract_audit_logs (who changed, when, why)
   - Publishes event for Notification Service

4. System can enforce:
   - Delivery date milestones
   - Payment escrow (future: integrate payment service)
```

**Farmer-Trader Connection:**

```
1. Farmer views "Market" screen:
   - Searches traders by region, crop type, trust score
   - Filters by certifications, reviews

2. Farmer sends connection request:
   POST /api/v1/connections
   Payload: { traderId }

3. Contract Service:
   - Creates Connection (status: "pending")
   - Notifies trader

4. Trader can:
   - Accept: status = "connected"
   - Reject: status = "rejected"

5. Once connected:
   - Can shortcut to creating contracts
   - Can message (future: chat service)
   - Both can view each other's profiles
```

---

### 6. Traceability & QR Code

**Actors:** Farm Service, public API (no auth), Consumer (QR scan)

**QR Minting:**

```
1. When farm created:
   - Farm Service generates: traceabilityCode = TR-<first12CharsOfUUID>
   - Stored in farms.traceability_code (UNIQUE)
   - Example: TR-f3a9e2c1d4b0

2. Frontend encodes in QR:
   - Data: https://trustagri.vn/trace?code=TR-f3a9e2c1d4b0
   - Printed on packaging / product
```

**Public Traceability Lookup:**

```
1. Consumer scans QR or taps link:
   → Opens TrustAgri in guest mode with code parameter

2. Frontend: GET /api/v1/traceability/:code
   - No auth required (public endpoint)

3. Farm Service:
   - Looks up farm by traceabilityCode
   - Returns: {
       farmId,
       farmName,
       farmerName,
       location,
       certifications,
       lastCareLog: { action, date, evidence? },
       currentMonitoring: { temperature, humidity, ... }  // if live monitoring
     }

4. Frontend shows farm details + care log history
   - Consumer verifies product authenticity
   - Builds trust in TrustAgri system
```

---

### 7. Notifications

**Actors:** Notification Service, multiple channels (Zalo, Email, SMS), Frontend

**Push Notification Architecture:**

```
Events that trigger notifications:
1. alert.created → "⚠️ Nhiệt độ vượt 35°C! Hãy kiểm tra"
2. contract.status_changed → "Hợp đồng được chấp nhận"
3. proposal.created → "Có đề xuất mới cho đơn hàng của bạn"
4. connection.accepted → "Nhà buôn chấp nhận kết nối"

Flow:
```

**Consuming Events:**

```
1. Monitoring Service publishes: alert.created event
   → Event broker (queue / pub-sub)

2. Notification Service:
   - Subscribes to domain events
   - For each event:
     a) Determines recipient (farmId → ownerId → user record)
     b) Gets user contact (Zalo ID, phone, email)
     c) Formats message in Vietnamese
     d) Sends via Zalo SDK / SMS / Email

3. If send fails:
   - Retries with exponential backoff (5s, 30s, 5min, 1h)
   - Logs failure reason
   - After N retries, marks as failed

4. Notification stored in DB:
   - user_id, type (alert/contract/proposal), status (sent/failed)
   - timestamps (sentAt, readAt)
```

**Notification Center UI:**

```
1. Frontend: GET /api/v1/notifications
   Query: { unread: true, page: 1, limit: 20 }

2. Notification Service returns: ListResponse<NotificationDto>
   - { id, type, message, createdAt, readAt, actionUrl }

3. Farmer views notifications:
   - Unread marked with accent color
   - Tapping → mark as read: PATCH /api/v1/notifications/:id
   - Tapping → navigate to relevant screen (farm detail, contract, etc.)
```

---

### 8. Standard Process & Compliance

**Actors:** Admin (sets up), Farmer (follows), Trader (verifies)

**Standard Setup (out of main flow for now):**

```
1. Admin creates Standard (template for crop type):
   - Name: "Organic Vegetable Growing - Q1 2026"
   - Crop Type: "vegetable"
   - Steps: [
       { stepNumber: 1, name: "Soil Preparation", dueDate: "2026-04-01" },
       { stepNumber: 2, name: "Seed Planting", dueDate: "2026-04-15" },
       ...
     ]

2. Farmer selects standard when creating/updating farm
   - Farm.standardId links to Standard

3. When logging care:
   - Farmer can link care log to standard step
   - System flags if log deviates from expected step order
```

**Compliance Checking (future):**

```
1. Trader verifies farmer compliance:
   - Views farm detail + linked standard
   - Reviews care logs vs. standard steps
   - Flags deviations

2. System can block contract if non-compliant
   - Or require trader approval to proceed
```

---

## Data Flow Diagrams

### Login Flow
```
Farmer → Zalo OAuth → Zalo Server
                    ↓
        Code returned to Frontend
                    ↓
Frontend → Auth Service (POST /login with code)
                    ↓
Auth Service → Zalo API (verify code, get profile)
                    ↓
Auth Service ← Zalo (user data)
                    ↓
Auth Service → PostgreSQL (create/update user)
                    ↓
Auth Service → Redis (store session)
                    ↓
Frontend ← JWT Token + RefreshToken
                    ↓
Frontend → Jotai authAtom (store token)
```

### Monitoring Real-Time Flow
```
IoT Sensor → Gateway → Monitoring Service
                          ↓
                    InfluxDB (write)
                    Redis (cache latest)
                          ↓
                    Check thresholds
                    If alert → create Alert
                              ↓
                          Publish alert.created
                              ↓
                    Notification Service
                    (send Zalo notification)
                              ↓
                    Frontend (WebSocket) ← real-time update
                    Updates dashboard chart
```

### Care Log Offline Sync
```
Farmer (offline) → Add care log
                → localStorage queue
                
Farmer (online) → Upload queue
                → POST /care-logs/sync
                → Farm Service
                → PostgreSQL (insert in timestamp order)
                → Return server IDs
                → Frontend updates cache
                → Clear queue
```

---

## Key Business Rules

1. **Ownership & Permissions:**
   - Farmer can only view/edit own farms
   - Farmer can only log care for own farms
   - Buyer can only see own orders + proposals
   - Trader can see all open orders but only edit own proposals

2. **Contract Integrity:**
   - Farm cannot be deleted if active contracts exist
   - Care log cannot be edited once saved (new log for correction)
   - Contract changes trigger audit log entry

3. **Offline Queue:**
   - Care logs sorted by client timestamp on sync
   - No duplicate if user syncs same queue twice (idempotent via IDs)
   - If sync fails, queue persists for retry

4. **Alert Management:**
   - Only latest unacknowledged alerts shown (avoid spam)
   - Acknowledged alert can be re-triggered if breached again
   - User can mute alert type for specific farm (future)

5. **Traceability:**
   - Unique code per farm; immutable
   - Public endpoint (no auth) for consumer scan
   - Links farm profile + latest care log + monitoring data

---

## Error Scenarios & Recovery

| Scenario | Trigger | Recovery |
|----------|---------|----------|
| Backend timeout | Service slow or down | API Gateway returns 503; frontend shows retry snackbar |
| Auth token expired | Session > 24h | 401 Unauthorized; frontend clears token, redirects to login |
| Offline care log sync fails | Network issue | Retry queue persists in localStorage; user prompted to retry |
| Alert notification fails | Service unavailable | Retries with backoff; logged as failed; trader can check manually |
| Farm deletion with active contracts | Business rule violation | 409 Conflict; user shown error message |
| Race condition: two edits to same farm | Concurrent requests | Last-write-wins (no conflict resolution currently; could add versioning) |
