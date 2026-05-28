/**
 * RoleSelectionScreen — hiển thị sau login khi user có 2+ role (FR-S01).
 * User chọn role active → POST /auth/switch-role → navigate home role mới.
 */

import React, { useState } from 'react';
import { Page, Box, Text, Spinner, useNavigate } from 'zmp-ui';
import { useAtomValue, useSetAtom } from 'jotai';

import { availableRolesAtom, authSessionAtom } from '@/state/authAtoms';
import type { UserRole } from '@/state/authAtoms';
import * as authService from '@/services/authService';
import { ROLE_HOME_PATH } from '@/router/roleHome';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { primaryColors, functionalColors } from '@/design-system/tokens/colors';
import { ApiError } from '@/api/errors';

type KnownRole = 'farmer' | 'trader' | 'buyer' | 'guest';

const ROLE_CONFIG: Record<KnownRole, { label: string; description: string; color: string; bg: string; icon: string }> = {
  farmer: {
    label: 'Nông dân',
    description: 'Quản lý vườn, ghi nhật ký, kết nối thương lái',
    color: primaryColors.agriGreen,
    bg: '#F0FBF4',
    icon: '🌾',
  },
  trader: {
    label: 'Thương lái',
    description: 'Thu mua, giám sát chuỗi cung ứng, hợp đồng',
    color: primaryColors.zaloBlue,
    bg: '#EEF5FF',
    icon: '🏪',
  },
  buyer: {
    label: 'Người mua',
    description: 'Đặt hàng, theo dõi nguồn gốc nông sản',
    color: '#8B5CF6',
    bg: '#F5F0FF',
    icon: '🛒',
  },
  guest: {
    label: 'Khách',
    description: 'Xem thông tin thị trường, truy xuất nguồn gốc',
    color: '#6B7280',
    bg: '#F9FAFB',
    icon: '👤',
  },
};

const FALLBACK_CONFIG = { label: 'Vai trò khác', description: '', color: '#6B7280', bg: '#F9FAFB', icon: '⚙️' };

export function RoleSelectionScreen() {
  const availableRoles = useAtomValue(availableRolesAtom);
  const setSession = useSetAtom(authSessionAtom);
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const [switching, setSwitching] = useState<UserRole | null>(null);

  const handleSelectRole = async (role: UserRole) => {
    if (switching) return;
    setSwitching(role);
    try {
      const newSession = await authService.switchRole(role);
      setSession(newSession);
      const target = ROLE_HOME_PATH[role as KnownRole] ?? '/guest';
      navigate(target, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message || 'Chuyển vai trò thất bại.'
          : 'Chuyển vai trò thất bại. Vui lòng thử lại.';
      openSnackbar({ type: 'error', text: message, duration: 4000, icon: true });
    } finally {
      setSwitching(null);
    }
  };

  return (
    <Page style={{ background: functionalColors.neutralGray, minHeight: '100vh' }}>
      {/* Header */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${primaryColors.agriGreen} 0%, ${primaryColors.zaloBlue} 100%)`,
          padding: '40px 24px 32px',
          textAlign: 'center',
        }}
      >
        <Text style={{ fontSize: 42, lineHeight: 1, marginBottom: 10 }}>🎭</Text>
        <Text style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          Chọn vai trò
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>
          Tài khoản của bạn có {availableRoles.length} vai trò
        </Text>
      </Box>

      {/* Role cards */}
      <Box style={{ padding: '20px 16px 48px' }}>
        {availableRoles.map((role) => {
          const cfg = ROLE_CONFIG[role as KnownRole] ?? FALLBACK_CONFIG;
          const isLoading = switching === role;
          return (
            <button
              key={role}
              onClick={() => void handleSelectRole(role)}
              disabled={!!switching}
              style={{
                width: '100%',
                background: '#fff',
                border: `2px solid ${cfg.color}33`,
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: switching ? 'not-allowed' : 'pointer',
                opacity: switching && !isLoading ? 0.5 : 1,
                textAlign: 'left',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              }}
            >
              <Box
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: cfg.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  flexShrink: 0,
                }}
              >
                {isLoading ? <Spinner /> : cfg.icon}
              </Box>
              <Box style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 700, color: cfg.color, marginBottom: 3 }}>
                  {cfg.label}
                </Text>
                {cfg.description ? (
                  <Text style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                    {cfg.description}
                  </Text>
                ) : null}
              </Box>
              <Text style={{ fontSize: 20, color: cfg.color }}>›</Text>
            </button>
          );
        })}
      </Box>
    </Page>
  );
}

export default RoleSelectionScreen;
