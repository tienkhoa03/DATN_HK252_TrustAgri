import React from 'react';
import { Page } from 'zmp-ui';

import { colors } from '@/design-system/tokens/colors';
import { RoleBottomNav } from '@/navigation/RoleBottomNav';
import type { UserRole } from '@/state/authAtoms';

const FOOTER_PX = 64;

export interface RoleAppShellProps {
  role: UserRole;
  className?: string;
  pageStyle?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Vỏ màn hình: nội dung + thanh dưới thống nhất theo role.
 */
export function RoleAppShell({ role, className, pageStyle, children }: RoleAppShellProps) {
  return (
    <>
      <Page
        className={className}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.background.primary,
          position: 'relative',
          ...pageStyle,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            boxSizing: 'border-box',
            paddingBottom: `calc(${FOOTER_PX}px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          {children}
        </div>
      </Page>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            backgroundColor: colors.background.primary,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <RoleBottomNav role={role} />
        </div>
      </div>
    </>
  );
}
