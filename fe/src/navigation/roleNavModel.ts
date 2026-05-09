import type { UserRole } from '@/state/authAtoms';
import type { IconName } from '@/design-system/components/Icon';

export type RoleNavItem = {
  id: string;
  label: string;
  path: string;
  icon: IconName;
};

const FARMER_TABS: RoleNavItem[] = [
  { id: 'home', label: 'Tổng quan', path: '/farmer', icon: 'home' },
  { id: 'farm', label: 'Vườn', path: '/farmer/farm', icon: 'farm' },
  { id: 'process', label: 'Quy trình', path: '/farmer/process', icon: 'plant' },
  { id: 'market', label: 'Kết nối', path: '/farmer/connect', icon: 'users' },
  { id: 'me', label: 'Của tôi', path: '/farmer/me', icon: 'user' },
];

const BUYER_TABS: RoleNavItem[] = [
  { id: 'shop', label: 'Chợ', path: '/buyer', icon: 'shopping-cart' },
  { id: 'orders', label: 'Đơn hàng', path: '/buyer/orders', icon: 'package' },
  { id: 'request', label: 'Nhu cầu', path: '/buyer/request', icon: 'plus-circle' },
  { id: 'me', label: 'Tôi', path: '/buyer/me', icon: 'user' },
];

const TRADER_TABS: RoleNavItem[] = [
  { id: 'home', label: 'Tổng quan', path: '/trader', icon: 'home' },
  { id: 'supply', label: 'Nguồn cung', path: '/trader/supply', icon: 'package' },
  { id: 'trading', label: 'Sàn & kết nối', path: '/trader/trading', icon: 'trending-up' },
  { id: 'library', label: 'Thư viện', path: '/trader/library', icon: 'book' },
  { id: 'me', label: 'Tôi', path: '/trader/me', icon: 'user' },
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
    if (pathname === '/farmer/me' || pathname.startsWith('/farmer/me/')) return 'me';
    if (pathname.startsWith('/farmer/farm')) return 'farm';
    if (pathname.startsWith('/farmer/process')) return 'process';
    if (
      pathname.startsWith('/farmer/connect') ||
      pathname.startsWith('/farmer/connections') ||
      pathname.startsWith('/farmer/contracts')
    ) {
      return 'market';
    }
    if (pathname === '/farmer' || pathname.startsWith('/farmer/alerts')) return 'home';
    return 'home';
  }

  if (role === 'buyer') {
    if (pathname === '/buyer/me' || pathname.startsWith('/buyer/me/')) return 'me';
    if (pathname.startsWith('/buyer/request')) return 'request';
    if (
      pathname.startsWith('/buyer/orders') ||
      pathname.startsWith('/buyer/monitor') ||
      pathname.startsWith('/buyer/history')
    ) {
      return 'orders';
    }
    if (pathname === '/buyer' || pathname.startsWith('/buyer/products')) return 'shop';
    return 'shop';
  }

  if (role === 'trader') {
    if (pathname === '/trader/me' || pathname.startsWith('/trader/me/')) return 'me';
    if (pathname.startsWith('/trader/supply')) return 'supply';
    if (pathname.startsWith('/trader/trading') || pathname.startsWith('/trader/connections')) {
      return 'trading';
    }
    if (
      pathname.startsWith('/trader/library') ||
      pathname.startsWith('/trader/standards') ||
      pathname.startsWith('/trader/news')
    ) {
      return 'library';
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
