# Plans — TrustAgri

> Kế hoạch triển khai các feature / task. Mỗi file là một plan, được sinh bởi `/make-plan` và thực thi bởi `/implementation-plan`.

## Convention

- **File name:** `<YYYY-MM-DD>-<kebab-slug>.md` (vd: `2026-05-08-farm-care-log-sync.md`).
- **Status field** ở đầu plan: `draft` → `in-progress` → `done` | `blocked`.
- **Slug ngắn gọn** (3–5 từ), descriptive.

## Workflow

```
/make-plan <feature mô tả>
   → tạo file plan, status=draft

/implementation-plan <slug>
   → đọc plan, tạo task tracking, thực thi từng bước
   → cập nhật status=in-progress / done / blocked
```

## Index

(tự động liệt kê khi thêm plan; có thể list bằng `ls .claude/plan/*.md`)

## Quy tắc

- KHÔNG xóa plan đã `done` (giữ lại làm history).
- Nếu plan thay đổi scope giữa chừng → tạo plan mới + reference cái cũ.
- Khi commit code, có thể link tới plan trong commit message: `Plan: .claude/plan/2026-05-08-foo.md`.
