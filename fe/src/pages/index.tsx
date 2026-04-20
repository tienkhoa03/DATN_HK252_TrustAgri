import React, { useState, lazy, Suspense } from "react";
import { Box, Page, Text, Button, Spinner } from "zmp-ui";

// Lazy load all screen demos for better performance
const FarmerDashboardScreenDemo = lazy(() => 
  import("../screens/farmer").then(m => ({ default: m.FarmerDashboardScreenDemo }))
);
const FarmerProcessScreenDemo = lazy(() => 
  import("../screens/farmer").then(m => ({ default: m.FarmerProcessScreenDemo }))
);
const FarmerMarketConnectScreenDemo = lazy(() => 
  import("../screens/farmer").then(m => ({ default: m.FarmerMarketConnectScreenDemo }))
);
const FarmerFarmProfileScreenDemo = lazy(() => 
  import("../screens/farmer").then(m => ({ default: m.FarmerFarmProfileScreenDemo }))
);
const FarmerContractsScreenDemoSimple = lazy(() => 
  import("../screens/farmer").then(m => ({ default: m.FarmerContractsScreenDemoSimple }))
);

const TraderDashboardScreenDemo = lazy(() => 
  import("../screens/trader").then(m => ({ default: m.TraderDashboardScreenDemo }))
);
const TraderSupplyMonitorScreenDemo = lazy(() => 
  import("../screens/trader").then(m => ({ default: m.TraderSupplyMonitorScreenDemo }))
);
const TraderTradingOrdersScreenDemo = lazy(() => 
  import("../screens/trader").then(m => ({ default: m.TraderTradingOrdersScreenDemo }))
);
const TraderStandardLibraryScreenDemo = lazy(() => 
  import("../screens/trader").then(m => ({ default: m.TraderStandardLibraryScreenDemo }))
);
const TraderProfileNewsScreenDemo = lazy(() => 
  import("../screens/trader").then(m => ({ default: m.TraderProfileNewsScreenDemo }))
);

const BuyerMarketplaceScreenDemo = lazy(() => 
  import("../screens/buyer").then(m => ({ default: m.BuyerMarketplaceScreenDemo }))
);
const BuyerProductDetailScreenDemo = lazy(() => 
  import("../screens/buyer").then(m => ({ default: m.BuyerProductDetailScreenDemo }))
);
const BuyerDigitalTwinMonitorScreenDemo = lazy(() => 
  import("../screens/buyer").then(m => ({ default: m.BuyerDigitalTwinMonitorScreenDemo }))
);
const BuyerOrdersProposalsScreenDemo = lazy(() => 
  import("../screens/buyer").then(m => ({ default: m.BuyerOrdersProposalsScreenDemo }))
);
const BuyerPostBuyingRequestScreenDemo = lazy(() => 
  import("../screens/buyer").then(m => ({ default: m.BuyerPostBuyingRequestScreenDemo }))
);
const BuyerProfileNotificationScreenDemo = lazy(() => 
  import("../screens/buyer").then(m => ({ default: m.BuyerProfileNotificationScreenDemo }))
);

const GuestHomeMarketNewsScreenDemo = lazy(() => 
  import("../screens/guest").then(m => ({ default: m.GuestHomeMarketNewsScreenDemo }))
);
const GuestTraceabilityScanResultScreenDemo = lazy(() => 
  import("../screens/guest").then(m => ({ default: m.GuestTraceabilityScanResultScreenDemo }))
);
const GuestProductDetailScreenDemo = lazy(() => 
  import("../screens/guest").then(m => ({ default: m.GuestProductDetailScreenDemo }))
);

// Loading fallback component
const LoadingScreen = () => (
  <Box className="flex items-center justify-center min-h-screen">
    <Spinner />
  </Box>
);

