---
description: Thực hiện kế hoạch đã viết (file trong .claude/plan/) — code + test + cập nhật trạng thái plan
argument-hint: <plan slug or filename, e.g. 2026-05-08-farm-care-log-sync>
---

# /implementation-plan — TrustAgri

Bạn vừa được gọi `/implementation-plan $ARGUMENTS`.

## Mục tiêu

Thực thi plan đã được tạo bởi `/make-plan`. Code, test, cập nhật trạng thái plan.

## Quy trình

### 1. Locate plan

- Nếu `$ARGUMENTS` là full filename → đọc trực tiếp.
- Nếu là slug (vd `farm-care-log-sync`) → Glob `.claude/plan/*<slug>*.md`, lấy file mới nhất.
- Nếu không có argument → list files trong `.claude/plan/`, hỏi user chọn.
- Nếu không tìm thấy → báo user và đề xuất chạy `/make-plan` trước.

### 2. Đọc plan + context tối thiểu

- Đọc plan file.
- Đọc các file `Tham chiếu` được liệt kê trong plan §3.
- KHÔNG đọc các file không liên quan.

### 3. Cập nhật plan status → in-progress

Edit field `**Status:** draft` thành `**Status:** in-progress` ngay đầu file.

### 4. Track tasks

Dùng `TaskCreate` với từng bước trong plan §6 (Bước thực hiện). Mỗi bước = 1 task. Khi bắt đầu một bước → `in_progress`. Khi xong → `completed`.

### 5. Thực thi

Cho mỗi bước:

1. Identify scope (BE / FE / shared).
2. Nếu BE-heavy → cân nhắc gọi sub-agent `backend-developer`.
3. Nếu FE-heavy → cân nhắc gọi sub-agent `frontend-developer`.
4. Nếu mixed nhỏ → tự làm trực tiếp.
5. **Tuân thủ rules** trong `.claude/rules/00-context-loading.md`, `10-backend.md`, `20-frontend.md`.
6. Sau mỗi bước:
   - Run lint / test phù hợp (`npm run lint`, `npm run test` ở thư mục liên quan).
   - Báo user 1-2 dòng tóm tắt bước đó.

### 6. Verify acceptance criteria

Sau khi xong tất cả bước:
- Đối chiếu plan §5 (Acceptance criteria) với code thực tế.
- Run final test suite.
- Optional: gọi sub-agent `spec-aligner` để verify, hoặc `code-reviewer` để review.

### 7. Cập nhật plan status

- Nếu mọi acceptance đạt → `**Status:** done`.
- Nếu có blocker → `**Status:** blocked` + thêm section `## Blockers` với chi tiết.
- Nếu user dừng giữa chừng → `**Status:** in-progress`, ghi rõ bước đã xong.

### 8. Báo cáo cuối

Trả lời user terse:
- Files changed (số lượng + path key).
- Tests run + result.
- FR/US/NFR đáp ứng.
- Trạng thái plan (`done` / `blocked` / còn lại).
- Đề xuất next step (commit, PR, hoặc resume).

## Quy tắc

- **KHÔNG sửa specs gốc** (`/specs/**`).
- **KHÔNG mở rộng scope** ngoài plan. Nếu phát hiện cần thêm — DỪNG, hỏi user, có thể đề xuất `/make-plan` mới.
- **KHÔNG commit** trừ khi user yêu cầu.
- Nếu spec mismatch hoặc design conflict — DỪNG ngay, không "sửa cho chạy".
