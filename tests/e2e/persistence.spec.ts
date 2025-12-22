import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Data Persistence', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    // Unique user data dir for this test suite
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'persistence');

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

  test('should persist rules after closing and reopening options page', async () => {
    // Create a rule in options page
    let page = await ExtensionUtils.openOptions(context, extensionId);

    await page.click('button:has-text("+ New Rule")');
    await page.fill('input[placeholder*="CORS"]', 'Persistent Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com');
    await page.selectOption('select#rule-type', { value: 'request_block' });
    await page.click('button:has-text("Save Rule")');

    // Wait for save
    await page.waitForTimeout(1000);

    // Verify rule is there
    await expect(page.locator('text=Persistent Rule')).toBeVisible();

    // Close options page
    await page.close();

    // Reopen options page
    page = await ExtensionUtils.openOptions(context, extensionId);

    // Rule should still be there
    await expect(page.locator('text=Persistent Rule')).toBeVisible();

    await page.close();
  });

  test('should show persisted rules in popup', async () => {
    // Create a rule in options page
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    await optionsPage.click('button:has-text("+ New Rule")');
    await optionsPage.fill('input[placeholder*="CORS"]', 'Popup Display Rule');
    await optionsPage.fill('input[placeholder*="api.example.com"]', 'https://popup.com');
    await optionsPage.selectOption('select#rule-type', { value: 'header_modification' });
    await optionsPage.click('button:has-text("Save Rule")');
    await optionsPage.waitForTimeout(1000);
    await optionsPage.close();

    // Open popup
    const popupPage = await ExtensionUtils.openPopup(context, extensionId);

    // Rule should appear in popup
    await expect(popupPage.locator('text=Popup Display Rule')).toBeVisible();

    // Should show "1 of 1 active"
    await expect(popupPage.locator('text=1 of 1 active')).toBeVisible();

    await popupPage.close();
  });

  test('should persist rule enabled/disabled state', async () => {
    let page = await ExtensionUtils.openOptions(context, extensionId);

    // Create a rule
    await page.click('button:has-text("+ New Rule")');
    await page.fill('input[placeholder*="CORS"]', 'Toggle Persist');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com');
    await page.selectOption('select#rule-type', { value: 'request_block' });
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Disable the rule via toggle in table
    const ruleRow = page.locator('tr:has-text("Toggle Persist")');
    const toggleButton = ruleRow.locator('button').first();
    await toggleButton.click();
    await page.waitForTimeout(500);

    // Close and reopen
    await page.close();
    page = await ExtensionUtils.openOptions(context, extensionId);

    // Rule should still exist but be disabled
    await expect(page.locator('text=Toggle Persist')).toBeVisible();

    // Verify in storage
    const rules = await ExtensionUtils.getRules(page);
    expect(rules.length).toBe(1);
    expect(rules[0]?.enabled).toBe(false);

    await page.close();
  });

  test('should persist multiple rules', async () => {
    let page = await ExtensionUtils.openOptions(context, extensionId);

    // Create 3 rules
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', `Multi Rule ${i}`);
      await page.fill('input[placeholder*="api.example.com"]', `https://example${i}.com`);
      await page.selectOption('select#rule-type', { value: 'request_block' });
      await page.click('button:has-text("Save Rule")');
      await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });
    }

    await page.close();

    // Reopen
    page = await ExtensionUtils.openOptions(context, extensionId);

    // All 3 should be there
    await expect(page.locator('text=Multi Rule 1')).toBeVisible();
    await expect(page.locator('text=Multi Rule 2')).toBeVisible();
    await expect(page.locator('text=Multi Rule 3')).toBeVisible();

    // Verify count in storage
    const rules = await ExtensionUtils.getRules(page);
    expect(rules.length).toBe(3);

    await page.close();
  });

  test('should persist header modifications', async () => {
    let page = await ExtensionUtils.openOptions(context, extensionId);

    // Create header mod rule
    await page.click('button:has-text("+ New Rule")');
    await page.fill('input[placeholder*="CORS"]', 'Header Persist');
    await page.fill('input[placeholder*="api.example.com"]', 'https://headers.com');
    await page.selectOption('select#rule-type', { value: 'header_modification' });
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    await page.close();

    // Reopen
    page = await ExtensionUtils.openOptions(context, extensionId);

    await expect(page.locator('text=Header Persist')).toBeVisible();
    await expect(page.locator('text=⚡ Headers')).toBeVisible();

    // Verify in storage
    const rules = await ExtensionUtils.getRules(page);
    expect(rules[0]?.action.type).toBe('header_modification');

    await page.close();
  });

  test('should persist redirect URL', async () => {
    let page = await ExtensionUtils.openOptions(context, extensionId);

    // Create redirect rule
    await page.click('button:has-text("+ New Rule")');
    await page.fill('input[placeholder*="CORS"]', 'Redirect Persist');
    await page.fill('input[placeholder*="api.example.com"]', 'https://old.com');
    await page.selectOption('select#rule-type', { value: 'url_redirect' });

    // Wait for redirect URL field
    await expect(page.locator('text=Redirect URL')).toBeVisible({ timeout: 2000 });
    await page.fill('input[placeholder*="new.example.com"]', 'https://new.com');

    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    await page.close();

    // Reopen
    page = await ExtensionUtils.openOptions(context, extensionId);

    // Verify redirect rule exists
    await expect(page.locator('text=Redirect Persist')).toBeVisible();

    // Verify in storage
    const rules = await ExtensionUtils.getRules(page);
    expect(rules[0]?.action.type).toBe('url_redirect');
    if (rules[0]?.action.type === 'url_redirect') {
      expect(rules[0].action.redirectUrl).toBe('https://new.com');
    }

    await page.close();
  });

  test('should maintain data integrity across multiple operations', async () => {
    let page = await ExtensionUtils.openOptions(context, extensionId);

    // Create rule
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Integrity Test');
    await page.fill('input[placeholder*="api.example.com"]', 'https://integrity.com');
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Get the rule ID from storage
    let rules = await ExtensionUtils.getRules(page);
    const ruleToEdit = rules.find((r) => r.name === 'Integrity Test');
    expect(ruleToEdit).toBeDefined();

    // Click edit button using test ID
    await page.getByTestId(`edit-rule-${ruleToEdit!.id}`).click();

    // Wait for edit drawer to open
    await expect(page.getByTestId('rule-editor-drawer')).toBeVisible({ timeout: 3000 });

    // Find and change the name input
    const nameInput = page.locator('input[placeholder*="CORS"]');
    await nameInput.clear();
    await nameInput.fill('Integrity Updated');
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Toggle off
    const updatedRow = page.locator('tr:has-text("Integrity Updated")');
    await updatedRow.locator('button').first().click();
    await page.waitForTimeout(500);

    // Close and reopen
    await page.close();
    page = await ExtensionUtils.openOptions(context, extensionId);

    // Verify all changes persisted
    await expect(page.locator('text=Integrity Updated')).toBeVisible();

    rules = await ExtensionUtils.getRules(page);
    expect(rules.length).toBe(1);
    expect(rules[0]?.name).toBe('Integrity Updated');
    expect(rules[0]?.enabled).toBe(false);

    await page.close();
  });

  test('should verify storage directly', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create a rule
    await page.click('button:has-text("+ New Rule")');
    await page.fill('input[placeholder*="CORS"]', 'Storage Verify');
    await page.fill('input[placeholder*="api.example.com"]', 'https://storage.com');
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Directly check storage
    const rules = await ExtensionUtils.getRules(page);

    expect(rules.length).toBe(1);
    expect(rules[0]?.name).toBe('Storage Verify');
    expect(rules[0]?.matcher.pattern).toBe('https://storage.com');
    expect(rules[0]?.enabled).toBe(true);
    expect(rules[0]?.id).toBeDefined();
    expect(rules[0]?.createdAt).toBeDefined();
    expect(rules[0]?.updatedAt).toBeDefined();

    await page.close();
  });
});
