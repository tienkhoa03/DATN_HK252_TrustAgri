# Zalo Mini App Design System - Documentation

Tài liệu đầy đủ cho Hệ thống Thiết kế Zalo Mini App Nông nghiệp.

## 📚 Documentation Overview

Hệ thống tài liệu được tổ chức theo các phần sau:

### 1. [API Reference](./API_REFERENCE.md)
Tài liệu tham khảo API đầy đủ cho tất cả components, tokens và utilities.

**Nội dung:**
- Design Tokens (Colors, Typography, Spacing, Icons)
- Components (Button, Card, Alert, SensorDisplay, Chart, etc.)
- Layout Components (ScreenLayout, Header, Navigation)
- Utilities (Validators, Theme, Error Handling)
- Type Definitions

**Khi nào sử dụng:** Khi cần tra cứu props, functions, hoặc API của component/utility cụ thể.

---

### 2. [Usage Examples](./USAGE_EXAMPLES.md)
Ví dụ thực tế về cách sử dụng design system.

**Nội dung:**
- Getting Started
- Design Tokens Examples
- Component Examples
- Layout Examples
- Screen Examples
- Common Patterns
- Best Practices

**Khi nào sử dụng:** Khi cần xem ví dụ code thực tế hoặc học cách implement một pattern cụ thể.

---

### 3. [Pattern Library](./PATTERN_LIBRARY.md)
Thư viện các pattern thiết kế và tương tác.

**Nội dung:**
- Navigation Patterns
- Layout Patterns
- Interaction Patterns
- Data Display Patterns
- Form Patterns
- Feedback Patterns
- Role-Specific Patterns

**Khi nào sử dụng:** Khi thiết kế screen mới hoặc implement tính năng phức tạp.

---

### 4. [Design Tokens](./DESIGN_TOKENS.md)
Tài liệu chi tiết về design tokens.

**Nội dung:**
- Color Tokens (Primary, Functional, Semantic, Text, Background)
- Typography Tokens (Font Families, Sizes, Weights, Line Heights)
- Spacing Tokens
- Icon Tokens
- Token Usage Guidelines
- Token Exports (CSS, JSON, Tailwind)

**Khi nào sử dụng:** Khi cần hiểu chi tiết về design tokens hoặc extend token system.

---

### 5. [Migration Guide](./MIGRATION_GUIDE.md)
Hướng dẫn migration từ phiên bản cũ hoặc custom implementation.

**Nội dung:**
- Migration from Custom Implementation
- Version Migration
- Breaking Changes
- Deprecation Timeline
- Migration Tools
- Common Issues

**Khi nào sử dụng:** Khi migrate từ code cũ sang design system hoặc upgrade version.

---

### 6. [Quick Reference](./QUICK_REFERENCE.md)
Cheat sheet nhanh cho developers.

**Nội dung:**
- Colors quick reference
- Typography quick reference
- Spacing quick reference
- Component quick usage
- Common patterns
- Accessibility guidelines
- Common issues and solutions

**Khi nào sử dụng:** Khi cần tra cứu nhanh syntax hoặc giá trị token.

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

### Basic Usage

```typescript
// Import design system
import { Button } from '@/design-system/components/Button';
import { colors } from '@/design-system/tokens/colors';
import { createTypographyStyle } from '@/design-system/tokens/typography';

// Use components
<Button variant="primary" onClick={handleClick}>
  Xác nhận
</Button>

// Use tokens
<div style={{
  color: colors.primary.zaloBlue,
  ...createTypographyStyle('h1')
}}>
  Heading
</div>
```

---

## 📖 Documentation Structure

```
docs/
├── README.md                 # This file - Documentation overview
├── API_REFERENCE.md          # Complete API reference
├── USAGE_EXAMPLES.md         # Practical usage examples
├── PATTERN_LIBRARY.md        # Design patterns library
├── DESIGN_TOKENS.md          # Design tokens documentation
└── MIGRATION_GUIDE.md        # Migration guide
```

---

## 🎯 Common Tasks

### Task 1: Create a New Screen

