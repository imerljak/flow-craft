import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Rule Management', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    // Unique user data dir for this test suite
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'rule-management');

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
    const page = await ExtensionUtils.openPopup(context, extensionId);
    await ExtensionUtils.clearStorage(page);
    await page.close();
  });

  test('should create a header modification rule', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Open modal
    await page.click('button:has-text("New Rule")');

    // Fill in rule details
    await page.fill('input[placeholder*="name"]', 'Test Header Rule');
    await page.fill('input[placeholder*="pattern"]', 'https://httpbin.org/headers');

    // Select rule type
    await page.selectOption('select', { label: 'Header Modification' });

    // Wait for header editor to appear
    await expect(page.locator('text=Add Header')).toBeVisible();

    // Add a header
    await page.click('button:has-text("Add Header")');

    // Fill header details
    await page.fill('input[placeholder*="Header Name"]', 'X-Test-Header');
    await page.fill('input[placeholder*="Header Value"]', 'test-value');

    // Save rule
    await page.click('button:has-text("Save")');

    // Verify modal closed
    await expect(page.locator('text=Create New Rule')).not.toBeVisible();

    // Verify rule appears in list
    await expect(page.locator('text=Test Header Rule')).toBeVisible();

    // Verify rule count
    await expect(page.locator('text=1 of 1 active')).toBeVisible();

    // Verify storage
    const rules = await ExtensionUtils.getRules(page);
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('Test Header Rule');
    expect(rules[0].enabled).toBe(true);

    await page.close();
  });

  test('should create a URL redirection rule', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Open modal
    await page.click('button:has-text("New Rule")');

    // Fill in rule details
    await page.fill('input[placeholder*="name"]', 'Redirect Rule');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com');

    // Select rule type
    await page.selectOption('select', { label: 'URL Redirection' });

    // Wait for redirect URL field
    await expect(page.locator('text=Redirect URL')).toBeVisible();

    // Fill redirect URL
    await page.fill('input[placeholder*="redirect"]', 'https://example.org');

    // Save rule
    await page.click('button:has-text("Save")');

    // Verify rule created
    await expect(page.locator('text=Redirect Rule')).toBeVisible();

    await page.close();
  });

  test('should create a block request rule', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Open modal
    await page.click('button:has-text("New Rule")');

    // Fill in rule details
    await page.fill('input[placeholder*="name"]', 'Block Tracker');
    await page.fill('input[placeholder*="pattern"]', 'https://tracker.example.com/*');

    // Select pattern type
    await page.selectOption('select[id*="pattern"]', { label: 'Wildcard' });

    // Select rule type
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });

    // Save rule
    await page.click('button:has-text("Save")');

    // Verify rule created
    await expect(page.locator('text=Block Tracker')).toBeVisible();

    await page.close();
  });

  test('should toggle rule on/off', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Create a rule first
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Toggle Test');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    // Verify rule is enabled
    await expect(page.locator('text=1 of 1 active')).toBeVisible();

    // Find and click the toggle
    const toggle = page.locator('button[role="switch"]').first();
    await toggle.click();

    // Verify rule is disabled
    await expect(page.locator('text=0 of 1 active')).toBeVisible();

    // Toggle back on
    await toggle.click();
    await expect(page.locator('text=1 of 1 active')).toBeVisible();

    await page.close();
  });

  test('should edit an existing rule', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Create a rule
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'Original Name');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    // Click edit button
    await page.click('button[aria-label*="Edit"]');

    // Verify modal title changed
    await expect(page.locator('text=Edit Rule')).toBeVisible();

    // Change the name
    await page.fill('input[placeholder*="name"]', 'Updated Name');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify updated name appears
    await expect(page.locator('text=Updated Name')).toBeVisible();
    await expect(page.locator('text=Original Name')).not.toBeVisible();

    await page.close();
  });

  test('should delete a rule with confirmation', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Create a rule
    await page.click('button:has-text("New Rule")');
    await page.fill('input[placeholder*="name"]', 'To Be Deleted');
    await page.fill('input[placeholder*="pattern"]', 'https://example.com');
    await page.selectOption('select[id*="type"]', { label: 'Block Request' });
    await page.click('button:has-text("Save")');

    // Verify rule exists
    await expect(page.locator('text=To Be Deleted')).toBeVisible();

    // Click delete button
    await page.click('button[aria-label*="Delete"]');

    // Verify confirmation dialog
    await expect(page.locator('text=Are you sure')).toBeVisible();

    // Cancel first
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=To Be Deleted')).toBeVisible();

    // Delete again and confirm
    await page.click('button[aria-label*="Delete"]');
    await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');

    // Verify rule is gone
    await expect(page.locator('text=To Be Deleted')).not.toBeVisible();
    await expect(page.locator('text=No rules yet')).toBeVisible();

    await page.close();
  });

  test('should create multiple rules', async () => {
    const page = await ExtensionUtils.openPopup(context, extensionId);

    // Create 3 rules
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("New Rule")');
      await page.fill('input[placeholder*="name"]', `Rule ${i}`);
      await page.fill('input[placeholder*="pattern"]', `https://example${i}.com`);
      await page.selectOption('select[id*="type"]', { label: 'Block Request' });
      await page.click('button:has-text("Save")');
    }

    // Verify all rules appear
    await expect(page.locator('text=Rule 1')).toBeVisible();
    await expect(page.locator('text=Rule 2')).toBeVisible();
    await expect(page.locator('text=Rule 3')).toBeVisible();

    // Verify count
    await expect(page.locator('text=3 of 3 active')).toBeVisible();

    await page.close();
  });
});
