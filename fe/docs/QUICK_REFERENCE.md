# Quick Reference Card

Cheat sheet nhanh cho Zalo Mini App Design System.

## 🎨 Colors

```typescript
import { colors } from '@/design-system/tokens/colors';

// Primary
colors.primary.zaloBlue    // #0068FF
colors.primary.agriGreen   // #3EBB6C

// Semantic
colors.semantic.success    // #3EBB6C
colors.semantic.error      // #F50000
colors.semantic.warning    // #FFCC00
colors.semantic.info       // #0068FF

// Text
colors.text.primary        // #000000
colors.text.secondary      // #666666
colors.text.inverse        // #FFFFFF
```

## 📝 Typography

```typescript
import { typography, createTypographyStyle } from '@/design-system/tokens/typography';

// Font Sizes
typography.fontSize.h1      // 22px
typography.fontSize.h2      // 18px
typography.fontSize.body    // 16px
typography.fontSize.caption // 14px

// Usage
<h1 style={createTypographyStyle('h1')}>Heading</h1>
```

## 📏 Spacing

```typescript
import { spacing } from '@/design-system/tokens/spacing';

spacing.xs   // 4px
spacing.sm   // 8px
spacing.md   // 16px (base)
spacing.lg   // 24px
spacing.xl   // 32px
spacing.xxl  // 48px
```

## 🔘 Button

```typescript
import { Button } from '@/design-system/components/Button';

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="text">Text</Button>

// With props
<Button 
  variant="primary" 
  size="large"
  loading={isLoading}
  disabled={isDisabled}
  icon={<Icon name="add" />}
  onClick={handleClick}
>
  Submit
</Button>
```

## 🃏 Card

```typescript
import { Card } from '@/design-system/components/Card';

<Card
  title="Title"
  subtitle="Subtitle"
  image="url"
  status="success"
  onClick={handleClick}
>
  Content
</Card>
```

## ⚠️ Alert

```typescript
import { Alert } from '@/design-system/components/Alert';

<Alert
  severity="error"
  title="Error"
  message="Something went wrong"
  action={{ label: "Retry", onClick: handleRetry }}
  dismissible
  onDismiss={handleDismiss}
/>
```

## 🌡️ SensorDisplay

```typescript
import { SensorDisplay } from '@/design-system/components/SensorDisplay';

<SensorDisplay
  type="temperature"
  value={28}
  unit="°C"
  status="normal"
  timestamp={new Date()}
/>
```

## 📊 Chart

```typescript
import { Chart } from '@/design-system/components/Chart';

<Chart
  type="line"
  data={[{ x: '01/01', y: 28 }, { x: '01/02', y: 30 }]}
  xAxis={{ label: 'Date' }}
  yAxis={{ label: 'Temperature (°C)' }}
/>
```

## 🖼️ Layout

```typescript
import { ScreenLayout, Header, BottomNavigation } from '@/design-system/layouts';

<ScreenLayout
  header={<Header title="Title" />}
  navigation={<BottomNavigation items={navItems} />}
>
  <Content />
</ScreenLayout>
```

## ✅ Validation

```typescript
import { 
  isValidColor,
  isValidFontSize,
  meetsMinimumTouchTarget,
  validateComponent
} from '@/design-system/utils/validators';

isValidColor('#0068FF');              // true
isValidFontSize('16px');              // true
meetsMinimumTouchTarget(44, 44);      // true

const result = validateComponent({
  color: '#0068FF',
  fontSize: '16px',
  width: 48,
  height: 48
});
```

## 🎭 Theme

```typescript
import { getPlatform, getPlatformTheme } from '@/design-system/utils/theme';

const platform = getPlatform();        // 'ios' | 'android'
const theme = getPlatformTheme();      // Platform-specific theme
```

## 🚨 Error Handling

```typescript
import { 
  handleError,
  createErrorBoundary,
  useErrorHandling
} from '@/design-system/utils/errorHandling';

// Handle error
try {
  // code
} catch (error) {
  handleError(error, 'Component name');
}

// Error boundary
const ErrorBoundary = createErrorBoundary(<Fallback />);

// Hook
const { error, setError, clearError } = useErrorHandling();
```

## 🔧 Common Patterns

### Form with Validation
```typescript
const [errors, setErrors] = useState([]);

const handleSubmit = () => {
  const validation = validateComponent({ /* ... */ });
  if (!validation.valid) {
    setErrors(validation.errors);
    return;
  }
  // Submit
};
```

### Loading State
```typescript
const [loading, setLoading] = useState(true);

if (loading) {
  return <LoadingSpinner />;
}
return <Content />;
```

### Responsive Grid
```typescript
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: spacing.md
}}>
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

## 📱 Screen Sizes

```
Small:  360px - 375px
Medium: 375px - 390px
Large:  390px - 414px
```

## ♿ Accessibility

```typescript
// Minimum touch target
minWidth: '44px'
minHeight: '44px'

// Minimum font size (important info)
fontSize: '14px'

// ARIA labels
<Button aria-label="Confirm order">Confirm</Button>
```

## 🎯 3-Click Rule

Critical information must be accessible within 3 clicks:
1. Click navigation
2. View list/overview
3. Click item for details

## 📚 Documentation Links

- [API Reference](./API_REFERENCE.md)
- [Usage Examples](./USAGE_EXAMPLES.md)
- [Pattern Library](./PATTERN_LIBRARY.md)
- [Design Tokens](./DESIGN_TOKENS.md)
- [Migration Guide](./MIGRATION_GUIDE.md)

## 🆘 Common Issues

### Color not found
```typescript
// ❌ Wrong
colors.blue

// ✅ Correct
colors.primary.zaloBlue
```

### Typography not applied
```typescript
// ❌ Wrong
getTypographyStyle('heading1')

// ✅ Correct
createTypographyStyle('h1')
```

### Button props error
```typescript
// ❌ Wrong
<Button type="primary" />

// ✅ Correct
<Button variant="primary" />
```

## 💡 Best Practices

1. **Always use design tokens**
2. **Use semantic colors**
3. **Validate components**
4. **Follow accessibility guidelines**
5. **Use error boundaries**
6. **Test on multiple screen sizes**
7. **Follow 3-click rule**
8. **Use platform-specific fonts**

---

**Version:** 2.0.0
**Last Updated:** December 2024
