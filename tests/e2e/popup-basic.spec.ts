import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft Popup - Informative UI', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    // Unique user data dir for this test suite
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'popup');

    // Launch browser with extension
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
    // Clear storage before each test
    const page = await ExtensionUtils.openPopup(context, extensionId);
    await ExtensionUtils.clearStorage(page);
    await page.close();
  });

  test('should open popup successfully', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Verify logo is visible
    await expect(page.locator('img[alt="FlowCraft"]')).toBeVisible();

    // Verify "Open App" button is visible
    await expect(page.locator('button:has-text("Open App")')).toBeVisible();

    // Verify extension status toggle is visible
    await expect(page.locator('button:has-text("Running"), button:has-text("Paused")')).toBeVisible();

    await page.close();
  });

  test('should display popup dimensions correctly', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Verify popup dimensions (400x500-600 as per new spec)
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(400);
    expect(viewport?.height).toBeGreaterThanOrEqual(400);

    await page.close();
  });

  test('should show empty state when no rules exist', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Verify empty state message
    await expect(page.locator('text=No rules yet')).toBeVisible();

    // Verify "Create Your First Rule" button
    await expect(page.locator('button:has-text("Create Your First Rule")')).toBeVisible();

    // Verify rules count shows "0 of 0 active"
    await expect(page.locator('text=0 of 0 active')).toBeVisible();

    await page.close();
  });

  test('should show extension status as Running by default', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Verify default state is Running
    await expect(page.locator('button:has-text("Running")')).toBeVisible();

    // Verify green status indicator
    const statusButton = page.locator('button:has-text("Running")');
    await expect(statusButton).toBeVisible();

    await page.close();
  });

  test('should toggle extension on/off', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Initially should be Running
    await expect(page.locator('button:has-text("Running")')).toBeVisible();

    // Click to pause
    await page.click('button:has-text("Running")');

    // Should now show Paused
    await expect(page.locator('button:has-text("Paused")')).toBeVisible({ timeout: 2000 });

    // Click to resume
    await page.click('button:has-text("Paused")');

    // Should be Running again
    await expect(page.locator('button:has-text("Running")')).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should open options page when "Open App" is clicked', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Click "Open App" button
    const [optionsPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Open App")'),
    ]);

    // Wait for options page to load
    await optionsPage.waitForLoadState('domcontentloaded');

    // Verify it's the options page
    expect(optionsPage.url()).toContain('options.html');

    await optionsPage.close();
    await page.close();
  });

  test('should open options page when "Create Your First Rule" is clicked in empty state', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Wait for empty state button
    await expect(page.locator('button:has-text("Create Your First Rule")')).toBeVisible();

    // Click "Create Your First Rule" button
    const [optionsPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Create Your First Rule")'),
    ]);

    // Wait for options page to load
    await optionsPage.waitForLoadState('domcontentloaded');

    // Verify it's the options page
    expect(optionsPage.url()).toContain('options.html');

    await optionsPage.close();
    await page.close();
  });
});
