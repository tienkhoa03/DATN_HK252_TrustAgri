# Rule: Context Loading Protocol

**Mục tiêu:** Tiết kiệm token. KHÔNG re-explore toàn dự án mỗi prompt — đọc đúng file theo index.

## Thứ tự ưu tiên khi cần context

1. **CLAUDE.md** đã trong context — KHÔNG đọc lại.
2. **[`.claude/docs/file-map.md`](../docs/file-map.md)** — index granular folder/file. **BẮT BUỘC tra trước Glob/Grep/ls.** Nếu task đụng tới folder/feature đã có entry → Read thẳng file đó.
3. **Doc theo loại task** (chỉ đọc khi cần khái niệm/quy tắc, không phải mỗi prompt):
   - Câu hỏi nghiệp vụ → `.claude/docs/requirements.md` + `business-logic.md`.
   - Code backend → `.claude/rules/10-backend.md` + `.claude/docs/tech-stack.md` (chỉ phần BE).
   - Code frontend → `.claude/rules/20-frontend.md` + `.claude/docs/design-system.md` + `tech-stack.md` (phần FE).
   - Đổi kiến trúc → `.claude/docs/architecture.md`.
   - Tra thuật ngữ / mã US/FR/NFR → `.claude/docs/glossary.md`.
   - Tra DB schema chi tiết → `postgres_database_design.md` / `influxdb_database_design.md` / `redis_database_design.md` ở root.
4. **Specs gốc** (`/specs/**/requirements.md`, `design.md`, `tasks.md`) khi docs tóm tắt chưa đủ — KHÔNG sửa.
5. **Source code** chỉ khi file-map + docs + specs vẫn chưa đủ → mới Glob/Grep.

## Tối ưu token bắt buộc

- **KHÔNG `ls` / `Glob '**/*'`** để khám phá folder đã có trong `file-map.md`. Đọc map → Read thẳng.
- **KHÔNG đọc lại file đã đọc trong cùng conversation.** Dùng lại context.
- **Sửa 1 feature BE:** mặc định Read tối đa 3 file: `<domain>.controller.ts`, `<domain>.service.ts`, DTO chia sẻ. Entity/module chỉ Read khi bạn sắp sửa nó.
- **Sửa 1 screen FE:** Read screen file + service file tương ứng (map trong `file-map.md`). Đừng mở cả thư mục screens role.
- **Đừng đọc cả file lớn** (`business-logic.md`, `tech-stack.md`, `postgres_database_design.md`) khi chỉ cần 1 section — dùng Grep với pattern cụ thể, hoặc Read kèm `offset`/`limit`.
- **Plan files (`.claude/plan/*.md`)** chỉ đọc khi user gọi `/implementation-plan <slug>` hoặc hỏi trực tiếp về plan đó.

## Cập nhật map khi khám phá ra điều mới

Nếu trong lúc làm task bạn phải Grep/Glob ra file/folder **chưa có** trong `file-map.md` và thấy nó quan trọng → thêm 1 dòng vào map (Section tương ứng) trước khi kết thúc task. Đây là cách map tự bồi đắp, để conversation sau khỏi khám phá lại.

## Trace yêu cầu

Khi viết code mới, comment hoặc commit message ghi mã `FR-*`/`US-*`/`NFR-*` liên quan (tra `glossary.md` / `requirements.md`).

## Cấm

- Tự tạo API/endpoint không có trong `/specs/backend-api-specification/design.md` (theo `.cursorrules`).
- Mock/stub mà không khớp DTO trong `be/libs/shared/src/dto/`.
- Hardcode màu / font / spacing — phải import từ `fe/src/design-system/tokens/`.
- Dùng `react-router-dom` cho navigation chính (chỉ dùng cho dev screens). Routing chính là `zmp-ui` Router/Route trong `fe/src/router/routes.tsx`.

## Khi conflict

Nếu phát hiện FE call API không khớp BE design → **dừng + cảnh báo user**, không sửa ép cho chạy.