function HomePage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  // If a demo is active, show it with Suspense wrapper
  if (activeDemo === 'farmer-dashboard') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <FarmerDashboardScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'farmer-process') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <FarmerProcessScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'farmer-market-connect') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <FarmerMarketConnectScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'farmer-contracts') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <FarmerContractsScreenDemoSimple onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'farmer-farm-profile') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <FarmerFarmProfileScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'trader-dashboard') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <TraderDashboardScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'trader-supply-monitor') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <TraderSupplyMonitorScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'trader-trading-orders') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <TraderTradingOrdersScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'trader-standard-library') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <TraderStandardLibraryScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'trader-profile-news') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <TraderProfileNewsScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'buyer-marketplace') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <BuyerMarketplaceScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'buyer-product-detail') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <BuyerProductDetailScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'buyer-digital-twin-monitor') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <BuyerDigitalTwinMonitorScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'buyer-orders-proposals') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <BuyerOrdersProposalsScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'buyer-post-buying-request') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <BuyerPostBuyingRequestScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'buyer-profile-notification') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <BuyerProfileNotificationScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'guest-home-market-news') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <GuestHomeMarketNewsScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'guest-traceability-scan') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <GuestTraceabilityScanResultScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  if (activeDemo === 'guest-product-detail') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <GuestProductDetailScreenDemo onBack={() => setActiveDemo(null)} />
      </Suspense>
    );
  }

  return (
    <Page className="flex flex-col items-center p-4 bg-gray-50" style={{ minHeight: '100vh', paddingTop: '20px' }}>
      <Box className="w-full max-w-md space-y-4">
        <Text.Title size="xLarge" className="text-center mb-6">
          🌾 Zalo Mini App - Nông nghiệp
        </Text.Title>
        
        <Text className="text-center text-gray-600 mb-4">
          Hệ thống thiết kế giao diện cho ứng dụng nông nghiệp
        </Text>

        <Box className="mt-8 p-4 bg-white rounded-lg shadow">
          <Text.Title size="small" className="mb-4">
            📱 Màn hình Demo
          </Text.Title>
          
          <div className="space-y-2">
            <Text.Title size="xSmall" className="mb-2 font-semibold">
              Nông dân (Farmer)
            </Text.Title>
            <Button
              fullWidth
              onClick={() => setActiveDemo('farmer-dashboard')}
              className="mb-2"
            >
              Trang chủ và Giám sát
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('farmer-process')}
              className="mb-2"
            >
              Quy trình và Nhật ký
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('farmer-market-connect')}
              className="mb-2"
            >
              Thị trường và Kết nối
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('farmer-contracts')}
              className="mb-2"
            >
              Quản lý Hợp đồng
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('farmer-farm-profile')}
              className="mb-2"
            >
              Hồ sơ Vườn
            </Button>
          </div>

          <div className="space-y-2 mt-6">
            <Text.Title size="xSmall" className="mb-2 font-semibold">
              Thương lái (Trader)
            </Text.Title>
            <Button
              fullWidth
              onClick={() => setActiveDemo('trader-dashboard')}
              className="mb-2"
            >
              Bảng điều khiển Quản trị
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('trader-supply-monitor')}
              className="mb-2"
            >
              Quản lý Nguồn cung và Giám sát
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('trader-trading-orders')}
              className="mb-2"
            >
              Sàn giao dịch và Đơn hàng
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('trader-standard-library')}
              className="mb-2"
            >
              Thư viện Quy trình
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('trader-profile-news')}
              className="mb-2"
            >
              Hồ sơ và Tin tức
            </Button>
          </div>

          <div className="space-y-2 mt-6">
            <Text.Title size="xSmall" className="mb-2 font-semibold">
              Người mua (Buyer)
            </Text.Title>
            <Button
              fullWidth
              onClick={() => setActiveDemo('buyer-marketplace')}
              className="mb-2"
            >
              Trang chủ và Chợ Nông sản
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('buyer-product-detail')}
              className="mb-2"
            >
              Chi tiết Sản phẩm và Đặt cọc
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('buyer-digital-twin-monitor')}
              className="mb-2"
            >
              Giám sát Bản sao số
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('buyer-orders-proposals')}
              className="mb-2"
            >
              Quản lý Đơn hàng và Đề xuất
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('buyer-post-buying-request')}
              className="mb-2"
            >
              Đăng nhu cầu mua
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('buyer-profile-notification')}
              className="mb-2"
            >
              Tài khoản và Thông báo
            </Button>
          </div>

          <div className="space-y-2 mt-6">
            <Text.Title size="xSmall" className="mb-2 font-semibold">
              Khách (Guest)
            </Text.Title>
            <Button
              fullWidth
              onClick={() => setActiveDemo('guest-home-market-news')}
              className="mb-2"
            >
              Trang chủ Khách và Tin tức thị trường
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('guest-traceability-scan')}
              className="mb-2"
            >
              Truy xuất nguồn gốc - Quét QR
            </Button>
            <Button
              fullWidth
              onClick={() => setActiveDemo('guest-product-detail')}
              className="mb-2"
            >
              Chi tiết Nông sản - Chế độ xem thử
            </Button>
          </div>
        </Box>

        <Box className="mt-4 p-4 bg-white rounded-lg shadow">
          <Text.Title size="small" className="mb-2">
            📝 Thông tin:
          </Text.Title>
          <Text size="small" className="text-gray-600">
            Các màn hình demo khác sẽ được thêm vào khi hoàn thành.
          </Text>
        </Box>
      </Box>
    </Page>
  );
}

export default HomePage;
