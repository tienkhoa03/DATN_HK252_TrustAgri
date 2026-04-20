/**
 * LoginScreen — Phase 1.2 Integration (FR-S01)
 *
 * Màn đăng nhập thật qua Zalo OAuth.
 *
 * Luồng:
 *  1. Người dùng nhấn "Đăng nhập với Zalo".
 *  2. useAuth.login() → getAccessToken() (ZMP SDK) → POST /api/v1/auth/login.
 *  3. Interceptor gắn Bearer tự động; gọi GET /api/v1/auth/me.
 *  4. Hiển thị UserProfileDto nhận được → nút điều hướng theo role.
 *
 * Xử lý lỗi:
 *  - ApiError → thông báo tiếng Việt qua Snackbar (ZMP-UI).
 *  - Token ZMP SDK không lấy được → thông báo rõ ràng.
 *  - 401 từ backend → interceptor xóa session; UI hiển thị lại màn login.
 *
 * DTO mapping (design.md §4.1, §1.1):
 *  - Backend trả camelCase → authService.ts map 1-1 → không cần mapper thêm.
 *  - UserProfileDto: userId, zaloId, role, displayName, phone?, email?,
 *    avatarUrl?, traderProfile?, farmerProfile?, buyerProfile?, createdAt, lastLogin.
 */

import React, { useEffect } from 'react';
import { Page, Box, Text, Spinner, useSnackbar, useNavigate } from 'zmp-ui';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfileDto } from '@/hooks/useAuth';
import type { AuthSession } from '@/state/authAtoms';
import { primaryColors, functionalColors } from '@/design-system/tokens/colors';

// ── Role routing table ────────────────────────────────────────────────────────

const ROLE_META: Record<
  'farmer' | 'trader' | 'buyer' | 'guest',
  { label: string; emoji: string; color: string; homePath: string }
> = {
  farmer: { label: 'Nông dân',   emoji: '🌾', color: primaryColors.agriGreen, homePath: '/farmer' },
  trader: { label: 'Thương lái', emoji: '🏢', color: primaryColors.zaloBlue,  homePath: '/trader' },
  buyer:  { label: 'Người mua',  emoji: '🛒', color: '#8B5CF6',               homePath: '/buyer'  },
  guest:  { label: 'Khách',      emoji: '👤', color: '#6B7280',               homePath: '/guest'  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginScreen() {
  const { openSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { session, profile, isLoading, error, login, isAuthenticated, clearError } = useAuth();

  // ── Hiển thị lỗi qua Snackbar tiếng Việt ────────────────────────────────
  useEffect(() => {
    if (error) {
      openSnackbar({ type: 'error', text: error, duration: 5000, icon: true });
      clearError();
    }
  }, [error, openSnackbar, clearError]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLogin = () => {
    login();
  };

  const handleContinue = () => {
    const role = session?.role ?? 'guest';
    const path = ROLE_META[role]?.homePath ?? '/';
    navigate(path);
  };

  const handleLogoutAndRetry = async () => {
    window.location.reload();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Page style={{ background: functionalColors.neutralGray, minHeight: '100vh' }}>

      {/* ── Header gradient ─────────────────────────────────────────────── */}
      <Header />

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <Box style={{ padding: '24px 16px 40px' }}>

        {/* SUCCESS — hiển thị sau khi đăng nhập thành công */}
        {isAuthenticated && session && (
          <SuccessView
            session={session}
            profile={profile}
            onContinue={handleContinue}
            onRetry={handleLogoutAndRetry}
          />
        )}

        {/* IDLE / LOADING — chưa đăng nhập */}
        {!isAuthenticated && (
          <>
            {isLoading ? (
              <LoadingState />
            ) : (
              <IdleState onLogin={handleLogin} />
            )}
          </>
        )}
      </Box>
    </Page>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header() {
  return (
    <Box
      style={{
        background: `linear-gradient(135deg, ${primaryColors.agriGreen} 0%, ${primaryColors.zaloBlue} 100%)`,
        padding: '40px 24px 32px',
        textAlign: 'center',
      }}
    >
      <Text style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}>🌱</Text>
      <Text
        style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 8 }}
      >
        TrustAgri
      </Text>
      <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
        Nền tảng nông nghiệp minh bạch — kết nối nông dân, thương lái và người mua
      </Text>
    </Box>
  );
}

// ── Idle state (chưa đăng nhập) ───────────────────────────────────────────────

function IdleState({ onLogin }: { onLogin: () => void }) {
  return (
    <Box>
      {/* Zalo login card */}
      <Box
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '28px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
          }}
        >
          Đăng nhập để tiếp tục
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: '#6B7280',
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          TrustAgri sử dụng tài khoản Zalo của bạn để xác thực an toàn. Không cần tạo tài khoản mới.
        </Text>

        {/* Zalo login button */}
        <button
          onClick={onLogin}
          style={{
            width: '100%',
            padding: '16px',
            background: primaryColors.zaloBlue,
            color: '#fff',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <ZaloIcon />
          Đăng nhập với Zalo
        </button>
      </Box>

      {/* Feature highlights */}
      <Box
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
          Tính năng theo vai trò
        </Text>
        <FeatureRow emoji="🌾" role="Nông dân" color={primaryColors.agriGreen}
          desc="Vườn, nhật ký chăm sóc, cảm biến" />
        <FeatureRow emoji="🏢" role="Thương lái" color={primaryColors.zaloBlue}
          desc="Nguồn cung, giao dịch, tiêu chuẩn" />
        <FeatureRow emoji="🛒" role="Người mua" color="#8B5CF6"
          desc="Chợ nông sản, đơn hàng, bản sao số" />
      </Box>
    </Box>
  );
}

// ── Loading state ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <Box
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}
    >
      <Spinner />
      <Box>
        <Text style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
          Đang xác thực với Zalo…
        </Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
          ZMP SDK đang lấy access token{'\n'}→ POST /api/v1/auth/login
        </Text>
      </Box>
      {/* Progress steps */}
      <Box style={{ width: '100%', marginTop: 8 }}>
        <ProgressStep label="Lấy Zalo access token" active />
        <ProgressStep label="Xác thực với TrustAgri Gateway" />
        <ProgressStep label="Tải hồ sơ người dùng" />
      </Box>
    </Box>
  );
}

