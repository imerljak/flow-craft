import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Rule Management (Options Page)', () => {
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
    const page = await ExtensionUtils.openOptions(context, extensionId);
    await ExtensionUtils.clearStorage(page);
    await page.close();
  });

  test('should open options page and show empty state', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Verify logo is visible
    await expect(page.locator('img[alt="FlowCraft"]')).toBeVisible();

    // Verify sidebar navigation
    await expect(page.getByRole('button', { name: /HTTP Rules/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Settings/ })).toBeVisible();

    // Verify empty state
    await expect(page.locator('text=No rules yet')).toBeVisible();

    // Verify "+ New Rule" button
    await expect(page.locator('button:has-text("+ New Rule")')).toBeVisible();

    await page.close();
  });

  test('should create a header modification rule', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Click "+ New Rule" button
    await page.click('button:has-text("+ New Rule")');

    // Wait for modal to appear
    await expect(page.locator('text=Rule Name')).toBeVisible({ timeout: 3000 });

    // Fill in rule details
    await page.fill('input[placeholder*="CORS"]', 'Test Header Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://httpbin.org/headers');

    // Select rule type
    await page.selectOption('select#rule-type', { value: 'header_modification' });

    // Save rule
    await page.click('button:has-text("Save Rule")');

    // Wait for modal to close and rule to appear in table
    await page.waitForTimeout(1000);

    // Verify rule appears in the table
    await expect(page.locator('text=Test Header Rule')).toBeVisible({ timeout: 3000 });

    // Verify rule count
    const rules = await ExtensionUtils.getRules(page);
    expect(rules.length).toBe(1);
    expect(rules[0]?.name).toBe('Test Header Rule');

    await page.close();
  });

  test('should create a URL redirection rule', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Click "+ New Rule" button
    await page.click('button:has-text("+ New Rule")');

    // Wait for modal
    await expect(page.locator('text=Rule Name')).toBeVisible({ timeout: 3000 });

    // Fill in rule details
    await page.fill('input[placeholder*="CORS"]', 'Redirect Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://old.example.com');

    // Select URL redirect type
    await page.selectOption('select#rule-type', { value: 'url_redirect' });

    // Wait for redirect URL field to appear
    await expect(page.locator('text=Redirect URL')).toBeVisible({ timeout: 2000 });

    // Fill redirect URL
    await page.fill('input[placeholder*="new.example.com"]', 'https://new.example.com');

    // Save rule
    await page.click('button:has-text("Save Rule")');

    // Wait for modal to close
    await page.waitForTimeout(1000);

    // Verify rule appears
    await expect(page.locator('text=Redirect Rule')).toBeVisible({ timeout: 3000 });

    // Verify in storage
    const rules = await ExtensionUtils.getRules(page);
    expect(rules.length).toBe(1);
    expect(rules[0]?.action.type).toBe('url_redirect');

    await page.close();
  });

  test('should create a block request rule', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Click "+ New Rule" button
    await page.click('button:has-text("+ New Rule")');

    // Wait for modal
    await expect(page.locator('text=Rule Name')).toBeVisible({ timeout: 3000 });

    // Fill in rule details
    await page.fill('input[placeholder*="CORS"]', 'Block Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://blocked.example.com');

    // Select block type
    await page.selectOption('select#rule-type', { value: 'request_block' });

    // Save rule
    await page.click('button:has-text("Save Rule")');

    // Wait for modal to close
    await page.waitForTimeout(1000);

    // Verify rule appears
    await expect(page.locator('text=Block Rule')).toBeVisible({ timeout: 3000 });

    // Verify block icon
    await expect(page.locator('text=🚫 Block')).toBeVisible();

    await page.close();
  });

  test('should toggle rule on/off in table', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create a rule first
    await page.click('button:has-text("+ New Rule")');
    await page.fill('input[placeholder*="CORS"]', 'Toggle Test Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://test.com');
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Find the rule row
    const ruleRow = page.locator('tr:has-text("Toggle Test Rule")');
    await expect(ruleRow).toBeVisible();

    // Click the toggle switch (it should be in the Status column)
    const toggleButton = ruleRow.locator('button').first();
    await toggleButton.click();

    // Wait for state to update
    await page.waitForTimeout(500);

    // Toggle back on
    await toggleButton.click();
    await page.waitForTimeout(500);

    await page.close();
  });

  test('should delete a rule with confirmation', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create a rule first
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Rule to Delete');
    await page.fill('input[placeholder*="api.example.com"]', 'https://delete.com');
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Verify rule exists
    await expect(page.locator('text=Rule to Delete')).toBeVisible();

    // Get the rule ID from storage
    const rules = await ExtensionUtils.getRules(page);
    const ruleToDelete = rules.find((r) => r.name === 'Rule to Delete');
    expect(ruleToDelete).toBeDefined();

    // Click delete button using test ID
    await page.getByTestId(`delete-rule-${ruleToDelete!.id}`).click();

    // Wait for confirmation modal and confirm deletion
    await expect(page.getByTestId('delete-confirm-modal')).toBeVisible({ timeout: 2000 });
    await page.getByTestId('delete-confirm-btn').click();

    // Wait for modal to close
    await page.waitForTimeout(1000);

    // Verify rule is gone
    await expect(page.locator('text=Rule to Delete')).not.toBeVisible();

    // Verify empty state returns
    await expect(page.locator('text=No rules yet')).toBeVisible();

    await page.close();
  });

  test('should edit an existing rule', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create a rule first
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Original Name');
    await page.fill('input[placeholder*="api.example.com"]', 'https://original.com');
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Get the rule ID from storage
    const rules = await ExtensionUtils.getRules(page);
    const ruleToEdit = rules.find((r) => r.name === 'Original Name');
    expect(ruleToEdit).toBeDefined();

    // Click edit button using test ID
    await page.getByTestId(`edit-rule-${ruleToEdit!.id}`).click();

    // Wait for edit modal to open
    await expect(page.getByTestId('rule-editor-modal')).toBeVisible({ timeout: 3000 });

    // Find and change the name input
    const nameInput = page.locator('input[placeholder*="CORS"]');
    await nameInput.clear();
    await nameInput.fill('Updated Name');

    // Save changes
    await page.click('button:has-text("Save Rule")');
    await page.waitForTimeout(1000);

    // Verify updated name appears
    await expect(page.locator('text=Updated Name')).toBeVisible();
    await expect(page.locator('text=Original Name')).not.toBeVisible();

    await page.close();
  });
});