1. Read [Pattern Library](./PATTERN_LIBRARY.md) for layout patterns
2. Check [Usage Examples](./USAGE_EXAMPLES.md) for screen examples
3. Reference [API Reference](./API_REFERENCE.md) for component props
4. Use [Design Tokens](./DESIGN_TOKENS.md) for styling

### Task 2: Implement a Component

1. Check [API Reference](./API_REFERENCE.md) for component API
2. Review [Usage Examples](./USAGE_EXAMPLES.md) for implementation examples
3. Follow [Pattern Library](./PATTERN_LIBRARY.md) for interaction patterns
4. Use [Design Tokens](./DESIGN_TOKENS.md) for consistent styling

### Task 3: Style an Element

1. Check [Design Tokens](./DESIGN_TOKENS.md) for available tokens
2. Use [API Reference](./API_REFERENCE.md) for token utilities
3. Follow [Usage Examples](./USAGE_EXAMPLES.md) for best practices

### Task 4: Migrate Existing Code

1. Read [Migration Guide](./MIGRATION_GUIDE.md) for migration strategy
2. Use automated migration scripts
3. Reference [API Reference](./API_REFERENCE.md) for new APIs
4. Check [Usage Examples](./USAGE_EXAMPLES.md) for updated patterns

---

## 🎨 Design System Overview

### Design Principles

1. **Native-like Experience**: Giao diện như một phần tự nhiên của Zalo
2. **Farmer-First**: Tối ưu cho nông dân với quy tắc 3 lần chạm
3. **Visual Data**: Ưu tiên trực quan hóa thay vì bảng số liệu
4. **Performance**: Dung lượng < 20MB, tối ưu cho mạng 4G
5. **Consistency**: Nhất quán trên toàn bộ ứng dụng

### Key Features

- ✅ Complete design token system
- ✅ Comprehensive component library
- ✅ Layout components for all roles
- ✅ Validation utilities
- ✅ Error handling utilities
- ✅ Theme system with platform detection
- ✅ Accessibility support
- ✅ Performance optimization
- ✅ Property-based testing
- ✅ Full TypeScript support

### Requirements Coverage

- **2.1-2.6**: Color system với Zalo Blue, Agri Green, Alert Red, Warning Yellow, Neutral Gray
- **3.1-3.6**: Typography system với platform-specific fonts và minimum font size 14px
- **4.1-4.6**: Icon system với outline style và sensor icon mapping
- **8.1-8.5**: Design consistency và validation
- **9.1-9.4**: Performance optimization với system fonts và bundle size < 20MB
- **10.1-10.5**: Maintainability và extensibility

---

## 🔍 Finding Information

### By Topic

| Topic | Document |
|-------|----------|
| Component API | [API Reference](./API_REFERENCE.md) |
| Code Examples | [Usage Examples](./USAGE_EXAMPLES.md) |
| Design Patterns | [Pattern Library](./PATTERN_LIBRARY.md) |
| Design Tokens | [Design Tokens](./DESIGN_TOKENS.md) |
| Migration | [Migration Guide](./MIGRATION_GUIDE.md) |

### By Role

| Role | Relevant Sections |
|------|-------------------|
| **Developer** | API Reference, Usage Examples, Migration Guide |
| **Designer** | Design Tokens, Pattern Library |
| **Product Manager** | Pattern Library, Usage Examples |
| **QA Engineer** | Usage Examples, API Reference |

### By Component

