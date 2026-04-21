import React, { lazy, Suspense } from 'react';
import { Route, AnimationRoutes } from 'zmp-ui';
import { Box, Spinner } from 'zmp-ui';

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

        {/* ── Guest (public, no auth required) ──────────────── */}
        <Route path="/guest"                   element={<GuestHomeMarketNewsScreen />} />
        <Route path="/guest/products/:productId" element={<GuestProductDetailScreen />} />
        <Route path="/guest/trace/:code"       element={<GuestTraceabilityScanResultScreen />} />

        {/* ── Buyer ─────────────────────────────────────────── */}
        <Route path="/buyer"                   element={<BuyerMarketplaceScreen />} />
        <Route path="/buyer/products/:productId" element={<BuyerProductDetailScreen />} />
        <Route path="/buyer/orders"            element={<BuyerOrdersProposalsScreen />} />
        <Route path="/buyer/request"           element={<BuyerPostBuyingRequestScreen />} />
        <Route path="/buyer/monitor"           element={<BuyerDigitalTwinMonitorScreen />} />
        <Route path="/buyer/me"                element={<BuyerProfileNotificationScreen />} />

        {/* ── Farmer ────────────────────────────────────────── */}
        <Route path="/farmer"                  element={<FarmerDashboardScreen />} />
        <Route path="/farmer/farm"             element={<FarmerFarmProfileScreen />} />
        <Route path="/farmer/process"          element={<FarmerProcessScreen />} />
        <Route path="/farmer/connect"          element={<FarmerMarketConnectScreen />} />
        <Route path="/farmer/contracts"        element={<FarmerContractsScreen />} />
        <Route path="/farmer/connections"      element={<ConnectionRequestsScreen role="farmer" />} />
        <Route path="/farmer/alerts"           element={<FarmerAlertListScreen />} />
        <Route path="/farmer/me"               element={<ProfileScreen />} />

        {/* ── Trader ────────────────────────────────────────── */}
        <Route path="/trader"                  element={<TraderDashboardScreen />} />
        <Route path="/trader/supply"           element={<TraderSupplyMonitorScreen />} />
        <Route path="/trader/trading"          element={<TraderTradingOrdersScreen />} />
        <Route path="/trader/standards"        element={<TraderStandardLibraryScreen />} />
        <Route path="/trader/news"             element={<TraderProfileNewsScreen />} />
        <Route path="/trader/connections"      element={<ConnectionRequestsScreen role="trader" />} />
        <Route path="/trader/me"               element={<ProfileScreen />} />

        {/* ── Dev / QA launcher (non-production) ────────────── */}
        <Route path="/dev/screens"             element={<DevScreenLauncher />} />
      </AnimationRoutes>
    </Suspense>
  );
}