// ── Success view ──────────────────────────────────────────────────────────────

function SuccessView({
  session,
  profile,
  onContinue,
  onRetry,
}: {
  session: AuthSession;
  profile: UserProfileDto | null;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const meta = ROLE_META[session.role] ?? ROLE_META.guest;
  const truncate = (s: string, n = 30) => (s.length > n ? s.slice(0, n) + '…' : s);

  return (
    <>
      {/* Success banner */}
      <Box
        style={{
          background: `${primaryColors.agriGreen}12`,
          border: `1.5px solid ${primaryColors.agriGreen}50`,
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 24 }}>✅</Text>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: 700, color: '#065F46' }}>
            Đăng nhập thành công
          </Text>
          <Text style={{ fontSize: 12, color: '#047857' }}>
            Gateway xác thực thành công · Bearer token đã lưu
          </Text>
        </Box>
      </Box>

      {/* LoginResponseDto — kết quả POST /api/v1/auth/login */}
      <SectionCard
        title="LoginResponseDto"
        subtitle="POST /api/v1/auth/login"
        color={meta.color}
      >
        <InfoRow label="accessToken"  value={truncate(session.accessToken)} mono />
        <InfoRow label="refreshToken" value={truncate(session.refreshToken)} mono />
        <InfoRow label="userId"       value={session.userId} />
        <InfoRow label="role"         value={session.role} highlight={meta.color} />
        <InfoRow
          label="expiresAt"
          value={new Date(session.expiresAt).toLocaleString('vi-VN')}
        />
      </SectionCard>

      {/* UserProfileDto — kết quả GET /api/v1/auth/me */}
      {profile && (
        <SectionCard
          title="UserProfileDto"
          subtitle="GET /api/v1/auth/me"
          color={meta.color}
        >
          {/* Avatar + name */}
          <ProfileHeader profile={profile} meta={meta} />

          {/* Core fields */}
          <InfoRow label="userId"    value={profile.userId} />
          <InfoRow label="zaloId"    value={profile.zaloId} />
          {profile.phone && <InfoRow label="phone" value={profile.phone} />}
          {profile.email && <InfoRow label="email" value={profile.email} />}
          <InfoRow
            label="createdAt"
            value={new Date(profile.createdAt).toLocaleDateString('vi-VN')}
          />
          <InfoRow
            label="lastLogin"
            value={new Date(profile.lastLogin).toLocaleString('vi-VN')}
          />

          {/* Role-specific sub-objects */}
          {profile.farmerProfile && (
            <SubObject title="farmerProfile" color={primaryColors.agriGreen}>
              <InfoRow label="region"          value={profile.farmerProfile.region} />
              <InfoRow label="experienceYears" value={`${profile.farmerProfile.experienceYears} năm`} />
            </SubObject>
          )}
          {profile.traderProfile && (
            <SubObject title="traderProfile" color={primaryColors.zaloBlue}>
              <InfoRow label="companyName" value={profile.traderProfile.companyName} />
              <InfoRow label="region"      value={profile.traderProfile.region} />
              <InfoRow label="capacity"    value={profile.traderProfile.capacity} />
              <InfoRow label="trustScore"  value={`${profile.traderProfile.trustScore} / 5`} />
            </SubObject>
          )}
          {profile.buyerProfile && (
            <SubObject title="buyerProfile" color="#8B5CF6">
              <InfoRow
                label="organizationName"
                value={profile.buyerProfile.organizationName ?? '—'}
              />
            </SubObject>
          )}
        </SectionCard>
      )}

      {/* Navigation */}
      <Box style={{ marginTop: 4 }}>
        <button
          onClick={onContinue}
          style={{
            width: '100%',
            padding: '16px',
            background: meta.color,
            color: '#fff',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          {meta.emoji} Vào {meta.label} →
        </button>
        <button
          onClick={onRetry}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: '#6B7280',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            border: '1.5px solid #E5E7EB',
            cursor: 'pointer',
          }}
        >
          Làm mới trang
        </button>
      </Box>
    </>
  );
}

