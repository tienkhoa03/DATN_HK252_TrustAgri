# Visual Regression Testing Guide

## Overview

Visual regression testing is a critical part of our design system quality assurance process. It helps us catch unintended visual changes and ensures consistency across all components and screens.

## What is Visual Regression Testing?

Visual regression testing compares screenshots of your application against baseline images to detect visual changes. When a test runs:

1. The test navigates to a page or component
2. Takes a screenshot
3. Compares it to the baseline screenshot
4. Reports any differences

## Why Visual Regression Testing?

For the Zalo UI Design System, visual regression testing ensures:

- **Design Token Compliance**: Colors, typography, and spacing are applied correctly
- **Component Consistency**: Components look the same across different contexts
- **Screen Layout Integrity**: Screens maintain their intended layout
- **Cross-Device Compatibility**: UI renders correctly on different screen sizes
- **Regression Prevention**: Changes don't accidentally break existing UI

## Requirements Validated

This testing setup validates Requirements 8.1-8.5:

- **8.1**: Component library consistency
- **8.2**: Color palette compliance  
- **8.3**: Typography consistency
- **8.4**: Icon style consistency
- **8.5**: Interaction pattern consistency

## Test Coverage

### Components
- Button (all variants: primary, secondary, outline, text)
- Card (with and without images)
- Alert (all severity levels: info, warning, error, success)
- SensorDisplay (temperature, humidity, light)
- Icon (navigation and agriculture icons)
- Chart (line, bar, area)
- DigitalTwinViewer

### Screens

**Farmer Role:**
- Dashboard
- Process & Diary
- Market Connect
- Contracts
- Farm Profile

**Trader Role:**
- Dashboard
- Supply Monitor
- Trading Orders
- Standard Library
- Profile & News

**Buyer Role:**
- Marketplace
- Product Detail
- Digital Twin Monitor
- Orders & Proposals
- Post Buying Request
- Profile & Notification

**Guest Role:**
- Home & Market News
- Traceability Scan Result
- Product Detail

### Screen Sizes
- **360px**: Small Android devices (Pixel 5)
- **375px**: iPhone SE, iPhone 12/13 mini
- **414px**: iPhone 12 Pro Max, iPhone 13 Pro Max

## Setup

### Installation

Playwright is already installed as a dev dependency. To install the browsers:

```bash
npx playwright install
```

### Configuration

Visual regression testing is configured in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,      // Maximum pixel difference
    threshold: 0.2,          // 20% color difference threshold
  },
}
```

## Running Tests

### Basic Commands

Run all visual regression tests:
```bash
npm run test:visual
```

Run tests in headed mode (see the browser):
```bash
npm run test:visual:headed
```

Run tests in debug mode:
```bash
npm run test:visual:debug
```

View test report:
```bash
npm run test:visual:report
```

### Advanced Commands

Run tests for specific screen size:
```bash
npm run test:visual -- --project=mobile-360-chrome
npm run test:visual -- --project=mobile-375-safari
npm run test:visual -- --project=mobile-414-safari
```

Run specific test file:
```bash
npm run test:visual -- components.spec.ts
npm run test:visual -- screens.spec.ts
npm run test:visual -- design-tokens.spec.ts
```

Run specific test:
```bash
npm run test:visual -- -g "Button Component"
```

## First Time Setup

When running tests for the first time:

1. **Generate Baselines**: Run tests to create baseline screenshots
   ```bash
   npm run test:visual
   ```

2. **Review Baselines**: Check the generated screenshots in `src/tests/visual/__screenshots__/`

3. **Commit Baselines**: Add baseline screenshots to version control
   ```bash
   git add src/tests/visual/__screenshots__/
   git commit -m "Add visual regression test baselines"
   ```

## Updating Baselines

When you make intentional visual changes:

1. **Update All Baselines**:
   ```bash
   npm run test:visual:update
   ```

2. **Update Specific Test**:
   ```bash
   npm run test:visual:update -- components.spec.ts
   ```

3. **Review Changes**: Check the diff to ensure changes are intentional

4. **Commit Updated Baselines**:
   ```bash
   git add src/tests/visual/__screenshots__/
   git commit -m "Update visual regression baselines for [feature]"
   ```

## Understanding Test Results

### Passing Tests
✅ Screenshot matches baseline within threshold

### Failing Tests
❌ Screenshot differs from baseline

When a test fails:
1. Review the diff image in `playwright-report/`
2. Determine if the change is intentional or a bug
3. If intentional: update baseline
4. If bug: fix the code and re-run tests

### Test Report

The HTML report shows:
- Test results for each screen size
- Visual diffs for failed tests
- Actual vs Expected screenshots
- Detailed error messages

Access the report:
```bash
npm run test:visual:report
```

## Best Practices

### 1. Stable Test Environment

- **Wait for Loading**: Always wait for images, fonts, and animations
- **Hide Dynamic Content**: Hide timestamps, random IDs, etc.
- **Consistent State**: Ensure app is in consistent state before screenshot

### 2. Meaningful Test Names

```typescript
// Good
test('Button primary variant renders correctly', ...)

