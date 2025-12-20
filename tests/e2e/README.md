# FlowCraft E2E Tests

Comprehensive end-to-end tests for FlowCraft Chrome extension using Playwright.

## Overview

The E2E test suite validates critical user flows by testing the extension in a real Chrome browser environment. These tests ensure that:

- The popup UI works correctly
- Rules can be created, edited, and deleted
- Form validation works as expected
- Data persists across sessions
- The extension behaves correctly in real-world scenarios

## Test Suites

### 1. Basic Popup Tests (`popup-basic.spec.ts`)

Tests fundamental popup functionality:

- ✅ Popup opens successfully
- ✅ Correct dimensions (600x500px)
- ✅ Empty state displays correctly
- ✅ "New Rule" button works
- ✅ Modal opens and closes
- ✅ Validation errors display

### 2. Rule Management Tests (`rule-management.spec.ts`)

Tests CRUD operations on rules:

- ✅ Create header modification rules
- ✅ Create URL redirection rules
- ✅ Create block request rules
- ✅ Toggle rules on/off
- ✅ Edit existing rules
- ✅ Delete rules with confirmation
- ✅ Create multiple rules

### 3. Validation Tests (`validation.spec.ts`)

Tests form validation logic:

- ✅ Required field validation (name, pattern)
- ✅ URL format validation for exact match
- ✅ Wildcard pattern support
- ✅ Regex pattern validation
- ✅ Redirect URL validation
- ✅ Header name validation
- ✅ Error clearing on correction
- ✅ Priority validation

### 4. Persistence Tests (`persistence.spec.ts`)

Tests data storage and persistence:

- ✅ Rules persist after closing/reopening popup
- ✅ Enabled/disabled state persists
- ✅ Multiple rules persist correctly
- ✅ Header modifications persist
- ✅ Redirect URLs persist
- ✅ Data integrity across operations
- ✅ Special characters handling
- ✅ Direct storage verification

## Prerequisites

### Install Playwright Browsers

```bash
npx playwright install chromium
```

**Note:** E2E tests require non-headless Chrome, so they cannot run in headless CI environments without special configuration.

### Build the Extension

The tests load the extension from the project root, so ensure the extension is built:

```bash
npm run type-check
```

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
npx playwright test popup-basic
npx playwright test rule-management
npx playwright test validation
npx playwright test persistence
```

### Run in UI Mode (Interactive)

```bash
npx playwright test --ui
```

This opens the Playwright UI where you can:
- Watch tests run in real-time
- Debug failing tests
- Inspect the DOM
- View screenshots and traces

### Run with Debugging

```bash
npx playwright test --debug
```

Opens Playwright Inspector for step-by-step debugging.

### Run and Keep Browser Open

```bash
npx playwright test --headed
```

Useful for watching tests execute in the browser.

## Test Configuration

See `playwright.config.ts` for configuration details:

- **Test directory:** `./tests/e2e`
- **Workers:** 1 (sequential execution required for extensions)
- **Headless:** false (Chrome extensions require headed mode)
- **Timeout:** 30 seconds per test
- **Retries:** 2 in CI, 0 locally

## Extension Loading

Tests use a custom utility (`extension-utils.ts`) to:

1. Load the extension from the project root
2. Extract the extension ID from chrome://extensions
3. Navigate to extension pages (popup, options)
4. Interact with Chrome storage APIs

## Writing New Tests

### Test Structure

```typescript
import { test, expect, chromium, BrowserContext } from '@playwright/test';
import { ExtensionUtils } from './extension-utils';

test.describe('My Feature', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-extensions-except=' + process.cwd(),
        '--load-extension=' + process.cwd(),
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    context = await browser.newContext();
    extensionId = await ExtensionUtils.getExtensionId(context);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);
    await ExtensionUtils.clearStorage(page);
    await page.close();
  });

  test('should do something', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Your test logic here

    await page.close();
  });
});
```

### Utility Functions

Use `ExtensionUtils` for common operations:

```typescript
// Get extension ID
const extensionId = await ExtensionUtils.getExtensionId(context);

