import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { Route, AnimationRoutes, useNavigate } from 'zmp-ui';
import { Box, Spinner } from 'zmp-ui';
import { Outlet } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';

import { RequireRole } from '@/router/RequireRole';
import type { UserRole } from '@/state/authAtoms';
import { authSessionAtom, currentRoleAtom } from '@/state/authAtoms';
import { ChunkErrorBoundary } from '@/components/ErrorBoundary/ChunkErrorBoundary';
import { RedirectTo } from '@/components/RedirectTo';
import { RoleAppShell } from '@/navigation/RoleAppShell';
import { ROLE_HOME_PATH } from '@/router/roleHome';
import {
  bootstrapAuthSession,
  isPasswordMode,
  RequirePasswordLoginError,
} from '@/services/authStrategy';

function RoleRoute({ role, children }: { role: UserRole; children: React.ReactNode }) {
  return <RequireRole allowedRoles={[role]}>{children}</RequireRole>;
}

function RoleLayout({ role }: { role: UserRole }) {
  return (
    <RoleRoute role={role}>
      <RoleAppShell role={role}>
        <Outlet />
      </RoleAppShell>
    </RoleRoute>
  );
}

// ─── Lazy screen imports ──────────────────────────────────────────────────────

const GuestHomeMarketNewsScreen = lazy(() =>
  import('@/screens/guest/home-market-news').then((m) => ({ default: m.GuestHomeMarketNewsScreen })),
);
const GuestProductDetailScreen = lazy(() =>
  import('@/screens/guest/product-detail').then((m) => ({ default: m.GuestProductDetailScreen })),
);
const GuestTraceabilityScanResultScreen = lazy(() =>
  import('@/screens/guest/traceability-scan').then((m) => ({ default: m.GuestTraceabilityScanResultScreen })),
);

const BuyerMarketplaceScreen = lazy(() =>
  import('@/screens/buyer/marketplace').then((m) => ({ default: m.BuyerMarketplaceScreen })),
);
const BuyerProductDetailScreen = lazy(() =>
  import('@/screens/buyer/product-detail').then((m) => ({ default: m.BuyerProductDetailScreen })),
);
const BuyerOrdersProposalsScreen = lazy(() =>
  import('@/screens/buyer/orders-proposals').then((m) => ({ default: m.BuyerOrdersProposalsScreen })),
);
const BuyerPostBuyingRequestScreen = lazy(() =>
  import('@/screens/buyer/post-buying-request').then((m) => ({ default: m.BuyerPostBuyingRequestScreen })),
);
const BuyerDigitalTwinMonitorScreen = lazy(() =>
  import('@/screens/buyer/digital-twin-monitor').then((m) => ({ default: m.BuyerDigitalTwinMonitorScreen })),
);
const BuyerProfileNotificationScreen = lazy(() =>
  import('@/screens/buyer/profile-notification').then((m) => ({ default: m.BuyerProfileNotificationScreen })),
);
const BuyerTransactionHistoryScreen = lazy(() =>
  import('@/screens/buyer/transaction-history').then((m) => ({ default: m.BuyerTransactionHistoryScreen })),
);
const BuyerSourcingScreen = lazy(() =>
  import('@/screens/buyer/sourcing').then((m) => ({ default: m.BuyerSourcingScreen })),
);
const BuyerLiveMonitorScreen = lazy(() =>
  import('@/screens/buyer/live-monitor').then((m) => ({ default: m.BuyerLiveMonitorScreen })),
);
const BuyerLiveMonitorDetailScreen = lazy(() =>
  import('@/screens/buyer/live-monitor').then((m) => ({ default: m.BuyerLiveMonitorDetailScreen })),
);
const BuyerOrdersScreen = lazy(() =>
  import('@/screens/buyer/orders-proposals').then((m) => ({ default: m.BuyerOrdersScreen })),
);

const FarmerDashboardScreen = lazy(() =>
  import('@/screens/farmer/dashboard').then((m) => ({ default: m.FarmerDashboardScreen })),
);
const FarmerGardenListScreen = lazy(() =>
  import('@/screens/farmer/garden').then((m) => ({ default: m.FarmerGardenListScreen })),
);
const FarmerGardenMonitorScreen = lazy(() =>
  import('@/screens/farmer/garden').then((m) => ({ default: m.FarmerGardenMonitorScreen })),
);
const FarmerTradeScreen = lazy(() =>
  import('@/screens/farmer/trade').then((m) => ({ default: m.FarmerTradeScreen })),
);
const FarmerProfileScreen = lazy(() =>
  import('@/screens/farmer/profile').then((m) => ({ default: m.FarmerProfileScreen })),
);
const FarmerAlertListScreen = lazy(() =>
  import('@/screens/farmer/alerts').then((m) => ({ default: m.FarmerAlertListScreen })),
);

