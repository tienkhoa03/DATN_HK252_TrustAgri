/**
 * FarmerProfileScreen — Hồ sơ tab for farmer (FR-F01, FR-G01, NFR-U01)
 *
 * Sections:
 * 1. User info (read-only) from authSessionAtom + useProfile
 * 2. FarmLabSection — CRUD farms
 * 3. SeasonHistorySection — grouped care log history
 */

import React, { useEffect } from 'react';
import { Page, Text } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { useProfile } from '@/hooks/useProfile';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { ConnectionStatusBanner } from '@/components/ConnectionStatusBanner';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { SeasonHistorySection } from './SeasonHistorySection';
import { useFarms } from '@/hooks/useFarms';

export const FarmerProfileScreen: React.FC = () => {
  const session = useAtomValue(authSessionAtom);
  const openSnackbar = useStableOpenSnackbar();
  const { profile, isLoading, error } = useProfile();
  const { farms, loadFarms } = useFarms();

  useEffect(() => {
    if (session?.userId) loadFarms({ ownerId: session.userId, limit: 5 });
  }, [session?.userId, loadFarms]);

  const firstFarmId = farms[0]?.id ?? null;

  useEffect(() => {
    if (error) openSnackbar({ type: 'error', text: error, duration: 3500, icon: true });
  }, [error, openSnackbar]);

  const displayName = profile?.displayName ?? session?.userId ?? 'Nông dân';
  const phone = profile?.phone ?? '—';
  const zaloId = profile?.zaloId ?? '—';
  const lastLogin = profile?.lastLogin
    ? new Date(profile.lastLogin).toLocaleString('vi-VN')
    : '—';
  const avatarUrl = profile?.avatarUrl;

  return (
    <Page className="farmer-profile-screen">
      <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.45}}.skeleton-pulse{animation:skeleton-pulse 1.4s ease-in-out infinite}`}</style>
      <ConnectionStatusBanner />
      <div style={{ paddingBottom: '100px' }}>
        {/* Section 1: User info */}
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: colors.primary.agriGreen,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.text.inverse, fontSize: fontSize.h2, fontWeight: fontWeight.bold,
              flexShrink: 0, overflow: 'hidden',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{displayName.charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              {isLoading
                ? <div style={{ width: 120, height: 18, backgroundColor: colors.background.secondary, borderRadius: 4 }} className="skeleton-pulse" />
                : <Text.Title size="small" style={{ margin: 0 }}>{displayName}</Text.Title>}
              <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Nông dân</Text>
            </div>
          </div>

          {/* Info rows */}
          {[
            { label: 'Số điện thoại', value: phone },
            { label: 'Zalo ID', value: zaloId },
            { label: 'Đăng nhập lần cuối', value: lastLogin },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: `${spacing.xs} 0`,
              borderBottom: `1px solid ${colors.background.secondary}`,
            }}>
              <span style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>{label}</span>
              <span style={{ fontSize: fontSize.caption, color: colors.text.primary, fontWeight: fontWeight.medium }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 8, backgroundColor: colors.background.secondary, margin: `${spacing.md} 0` }} />

        {/* Section 2: Season history */}
        <SeasonHistorySection farmId={firstFarmId} />
      </div>
    </Page>
  );
};

export default FarmerProfileScreen;
