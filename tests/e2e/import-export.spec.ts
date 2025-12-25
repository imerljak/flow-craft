/**
 * E2E tests for Import/Export functionality
 */

import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import type { ExportData, RuleType } from '../../src/shared/types';
import path from 'path';
import fs from 'fs';
import { ExtensionUtils } from './extension-utils';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Import/Export Rules', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'import-export');
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
  test('should export rules successfully', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Create a test rule first
    await page.getByTestId('new-rule-btn').click();
    await page.locator('input[name="name"]').fill('Test Export Rule');
    await page.locator('textarea[name="description"]').fill('Rule for export testing');
    await page.locator('input[name="pattern"]').fill('https://export.test.com/*');

    // Click Save
    await page.getByRole('button', { name: 'Save Rule' }).click();

    // Wait for drawer to close and rule to appear
    await expect(page.getByText('Test Export Rule')).toBeVisible();

    // Navigate to Settings
    await page.getByRole('button', { name: /Settings/i }).click();

    // Setup download promise before clicking
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByTestId('export-rules-btn').click();

    // Wait for download
    const download = await downloadPromise;

    // Save download to temp location
    const tempPath = path.join(__dirname, 'temp-export.json');
    await download.saveAs(tempPath);

    // Verify downloaded file exists and has correct structure
    expect(fs.existsSync(tempPath)).toBe(true);

    const exportContent = fs.readFileSync(tempPath, 'utf-8');
    const exportData: ExportData = JSON.parse(exportContent);

    // Verify export structure
    expect(exportData.version).toBeDefined();
    expect(exportData.exportDate).toBeGreaterThan(0);
    expect(exportData.exportFormat).toBe(1);
    expect(exportData.data.rules).toHaveLength(1);
    expect(exportData.data.rules[0]?.name).toBe('Test Export Rule');
    expect(exportData.metadata?.rulesCount).toBe(1);

    // Cleanup
    fs.unlinkSync(tempPath);
  });

  test('should import rules successfully', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Navigate to Settings
    await page.getByRole('button', { name: /Settings/i }).click();

    // Create test export data
    const testExport: ExportData = {
      version: '1.0.0',
      exportDate: Date.now(),
      exportFormat: 1,
      data: {
        rules: [
          {
            id: 'import-test-1',
            name: 'Imported Rule 1',
            description: 'First imported rule',
            enabled: true,
            priority: 1,
            matcher: {
              type: 'wildcard',
              pattern: 'https://import.test.com/*',
            },
            action: {
              type: 'url_redirect' as RuleType,
              redirectUrl: 'https://redirect.test.com',
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'import-test-2',
            name: 'Imported Rule 2',
            description: 'Second imported rule',
            enabled: false,
            priority: 2,
            matcher: {
              type: 'exact',
              pattern: 'https://import2.test.com/api',
            },
            action: {
              type: 'request_block' as RuleType,
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      },
      metadata: {
        rulesCount: 2,
        groupsCount: 0,
        includesSettings: false,
      },
    };

    // Write test export to temp file
    const tempPath = path.join(__dirname, 'test-import.json');
    fs.writeFileSync(tempPath, JSON.stringify(testExport, null, 2));

    // Click import button and select file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempPath);

    // Wait for import result
    await expect(page.getByText('Import Successful')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Rules imported: 2')).toBeVisible();

    // Navigate back to rules view
    await page.getByRole('button', { name: /HTTP Rules/i }).click();

    // Verify imported rules appear (note: IDs will be regenerated)
    await expect(page.getByText('Imported Rule 1')).toBeVisible();
    await expect(page.getByText('Imported Rule 2')).toBeVisible();
    await expect(page.getByText('First imported rule')).toBeVisible();
    await expect(page.getByText('Second imported rule')).toBeVisible();

    // Cleanup
    fs.unlinkSync(tempPath);
  });

  test('should export with settings when requested', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Navigate to Settings
    await page.getByRole('button', { name: /Settings/i }).click();

    // Enable logger for testing
    await page.getByText('Enable Logging').click();

    // Setup download promise
    const downloadPromise = page.waitForEvent('download');

    // Click "Export with Settings" button
    await page.getByTestId('export-all-btn').click();

    // Wait for download
    const download = await downloadPromise;

    // Save download
    const tempPath = path.join(__dirname, 'temp-export-settings.json');
    await download.saveAs(tempPath);

    // Verify file
    const exportContent = fs.readFileSync(tempPath, 'utf-8');
    const exportData: ExportData = JSON.parse(exportContent);

    // Verify settings are included
    expect(exportData.data.settings).toBeDefined();
    expect(exportData.data.settings?.logger?.enabled).toBe(true);
    expect(exportData.metadata?.includesSettings).toBe(true);

    // Cleanup
    fs.unlinkSync(tempPath);
  });

  test('should handle import errors gracefully', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Navigate to Settings
    await page.getByRole('button', { name: /Settings/i }).click();

    // Create invalid export data (missing required fields)
    const invalidExport = {
      version: '1.0.0',
      exportDate: Date.now(),
      exportFormat: 1,
      data: {
        rules: [
          {
            id: 'invalid-1',
            // Missing name field
            enabled: true,
            priority: 1,
            matcher: {
              type: 'wildcard',
              pattern: '*',
            },
            action: {
              type: 'request_block',
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      },
    };

    // Write invalid export to temp file
    const tempPath = path.join(__dirname, 'test-invalid-import.json');
    fs.writeFileSync(tempPath, JSON.stringify(invalidExport, null, 2));

    // Click import button and select file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempPath);

    // Wait for error message
    await expect(page.getByText('Import Failed')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/missing name/i)).toBeVisible();

    // Cleanup
    fs.unlinkSync(tempPath);
  });

  test('should close import result notification', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Navigate to Settings
    await page.getByRole('button', { name: /Settings/i }).click();

    // Create minimal valid export
    const testExport: ExportData = {
      version: '1.0.0',
      exportDate: Date.now(),
      exportFormat: 1,
      data: {
        rules: [
          {
            id: 'close-test',
            name: 'Close Test Rule',
            description: 'Testing close button',
            enabled: true,
            priority: 1,
            matcher: {
              type: 'wildcard',
              pattern: 'https://close.test.com/*',
            },
            action: {
              type: 'request_block' as RuleType,
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      },
      metadata: {
        rulesCount: 1,
        groupsCount: 0,
        includesSettings: false,
      },
    };

    // Write to temp file
    const tempPath = path.join(__dirname, 'test-close-import.json');
    fs.writeFileSync(tempPath, JSON.stringify(testExport, null, 2));

    // Import
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tempPath);

    // Wait for success notification
    await expect(page.getByText('Import Successful')).toBeVisible();

    // Click close button (×)
    await page.locator('button:has-text("×")').click();

    // Verify notification is closed
    await expect(page.getByText('Import Successful')).not.toBeVisible();

    // Cleanup
    fs.unlinkSync(tempPath);
  });
});
