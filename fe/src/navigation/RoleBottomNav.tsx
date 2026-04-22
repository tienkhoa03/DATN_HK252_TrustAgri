import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'zmp-ui';

import { BottomNavigation, type NavigationItem } from '@/design-system/layouts';
import { Icon } from '@/design-system/components/Icon';
import { colors } from '@/design-system/tokens/colors';
import type { UserRole } from '@/state/authAtoms';
import { ROLE_BOTTOM_NAV, resolveActiveNavId } from '@/navigation/roleNavModel';

export interface RoleBottomNavProps {
  role: UserRole;
}

/**
 * Thanh điều hướng dưới cùng — cấu hình cố định theo role, highlight theo URL.
 */
export function RoleBottomNav({ role }: RoleBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const activeId = resolveActiveNavId(pathname, role);
  const tabs = ROLE_BOTTOM_NAV[role];

  const items: NavigationItem[] = useMemo(
    () =>
      tabs.map((t) => ({
        id: t.id,
        label: t.label,
        onClick: () => navigate(t.path, { replace: true }),
        ariaLabel: t.label,
        icon: <Icon name={t.icon} size="md" color={colors.text.secondary} />,
        activeIcon: <Icon name={t.icon} size="md" color={colors.primary.zaloBlue} />,
      })),
    [navigate, role, tabs],
  );

  if (!items.length) return null;

  return <BottomNavigation items={items} activeId={activeId} />;
}
