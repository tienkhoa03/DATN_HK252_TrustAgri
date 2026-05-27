# Hướng dẫn triển khai TrustAgri — Backend + Frontend (Zalo Mini App)

> Tài liệu này hướng dẫn đầy đủ hai lựa chọn deploy backend, sau đó deploy frontend lên Zalo Mini App và kết nối để dùng trên điện thoại thật.

---

## Mục lục

1. [Tổng quan kiến trúc production](#1-tổng-quan-kiến-trúc-production)
2. [Yêu cầu trước khi bắt đầu](#2-yêu-cầu-trước-khi-bắt-đầu)
3. [Phần A — Triển khai Backend lên DigitalOcean (VPS)](#phần-a--triển-khai-backend-lên-digitalocean-vps)
4. [Phần B — Triển khai Backend lên Railway (PaaS)](#phần-b--triển-khai-backend-lên-railway-paas)
5. [Phần C — Triển khai Frontend lên Zalo Mini App](#phần-c--triển-khai-frontend-lên-zalo-mini-app)
6. [Phần D — Kết nối BE + FE để dùng trên điện thoại thật](#phần-d--kết-nối-be--fe-để-dùng-trên-điện-thoại-thật)
7. [Checklist trước khi demo](#7-checklist-trước-khi-demo)
8. [Khắc phục sự cố thường gặp](#8-khắc-phục-sự-cố-thường-gặp)

---

## 1. Tổng quan kiến trúc production

```
[Điện thoại Zalo]
       │  HTTPS → VITE_API_BASE_URL = https://<backend-domain>/api/v1
       ▼
[Zalo Platform — Mini App bundle]
       │
       ▼
[Backend — chọn 1 trong 2 lựa chọn]
  ┌────────────────────────────────┐   ┌──────────────────────────────────┐
  │  Lựa chọn A: DigitalOcean VPS  │   │  Lựa chọn B: Railway PaaS        │
  │                                │   │                                  │
  │  Nginx (host) HTTPS :443       │   │  Railway auto-cấp HTTPS          │
  │  └► API Gateway (Docker :3006) │   │  API Gateway (Railway service)   │
  │      ├── auth-service :3001    │   │      ├── auth-service            │
  │      ├── notification  :3002   │   │      ├── notification-service    │
  │      ├── farm-service  :3003   │   │      ├── farm-service            │
  │      ├── contract      :3004   │   │      ├── contract-service        │
  │      └── monitoring    :3005   │   │      └── monitoring-service      │
  │  PostgreSQL, Redis, InfluxDB   │   │  PostgreSQL, Redis (managed)     │
  │  (Docker containers)           │   │  InfluxDB (Docker image)         │
  └────────────────────────────────┘   └──────────────────────────────────┘
```

| Tiêu chí | DigitalOcean VPS | Railway PaaS |
|----------|-----------------|--------------|
| Kiểm soát | Toàn quyền server | Hạn chế (platform quản lý) |
| Cài đặt | Phức tạp hơn (tự cài Docker, Nginx, SSL) | Đơn giản hơn (GUI + CLI) |
| Chi phí | ~$18–24/tháng (2vCPU/4GB) | ~$5–20/tháng (Hobby plan) |
| Phù hợp | Production thật, capstone demo dài hạn | Demo nhanh, thử nghiệm |
| InfluxDB | Hỗ trợ đầy đủ (Docker) | Cần deploy thủ công (không managed) |
| HTTPS | Cần cài Certbot thủ công | Tự động |

---

## 2. Yêu cầu trước khi bắt đầu

| Cần có | Chi tiết |
|--------|----------|
| Tài khoản DigitalOcean **hoặc** Railway | DigitalOcean: <https://digitalocean.com> / Railway: <https://railway.app> |
| Tên miền *(DigitalOcean)* | Ví dụ `api.tienkhoa.id.vn` — trỏ A record về IP Droplet |
| Tài khoản Zalo Developer | <https://developers.zalo.me> |
| Mini App đã tạo trên Zalo | Lấy được **App ID** và **Secret Key** |
| Node.js ≥ 18 trên máy local | Để chạy ZMP CLI |
| Git repo nhánh `main` ổn định | Không còn bug nghiêm trọng |

---

## Phần A — Triển khai Backend lên DigitalOcean (VPS)

### A1. Tạo Droplet

1. Đăng nhập DigitalOcean → **Create** → **Droplets**.
2. Cấu hình:
   - **Image:** Ubuntu 22.04 LTS x64
   - **Plan:** Basic Shared CPU — tối thiểu **2 vCPU / 4 GB RAM** (5 microservice + 3 DB)
   - **Region:** Singapore (`sgp1`) — gần VN nhất
   - **Authentication:** SSH Key (khuyên dùng) hoặc Password
3. Nhấn **Create Droplet**, đợi 1–2 phút.
4. Ghi lại **IP công khai** (ví dụ: `123.45.67.89`).

**Trỏ DNS — thêm domain vào DigitalOcean:**

1. DigitalOcean Dashboard → **Networking** → **Domains** → nhập `tienkhoa.id.vn` → **Add Domain**
2. Thêm A record: **Hostname** = `api`, **Will direct to** = chọn Droplet, **TTL** = `300`
3. Tại nhà đăng ký domain (PA Vietnam, Viettel, v.v.) → **Nameserver** → đổi thành:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```
> Đợi 24–48 giờ để nameserver `.vn` lan truyền.

**Trỏ DNS — thêm A record:**
```
A   api.tienkhoa.id.vn   →   123.45.67.89   TTL=300
```
> Đợi 5–15 phút để DNS lan truyền (với `.vn` domain có thể 24–48 giờ). Kiểm tra: `nslookup api.tienkhoa.id.vn`.

### A2. Cài Docker và công cụ

SSH vào Droplet:
```bash
ssh root@123.45.67.89
```

Chạy lần lượt:
```bash
# Cập nhật hệ thống
apt update && apt upgrade -y

# Cài Docker Engine
curl -fsSL https://get.docker.com | sh

# Cài Docker Compose plugin v2
apt install -y docker-compose-plugin

# Kiểm tra
docker --version          # Docker 24.x
docker compose version    # Docker Compose 2.x

# Cài Nginx + Certbot
apt install -y nginx certbot python3-certbot-nginx

# Cài Git
apt install -y git

# Cấu hình firewall UFW
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

> **Bảo mật:** Không mở port 3001–3005, 5432, 6379, 8086 ra ngoài internet.

### A3. Clone code và cấu hình `.env`

```bash
mkdir -p /opt/trustagri && cd /opt/trustagri
git clone https://github.com/your-org/trustagri.git .
cd be
cp .env.example .env
nano .env
```

Các điểm quan trọng cần chỉnh trong `.env`:

```dotenv
# ── DATABASE ──────────────────────────────────────────────
POSTGRES_HOST=postgres        # tên service trong docker-compose (KHÔNG phải localhost)
POSTGRES_PASSWORD=<mật_khẩu_mạnh_ít_nhất_20_ký_tự>

# ── REDIS ─────────────────────────────────────────────────
REDIS_HOST=redis              # tên service trong docker-compose

# ── INFLUXDB ──────────────────────────────────────────────
INFLUXDB_URL=http://influxdb:8086
INFLUXDB_TOKEN=<token_ngẫu_nhiên>
INFLUXDB_PASSWORD=<mật_khẩu_influx>

# ── JWT (tạo nhanh: openssl rand -hex 64) ─────────────────
JWT_SECRET=<chuỗi_random_64_ký_tự_trở_lên>

# ── ZALO ──────────────────────────────────────────────────
ZALO_APP_ID=<App_ID_từ_Zalo_Developer>
ZALO_SECRET_KEY=<Secret_Key_từ_Zalo_Developer>

# ── CORS — cho phép Zalo gọi BE ───────────────────────────
FE_ORIGINS=https://h5.zdn.vn,https://zalo.me,https://miniapp.zalo.me

# ── Tắt dev login trên production ────────────────────────
AUTH_DEV_LOGIN_ENABLED=false
AUTH_PASSWORD_LOGIN_ENABLED=false
NODE_ENV=production
```

### A4. Bind gateway port chỉ localhost

Mở `docker-compose.yml`, tìm service `api-gateway`, sửa `ports`:

```yaml
  api-gateway:
    ...
    ports:
      - '127.0.0.1:3006:80'   # chỉ bind localhost — Nginx host sẽ proxy vào đây
```

### A5. Build và khởi động services

```bash
cd /opt/trustagri/be

# Build tất cả Docker images (lần đầu ~5–10 phút)
docker compose build

# Khởi động toàn bộ
docker compose up -d

# Theo dõi logs
docker compose logs -f

# Kiểm tra trạng thái — tất cả phải Up
docker compose ps
```

### A6. Chạy database migrations

```bash
# Nếu service có script migration
docker compose exec auth-service sh -c "npm run migration:run"
docker compose exec farm-service sh -c "npm run migration:run"
docker compose exec contract-service sh -c "npm run migration:run"
docker compose exec monitoring-service sh -c "npm run migration:run"
docker compose exec notification-service sh -c "npm run migration:run"

# Seed dữ liệu dev (tùy chọn)
docker compose exec -T postgres psql -U trustagri -d trustagri \
  < /opt/trustagri/be/scripts/seed-dev-users.sql
```

> Xem tên script migration thực tế trong `apps/<service>/package.json`.

### A7. Cài HTTPS với Let's Encrypt

**Bước 1:** Kiểm tra DNS đã trỏ đúng:
```bash
nslookup api.tienkhoa.id.vn   # phải trả về IP Droplet
```

**Bước 2:** Tạo Nginx config:
```bash
nano /etc/nginx/sites-available/trustagri-api
```

```nginx
server {
    listen 80;
    server_name api.tienkhoa.id.vn;

    location / {
        proxy_pass         http://127.0.0.1:3006;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Connection        "";
        proxy_connect_timeout 5s;
        proxy_read_timeout    60s;
    }

    # WebSocket cho monitoring realtime
    location /ws/ {
        proxy_pass         http://127.0.0.1:3006;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_read_timeout 3600s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/trustagri-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Cấp SSL Let's Encrypt (tự sửa Nginx config thêm HTTPS)
certbot --nginx -d api.tienkhoa.id.vn \
  --non-interactive --agree-tos --email your-email@example.com

# Kiểm tra auto-renew
systemctl status certbot.timer
```

### A8. Kiểm tra backend

```bash
# Health check qua HTTPS
curl -i https://api.tienkhoa.id.vn/health
# Kết quả: HTTP/2 200 {"status":"ok"}

# Kiểm tra DB có bảng chưa
docker compose exec postgres psql -U trustagri -d trustagri -c "\dt"
```

### A9. Cập nhật code lên server

```bash
cd /opt/trustagri
git pull origin main
cd be
docker compose build --no-cache
docker compose up -d
```

---

## Phần B — Triển khai Backend lên Railway (PaaS)

### B1. Chuẩn bị Railway

```powershell
# Cài Railway CLI
npm i -g @railway/cli
railway --version

# Đăng nhập
railway login
```

1. Vào <https://railway.app> → **New Project** → **Empty Project**.
2. Đặt tên `trustagri-prod`.
3. (Tùy chọn) Kết nối GitHub repo để auto-deploy khi push.

### B2. Deploy databases

#### PostgreSQL
**Add Service** → **Database** → **PostgreSQL**:
- Railway tự tạo, lấy các biến: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

#### Redis
**Add Service** → **Database** → **Redis**:
- Lấy: `REDISHOST`, `REDISPORT`, `REDISPASSWORD`.

#### InfluxDB (Docker image — Railway không có managed)
1. **Add Service** → **Docker Image** → nhập `influxdb:2.7-alpine`
2. Port: `8086`
3. Thêm Environment Variables:
   ```
   DOCKER_INFLUXDB_INIT_MODE=setup
   DOCKER_INFLUXDB_INIT_USERNAME=trustagri
   DOCKER_INFLUXDB_INIT_PASSWORD=<strong-password>
   DOCKER_INFLUXDB_INIT_ORG=trustagri
   DOCKER_INFLUXDB_INIT_BUCKET=sensor_data
   DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=<random-32-char-token>
   ```
4. Sau deploy, ghi lại internal hostname Railway cấp (dạng `influxdb.railway.internal`).

### B3. Deploy 5 microservices

Làm lần lượt cho: `auth-service`, `notification-service`, `farm-service`, `contract-service`, `monitoring-service`.

**Option A — GitHub (khuyến nghị):**
1. **Add Service** → **GitHub Repo** → chọn repo
2. **Root Directory** = `be`
3. **Dockerfile Path** = `apps/<tên-service>/Dockerfile`

**Option B — Railway CLI:**
```powershell
cd be
railway link   # link vào project trustagri-prod

railway up --service auth-service         --dockerfile apps/auth-service/Dockerfile
railway up --service notification-service --dockerfile apps/notification-service/Dockerfile
railway up --service farm-service         --dockerfile apps/farm-service/Dockerfile
railway up --service contract-service     --dockerfile apps/contract-service/Dockerfile
railway up --service monitoring-service   --dockerfile apps/monitoring-service/Dockerfile
```

### B4. Deploy API Gateway (Nginx)

Gateway là `nginx` định tuyến request từ ngoài vào các microservice nội bộ qua **Railway Private Network**.

1. **Add Service** → **Docker Image** → `nginx:1.25-alpine`
2. Expose port `80` → Railway tự cấp domain HTTPS dạng `trustagri-gateway-xxx.railway.app`
3. (Tùy chọn) Gán **Custom Domain** trong Settings

**Tạo file `be/nginx/nginx.prod.conf`** cho Railway (các service kết nối qua internal hostname):
```nginx
events { worker_connections 1024; }

http {
  upstream auth     { server auth-service.railway.internal:3001; }
  upstream notify   { server notification-service.railway.internal:3002; }
  upstream farm     { server farm-service.railway.internal:3003; }
  upstream contract { server contract-service.railway.internal:3004; }
  upstream monitor  { server monitoring-service.railway.internal:3005; }

  server {
    listen 80;

    location /api/v1/auth/     { proxy_pass http://auth/;     proxy_set_header Host $host; }
    location /api/v1/farms/    { proxy_pass http://farm/;     proxy_set_header Host $host; }
    location /api/v1/contracts/{ proxy_pass http://contract/; proxy_set_header Host $host; }
    location /api/v1/monitoring/{ proxy_pass http://monitor/; proxy_set_header Host $host; }
    location /api/v1/notifications/{ proxy_pass http://notify/; proxy_set_header Host $host; }

    location /ws/ {
      proxy_pass         http://monitor/;
      proxy_http_version 1.1;
      proxy_set_header   Upgrade    $http_upgrade;
      proxy_set_header   Connection "upgrade";
      proxy_set_header   Host       $host;
    }

    location /health {
      return 200 '{"status":"ok"}';
    }
  }
}
```

> Railway Private Networking: các service trong cùng project kết nối nhau qua `<service-name>.railway.internal` — không cần expose port ra internet.

### B5. Cấu hình environment variables

Trong Railway dashboard → từng service → **Variables**:

**Biến chung cho mọi service:**

| Biến | Giá trị |
|------|---------|
| `NODE_ENV` | `production` |
| `POSTGRES_HOST` | `<railway-postgres-internal-host>` |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `<railway-generated-password>` |
| `POSTGRES_DB` | `railway` |
| `REDIS_HOST` | `<railway-redis-internal-host>` |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | `<railway-generated-password>` |
| `JWT_SECRET` | Tạo bằng `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `15m` |
| `FE_ORIGINS` | `https://h5.zdn.vn,https://zalo.me,https://miniapp.zalo.me` |
| `ZALO_APP_ID` | App ID từ Zalo Developer Console |
| `ZALO_SECRET_KEY` | Secret Key từ Zalo Developer Console |

**Biến riêng theo service:**
```
# auth-service
PORT=3001
AUTH_DEV_LOGIN_ENABLED=false
AUTH_PASSWORD_LOGIN_ENABLED=false

# notification-service
PORT=3002
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
FARM_SERVICE_URL=http://farm-service.railway.internal:3003

# farm-service
PORT=3003
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
CONTRACT_SERVICE_URL=http://contract-service.railway.internal:3004
MONITORING_SERVICE_URL=http://monitoring-service.railway.internal:3005

# contract-service
PORT=3004
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
FARM_SERVICE_URL=http://farm-service.railway.internal:3003
MONITORING_SERVICE_URL=http://monitoring-service.railway.internal:3005

# monitoring-service
PORT=3005
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
FARM_SERVICE_URL=http://farm-service.railway.internal:3003
CONTRACT_SERVICE_URL=http://contract-service.railway.internal:3004
INFLUXDB_URL=http://influxdb.railway.internal:8086
INFLUXDB_TOKEN=<token-đặt-lúc-tạo-influxdb>
INFLUXDB_ORG=trustagri
INFLUXDB_BUCKET=sensor_data
```

### B6. Chạy database migrations

**Cách 1 — Railway CLI:**
```powershell
railway run --service auth-service -- sh -c "npm run migration:run"
railway run --service farm-service -- sh -c "npm run migration:run"
```

**Cách 2 — Kết nối DB từ local (Railway tunnel):**
```powershell
# Mở tunnel tới PostgreSQL Railway
railway connect postgres

# Chạy migration sau khi kết nối được
cd be/apps/auth-service
$env:DATABASE_URL = "<railway-connection-string>"
npm run migration:run
```

**Cách 3 — Tạm thời bật synchronize:**
```
# Trong Railway → auth-service → Variables
NODE_ENV=development   # tạm thời → TypeORM synchronize=true
```
Sau khi sync xong đổi lại `NODE_ENV=production`.

### B7. Kiểm tra backend Railway

```powershell
# Health check
curl https://trustagri-gateway-xxx.railway.app/health
# Kết quả: {"status":"ok"}

# Test auth endpoint
curl -X POST https://trustagri-gateway-xxx.railway.app/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"accessToken":"test-invalid"}'
# Mong đợi: 401 (không phải 502/503)
```

---

## Phần C — Triển khai Frontend lên Zalo Mini App

> Phần này giống nhau dù dùng DigitalOcean hay Railway cho backend.

### C1. Tạo Mini App trên Zalo Developer Console

1. Vào <https://developers.zalo.me> → **Tạo ứng dụng mới** → chọn **Mini App**.
2. Điền tên app (ví dụ: TrustAgri), mô tả, category.
3. Ghi lại **App ID**.
4. Vào **Mini App Settings**:
   - **Allowed domains**: thêm domain backend (ví dụ: `https://api.tienkhoa.id.vn` hoặc `https://trustagri-gateway-xxx.railway.app`)
5. Vào tab **Development** → lấy **ZMP Token** để deploy.

### C2. Cài ZMP CLI và đăng nhập

```powershell
# Cài ZMP CLI toàn cục
npm install -g zmp-cli
zmp --version

# Đăng nhập (trong thư mục fe/)
cd fe
npm run login
# → Trình duyệt mở, quét QR bằng Zalo trên điện thoại để xác nhận
```

### C3. Cấu hình `.env` production

Tạo file `fe/.env` (KHÔNG commit lên git):

```dotenv
# ── API — trỏ về domain backend (chọn 1 trong 2) ─────────
# DigitalOcean:
VITE_API_BASE_URL=https://api.tienkhoa.id.vn/api/v1
# Railway:
# VITE_API_BASE_URL=https://trustagri-gateway-xxx.railway.app/api/v1

# ── Auth mode ─────────────────────────────────────────────
VITE_AUTH_MODE=zalo-oauth

# ── Không dùng mock ───────────────────────────────────────
VITE_USE_MOCK=false

# ── Zalo Mini App ID ──────────────────────────────────────
APP_ID=<App_ID_từ_Zalo_Developer>

# ── ZMP Token để deploy ───────────────────────────────────
ZMP_TOKEN=<ZMP_Token_từ_Developer_Console>
```

### C4. Build và kiểm tra bundle

```powershell
cd fe
npm install

# Build production
npm run build

# Kiểm tra kích thước bundle — phải < 20MB
npm run build:check
```

### C5. Deploy lên Zalo

```powershell
cd fe
npm run deploy
# Hoặc: zmp deploy
```

Sau deploy thành công:
```
✓ Deploy thành công!
Version: 1.0.x
Preview: https://zalo.me/s/xxxxxxxxxxxx/
```

**Publish hoặc Preview:**
- Developer Console → **Versions** → chọn version mới → **Submit for Review** → **Publish**
- Test ngay không cần review: **Development** → **Tester List** → thêm số điện thoại → quét QR preview

---

## Phần D — Kết nối BE + FE để dùng trên điện thoại thật

### D1. Luồng Zalo OAuth đầy đủ

```
[Mở Mini App trên điện thoại]
         │
         ▼
[ZMP SDK tự gọi getAccessToken()]
         │  Zalo access token
         ▼
[FE gọi POST <backend>/api/v1/auth/login]
  Body: { accessToken: "<zalo_token>" }
         │
         ▼
[BE auth-service xác thực với graph.zalo.me]
         │  trả về: userId, name, picture
         ▼
[BE tạo JWT TrustAgri + refresh token → trả về FE]
         │
         ▼
[FE lưu JWT vào Jotai atom — dùng cho mọi API call tiếp]
         │  Header: Authorization: Bearer <JWT>
         ▼
[Các API: farms, contracts, monitoring...]
```

### D2. Cấu hình CORS bắt buộc

Zalo Mini App gửi request từ origin `https://h5.zdn.vn`. Thiếu origin này → mọi API call thất bại.

**DigitalOcean:** Sửa `/opt/trustagri/be/.env` → restart:
```bash
FE_ORIGINS=https://h5.zdn.vn,https://zalo.me,https://miniapp.zalo.me
docker compose up -d --force-recreate
```

**Railway:** Vào từng service → **Variables** → cập nhật `FE_ORIGINS`.

### D3. Test 3 cách trên điện thoại

**Cách 1 — Preview Mode (test nhanh, không cần publish):**
1. Developer Console → **Development** → **Tester List** → thêm số điện thoại
2. Quét QR code preview bằng Zalo trên điện thoại
3. App mở ngay, dùng backend production thật

**Cách 2 — App đã publish:**
1. Zalo → tìm kiếm "TrustAgri" → mở
2. Tự đăng nhập Zalo OAuth

**Cách 3 — Staging `dev-seeded` (không cần Zalo OAuth thật):**

Dùng khi test backend mà chưa setup Zalo OAuth hoàn chỉnh:
```dotenv
# fe/.env (staging only — KHÔNG dùng production)
VITE_API_BASE_URL=https://<backend-domain>/api/v1
VITE_AUTH_MODE=dev-seeded
VITE_DEV_LOGIN_SECRET=<khớp DEV_LOGIN_SECRET trên BE>
VITE_DEV_LOGIN_ZALO_ID=zalo_dev_farmer_001
VITE_USE_MOCK=false
```

Trên BE cần bật:
```dotenv
AUTH_DEV_LOGIN_ENABLED=true
DEV_LOGIN_SECRET=<chuỗi_khớp_FE>
```

User seed sẵn trong `be/scripts/seed-dev-users.sql`:
- `zalo_dev_farmer_001` → role **farmer**
- `zalo_dev_trader_001` → role **trader**
- `zalo_dev_buyer_001` → role **buyer**
- `zalo_dev_guest_001` → role **guest**

### D4. Debug trên điện thoại với Zalo DevTools

1. Điện thoại phải trong **Tester List**.
2. Mở Mini App trên điện thoại.
3. PC: mở Zalo Developer Console → **DevTools** → kết nối với điện thoại qua QR.
4. Xem **Console logs** và **Network requests** trực tiếp từ điện thoại.

---

## 7. Checklist trước khi demo

### Backend

**DigitalOcean:**
- [ ] `docker compose ps` — tất cả container `Up`
- [ ] `curl https://api.tienkhoa.id.vn/health` → `{"status":"ok"}`
- [ ] HTTPS hoạt động, chứng chỉ Let's Encrypt còn hạn
- [ ] Port 3001–3005, 5432, 6379 không mở ra internet (`ufw status`)

**Railway:**
- [ ] Tất cả 5 service + Gateway ở trạng thái **Active**
- [ ] `curl https://trustagri-gateway-xxx.railway.app/health` → `{"status":"ok"}`
- [ ] Không có service ở trạng thái `Crashed`

**Chung cho cả hai:**
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` đủ mạnh (≥ 32 ký tự ngẫu nhiên)
- [ ] `ZALO_APP_ID` và `ZALO_SECRET_KEY` đúng
- [ ] `FE_ORIGINS` chứa `https://h5.zdn.vn`
- [ ] `AUTH_DEV_LOGIN_ENABLED=false`
- [ ] Migration đã chạy, bảng đã tạo

### Frontend — Zalo Mini App

- [ ] `VITE_API_BASE_URL` trỏ đúng domain backend
- [ ] `VITE_AUTH_MODE=zalo-oauth`
- [ ] `VITE_USE_MOCK=false`
- [ ] `APP_ID` khớp với Zalo Developer Console
- [ ] Bundle < 20MB (`npm run build:check` pass)
- [ ] `npm run deploy` thành công, version hiện trên Developer Console
- [ ] Domain backend có trong **Allowed domains** trên Zalo Developer Console
- [ ] Điện thoại test đã trong **Tester List**

### Kết nối end-to-end

- [ ] Mở app trên điện thoại → không crash, không màn trắng
- [ ] Zalo OAuth tự đăng nhập thành công
- [ ] Ít nhất 1 luồng chính hoạt động (xem farm / care log / hợp đồng)
- [ ] Không có lỗi CORS trong Zalo DevTools

---

## 8. Khắc phục sự cố thường gặp

### Backend chung

| Triệu chứng | Nguyên nhân | Xử lý |
|-------------|-------------|-------|
| Container/service crash | Thiếu biến env | Đọc logs — thường thấy `Error: <VAR> is required` |
| `502 Bad Gateway` | Service chưa up | Kiểm tra service status; xem logs |
| `ECONNREFUSED postgres` | `POSTGRES_HOST=localhost` thay vì tên service | Sửa thành `postgres` (Docker) hoặc Railway internal host |
| `relation does not exist` | Chưa chạy migration | Chạy migration thủ công |

**DigitalOcean — debug nhanh:**
```bash
docker compose logs -f --tail=100 auth-service
docker compose exec postgres psql -U trustagri -d trustagri -c "\dt"
docker compose exec auth-service env | grep -E 'POSTGRES|JWT|ZALO'
```

**Railway — debug nhanh:**
- Railway Dashboard → service → **Logs** tab

### Frontend

| Triệu chứng | Nguyên nhân | Xử lý |
|-------------|-------------|-------|
| `Network Error` / CORS | `FE_ORIGINS` thiếu origin Zalo | Thêm `https://h5.zdn.vn`; restart services |
| `401` login loop | `ZALO_APP_ID` hoặc `SECRET_KEY` sai | Kiểm tra key trên Developer Console |
| Màn hình trắng | JS error, `VITE_API_BASE_URL` sai | Dùng Zalo DevTools → Console tab |
| `zmp deploy` fail | ZMP token hết hạn | `npm run login` rồi deploy lại |
| Bundle > 20MB | Thư viện nặng | Lazy load screen; `npm run build:check` |

```powershell
# Build lại sạch
cd fe
Remove-Item -Recurse -Force dist
npm run build
```

### Railway free tier

Railway free tier có giới hạn compute/bandwidth:
- Dùng **Hobby plan** ($5/tháng) để ổn định hơn cho demo
- Hoặc đảm bảo demo trong cùng tháng với lần deploy

---

*Cập nhật lần cuối: 2026-05-27*
