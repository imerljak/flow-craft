import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Data Persistence', () => {
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

  test('should persist rules after closing and reopening popup', async () => {
    // Create a rule
    let page = await ExtensionUtils.openPopup(context, extensionId);

    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Persistent Rule');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    // Verify rule is there
    await expect(page.locator('text=Persistent Rule')).toBeVisible();

    // Close popup
    await page.close();

    // Reopen popup
    page = await ExtensionUtils.openPopup(context, extensionId);

    // Rule should still be there
    await expect(page.locator('text=Persistent Rule')).toBeVisible();

    await page.close();
  });

  test('should persist rule enabled/disabled state', async () => {
    let page = await ExtensionUtils.openPopup(context, extensionId);

    // Create a rule
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Toggle Persist');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    // Disable the rule
    const toggle = page.locator('button[role="switch"]').first();
    await toggle.click();
    await expect(page.locator('text=0 of 1 active')).toBeVisible();

    // Close and reopen
    await page.close();
    page = await ExtensionUtils.openPopup(context, extensionId);

    // Should still be disabled
    await expect(page.locator('text=0 of 1 active')).toBeVisible();

    await page.close();
  });

  test('should persist multiple rules', async () => {
    let page = await ExtensionUtils.openPopup(context, extensionId);

    // Create 3 rules
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("New Rule")');
      await page.fill('input[placeholder*="name"]', `Multi Rule ${i}`);
      await page.fill('input[placeholder*="pattern"]', `https://example${i}.com`);
      await page.selectOption('select[id*="type"]', { label: 'Block Request' });
      await page.click('button:has-text("Save")');
    }

    await page.close();

    // Reopen and verify all rules
    page = await ExtensionUtils.openPopup(context, extensionId);

    await expect(page.locator('text=Multi Rule 1')).toBeVisible();
    await expect(page.locator('text=Multi Rule 2')).toBeVisible();
    await expect(page.locator('text=Multi Rule 3')).toBeVisible();
    await expect(page.locator('text=3 of 3 active')).toBeVisible();

    await page.close();
  });

  test('should persist header modifications', async () => {
    let page = await ExtensionUtils.openPopup(context, extensionId);

    // Create header modification rule
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Header Persist');
    await page.fill('input[placeholder*="pattern"]', 'https://httpbin.org/headers');
    await page.selectOption('select[id*="type"]', { label: 'Header Modification' });

    // Add header
    await page.click('button:has-text("Add Header")');
    await page.fill('input[placeholder*="Header Name"]', 'X-Persistent-Header');
    await page.fill('input[placeholder*="Header Value"]', 'persistent-value');

    await page.click('button:has-text("Save")');

    await page.close();

    // Reopen and edit the rule to verify headers persisted
    page = await ExtensionUtils.openPopup(context, extensionId);
    await page.click('button[aria-label*="Edit"]');

    // Verify header is still there
    await expect(page.locator('input[value="X-Persistent-Header"]')).toBeVisible();
    await expect(page.locator('input[value="persistent-value"]')).toBeVisible();

    await page.close();
  });

  test('should persist redirect URL', async () => {
    let page = await ExtensionUtils.openPopup(context, extensionId);

    // Create redirect rule
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Redirect Persist');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com');
    await page.selectOption('select[id*="type"]', { label: 'URL Redirection' });
    await page.fill('input[placeholder*="redirect"]', 'https://example.org');

    await page.click('button:has-text("Save")');

    await page.close();

    // Reopen and edit to verify
    page = await ExtensionUtils.openPopup(context, extensionId);
    await page.click('button[aria-label*="Edit"]');

    await expect(page.locator('input[value="https://example.org"]')).toBeVisible();

    await page.close();
  });

  test('should maintain data integrity across multiple operations', async () => {
    let page = await ExtensionUtils.openPopup(context, extensionId);

    // Create rule 1
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Rule 1');
    await page.fill('input[placeholder*="pattern"]', 'https://example1.com');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    // Create rule 2
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Rule 2');
    await page.fill('input[placeholder*="pattern"]', 'https://example2.com');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    // Disable rule 1
    const toggles = page.locator('button[role="switch"]');
    await toggles.first().click();

    // Delete rule 2
    const deleteButtons = page.locator('button[aria-label*="Delete"]');
    await deleteButtons.last().click();
    await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');

    await page.close();

    // Reopen and verify state
    page = await ExtensionUtils.openPopup(context, extensionId);

    // Only rule 1 should exist and be disabled
    await expect(page.locator('text=Rule 1')).toBeVisible();
    await expect(page.locator('text=Rule 2')).not.toBeVisible();
    await expect(page.locator('text=0 of 1 active')).toBeVisible();

    await page.close();
  });

  test('should handle storage with special characters', async () => {
    let page = await ExtensionUtils.openPopup(context, extensionId);

    // Create rule with special characters
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Test & Special <Characters>');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com?param=value&other=test');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    await page.close();

    // Reopen and verify
    page = await ExtensionUtils.openPopup(context, extensionId);
    await expect(page.locator('text=Test & Special <Characters>')).toBeVisible();

    await page.close();
  });

  test('should verify storage directly', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Create a rule
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Storage Test');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    // Check storage directly
    const rules = await ExtensionUtils.getRules(page);

    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('Storage Test');
    expect(rules[0].matcher.pattern).toBe('https://example.com');
    expect(rules[0].type).toBe('block');
    expect(rules[0].enabled).toBe(true);
    expect(rules[0].id).toBeDefined();
    expect(rules[0].createdAt).toBeDefined();
    expect(rules[0].updatedAt).toBeDefined();

    await page.close();
  });
});