const TraderDashboardScreen = lazy(() =>
  import('@/screens/trader/dashboard').then((m) => ({ default: m.TraderDashboardScreen })),
);
const TraderMarketplaceScreen = lazy(() =>
  import('@/screens/trader/marketplace').then((m) => ({ default: m.TraderMarketplaceScreen })),
);
const TraderTransactionsScreen = lazy(() =>
  import('@/screens/trader/transactions').then((m) => ({ default: m.TraderTransactionsScreen })),
);
const TraderFarmMonitoringScreen = lazy(() =>
  import('@/screens/trader/farm-monitoring').then((m) => ({ default: m.TraderFarmMonitoringScreen })),
);
const TraderSupplyMonitorScreen = lazy(() =>
  import('@/screens/trader/supply-monitor').then((m) => ({ default: m.TraderSupplyMonitorScreen })),
);
const TraderTradingOrdersScreen = lazy(() =>
  import('@/screens/trader/trading-orders').then((m) => ({ default: m.TraderTradingOrdersScreen })),
);
const TraderLibraryHubScreen = lazy(() =>
  import('@/screens/trader/library').then((m) => ({ default: m.TraderLibraryHubScreen })),
);
const TraderStandardLibraryScreen = lazy(() =>
  import('@/screens/trader/standard-library').then((m) => ({ default: m.TraderStandardLibraryScreen })),
);
const TraderProfileNewsScreen = lazy(() =>
  import('@/screens/trader/profile-news').then((m) => ({ default: m.TraderProfileNewsScreen })),
);
const TraderConnectionDetailScreen = lazy(() =>
  import('@/screens/trader/connections').then((m) => ({ default: m.TraderConnectionDetailScreen })),
);
const FarmerConnectionDetailScreen = lazy(() =>
  import('@/screens/farmer/connections').then((m) => ({ default: m.FarmerConnectionDetailScreen })),
);

const ProfileScreen = lazy(() =>
  import('@/screens/shared/profile').then((m) => ({ default: m.ProfileScreen })),
);

const ConnectionRequestsScreen = lazy(() =>
  import('@/screens/shared/connections').then((m) => ({ default: m.ConnectionRequestsScreen })),
);

const NotificationsScreen = lazy(() =>
  import('@/screens/shared/notifications').then((m) => ({ default: m.NotificationsScreen })),
);

const AppInitScreen = lazy(() =>
  import('@/pages/AppInitScreen').then((m) => ({ default: m.AppInitScreen })),
);

const LoginScreen = lazy(() =>
  import('@/pages/LoginScreen').then((m) => ({ default: m.LoginScreen })),
);

const DevScreenLauncher = lazy(() =>
  import('@/pages/index').then((m) => ({ default: m.default })),
);

// ─── Shared loading skeleton ─────────────────────────────────────────────────

const RouteLoadingFallback = () => (
  <Box className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
    <Spinner />
  </Box>
);

function RootEntry() {
  const session = useAtomValue(authSessionAtom);
  const role = useAtomValue(currentRoleAtom);
  const setSession = useSetAtom(authSessionAtom);
  const navigate = useNavigate();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // 1) Already authenticated (rehydrated from sessionStorage) → role home.
    if (session) {
      navigate(ROLE_HOME_PATH[role] ?? '/guest', { replace: true });
      return;
    }

    // 2) Password mode → redirect form đăng nhập.
    if (isPasswordMode()) {
      navigate('/login', { replace: true });
      return;
    }

    // 3) Auto-bootstrap mode (zalo-oauth | zalo-token | dev-seeded) — biểu hiện như Zalo Mini App.
    bootstrapAuthSession()
      .then((s) => {
        setSession(s);
        navigate(ROLE_HOME_PATH[s.role] ?? '/guest', { replace: true });
      })
      .catch((err) => {
        // RequirePasswordLoginError không xảy ra ở đây vì đã guard ở (2), nhưng safety fallback.
        if (err instanceof RequirePasswordLoginError) {
          navigate('/login', { replace: true });
          return;
        }
        // Lỗi mạng/Zalo SDK → vào /guest để vẫn xem được public; user có thể retry.
        // eslint-disable-next-line no-console
        console.error('[RootEntry] bootstrapAuthSession failed:', err);
        navigate('/guest', { replace: true });
      });
  }, [navigate, role, session, setSession]);

  return <RouteLoadingFallback />;
}

// ─── AppRoutes ────────────────────────────────────────────────────────────────

