# Tài liệu Thiết kế - Hệ thống Thiết kế Giao diện Zalo Mini App Nông nghiệp

## Tổng quan

Hệ thống thiết kế giao diện này cung cấp một bộ quy tắc, component và pattern nhất quán để xây dựng ứng dụng Zalo Mini App nông nghiệp. Thiết kế tập trung vào ba mục tiêu chính:

1. **Trải nghiệm Native-like**: Tạo cảm giác như một phần tự nhiên của Zalo để giảm thiểu thời gian học
2. **Tối ưu cho Nông dân**: Giao diện đơn giản, trực quan với quy tắc 3 lần chạm
3. **Hiệu năng cao**: Dung lượng dưới 20MB, tối ưu cho mạng 4G nông thôn

Hệ thống hỗ trợ ba vai trò người dùng chính với các nhu cầu giao diện khác nhau:
- **Nông dân**: Giám sát môi trường, nhận cảnh báo, điều khiển thiết bị
- **Thương lái**: Dashboard thống kê, quản lý nguồn cung, giám sát quy trình
- **Người mua**: Đặt hàng, truy xuất nguồn gốc, giám sát vườn trồng

## Kiến trúc

### Kiến trúc Tổng thể

Hệ thống thiết kế được tổ chức theo mô hình phân lớp:

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Screens & User Flows by Role)         │
├─────────────────────────────────────────┤
│         Component Layer                 │
│  (Reusable UI Components)               │
├─────────────────────────────────────────┤
│         Design Token Layer              │
│  (Colors, Typography, Icons, Spacing)   │
├─────────────────────────────────────────┤
│         Foundation Layer                │
│  (Zalo Mini App SDK & Zaui Library)     │
└─────────────────────────────────────────┘
```

### Nguyên tắc Thiết kế

1. **Mobile-First**: Thiết kế ưu tiên cho màn hình di động với kích thước 360px - 414px
2. **Progressive Disclosure**: Hiển thị thông tin quan trọng trước, chi tiết sau
3. **Feedback Ngay lập tức**: Mọi thao tác đều có phản hồi trực quan trong vòng 100ms
4. **Accessibility**: Kích thước chữ tối thiểu 14px, vùng chạm tối thiểu 44x44px
5. **Offline-First**: Hỗ trợ hiển thị dữ liệu cache khi mất kết nối

### Công nghệ và Công cụ

- **Platform**: Zalo Mini App SDK
- **UI Library**: Zaui (Zalo UI Components)
- **Framework**: React với TypeScript
- **State Management**: Zustand hoặc React Context
- **Styling**: Tailwind CSS với custom theme
- **Design Tool**: Figma (cho wireframe và prototype)
- **Icon Library**: Zaui Icons + Custom Agriculture Icons

## Thành phần và Giao diện

### 1. Design Tokens

Design tokens là các giá trị thiết kế cơ bản được sử dụng xuyên suốt ứng dụng.

#### 1.1 Color Palette

```typescript
// Primary Colors
const colors = {
  primary: {
    zaloBlue: '#0068FF',      // Nút hành động chính, links
    agriGreen: '#3EBB6C',     // Trạng thái tốt, nông nghiệp
  },
  
  // Functional Colors
  functional: {
    alertRed: '#F50000',      // Cảnh báo nguy hiểm
    warningYellow: '#FFCC00', // Cảnh báo chú ý
    neutralGray: '#F7F7F8',   // Nền, đường viền
  },
  
  // Semantic Colors (derived from functional)
  semantic: {
    success: '#3EBB6C',       // = agriGreen
    error: '#F50000',         // = alertRed
    warning: '#FFCC00',       // = warningYellow
    info: '#0068FF',          // = zaloBlue
  },
  
  // Text Colors
  text: {
    primary: '#000000',       // Văn bản chính
    secondary: '#666666',     // Văn bản phụ
    disabled: '#CCCCCC',      // Văn bản disabled
    inverse: '#FFFFFF',       // Văn bản trên nền tối
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',       // Nền chính
    secondary: '#F7F7F8',     // Nền phụ
    tertiary: '#F0F0F0',      // Nền card
  },
};
```

#### 1.2 Typography Scale

```typescript
const typography = {
  // Font Families
  fontFamily: {
    ios: '-apple-system, San Francisco',
    android: 'Roboto, sans-serif',
    system: '-apple-system, Roboto, sans-serif',
  },
  
  // Font Sizes
  fontSize: {
    h1: '22px',      // Tiêu đề màn hình, tên Farm Lab
    h2: '18px',      // Tiêu đề mục, tên chỉ số
    body: '16px',    // Nội dung chính
    caption: '14px', // Chú thích, label
    small: '12px',   // Thông tin phụ
  },
  
  // Font Weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

#### 1.3 Spacing System

```typescript
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};
```

#### 1.4 Icon System

```typescript
const icons = {
  // Navigation Icons (from Zaui)
  navigation: {
    home: 'zaui-icon-home',
    user: 'zaui-icon-user',
    settings: 'zaui-icon-settings',
    notification: 'zaui-icon-notification',
  },
  
  // Agriculture Icons (Custom Outline Style)
  agriculture: {
    temperature: 'custom-icon-thermometer',
    humidity: 'custom-icon-droplet',
    light: 'custom-icon-sun',
    alert: 'custom-icon-alert-triangle',
    plant: 'custom-icon-plant',
    farm: 'custom-icon-farm',
  },
  
  // Action Icons
  actions: {
    add: 'zaui-icon-plus',
    edit: 'zaui-icon-edit',
    delete: 'zaui-icon-trash',
    search: 'zaui-icon-search',
    filter: 'zaui-icon-filter',
  },
  
  // Icon Sizes
  sizes: {
    sm: '16px',
    md: '24px',
    lg: '32px',
  },
};
```

### 2. Core Components

#### 2.1 Button Component

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'text';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  children: React.ReactNode;
  onClick: () => void;
}

