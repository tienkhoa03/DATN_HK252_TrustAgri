# Usage Examples - Zalo Mini App Design System

Tài liệu hướng dẫn sử dụng với các ví dụ thực tế cho từng component và pattern.

## Table of Contents

- [Getting Started](#getting-started)
- [Design Tokens Examples](#design-tokens-examples)
- [Component Examples](#component-examples)
- [Layout Examples](#layout-examples)
- [Screen Examples](#screen-examples)
- [Common Patterns](#common-patterns)

---

## Getting Started

### Installation

```bash
# Import design system
import { designSystem } from '@/design-system';

// Or import specific modules
import { Button } from '@/design-system/components/Button';
import { colors } from '@/design-system/tokens/colors';
```

### Basic Setup

```typescript
import React from 'react';
import { ThemeProvider } from '@/design-system/utils/ThemeProvider';
import { getPlatformTheme } from '@/design-system/utils/theme';

function App() {
  const theme = getPlatformTheme();
  
  return (
    <ThemeProvider theme={theme}>
      <YourApp />
    </ThemeProvider>
  );
}
```

---

## Design Tokens Examples

### Example 1: Using Colors

```typescript
import { colors, getSemanticColor } from '@/design-system/tokens/colors';

// Basic usage
const MyComponent = () => (
  <div style={{ 
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse 
  }}>
    Primary Action
  </div>
);

// Using semantic colors
const StatusBadge = ({ status }) => {
  const color = getSemanticColor(status); // 'success', 'error', 'warning', 'info'
  
  return (
    <span style={{ backgroundColor: color }}>
      {status}
    </span>
  );
};
```


### Example 2: Using Typography

```typescript
import { createTypographyStyle, typography } from '@/design-system/tokens/typography';

// Using typography styles
const Heading = ({ children }) => (
  <h1 style={createTypographyStyle('h1')}>
    {children}
  </h1>
);

// With custom overrides
const BoldText = ({ children }) => (
  <p style={createTypographyStyle('body', { 
    fontWeight: typography.fontWeight.bold 
  })}>
    {children}
  </p>
);

// Responsive typography
const ResponsiveText = () => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  
  return (
    <p style={{ 
      fontSize: getResponsiveFontSize(typography.fontSize.body, screenWidth) 
    }}>
      Responsive text
    </p>
  );
};
```

### Example 3: Using Spacing

```typescript
import { spacing } from '@/design-system/tokens/spacing';

const Card = ({ children }) => (
  <div style={{
    padding: spacing.md,
    margin: spacing.lg,
    gap: spacing.sm
  }}>
    {children}
  </div>
);

// Using spacing utilities
import { createSpacingStyle } from '@/design-system/utils/spacing';

const Container = ({ children }) => (
  <div style={createSpacingStyle({ 
    padding: 'lg', 
    margin: 'md' 
  })}>
    {children}
  </div>
);
```

### Example 4: Using Icons

```typescript
import { Icon } from '@/design-system/components/Icon';
import { getSensorIcon } from '@/design-system/tokens/icons';
import { colors } from '@/design-system/tokens/colors';

// Basic icon usage
const HomeIcon = () => (
  <Icon name="home" size="md" />
);

// Sensor icon with color
const TemperatureIcon = () => {
  const iconName = getSensorIcon('temperature');
  
  return (
    <Icon 
      name={iconName} 
      size="lg" 
      color={colors.primary.agriGreen} 
    />
  );
};
```

---

## Component Examples

### Example 5: Button Component

```typescript
import { Button } from '@/design-system/components/Button';
import { Icon } from '@/design-system/components/Icon';

// Primary button
const PrimaryButton = () => (
  <Button variant="primary" onClick={() => console.log('Clicked')}>
    Xác nhận
  </Button>
);

// Button with icon
const AddButton = () => (
  <Button 
    variant="primary" 
    icon={<Icon name="add" />}
    onClick={handleAdd}
  >
    Thêm mới
  </Button>
);

// Loading button
const SubmitButton = ({ isLoading }) => (
  <Button 
    variant="primary" 
    loading={isLoading}
    disabled={isLoading}
  >
    {isLoading ? 'Đang xử lý...' : 'Gửi'}
  </Button>
);

// Button group
const ButtonGroup = () => (
  <div style={{ display: 'flex', gap: spacing.sm }}>
    <Button variant="primary">Chấp nhận</Button>
    <Button variant="outline">Từ chối</Button>
  </div>
);
```

### Example 6: Card Component

```typescript
import { Card } from '@/design-system/components/Card';

// Basic card
const FarmCard = ({ farm }) => (
  <Card
    title={farm.name}
    subtitle={farm.location}
    image={farm.imageUrl}
    status="success"
    onClick={() => navigateToFarm(farm.id)}
  >
    <p>Diện tích: {farm.area} hecta</p>
    <p>Loại cây: {farm.cropType}</p>
  </Card>
);

// Card with custom content
const SensorCard = ({ sensor }) => (
  <Card title={sensor.name}>
    <SensorDisplay
      type={sensor.type}
      value={sensor.value}
      unit={sensor.unit}
      status={sensor.status}
    />
  </Card>
);
```

### Example 7: Alert Component

```typescript
import { Alert } from '@/design-system/components/Alert';

// Error alert
const ErrorAlert = () => (
  <Alert
    severity="error"
    title="Nhiệt độ cao"
    message="Nhiệt độ vượt ngưỡng 35°C. Cần tưới nước ngay."
    action={{
      label: "Bật máy bơm",
      onClick: handleActivatePump
    }}
    dismissible
    onDismiss={handleDismiss}
  />
);

// Warning alert
const WarningAlert = () => (
  <Alert
    severity="warning"
    message="Độ ẩm đất thấp hơn mức khuyến nghị"
  />
);

// Success alert
const SuccessAlert = () => (
  <Alert
    severity="success"
    message="Đã cập nhật thông tin thành công"
    dismissible
  />
);
```

### Example 8: SensorDisplay Component

```typescript
import { SensorDisplay } from '@/design-system/components/SensorDisplay';

// Temperature sensor
const TemperatureSensor = ({ data }) => (
  <SensorDisplay
    type="temperature"
    value={data.value}
    unit="°C"
    status={data.status}
    timestamp={data.timestamp}
  />
);

// Sensor grid
const SensorGrid = ({ sensors }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: spacing.md 
  }}>
    {sensors.map(sensor => (
      <SensorDisplay
        key={sensor.id}
        type={sensor.type}
        value={sensor.value}
        unit={sensor.unit}
        status={sensor.status}
        isImputed={sensor.isImputed}
      />
    ))}
  </div>
);
```

### Example 9: Chart Component

```typescript
import { Chart } from '@/design-system/components/Chart';

// Line chart for temperature
const TemperatureChart = ({ data }) => (
  <Chart
    type="line"
    data={data.map(d => ({ x: d.date, y: d.temperature }))}
    xAxis={{ label: 'Ngày' }}
    yAxis={{ label: 'Nhiệt độ (°C)', min: 20, max: 40 }}
    showGrid
    showLegend
  />
);

// Bar chart for production
const ProductionChart = ({ data }) => (
  <Chart
    type="bar"
    data={data}
    xAxis={{ label: 'Tháng' }}
    yAxis={{ 
      label: 'Sản lượng (tấn)',
      format: (value) => `${value}T`
    }}
    colors={[colors.primary.agriGreen]}
  />
);
```

---

## Layout Examples

### Example 10: Screen Layout

```typescript
import { ScreenLayout, Header, BottomNavigation } from '@/design-system/layouts';

const FarmerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <ScreenLayout
      header={
        <Header
          title="Farm Lab Dashboard"
          rightAction={<Icon name="notification" />}
        />
      }
      navigation={
        <BottomNavigation
          items={[
            { label: 'Trang chủ', icon: 'home' },
            { label: 'Giám sát', icon: 'monitor' },
            { label: 'Cảnh báo', icon: 'alert', badge: 3 },
            { label: 'Hồ sơ', icon: 'user' }
          ]}
          activeIndex={activeTab}
          onChange={setActiveTab}
        />
      }
    >
      <DashboardContent />
    </ScreenLayout>
  );
};
```

### Example 11: Tab Navigation

```typescript
import { TabNavigation } from '@/design-system/layouts';

const TraderDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  return (
    <div>
      <TabNavigation
        tabs={[
          { label: 'Dashboard' },
          { label: 'Sản phẩm' },
          { label: 'Vườn trồng' },
          { label: 'Đơn hàng', badge: 5 }
        ]}
        activeIndex={activeTab}
        onChange={setActiveTab}
      />
      
      {activeTab === 0 && <DashboardTab />}
      {activeTab === 1 && <ProductsTab />}
      {activeTab === 2 && <FarmsTab />}
      {activeTab === 3 && <OrdersTab />}
    </div>
  );
};
```

---

## Screen Examples

### Example 12: Farmer Monitoring Screen

```typescript
import { 
  ScreenLayout, 
  Header, 
  BottomNavigation 
} from '@/design-system/layouts';
import { 
  Card, 
  SensorDisplay, 
  Alert, 
  DigitalTwinViewer 
} from '@/design-system/components';

const FarmerMonitoringScreen = () => {
  const [farmData, setFarmData] = useState(null);
  
  return (
    <ScreenLayout
      header={<Header title="Giám sát Farm Lab" />}
      navigation={<BottomNavigation items={navItems} />}
    >
      {/* Digital Twin Viewer */}
      <Card title="Trạng thái cây trồng">
        <DigitalTwinViewer
          plantModel={farmData.plantModel}
          environmentData={farmData.environment}
          growthStage="flowering"
          health="healthy"
        />
      </Card>
      
      {/* Sensor Grid */}
      <Card title="Thông số môi trường">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: spacing.md 
        }}>
          <SensorDisplay
            type="temperature"
            value={28}
            unit="°C"
            status="normal"
          />
          <SensorDisplay
            type="humidity"
            value={75}
            unit="%"
            status="normal"
          />
          <SensorDisplay
            type="light"
            value={850}
            unit="lux"
            status="normal"
          />
          <SensorDisplay
            type="soilMoisture"
            value={65}
            unit="%"
            status="warning"
          />
        </div>
      </Card>
      
      {/* Alerts */}
      {farmData.alerts.map(alert => (
        <Alert
          key={alert.id}
          severity={alert.severity}
          title={alert.title}
          message={alert.message}
          action={alert.action}
        />
      ))}
    </ScreenLayout>
  );
};
```

### Example 13: Trader Dashboard Screen

```typescript
const TraderDashboardScreen = () => {
  return (
    <ScreenLayout header={<Header title="Dashboard" />}>
      {/* Key Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: spacing.md 
      }}>
        <Card title="Đơn hàng">
          <h2 style={createTypographyStyle('h1')}>24</h2>
        </Card>
        <Card title="Vườn trồng">
          <h2 style={createTypographyStyle('h1')}>12</h2>
        </Card>
        <Card title="Doanh thu">
          <h2 style={createTypographyStyle('h1')}>50M</h2>
        </Card>
      </div>
      
      {/* Market Trends Chart */}
      <Card title="Xu hướng thị trường">
        <Chart
          type="line"
          data={marketData}
          xAxis={{ label: 'Ngày' }}
          yAxis={{ label: 'Giá (VNĐ/kg)' }}
        />
      </Card>
      
      {/* Recent Orders */}
      <Card title="Đơn hàng gần đây">
        {orders.map(order => (
          <OrderItem key={order.id} order={order} />
        ))}
      </Card>
    </ScreenLayout>
  );
};
```

### Example 14: Buyer Product Detail Screen

```typescript
const BuyerProductDetailScreen = ({ productId }) => {
  const [product, setProduct] = useState(null);
  
  return (
    <ScreenLayout
      header={
        <Header
          title="Chi tiết sản phẩm"
          leftAction={<Icon name="arrow-left" />}
        />
      }
    >
      {/* Product Images */}
      <ImageSlider images={product.images} />
      
      {/* Product Info */}
      <Card>
        <h1 style={createTypographyStyle('h1')}>{product.name}</h1>
        <p style={createTypographyStyle('body')}>{product.description}</p>
        
        <div style={{ marginTop: spacing.md }}>
          <p>Thương lái: {product.trader.name}</p>
          <p>Farm Lab: {product.farm.name}</p>
          <p>Địa chỉ: {product.farm.location}</p>
        </div>
      </Card>
      
      {/* Quality Metrics */}
      <Card title="Cam kết chất lượng">
        <ul>
          <li>Độ ngọt: {product.quality.sweetness}°Brix</li>
          <li>Kích thước: {product.quality.size}</li>
          <li>Không dư lượng thuốc BVTV</li>
        </ul>
      </Card>
      
      {/* Action Footer */}
      <div style={{ 
        position: 'sticky', 
        bottom: 0,
        padding: spacing.md,
        backgroundColor: colors.background.primary 
      }}>
        <Button 
          variant="primary" 
          size="large"
          onClick={handlePreOrder}
        >
          Đặt cọc ngay - {product.depositPrice}đ
        </Button>
      </div>
    </ScreenLayout>
  );
};
```

---

## Common Patterns

### Pattern 1: Form with Validation

```typescript
import { Button } from '@/design-system/components/Button';
import { Alert } from '@/design-system/components/Alert';
import { validateComponent } from '@/design-system/utils/validators';

const FarmRegistrationForm = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState([]);
  
  const handleSubmit = () => {
    const validation = validateComponent({
      // validation rules
    });
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    // Submit form
  };
  
  return (
    <form>
      {errors.length > 0 && (
        <Alert
          severity="error"
          message={errors.join(', ')}
          dismissible
          onDismiss={() => setErrors([])}
        />
      )}
      
      {/* Form fields */}
      
      <Button 
        variant="primary" 
        type="submit"
        onClick={handleSubmit}
      >
        Đăng ký
      </Button>
    </form>
  );
};
```

### Pattern 2: Loading State

```typescript
const DataLoadingPattern = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: spacing.xl }}>
        <Icon name="spinner" size="lg" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }
  
  return <DataDisplay data={data} />;
};
```

### Pattern 3: Error Boundary

```typescript
import { createErrorBoundary } from '@/design-system/utils/errorHandling';

const ErrorFallback = () => (
  <Alert
    severity="error"
    title="Đã xảy ra lỗi"
    message="Vui lòng thử lại sau"
    action={{
      label: "Tải lại",
      onClick: () => window.location.reload()
    }}
  />
);

const ErrorBoundary = createErrorBoundary(<ErrorFallback />);

const App = () => (
  <ErrorBoundary>
    <YourApp />
  </ErrorBoundary>
);
```

### Pattern 4: Responsive Grid

```typescript
const ResponsiveGrid = ({ items }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: spacing.md,
    padding: spacing.md
  }}>
    {items.map(item => (
      <Card key={item.id} {...item} />
    ))}
  </div>
);
```

### Pattern 5: 3-Click Rule Implementation

```typescript
// Farmer Dashboard - Access to critical alerts within 3 clicks
const FarmerDashboard = () => {
  return (
    <ScreenLayout navigation={<BottomNavigation />}>
      {/* Click 1: Tap "Cảnh báo" in bottom navigation */}
      
      {/* Click 2: View alert list (already visible) */}
      <Card title="Cảnh báo ưu tiên cao">
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            severity={alert.severity}
            message={alert.message}
            // Click 3: Tap alert to see details
            action={{
              label: "Xem chi tiết",
              onClick: () => navigateToAlertDetail(alert.id)
            }}
          />
        ))}
      </Card>
    </ScreenLayout>
  );
};
```

---

## Best Practices

### 1. Always Use Design Tokens

❌ **Không nên:**
```typescript
<div style={{ color: '#0068FF', fontSize: '16px' }}>Text</div>
```

✅ **Nên:**
```typescript
<div style={{ 
  color: colors.primary.zaloBlue, 
  fontSize: typography.fontSize.body 
}}>
  Text
</div>
```

### 2. Validate Components

```typescript
import { validateComponent } from '@/design-system/utils/validators';

const MyComponent = ({ color, fontSize }) => {
  const validation = validateComponent({ color, fontSize });
  
  if (!validation.valid) {
    console.warn('Component validation failed:', validation.errors);
  }
  
  return <div>...</div>;
};
```

### 3. Use Semantic Colors

```typescript
// Use semantic colors for status
const StatusBadge = ({ status }) => {
  const color = getSemanticColor(status); // 'success', 'error', 'warning'
  return <span style={{ backgroundColor: color }}>{status}</span>;
};
```

### 4. Ensure Accessibility

```typescript
<Button
  variant="primary"
  aria-label="Xác nhận đơn hàng"
  onClick={handleConfirm}
>
  Xác nhận
</Button>
```

### 5. Handle Errors Gracefully

```typescript
import { useErrorHandling } from '@/design-system/utils/errorHandling';

const MyComponent = () => {
  const { error, setError, clearError } = useErrorHandling();
  
  if (error) {
    return <Alert severity="error" message={error.message} />;
  }
  
  return <div>...</div>;
};
```

---

## See Also

- [API Reference](./API_REFERENCE.md)
- [Pattern Library](./PATTERN_LIBRARY.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
