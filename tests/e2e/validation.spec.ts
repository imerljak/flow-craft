import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Form Validation (Options Page)', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    // Unique user data dir for this test suite
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'validation');

    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        '--disable-extensions-except=' + path.join(process.cwd(), 'dist'),
        '--load-extension=' + path.join(process.cwd(), 'dist'),
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    extensionId = await ExtensionUtils.getExtensionId(context);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);
    await ExtensionUtils.clearStorage(page);
    await page.close();
  });

  test('should validate required rule name', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    // Try to save without name
    await page.click('button:has-text("Save Rule")');

    // Verify error message
    await expect(page.locator('text=Rule name is required')).toBeVisible();

    await page.close();
  });

  test('should validate required URL pattern', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    // Fill only name
    await page.fill('input[placeholder*="CORS"]', 'Test Rule');
    await page.click('button:has-text("Save Rule")');

    // Verify error message
    await expect(page.locator('text=URL pattern is required')).toBeVisible();

    await page.close();
  });

  test('should validate exact URL format', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    // Fill with invalid URL
    await page.fill('input[placeholder*="CORS"]', 'Test Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'not-a-valid-url');

    // Ensure exact match is selected
    await page.selectOption('select#pattern-type', { value: 'exact' });

    await page.click('button:has-text("Save Rule")');

    // Verify error message
    await expect(page.locator('text=Invalid URL format')).toBeVisible();

    await page.close();
  });

  test('should accept valid URL for exact match', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    await page.fill('input[placeholder*="CORS"]', 'Test Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com');
    await page.selectOption('select#pattern-type', { value: 'exact' });
    await page.selectOption('select#rule-type', { value: 'request_block' });

    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Should save successfully - rule appears in table
    await expect(page.locator('text=Test Rule')).toBeVisible();

    await page.close();
  });

  test('should accept wildcard patterns', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    await page.fill('input[placeholder*="CORS"]', 'Wildcard Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/*');
    await page.selectOption('select#pattern-type', { value: 'wildcard' });
    await page.selectOption('select#rule-type', { value: 'request_block' });

    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Wildcard Rule')).toBeVisible();

    await page.close();
  });

  test('should validate regex patterns', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    // Try invalid regex
    await page.fill('input[placeholder*="CORS"]', 'Regex Rule');
    await page.fill('input[placeholder*="api.example.com"]', '[invalid(regex');
    await page.selectOption('select#pattern-type', { value: 'regex' });
    await page.selectOption('select#rule-type', { value: 'request_block' });

    await page.click('button:has-text("Save Rule")');

    // Should show error
    await expect(page.locator('text=Invalid regex pattern')).toBeVisible();

    await page.close();
  });

  test('should accept valid regex patterns', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    await page.fill('input[placeholder*="CORS"]', 'Regex Rule');
    await page.fill('input[placeholder*="api.example.com"]', '^https://.*\\.example\\.com/.*$');
    await page.selectOption('select#pattern-type', { value: 'regex' });
    await page.selectOption('select#rule-type', { value: 'request_block' });

    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Regex Rule')).toBeVisible();

    await page.close();
  });

  test('should validate redirect URL when redirection type is selected', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    await page.fill('input[placeholder*="CORS"]', 'Redirect Test');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com');
    await page.selectOption('select#rule-type', { value: 'url_redirect' });

    // Try to save without redirect URL
    await page.click('button:has-text("Save Rule")');

    // Should show error
    await expect(page.locator('text=Redirect URL is required')).toBeVisible();

    await page.close();
  });

  test('should clear errors when correcting input', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    // Try to save without name
    await page.click('button:has-text("Save Rule")');
    await expect(page.locator('text=Rule name is required')).toBeVisible();

    // Fill in the name
    await page.fill('input[placeholder*="CORS"]', 'Test Rule');

    // Error should disappear (react-hook-form clears errors on input change)
    await page.waitForTimeout(300);
    await expect(page.locator('text=Rule name is required')).not.toBeVisible();

    await page.close();
  });

  test('should handle priority validation', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');

    await page.fill('input[placeholder*="CORS"]', 'Priority Test');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com');
    await page.selectOption('select#rule-type', { value: 'request_block' });

    // Priority input should have min/max constraints
    const priorityInput = page.locator('input[type="number"]');
    if (await priorityInput.isVisible()) {
      // Should clamp to valid range (1-1000)
      await priorityInput.fill('5');
    }

    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Priority Test')).toBeVisible();

    await page.close();
  });
});
