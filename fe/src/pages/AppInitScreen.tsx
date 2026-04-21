/**
 * AppInitScreen — Smoke-test màn hình khởi động (Phase 0.2)
 *
 * Luồng:
 *  1. Lấy Zalo access token từ ZMP SDK (getAccessToken).
 *  2. Gọi POST /api/v1/auth/login để đổi sang JWT accessToken của hệ thống.
 *  3. Gọi POST /api/v1/auth/verify với JWT vừa nhận để xác minh Gateway + Axios client.
 *  4. Nếu verify thành công → gọi tiếp GET /api/v1/auth/me và hiển thị UserProfileDto.
 *  5. Mọi lỗi ApiError đều hiện Snackbar tiếng Việt (useStableOpenSnackbar).
 *
 * VITE_USE_MOCK=true: mockLogin + mockGetMe, hoặc nếu có VITE_DEV_LOGIN_SECRET thì dev-login → JWT thật + GET /auth/me (các trang sau dùng Bearer).
 * VITE_USE_MOCK=false: auth qua Zalo + Gateway.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Page, Box, Text, Spinner, useNavigate } from 'zmp-ui';
import { useSetAtom } from 'jotai';

import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { ENV } from '@/config/env';
import { ApiError } from '@/api/errors';
import * as authService from '@/services/authService';
import { resolveZaloAccessToken } from '@/services/zaloAccessToken';
import type { UserProfileDto } from '@/services/authService';
import { authSessionAtom } from '@/state/authAtoms';
import { bootstrapMockAuthSession, isMockOnlyJwt } from '@/services/mockAuthBootstrap';
import { primaryColors, functionalColors } from '@/design-system/tokens/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

type SmokeStatus = 'idle' | 'loading' | 'ok' | 'error';

interface SmokeResult {
  zaloToken: string;
  verifyResponse?: { userId: string; role: string; valid: boolean };
  profile?: UserProfileDto;
  errorMessage?: string;
}

// ── Vietnamese error messages ─────────────────────────────────────────────────

function toVietnameseError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':   return 'Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':      return 'Bạn không có quyền truy cập tính năng này.';
      case 'NOT_FOUND':      return 'Không tìm thấy tài nguyên yêu cầu.';
      case 'RATE_LIMIT_EXCEEDED': return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
      case 'NETWORK_ERROR':  return 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE': return 'Dịch vụ tạm thời không khả dụng. Thử lại sau.';
      default: return err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Đã xảy ra lỗi không xác định.';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppInitScreen() {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();
  const setAuthSession = useSetAtom(authSessionAtom);

  const [status, setStatus]       = useState<SmokeStatus>('idle');
  const [result, setResult]       = useState<SmokeResult | null>(null);
  const hasAutoRunRef = useRef(false);
  const inFlightRef = useRef(false);

  const runSmokeTest = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setStatus('loading');
    setResult(null);

    try {
      if (ENV.USE_MOCK) {
        const { session: authSession, profile } = await bootstrapMockAuthSession();
        setAuthSession(authSession);
        const zaloToken = ENV.ZALO_API_KEY || 'farmer';
        let verifyResponse: { userId: string; role: string; valid: boolean };
        if (isMockOnlyJwt(authSession.accessToken)) {
          verifyResponse = { userId: profile.userId, role: profile.role, valid: true };
        } else {
          verifyResponse = await authService.verify(authSession.accessToken);
        }
        setResult({ zaloToken, verifyResponse, profile });
        setStatus('ok');
        return;
      }

      // ── Real path (VITE_USE_MOCK=false) ───────────────────────────
      // Step 1: Get Zalo access token from ZMP SDK
      let zaloToken: string;
      try {
        zaloToken = await resolveZaloAccessToken();
      } catch {
        throw new Error('Không lấy được Zalo access token. Đảm bảo ứng dụng đang chạy trong Zalo Mini App.');
      }

      // Step 2: Exchange Zalo token -> JWT session (POST /api/v1/auth/login)
      const authSession = await authService.login(zaloToken);
      setAuthSession(authSession);

      // Step 3: Smoke call POST /api/v1/auth/verify với JWT accessToken
      const verifyResponse = await authService.verify(authSession.accessToken);

      // Step 4: GET /api/v1/auth/me
      const profile = await authService.getMe(authSession.accessToken);

      setResult({ zaloToken, verifyResponse, profile });
      setStatus('ok');
    } catch (err) {
      setAuthSession(null);
      const message = toVietnameseError(err);
      setResult({ zaloToken: '', errorMessage: message });
      setStatus('error');

      openSnackbar({
        type: 'error',
        text: message,
        duration: 5000,
        icon: true,
      });
    } finally {
      inFlightRef.current = false;
    }
  }, [openSnackbar, setAuthSession]);

  // Run smoke test on mount
  useEffect(() => {
    if (hasAutoRunRef.current) return;
    hasAutoRunRef.current = true;
    void runSmokeTest();
  }, [runSmokeTest]);

  return (
    <Page className="bg-gray-50" style={{ minHeight: '100vh' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${primaryColors.agriGreen} 0%, ${primaryColors.zaloBlue} 100%)`,
          padding: '24px 20px 20px',
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          🌾 TrustAgri
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
          {ENV.USE_MOCK
            ? ENV.DEV_LOGIN_SECRET
              ? '🟡 Mock + JWT dev (VITE_DEV_LOGIN_SECRET)'
              : '🟡 Chế độ Mock (VITE_USE_MOCK=true)'
            : `🟢 Kết nối thật — ${ENV.API_BASE_URL}`}
        </Text>
      </Box>

      <Box style={{ padding: '20px 16px' }}>

        {/* ── Smoke Test Card ───────────────────────────────────────────────── */}
        <Box
          style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          {/* Card header */}
          <Box
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Text style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                Smoke Test — POST /api/v1/auth/verify
              </Text>
              <Text style={{ fontSize: 11, color: '#9CA3AF' }}>
                {ENV.USE_MOCK
                  ? ENV.DEV_LOGIN_SECRET
                    ? 'dev-login → JWT thật (session Redis)'
                    : 'mockAuthService (mock.jwt)'
                  : 'ZMP SDK → Gateway → Auth Service'}
              </Text>
            </Box>
            <StatusBadge status={status} />
          </Box>

          {/* Loading */}
          {status === 'loading' && (
            <Box style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Spinner />
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
                {ENV.USE_MOCK
                  ? ENV.DEV_LOGIN_SECRET
                    ? 'Đang dev-login + GET /auth/me…'
                    : 'Gọi mockAuthService…'
                  : 'Đang lấy Zalo token + gọi /auth/verify…'}
              </Text>
            </Box>
          )}

          {/* Error */}
          {status === 'error' && result?.errorMessage && (
            <Box style={{ padding: '16px' }}>
              <Box
                style={{
                  background: '#FEF2F2',
                  border: `1px solid ${functionalColors.alertRed}33`,
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <Text style={{ fontSize: 13, color: functionalColors.alertRed, fontWeight: 600, marginBottom: 4 }}>
                  Lỗi kết nối
                </Text>
                <Text style={{ fontSize: 13, color: '#7F1D1D' }}>{result.errorMessage}</Text>
              </Box>
              <RetryButton onRetry={runSmokeTest} />
            </Box>
          )}

          {/* Success */}
          {status === 'ok' && result && (
            <Box style={{ padding: '16px 16px 20px' }}>
              {/* Verify response */}
              <SectionTitle>Kết quả verify</SectionTitle>
              {result.verifyResponse && (
                <Box style={{ marginBottom: 16 }}>
                  <InfoField label="userId" value={result.verifyResponse.userId} />
                  <InfoField label="role"   value={result.verifyResponse.role} />
                  <InfoField label="valid"  value={String(result.verifyResponse.valid)} />
                </Box>
              )}

              {/* Zalo token (truncated) */}
              <SectionTitle>Zalo Access Token</SectionTitle>
              <Box style={{ marginBottom: 16 }}>
                <InfoField
                  label="token"
                  value={result.zaloToken.length > 30
                    ? result.zaloToken.slice(0, 30) + '…'
                    : result.zaloToken}
                />
              </Box>

              {/* User profile */}
              {result.profile && <ProfileCard profile={result.profile} />}
            </Box>
          )}
        </Box>

        {/* ── Infrastructure info ──────────────────────────────────────────── */}
        <Box
          style={{
            background: '#F0FDF4',
            border: `1px solid ${primaryColors.agriGreen}44`,
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 6 }}>
            ✅ Hạ tầng Phase 0 đã sẵn sàng
          </Text>
          <InfraItem label="src/api/client.ts"           value="Axios singleton + baseURL" />
          <InfraItem label="src/api/interceptors.ts"     value="JWT bearer + chuẩn hóa ApiError" />
          <InfraItem label="src/api/errors.ts"           value="parseAxiosError → ApiError" />
          <InfraItem label="src/config/env.ts"           value={`HTTPS-only enforcement (${ENV.IS_LOCAL ? 'local' : 'production'})`} />
          <InfraItem label="src/state/authAtoms.ts"      value="Jotai: authSession + role + token" />
          <InfraItem label="src/services/authService.ts" value="login / verify / logout / getMe / updateMe" />
          <InfraItem label="src/services/mockService.ts" value="mockAuth only (VITE_USE_MOCK)" />
          <InfraItem label="src/router/routes.tsx"       value="20+ routes + RoleGuard" />
        </Box>

        {/* ── Navigate to dev launcher ─────────────────────────────────────── */}
        <Box style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/dev/screens')}
            style={{
              display: 'inline-block',
              padding: '10px 28px',
              background: primaryColors.zaloBlue,
              color: '#fff',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Mở màn hình demo →
          </button>
        </Box>
      </Box>
    </Page>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SmokeStatus }) {
  const config = {
    idle:    { bg: '#F3F4F6', color: '#6B7280', text: 'Chờ' },
    loading: { bg: '#EFF6FF', color: '#1D4ED8', text: '…' },
    ok:      { bg: '#D1FAE5', color: '#065F46', text: '200 OK' },
    error:   { bg: '#FEE2E2', color: '#991B1B', text: 'Lỗi' },
  }[status];

  return (
    <Box
      style={{
        background: config.bg,
        color: config.color,
        fontSize: 12,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 99,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {status === 'loading' ? <Spinner size="small" /> : null}
      {config.text}
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: 6,
        marginBottom: 6,
        borderBottom: '1px solid #F9FAFB',
      }}
    >
      <Text style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', flexShrink: 0, marginRight: 8 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, color: '#111827', textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </Text>
    </Box>
  );
}

function InfraItem({ label, value }: { label: string; value: string }) {
  return (
    <Box style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
      <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace', flexShrink: 0 }}>{label}</Text>
      <Text style={{ fontSize: 11, color: '#374151' }}>— {value}</Text>
    </Box>
  );
}

function ProfileCard({ profile }: { profile: UserProfileDto }) {
  const roleColor =
    profile.role === 'farmer' ? primaryColors.agriGreen :
    profile.role === 'trader' ? primaryColors.zaloBlue :
    profile.role === 'buyer' ? '#8B5CF6' : '#6B7280';

  const roleEmoji =
    profile.role === 'farmer' ? '🌾' :
    profile.role === 'trader' ? '🏢' :
    profile.role === 'buyer' ? '🛒' : '👤';

  return (
    <Box>
      <SectionTitle>GET /api/v1/auth/me — UserProfileDto</SectionTitle>
      <Box
        style={{
          border: `1.5px solid ${roleColor}33`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Profile header */}
        <Box
          style={{
            background: roleColor + '14',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: `1px solid ${roleColor}22`,
          }}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <Box
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: roleColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}
            >
              {roleEmoji}
            </Box>
          )}
          <Box>
            <Text style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{profile.displayName}</Text>
            <Box
              style={{
                display: 'inline-block',
                background: roleColor + '22',
                color: roleColor,
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
                marginTop: 3,
              }}
            >
              {profile.role}
            </Box>
          </Box>
        </Box>

        {/* Fields */}
        <Box style={{ padding: '10px 14px' }}>
          <InfoField label="userId"    value={profile.userId} />
          <InfoField label="zaloId"    value={profile.zaloId} />
          {profile.phone && <InfoField label="phone"    value={profile.phone} />}
          {profile.email && <InfoField label="email"    value={profile.email} />}
          <InfoField label="createdAt" value={new Date(profile.createdAt).toLocaleDateString('vi-VN')} />
          <InfoField label="lastLogin" value={new Date(profile.lastLogin).toLocaleString('vi-VN')} />

          {/* Role-specific sub-object */}
          {profile.farmerProfile && (
            <NestedBlock title="farmerProfile" color={primaryColors.agriGreen}>
              <InfoField label="region"          value={profile.farmerProfile.region} />
              <InfoField label="experienceYears" value={`${profile.farmerProfile.experienceYears} năm`} />
            </NestedBlock>
          )}
          {profile.traderProfile && (
            <NestedBlock title="traderProfile" color={primaryColors.zaloBlue}>
              <InfoField label="companyName" value={profile.traderProfile.companyName} />
              <InfoField label="region"      value={profile.traderProfile.region} />
              <InfoField label="capacity"    value={profile.traderProfile.capacity} />
              <InfoField label="trustScore"  value={`${profile.traderProfile.trustScore} / 5`} />
            </NestedBlock>
          )}
          {profile.buyerProfile && (
            <NestedBlock title="buyerProfile" color="#8B5CF6">
              <InfoField label="organizationName" value={profile.buyerProfile.organizationName ?? '—'} />
            </NestedBlock>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function NestedBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <Box
      style={{
        marginTop: 10,
        border: `1px solid ${color}33`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Box style={{ background: color + '14', padding: '6px 10px', borderBottom: `1px solid ${color}22` }}>
        <Text style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'monospace' }}>{title}</Text>
      </Box>
      <Box style={{ padding: '6px 10px' }}>{children}</Box>
    </Box>
  );
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Box style={{ marginTop: 12, textAlign: 'center' }}>
      <button
        onClick={onRetry}
        style={{
          padding: '9px 24px',
          background: primaryColors.zaloBlue,
          color: '#fff',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Thử lại
      </button>
    </Box>
  );
}

export default AppInitScreen;
