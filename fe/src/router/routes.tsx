import React, { lazy, Suspense } from 'react';
import { Route, AnimationRoutes } from 'zmp-ui';
import { Box, Spinner } from 'zmp-ui';

import { RequireRole } from '@/router/RequireRole';
import type { UserRole } from '@/state/authAtoms';

function RoleRoute({ role, children }: { role: UserRole; children: React.ReactNode }) {
  return <RequireRole allowedRoles={[role]}>{children}</RequireRole>;
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
    <Suspense fallback={<RouteLoadingFallback />}>
      <AnimationRoutes>
        {/* ── App init / mock status screen ─────────────────── */}
        <Route path="/"                        element={<AppInitScreen />} />

        {/* ── Auth ──────────────────────────────────────────── */}
        <Route path="/login"                   element={<LoginScreen />} />

        {/* ── Guest (chỉ role guest / chưa đăng nhập) ───────── */}
        <Route path="/guest"                   element={<RoleRoute role="guest"><GuestHomeMarketNewsScreen /></RoleRoute>} />
        <Route path="/guest/products/:productId" element={<RoleRoute role="guest"><GuestProductDetailScreen /></RoleRoute>} />
        <Route path="/guest/trace/:code"       element={<RoleRoute role="guest"><GuestTraceabilityScanResultScreen /></RoleRoute>} />

        {/* ── Buyer ─────────────────────────────────────────── */}
        <Route path="/buyer"                   element={<RoleRoute role="buyer"><BuyerMarketplaceScreen /></RoleRoute>} />
        <Route path="/buyer/products/:productId" element={<RoleRoute role="buyer"><BuyerProductDetailScreen /></RoleRoute>} />
        <Route path="/buyer/orders"            element={<RoleRoute role="buyer"><BuyerOrdersProposalsScreen /></RoleRoute>} />
        <Route path="/buyer/request"           element={<RoleRoute role="buyer"><BuyerPostBuyingRequestScreen /></RoleRoute>} />
        <Route path="/buyer/monitor"           element={<RoleRoute role="buyer"><BuyerDigitalTwinMonitorScreen /></RoleRoute>} />
        <Route path="/buyer/me"                element={<RoleRoute role="buyer"><BuyerProfileNotificationScreen /></RoleRoute>} />
        <Route path="/buyer/history"           element={<RoleRoute role="buyer"><BuyerTransactionHistoryScreen /></RoleRoute>} />

        {/* ── Farmer ────────────────────────────────────────── */}
        <Route path="/farmer"                  element={<RoleRoute role="farmer"><FarmerDashboardScreen /></RoleRoute>} />
        <Route path="/farmer/farm"             element={<RoleRoute role="farmer"><FarmerFarmProfileScreen /></RoleRoute>} />
        <Route path="/farmer/process"          element={<RoleRoute role="farmer"><FarmerProcessScreen /></RoleRoute>} />
        <Route path="/farmer/connect"          element={<RoleRoute role="farmer"><FarmerMarketConnectScreen /></RoleRoute>} />
        <Route path="/farmer/contracts"        element={<RoleRoute role="farmer"><FarmerContractsScreen /></RoleRoute>} />
        <Route path="/farmer/connections"      element={<RoleRoute role="farmer"><ConnectionRequestsScreen role="farmer" /></RoleRoute>} />
        <Route path="/farmer/alerts"           element={<RoleRoute role="farmer"><FarmerAlertListScreen /></RoleRoute>} />
        <Route path="/farmer/me"               element={<RoleRoute role="farmer"><ProfileScreen /></RoleRoute>} />

        {/* ── Trader ────────────────────────────────────────── */}
        <Route path="/trader"                  element={<RoleRoute role="trader"><TraderDashboardScreen /></RoleRoute>} />
        <Route path="/trader/supply"           element={<RoleRoute role="trader"><TraderSupplyMonitorScreen /></RoleRoute>} />
        <Route path="/trader/trading"          element={<RoleRoute role="trader"><TraderTradingOrdersScreen /></RoleRoute>} />
        <Route path="/trader/standards"        element={<RoleRoute role="trader"><TraderStandardLibraryScreen /></RoleRoute>} />
        <Route path="/trader/news"             element={<RoleRoute role="trader"><TraderProfileNewsScreen /></RoleRoute>} />
        <Route path="/trader/connections"      element={<RoleRoute role="trader"><ConnectionRequestsScreen role="trader" /></RoleRoute>} />
        <Route path="/trader/me"               element={<RoleRoute role="trader"><ProfileScreen /></RoleRoute>} />

        {/* ── Dev / QA launcher (non-production) ────────────── */}
        <Route path="/dev/screens"             element={<DevScreenLauncher />} />
      </AnimationRoutes>
    </Suspense>
  );
}
