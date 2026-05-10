# Hướng dẫn triển khai toàn bộ dự án TrustAgri (BE + FE Zalo Mini App)

Tài liệu này hướng dẫn chi tiết từng bước để triển khai cả backend (microservices NestJS) và frontend (Zalo Mini App — Vite + ZMP) của dự án TrustAgri.

Giả định và chú ý chung
- Hệ điều hành: Windows (PowerShell) hoặc Linux/macOS (bash). Nếu không dùng Windows, thay các lệnh PowerShell bằng bash tương ứng.
- Cài sẵn: `node` (>=18), `npm` (hoặc `pnpm`/`yarn`), `docker` + `docker-compose`/`docker compose`, Git.
- Bạn cần tài khoản Zalo dev và quyền deploy Zalo Mini App; đã cài `zmp` CLI nếu cần.
- Dữ liệu nhạy cảm: KHÔNG đẩy file `.env` có secrets lên Git; dùng biến môi trường trong CI/CD hoặc secrets manager.

Mục lục
1. Chuẩn bị môi trường
2. Thiết lập biến môi trường (env)
3. Triển khai Backend (local dev và production bằng Docker)
4. Triển khai Frontend (build cho Zalo Mini App + deploy)
5. Cấu hình Nginx reverse-proxy và HTTPS (production)
6. CI/CD tham khảo (GitHub Actions)
7. Kiểm tra, xác thực và khắc phục sự cố

---

1) Chuẩn bị môi trường

- Cài Node.js, npm
  - Windows: tải từ https://nodejs.org và cài.

- Cài Docker
  - Windows: cài Docker Desktop, bật WSL2 nếu được khuyến nghị.

- Cài ZMP CLI (nếu dự án dùng `zmp-cli`) — hoặc dùng script `npm run deploy` trong `fe/`.
  - Toàn cục (nếu muốn):
    ```bash
    npm i -g @zalo/zmp-cli
    ```

- Clone repo và cài dependencies
  ```powershell
  git clone <repo-url>
  cd trustagri
  # cài root dependencies nếu cần
  npm install
  # hoặc vào từng workspace nếu monorepo dùng workspaces
  cd be
  npm install
  cd ../fe
  npm install
  ```

2) Thiết lập biến môi trường

- Mỗi service backend có thể có file `.env` riêng trong `be/apps/<service>/` hoặc dùng `be/.env` theo cấu hình. **KHÔNG** commit file `.env`.
- Các biến quan trọng (ví dụ):
  - `DATABASE_URL` (Postgres)
  - `REDIS_URL`
  - `INFLUX_URL` (nếu dùng InfluxDB)
  - `JWT_SECRET`, `JWT_EXPIRES`
  - Zalo OAuth credentials (nếu có)

- Mẫu: tạo `.env.local` (chỉ local) hoặc cấu hình secrets trong CI.

3) Triển khai Backend

3.1 Chạy local (dev) — dùng turbo / npm run dev

- Mở terminal tại `be/` và chạy:
  ```powershell
  cd be
  npm install
  npm run dev
  ```
- `npm run dev` theo cấu hình repo sẽ chạy các microservices song song (Turbo / concurrently). Kiểm tra `be/package.json` để biết script chính xác.

3.2 Kiểm tra DB và migration

- Dự án sử dụng TypeORM + migrations nằm trong `apps/<service>/src/migrations/` (theo CLAUDE.md). Trước khi chạy service production, chạy migration.
- Kiểm tra scripts trong từng `apps/<service>/package.json` để biết tên script migration (ví dụ `npm run migration:run` hoặc `npm run typeorm:migrate`). Nếu không có, dùng CLI TypeORM tương ứng hoặc viết script nhỏ.

Ví dụ (nếu script có sẵn):
```powershell
cd be/apps/farm-service
npm install
npm run build
npm run migration:run
```

3.3 Chạy production bằng Docker Compose

- Repo có `be/docker-compose.yml` (nếu có). File này nên (hoặc sẽ) bao gồm Postgres, Redis, InfluxDB và service container.
- Tại thư mục `be/`:
  ```powershell
  cd be
  docker compose build
  docker compose up -d
  ```
- Kiểm tra logs:
  ```powershell
  docker compose logs -f
  ```

3.4 Nếu muốn build image cho từng service

- Mỗi service thường có `Dockerfile` tại `be/apps/<service>/Dockerfile`.
- Ví dụ build & push:
  ```powershell
  # build local
  docker build -t myregistry/trustagri-farm:latest -f apps/farm-service/Dockerfile .
  docker push myregistry/trustagri-farm:latest
  ```

3.5 Migrations và seed data (DB)

- Nếu bạn dùng Docker Compose cho DB, chạy migration từ container hoặc host (cùng network). Ví dụ:
  ```powershell
  docker compose exec app-service npm run migration:run
  ```
- Hoặc connect DB với psql và chạy SQL seed file: `scripts/seed-dev-users.sql` (nếu có):
  ```powershell
  docker exec -i <postgres_container> psql -U postgres -d trustagri < scripts/seed-dev-users.sql
  ```

4) Triển khai Frontend (Zalo Mini App)

