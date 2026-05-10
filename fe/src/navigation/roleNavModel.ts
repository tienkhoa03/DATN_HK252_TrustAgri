import type { UserRole } from '@/state/authAtoms';
import type { IconName } from '@/design-system/components/Icon';

export type RoleNavItem = {
  id: string;
  label: string;
  path: string;
  icon: IconName;
};

const FARMER_TABS: RoleNavItem[] = [
  { id: 'home',    label: 'Tổng quan',   path: '/farmer',        icon: 'home' },
  { id: 'garden',  label: 'Vườn trồng',  path: '/farmer/garden', icon: 'farm' },
  { id: 'trade',   label: 'Giao thương', path: '/farmer/trade',  icon: 'shopping-cart' },
  { id: 'profile', label: 'Hồ sơ',       path: '/farmer/me',     icon: 'user' },
];

const BUYER_TABS: RoleNavItem[] = [
  { id: 'discover',  label: 'Khám phá',   path: '/buyer',          icon: 'shopping-cart' },
  { id: 'sourcing',  label: 'Nguồn hàng', path: '/buyer/sourcing', icon: 'plus-circle' },
  { id: 'orders',    label: 'Đơn hàng',   path: '/buyer/orders',   icon: 'package' },
  { id: 'live',      label: 'Trực tiếp',  path: '/buyer/live',     icon: 'eye' },
];

const TRADER_TABS: RoleNavItem[] = [
  { id: 'home',         label: 'Tổng quan',  path: '/trader',              icon: 'home' },
  { id: 'market',       label: 'Thị trường', path: '/trader/market',       icon: 'shopping-cart' },
  { id: 'transactions', label: 'Giao dịch',  path: '/trader/transactions', icon: 'package' },
  { id: 'monitor',      label: 'Vùng trồng', path: '/trader/monitor',      icon: 'farm' },
  { id: 'me',           label: 'Hồ sơ',      path: '/trader/me',           icon: 'user' },
];

const GUEST_TABS: RoleNavItem[] = [
  { id: 'home', label: 'Trang chủ', path: '/guest', icon: 'home' },
  { id: 'trace', label: 'Truy xuất', path: '/guest/trace/demo', icon: 'qr-code' },
];

export const ROLE_BOTTOM_NAV: Record<UserRole, RoleNavItem[]> = {
  farmer: FARMER_TABS,
  buyer: BUYER_TABS,
  trader: TRADER_TABS,
  guest: GUEST_TABS,
};

/**
 * Gắn pathname hiện tại với tab highlight trong bottom bar (cùng role).
 */
export function resolveActiveNavId(pathname: string, role: UserRole): string {
  const tabs = ROLE_BOTTOM_NAV[role];
  if (!tabs.length) return '';

  if (role === 'farmer') {
    if (pathname === '/farmer/me' || pathname.startsWith('/farmer/me/')) return 'profile';
    // Legacy: /farmer/farm* → profile tab
    if (pathname.startsWith('/farmer/farm')) return 'profile';
    if (pathname === '/farmer/garden' || pathname.startsWith('/farmer/garden/')) return 'garden';
    // Legacy: /farmer/process* → garden tab
    if (pathname.startsWith('/farmer/process')) return 'garden';
    if (pathname === '/farmer/trade' || pathname.startsWith('/farmer/trade/')) return 'trade';
    // Legacy: /farmer/connect* | /farmer/contracts* → trade tab
    if (
      pathname.startsWith('/farmer/connect') ||
      pathname.startsWith('/farmer/connections') ||
      pathname.startsWith('/farmer/contracts')
    ) {
      return 'trade';
    }
    if (pathname === '/farmer' || pathname.startsWith('/farmer/alerts')) return 'home';
    return 'home';
  }

  if (role === 'buyer') {
    if (pathname.startsWith('/buyer/sourcing') || pathname.startsWith('/buyer/request')) return 'sourcing';
    if (
      pathname.startsWith('/buyer/orders') ||
      pathname.startsWith('/buyer/history')
    ) {
      return 'orders';
    }
    if (pathname.startsWith('/buyer/live') || pathname.startsWith('/buyer/monitor')) return 'live';
    if (pathname === '/buyer' || pathname.startsWith('/buyer/products')) return 'discover';
    // /buyer/me → no tab highlight (accessed via header avatar)
    return 'discover';
  }

  if (role === 'trader') {
    if (pathname === '/trader/me' || pathname.startsWith('/trader/me/')) return 'me';
    if (
      pathname.startsWith('/trader/market') ||
      pathname.startsWith('/trader/news') ||
      pathname.startsWith('/trader/library')
    ) {
      return 'market';
    }
    if (
      pathname.startsWith('/trader/transactions') ||
      pathname.startsWith('/trader/connections') ||
      pathname.startsWith('/trader/trading')
    ) {
      return 'transactions';
    }
    if (
      pathname.startsWith('/trader/monitor') ||
      pathname.startsWith('/trader/supply') ||
      pathname.startsWith('/trader/standards')
    ) {
      return 'monitor';
    }
    if (pathname === '/trader' || pathname.startsWith('/trader/')) return 'home';
    return 'home';
  }

  if (role === 'guest') {
    if (pathname.startsWith('/guest/trace')) return 'trace';
    if (pathname === '/guest' || pathname.startsWith('/guest/products')) return 'home';
    return 'home';
  }

  return tabs[0].id;
}
