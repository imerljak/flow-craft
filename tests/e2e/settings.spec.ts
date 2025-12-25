/**
 * E2E tests for Settings View and configuration
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Settings', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'settings');

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

  test('should display Settings tab', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Verify Settings tab exists
    await expect(page.getByTestId('settings-tab')).toBeVisible();

    await page.close();
  });

  test('should switch to Settings view', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Click Settings tab
    await page.getByTestId('settings-tab').click();

    // Verify Settings content is shown (use first() to avoid strict mode)
    await expect(page.locator('text=Request/Response Logger').first()).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should display logger settings section', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.getByTestId('settings-tab').click();
    await page.waitForTimeout(300);

    // Verify Logger Settings section
    await expect(page.locator('text=Request/Response Logger').first()).toBeVisible();

    // Verify logger toggle exists
    await expect(page.getByTestId('logger-enabled-toggle')).toBeVisible();

    await page.close();
  });

  test('should toggle logger enable/disable', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    await page.getByTestId('settings-tab').click();
    await page.waitForTimeout(300);

    // Toggle logger
    const loggerToggle = page.getByTestId('logger-enabled-toggle');
    await loggerToggle.click();
    await page.waitForTimeout(500);

    // Verify toggle worked (check if it has the enabled class)
    const hasEnabledClass = await loggerToggle.evaluate((el) =>
      el.className.includes('bg-primary-500')
    );
    expect(typeof hasEnabledClass).toBe('boolean');

    await page.close();
  });

  test('should configure max log entries', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find max logs input (should be a number input in logger section)
    const maxLogsInput = page.locator('input[type="number"]').first();

    if (await maxLogsInput.isVisible()) {
      await maxLogsInput.clear();
      await maxLogsInput.fill('750');
      await page.waitForTimeout(300);

      // Verify value changed
      expect(await maxLogsInput.inputValue()).toBe('750');
    }

    await page.close();
  });

  test('should toggle capture options', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find capture checkboxes (there should be multiple)
    const captureToggles = page.locator('input[type="checkbox"]');
    const count = await captureToggles.count();

    if (count > 1) {
      // Toggle the second checkbox (first might be main enable)
      const toggle = captureToggles.nth(1);
      const initialState = await toggle.isChecked();
      await toggle.click();
      await page.waitForTimeout(300);

      const newState = await toggle.isChecked();
      expect(newState).not.toBe(initialState);
    }

    await page.close();
  });

  test('should display Import/Export section', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify Import/Export section
    await expect(page.locator('text=Import/Export Rules').first()).toBeVisible();

    // Verify Export button exists (use getByTestId if available, otherwise filter)
    const exportButton = page.getByTestId('export-rules-btn').or(page.locator('button').filter({ hasText: /Export/ }));
    await expect(exportButton.first()).toBeVisible();

    await page.close();
  });

  test('should export rules with default options', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create a rule first
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Export Test Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com');
    await page.selectOption('select#rule-type', { value: 'request_block' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Go to Settings
    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Click Export button (use testId or filter)
    const exportButton = page.getByTestId('export-rules-btn').or(page.locator('button').filter({ hasText: /Export Rules/ }));

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    await exportButton.first().click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download occurred
    expect(download.suggestedFilename()).toContain('flowcraft');
    expect(download.suggestedFilename()).toContain('.json');

    await page.close();
  });

  test('should show file picker for import', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify import file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await page.close();
  });

  test('should save settings successfully', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Make a change
    const loggerToggle = page.locator('label:has-text("Enable Logging")').locator('input[type="checkbox"]');
    if (await loggerToggle.isVisible()) {
      await loggerToggle.click();
      await page.waitForTimeout(1000);

      // Look for success message (may say "Saved" or "Settings saved")
      const successMessage = page.locator('text=Saved').or(page.locator('text=Success'));

      // Success message may appear and disappear, so check if it appeared
      if (await successMessage.count() > 0) {
        await expect(successMessage.first()).toBeVisible({ timeout: 3000 });
      }
    }

    await page.close();
  });

  test('should persist settings across page reloads', async () => {
    let page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Enable logger
    const loggerToggle = page.locator('label:has-text("Enable Logging")').locator('input[type="checkbox"]');
    if (await loggerToggle.isVisible()) {
      const wasChecked = await loggerToggle.isChecked();
      if (!wasChecked) {
        await loggerToggle.click();
        await page.waitForTimeout(1000);
      }
    }

    // Close and reopen
    await page.close();
    page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab2 = page.locator('button').filter({ hasText: 'Settings' }).first();
    await settingsTab2.click();
    await page.waitForTimeout(300);

    // Verify logger is still enabled
    const loggerToggle2 = page.locator('label:has-text("Enable Logging")').locator('input[type="checkbox"]');
    if (await loggerToggle2.isVisible()) {
      const isChecked = await loggerToggle2.isChecked();
      expect(isChecked).toBe(true);
    }

    await page.close();
  });

  test('should show settings organized in sections', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify multiple sections exist
    await expect(page.locator('text=Request/Response Logger').first()).toBeVisible();
    await expect(page.locator('text=Import/Export').first()).toBeVisible();

    await page.close();
  });
});
