# Migration Guide - Zalo Mini App Design System

Hướng dẫn migration từ các phiên bản cũ hoặc từ custom implementation sang Design System.

## Table of Contents

- [Overview](#overview)
- [Migration from Custom Implementation](#migration-from-custom-implementation)
- [Version Migration](#version-migration)
- [Breaking Changes](#breaking-changes)
- [Deprecation Timeline](#deprecation-timeline)
- [Migration Tools](#migration-tools)

---

## Overview

### Why Migrate?

- **Consistency**: Đảm bảo giao diện nhất quán trên toàn bộ ứng dụng
- **Maintainability**: Dễ bảo trì và cập nhật
- **Performance**: Tối ưu hóa bundle size và loading time
- **Accessibility**: Tuân thủ accessibility standards
- **Documentation**: Tài liệu đầy đủ và examples

### Migration Strategy

1. **Audit**: Đánh giá code hiện tại
2. **Plan**: Lập kế hoạch migration
3. **Incremental**: Migration từng phần
4. **Test**: Test kỹ lưỡng
5. **Deploy**: Deploy và monitor

---

## Migration from Custom Implementation

### Step 1: Install Design System

```bash
# Nếu chưa có
npm install @/design-system

# Hoặc
yarn add @/design-system
```

### Step 2: Replace Custom Colors

**Before:**
```typescript
const styles = {
  primaryButton: {
    backgroundColor: '#0068FF',
    color: '#FFFFFF'
  },
  successText: {
    color: '#3EBB6C'
  }
};
```

**After:**
```typescript
import { colors } from '@/design-system/tokens/colors';

const styles = {
  primaryButton: {
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse
  },
  successText: {
    color: colors.semantic.success
  }
};
```

### Step 3: Replace Custom Typography

**Before:**
```typescript
const heading = {
  fontSize: '22px',
  fontWeight: 700,
  fontFamily: 'San Francisco, Roboto'
};
```

**After:**
```typescript
import { createTypographyStyle } from '@/design-system/tokens/typography';

const heading = createTypographyStyle('h1');
```

### Step 4: Replace Custom Components

**Before:**
```typescript
const CustomButton = ({ children, onClick }) => (
  <button
    style={{
      backgroundColor: '#0068FF',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px'
    }}
    onClick={onClick}
  >
    {children}
  </button>
);
```

**After:**
```typescript
import { Button } from '@/design-system/components/Button';

<Button variant="primary" onClick={onClick}>
  {children}
</Button>
```

### Step 5: Update Layouts

**Before:**
```typescript
const Screen = () => (
  <div>
    <div className="header">Header</div>
    <div className="content">Content</div>
    <div className="footer">Footer</div>
  </div>
);
```

**After:**
```typescript
import { ScreenLayout, Header } from '@/design-system/layouts';

const Screen = () => (
  <ScreenLayout header={<Header title="Title" />}>
    <div>Content</div>
  </ScreenLayout>
);
```

---

## Version Migration

### From v1.0 to v2.0

#### Breaking Changes

1. **Color Token Names Changed**

**Before (v1.0):**
```typescript
colors.blue    // Primary blue
colors.green   // Success green
```

**After (v2.0):**
```typescript
colors.primary.zaloBlue
colors.semantic.success
```

**Migration:**
```typescript
// Find and replace
colors.blue → colors.primary.zaloBlue
colors.green → colors.semantic.success
colors.red → colors.semantic.error
colors.yellow → colors.semantic.warning
```

2. **Typography Function Signature Changed**

**Before (v1.0):**
```typescript
getTypographyStyle('heading1')
```

**After (v2.0):**
```typescript
createTypographyStyle('h1')
```

**Migration:**
```typescript
// Find and replace
getTypographyStyle('heading1') → createTypographyStyle('h1')
getTypographyStyle('heading2') → createTypographyStyle('h2')
getTypographyStyle('body') → createTypographyStyle('body')
```

3. **Button Props Changed**

**Before (v1.0):**
```typescript
<Button type="primary" />
```

**After (v2.0):**
```typescript
<Button variant="primary" />
```

**Migration:**
```typescript
// Find and replace
<Button type= → <Button variant=
```

#### New Features in v2.0

- Added `SensorDisplay` component
- Added `DigitalTwinViewer` component
- Added `Chart` component
- Added validation utilities
- Added error handling utilities

#### Deprecated in v2.0

- `getTypographyStyle()` → Use `createTypographyStyle()`
- `Button.type` prop → Use `Button.variant`
- `colors.blue` → Use `colors.primary.zaloBlue`

---

### From v2.0 to v3.0 (Future)

#### Planned Changes

1. **Icon System Update**
   - Migration to new icon library
   - Automatic icon name mapping

2. **Layout System Enhancement**
   - New responsive layout utilities
   - Grid system improvements

3. **Theme System**
   - Support for custom themes
   - Dark mode support

---

## Breaking Changes

### v2.0.0 (Current)

#### 1. Color System Restructure

**Impact:** High
**Affected:** All components using colors

**Migration Steps:**
1. Run migration script: `npm run migrate:colors`
2. Review automated changes
3. Test visual appearance
4. Update custom styles

**Example:**
```typescript
// Before
const style = { color: colors.blue };

// After
const style = { color: colors.primary.zaloBlue };
```

#### 2. Typography API Change

**Impact:** Medium
**Affected:** Components using typography utilities

**Migration Steps:**
1. Replace `getTypographyStyle` with `createTypographyStyle`
2. Update variant names
3. Test text rendering

**Example:**
```typescript
// Before
const style = getTypographyStyle('heading1');

// After
const style = createTypographyStyle('h1');
```

#### 3. Component Prop Renames

**Impact:** Low
**Affected:** Button, Alert components

**Migration Steps:**
1. Find and replace prop names
2. Update TypeScript types
3. Test component behavior

**Example:**
```typescript
// Before
<Button type="primary" />
<Alert type="error" />

// After
<Button variant="primary" />
<Alert severity="error" />
```

---

## Deprecation Timeline

### Deprecated in v2.0 (Remove in v4.0)

| Feature | Deprecated | Remove | Alternative |
|---------|-----------|--------|-------------|
| `getTypographyStyle()` | v2.0 | v4.0 | `createTypographyStyle()` |
| `Button.type` | v2.0 | v4.0 | `Button.variant` |
| `colors.blue` | v2.0 | v4.0 | `colors.primary.zaloBlue` |
| `Alert.type` | v2.0 | v4.0 | `Alert.severity` |

### How to Handle Deprecations

1. **Check Deprecation Warnings**
```typescript
// Console will show:
// Warning: getTypographyStyle is deprecated. Use createTypographyStyle instead.
```

2. **Update Code Gradually**
```typescript
// Step 1: Add new API alongside old
const style = createTypographyStyle('h1'); // New
// const style = getTypographyStyle('heading1'); // Old (commented)

// Step 2: Test thoroughly

// Step 3: Remove old code
```

3. **Use Codemods**
```bash
npm run codemod:typography
npm run codemod:colors
npm run codemod:button-props
```

---

## Migration Tools

### Automated Migration Scripts

#### 1. Color Migration

```bash
npm run migrate:colors
```

**What it does:**
- Finds all color references
- Updates to new color tokens
- Generates migration report

**Example Output:**
```
Migrating colors...
✓ Updated 45 color references
✓ Found 3 custom colors (manual review needed)
✓ Generated report: migration-report.json
```

#### 2. Typography Migration

```bash
npm run migrate:typography
```

**What it does:**
- Replaces `getTypographyStyle` with `createTypographyStyle`
- Updates variant names
- Fixes import statements

#### 3. Component Props Migration

```bash
npm run migrate:props
```

**What it does:**
- Updates Button `type` to `variant`
- Updates Alert `type` to `severity`
- Updates other prop renames

### Manual Migration Checklist

```markdown
## Pre-Migration
- [ ] Backup current code
- [ ] Review breaking changes
- [ ] Plan migration strategy
- [ ] Set up test environment

## Migration
- [ ] Run automated migration scripts
- [ ] Review automated changes
- [ ] Update custom implementations
- [ ] Fix TypeScript errors
- [ ] Update tests

## Post-Migration
- [ ] Run all tests
- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Monitor for issues
```

### Migration Validation

#### 1. Visual Regression Testing

```bash
npm run test:visual
```

**Checks:**
- Component appearance
- Layout consistency
- Color accuracy
- Typography rendering

#### 2. Unit Test Updates

```typescript
// Update test imports
import { Button } from '@/design-system/components/Button';
import { colors } from '@/design-system/tokens/colors';

// Update test assertions
expect(button).toHaveStyle({
  backgroundColor: colors.primary.zaloBlue // Updated
});
```

#### 3. Integration Testing

```bash
npm run test:integration
```

**Checks:**
- Component interactions
- Navigation flows
- Data flow
- Error handling

---

## Common Migration Issues

### Issue 1: Color Not Found

**Error:**
```
Cannot read property 'blue' of undefined
```

**Solution:**
```typescript
// Before
colors.blue

// After
colors.primary.zaloBlue
```

### Issue 2: Typography Style Not Applied

**Error:**
```
getTypographyStyle is not a function
```

**Solution:**
```typescript
// Update import
import { createTypographyStyle } from '@/design-system/tokens/typography';

// Update usage
createTypographyStyle('h1')
```

### Issue 3: Button Props Type Error

**Error:**
```
Property 'type' does not exist on type 'ButtonProps'
```

**Solution:**
```typescript
// Before
<Button type="primary" />

// After
<Button variant="primary" />
```

### Issue 4: Custom Colors Not Validated

**Error:**
```
Invalid color: #FF0000. Must use colors from the defined palette.
```

**Solution:**
```typescript
// Option 1: Use semantic color
colors.semantic.error // Instead of #FF0000

// Option 2: Extend color palette (if needed)
import { extendColorPalette } from '@/design-system/tokens/colors';

extendColorPalette({
  custom: {
    myRed: '#FF0000'
  }
});
```

---

## Migration Support

### Getting Help

1. **Documentation**
   - [API Reference](./API_REFERENCE.md)
   - [Usage Examples](./USAGE_EXAMPLES.md)
   - [Pattern Library](./PATTERN_LIBRARY.md)

2. **Migration Scripts**
   ```bash
   npm run migrate:help
   ```

3. **Validation Tools**
   ```bash
   npm run validate:design-system
   ```

4. **Community**
   - GitHub Issues
   - Slack Channel
   - Email Support

### Migration Timeline Recommendation

**Small Project (< 10 screens):**
- Week 1: Audit and plan
- Week 2: Migrate tokens and components
- Week 3: Test and deploy

**Medium Project (10-30 screens):**
- Week 1-2: Audit and plan
- Week 3-5: Incremental migration
- Week 6: Testing
- Week 7: Deploy and monitor

**Large Project (> 30 screens):**
- Month 1: Audit, plan, and setup
- Month 2-3: Incremental migration by module
- Month 4: Integration testing
- Month 5: Deploy and monitor

---

## Post-Migration

### Validation Checklist

```markdown
- [ ] All colors from design system
- [ ] All typography using design tokens
- [ ] All components from design system
- [ ] No custom implementations
- [ ] All tests passing
- [ ] Visual regression tests passing
- [ ] Performance metrics acceptable
- [ ] Accessibility compliance
- [ ] Documentation updated
```

### Monitoring

After migration, monitor:

1. **Performance Metrics**
   - Bundle size
   - Load time
   - Render performance

2. **Error Tracking**
   - Console errors
   - Runtime errors
   - Validation errors

3. **User Feedback**
   - Visual issues
   - Interaction problems
   - Accessibility issues

---

## See Also

- [API Reference](./API_REFERENCE.md)
- [Usage Examples](./USAGE_EXAMPLES.md)
- [Pattern Library](./PATTERN_LIBRARY.md)
- [Design System README](../src/design-system/README.md)
