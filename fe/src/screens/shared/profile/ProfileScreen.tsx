/**
 * ProfileScreen — Phase 2.2 (FR-T01, FR-U*) — Integration
 *
 * Màn hồ sơ người dùng dùng chung cho ba role: farmer / trader / buyer.
 *
 * Tính năng:
 *  - Tải hồ sơ từ GET /api/v1/auth/me (Bearer token gắn tự động bởi interceptor)
 *  - Hiển thị thông tin chung + khối role-specific (farmerProfile / traderProfile / buyerProfile)
 *  - Chế độ chỉnh sửa: cập nhật displayName, phone, email + trường theo role
 *  - Skeleton loading khi đang tải; Snackbar tiếng Việt cho lỗi và thành công
 *
 * DTO mapping (design.md §4.1, §1.1):
 *  - Backend trả camelCase → authService.ts map 1-1 → không cần mapper thêm.
 *
 * Lỗi 400 (INVALID_INPUT):
 *  - useProfile.updateProfile() bắt ApiError và trả error string → Snackbar.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Text, Spinner } from 'zmp-ui';
import { RoleAppShell } from '@/navigation/RoleAppShell';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useProfile } from '@/hooks/useProfile';
import type { UserProfileDto, UserProfileUpdateDto } from '@/hooks/useProfile';
import type { UserRole } from '@/state/authAtoms';
import { primaryColors, functionalColors } from '@/design-system/tokens/colors';

// ── Role metadata ─────────────────────────────────────────────────────────────

type Role = 'farmer' | 'trader' | 'buyer' | 'guest';

const ROLE_META: Record<Role, { label: string; emoji: string; color: string; bg: string }> = {
  farmer: { label: 'Nông dân',   emoji: '🌾', color: primaryColors.agriGreen, bg: '#F0FBF4' },
  trader: { label: 'Thương lái', emoji: '🏢', color: primaryColors.zaloBlue,  bg: '#EEF5FF' },
  buyer:  { label: 'Người mua',  emoji: '🛒', color: '#8B5CF6',               bg: '#F5F0FF' },
  guest:  { label: 'Khách',      emoji: '👤', color: '#6B7280',               bg: '#F9FAFB' },
};

// ── ProfileScreen ─────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const location = useLocation();
  const shellRole: UserRole = location.pathname.startsWith('/trader') ? 'trader' : 'farmer';
  const openSnackbar = useStableOpenSnackbar();
  const { profile, isLoading, isSaving, error, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [form, setForm] = useState<Partial<UserProfileUpdateDto & {
    farmerRegion: string;
    farmerExp: string;
    traderCompany: string;
    traderRegion: string;
    traderCapacity: string;
    buyerOrg: string;
  }>>({});

  // Sync form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName,
        phone: profile.phone ?? '',
        email: profile.email ?? '',
        // role-specific
        farmerRegion:    profile.farmerProfile?.region            ?? '',
        farmerExp:       String(profile.farmerProfile?.experienceYears ?? ''),
        traderCompany:   profile.traderProfile?.companyName       ?? '',
        traderRegion:    profile.traderProfile?.region            ?? '',
        traderCapacity:  profile.traderProfile?.capacity          ?? '',
        buyerOrg:        profile.buyerProfile?.organizationName   ?? '',
      });
    }
  }, [profile]);

  // Show errors
  useEffect(() => {
    if (error) {
      openSnackbar({ type: 'error', text: error, duration: 4000, icon: true });
    }
  }, [error, openSnackbar]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!profile) return;
    const patch: UserProfileUpdateDto = {
      displayName: form.displayName,
      phone:       form.phone || undefined,
      email:       form.email || undefined,
    };

    if (profile.role === 'farmer' && profile.farmerProfile) {
      patch.farmerProfile = {
        region:          form.farmerRegion ?? profile.farmerProfile.region,
        experienceYears: Number(form.farmerExp) || profile.farmerProfile.experienceYears,
      };
    }
    if (profile.role === 'trader' && profile.traderProfile) {
      patch.traderProfile = {
        companyName: form.traderCompany  ?? profile.traderProfile.companyName,
        region:      form.traderRegion   ?? profile.traderProfile.region,
        capacity:    form.traderCapacity ?? profile.traderProfile.capacity,
        trustScore:  profile.traderProfile.trustScore, // not editable
      };
    }
    if (profile.role === 'buyer') {
      patch.buyerProfile = { organizationName: form.buyerOrg || undefined };
    }

    const ok = await updateProfile(patch);
    if (ok) {
      setIsEditing(false);
      openSnackbar({ type: 'success', text: 'Cập nhật hồ sơ thành công!', duration: 3000, icon: true });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        displayName:    profile.displayName,
        phone:          profile.phone ?? '',
        email:          profile.email ?? '',
        farmerRegion:   profile.farmerProfile?.region ?? '',
        farmerExp:      String(profile.farmerProfile?.experienceYears ?? ''),
        traderCompany:  profile.traderProfile?.companyName ?? '',
        traderRegion:   profile.traderProfile?.region ?? '',
        traderCapacity: profile.traderProfile?.capacity ?? '',
        buyerOrg:       profile.buyerProfile?.organizationName ?? '',
      });
    }
    setIsEditing(false);
  };

  // ── Loading state ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <RoleAppShell
        role={shellRole}
        pageStyle={{ background: functionalColors.neutralGray, minHeight: '100vh' }}
      >
        <LoadingSkeleton />
      </RoleAppShell>
    );
  }

  if (!profile) {
    return (
      <RoleAppShell
        role={shellRole}
        pageStyle={{ background: functionalColors.neutralGray, minHeight: '100vh' }}
      >
        <EmptyState />
      </RoleAppShell>
    );
  }

  const meta = ROLE_META[profile.role as Role] ?? ROLE_META.guest;

  return (
    <RoleAppShell
      role={shellRole}
      pageStyle={{ background: functionalColors.neutralGray, minHeight: '100vh' }}
    >

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <ProfileHero profile={profile} meta={meta} />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <Box style={{ padding: '16px 16px 48px' }}>

        {/* Edit / Save controls */}
        <Box style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          {isEditing ? (
            <Box style={{ display: 'flex', gap: 8 }}>
              <ActionButton label="Huỷ" onClick={handleCancel} variant="ghost" />
              <ActionButton
                label={isSaving ? 'Đang lưu…' : 'Lưu'}
                onClick={handleSave}
                variant="primary"
                color={meta.color}
                disabled={isSaving}
              />
            </Box>
          ) : (
            <ActionButton label="✏️  Chỉnh sửa" onClick={() => setIsEditing(true)} variant="outline" color={meta.color} />
          )}
        </Box>

        {/* ── Thông tin cơ bản ────────────────────────────────────────── */}
        <SectionCard title="Thông tin cơ bản" color={meta.color}>
          {isEditing ? (
            <>
              <FormField
                label="Tên hiển thị"
                value={form.displayName ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, displayName: v }))}
              />
              <FormField
                label="Số điện thoại"
                value={form.phone ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                type="tel"
              />
              <FormField
                label="Email"
                value={form.email ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                type="email"
              />
            </>
          ) : (
            <>
              <InfoRow label="Tên hiển thị" value={profile.displayName} />
              {profile.phone && <InfoRow label="Số điện thoại" value={profile.phone} />}
              {profile.email && <InfoRow label="Email" value={profile.email} />}
              <InfoRow label="Zalo ID" value={profile.zaloId} mono />
              <InfoRow label="Ngày tham gia" value={formatDate(profile.createdAt)} />
              <InfoRow label="Đăng nhập gần nhất" value={formatDateTime(profile.lastLogin)} isLast />
            </>
          )}
        </SectionCard>

        {/* ── farmerProfile ───────────────────────────────────────────── */}
        {profile.role === 'farmer' && profile.farmerProfile && (
          <SectionCard title="🌾  Hồ sơ Nông dân" color={primaryColors.agriGreen}>
            {isEditing ? (
              <>
                <FormField
                  label="Tỉnh / Vùng"
                  value={form.farmerRegion ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, farmerRegion: v }))}
                />
                <FormField
                  label="Số năm kinh nghiệm"
                  value={form.farmerExp ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, farmerExp: v }))}
                  type="number"
                />
              </>
            ) : (
              <>
                <InfoRow label="Tỉnh / Vùng" value={profile.farmerProfile.region} />
                <InfoRow
                  label="Kinh nghiệm"
                  value={`${profile.farmerProfile.experienceYears} năm`}
                  highlight={primaryColors.agriGreen}
                  isLast
                />
              </>
            )}
          </SectionCard>
        )}

        {/* ── traderProfile ───────────────────────────────────────────── */}
        {profile.role === 'trader' && profile.traderProfile && (
          <SectionCard title="🏢  Hồ sơ Thương lái" color={primaryColors.zaloBlue}>
            {isEditing ? (
              <>
                <FormField
                  label="Tên công ty"
                  value={form.traderCompany ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, traderCompany: v }))}
                />
                <FormField
                  label="Tỉnh / Vùng hoạt động"
                  value={form.traderRegion ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, traderRegion: v }))}
                />
                <FormField
                  label="Năng lực thu mua"
                  value={form.traderCapacity ?? ''}
                  onChange={(v) => setForm((p) => ({ ...p, traderCapacity: v }))}
                />
                <ReadOnlyRow
                  label="Điểm tin cậy"
                  value={`${profile.traderProfile.trustScore} / 5`}
                  note="(tự động tính bởi hệ thống)"
                />
              </>
            ) : (
              <>
                <InfoRow label="Tên công ty"      value={profile.traderProfile.companyName} />
                <InfoRow label="Tỉnh / Vùng"      value={profile.traderProfile.region} />
                <InfoRow label="Năng lực thu mua" value={profile.traderProfile.capacity} />
                <TrustScoreRow score={profile.traderProfile.trustScore} />
              </>
            )}
          </SectionCard>
        )}

        {/* ── buyerProfile ────────────────────────────────────────────── */}
        {profile.role === 'buyer' && (
          <SectionCard title="🛒  Hồ sơ Người mua" color="#8B5CF6">
            {isEditing ? (
              <FormField
                label="Tên tổ chức / Doanh nghiệp"
                value={form.buyerOrg ?? ''}
                onChange={(v) => setForm((p) => ({ ...p, buyerOrg: v }))}
              />
            ) : (
              <InfoRow
                label="Tổ chức"
                value={profile.buyerProfile?.organizationName ?? '—'}
                isLast
              />
            )}
          </SectionCard>
        )}

        {/* ── System info (non-editable) ──────────────────────────────── */}
        <SectionCard title="Thông tin tài khoản" color="#6B7280">
          <InfoRow label="User ID"   value={profile.userId} mono />
          <InfoRow label="Vai trò"   value={meta.label} highlight={meta.color} isLast />
        </SectionCard>

      </Box>
    </RoleAppShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProfileHero({
  profile,
  meta,
}: {
  profile: UserProfileDto;
  meta: { label: string; emoji: string; color: string; bg: string };
}) {
  return (
    <Box
      style={{
        background: `linear-gradient(160deg, ${meta.color}CC 0%, ${meta.color} 100%)`,
        padding: '32px 20px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Avatar */}
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid rgba(255,255,255,0.7)',
          }}
        />
      ) : (
        <Box
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            border: '3px solid rgba(255,255,255,0.5)',
          }}
        >
          {meta.emoji}
        </Box>
      )}

      {/* Name */}
      <Text style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center' }}>
        {profile.displayName}
      </Text>

      {/* Role badge */}
      <Box
        style={{
          background: 'rgba(255,255,255,0.22)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 99,
          padding: '4px 14px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
          {meta.emoji} {meta.label}
        </Text>
      </Box>
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <Box>
      {/* Hero skeleton */}
      <Box
        style={{
          background: '#E5E7EB',
          height: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Box style={{ width: 80, height: 80, borderRadius: '50%', background: '#D1D5DB' }} />
        <Box style={{ width: 140, height: 20, borderRadius: 8, background: '#D1D5DB' }} />
        <Box style={{ width: 80, height: 16, borderRadius: 8, background: '#D1D5DB' }} />
      </Box>

      {/* Content skeleton */}
      <Box style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Spinner />
        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Đang tải hồ sơ…</Text>
        {[1, 2, 3].map((i) => (
          <Box
            key={i}
            style={{
              width: '100%',
              background: '#fff',
              borderRadius: 12,
              padding: '16px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            }}
          >
            <Box style={{ width: '60%', height: 14, borderRadius: 6, background: '#F3F4F6', marginBottom: 12 }} />
            {[1, 2].map((j) => (
              <Box key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Box style={{ width: '35%', height: 12, borderRadius: 4, background: '#F3F4F6' }} />
                <Box style={{ width: '45%', height: 12, borderRadius: 4, background: '#F3F4F6' }} />
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 12,
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 48 }}>🔒</Text>
      <Text style={{ fontSize: 18, fontWeight: 700, color: '#111827', textAlign: 'center' }}>
        Chưa đăng nhập
      </Text>
      <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>
        Vui lòng đăng nhập bằng tài khoản Zalo để xem hồ sơ của bạn.
      </Text>
    </Box>
  );
}

function SectionCard({
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
          padding: '10px 16px',
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: 700, color }}>{title}</Text>
      </Box>
      <Box style={{ padding: '10px 16px' }}>{children}</Box>
    </Box>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  highlight,
  isLast = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: string;
  isLast?: boolean;
}) {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: isLast ? 0 : 8,
        marginBottom: isLast ? 0 : 8,
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          color: '#9CA3AF',
          flexShrink: 0,
          marginRight: 12,
          paddingTop: 1,
          fontFamily: 'monospace',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 13,
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

function TrustScoreRow({ score }: { score: number }) {
  const stars = Math.round(score);
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>
        Điểm tin cậy
      </Text>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: 700, color: primaryColors.zaloBlue }}>
          {score.toFixed(1)}
        </Text>
        <Box style={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Text
              key={s}
              style={{
                fontSize: 12,
                color: s <= stars ? '#FACC15' : '#E5E7EB',
              }}
            >
              ★
            </Text>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function ReadOnlyRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 10px',
        background: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <Box>
        <Text style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>{label}</Text>
        {note && <Text style={{ fontSize: 10, color: '#D1D5DB' }}>{note}</Text>}
      </Box>
      <Text style={{ fontSize: 13, fontWeight: 600, color: primaryColors.zaloBlue }}>{value}</Text>
    </Box>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];
}) {
  return (
    <Box style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
          display: 'block',
        }}
      >
        {label}
      </Text>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1.5px solid #E5E7EB',
          borderRadius: 10,
          fontSize: 14,
          color: '#111827',
          background: '#FAFAFA',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = primaryColors.zaloBlue;
          e.target.style.background = '#fff';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#E5E7EB';
          e.target.style.background = '#FAFAFA';
        }}
      />
    </Box>
  );
}

function ActionButton({
  label,
  onClick,
  variant,
  color,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'outline' | 'ghost';
  color?: string;
  disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    padding: '9px 18px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'opacity 0.15s',
    opacity: disabled ? 0.5 : 1,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: color ?? primaryColors.zaloBlue,
      color: '#fff',
    },
    outline: {
      background: 'transparent',
      color: color ?? primaryColors.zaloBlue,
      border: `1.5px solid ${color ?? primaryColors.zaloBlue}`,
    },
    ghost: {
      background: '#F3F4F6',
      color: '#6B7280',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant] }}
    >
      {label}
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
