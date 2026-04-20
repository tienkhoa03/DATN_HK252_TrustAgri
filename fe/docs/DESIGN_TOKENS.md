# Design Tokens Documentation

Tài liệu chi tiết về Design Tokens - các giá trị thiết kế cơ bản của hệ thống.

## Table of Contents

- [What are Design Tokens?](#what-are-design-tokens)
- [Color Tokens](#color-tokens)
- [Typography Tokens](#typography-tokens)
- [Spacing Tokens](#spacing-tokens)
- [Icon Tokens](#icon-tokens)
- [Token Usage Guidelines](#token-usage-guidelines)
- [Token Exports](#token-exports)

---

## What are Design Tokens?

Design tokens là các giá trị thiết kế được đặt tên và tái sử dụng trong toàn bộ hệ thống. Chúng đảm bảo tính nhất quán và dễ bảo trì.

### Benefits

- **Consistency**: Đảm bảo giao diện nhất quán
- **Maintainability**: Dễ cập nhật và bảo trì
- **Scalability**: Dễ mở rộng hệ thống
- **Documentation**: Tự động tạo documentation
- **Multi-platform**: Export sang nhiều format

### Token Structure

```typescript
interface DesignToken {
  name: string;        // Token name
  value: any;          // Token value
  category: string;    // Token category
  usage: string;       // Usage description
  requirements: string[]; // Related requirements
}
```

---

## Color Tokens

### Primary Colors

Màu sắc chính của ứng dụng.

| Token | Value | Usage | Requirements |
|-------|-------|-------|--------------|
| `colors.primary.zaloBlue` | `#0068FF` | Nút hành động chính, links, active states | 2.1 |
| `colors.primary.agriGreen` | `#3EBB6C` | Trạng thái tốt, nông nghiệp, success states | 2.2 |

**Example:**
```typescript
import { colors } from '@/design-system/tokens/colors';

<Button style={{ backgroundColor: colors.primary.zaloBlue }}>
  Xác nhận
</Button>
```

### Functional Colors

Màu sắc chức năng cho các trạng thái cụ thể.

| Token | Value | Usage | Requirements |
|-------|-------|-------|--------------|
| `colors.functional.alertRed` | `#F50000` | Cảnh báo nguy hiểm, errors | 2.3 |
| `colors.functional.warningYellow` | `#FFCC00` | Cảnh báo chú ý, warnings | 2.4 |
| `colors.functional.neutralGray` | `#F7F7F8` | Nền, đường viền, disabled states | 2.5 |

**Example:**
```typescript
<Alert style={{ backgroundColor: colors.functional.alertRed }}>
  Nhiệt độ cao!
</Alert>
```

### Semantic Colors

Màu sắc ngữ nghĩa dựa trên functional colors.

| Token | Value | Derived From | Usage |
|-------|-------|--------------|-------|
| `colors.semantic.success` | `#3EBB6C` | `agriGreen` | Success messages, positive states |
| `colors.semantic.error` | `#F50000` | `alertRed` | Error messages, negative states |
| `colors.semantic.warning` | `#FFCC00` | `warningYellow` | Warning messages, caution states |
| `colors.semantic.info` | `#0068FF` | `zaloBlue` | Info messages, neutral states |

**Example:**
```typescript
import { getSemanticColor } from '@/design-system/tokens/colors';

const statusColor = getSemanticColor('success'); // #3EBB6C
```

### Text Colors

Màu sắc cho văn bản.

| Token | Value | Usage |
|-------|-------|-------|
| `colors.text.primary` | `#000000` | Văn bản chính |
| `colors.text.secondary` | `#666666` | Văn bản phụ, mô tả |
| `colors.text.disabled` | `#CCCCCC` | Văn bản disabled |
| `colors.text.inverse` | `#FFFFFF` | Văn bản trên nền tối |

**Example:**
```typescript
<p style={{ color: colors.text.primary }}>Main text</p>
<p style={{ color: colors.text.secondary }}>Secondary text</p>
```

### Background Colors

Màu sắc nền.

| Token | Value | Usage |
|-------|-------|-------|
| `colors.background.primary` | `#FFFFFF` | Nền chính |
| `colors.background.secondary` | `#F7F7F8` | Nền phụ, sections |
| `colors.background.tertiary` | `#F0F0F0` | Nền card, elevated surfaces |

**Example:**
```typescript
<div style={{ backgroundColor: colors.background.secondary }}>
  Content
</div>
```

### Color Utilities

#### `getSemanticColor(type: SemanticColorType): string`

Lấy màu semantic.

```typescript
const successColor = getSemanticColor('success');
const errorColor = getSemanticColor('error');
const warningColor = getSemanticColor('warning');
const infoColor = getSemanticColor('info');
```

#### `getStatusColor(status: StatusType): string`

Lấy màu theo trạng thái.

```typescript
const normalColor = getStatusColor('normal');    // #3EBB6C
const warningColor = getStatusColor('warning');  // #FFCC00
const dangerColor = getStatusColor('danger');    // #F50000
```

#### `getValidatedColor(color: string): string`

Validate và trả về màu hợp lệ.

```typescript
try {
  const validColor = getValidatedColor('#0068FF'); // OK
  const invalidColor = getValidatedColor('#FF0000'); // Throws error
} catch (error) {
  console.error('Invalid color');
}
```

#### `hexToRgb(hex: string): { r: number; g: number; b: number }`

Chuyển đổi hex sang RGB.

```typescript
const rgb = hexToRgb('#0068FF');
// { r: 0, g: 104, b: 255 }
```

#### `hexToRgbString(hex: string): string`

Chuyển đổi hex sang RGB string.

```typescript
const rgbString = hexToRgbString('#0068FF');
// 'rgb(0, 104, 255)'
```

---

## Typography Tokens

### Font Families

Platform-specific font families.

| Token | Value | Platform | Requirements |
|-------|-------|----------|--------------|
| `typography.fontFamily.ios` | `'-apple-system, San Francisco'` | iOS | 3.1 |
| `typography.fontFamily.android` | `'Roboto, sans-serif'` | Android | 3.2 |
| `typography.fontFamily.system` | `'-apple-system, Roboto, sans-serif'` | All | 9.1 |

**Example:**
```typescript
import { getPlatformFontFamily } from '@/design-system/tokens/typography';

const fontFamily = getPlatformFontFamily();
// iOS: '-apple-system, San Francisco'
// Android: 'Roboto, sans-serif'
```

### Font Sizes

Typography scale for consistent sizing.

| Token | Value | Usage | Requirements |
|-------|-------|-------|--------------|
| `typography.fontSize.h1` | `'22px'` | Tiêu đề màn hình, tên Farm Lab | 3.3 |
| `typography.fontSize.h2` | `'18px'` | Tiêu đề mục, tên chỉ số | 3.4 |
| `typography.fontSize.body` | `'16px'` | Nội dung chính | 3.5 |
| `typography.fontSize.caption` | `'14px'` | Chú thích, label (minimum for important info) | 3.6 |
| `typography.fontSize.small` | `'12px'` | Thông tin phụ, metadata | - |

**Example:**
```typescript
<h1 style={{ fontSize: typography.fontSize.h1 }}>
  Farm Lab Dashboard
</h1>
```

### Font Weights

Font weight scale.

| Token | Value | Usage |
|-------|-------|-------|
| `typography.fontWeight.regular` | `400` | Văn bản thông thường |
| `typography.fontWeight.medium` | `500` | Nhấn mạnh nhẹ |
| `typography.fontWeight.semibold` | `600` | Tiêu đề phụ |
| `typography.fontWeight.bold` | `700` | Tiêu đề chính |

**Example:**
```typescript
<p style={{ fontWeight: typography.fontWeight.bold }}>
  Bold text
</p>
```

### Line Heights

Line height scale for readability.

| Token | Value | Usage |
|-------|-------|-------|
| `typography.lineHeight.tight` | `1.2` | Tiêu đề, headings |
| `typography.lineHeight.normal` | `1.5` | Nội dung thông thường |
| `typography.lineHeight.relaxed` | `1.75` | Văn bản dài, paragraphs |

**Example:**
```typescript
<p style={{ lineHeight: typography.lineHeight.normal }}>
  Normal line height text
</p>
```

### Typography Utilities

#### `createTypographyStyle(variant: TypographyVariant, overrides?: Partial<CSSProperties>): CSSProperties`

Tạo complete typography style.

```typescript
// Basic usage
const h1Style = createTypographyStyle('h1');

// With overrides
const boldBodyStyle = createTypographyStyle('body', {
  fontWeight: typography.fontWeight.bold,
  color: colors.primary.zaloBlue
});

// Apply to element
<h1 style={createTypographyStyle('h1')}>Heading</h1>
```

#### `getResponsiveFontSize(baseSize: string, screenWidth: number): string`

Điều chỉnh font size theo màn hình.

```typescript
const responsiveSize = getResponsiveFontSize('16px', 375);
// Screens < 360px: Scale down (minimum 14px)
// Screens 360-414px: Keep original
// Screens > 414px: Scale up slightly
```

#### `isValidTypographyScale(fontSize: string): boolean`

Kiểm tra font size có trong scale không.

```typescript
isValidTypographyScale('16px'); // true
isValidTypographyScale('15px'); // false
```

#### `validateMinimumFontSize(fontSize: string, isImportant: boolean): ValidationResult`

Validate minimum font size.

```typescript
const result = validateMinimumFontSize('14px', true);
// { valid: true }

const result2 = validateMinimumFontSize('12px', true);
// { valid: false, error: 'Font size 12px is below minimum 14px for important information' }
```

#### `getNearestValidFontSize(fontSize: string): string`

Tìm font size hợp lệ gần nhất.

```typescript
getNearestValidFontSize('15px'); // '16px'
getNearestValidFontSize('20px'); // '22px'
```

---

## Spacing Tokens

Spacing scale for consistent layout.

| Token | Value | Usage | Multiplier |
|-------|-------|-------|------------|
| `spacing.xs` | `'4px'` | Minimal spacing, tight layouts | 0.25x |
| `spacing.sm` | `'8px'` | Small spacing, compact elements | 0.5x |
| `spacing.md` | `'16px'` | Default spacing, standard gaps | 1x (base) |
| `spacing.lg` | `'24px'` | Large spacing, section separation | 1.5x |
| `spacing.xl` | `'32px'` | Extra large spacing, major sections | 2x |
| `spacing.xxl` | `'48px'` | Maximum spacing, screen margins | 3x |

**Example:**
```typescript
import { spacing } from '@/design-system/tokens/spacing';

<div style={{
  padding: spacing.md,
  margin: spacing.lg,
  gap: spacing.sm
}}>
  Content
</div>
```

### Spacing Utilities

#### `getSpacing(size: SpacingSize): string`

Lấy spacing value.

```typescript
const padding = getSpacing('md'); // '16px'
const margin = getSpacing('lg');  // '24px'
```

#### `createSpacingStyle(config: SpacingConfig): CSSProperties`

Tạo spacing style object.

```typescript
const style = createSpacingStyle({
  padding: 'md',
  margin: 'lg',
  gap: 'sm'
});

// Result:
// {
//   padding: '16px',
//   margin: '24px',
//   gap: '8px'
// }
```

---

## Icon Tokens

### Navigation Icons

Icons từ Zaui library cho navigation.

| Token | Icon Name | Usage |
|-------|-----------|-------|
| `icons.navigation.home` | `'home'` | Home navigation |
| `icons.navigation.user` | `'user'` | User profile |
| `icons.navigation.settings` | `'settings'` | Settings |
| `icons.navigation.notification` | `'notification'` | Notifications |

**Example:**
```typescript
import { Icon } from '@/design-system/components/Icon';

<Icon name={icons.navigation.home} size="md" />
```

### Agriculture Icons

Custom agriculture icons (outline style).

| Token | Icon Name | Usage | Requirements |
|-------|-----------|-------|--------------|
| `icons.agriculture.temperature` | `'thermometer'` | Temperature sensor | 4.3 |
| `icons.agriculture.humidity` | `'droplet'` | Humidity sensor | 4.4 |
| `icons.agriculture.light` | `'sun'` | Light sensor | 4.5 |
| `icons.agriculture.alert` | `'alert-triangle'` | Alert/warning | 4.6 |
| `icons.agriculture.plant` | `'plant'` | Plant/crop |
| `icons.agriculture.farm` | `'farm'` | Farm/field |

**Example:**
```typescript
import { getSensorIcon } from '@/design-system/tokens/icons';

const tempIcon = getSensorIcon('temperature'); // 'thermometer'
```

### Action Icons

Icons for common actions.

| Token | Icon Name | Usage |
|-------|-----------|-------|
| `icons.action.add` | `'plus'` | Add/create |
| `icons.action.edit` | `'edit'` | Edit |
| `icons.action.delete` | `'trash'` | Delete |
| `icons.action.search` | `'search'` | Search |
| `icons.action.filter` | `'filter'` | Filter |
| `icons.action.camera` | `'camera'` | Camera/photo |
| `icons.action.check` | `'check'` | Confirm/success |
| `icons.action.info` | `'info'` | Information |

### Icon Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `icons.sizes.sm` | `'16px'` | Small icons, inline with text |
| `icons.sizes.md` | `'24px'` | Default icons |
| `icons.sizes.lg` | `'32px'` | Large icons, emphasis |

**Example:**
```typescript
<Icon name="thermometer" size="lg" />
```

### Icon Utilities

#### `getSensorIcon(type: SensorType): string`

Lấy icon name cho sensor type.

```typescript
const tempIcon = getSensorIcon('temperature');  // 'thermometer'
const humidIcon = getSensorIcon('humidity');    // 'droplet'
const lightIcon = getSensorIcon('light');       // 'sun'
```

#### `getNavigationIcon(type: NavigationType): string`

Lấy icon name cho navigation type.

```typescript
const homeIcon = getNavigationIcon('home');     // 'home'
const userIcon = getNavigationIcon('user');     // 'user'
```

---

## Token Usage Guidelines

### 1. Always Use Tokens

❌ **Không nên:**
```typescript
<div style={{ color: '#0068FF', fontSize: '16px', padding: '16px' }}>
  Content
</div>
```

✅ **Nên:**
```typescript
<div style={{ 
  color: colors.primary.zaloBlue,
  fontSize: typography.fontSize.body,
  padding: spacing.md
}}>
  Content
</div>
```

### 2. Use Semantic Tokens

❌ **Không nên:**
```typescript
<Alert style={{ backgroundColor: colors.functional.alertRed }} />
```

✅ **Nên:**
```typescript
<Alert style={{ backgroundColor: colors.semantic.error }} />
```

### 3. Validate Token Usage

```typescript
import { validateComponent } from '@/design-system/utils/validators';

const validation = validateComponent({
  color: colors.primary.zaloBlue,
  fontSize: typography.fontSize.body
});

if (!validation.valid) {
  console.warn('Invalid token usage:', validation.errors);
}
```

### 4. Document Custom Tokens

Nếu cần thêm custom tokens:

```typescript
// Document the token
/**
 * Custom color for special feature
 * @category Custom
 * @usage Special feature backgrounds
 * @requirements CUSTOM-1
 */
const customColor = '#FF6B6B';

// Better: Extend the token system
import { extendColorPalette } from '@/design-system/tokens/colors';

extendColorPalette({
  custom: {
    specialFeature: '#FF6B6B'
  }
});
```

---

## Token Exports

Design tokens được export sang nhiều format.

### JavaScript/TypeScript

```typescript
import { colors, typography, spacing, icons } from '@/design-system/tokens';
```

### CSS Variables

```css
/* Generated at: src/design-system/tokens/exports/colors.css */
:root {
  --color-primary-zalo-blue: #0068FF;
  --color-primary-agri-green: #3EBB6C;
  --color-semantic-success: #3EBB6C;
  /* ... */
}

/* Usage */
.button-primary {
  background-color: var(--color-primary-zalo-blue);
}
```

### JSON

```json
// Generated at: src/design-system/tokens/exports/colors.json
{
  "primary": {
    "zaloBlue": "#0068FF",
    "agriGreen": "#3EBB6C"
  },
  "semantic": {
    "success": "#3EBB6C",
    "error": "#F50000"
  }
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      'zalo-blue': '#0068FF',
      'agri-green': '#3EBB6C',
      // ...
    }
  }
}
```

### Generate Exports

```bash
# Generate all exports
npm run tokens:export

# Generate specific format
npm run tokens:export:css
npm run tokens:export:json
npm run tokens:export:tailwind
```

---

## See Also

- [API Reference](./API_REFERENCE.md)
- [Usage Examples](./USAGE_EXAMPLES.md)
- [Pattern Library](./PATTERN_LIBRARY.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
