/**
 * Ánh xạ notification.linkTo (path nội bộ từ BE) → route ZMP Mini App.
 * BE ví dụ: /farms/:id/monitoring, /contracts/:id, /connections/:id
 */

export type AppUserRole = 'farmer' | 'trader' | 'buyer' | 'guest';

/**
 * Trả về path router (/buyer/orders, …) hoặc null nếu không map được.
 */
export function notificationLinkToAppPath(
  linkTo: string | undefined,
  role: AppUserRole,
): string | null {
  if (!linkTo?.trim()) return null;

  const [pathOnly] = linkTo.trim().split('?');
  const path = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;

  if (path.includes('/farms/') && path.includes('/monitoring')) {
    if (role === 'buyer') return '/buyer/monitor';
    return '/farmer/alerts';
  }

  if (path.startsWith('/contracts/')) {
    if (role === 'buyer') return '/buyer/orders';
    if (role === 'farmer') return '/farmer/contracts';
    if (role === 'trader') return '/trader/trading';
    return '/buyer/orders';
  }

  if (path.startsWith('/connections/')) {
    if (role === 'farmer') return '/farmer/connections';
    if (role === 'trader') return '/trader/connections';
    return '/buyer';
  }

  return null;
}