// ── Small UI helpers ──────────────────────────────────────────────────────────

function ProfileHeader({
  profile,
  meta,
}: {
  profile: UserProfileDto;
  meta: { label: string; emoji: string; color: string };
}) {
  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: `1px solid ${meta.color}22`,
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
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: meta.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {meta.emoji}
        </Box>
      )}
      <Box>
        <Text style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
          {profile.displayName}
        </Text>
        <Box
          style={{
            display: 'inline-block',
            background: `${meta.color}20`,
            color: meta.color,
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
  );
}

function FeatureRow({
  emoji,
  role,
  color,
  desc,
}: {
  emoji: string;
  role: string;
  color: string;
  desc: string;
}) {
  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingBottom: 10,
        marginBottom: 10,
        borderBottom: '1px solid #F3F4F6',
      }}
    >
      <Box
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {emoji}
      </Box>
      <Box>
        <Text style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{role}</Text>
        <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{desc}</Text>
      </Box>
    </Box>
  );
}

function ProgressStep({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 0',
        opacity: active ? 1 : 0.4,
      }}
    >
      <Box
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? primaryColors.zaloBlue : '#D1D5DB',
          flexShrink: 0,
        }}
      />
      <Text style={{ fontSize: 12, color: active ? primaryColors.zaloBlue : '#9CA3AF', fontWeight: active ? 600 : 400 }}>
        {label}
      </Text>
    </Box>
  );
}

function SectionCard({
  title,
  subtitle,
  color,
  children,
}: {
  title: string;
  subtitle: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      style={{
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 14,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}
    >
      <Box
        style={{
          background: `${color}0e`,
          borderBottom: `1px solid ${color}22`,
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: 700, color }}>{title}</Text>
        <Text style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{subtitle}</Text>
      </Box>
      <Box style={{ padding: '10px 14px' }}>{children}</Box>
    </Box>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: string;
}) {
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
      <Text
        style={{
          fontSize: 11,
          color: '#9CA3AF',
          fontFamily: 'monospace',
          flexShrink: 0,
          marginRight: 8,
          paddingTop: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: highlight ?? '#111827',
          fontWeight: highlight ? 700 : 400,
          textAlign: 'right',
          wordBreak: 'break-all',
          fontFamily: mono ? 'monospace' : undefined,
        }}
      >
        {value}
      </Text>
    </Box>
  );
}

function SubObject({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      style={{
        marginTop: 10,
        border: `1px solid ${color}30`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          background: `${color}0e`,
          borderBottom: `1px solid ${color}22`,
          padding: '5px 10px',
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: 700, color, fontFamily: 'monospace' }}>
          {title}
        </Text>
      </Box>
      <Box style={{ padding: '6px 10px' }}>{children}</Box>
    </Box>
  );
}

/** Zalo logo SVG icon (24 × 24) */
function ZaloIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="white" fillOpacity="0.25" />
      <text x="3" y="17" style={{ fontSize: 13, fontWeight: 800, fill: '#fff', fontFamily: 'Arial, sans-serif' }}>
        Z
      </text>
    </svg>
  );
}

export default LoginScreen;