// Variants:
// - primary: Zalo Blue background, white text
// - secondary: Agri Green background, white text
// - outline: Border only, transparent background
// - text: No border, no background
```

#### 2.2 Card Component

```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  status?: 'success' | 'warning' | 'error';
  children: React.ReactNode;
  onClick?: () => void;
}

// Layout: Image (optional) + Title + Subtitle + Content
// Border radius: 8px
// Shadow: 0 2px 8px rgba(0,0,0,0.1)
```

#### 2.3 Sensor Display Component

```typescript
interface SensorDisplayProps {
  type: 'temperature' | 'humidity' | 'light';
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  isImputed?: boolean; // Dữ liệu bổ khuyết
  timestamp: Date;
}

// Display: Icon + Value + Unit + Status Color
// Status Colors:
// - normal: Agri Green
// - warning: Warning Yellow
// - danger: Alert Red
```

#### 2.4 Alert Component

```typescript
interface AlertProps {
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

// Colors by severity:
// - info: Zalo Blue
// - warning: Warning Yellow
// - error: Alert Red
// - success: Agri Green
```

#### 2.5 Digital Twin Viewer Component

```typescript
interface DigitalTwinViewerProps {
  plantModel: PlantModel;
  environmentData: EnvironmentData;
  growthStage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting';
  health: 'healthy' | 'stressed' | 'diseased';
}

// Visual representation:
// - 3D or 2D plant model
// - Color changes based on health status
// - Animated growth transitions
```

#### 2.6 Chart Component

```typescript
interface ChartProps {
  type: 'line' | 'bar' | 'area';
  data: ChartData[];
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
}

// Default colors: Agri Green for positive, Alert Red for negative
```

### 3. Screen Layouts

#### 3.1 Layout Structure

Tất cả màn hình tuân theo cấu trúc chung:

```
┌─────────────────────────────────┐
│         Header/Nav Bar          │ ← 56px height
├─────────────────────────────────┤
│                                 │
│         Content Area            │ ← Scrollable
│                                 │
├─────────────────────────────────┤
│      Bottom Navigation          │ ← 64px height (optional)
└─────────────────────────────────┘
```

#### 3.2 Navigation Pattern

**Bottom Navigation** (cho vai trò Nông dân):
- Home (Trang chủ)
- Monitor (Giám sát)
- Alerts (Cảnh báo)
- Profile (Hồ sơ)

**Tab Navigation** (cho vai trò Thương lái):
- Dashboard
- Products (Sản phẩm)
- Farms (Vườn trồng)
- Orders (Đơn hàng)

**Simple Navigation** (cho vai trò Người mua):
- Browse (Duyệt sản phẩm)
- Orders (Đơn hàng)
- Tracking (Theo dõi)

### 4. Screen Designs by Role

#### 4.1 Nông dân - Màn hình Giám sát Môi trường

**Layout:**
```
┌─────────────────────────────────┐
│  Farm Lab Name          [Menu]  │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │   Digital Twin Viewer   │   │ ← Mô hình cây trồng
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│  Environment Sensors (Grid)     │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ Temp │ │ Humid│ │ Light│   │ ← 3 cột
│  │ 28°C │ │ 75%  │ │ 850  │   │
│  └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────┤
│  Active Alerts (if any)         │
│  ⚠ High Temperature Detected    │
│  → Suggested Action: Water...   │
└─────────────────────────────────┘
```

**Quy tắc 3 lần chạm:**
1. Tap Bottom Nav "Monitor"
2. View sensors (already visible)
3. Tap alert to see details

#### 4.2 Nông dân - Màn hình Cảnh báo

**Layout:**
```
┌─────────────────────────────────┐
│  Alerts              [Filter]   │
├─────────────────────────────────┤
│  Critical (Red)                 │
│  ┌─────────────────────────┐   │
│  │ ⚠ Temperature > 35°C    │   │
│  │ Farm Lab A - 2 mins ago │   │
│  │ [View] [Dismiss]        │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│  Warning (Yellow)               │
│  ┌─────────────────────────┐   │
│  │ ⚠ Humidity < 60%        │   │
│  │ Farm Lab B - 15 mins ago│   │
│  │ [View] [Dismiss]        │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

#### 4.3 Thương lái - Dashboard

**Layout:**
```
┌─────────────────────────────────┐
│  Dashboard          [Date Range]│
├─────────────────────────────────┤
│  Key Metrics (Cards)            │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Orders│ │Farms │ │Revenue│   │
│  │  24  │ │  12  │ │ 50M  │   │
│  └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────┤
│  Market Trends (Chart)          │
│  ┌─────────────────────────┐   │
│  │   Price Trend Graph     │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│  Recent Orders (List)           │
│  • Order #123 - Pending         │
│  • Order #122 - Completed       │
└─────────────────────────────────┘
```

#### 4.4 Người mua - Màn hình Sản phẩm

**Layout:**
```
┌─────────────────────────────────┐
│  Products           [Search]    │
├─────────────────────────────────┤
│  Filters: [Category] [Price]    │
├─────────────────────────────────┤
│  Product Cards (Grid 2 columns) │
│  ┌──────┐ ┌──────┐             │
│  │Image │ │Image │             │
│  │Name  │ │Name  │             │
│  │Price │ │Price │             │
│  │[Buy] │ │[Buy] │             │
│  └──────┘ └──────┘             │
└─────────────────────────────────┘
```

#### 4.5 Khách - Màn hình Truy xuất Nguồn gốc

**Layout:**
```
┌─────────────────────────────────┐
│  Product Origin     [QR Scan]   │
├─────────────────────────────────┤
│  Farm Information               │
│  ┌─────────────────────────┐   │
│  │ Farm Lab Name           │   │
│  │ Location: Mekong Delta  │   │
│  │ Area: 2 hectares        │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│  Cultivation History            │
│  Timeline with icons            │
│  🌱 Planted: 01/01/2024        │
│  💧 Watered: Daily             │
│  🌿 Harvested: 01/03/2024      │
├─────────────────────────────────┤
│  Environment Data (Chart)       │
│  ┌─────────────────────────┐   │
│  │ Temperature over time   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## Mô hình Dữ liệu

### 1. Design Token Models

```typescript
// Color Token
interface ColorToken {
  name: string;
  value: string; // Hex color
  usage: string; // Description of usage
  category: 'primary' | 'functional' | 'semantic' | 'text' | 'background';
}

// Typography Token
interface TypographyToken {
  name: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  fontFamily: string;
  usage: string;
}

// Spacing Token
interface SpacingToken {
  name: string;
  value: string; // px value
  usage: string;
}

// Icon Token
interface IconToken {
  name: string;
  source: 'zaui' | 'custom';
  style: 'outline' | 'filled';
  sizes: string[];
}
```

### 2. Component Models

```typescript
// Component Definition
interface ComponentDefinition {
  name: string;
  category: 'core' | 'composite' | 'layout';
  props: ComponentProp[];
  variants: ComponentVariant[];
  states: ComponentState[];
  accessibility: AccessibilitySpec;
}

interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
}