// Open popup
const page = await ExtensionUtils.openPopup(context, extensionId);

// Open options page
const page = await ExtensionUtils.openOptions(context, extensionId);

// Clear storage
await ExtensionUtils.clearStorage(page);

// Get rules from storage
const rules = await ExtensionUtils.getRules(page);

// Wait for specific rule count
await ExtensionUtils.waitForRuleCount(page, 3, 5000);
```

### Best Practices

1. **Clean State:** Always clear storage in `beforeEach`
2. **Close Pages:** Always close pages after tests
3. **Explicit Waits:** Use `waitForLoadState`, `waitForSelector`
4. **Descriptive Names:** Test names should clearly describe what's being tested
5. **Arrange-Act-Assert:** Structure tests clearly
6. **One Assertion Focus:** Each test should focus on one behavior

### Example Test

```typescript
test('should create a new rule', async () => {
  // Arrange
  const page = await ExtensionUtils.openPopup(context, extensionId);

  // Act
  await page.click('button:has-text("New Rule")');
  await page.fill('input[placeholder*="name"]', 'My Rule');
  await page.fill('input[placeholder*="pattern"]', 'https://example.com');
  await page.selectOption('select[id*="type"]', { label: 'Block Request' });
  await page.click('button:has-text("Save")');

  // Assert
  await expect(page.locator('text=My Rule')).toBeVisible();
  await expect(page.locator('text=1 of 1 active')).toBeVisible();

  const rules = await ExtensionUtils.getRules(page);
  expect(rules).toHaveLength(1);
  expect(rules[0].name).toBe('My Rule');

  await page.close();
});
```

## CI/CD Integration

E2E tests run automatically on:
- Push to `main`, `develop`, or `claude/**` branches
- Pull requests targeting `main` or `develop`

See `.github/workflows/ci.yml` for CI configuration.

## Troubleshooting

### Extension Not Found

If tests fail with "FlowCraft extension not found":

1. Ensure extension is properly built
2. Check manifest.json is valid
3. Verify extension name is "FlowCraft"

### Timeout Errors

If tests timeout:

1. Increase timeout in test or config
2. Check for missing `await` keywords
3. Verify selectors are correct

### Flaky Tests

If tests are inconsistent:

1. Add explicit waits: `waitForLoadState`, `waitForSelector`
2. Use `toBeVisible()` instead of `toHaveLength()` for UI checks
3. Ensure proper test isolation (clear storage)

### Playwright Browser Issues

If browsers fail to download:

1. Check network connection
2. Try manual install: `npx playwright install chromium --with-deps`
3. Check proxy settings

## Debugging Tips

### Screenshot on Failure

```typescript
test('my test', async ({ page }) => {
  try {
    // test code
  } catch (error) {
    await page.screenshot({ path: 'error.png' });
    throw error;
  }
});
```

### Pause Execution

```typescript
await page.pause();
```

### Console Logs

```typescript
page.on('console', (msg) => console.log('Browser:', msg.text()));
```

### Video Recording

Enable in `playwright.config.ts`:

```typescript
use: {
  video: 'on',
}
```

## Coverage

E2E tests complement unit tests by covering:

- User flows and interactions
- Integration between components
- Chrome API interactions
- Real browser behavior
- Visual regression (potential future addition)

Aim for E2E tests to cover all critical user paths defined in `TESTING_GUIDE.md`.

## Future Enhancements

- [ ] Visual regression testing
- [ ] Network request interception tests
- [ ] Performance benchmarks
- [ ] Accessibility audits with axe-core
- [ ] Cross-browser testing (Edge, Brave)
- [ ] Screenshot comparison tests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions)
- [FlowCraft Testing Guide](../../TESTING_GUIDE.md)

---

**Happy Testing! 🧪**
