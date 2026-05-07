# Rule: Backend Development

**Tham chiếu:** [`.claude/docs/tech-stack.md`](../docs/tech-stack.md), [`.claude/docs/business-logic.md`](../docs/business-logic.md), [`.claude/docs/architecture.md`](../docs/architecture.md), `/specs/backend-api-specification/`.

## Stack bắt buộc
- NestJS 10.4 + TypeScript 5.3.
- TypeORM 0.3 (PostgreSQL), `@nestjs/typeorm`.
- `class-validator` + `class-transformer` cho DTO.
- Passport + `@nestjs/jwt` cho auth.
- Logger từ `@nestjs/common` (đừng dùng `console.*`).

## Cấu trúc service

```
apps/<service>/src/
  <domain>/
    controllers/  → thin router, validate qua DTO + ValidationPipe
    services/     → business logic, transaction, log
    entities/     → TypeORM entity, camelCase props ↔ snake_case columns
    dto/          → request/response, decorators validate
    <domain>.module.ts
```

## DTO & Shared
- DTO chia sẻ: `be/libs/shared/src/dto/`. Update tại đây + rebuild shared trước khi dùng cross-service.
- Constants chia sẻ: `be/libs/shared/src/constants/`.

## Error Handling
Throw built-in NestJS exceptions:
- `NotFoundException` → 404
- `ForbiddenException` → 403
- `ConflictException` → 409 (business rule violation, vd: xóa farm có active contract)
- `BadRequestException` → 400
- `UnauthorizedException` → 401

Format response: `{ error: { code, message }, requestId }`.

## Logging
- Structured JSON: `requestId, userId, action, duration`.
- Sensitive (token, password, PII) → `[REDACTED]`.
- Level: `debug` < `log` < `warn` < `error`. KHÔNG log info ở error level.

## Database
- Migration script trong từng service (`apps/<service>/src/migrations/`).
- FK cross-service: enforce ở DB migration, KHÔNG dùng TypeORM relations cross-service.
- Soft delete: `deletedAt`, không hard delete (trừ ngoại lệ ghi rõ).

## Security
- Mọi endpoint nhạy cảm phải có `@UseGuards(JwtAuthGuard)`.
- Endpoint public (vd traceability) đánh dấu rõ + KHÔNG trả PII.
- HTTPS-only ở production (NFR-S03).

## Test
- Unit: Jest tại từng service (`*.spec.ts`).
- Integration: `be/integration-tests/`.
- Test name: pattern `should <expected behavior> when <condition>`.

## Convention
- Files: kebab-case (`farm.entity.ts`, `create-care-log.dto.ts`).
- Folders: kebab-case (`care-logs/`).
- Class: PascalCase (`FarmService`, `CreateCareLogDto`).
- DB columns: snake_case via TypeORM column options.
- Comments: 1 dòng, chỉ khi WHY non-obvious. Không multi-line block.