interface ComponentVariant {
  name: string;
  description: string;
  props: Record<string, any>;
}

interface ComponentState {
  name: 'default' | 'hover' | 'active' | 'disabled' | 'loading';
  styles: Record<string, any>;
}

interface AccessibilitySpec {
  ariaLabel?: string;
  ariaRole?: string;
  keyboardNavigation: boolean;
  minTouchTarget: string; // e.g., "44x44px"
}
```

### 3. Screen Models

```typescript
// Screen Definition
interface ScreenDefinition {
  name: string;
  role: 'farmer' | 'trader' | 'buyer' | 'guest';
  route: string;
  layout: LayoutType;
  components: ComponentInstance[];
  navigation: NavigationConfig;
  dataRequirements: DataRequirement[];
}

interface ComponentInstance {
  componentName: string;
  props: Record<string, any>;
  position: {
    order: number;
    section: 'header' | 'content' | 'footer';
  };
}

interface NavigationConfig {
  type: 'bottom' | 'tab' | 'drawer' | 'none';
  items: NavigationItem[];
}

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface DataRequirement {
  entity: string;
  fields: string[];
  realtime: boolean;
}
```

### 4. User Interaction Models

```typescript
// Interaction Pattern
interface InteractionPattern {
  name: string;
  trigger: 'tap' | 'swipe' | 'long-press' | 'scroll';
  action: string;
  feedback: FeedbackSpec;
  maxClicks: number; // For 3-click rule
}

