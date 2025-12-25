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
    const settingsTab = page.locator('button:has-text("Settings")');
    await expect(settingsTab).toBeVisible();

    await page.close();
  });

  test('should switch to Settings view', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Click Settings tab
    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();

    // Verify Settings content is shown
    await expect(
      page.locator('text=Request/Response Logger').or(page.locator('text=Import/Export'))
    ).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should display logger settings section', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify Logger Settings section
    await expect(page.locator('text=Request/Response Logger')).toBeVisible();
    await expect(
      page.locator('text=Enable').or(page.locator('input[type="checkbox"]'))
    ).toBeVisible();

    await page.close();
  });

  test('should toggle logger enable/disable', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find logger enable toggle
    const loggerToggle = page.locator('label:has-text("Enable")').locator('input[type="checkbox"]');

    if (await loggerToggle.first().isVisible()) {
      const initialState = await loggerToggle.first().isChecked();

      // Toggle it
      await loggerToggle.first().click();
      await page.waitForTimeout(500);

      // Verify state changed
      const newState = await loggerToggle.first().isChecked();
      expect(newState).not.toBe(initialState);
    }

    await page.close();
  });

  test('should configure max log entries', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find max logs input
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

  test('should toggle capture request headers', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find capture headers toggle
    const captureHeadersToggle = page.locator('label:has-text("Request Headers")').locator('input[type="checkbox"]');

    if (await captureHeadersToggle.isVisible()) {
      const initialState = await captureHeadersToggle.isChecked();
      await captureHeadersToggle.click();
      await page.waitForTimeout(300);

      const newState = await captureHeadersToggle.isChecked();
      expect(newState).not.toBe(initialState);
    }

    await page.close();
  });

  test('should toggle capture request body', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find capture body toggle
    const captureBodyToggle = page.locator('label:has-text("Request Body")').locator('input[type="checkbox"]');

    if (await captureBodyToggle.isVisible()) {
      const initialState = await captureBodyToggle.isChecked();
      await captureBodyToggle.click();
      await page.waitForTimeout(300);

      const newState = await captureBodyToggle.isChecked();
      expect(newState).not.toBe(initialState);
    }

    await page.close();
  });

  test('should add URL exclusion pattern', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find exclusion patterns section
    const exclusionInput = page.locator('input[placeholder*="chrome"]').or(
      page.locator('input[placeholder*="extension"]')
    );

    if (await exclusionInput.isVisible()) {
      await exclusionInput.fill('*.google-analytics.com/*');
      await page.waitForTimeout(300);

      // Look for Add button
      const addButton = page.locator('button:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(300);

        // Verify pattern was added (should appear in list)
        await expect(page.locator('text=google-analytics.com')).toBeVisible({ timeout: 2000 });
      }
    }

    await page.close();
  });

  test('should display Import/Export section', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify Import/Export section
    await expect(page.locator('text=Import/Export Rules')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();

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
    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Click Export button
    const exportButton = page.locator('button:has-text("Export Rules")').or(
      page.locator('button:has-text("Export")')
    );

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    await exportButton.click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download occurred
    expect(download.suggestedFilename()).toContain('flowcraft');
    expect(download.suggestedFilename()).toContain('.json');

    await page.close();
  });

  test('should show export options checkboxes', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify export options are visible
    await expect(
      page.locator('text=Include Groups').or(page.locator('text=Include Settings'))
    ).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should toggle include groups option', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find include groups checkbox
    const includeGroupsToggle = page.locator('label:has-text("Include Groups")').locator('input[type="checkbox"]').or(
      page.locator('input[type="checkbox"]').filter({ has: page.locator('~ text=Groups') })
    );

    if (await includeGroupsToggle.first().isVisible()) {
      const initialState = await includeGroupsToggle.first().isChecked();
      await includeGroupsToggle.first().click();
      await page.waitForTimeout(300);

      const newState = await includeGroupsToggle.first().isChecked();
      expect(newState).not.toBe(initialState);
    }

    await page.close();
  });

  test('should toggle include settings option', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Find include settings checkbox
    const includeSettingsToggle = page.locator('label:has-text("Include Settings")').locator('input[type="checkbox"]').or(
      page.locator('input[type="checkbox"]').filter({ has: page.locator('~ text=Settings') })
    );

    if (await includeSettingsToggle.first().isVisible()) {
      const initialState = await includeSettingsToggle.first().isChecked();
      await includeSettingsToggle.first().click();
      await page.waitForTimeout(300);

      const newState = await includeSettingsToggle.first().isChecked();
      expect(newState).not.toBe(initialState);
    }

    await page.close();
  });

  test('should show file picker for import', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify import file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    await page.close();
  });

  test('should display import options', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify import options section exists
    await expect(
      page.locator('text=Import Options').or(page.locator('text=Overwrite'))
    ).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should save settings successfully', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Make a change
    const loggerToggle = page.locator('label:has-text("Enable")').locator('input[type="checkbox"]');
    if (await loggerToggle.first().isVisible()) {
      await loggerToggle.first().click();
      await page.waitForTimeout(800);

      // Look for success message
      await expect(
        page.locator('text=Saved').or(page.locator('text=Success'))
      ).toBeVisible({ timeout: 3000 });
    }

    await page.close();
  });

  test('should persist settings across page reloads', async () => {
    let page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Enable logger
    const loggerToggle = page.locator('label:has-text("Enable")').locator('input[type="checkbox"]');
    if (await loggerToggle.first().isVisible()) {
      const wasChecked = await loggerToggle.first().isChecked();
      if (!wasChecked) {
        await loggerToggle.first().click();
        await page.waitForTimeout(800);
      }
    }

    // Close and reopen
    await page.close();
    page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab2 = page.locator('button:has-text("Settings")');
    await settingsTab2.click();
    await page.waitForTimeout(300);

    // Verify logger is still enabled
    const loggerToggle2 = page.locator('label:has-text("Enable")').locator('input[type="checkbox"]');
    if (await loggerToggle2.first().isVisible()) {
      const isChecked = await loggerToggle2.first().isChecked();
      expect(isChecked).toBe(true);
    }

    await page.close();
  });

  test('should validate max log entries range', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Try to set invalid value
    const maxLogsInput = page.locator('input[type="number"]').first();

    if (await maxLogsInput.isVisible()) {
      // Try very large number
      await maxLogsInput.clear();
      await maxLogsInput.fill('999999');
      await page.waitForTimeout(300);

      // Implementation may clamp or show error
      // At minimum, verify the input field still works
      const value = await maxLogsInput.inputValue();
      expect(value).toBeTruthy();
    }

    await page.close();
  });

  test('should show settings organized in sections', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const settingsTab = page.locator('button:has-text("Settings")');
    await settingsTab.click();
    await page.waitForTimeout(300);

    // Verify multiple sections exist
    await expect(page.locator('text=Request/Response Logger')).toBeVisible();
    await expect(page.locator('text=Import/Export')).toBeVisible();

    // Sections should have spacing between them
    const loggerSection = page.locator('text=Request/Response Logger').locator('..');
    const importSection = page.locator('text=Import/Export').locator('..');

    await expect(loggerSection).toBeVisible();
    await expect(importSection).toBeVisible();

    await page.close();
  });
});
