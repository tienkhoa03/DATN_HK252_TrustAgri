---
description: Sinh kế hoạch triển khai chi tiết cho một task / feature và lưu vào .claude/plan/<slug>.md
argument-hint: <feature description in Vietnamese or English>
---

# /make-plan — TrustAgri

Bạn vừa được gọi `/make-plan $ARGUMENTS`.

## Mục tiêu

Sinh ra **kế hoạch triển khai** cho yêu cầu trên, lưu vào `.claude/plan/<YYYY-MM-DD>-<slug>.md`. KHÔNG viết code ở bước này.

## Quy trình

### 1. Đọc context (token-efficient)

Đọc các file phù hợp với scope:
- Bắt buộc: `.claude/docs/requirements.md`, `.claude/docs/architecture.md`.
- Nếu liên quan BE: `+.claude/docs/tech-stack.md`, `.claude/docs/business-logic.md`, `/specs/backend-api-specification/design.md`.
- Nếu liên quan FE: `+.claude/docs/design-system.md`, `.claude/docs/project-structure.md`, `/specs/frontend-ui-specification/design.md`.
- Nếu unclear thuật ngữ: `.claude/docs/glossary.md`.

KHÔNG đọc whole codebase. Chỉ Glob/Grep file thực sự liên quan tới feature.

### 2. Phân tích

Trả lời ngắn gọn (trong head):
- FR-* / US-* / NFR-* nào liên quan?
- Service backend nào bị tác động?
- Screen / role frontend nào?
- DB schema thay đổi không?
- Endpoint mới hay edit?
- Cross-cutting (auth, notification, logging)?

Nếu **scope mơ hồ** hoặc **xung đột với specs** → hỏi lại user trước khi viết plan.

### 3. Viết plan

File: `.claude/plan/<YYYY-MM-DD>-<kebab-slug>.md` (slug từ feature name).

Template:

```markdown
# Plan: <Feature title>

**Created:** <YYYY-MM-DD>
**Status:** draft
**Owner:** <user>
**Related:** <FR-..., US-..., NFR-...>

## 1. Mục tiêu
<1-3 câu>

## 2. Scope
- In scope: ...
- Out of scope: ...

## 3. Tham chiếu
- requirements.md §<...>
- /specs/backend-api-specification/design.md §<endpoint name>
- /specs/frontend-ui-specification/design.md §<screen name>
- business-logic.md §<workflow>

## 4. Thay đổi dự kiến

### Backend
- Service: <auth|farm|contract|monitoring|notification>
- Files mới / sửa: <relative paths>
- Endpoint: <method path> (request/response DTO)
- DB migration: <yes/no, schema>

### Frontend
- Role: <farmer|trader|buyer|guest>
- Screen / component: <PascalCase>
- Files mới / sửa
- State / service mới

### Shared
- DTO trong libs/shared
- Config / env vars

## 5. Acceptance criteria
- [ ] FR-... đáp ứng
- [ ] NFR-... đáp ứng (bundle / perf / 3-click ...)
- [ ] Test: unit + integration / e2e

## 6. Bước thực hiện (cho /implementation-plan)
1. <step terse, có thể độc lập commit>
2. ...
N. Test + verify

## 7. Risks / Open questions
- ...

## 8. Estimate
- Effort: S/M/L
- Order of execution: BE first / FE first / parallel
```

### 4. Lưu file

Dùng `Write` tool vào path `.claude/plan/<YYYY-MM-DD>-<slug>.md`.

### 5. Báo lại

Trả lời user 3-5 dòng:
- Tên file plan đã lưu.
- FR/US/NFR liên quan.
- Hỏi user xem muốn chạy `/implementation-plan <slug>` luôn không.

## Lưu ý

- **KHÔNG code** ở bước này. Chỉ ghi plan.
- **KHÔNG** sửa specs.
- Nếu user gọi không có argument → hỏi lại feature cần plan.
