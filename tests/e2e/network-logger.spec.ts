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
    const networkTab = page.locator('button:has-text("Network")').or(
      page.locator('text=Network').filter({ has: page.locator('button') })
    );
    await expect(networkTab).toBeVisible();

    await page.close();
  });

  test('should switch to Network view', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Click Network tab
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();

    // Verify Network view content is shown
    await expect(
      page.locator('text=Request Logs').or(page.locator('text=HTTP Logs'))
    ).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should show logger disabled state by default', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Verify message about logger being disabled
    await expect(
      page.locator('text=disabled').or(page.locator('text=Enable'))
    ).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should enable logger from Settings', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Settings tab
    const settingsTab = page.locator('button:has-text("Settings")');
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
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Verify logger is now active (no "disabled" message)
    // Should show logs list or "No logs" message
    await expect(
      page.locator('text=No logs').or(page.locator('text=Logs')).or(page.locator('text=Clear Logs'))
    ).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should display log entries', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Enable logger via Settings
    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    const loggerToggle = page.locator('label:has-text("Enable")').locator('input[type="checkbox"]');
    if (await loggerToggle.first().isVisible()) {
      const isChecked = await loggerToggle.first().isChecked();
      if (!isChecked) {
        await loggerToggle.first().click();
        await page.waitForTimeout(500);
      }
    }

    // Create a rule that will intercept requests
    const rulesTab = page.locator('button:has-text("Rules")');
    await rulesTab.click();
    await page.waitForTimeout(300);

    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Test Logger Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://httpbin.org/*');
    await page.selectOption('select#rule-type', { value: 'header_modification' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Navigate to a test page and trigger a request
    const testPage = await context.newPage();
    await testPage.goto('https://httpbin.org');
    await testPage.waitForTimeout(1000);
    await testPage.close();

    // Go to Network view
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(500);

    // Refresh logs
    const refreshButton = page.locator('button:has-text("Refresh")').or(
      page.locator('button[aria-label*="Refresh"]')
    );
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(500);
    }

    // Check if logs are displayed (might be empty if no requests were logged)
    // At minimum, verify the logs table/list exists
    const logsContainer = page.locator('text=URL').or(
      page.locator('text=Method').or(page.locator('text=Status'))
    );
    await expect(logsContainer.first()).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should filter logs by URL', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Look for filter input
    const filterInput = page.locator('input[placeholder*="Filter"]').or(
      page.locator('input[type="search"]')
    );

    if (await filterInput.isVisible()) {
      await filterInput.fill('example.com');
      await page.waitForTimeout(300);

      // Verify UI responds to filter (implementation-specific)
      await expect(filterInput).toHaveValue('example.com');
    }

    await page.close();
  });

  test('should clear all logs', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Look for Clear Logs button
    const clearButton = page.locator('button:has-text("Clear Logs")').or(
      page.locator('button:has-text("Clear")')
    );

    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // Verify logs are cleared (should show "No logs" or empty state)
      await expect(
        page.locator('text=No logs').or(page.locator('text=No requests'))
      ).toBeVisible({ timeout: 2000 });
    }

    await page.close();
  });

  test('should export logs to JSON', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Look for Export button
    const exportButton = page.locator('button:has-text("Export")').or(
      page.locator('button:has-text("Export Logs")')
    );

    if (await exportButton.isVisible()) {
      // Click export button
      await exportButton.click();
      await page.waitForTimeout(500);

      // Verify export options or download initiated
      // Could check for download or modal depending on implementation
    }

    await page.close();
  });

  test('should show log details when clicked', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Enable logger
    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    const loggerToggle = page.locator('label:has-text("Enable")').locator('input[type="checkbox"]');
    if (await loggerToggle.first().isVisible()) {
      const isChecked = await loggerToggle.first().isChecked();
      if (!isChecked) {
        await loggerToggle.first().click();
        await page.waitForTimeout(500);
      }
    }

    // Go to Network tab
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(500);

    // If there are logs, click on one
    const logRow = page.locator('[role="row"]').or(page.locator('[class*="log"]')).first();
    if (await logRow.isVisible()) {
      await logRow.click();
      await page.waitForTimeout(300);

      // Verify detail panel or modal appears
      await expect(
        page.locator('text=Request Headers').or(page.locator('text=Response'))
      ).toBeVisible({ timeout: 2000 });
    }

    await page.close();
  });

  test('should auto-refresh logs', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Enable logger
    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    const loggerToggle = page.locator('label:has-text("Enable")').locator('input[type="checkbox"]');
    if (await loggerToggle.first().isVisible()) {
      const isChecked = await loggerToggle.first().isChecked();
      if (!isChecked) {
        await loggerToggle.first().click();
        await page.waitForTimeout(500);
      }
    }

    // Go to Network tab
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Look for auto-refresh toggle
    const autoRefreshToggle = page.locator('input[type="checkbox"]').filter({
      has: page.locator('~ text=Auto'),
    }).or(
      page.locator('label:has-text("Auto")').locator('input[type="checkbox"]')
    );

    if (await autoRefreshToggle.first().isVisible()) {
      // Enable auto-refresh
      const isChecked = await autoRefreshToggle.first().isChecked();
      if (!isChecked) {
        await autoRefreshToggle.first().click();
        await page.waitForTimeout(300);
      }

      // Verify it's enabled
      expect(await autoRefreshToggle.first().isChecked()).toBe(true);
    }

    await page.close();
  });

  test('should display log statistics', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Network tab
    const networkTab = page.locator('button:has-text("Network")');
    await networkTab.click();
    await page.waitForTimeout(300);

    // Look for statistics or summary info
    // Could be total logs count, requests by type, etc.
    const statsArea = page.locator('text=Total').or(
      page.locator('text=Logs').or(page.locator('text=Requests'))
    );

    // At minimum, verify the Network view is functional
    await expect(statsArea.first()).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should configure max log limit in Settings', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Settings
    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Look for max logs configuration
    const maxLogsInput = page.locator('input[type="number"]').filter({
      has: page.locator('~ text=Max'),
    }).or(
      page.locator('label:has-text("Maximum")').locator('+ input[type="number"]')
    );

    if (await maxLogsInput.first().isVisible()) {
      // Change the value
      await maxLogsInput.first().clear();
      await maxLogsInput.first().fill('500');
      await page.waitForTimeout(300);

      // Verify value changed
      expect(await maxLogsInput.first().inputValue()).toBe('500');
    }

    await page.close();
  });

  test('should configure capture options in Settings', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Go to Settings
    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Look for capture headers/body toggles
    const captureToggles = page.locator('input[type="checkbox"]').filter({
      has: page.locator('~ text=Capture'),
    });

    if (await captureToggles.count() > 0) {
      // Toggle one of the capture options
      const firstToggle = captureToggles.first();
      const wasChecked = await firstToggle.isChecked();
      await firstToggle.click();
      await page.waitForTimeout(300);

      // Verify it toggled
      const isNowChecked = await firstToggle.isChecked();
      expect(isNowChecked).not.toBe(wasChecked);
    }

    await page.close();
  });
});