4.1 Kiểm tra & build

- Vào thư mục `fe/`:
  ```powershell
  cd fe
  npm install
  npm run build
  npm run build:check   # nếu dự án có script kiểm tra kích thước bundle
  ```
- `npm run build` theo Vite sẽ tạo bundle trong `dist/` hoặc folder mà cấu hình ZMP yêu cầu.

4.2 Kiểm tra bundle cho Zalo

- Zalo Mini App có giới hạn kích thước; chạy `npm run build:check` nếu dự án có.

4.3 Deploy lên Zalo (sử dụng ZMP CLI hoặc script dự án)

- Nếu repo đã có `npm run deploy` (theo CLAUDE.md):
  ```powershell
  cd fe
  npm run deploy
  ```
- Nếu dùng `zmp-cli` trực tiếp:
  ```powershell
  # Đăng nhập (nếu cần)
  npx @zalo/zmp-cli login
  # Deploy (tùy cli):
  npx @zalo/zmp-cli deploy --project ./dist
  ```
- Thao tác deploy có thể yêu cầu `app-config.json` (đã có trong `fe/`). Kiểm tra `zmp-cli` docs và `fe/zmp-cli.json`.

4.4 Kiểm tra trên Zalo

- Sau deploy, mở Zalo dev console / preview để kiểm tra app hoạt động.

5) Cấu hình Nginx reverse-proxy & HTTPS (production)

- Nếu bạn dùng VPS, triển khai Nginx làm reverse-proxy đến backend service (port 300x) và serve static FE nếu cần.

Ví dụ `nginx` config (mẫu):
```nginx
server {
  listen 80;
  server_name your-domain.com;

  location /api/ {
    proxy_pass http://127.0.0.1:3001/; # gateway hoặc api
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    # Nếu FE deploy trên same server
    root /var/www/trustagri/fe;
    try_files $uri $uri/ /index.html;
  }
}
```

- Dùng Certbot để cài Let’s Encrypt HTTPS:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

6) CI/CD tham khảo (GitHub Actions)

- Quy trình đề xuất:
  - On push/main: chạy `npm test` cho BE + FE, xây dựng ảnh Docker, push image lên registry.
  - On release: chạy migration (an toàn), deploy docker compose update hoặc deploy lên k8s.

- Ví dụ job tóm tắt:
  - Checkout
  - Setup Node.js
  - Install deps
  - Lint + Test
  - Build FE (`fe/npm run build`)
  - Build/push Docker images (login to registry)
  - SSH & deploy (pull images, restart services) — hoặc deploy bằng IaC (az cli / terraform)

6.1 Secrets cần cấu hình trong repo CI
 - `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (hoặc registry token)
 - `PRODUCTION_SSH_KEY` (để SSH deploy)
 - `DATABASE_URL_PROD`, `REDIS_URL_PROD`, `JWT_SECRET_PROD`
 - `ZMP_TOKEN` hoặc `ZALO_DEPLOY_TOKEN` (nếu zmp hỗ trợ token deploy)

7) Kiểm tra, xác thực và khắc phục sự cố

7.1 Kiểm tra service hoạt động
 - Kiểm tra container: `docker ps` và `docker logs -f <container>`
 - Kiểm tra endpoint: `curl -i https://your-domain.com/api/health` (nếu health endpoint có sẵn)
 - Kiểm tra DB: kết nối bằng `psql` hoặc GUI (pgAdmin) tới `DATABASE_URL`

7.2 Lỗi thường gặp & gợi ý xử lý
- 502 Bad Gateway: kiểm tra service backend có chạy, socket/listen port có khớp Nginx config không.
- 500 server error: kiểm tra logs trong container / `npm run start:prod` output; bật log level debug tạm thời nếu cần.
- Migration không chạy: kiểm tra connection string, quyền DB, và chạy migration thủ công.
- FE: bundle quá lớn → chạy `npm run build:check`, tối ưu import, lazy-load screens lớn.

7.3 Kiểm tra sau deploy Zalo
- Nếu Zalo không hiển thị hoặc crash: kiểm tra console logs Zalo dev panel, kiểm tra cấu hình `app-config.json` và các permissions (scope) yêu cầu từ Zalo SDK.

7.4 Backup & Rollback
- Luôn có backup DB trước khi chạy migration trên production.
- Chuẩn bị image/tag trước khi deploy để rollback nhanh (ví dụ `myimage:2026-05-11-rc1`).

Kết luận & checklist nhanh
- [ ] Chuẩn bị secrets & `.env` an toàn
- [ ] Chạy migration trên staging trước production
- [ ] Kiểm tra kích thước bundle FE (< giới hạn Zalo)
- [ ] Thiết lập HTTPS và health checks
- [ ] Thiết lập CI/CD với secrets

Nếu bạn muốn, tôi có thể:
- sinh file `docker-compose.prod.yml` mẫu cho production,
- tạo ví dụ GitHub Actions workflow,
- hoặc thực thi một bản build + deploy thử trên môi trường dev của bạn.

---

File này được tạo tự động trong repository để bạn dễ tham khảo: [deploy_instruction.md](deploy_instruction.md)
