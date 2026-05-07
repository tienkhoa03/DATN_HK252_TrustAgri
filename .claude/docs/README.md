# Documentation Index — TrustAgri

> **Single source of truth** cho dự án. AI agent BẮT BUỘC tham chiếu các docs này thay vì re-read toàn bộ codebase mỗi prompt.

---

## Khi nào đọc file nào?

| Bạn cần... | Đọc |
|------------|-----|
| Hiểu **yêu cầu nghiệp vụ** (US/FR/NFR) | [`requirements.md`](./requirements.md) |
| Hiểu **kiến trúc** + lý do quyết định | [`architecture.md`](./architecture.md) |
| Hiểu **workflow** (auth, farm, monitoring, contract...) | [`business-logic.md`](./business-logic.md) |
| Tra **stack / lib version / DB schema** | [`tech-stack.md`](./tech-stack.md) |
| Tra **cấu trúc thư mục, naming convention** | [`project-structure.md`](./project-structure.md) |
| Tra **màu, font, icon, spacing** | [`design-system.md`](./design-system.md) |
| Tra **thuật ngữ Việt-Anh, vai trò, mã** | [`glossary.md`](./glossary.md) |

---

## Files

- **[requirements.md](requirements.md)** — Catalog User Stories (US-*), Functional Requirements (FR-*), Non-Functional Requirements (NFR-*). Có Traceability matrix.
- **[architecture.md](architecture.md)** — Layered + Microservices, data flows, ADR.
- **[business-logic.md](business-logic.md)** — 8 workflows chính: auth, farm, care log, monitoring, contracts, traceability, notification, standards.
- **[tech-stack.md](tech-stack.md)** — Stack, version, DB schema, integration points, env vars.
- **[project-structure.md](project-structure.md)** — Layout `be/`, `fe/`, `specs/`, naming conventions.
- **[design-system.md](design-system.md)** — Color palette, typography scale, iconography, spacing.
- **[glossary.md](glossary.md)** — Thuật ngữ Việt-Anh, mã US/FR/NFR.

---

## Quan hệ với tài liệu khác

- **[CLAUDE.md](../../CLAUDE.md)** — Quick reference root: build commands + index docs.
- **[/specs/](../../specs/)** — Đặc tả gốc (Kiro-style):
  - `backend-api-specification/{requirements,design,tasks}.md`
  - `frontend-ui-specification/{requirements,design,tasks}.md`
- **[/.cursorrules](../../.cursorrules)** — Quy tắc workspace (specs là source of truth, không tự tạo API ngoài design).

---

## Quy ước cập nhật

1. Khi requirements / FR / NFR thay đổi: cập nhật `requirements.md` + cross-link.
2. Khi đổi schema / endpoint: cập nhật `tech-stack.md` + `business-logic.md`.
3. Khi đổi kiến trúc (thêm/bớt service, đổi DB): cập nhật `architecture.md` + ADR table.
4. Khi đổi design tokens: cập nhật `design-system.md` + sync `fe/src/design-system/tokens/`.
5. **KHÔNG** sửa `/specs/*` mà không có lệnh rõ ràng (theo `.cursorrules`).