interface FeedbackSpec {
  visual: {
    type: 'color-change' | 'animation' | 'overlay';
    duration: number; // milliseconds
  };
  haptic?: boolean;
  sound?: boolean;
}
```

### 5. Theme Configuration Model

```typescript
// Theme Configuration
interface ThemeConfig {
  name: string;
  colors: Record<string, ColorToken>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, SpacingToken>;
  icons: Record<string, IconToken>;
  components: Record<string, ComponentTheme>;
}

interface ComponentTheme {
  componentName: string;
  defaultProps: Record<string, any>;
  styleOverrides: Record<string, any>;
}
```

### 6. Validation Models

```typescript
// Design Compliance Check
interface DesignComplianceCheck {
  rule: string;
  category: 'color' | 'typography' | 'spacing' | 'accessibility' | 'performance';
  severity: 'error' | 'warning' | 'info';
  validator: (component: any) => boolean;
  message: string;
}

// Examples:
const complianceRules: DesignComplianceCheck[] = [
  {
    rule: 'min-font-size',
    category: 'typography',
    severity: 'error',
    validator: (component) => component.fontSize >= 14,
    message: 'Font size must be at least 14px for important information',
  },
  {
    rule: 'color-palette',
    category: 'color',
    severity: 'error',
    validator: (component) => isValidColor(component.color),
    message: 'Color must be from the defined palette',
  },
  {
    rule: 'touch-target',
    category: 'accessibility',
    severity: 'error',
    validator: (component) => component.width >= 44 && component.height >= 44,
    message: 'Touch target must be at least 44x44px',
  },
];
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Color Palette Compliance

