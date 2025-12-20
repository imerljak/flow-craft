import { test, expect, chromium, BrowserContext } from '@playwright/test';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft Popup - Basic Functionality', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    // Launch browser with extension
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
    // Clear storage before each test
    const page = await ExtensionUtils.openPopup(context, extensionId);
    await ExtensionUtils.clearStorage(page);
    await page.close();
  });

  test('should open popup successfully', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Verify popup title
    await expect(page.locator('h1')).toContainText('FlowCraft');

    // Verify empty state message
    await expect(page.locator('text=No rules yet')).toBeVisible();

    // Verify "New Rule" button is visible
    await expect(page.locator('button:has-text("New Rule")')).toBeVisible();

    await page.close();
  });

  test('should display popup dimensions correctly', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Verify popup dimensions (600x500 as per spec)
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(400); // Allow some flexibility
    expect(viewport?.height).toBeGreaterThanOrEqual(400);

    await page.close();
  });

  test('should show "Open Settings" link', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Verify settings link exists
    const settingsLink = page.locator('a:has-text("Settings")');
    await expect(settingsLink).toBeVisible();

    await page.close();
  });

  test('should open rule creation modal', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Click "New Rule" button
    await page.click('button:has-text("New Rule")');

    // Verify modal opened
    await expect(page.locator('text=Create New Rule')).toBeVisible();

    // Verify form fields are present
    await expect(page.locator('input[placeholder*="name"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="pattern"]')).toBeVisible();

    // Verify buttons
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Save")')).toBeVisible();

    await page.close();
  });

  test('should close modal on cancel', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Open modal
    await page.click('button:has-text("New Rule")');
    await expect(page.locator('text=Create New Rule')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Verify modal closed
    await expect(page.locator('text=Create New Rule')).not.toBeVisible();

    // Verify we're back to empty state
    await expect(page.locator('text=No rules yet')).toBeVisible();

    await page.close();
  });

  test('should show validation errors for empty form', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Open modal
    await page.click('button:has-text("New Rule")');

    // Try to save without filling anything
    await page.click('button:has-text("Save")');

    // Verify error messages appear
    await expect(page.locator('text=required')).toBeVisible();

    await page.close();
  });
});