| Component | API Reference | Examples | Patterns |
|-----------|---------------|----------|----------|
| Button | [API](./API_REFERENCE.md#button) | [Examples](./USAGE_EXAMPLES.md#example-5-button-component) | [Patterns](./PATTERN_LIBRARY.md) |
| Card | [API](./API_REFERENCE.md#card) | [Examples](./USAGE_EXAMPLES.md#example-6-card-component) | [Patterns](./PATTERN_LIBRARY.md) |
| Alert | [API](./API_REFERENCE.md#alert) | [Examples](./USAGE_EXAMPLES.md#example-7-alert-component) | [Patterns](./PATTERN_LIBRARY.md) |
| SensorDisplay | [API](./API_REFERENCE.md#sensordisplay) | [Examples](./USAGE_EXAMPLES.md#example-8-sensordisplay-component) | [Patterns](./PATTERN_LIBRARY.md#pattern-10-sensor-grid) |
| Chart | [API](./API_REFERENCE.md#chart) | [Examples](./USAGE_EXAMPLES.md#example-9-chart-component) | [Patterns](./PATTERN_LIBRARY.md) |

---

## 💡 Best Practices

### 1. Always Use Design Tokens

```typescript
// ❌ Don't
<div style={{ color: '#0068FF', fontSize: '16px' }}>Text</div>

// ✅ Do
<div style={{ 
  color: colors.primary.zaloBlue,
  fontSize: typography.fontSize.body 
}}>
  Text
</div>
```

### 2. Use Semantic Colors

```typescript
// ❌ Don't
<Alert style={{ backgroundColor: colors.functional.alertRed }} />

// ✅ Do
<Alert severity="error" />
// or
<Alert style={{ backgroundColor: colors.semantic.error }} />
```

### 3. Validate Components

```typescript
import { validateComponent } from '@/design-system/utils/validators';

const validation = validateComponent({
  color: colors.primary.zaloBlue,
  fontSize: typography.fontSize.body,
  width: 48,
  height: 48
});

if (!validation.valid) {
  console.warn('Component validation failed:', validation.errors);
}
```

### 4. Follow Accessibility Guidelines

```typescript
// Minimum touch target: 44x44px
<Button 
  variant="primary"
  aria-label="Xác nhận đơn hàng"
  style={{ minWidth: '44px', minHeight: '44px' }}
>
  Xác nhận
</Button>

// Minimum font size for important info: 14px
<p style={{ fontSize: typography.fontSize.caption }}>
  Important information
</p>
```

### 5. Use Error Boundaries

```typescript
import { createErrorBoundary } from '@/design-system/utils/errorHandling';

const ErrorBoundary = createErrorBoundary(<ErrorFallback />);

<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Property-Based Tests

```bash
# Run property-based tests
npm run test:property

# Run with specific iterations
npm run test:property -- --runs=100
```

### Visual Regression Tests

```bash
# Run visual regression tests
npm run test:visual

# Update snapshots
npm run test:visual -- --update
```

---

## 🛠️ Development

### Project Structure

```
src/design-system/
├── tokens/              # Design tokens
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── icons.ts
├── components/          # UI components
│   ├── Button/
│   ├── Card/
│   ├── Alert/
│   └── ...
├── layouts/            # Layout components
│   ├── ScreenLayout.tsx
│   ├── Header.tsx
│   └── Navigation.tsx
├── utils/              # Utilities
│   ├── validators.ts
│   ├── theme.ts
│   └── errorHandling.ts
└── index.ts            # Main entry point
```

### Adding New Components

1. Create component directory in `src/design-system/components/`
2. Implement component with TypeScript
3. Add unit tests
4. Add property-based tests (if applicable)
5. Create usage examples
6. Update documentation
7. Export from `index.ts`

### Adding New Tokens

1. Add token to appropriate file in `src/design-system/tokens/`
2. Update TypeScript types
3. Add validation rules
4. Update documentation
5. Generate exports (CSS, JSON, etc.)

---

## 📞 Support

### Getting Help

1. **Documentation**: Check this documentation first
2. **Examples**: Review [Usage Examples](./USAGE_EXAMPLES.md)
3. **API Reference**: Consult [API Reference](./API_REFERENCE.md)
4. **GitHub Issues**: Report bugs or request features
5. **Team Chat**: Ask in Slack/Teams channel

### Contributing

1. Read contribution guidelines
2. Follow code style
3. Write tests
4. Update documentation
5. Submit pull request

---

## 📝 Changelog

### v2.0.0 (Current)

**New Features:**
- Complete design token system
- Comprehensive component library
- Layout components
- Validation utilities
- Error handling utilities
- Theme system
- Property-based testing

**Breaking Changes:**
- Color token names changed
- Typography API updated
- Component prop renames

See [Migration Guide](./MIGRATION_GUIDE.md) for details.

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

- Zalo Mini App Platform
- Zaui Component Library
- Design System Community

---

**Last Updated:** December 2024

**Version:** 2.0.0

**Maintained by:** [Your Team Name]
