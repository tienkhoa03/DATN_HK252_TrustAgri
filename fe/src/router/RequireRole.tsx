import React, { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { Box, Spinner, useNavigate } from 'zmp-ui';

import { currentRoleAtom, type UserRole } from '@/state/authAtoms';
import { ROLE_HOME_PATH } from '@/router/roleHome';

interface RequireRoleProps {
  allowedRoles: readonly UserRole[];
  children: React.ReactNode;
}

/**
 * Chỉ render children khi `currentRole` nằm trong `allowedRoles`.
 * Nếu không — chuyển về trang chủ đúng vai trò (replace) để tránh xem URL role khác.
 */
export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const role = useAtomValue(currentRoleAtom);
  const navigate = useNavigate();
  const allowed = allowedRoles.includes(role);

  useEffect(() => {
    if (!allowed) {
      const target = ROLE_HOME_PATH[role] ?? '/guest';
      navigate(target, { replace: true });
    }
  }, [allowed, role, navigate]);

  if (!allowed) {
    return (
      <Box className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <Spinner />
      </Box>
    );
  }

  return <>{children}</>;
}
