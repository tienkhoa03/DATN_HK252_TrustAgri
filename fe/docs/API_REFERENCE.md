# API Reference - Zalo Mini App Design System

Tài liệu tham khảo API đầy đủ cho Hệ thống Thiết kế Zalo Mini App Nông nghiệp.

## Table of Contents

- [Design Tokens](#design-tokens)
  - [Colors](#colors)
  - [Typography](#typography)
  - [Spacing](#spacing)
  - [Icons](#icons)
- [Components](#components)
  - [Button](#button)
  - [Card](#card)
  - [Alert](#alert)
  - [SensorDisplay](#sensordisplay)
  - [Chart](#chart)
  - [Icon](#icon)
  - [DigitalTwinViewer](#digitaltwinviewer)
- [Layout Components](#layout-components)
  - [ScreenLayout](#screenlayout)
  - [Header](#header)
  - [BottomNavigation](#bottomnavigation)
  - [TabNavigation](#tabnavigation)
- [Utilities](#utilities)
  - [Validators](#validators)
  - [Theme](#theme)
  - [Error Handling](#error-handling)
  - [Spacing Utilities](#spacing-utilities)

---

## Design Tokens

### Colors

**Import:**
```typescript
import { colors, getSemanticColor, getStatusColor, getValidatedColor } from '@/design-system/tokens/colors';
```

#### Color Palette

##### Primary Colors
```typescript
colors.primary.zaloBlue: '#0068FF'    // Nút hành động chính, links
colors.primary.agriGreen: '#3EBB6C'   // Trạng thái tốt, nông nghiệp
```

##### Functional Colors
```typescript
colors.functional.alertRed: '#F50000'      // Cảnh báo nguy hiểm
colors.functional.warningYellow: '#FFCC00' // Cảnh báo chú ý
colors.functional.neutralGray: '#F7F7F8'   // Nền, đường viền
```

##### Semantic Colors
```typescript
colors.semantic.success: '#3EBB6C'  // Thành công
colors.semantic.error: '#F50000'    // Lỗi
colors.semantic.warning: '#FFCC00'  // Cảnh báo
colors.semantic.info: '#0068FF'     // Thông tin
```

##### Text Colors
```typescript
colors.text.primary: '#000000'     // Văn bản chính
colors.text.secondary: '#666666'   // Văn bản phụ
colors.text.disabled: '#CCCCCC'    // Văn bản disabled
colors.text.inverse: '#FFFFFF'     // Văn bản trên nền tối
```

##### Background Colors
```typescript
colors.background.primary: '#FFFFFF'   // Nền chính
colors.background.secondary: '#F7F7F8' // Nền phụ
colors.background.tertiary: '#F0F0F0'  // Nền card
```

#### Functions

##### `getSemanticColor(type: SemanticColorType): string`

Lấy màu semantic theo loại.

**Parameters:**
- `type`: `'success' | 'error' | 'warning' | 'info'`

**Returns:** Hex color string

**Example:**
```typescript
const successColor = getSemanticColor('success'); // '#3EBB6C'
```

##### `getStatusColor(status: StatusType): string`

Lấy màu theo trạng thái.

**Parameters:**
- `status`: `'normal' | 'warning' | 'danger'`

**Returns:** Hex color string

**Example:**
```typescript
const dangerColor = getStatusColor('danger'); // '#F50000'
```

##### `getValidatedColor(color: string): string`

Validate và trả về màu hợp lệ.

**Parameters:**
- `color`: Hex color string

**Returns:** Validated hex color string

**Throws:** Error nếu màu không hợp lệ

**Example:**
```typescript
const validColor = getValidatedColor('#0068FF'); // '#0068FF'
getValidatedColor('#FF0000'); // Throws error
```

##### `hexToRgb(hex: string): { r: number; g: number; b: number }`

Chuyển đổi hex sang RGB object.

**Example:**
```typescript
const rgb = hexToRgb('#0068FF'); // { r: 0, g: 104, b: 255 }
```

##### `hexToRgbString(hex: string): string`

Chuyển đổi hex sang RGB string.

**Example:**
```typescript
const rgbString = hexToRgbString('#0068FF'); // 'rgb(0, 104, 255)'
```

---

### Typography

**Import:**
```typescript
import { 
  typography, 
  getPlatformFontFamily, 
  createTypographyStyle,
  getResponsiveFontSize 
} from '@/design-system/tokens/typography';
```

#### Typography Scale

##### Font Sizes
```typescript
typography.fontSize.h1: '22px'      // Tiêu đề màn hình
typography.fontSize.h2: '18px'      // Tiêu đề mục
typography.fontSize.body: '16px'    // Nội dung chính
typography.fontSize.caption: '14px' // Chú thích
typography.fontSize.small: '12px'   // Thông tin phụ
```

##### Font Weights
```typescript
typography.fontWeight.regular: 400
typography.fontWeight.medium: 500
typography.fontWeight.semibold: 600
typography.fontWeight.bold: 700
```

##### Line Heights
```typescript
typography.lineHeight.tight: 1.2
typography.lineHeight.normal: 1.5
typography.lineHeight.relaxed: 1.75
```

#### Functions

##### `getPlatformFontFamily(): string`

Lấy font family phù hợp với platform.

**Returns:** Font family string

**Example:**
```typescript
const fontFamily = getPlatformFontFamily();
// iOS: '-apple-system, San Francisco'
// Android: 'Roboto, sans-serif'
```

##### `createTypographyStyle(variant: TypographyVariant, overrides?: Partial<CSSProperties>): CSSProperties`

Tạo style object cho typography.

**Parameters:**
- `variant`: `'h1' | 'h2' | 'body' | 'caption' | 'small'`
- `overrides`: Optional style overrides

**Returns:** CSS properties object

**Example:**
```typescript
const h1Style = createTypographyStyle('h1');
const boldBodyStyle = createTypographyStyle('body', { fontWeight: 700 });
```

##### `getResponsiveFontSize(baseSize: string, screenWidth: number): string`

Điều chỉnh font size theo màn hình.

**Example:**
```typescript
const responsiveSize = getResponsiveFontSize('16px', 375);
```

---

### Spacing

**Import:**
```typescript
import { spacing } from '@/design-system/tokens/spacing';
```

#### Spacing Scale

```typescript
spacing.xs: '4px'
spacing.sm: '8px'
spacing.md: '16px'
spacing.lg: '24px'
spacing.xl: '32px'
spacing.xxl: '48px'
```

**Example:**
```typescript
<div style={{ padding: spacing.md, margin: spacing.lg }}>
  Content
</div>
```

---

### Icons

**Import:**
```typescript
import { icons, getSensorIcon, getNavigationIcon } from '@/design-system/tokens/icons';
```

#### Icon Categories

##### Navigation Icons
```typescript
icons.navigation.home
icons.navigation.user
icons.navigation.settings
icons.navigation.notification
```

##### Agriculture Icons
```typescript
icons.agriculture.temperature
icons.agriculture.humidity
icons.agriculture.light
icons.agriculture.alert
icons.agriculture.plant
icons.agriculture.farm
```

##### Action Icons
```typescript
icons.action.add
icons.action.edit
icons.action.delete
icons.action.search
icons.action.filter
icons.action.camera
icons.action.check
icons.action.info
```

#### Functions

##### `getSensorIcon(type: SensorType): string`

Lấy icon cho sensor type.

**Parameters:**
- `type`: `'temperature' | 'humidity' | 'light' | 'ph' | 'soilMoisture'`

**Returns:** Icon name string

**Example:**
```typescript
const tempIcon = getSensorIcon('temperature'); // 'thermometer'
```

---

## Components

### Button

**Import:**
```typescript
import { Button } from '@/design-system/components/Button';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'text'` | `'primary'` | Button style variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |
| `disabled` | `boolean` | `false` | Disable button |
| `loading` | `boolean` | `false` | Show loading spinner |
| `icon` | `React.ReactNode` | - | Icon element |
| `children` | `React.ReactNode` | **Required** | Button content |
| `onClick` | `() => void` | - | Click handler |
| `className` | `string` | `''` | Additional CSS classes |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type |
| `aria-label` | `string` | - | Accessibility label |

#### Example

```typescript
<Button variant="primary" onClick={handleClick}>
  Xác nhận
</Button>

<Button variant="secondary" size="large" loading>
  Đang xử lý...
</Button>

<Button variant="outline" disabled>
  Không khả dụng
</Button>
```

---

### Card

**Import:**
```typescript
import { Card } from '@/design-system/components/Card';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Card title |
| `subtitle` | `string` | - | Card subtitle |
| `image` | `string` | - | Image URL |
| `status` | `'success' \| 'warning' \| 'error'` | - | Status indicator |
| `children` | `React.ReactNode` | - | Card content |
| `onClick` | `() => void` | - | Click handler |
| `className` | `string` | `''` | Additional CSS classes |

#### Example

```typescript
<Card 
  title="Farm Lab A"
  subtitle="Sầu riêng Monthong"
  status="success"
  onClick={handleCardClick}
>
  <p>Diện tích: 2 hecta</p>
</Card>
```

---

### Alert

**Import:**
```typescript
import { Alert } from '@/design-system/components/Alert';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `severity` | `'info' \| 'warning' \| 'error' \| 'success'` | **Required** | Alert severity |
| `title` | `string` | - | Alert title |
| `message` | `string` | **Required** | Alert message |
| `action` | `{ label: string; onClick: () => void }` | - | Action button |
| `dismissible` | `boolean` | `false` | Show dismiss button |
| `onDismiss` | `() => void` | - | Dismiss handler |
| `className` | `string` | `''` | Additional CSS classes |

#### Example

```typescript
<Alert 
  severity="error"
  title="Nhiệt độ cao"
  message="Nhiệt độ vượt ngưỡng 35°C"
  action={{
    label: "Xem chi tiết",
    onClick: handleViewDetails
  }}
  dismissible
  onDismiss={handleDismiss}
/>
```

---

### SensorDisplay

**Import:**
```typescript
import { SensorDisplay } from '@/design-system/components/SensorDisplay';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'temperature' \| 'humidity' \| 'light' \| 'ph' \| 'soilMoisture'` | **Required** | Sensor type |
| `value` | `number` | **Required** | Sensor value |
| `unit` | `string` | **Required** | Unit of measurement |
| `status` | `'normal' \| 'warning' \| 'danger'` | `'normal'` | Status indicator |
| `isImputed` | `boolean` | `false` | Data is imputed |
| `timestamp` | `Date` | - | Reading timestamp |
| `className` | `string` | `''` | Additional CSS classes |

#### Example

```typescript
<SensorDisplay
  type="temperature"
  value={28}
  unit="°C"
  status="normal"
  timestamp={new Date()}
/>

<SensorDisplay
  type="humidity"
  value={45}
  unit="%"
  status="warning"
  isImputed
/>
```

---

### Chart

**Import:**
```typescript
import { Chart } from '@/design-system/components/Chart';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'line' \| 'bar' \| 'area'` | **Required** | Chart type |
| `data` | `ChartData[]` | **Required** | Chart data |
| `xAxis` | `AxisConfig` | - | X-axis configuration |
| `yAxis` | `AxisConfig` | - | Y-axis configuration |
| `colors` | `string[]` | - | Custom colors |
| `showGrid` | `boolean` | `true` | Show grid lines |
| `showLegend` | `boolean` | `true` | Show legend |
| `className` | `string` | `''` | Additional CSS classes |

#### Types

```typescript
interface ChartData {
  x: string | number;
  y: number;
  label?: string;
}

interface AxisConfig {
  label?: string;
  min?: number;
  max?: number;
  format?: (value: number) => string;
}
```

#### Example

```typescript
<Chart
  type="line"
  data={[
    { x: '01/01', y: 28 },
    { x: '01/02', y: 30 },
    { x: '01/03', y: 27 }
  ]}
  xAxis={{ label: 'Ngày' }}
  yAxis={{ label: 'Nhiệt độ (°C)' }}
/>
```

---

### Icon

**Import:**
```typescript
import { Icon } from '@/design-system/components/Icon';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **Required** | Icon name |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Icon size |
| `color` | `string` | - | Icon color |
| `className` | `string` | `''` | Additional CSS classes |

#### Example

```typescript
<Icon name="thermometer" size="lg" color={colors.primary.agriGreen} />
<Icon name="home" size="md" />
```

---

### DigitalTwinViewer

**Import:**
```typescript
import { DigitalTwinViewer } from '@/design-system/components/DigitalTwinViewer';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `plantModel` | `PlantModel` | **Required** | Plant model data |
| `environmentData` | `EnvironmentData` | **Required** | Environment data |
| `growthStage` | `'seedling' \| 'vegetative' \| 'flowering' \| 'fruiting'` | **Required** | Growth stage |
| `health` | `'healthy' \| 'stressed' \| 'diseased'` | **Required** | Health status |
| `className` | `string` | `''` | Additional CSS classes |

#### Types

```typescript
interface PlantModel {
  id: string;
  type: string;
  age: number;
}

interface EnvironmentData {
  temperature: number;
  humidity: number;
  light: number;
}
```

#### Example

```typescript
<DigitalTwinViewer
  plantModel={{ id: '1', type: 'durian', age: 45 }}
  environmentData={{ temperature: 28, humidity: 75, light: 850 }}
  growthStage="flowering"
  health="healthy"
/>
```

---

## Layout Components

### ScreenLayout

**Import:**
```typescript
import { ScreenLayout } from '@/design-system/layouts/ScreenLayout';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `header` | `React.ReactNode` | - | Header content |
| `children` | `React.ReactNode` | **Required** | Main content |
| `footer` | `React.ReactNode` | - | Footer content |
| `navigation` | `React.ReactNode` | - | Navigation component |
| `className` | `string` | `''` | Additional CSS classes |

#### Example

```typescript
<ScreenLayout
  header={<Header title="Dashboard" />}
  navigation={<BottomNavigation />}
>
  <div>Main content</div>
</ScreenLayout>
```

---

### Header

**Import:**
```typescript
import { Header } from '@/design-system/layouts/Header';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Header title |
| `leftAction` | `React.ReactNode` | - | Left action button |
| `rightAction` | `React.ReactNode` | - | Right action button |
| `className` | `string` | `''` | Additional CSS classes |

#### Example

```typescript
<Header
  title="Farm Lab Dashboard"
  leftAction={<Icon name="menu" />}
  rightAction={<Icon name="notification" />}
/>
```

---

### BottomNavigation

**Import:**
```typescript
import { BottomNavigation } from '@/design-system/layouts/BottomNavigation';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `NavigationItem[]` | **Required** | Navigation items |
| `activeIndex` | `number` | `0` | Active item index |
| `onChange` | `(index: number) => void` | - | Change handler |
| `className` | `string` | `''` | Additional CSS classes |

#### Types

```typescript
interface NavigationItem {
  label: string;
  icon: string;
  badge?: number;
}
```

#### Example

```typescript
<BottomNavigation
  items={[
    { label: 'Trang chủ', icon: 'home' },
    { label: 'Giám sát', icon: 'monitor' },
    { label: 'Cảnh báo', icon: 'alert', badge: 3 },
    { label: 'Hồ sơ', icon: 'user' }
  ]}
  activeIndex={0}
  onChange={handleNavigationChange}
/>
```

---

### TabNavigation

**Import:**
```typescript
import { TabNavigation } from '@/design-system/layouts/TabNavigation';
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `TabItem[]` | **Required** | Tab items |
| `activeIndex` | `number` | `0` | Active tab index |
| `onChange` | `(index: number) => void` | - | Change handler |
| `className` | `string` | `''` | Additional CSS classes |

#### Types

```typescript
interface TabItem {
  label: string;
  badge?: number;
}
```

#### Example

```typescript
<TabNavigation
  tabs={[
    { label: 'Dashboard' },
    { label: 'Sản phẩm' },
    { label: 'Đơn hàng', badge: 5 }
  ]}
  activeIndex={0}
  onChange={handleTabChange}
/>
```

---

## Utilities

### Validators

**Import:**
```typescript
import { 
  isValidColor,
  isValidFontSize,
  meetsMinimumFontSize,
  meetsMinimumTouchTarget,
  validateComponent
} from '@/design-system/utils/validators';
```

#### Functions

##### `isValidColor(color: string): boolean`

Kiểm tra màu có hợp lệ không.

**Example:**
```typescript
isValidColor('#0068FF'); // true
isValidColor('#FF0000'); // false
```

##### `isValidFontSize(fontSize: string): boolean`

Kiểm tra font size có trong typography scale không.

**Example:**
```typescript
isValidFontSize('16px'); // true
isValidFontSize('15px'); // false
```

##### `meetsMinimumFontSize(fontSize: string, isImportant?: boolean): boolean`

Kiểm tra font size đáp ứng yêu cầu tối thiểu.

**Example:**
```typescript
meetsMinimumFontSize('14px', true); // true
meetsMinimumFontSize('12px', true); // false
```

##### `meetsMinimumTouchTarget(width: number, height: number): boolean`

Kiểm tra touch target đủ lớn (44x44px).

**Example:**
```typescript
meetsMinimumTouchTarget(44, 44); // true
meetsMinimumTouchTarget(40, 40); // false
```

##### `validateComponent(component: ComponentValidation): ValidationResult`

Validate toàn bộ component.

**Types:**
```typescript
interface ComponentValidation {
  color?: string;
  fontSize?: string;
  width?: number;
  height?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

**Example:**
```typescript
const result = validateComponent({
  color: '#0068FF',
  fontSize: '16px',
  width: 48,
  height: 48
});
// result.valid === true
```

---

### Theme

**Import:**
```typescript
import { 
  getPlatform,
  getPlatformTheme,
  createTheme
} from '@/design-system/utils/theme';
```

#### Functions

##### `getPlatform(): Platform`

Phát hiện platform hiện tại.

**Returns:** `'ios' | 'android' | 'unknown'`

**Example:**
```typescript
const platform = getPlatform();
```

##### `getPlatformTheme(): ThemeConfig`

Lấy theme cho platform hiện tại.

**Example:**
```typescript
const theme = getPlatformTheme();
```

##### `createTheme(config: Partial<ThemeConfig>): ThemeConfig`

Tạo custom theme.

**Example:**
```typescript
const customTheme = createTheme({
  name: 'custom-theme',
  colors: {
    // custom colors
  }
});
```

---

### Error Handling

**Import:**
```typescript
import { 
  handleError,
  createErrorBoundary,
  useErrorHandling
} from '@/design-system/utils/errorHandling';
```

#### Functions

##### `handleError(error: Error, context?: string): void`

Xử lý error với logging.

**Example:**
```typescript
try {
  // code
} catch (error) {
  handleError(error, 'Button component');
}
```

##### `createErrorBoundary(fallback: React.ReactNode): React.ComponentType`

Tạo Error Boundary component.

**Example:**
```typescript
const ErrorBoundary = createErrorBoundary(<div>Error occurred</div>);

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

##### `useErrorHandling(): ErrorHandlingHook`

React hook cho error handling.

**Example:**
```typescript
const { error, setError, clearError } = useErrorHandling();
```

---

### Spacing Utilities

**Import:**
```typescript
import { 
  getSpacing,
  createSpacingStyle,
  applySpacing
} from '@/design-system/utils/spacing';
```

#### Functions

##### `getSpacing(size: SpacingSize): string`

Lấy spacing value.

**Parameters:**
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'`

**Example:**
```typescript
const padding = getSpacing('md'); // '16px'
```

##### `createSpacingStyle(config: SpacingConfig): CSSProperties`

Tạo spacing style object.

**Example:**
```typescript
const style = createSpacingStyle({
  padding: 'md',
  margin: 'lg'
});
```

##### `applySpacing(element: HTMLElement, config: SpacingConfig): void`

Áp dụng spacing cho element.

**Example:**
```typescript
applySpacing(divElement, { padding: 'md' });
```

---

## Type Definitions

### Common Types

```typescript
// Color types
type SemanticColorType = 'success' | 'error' | 'warning' | 'info';
type StatusType = 'normal' | 'warning' | 'danger';

// Typography types
type TypographyVariant = 'h1' | 'h2' | 'body' | 'caption' | 'small';
type FontWeight = 400 | 500 | 600 | 700;

// Spacing types
type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

// Component types
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';
type AlertSeverity = 'info' | 'warning' | 'error' | 'success';
type SensorType = 'temperature' | 'humidity' | 'light' | 'ph' | 'soilMoisture';
type ChartType = 'line' | 'bar' | 'area';

// Platform types
type Platform = 'ios' | 'android' | 'unknown';
```

---

## Requirements Coverage

This API reference covers all requirements:

- **2.1-2.6**: Color system
- **3.1-3.6**: Typography system
- **4.1-4.6**: Icon system
- **8.1-8.5**: Design consistency
- **9.1-9.4**: Performance optimization
- **10.1-10.5**: Maintainability and extensibility

---

## See Also

- [Usage Examples](./USAGE_EXAMPLES.md)
- [Pattern Library](./PATTERN_LIBRARY.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Design System README](../src/design-system/README.md)