*For any* UI component that uses colors, all color values SHALL be from the defined color palette (Zalo Blue #0068FF, Agri Green #3EBB6C, Alert Red #F50000, Warning Yellow #FFCC00, Neutral Gray #F7F7F8, or derived semantic colors).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.2**

### Property 2: Primary Button Color Consistency

*For any* button component with variant="primary", the background color SHALL be Zalo Blue (#0068FF).

**Validates: Requirements 2.1**

### Property 3: Success State Color Consistency

*For any* component displaying success or healthy status (sensor readings, alerts, indicators), the color SHALL be Agri Green (#3EBB6C).

**Validates: Requirements 2.2**

### Property 4: Error State Color Consistency

*For any* component displaying error or danger status (critical alerts, error messages), the color SHALL be Alert Red (#F50000).

**Validates: Requirements 2.3**

### Property 5: Warning State Color Consistency

*For any* component displaying warning status (caution alerts, attention messages), the color SHALL be Warning Yellow (#FFCC00).

**Validates: Requirements 2.4**

### Property 6: Typography Scale Compliance

*For any* text element, the font size SHALL be one of the defined typography scale values (22px for h1, 18px for h2, 16px for body, 14px minimum for important information).

**Validates: Requirements 3.3, 3.4, 3.5, 3.6, 8.3**

### Property 7: Platform Font Consistency

*For any* text element on iOS platform, the font family SHALL be San Francisco; *for any* text element on Android platform, the font family SHALL be Roboto.

**Validates: Requirements 3.1, 3.2**

### Property 8: Minimum Font Size Constraint

*For any* text element displaying important information, the font size SHALL NOT be less than 14px.

**Validates: Requirements 3.6**

### Property 9: Icon Style Consistency

*For any* icon component, the style SHALL be "outline" with thin strokes.

**Validates: Requirements 4.1, 8.4**

### Property 10: Navigation Icon Source

*For any* navigation icon (home, user, settings, notification), the icon SHALL be sourced from the Zaui library.

**Validates: Requirements 4.2**

### Property 11: Sensor Icon Mapping

*For any* sensor display component, the icon SHALL correctly map to the sensor type: thermometer for temperature, droplet for humidity, sun for light, alert-triangle for warnings.

**Validates: Requirements 4.3, 4.4, 4.5, 4.6**

### Property 12: Component Library Consistency

*For any* UI component used in the application, it SHALL either be from the Zaui library or follow the defined design system specifications.

**Validates: Requirements 1.3, 8.1, 9.4**

### Property 13: Data Visualization Preference

*For any* growth data or environmental data display, the system SHALL use charts or Digital Twin visualization rather than raw data tables.

**Validates: Requirements 6.1**

### Property 14: Plant State Synchronization

*For any* change in plant state data, the Digital Twin visual representation SHALL update to reflect the new state.

**Validates: Requirements 6.2**

### Property 15: Leaf Color State Mapping

*For any* plant health status, the leaf color in the Digital Twin SHALL correctly map to the status (green for healthy, yellow for stressed, brown for diseased).

**Validates: Requirements 6.3**

### Property 16: Agriculture Theme Consistency

*For any* component displaying agriculture-related information, the color theme SHALL use green tones (Agri Green and derivatives).

**Validates: Requirements 6.4**

### Property 17: Interaction Pattern Consistency

*For any* user interaction (tap, swipe, long-press), the feedback pattern SHALL be consistent with Zalo's standard interaction patterns.

**Validates: Requirements 1.4, 8.5**

### Property 18: System Font Usage

*For any* font loading, the system SHALL use system fonts (San Francisco on iOS, Roboto on Android) rather than loading custom fonts.

**Validates: Requirements 9.1**

### Property 19: Design System Extensibility

*For any* new color, component, typography, or icon added to the design system, it SHALL not violate existing design rules and SHALL maintain consistency with established patterns.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

### Property 20: Backward Compatibility

*For any* update to the design system, existing components SHALL continue to function correctly without breaking changes.

**Validates: Requirements 10.5**

### Property 21: Native-like Component Usage

*For any* screen or component, it SHALL use Zalo Mini App SDK components and follow Zalo's design language to create a native-like experience.

**Validates: Requirements 1.1, 1.3**

## Error Handling

### Design System Validation Errors

1. **Color Validation Error**
   - **Trigger**: Component uses a color not in the defined palette
   - **Response**: Throw validation error with message "Invalid color: {color}. Must use colors from the defined palette."
   - **Recovery**: Provide nearest valid color from palette

2. **Typography Validation Error**
   - **Trigger**: Text component uses font size not in typography scale
   - **Response**: Throw validation error with message "Invalid font size: {size}. Must use defined typography scale."
   - **Recovery**: Round to nearest valid font size

3. **Icon Style Validation Error**
   - **Trigger**: Icon component doesn't use outline style
   - **Response**: Throw validation error with message "Invalid icon style. Must use outline style."
   - **Recovery**: Replace with outline version of icon

4. **Component Source Validation Error**
   - **Trigger**: Component doesn't follow design system specifications
   - **Response**: Throw validation error with message "Component {name} doesn't comply with design system."
   - **Recovery**: Provide reference to correct component specification

### Runtime Errors

1. **Asset Loading Error**
   - **Trigger**: Icon or image fails to load
   - **Response**: Display placeholder with error icon
   - **Fallback**: Use text label instead of icon

2. **Font Loading Error**
   - **Trigger**: System font fails to load
   - **Response**: Fall back to generic sans-serif font
   - **Log**: Record font loading failure for monitoring

3. **Theme Configuration Error**
   - **Trigger**: Theme configuration is invalid or missing
   - **Response**: Load default theme configuration
   - **Log**: Record configuration error

### Development-Time Warnings

1. **Accessibility Warning**
   - **Trigger**: Touch target smaller than 44x44px
   - **Response**: Console warning with component location
   - **Suggestion**: Increase component size or padding

2. **Performance Warning**
   - **Trigger**: Bundle size approaching 20MB limit
   - **Response**: Build warning with size breakdown
   - **Suggestion**: Optimize assets or lazy load components

3. **Consistency Warning**
   - **Trigger**: Similar components with different styling
   - **Response**: Linting warning
   - **Suggestion**: Use consistent component from design system

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases for individual components and design tokens:

1. **Color Token Tests**
   - Test each color token has correct hex value
   - Test color contrast ratios meet accessibility standards
   - Test color token exports correctly

2. **Typography Token Tests**
   - Test each typography token has correct font size
   - Test font family resolves correctly per platform
   - Test line height calculations

3. **Component Tests**
   - Test Button component renders with correct colors per variant
   - Test Card component applies correct spacing
   - Test SensorDisplay component shows correct icon per type
   - Test Alert component uses correct color per severity
   - Test DigitalTwinViewer updates when data changes

4. **Layout Tests**
   - Test screen layouts maintain structure on different screen sizes
   - Test navigation components render correctly
   - Test responsive breakpoints

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library for JavaScript/TypeScript. Each test will run a minimum of 100 iterations.

#### Test Configuration

```typescript
import fc from 'fast-check';

const testConfig = {
  numRuns: 100,
  verbose: true,
};
```

#### Property Test 1: Color Palette Compliance

**Feature: zalo-ui-design-system, Property 1: Color Palette Compliance**

```typescript
fc.assert(
  fc.property(
    fc.record({
      componentType: fc.constantFrom('button', 'card', 'alert', 'sensor'),
      colorProp: fc.string(),
      colorValue: fc.hexaString({ minLength: 6, maxLength: 6 }),
    }),
    (component) => {
      const validColors = [
        '0068FF', '3EBB6C', 'F50000', 'FFCC00', 'F7F7F8',
        '000000', '666666', 'CCCCCC', 'FFFFFF', 'F0F0F0'
      ];
      
      // If component uses a color, it must be from valid palette
      if (component.colorValue) {
        return validColors.includes(component.colorValue.toUpperCase());
      }
      return true;
    }
  ),
  testConfig
);
```

#### Property Test 2: Primary Button Color

**Feature: zalo-ui-design-system, Property 2: Primary Button Color Consistency**

```typescript
fc.assert(
  fc.property(
    fc.record({
      variant: fc.constant('primary'),
      size: fc.constantFrom('small', 'medium', 'large'),
      disabled: fc.boolean(),
    }),
    (buttonProps) => {
      const button = renderButton(buttonProps);
      const backgroundColor = getComputedStyle(button).backgroundColor;
      return backgroundColor === 'rgb(0, 104, 255)'; // #0068FF
    }
  ),
  testConfig
);
```

#### Property Test 3: Typography Scale Compliance

**Feature: zalo-ui-design-system, Property 6: Typography Scale Compliance**

```typescript
fc.assert(
  fc.property(
    fc.record({
      variant: fc.constantFrom('h1', 'h2', 'body', 'caption', 'small'),
      content: fc.string(),
    }),
    (textProps) => {
      const validSizes = {
        h1: '22px',
        h2: '18px',
        body: '16px',
        caption: '14px',
        small: '12px',
      };
      
      const element = renderText(textProps);
      const fontSize = getComputedStyle(element).fontSize;
      return fontSize === validSizes[textProps.variant];
    }
  ),
  testConfig
);
```

#### Property Test 4: Minimum Font Size

**Feature: zalo-ui-design-system, Property 8: Minimum Font Size Constraint**

```typescript
fc.assert(
  fc.property(
    fc.record({
      variant: fc.constantFrom('h1', 'h2', 'body', 'caption'),
      isImportant: fc.constant(true),
      content: fc.string(),
    }),
    (textProps) => {
      const element = renderText(textProps);
      const fontSize = parseInt(getComputedStyle(element).fontSize);
      return fontSize >= 14; // Minimum 14px for important info
    }
  ),
  testConfig
);
```

#### Property Test 5: Icon Style Consistency

**Feature: zalo-ui-design-system, Property 9: Icon Style Consistency**

```typescript
fc.assert(
  fc.property(
    fc.record({
      iconName: fc.constantFrom('home', 'user', 'settings', 'thermometer', 'droplet'),
      size: fc.constantFrom('sm', 'md', 'lg'),
    }),
    (iconProps) => {
      const icon = renderIcon(iconProps);
      const iconStyle = icon.getAttribute('data-style');
      return iconStyle === 'outline';
    }
  ),
  testConfig
);
```

#### Property Test 6: Sensor Icon Mapping

**Feature: zalo-ui-design-system, Property 11: Sensor Icon Mapping**

```typescript
fc.assert(
  fc.property(
    fc.record({
      type: fc.constantFrom('temperature', 'humidity', 'light'),
      value: fc.float({ min: 0, max: 100 }),
      status: fc.constantFrom('normal', 'warning', 'danger'),
    }),
    (sensorProps) => {
      const iconMapping = {
        temperature: 'thermometer',
        humidity: 'droplet',
        light: 'sun',
      };
      
      const sensor = renderSensorDisplay(sensorProps);
      const iconName = sensor.querySelector('[data-icon]').getAttribute('data-icon');
      return iconName === iconMapping[sensorProps.type];
    }
  ),
  testConfig
);
```

#### Property Test 7: Status Color Mapping

**Feature: zalo-ui-design-system, Property 3, 4, 5: Status Color Consistency**

```typescript
fc.assert(
  fc.property(
    fc.record({
      status: fc.constantFrom('success', 'error', 'warning'),
      componentType: fc.constantFrom('alert', 'sensor', 'badge'),
    }),
    (props) => {
      const colorMapping = {
        success: 'rgb(62, 187, 108)', // #3EBB6C
        error: 'rgb(245, 0, 0)',      // #F50000
        warning: 'rgb(255, 204, 0)',  // #FFCC00
      };
      
      const component = renderStatusComponent(props);
      const color = getComputedStyle(component).color;
      return color === colorMapping[props.status];
    }
  ),
  testConfig
);
```

#### Property Test 8: Design System Extensibility

**Feature: zalo-ui-design-system, Property 19: Design System Extensibility**

```typescript
fc.assert(
  fc.property(
    fc.record({
      newColorName: fc.string({ minLength: 3, maxLength: 20 }),
      newColorValue: fc.hexaString({ minLength: 6, maxLength: 6 }),
      category: fc.constantFrom('primary', 'functional', 'semantic'),
    }),
    (newColor) => {
      const originalPalette = getColorPalette();
      const extendedPalette = addColorToPalette(newColor);
      
      // New color should not break existing colors
      const originalColors = Object.keys(originalPalette);
      const allOriginalColorsStillExist = originalColors.every(
        color => extendedPalette[color] === originalPalette[color]
      );
      
      return allOriginalColorsStillExist;
    }
  ),
  testConfig
);
```

### Integration Testing

Integration tests will verify that components work together correctly:

1. **Screen Composition Tests**
   - Test Farmer monitoring screen assembles correctly with all components
   - Test Trader dashboard displays all required sections
   - Test Buyer product listing renders correctly

2. **Navigation Flow Tests**
   - Test 3-click rule for critical farmer actions
   - Test navigation between screens maintains state
   - Test deep linking works correctly

3. **Theme Application Tests**
   - Test theme applies consistently across all screens
   - Test theme switching (if supported) updates all components
   - Test platform-specific styling applies correctly

### Visual Regression Testing

Visual regression tests will catch unintended visual changes:

1. **Component Snapshots**
   - Capture snapshots of all components in different states
   - Compare against baseline on each build
   - Flag any visual differences for review

2. **Screen Snapshots**
   - Capture full screen layouts for each role
   - Test on multiple screen sizes (360px, 375px, 414px)
   - Test on both iOS and Android platforms

### Accessibility Testing

Accessibility tests will ensure the design system is usable by all:

1. **Color Contrast Tests**
   - Test all text/background combinations meet WCAG AA standards
   - Test color-blind friendly color combinations

2. **Touch Target Tests**
   - Test all interactive elements are at least 44x44px
   - Test spacing between touch targets is adequate

3. **Screen Reader Tests**
   - Test all components have appropriate ARIA labels
   - Test navigation is logical for screen readers

### Performance Testing

Performance tests will ensure the design system meets efficiency requirements:

1. **Bundle Size Tests**
   - Test total bundle size is under 20MB
   - Test individual component sizes
   - Test tree-shaking removes unused components

2. **Render Performance Tests**
   - Test component render times
   - Test screen load times
   - Test animation frame rates

3. **Asset Loading Tests**
   - Test icon loading performance
   - Test image optimization
   - Test lazy loading effectiveness

## Implementation Guidelines

### Development Workflow

1. **Design Token First**
   - Define all design tokens before creating components
   - Export tokens in multiple formats (JS, CSS, JSON)
   - Version control token changes

2. **Component Development**
   - Build components using defined tokens only
   - Document component props and variants
   - Include accessibility attributes
   - Write unit tests for each component

3. **Screen Assembly**
   - Compose screens from existing components
   - Follow layout patterns
   - Implement navigation flows
   - Test 3-click rule compliance

4. **Quality Assurance**
   - Run property-based tests
   - Perform visual regression testing
   - Check accessibility compliance
   - Verify performance metrics

### Code Organization

```
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── icons.ts
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── SensorDisplay/
│   │   ├── Alert/
│   │   └── DigitalTwinViewer/
│   ├── layouts/
│   │   ├── ScreenLayout.tsx
│   │   ├── Navigation.tsx
│   │   └── Header.tsx
│   └── utils/
│       ├── validators.ts
│       └── theme.ts
├── screens/
│   ├── farmer/
│   ├── trader/
│   ├── buyer/
│   └── guest/
└── tests/
    ├── unit/
    ├── property/
    ├── integration/
    └── visual/
```

### Documentation Requirements

1. **Component Documentation**
   - Props API reference
   - Usage examples
   - Accessibility notes
   - Do's and don'ts

2. **Design Token Documentation**
   - Token values and usage
   - When to use each token
   - Examples in context

3. **Pattern Documentation**
   - Common UI patterns
   - Navigation patterns
   - Interaction patterns
   - Layout patterns

### Maintenance and Evolution

1. **Version Control**
   - Semantic versioning for design system
   - Changelog for each release
   - Migration guides for breaking changes

2. **Deprecation Strategy**
   - Mark deprecated components/tokens
   - Provide migration path
   - Remove after 2 major versions

3. **Feedback Loop**
   - Collect usage metrics
   - Gather developer feedback
   - Monitor accessibility issues
   - Track performance metrics

4. **Regular Audits**
   - Quarterly design system audit
   - Consistency checks
   - Accessibility review
   - Performance optimization

## Conclusion

This design system provides a comprehensive foundation for building the Zalo Mini App agricultural application. By following the defined tokens, components, and patterns, developers can create consistent, accessible, and performant user interfaces that meet the needs of farmers, traders, and buyers while maintaining the native Zalo experience.

The property-based testing approach ensures that the design system maintains its correctness properties across all use cases, while the comprehensive testing strategy catches issues early in the development process.
