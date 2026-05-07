/**
 * Integration test (Phase C5) — care log sync idempotent + conflict detection.
 *
 * Scope (per business-logic.md §3 + design.md):
 *   POST /api/v1/farms/:farmId/care-logs/sync
 *
 * Hợp đồng:
 *   - Cùng `clientRecordId` gửi 2 lần → lần đầu accepted, lần sau accepted (no-op) hoặc rejected (idempotent).
 *   - Conflict: log thiếu `standardStepId` thứ tự (deviation) → status 'conflicted'.
 *
 * GHI CHÚ: skeleton — yêu cầu chạy với farm-service + Postgres (Docker compose).
 * Đánh dấu `describe.skip` để CI mặc định không fail; bỏ skip khi infra ready.
 */

import { describe, expect, it } from '@jest/globals';

describe.skip('Care log sync — idempotency + conflict (FR-F09, FR-F05)', () => {
  it('cùng clientRecordId 2 lần → chỉ tạo 1 care log', async () => {
    // 1. Setup: farm-service running + farmer JWT + farm with standardId.
    // 2. POST /care-logs/sync với 1 entry { clientRecordId: 'CR-001', action: 'watering', performedAt: ISO }
    //    → status 'accepted', serverId X.
    // 3. POST lần 2 cùng payload (cùng CR-001).
    //    → status 'accepted' với cùng serverId X (idempotent) HOẶC 'rejected' với reason 'duplicate'.
    // 4. GET /care-logs?farmId=... → chỉ thấy 1 entry.
    expect(true).toBe(true);
  });

  it('care log với standardStepId out-of-order → đánh dấu deviation', async () => {
    // 1. Standard có steps order [1,2,3]. Farm chưa log step 1.
    // 2. POST /care-logs với standardStepId=step3.
    //    → response.deviation = true.
    expect(true).toBe(true);
  });

  it('sync batch mixed: accepted + rejected khi performedAt > now', async () => {
    // Future timestamp → reject. Past timestamp valid → accept.
    expect(true).toBe(true);
  });
});
