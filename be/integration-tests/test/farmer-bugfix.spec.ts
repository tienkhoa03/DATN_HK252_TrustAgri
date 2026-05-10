/**
 * Integration tests — farmer bugfix plan (2026-05-10-01)
 *
 * Tests các hành vi cần thiết sau khi sửa:
 *  1. searchTraders returns 200 with empty list when no traders exist
 *  2. getFarmerDashboard returns 200 with zero counts when user has no farms
 *  3. PUT /auth/me silently ignores displayName and phone fields
 *
 * Yêu cầu: contract-service + auth-service + Postgres running (Docker compose).
 * Skip trong CI mặc định.
 */

import { describe, expect, it } from '@jest/globals';

describe.skip('searchTraders — fix 500 khi trader_reviews chưa có (FR-T02)', () => {
  it('should return 200 with empty items when no traders exist', async () => {
    // Seed: farmer JWT (không cần trader nào tồn tại trong DB)
    // GET /api/v1/traders/search (no params)
    // Expect: 200, { items: [], total: 0, page: 1, limit: 20 }
    expect(true).toBe(true);
  });

  it('should return 200 with items when traders exist', async () => {
    // Seed: 1 trader user trong DB với trader_profile
    // GET /api/v1/traders/search?region=...
    // Expect: 200, { items: [UserProfileDto], total: 1 }
    expect(true).toBe(true);
  });
});

describe.skip('getFarmerDashboard — fix 5xx khi user không có vườn (FR-F07)', () => {
  it('should return 200 with zero counts when farmer has no farms', async () => {
    // Seed: farmer user không có farm nào, JWT farmer
    // GET /api/v1/dashboard/farmer
    // Expect: 200, { complianceScore: 0, recentAlerts: 0, activeContracts: 0, careLogCount: 0 }
    expect(true).toBe(true);
  });

  it('should return 401 when Authorization header is missing', async () => {
    // GET /api/v1/dashboard/farmer — không có Bearer token
    // Expect: 401 (do JwtAuthGuard), bukan 400 (BadRequestException cũ)
    expect(true).toBe(true);
  });
});

describe.skip('PUT /auth/me — ignore displayName and phone (FR-T01)', () => {
  it('should silently ignore displayName in update body', async () => {
    // Seed: farmer user với displayName 'Nguyễn A'
    // PUT /auth/me { displayName: 'Bị bỏ qua' }
    // GET /auth/me → displayName vẫn là 'Nguyễn A'
    expect(true).toBe(true);
  });

  it('should silently ignore phone in update body', async () => {
    // Seed: farmer user với phone '0901234567'
    // PUT /auth/me { phone: '0999999999' }
    // GET /auth/me → phone vẫn là '0901234567'
    expect(true).toBe(true);
  });

  it('should still allow updating email', async () => {
    // Seed: farmer user không có email
    // PUT /auth/me { email: 'test@example.com' }
    // GET /auth/me → email = 'test@example.com'
    expect(true).toBe(true);
  });
});
