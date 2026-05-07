# Rule: Context Loading Protocol

**Mục tiêu:** Tiết kiệm token. KHÔNG re-explore toàn dự án mỗi prompt — đọc đúng doc tương ứng.

## Quy tắc

1. **Mặc định** đã có CLAUDE.md trong context. Đừng đọc lại.
2. **Trước khi làm task mới**, xác định loại công việc và đọc đúng doc:
   - Câu hỏi nghiệp vụ → `.claude/docs/requirements.md` + `business-logic.md`.
   - Code backend → `.claude/docs/tech-stack.md` (DB schema, lib) + `business-logic.md`.
   - Code frontend → `.claude/docs/design-system.md` + `tech-stack.md` (FE phần) + `project-structure.md`.
   - Đổi kiến trúc → `.claude/docs/architecture.md`.
   - Tra thuật ngữ → `.claude/docs/glossary.md`.
3. **Specs gốc** (`/specs/**/design.md`, `tasks.md`) là source of truth chi tiết hơn docs — đọc khi docs không đủ. KHÔNG sửa specs.
4. **Trace yêu cầu**: khi viết code mới, comment hoặc commit message ghi mã `FR-*`/`US-*`/`NFR-*` liên quan.
5. **Đừng đọc lại file không cần thiết**. Nếu đã đọc trong cùng conversation, dùng lại context. Nếu doc đã đủ, đừng grep code.

## Cấm

- Tự tạo API/endpoint không có trong `/specs/**/design.md` (theo `.cursorrules`).
- Mock/stub mà không khớp DTO trong `be/libs/shared/src/dto/`.
- Hardcode màu / font / spacing — phải import từ `fe/src/design-system/tokens/`.
- Dùng `react-router-dom` cho navigation chính (chỉ dùng cho dev screens). Routing chính là `zmp-ui` Router/Route.

## Khi conflict

Nếu phát hiện FE call API không khớp BE design → **dừng + cảnh báo user**, không sửa ép cho chạy.
