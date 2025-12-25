/**
 * E2E tests for Rule Conflict Detection feature
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Conflict Detection', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'conflict-detection');

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

  test('should show conflict badge when conflicts exist', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create two rules with overlapping patterns
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Rule 1');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/*');
    await page.selectOption('select#rule-type', { value: 'header_modification' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Rule 2');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/api');
    await page.selectOption('select#rule-type', { value: 'header_modification' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Wait for conflict detection (debounced 1s)
    await page.waitForTimeout(1500);

    // Verify conflict badge appears
    const conflictBadge = page.locator('button:has-text("Conflict")');
    await expect(conflictBadge).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should display conflict details in modal', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create conflicting rules (same URL, same priority, different actions)
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Block Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://api.example.com/test');
    await page.selectOption('select#rule-type', { value: 'request_block' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Redirect Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://api.example.com/test');
    await page.selectOption('select#rule-type', { value: 'url_redirect' });
    await page.fill('input[placeholder*="https://example.com"]', 'https://redirect.com');
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Wait for conflict detection
    await page.waitForTimeout(1500);

    // Click conflict badge
    const conflictBadge = page.locator('button:has-text("Conflict")');
    await conflictBadge.click();

    // Verify conflict modal appears
    await expect(page.locator('text=Rule Conflicts')).toBeVisible();
    await expect(page.locator('text=Block Rule')).toBeVisible();
    await expect(page.locator('text=Redirect Rule')).toBeVisible();

    // Verify conflict details are shown
    await expect(page.locator('text=action_conflict').or(page.locator('text=Action Conflict'))).toBeVisible();

    await page.close();
  });

  test('should show conflict warnings in rule editor', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create first rule
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'First Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://test.com/api');
    await page.selectOption('select#rule-type', { value: 'request_block' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Create second rule with same pattern
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Second Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://test.com/api');

    // Wait for conflict check (debounced 500ms in editor)
    await page.waitForTimeout(800);

    // Verify conflict warning appears in editor
    await expect(
      page.locator('text=conflict').or(page.locator('text=already exists')).first()
    ).toBeVisible({ timeout: 2000 });

    await page.locator('button:has-text("Cancel")').click();
    await page.close();
  });

  test('should show pattern overlap conflicts', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create rule with wildcard pattern
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Wildcard Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/*');
    await page.selectOption('select[aria-label="Pattern Type"]', { value: 'wildcard' });
    await page.selectOption('select#rule-type', { value: 'header_modification' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Create rule with more specific pattern that overlaps
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Specific Rule');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/api/users');
    await page.selectOption('select[aria-label="Pattern Type"]', { value: 'exact' });
    await page.selectOption('select#rule-type', { value: 'header_modification' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Wait for conflict detection
    await page.waitForTimeout(1500);

    // Open conflicts
    const conflictBadge = page.locator('button:has-text("Conflict")');
    await conflictBadge.click();

    // Verify pattern overlap is detected
    await expect(
      page.locator('text=pattern_overlap').or(page.locator('text=Pattern Overlap'))
    ).toBeVisible();

    await page.close();
  });

  test('should show header modification conflicts', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create first header rule
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Header Rule 1');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/api');
    await page.selectOption('select#rule-type', { value: 'header_modification' });

    // Add header
    await page.click('button:has-text("Add Header")');
    const headerRows = page.locator('[data-testid^="header-row-"]');
    const row = headerRows.first();
    await row.locator('select').first().selectOption({ value: 'add' });
    await row.locator('input[placeholder="Header name"]').fill('X-Custom');
    await row.locator('input[placeholder="Header value"]').fill('value1');

    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Create second header rule with same header name
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Header Rule 2');
    await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/api');
    await page.selectOption('select#rule-type', { value: 'header_modification' });

    await page.click('button:has-text("Add Header")');
    const headerRows2 = page.locator('[data-testid^="header-row-"]');
    const row2 = headerRows2.first();
    await row2.locator('select').first().selectOption({ value: 'modify' });
    await row2.locator('input[placeholder="Header name"]').fill('X-Custom');
    await row2.locator('input[placeholder="Header value"]').fill('value2');

    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Wait for conflict detection
    await page.waitForTimeout(1500);

    // Open conflicts
    const conflictBadge = page.locator('button:has-text("Conflict")');
    await conflictBadge.click();

    // Verify header conflict is shown
    await expect(
      page.locator('text=header_conflict').or(page.locator('text=Header Conflict'))
    ).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should show no conflicts message when no conflicts exist', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create non-conflicting rules
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Rule A');
    await page.fill('input[placeholder*="api.example.com"]', 'https://siteA.com');
    await page.selectOption('select#rule-type', { value: 'request_block' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Rule B');
    await page.fill('input[placeholder*="api.example.com"]', 'https://siteB.com');
    await page.selectOption('select#rule-type', { value: 'url_redirect' });
    await page.fill('input[placeholder*="https://example.com"]', 'https://redirect.com');
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Wait for conflict detection
    await page.waitForTimeout(1500);

    // Verify no conflict badge
    const conflictBadge = page.locator('button:has-text("Conflict")');
    await expect(conflictBadge).not.toBeVisible();

    await page.close();
  });

  test('should allow viewing conflicting rules from conflict panel', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create two conflicting rules
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Viewable Rule 1');
    await page.fill('input[placeholder*="api.example.com"]', 'https://conflict.com');
    await page.selectOption('select#rule-type', { value: 'request_block' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Viewable Rule 2');
    await page.fill('input[placeholder*="api.example.com"]', 'https://conflict.com');
    await page.selectOption('select#rule-type', { value: 'url_redirect' });
    await page.fill('input[placeholder*="https://example.com"]', 'https://other.com');
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Wait for conflict detection
    await page.waitForTimeout(1500);

    // Open conflicts modal
    const conflictBadge = page.locator('button:has-text("Conflict")');
    await conflictBadge.click();

    // The rule names should be present in the conflict panel
    await expect(page.locator('text=Viewable Rule 1')).toBeVisible();
    await expect(page.locator('text=Viewable Rule 2')).toBeVisible();

    await page.close();
  });

  test('should update conflicts when rules are modified', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Create conflicting rules
    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Modify Test 1');
    await page.fill('input[placeholder*="api.example.com"]', 'https://same.com');
    await page.selectOption('select#rule-type', { value: 'request_block' });
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    await page.getByTestId('new-rule-btn').click();
    await page.fill('input[placeholder*="CORS"]', 'Modify Test 2');
    await page.fill('input[placeholder*="api.example.com"]', 'https://same.com');
    await page.selectOption('select#rule-type', { value: 'url_redirect' });
    await page.fill('input[placeholder*="https://example.com"]', 'https://redirect.com');
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Wait for conflict detection
    await page.waitForTimeout(1500);

    // Verify conflict exists
    await expect(page.locator('button:has-text("Conflict")')).toBeVisible({ timeout: 2000 });

    // Edit one rule to remove conflict
    const rules = await ExtensionUtils.getRules(page);
    const ruleToEdit = rules.find(r => r.name === 'Modify Test 2');
    expect(ruleToEdit).toBeDefined();

    await page.getByTestId(`edit-rule-${ruleToEdit!.id}`).click();
    await expect(page.getByTestId('rule-editor-drawer')).toBeVisible({ timeout: 3000 });

    // Change pattern to make it non-conflicting
    await page.fill('input[placeholder*="api.example.com"]', 'https://different.com');
    await page.locator('button:has-text("Save Rule")').click();
    await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

    // Wait for conflict re-detection
    await page.waitForTimeout(1500);

    // Verify conflict is gone
    await expect(page.locator('button:has-text("Conflict")')).not.toBeVisible();

    await page.close();
  });
});
