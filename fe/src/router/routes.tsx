import React, { lazy, Suspense } from 'react';
import { Route, AnimationRoutes } from 'zmp-ui';
import { Box, Spinner } from 'zmp-ui';
import { Outlet } from 'react-router-dom';

import { RequireRole } from '@/router/RequireRole';
import type { UserRole } from '@/state/authAtoms';
import { ChunkErrorBoundary } from '@/components/ErrorBoundary/ChunkErrorBoundary';
import { RoleAppShell } from '@/navigation/RoleAppShell';

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

const FarmerDashboardScreen = lazy(() =>
  import('@/screens/farmer/dashboard').then((m) => ({ default: m.FarmerDashboardScreen })),
);
const FarmerFarmProfileScreen = lazy(() =>
  import('@/screens/farmer/farm-profile').then((m) => ({ default: m.FarmerFarmProfileScreen })),
);
const FarmerProcessScreen = lazy(() =>
  import('@/screens/farmer/process').then((m) => ({ default: m.FarmerProcessScreen })),
);
const FarmerMarketConnectScreen = lazy(() =>
  import('@/screens/farmer/market-connect').then((m) => ({ default: m.FarmerMarketConnectScreen })),
);
const FarmerContractsScreen = lazy(() =>
  import('@/screens/farmer/contracts').then((m) => ({ default: m.FarmerContractsScreen })),
);
const FarmerAlertListScreen = lazy(() =>
  import('@/screens/farmer/alerts').then((m) => ({ default: m.FarmerAlertListScreen })),
);

const TraderDashboardScreen = lazy(() =>
  import('@/screens/trader/dashboard').then((m) => ({ default: m.TraderDashboardScreen })),
);
const TraderSupplyMonitorScreen = lazy(() =>
  import('@/screens/trader/supply-monitor').then((m) => ({ default: m.TraderSupplyMonitorScreen })),
);
const TraderTradingOrdersScreen = lazy(() =>
  import('@/screens/trader/trading-orders').then((m) => ({ default: m.TraderTradingOrdersScreen })),
);
const TraderStandardLibraryScreen = lazy(() =>
  import('@/screens/trader/standard-library').then((m) => ({ default: m.TraderStandardLibraryScreen })),
);
const TraderProfileNewsScreen = lazy(() =>
  import('@/screens/trader/profile-news').then((m) => ({ default: m.TraderProfileNewsScreen })),
);

const ProfileScreen = lazy(() =>
  import('@/screens/shared/profile').then((m) => ({ default: m.ProfileScreen })),
);

const ConnectionRequestsScreen = lazy(() =>
  import('@/screens/shared/connections').then((m) => ({ default: m.ConnectionRequestsScreen })),
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
        {/* ── App init / mock status screen ─────────────────── */}
        <Route path="/"                        element={<AppInitScreen />} />

        {/* ── Auth ──────────────────────────────────────────── */}
        <Route path="/login"                   element={<LoginScreen />} />

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
          <Route path="orders" element={<BuyerOrdersProposalsScreen />} />
          <Route path="request" element={<BuyerPostBuyingRequestScreen />} />
          <Route path="monitor" element={<BuyerDigitalTwinMonitorScreen />} />
          <Route path="me" element={<BuyerProfileNotificationScreen />} />
          <Route path="history" element={<BuyerTransactionHistoryScreen />} />
        </Route>

        {/* ── Farmer ────────────────────────────────────────── */}
        <Route path="/farmer" element={<RoleLayout role="farmer" />}>
          <Route index element={<FarmerDashboardScreen />} />
          <Route path="farm" element={<FarmerFarmProfileScreen />} />
          <Route path="process" element={<FarmerProcessScreen />} />
          <Route path="connect" element={<FarmerMarketConnectScreen />} />
          <Route path="contracts" element={<FarmerContractsScreen />} />
          <Route path="connections" element={<ConnectionRequestsScreen role="farmer" />} />
          <Route path="alerts" element={<FarmerAlertListScreen />} />
          <Route path="me" element={<ProfileScreen />} />
        </Route>

        {/* ── Trader ────────────────────────────────────────── */}
        <Route path="/trader" element={<RoleLayout role="trader" />}>
          <Route index element={<TraderDashboardScreen />} />
          <Route path="supply" element={<TraderSupplyMonitorScreen />} />
          <Route path="trading" element={<TraderTradingOrdersScreen />} />
          <Route path="standards" element={<TraderStandardLibraryScreen />} />
          <Route path="news" element={<TraderProfileNewsScreen />} />
          <Route path="connections" element={<ConnectionRequestsScreen role="trader" />} />
          <Route path="me" element={<ProfileScreen />} />
        </Route>

        {/* ── Dev / QA launcher (non-production) ────────────── */}
        <Route path="/dev/screens"             element={<DevScreenLauncher />} />
        </AnimationRoutes>
      </Suspense>
    </ChunkErrorBoundary>
  );
}