/**
 * Declarative route table for the entire TrustAgri Mini App.
 * All screens are lazy-loaded to keep the initial bundle small.
 *
 * Route layout follows design.md §Bảng route (MVP).
 */
export function AppRoutes() {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <AnimationRoutes>
        {/* ── Root entry: go straight to user screen by role ─── */}
        <Route path="/" element={<RootEntry />} />
        {/* ── App init / smoke-test screen (dev/debug) ───────── */}
        <Route path="/init" element={<AppInitScreen />} />

        {/* ── Auth ──────────────────────────────────────────── */}
        <Route path="/login"                   element={<LoginScreen />} />

        {/* ── Trung tâm thông báo (shared, mọi role auth) ───── */}
        <Route path="/notifications"           element={<NotificationsScreen />} />

        {/* ── Guest (chỉ role guest / chưa đăng nhập) ───────── */}
        <Route path="/guest" element={<RoleLayout role="guest" />}>
          <Route index element={<GuestHomeMarketNewsScreen />} />
          <Route path="products/:productId" element={<GuestProductDetailScreen />} />
          <Route path="trace/:code" element={<GuestTraceabilityScanResultScreen />} />
        </Route>

        {/* ── Buyer ─────────────────────────────────────────── */}
        <Route path="/buyer" element={<RoleLayout role="buyer" />}>
          <Route index element={<BuyerMarketplaceScreen />} />
          <Route path="products/:productId" element={<BuyerProductDetailScreen />} />
          <Route path="sourcing" element={<BuyerSourcingScreen />} />
          <Route path="orders" element={<BuyerOrdersScreen />} />
          <Route path="live" element={<BuyerLiveMonitorScreen />} />
          <Route path="live/:contractId" element={<BuyerLiveMonitorDetailScreen />} />
          <Route path="me" element={<BuyerProfileNotificationScreen />} />
          {/* Legacy redirects */}
          <Route path="request" element={<RedirectTo to="/buyer/sourcing?action=create" />} />
          <Route path="monitor" element={<RedirectTo to="/buyer/live" />} />
          <Route path="history" element={<RedirectTo to="/buyer/orders?status=completed" />} />
        </Route>

        {/* ── Farmer ────────────────────────────────────────── */}
        <Route path="/farmer" element={<RoleLayout role="farmer" />}>
          <Route index element={<FarmerDashboardScreen />} />
          <Route path="garden" element={<FarmerGardenListScreen />} />
          <Route path="garden/:farmId" element={<FarmerGardenMonitorScreen />} />
          <Route path="trade" element={<FarmerTradeScreen />} />
          <Route path="me" element={<FarmerProfileScreen />} />
          <Route path="connections" element={<ConnectionRequestsScreen role="farmer" />} />
          <Route path="connections/:id" element={<FarmerConnectionDetailScreen />} />
          <Route path="alerts" element={<FarmerAlertListScreen />} />
          {/* Legacy redirects */}
          <Route path="farm" element={<RedirectTo to="/farmer/garden" />} />
          <Route path="process" element={<RedirectTo to="/farmer/garden?section=timeline" />} />
          <Route path="connect" element={<RedirectTo to="/farmer/trade?tab=search" />} />
          <Route path="contracts" element={<RedirectTo to="/farmer/trade?tab=contracts" />} />
        </Route>

        {/* ── Trader ────────────────────────────────────────── */}
        <Route path="/trader" element={<RoleLayout role="trader" />}>
          <Route index element={<TraderDashboardScreen />} />
          <Route path="market" element={<TraderMarketplaceScreen />} />
          <Route path="transactions" element={<TraderTransactionsScreen />} />
          <Route path="monitor" element={<TraderFarmMonitoringScreen />} />
          <Route path="standards" element={<TraderStandardLibraryScreen />} />
          <Route path="connections" element={<ConnectionRequestsScreen role="trader" />} />
          <Route path="connections/:id" element={<TraderConnectionDetailScreen />} />
          <Route path="me" element={<ProfileScreen />} />
          {/* Legacy redirects — keep for backwards-compat */}
          <Route path="supply" element={<RedirectTo to="/trader/monitor" />} />
          <Route path="trading" element={<RedirectTo to="/trader/transactions" />} />
          <Route path="library" element={<RedirectTo to="/trader/market?tab=feed" />} />
          <Route path="news" element={<RedirectTo to="/trader/market?tab=news" />} />
        </Route>

        {/* ── Dev / QA launcher (non-production) ────────────── */}
        <Route path="/dev/screens"             element={<DevScreenLauncher />} />
        </AnimationRoutes>
      </Suspense>
    </ChunkErrorBoundary>
  );
}
