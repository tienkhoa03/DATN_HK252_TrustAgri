# Documentation Index

Complete index of all documentation for the Zalo Mini App Design System.

## 📚 Main Documentation

### Core Documentation

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| [README](./README.md) | Documentation overview and quick start | All |
| [API Reference](./API_REFERENCE.md) | Complete API documentation | Developers |
| [Usage Examples](./USAGE_EXAMPLES.md) | Practical code examples | Developers |
| [Pattern Library](./PATTERN_LIBRARY.md) | Design patterns and interactions | Designers, Developers |
| [Design Tokens](./DESIGN_TOKENS.md) | Design token documentation | Designers, Developers |
| [Migration Guide](./MIGRATION_GUIDE.md) | Migration instructions | Developers |

---

## 🎨 Design Tokens Documentation

### Colors
- **Location**: [Design Tokens - Color Tokens](./DESIGN_TOKENS.md#color-tokens)
- **Content**: Primary, Functional, Semantic, Text, Background colors
- **Requirements**: 2.1-2.6, 8.2

### Typography
- **Location**: [Design Tokens - Typography Tokens](./DESIGN_TOKENS.md#typography-tokens)
- **Content**: Font families, sizes, weights, line heights
- **Requirements**: 3.1-3.6, 8.3, 9.1

### Spacing
- **Location**: [Design Tokens - Spacing Tokens](./DESIGN_TOKENS.md#spacing-tokens)
- **Content**: Spacing scale (xs, sm, md, lg, xl, xxl)
- **Requirements**: 8.1

### Icons
- **Location**: [Design Tokens - Icon Tokens](./DESIGN_TOKENS.md#icon-tokens)
- **Content**: Navigation, Agriculture, Action icons
- **Requirements**: 4.1-4.6, 8.4

---

## 🧩 Component Documentation

### Core Components

| Component | API Reference | Examples | README |
|-----------|---------------|----------|--------|
| Button | [API](./API_REFERENCE.md#button) | [Examples](./USAGE_EXAMPLES.md#example-5-button-component) | [README](../src/design-system/components/Button/README.md) |
| Card | [API](./API_REFERENCE.md#card) | [Examples](./USAGE_EXAMPLES.md#example-6-card-component) | [README](../src/design-system/components/Card/README.md) |
| Alert | [API](./API_REFERENCE.md#alert) | [Examples](./USAGE_EXAMPLES.md#example-7-alert-component) | [README](../src/design-system/components/Alert/README.md) |
| SensorDisplay | [API](./API_REFERENCE.md#sensordisplay) | [Examples](./USAGE_EXAMPLES.md#example-8-sensordisplay-component) | [README](../src/design-system/components/SensorDisplay/README.md) |
| Chart | [API](./API_REFERENCE.md#chart) | [Examples](./USAGE_EXAMPLES.md#example-9-chart-component) | [README](../src/design-system/components/Chart/README.md) |
| Icon | [API](./API_REFERENCE.md#icon) | [Examples](./USAGE_EXAMPLES.md#example-4-using-icons) | [README](../src/design-system/components/Icon/README.md) |
| DigitalTwinViewer | [API](./API_REFERENCE.md#digitaltwinviewer) | - | [README](../src/design-system/components/DigitalTwinViewer/README.md) |

### Layout Components

| Component | API Reference | Examples | README |
|-----------|---------------|----------|--------|
| ScreenLayout | [API](./API_REFERENCE.md#screenlayout) | [Examples](./USAGE_EXAMPLES.md#example-10-screen-layout) | [README](../src/design-system/layouts/README.md) |
| Header | [API](./API_REFERENCE.md#header) | [Examples](./USAGE_EXAMPLES.md#example-10-screen-layout) | [README](../src/design-system/layouts/README.md) |
| BottomNavigation | [API](./API_REFERENCE.md#bottomnavigation) | [Examples](./USAGE_EXAMPLES.md#example-10-screen-layout) | [README](../src/design-system/layouts/README.md) |
| TabNavigation | [API](./API_REFERENCE.md#tabnavigation) | [Examples](./USAGE_EXAMPLES.md#example-11-tab-navigation) | [README](../src/design-system/layouts/README.md) |

---

## 🛠️ Utilities Documentation

### Validators
- **Location**: [API Reference - Validators](./API_REFERENCE.md#validators)
- **Content**: Color, font size, touch target validation
- **README**: [Validators README](../src/design-system/utils/VALIDATORS_README.md)

### Theme
- **Location**: [API Reference - Theme](./API_REFERENCE.md#theme)
- **Content**: Platform detection, theme configuration
- **README**: [Theme README](../src/design-system/utils/THEME_README.md)

### Error Handling
- **Location**: [API Reference - Error Handling](./API_REFERENCE.md#error-handling)
- **Content**: Error boundaries, error handling hooks
- **README**: [Error Handling README](../src/design-system/utils/ERROR_HANDLING_README.md)

### Spacing Utilities
- **Location**: [API Reference - Spacing Utilities](./API_REFERENCE.md#spacing-utilities)
- **Content**: Spacing helpers, style creation
- **README**: [Spacing README](../src/design-system/utils/SPACING_README.md)

---

## 📐 Pattern Documentation

### Navigation Patterns
- **Location**: [Pattern Library - Navigation Patterns](./PATTERN_LIBRARY.md#navigation-patterns)
- **Patterns**: Bottom Navigation, Tab Navigation, 3-Click Rule

### Layout Patterns
- **Location**: [Pattern Library - Layout Patterns](./PATTERN_LIBRARY.md#layout-patterns)
- **Patterns**: Dashboard, Detail View, List with Filters

### Interaction Patterns
- **Location**: [Pattern Library - Interaction Patterns](./PATTERN_LIBRARY.md#interaction-patterns)
- **Patterns**: Pull to Refresh, Infinite Scroll, Swipe Actions

### Data Display Patterns
- **Location**: [Pattern Library - Data Display Patterns](./PATTERN_LIBRARY.md#data-display-patterns)
- **Patterns**: Sensor Grid, Status Timeline, Comparison Table

### Form Patterns
- **Location**: [Pattern Library - Form Patterns](./PATTERN_LIBRARY.md#form-patterns)
- **Patterns**: Multi-Step Form, Inline Validation

### Feedback Patterns
- **Location**: [Pattern Library - Feedback Patterns](./PATTERN_LIBRARY.md#feedback-patterns)
- **Patterns**: Loading States, Empty States, Success/Error Feedback

### Role-Specific Patterns
- **Location**: [Pattern Library - Role-Specific Patterns](./PATTERN_LIBRARY.md#role-specific-patterns)
- **Patterns**: Farmer Alert Priority, Trader Compliance, Buyer Traceability

---

## 🔄 Migration Documentation

### Migration Paths

| From | To | Guide Section |
|------|----|--------------| 
| Custom Implementation | Design System | [Migration from Custom](./MIGRATION_GUIDE.md#migration-from-custom-implementation) |
| v1.0 | v2.0 | [Version Migration](./MIGRATION_GUIDE.md#from-v10-to-v20) |

### Migration Tools

| Tool | Purpose | Documentation |
|------|---------|---------------|
| Color Migration | Update color tokens | [Migration Tools](./MIGRATION_GUIDE.md#1-color-migration) |
| Typography Migration | Update typography API | [Migration Tools](./MIGRATION_GUIDE.md#2-typography-migration) |
| Props Migration | Update component props | [Migration Tools](./MIGRATION_GUIDE.md#3-component-props-migration) |

---

## 📖 Usage Examples by Category

### Getting Started
- [Installation](./USAGE_EXAMPLES.md#installation)
- [Basic Setup](./USAGE_EXAMPLES.md#basic-setup)

### Design Tokens
- [Using Colors](./USAGE_EXAMPLES.md#example-1-using-colors)
- [Using Typography](./USAGE_EXAMPLES.md#example-2-using-typography)
- [Using Spacing](./USAGE_EXAMPLES.md#example-3-using-spacing)
- [Using Icons](./USAGE_EXAMPLES.md#example-4-using-icons)

### Components
- [Button Examples](./USAGE_EXAMPLES.md#example-5-button-component)
- [Card Examples](./USAGE_EXAMPLES.md#example-6-card-component)
- [Alert Examples](./USAGE_EXAMPLES.md#example-7-alert-component)
- [SensorDisplay Examples](./USAGE_EXAMPLES.md#example-8-sensordisplay-component)
- [Chart Examples](./USAGE_EXAMPLES.md#example-9-chart-component)

### Layouts
- [Screen Layout](./USAGE_EXAMPLES.md#example-10-screen-layout)
- [Tab Navigation](./USAGE_EXAMPLES.md#example-11-tab-navigation)

### Screens
- [Farmer Monitoring](./USAGE_EXAMPLES.md#example-12-farmer-monitoring-screen)
- [Trader Dashboard](./USAGE_EXAMPLES.md#example-13-trader-dashboard-screen)
- [Buyer Product Detail](./USAGE_EXAMPLES.md#example-14-buyer-product-detail-screen)

### Common Patterns
- [Form with Validation](./USAGE_EXAMPLES.md#pattern-1-form-with-validation)
- [Loading State](./USAGE_EXAMPLES.md#pattern-2-loading-state)
- [Error Boundary](./USAGE_EXAMPLES.md#pattern-3-error-boundary)
- [Responsive Grid](./USAGE_EXAMPLES.md#pattern-4-responsive-grid)
- [3-Click Rule](./USAGE_EXAMPLES.md#pattern-5-3-click-rule-implementation)

---

## 🎯 Quick Reference by Task

### "I want to..."

| Task | Documentation |
|------|---------------|
| Create a new screen | [Pattern Library](./PATTERN_LIBRARY.md), [Usage Examples - Screens](./USAGE_EXAMPLES.md#screen-examples) |
| Style an element | [Design Tokens](./DESIGN_TOKENS.md), [API Reference - Tokens](./API_REFERENCE.md#design-tokens) |
| Use a component | [API Reference - Components](./API_REFERENCE.md#components), [Usage Examples](./USAGE_EXAMPLES.md#component-examples) |
| Implement a pattern | [Pattern Library](./PATTERN_LIBRARY.md), [Usage Examples](./USAGE_EXAMPLES.md#common-patterns) |
| Migrate existing code | [Migration Guide](./MIGRATION_GUIDE.md) |
| Validate my code | [API Reference - Validators](./API_REFERENCE.md#validators) |
| Handle errors | [API Reference - Error Handling](./API_REFERENCE.md#error-handling) |
| Create a theme | [API Reference - Theme](./API_REFERENCE.md#theme) |

---

## 📊 Requirements Coverage

### By Requirement Category

| Category | Requirements | Documentation |
|----------|--------------|---------------|
| Colors | 2.1-2.6, 8.2 | [Design Tokens - Colors](./DESIGN_TOKENS.md#color-tokens) |
| Typography | 3.1-3.6, 8.3, 9.1 | [Design Tokens - Typography](./DESIGN_TOKENS.md#typography-tokens) |
| Icons | 4.1-4.6, 8.4 | [Design Tokens - Icons](./DESIGN_TOKENS.md#icon-tokens) |
| Spacing | 8.1 | [Design Tokens - Spacing](./DESIGN_TOKENS.md#spacing-tokens) |
| Components | 8.1-8.5, 9.4 | [API Reference - Components](./API_REFERENCE.md#components) |
| Performance | 9.1-9.4 | [Design System README](../src/design-system/README.md#requirements-coverage) |
| Extensibility | 10.1-10.5 | [Migration Guide](./MIGRATION_GUIDE.md) |

---

## 🔍 Search Index

### By Keyword

| Keyword | Relevant Documentation |
|---------|------------------------|
| Color, Colors | [Design Tokens - Colors](./DESIGN_TOKENS.md#color-tokens), [API Reference - Colors](./API_REFERENCE.md#colors) |
| Typography, Font | [Design Tokens - Typography](./DESIGN_TOKENS.md#typography-tokens), [API Reference - Typography](./API_REFERENCE.md#typography) |
| Spacing, Margin, Padding | [Design Tokens - Spacing](./DESIGN_TOKENS.md#spacing-tokens), [API Reference - Spacing](./API_REFERENCE.md#spacing) |
| Icon, Icons | [Design Tokens - Icons](./DESIGN_TOKENS.md#icon-tokens), [API Reference - Icons](./API_REFERENCE.md#icons) |
| Button | [API Reference - Button](./API_REFERENCE.md#button), [Usage Examples - Button](./USAGE_EXAMPLES.md#example-5-button-component) |
| Card | [API Reference - Card](./API_REFERENCE.md#card), [Usage Examples - Card](./USAGE_EXAMPLES.md#example-6-card-component) |
| Alert | [API Reference - Alert](./API_REFERENCE.md#alert), [Usage Examples - Alert](./USAGE_EXAMPLES.md#example-7-alert-component) |
| Sensor | [API Reference - SensorDisplay](./API_REFERENCE.md#sensordisplay), [Pattern Library - Sensor Grid](./PATTERN_LIBRARY.md#pattern-10-sensor-grid) |
| Chart | [API Reference - Chart](./API_REFERENCE.md#chart), [Usage Examples - Chart](./USAGE_EXAMPLES.md#example-9-chart-component) |
| Layout | [API Reference - Layout](./API_REFERENCE.md#layout-components), [Pattern Library - Layout](./PATTERN_LIBRARY.md#layout-patterns) |
| Navigation | [API Reference - Navigation](./API_REFERENCE.md#bottomnavigation), [Pattern Library - Navigation](./PATTERN_LIBRARY.md#navigation-patterns) |
| Validation | [API Reference - Validators](./API_REFERENCE.md#validators) |
| Theme | [API Reference - Theme](./API_REFERENCE.md#theme) |
| Error | [API Reference - Error Handling](./API_REFERENCE.md#error-handling) |
| Migration | [Migration Guide](./MIGRATION_GUIDE.md) |
| Pattern | [Pattern Library](./PATTERN_LIBRARY.md) |
| Example | [Usage Examples](./USAGE_EXAMPLES.md) |

---

## 📝 Documentation Maintenance

### Update Frequency

| Document | Update Trigger |
|----------|----------------|
| API Reference | When API changes |
| Usage Examples | When new patterns emerge |
| Pattern Library | When new patterns are established |
| Design Tokens | When tokens are added/changed |
| Migration Guide | When breaking changes occur |

### Documentation Checklist

When adding new features:

- [ ] Update API Reference
- [ ] Add usage examples
- [ ] Update pattern library (if applicable)
- [ ] Update design tokens (if applicable)
- [ ] Update migration guide (if breaking changes)
- [ ] Update component README
- [ ] Update this index

---

## 🔗 External Resources

- [Zalo Mini App Documentation](https://mini.zalo.me/docs/)
- [Zaui Component Library](https://zaui.zalo.me/)
- [Design System Principles](https://www.designsystems.com/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** December 2024

**Maintained by:** Design System Team
