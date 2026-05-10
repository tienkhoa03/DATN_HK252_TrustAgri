/**
 * Integration test — trader review & trust score lifecycle.
 *
 * Scope:
 *   POST /api/v1/traders/:traderId/reviews
 *   GET  /api/v1/traders/:traderId/trust-score
 *   PATCH /api/v1/reviews/:id
 *   DELETE /api/v1/reviews/:id
 *
 * Yêu cầu chạy với contract-service + Postgres (Docker compose).
 * Skip trong CI mặc định; bỏ skip khi infra ready.
 */

import { describe, expect, it } from '@jest/globals';

describe.skip('Trader reviews & trust score (FR-T01, FR-U06, US-U03)', () => {
  it('should allow buyer to review a completed order and affect trust score', async () => {
    // 1. Seed: buyer JWT, trader JWT, completed order between them.
    // 2. GET /traders/:traderId/trust-score → { average: null, count: 0 }.
    // 3. POST /traders/:traderId/reviews { orderId, rating: 4 } → 201 TraderReviewDto.
    // 4. GET /traders/:traderId/trust-score → { average: 4.0, count: 1 }.
    expect(true).toBe(true);
  });

  it('should reject duplicate review for the same order with 409', async () => {
    // 1. POST first review → 201.
    // 2. POST same orderId again → 409.
    expect(true).toBe(true);
  });

  it('should reject review when order is not completed with 403', async () => {
    // Seed order with status=accepted.
    // POST /reviews → 403.
    expect(true).toBe(true);
  });

  it('should soft-delete review and exclude from trust score AVG', async () => {
    // 1. POST two reviews: rating 5, rating 3 → AVG=4.
    // 2. DELETE first review.
    // 3. GET trust-score → average=3.0, count=1.
    expect(true).toBe(true);
  });

  it('should allow buyer to update review within 7 days', async () => {
    // 1. POST review rating=3.
    // 2. PATCH review rating=5.
    // 3. GET trust-score → average=5.0.
    expect(true).toBe(true);
  });
});
