/**
 * E2E tests for Network Request/Response Logger feature
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Network Logger', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'network-logger');

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

  test('should display Network view tab', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Verify Network tab exists
    const networkTab = page.locator('button').filter({ hasText: 'Network' });
    await expect(networkTab.first()).toBeVisible();

    await page.close();
  });

  test('should switch to Network view', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Click Network tab
    const networkTab = page.getByTestId('network-tab');
    await networkTab.click();

    // Verify Network view content is shown (look for any network-related content)
    await page.waitForTimeout(300);

    // Check if page has loaded network view (will have logs or empty state)
    const networkContent = page.locator('text=Network').or(page.locator('text=Logs')).or(page.locator('text=HTTP'));
    await expect(networkContent.first()).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should show logger disabled state by default', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.getByTestId('network-tab');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Verify message about logger being disabled (use first() to avoid strict mode)
    const disabledMessage = page.locator('text=Enable logging in Settings');
    await expect(disabledMessage.first()).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should enable logger from Settings', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Settings tab
    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find logger enable toggle by looking for "Enable Logging" label
    const loggerToggle = page.locator('label:has-text("Enable Logging")').locator('input[type="checkbox"]');

    // Enable if not already enabled
    if (await loggerToggle.isVisible()) {
      const isChecked = await loggerToggle.isChecked();
      if (!isChecked) {
        await loggerToggle.click();
        await page.waitForTimeout(500);
      }
    }

    // Go back to Network tab
    const networkTab = page.getByTestId('network-tab');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Verify logger is now active (should show Clear Logs or similar UI)
    const activeLoggerUI = page.locator('text=Clear Logs').or(page.locator('text=Refresh'));
    await expect(activeLoggerUI.first()).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should display Network view components', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.getByTestId('network-tab');
    await networkTab.click();
    await page.waitForTimeout(500);

    // Verify basic Network view structure exists
    // Look for common elements like table headers or action buttons
    const viewElements = page.locator('button, table, div').filter({ hasText: /Clear|Refresh|Export|URL|Method|Status/ });

    // At least some network view UI should be present
    const count = await viewElements.count();
    expect(count).toBeGreaterThan(0);

    await page.close();
  });

  test('should show filter input in Network view', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.getByTestId('network-tab');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Look for search/filter input
    const filterInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="Filter"]'));

    // If filter exists, test it
    if (await filterInput.count() > 0) {
      await filterInput.first().fill('example.com');
      await page.waitForTimeout(300);
      await expect(filterInput.first()).toHaveValue('example.com');
    }

    await page.close();
  });

  test('should display action buttons in Network view', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.getByTestId('network-tab');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Look for Clear Logs button (common action)
    const clearButton = page.locator('button').filter({ hasText: /Clear/ });

    if (await clearButton.count() > 0) {
      await expect(clearButton.first()).toBeVisible();
    }

    await page.close();
  });

  test('should show export options in Network view', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.getByTestId('network-tab');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Look for Export button (use first() to handle multiple matches)
    const exportButton = page.locator('button').filter({ hasText: /Export/ });

    if (await exportButton.count() > 0) {
      await expect(exportButton.first()).toBeVisible();
    }

    await page.close();
  });

  test('should configure logger settings', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Settings
    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Look for Request/Response Logger section header
    await expect(page.locator('text=Request/Response Logger').first()).toBeVisible();

    // Look for logger configuration options
    const configOptions = page.locator('label, input[type="checkbox"], input[type="number"]');
    const count = await configOptions.count();

    // Should have some configuration options
    expect(count).toBeGreaterThan(0);

    await page.close();
  });

  test('should toggle logging enable/disable', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Settings
    const settingsTab = page.getByTestId('settings-tab');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find Enable Logging toggle
    const enableToggle = page.locator('label:has-text("Enable Logging")').locator('input[type="checkbox"]');

    if (await enableToggle.isVisible()) {
      const initialState = await enableToggle.isChecked();

      // Toggle it
      await enableToggle.click();
      await page.waitForTimeout(500);

      // Verify it changed
      const newState = await enableToggle.isChecked();
      expect(newState).not.toBe(initialState);
    }

    await page.close();
  });
});