// Bad
test('test1', ...)
```

### 3. Appropriate Thresholds

- Use higher threshold for complex components with gradients
- Use lower threshold for simple components with solid colors
- Adjust `maxDiffPixels` based on component size

### 4. Test Organization

- Group related tests in `describe` blocks
- Keep test files focused (components, screens, tokens)
- Use helper functions for common operations

### 5. Review Process

- Always review visual diffs before updating baselines
- Get team approval for significant visual changes
- Document reasons for baseline updates in commit messages

## Troubleshooting

### Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solutions**:
- Increase wait times
- Use `waitForLoadState('networkidle')`
- Hide dynamic content
- Disable animations during testing

### Font Rendering Differences

**Problem**: Text looks different on different machines

**Solutions**:
- Use system fonts (already configured)
- Run tests in Docker for consistency
- Use CI/CD for consistent environment

### Image Loading Issues

**Problem**: Images not loaded when screenshot is taken

**Solutions**:
- Use `waitForImages()` helper
- Increase timeout
- Check network conditions

### Animation Timing

**Problem**: Screenshots captured mid-animation

**Solutions**:
- Use `waitForAnimations()` helper
- Add explicit waits after interactions
- Disable animations in test environment

### Color Differences

**Problem**: Colors slightly different between runs

**Solutions**:
- Adjust threshold in config
- Check for color interpolation in CSS
- Ensure consistent color space (RGB)

## CI/CD Integration

Visual regression tests run automatically on:
- Every pull request
- Every push to main/develop branches

### GitHub Actions Workflow

The workflow:
1. Installs dependencies
2. Installs Playwright browsers
3. Runs tests on all screen sizes
4. Uploads test reports and screenshots
5. Comments on PR if tests fail

### Viewing CI Results

1. Go to the Actions tab in GitHub
2. Click on the workflow run
3. Download artifacts to view screenshots and reports

## Adding New Tests

### For New Components

1. Add test case to `src/tests/visual/components.spec.ts`:

```typescript
test.describe('NewComponent', () => {
  test('should match snapshot - default state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const component = page.locator('[data-testid="new-component"]');
    await expect(component).toHaveScreenshot('new-component-default.png');
  });
});
```

2. Run tests to generate baseline
3. Review and commit baseline screenshots

### For New Screens

1. Add test case to `src/tests/visual/screens.spec.ts`:

```typescript
test('New Screen', async ({ page }) => {
  await page.goto('/new-screen');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('new-screen.png', {
    fullPage: true,
  });
});
```

2. Run tests to generate baseline
3. Review and commit baseline screenshots

## Maintenance

### Regular Tasks

- **Weekly**: Review test coverage for new components
- **Monthly**: Clean up old/unused snapshots
- **Quarterly**: Review and adjust thresholds
- **Per Release**: Update baselines for intentional changes

### Snapshot Management

Keep snapshots organized:
- Use descriptive names
- Group by component/screen
- Remove snapshots for deleted features
- Document major baseline updates

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Visual Testing Guide](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)

## Support

For questions or issues:
1. Check this documentation
2. Review Playwright docs
3. Check existing test examples
4. Ask the team in #design-system channel
