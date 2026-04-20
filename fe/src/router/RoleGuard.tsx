import React from 'react';
import { useAtomValue } from 'jotai';
import { Box, Text } from 'zmp-ui';
import { currentRoleAtom, type UserRole } from '@/state/authAtoms';

interface RoleGuardProps {
  /** Roles that are allowed to access the child content. */
  allowedRoles: UserRole[];
  /** Content to render when the role is authorized. */
  children: React.ReactNode;
  /** Optional custom fallback. Defaults to a permission denied message. */
  fallback?: React.ReactNode;
}

/**
 * Renders children only when the current user role is in allowedRoles.
 * Shows a permission-denied UI otherwise.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['farmer']}>
 *     <FarmerOnlyFeature />
 *   </RoleGuard>
 */
export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const role = useAtomValue(currentRoleAtom);

  if (!allowedRoles.includes(role)) {
    return (
      <>
        {fallback ?? (
          <Box className="flex flex-col items-center justify-center p-8" style={{ minHeight: 200 }}>
            <Text className="text-2xl mb-2">🔒</Text>
            <Text.Title size="small" className="mb-1">Không có quyền truy cập</Text.Title>
            <Text size="small" className="text-gray-500 text-center">
              Tính năng này chỉ dành cho vai trò: {allowedRoles.join(', ')}.
            </Text>
          </Box>
        )}
      </>
    );
  }

  return <>{children}</>;
}
