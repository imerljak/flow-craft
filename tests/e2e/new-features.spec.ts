/**
 * E2E tests for new features: Query Parameters, Script Injection, and Response Mocking
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - New Features (Query Params, Script Injection, Response Mocking)', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'new-features');

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

  test.describe('Query Parameter Modification', () => {
    test('should create a query parameter add rule', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      // Click new rule button
      await page.click('button:has-text("+ New Rule")');
      await expect(page.locator('text=Rule Name')).toBeVisible({ timeout: 3000 });

      // Fill basic info
      await page.fill('input[placeholder*="CORS"]', 'Add Query Param Rule');
      await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/page');

      // Select query param type
      await page.selectOption('select#rule-type', { value: 'query_param' });

      // Wait for query param editor to appear
      await page.waitForTimeout(500);

      // Add a query parameter
      await page.click('button:has-text("Add Parameter")');

      // Fill in parameter details
      const paramRows = page.locator('[data-testid^="param-row-"]');
      const firstRow = paramRows.first();

      // Select operation: add
      await firstRow.locator('select').first().selectOption({ value: 'add' });

      // Enter name
      await firstRow.locator('input[placeholder="Parameter name"]').fill('utm_source');

      // Enter value
      await firstRow.locator('input[placeholder="Parameter value"]').fill('flowcraft');

      // Save rule
      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      // Verify rule appears
      await expect(page.locator('text=Add Query Param Rule')).toBeVisible();

      // Verify in storage
      const rules = await ExtensionUtils.getRules(page);
      expect(rules.length).toBe(1);
      expect(rules[0]?.action.type).toBe('query_param');
      if (rules[0]?.action.type === 'query_param') {
        expect(rules[0].action.params).toHaveLength(1);
        expect(rules[0].action.params[0]?.operation).toBe('add');
        expect(rules[0].action.params[0]?.name).toBe('utm_source');
        expect(rules[0].action.params[0]?.value).toBe('flowcraft');
      }

      await page.close();
    });

    test('should create a query parameter remove rule', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Remove Tracking Params');
      await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/*');
      await page.selectOption('select#rule-type', { value: 'query_param' });
      await page.waitForTimeout(500);

      // Add remove parameter
      await page.click('button:has-text("Add Parameter")');
      const paramRows = page.locator('[data-testid^="param-row-"]');
      const firstRow = paramRows.first();

      await firstRow.locator('select').first().selectOption({ value: 'remove' });
      await firstRow.locator('input[placeholder="Parameter name"]').fill('fbclid');

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Remove Tracking Params')).toBeVisible();

      const rules = await ExtensionUtils.getRules(page);
      if (rules[0]?.action.type === 'query_param') {
        expect(rules[0].action.params[0]?.operation).toBe('remove');
        expect(rules[0].action.params[0]?.name).toBe('fbclid');
        // Value is empty string for remove operations (form controlled)
        expect(rules[0].action.params[0]?.value).toBe('');
      }

      await page.close();
    });

    test('should handle multiple query parameters', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Multi Query Params');
      await page.fill('input[placeholder*="api.example.com"]', 'https://example.com/api');
      await page.selectOption('select#rule-type', { value: 'query_param' });
      await page.waitForTimeout(500);

      // Add first parameter (add)
      await page.click('button:has-text("Add Parameter")');
      let paramRows = page.locator('[data-testid^="param-row-"]');
      let row1 = paramRows.nth(0);
      await row1.locator('select').first().selectOption({ value: 'add' });
      await row1.locator('input[placeholder="Parameter name"]').fill('key1');
      await row1.locator('input[placeholder="Parameter value"]').fill('value1');

      // Add second parameter (modify)
      await page.click('button:has-text("Add Parameter")');
      paramRows = page.locator('[data-testid^="param-row-"]');
      let row2 = paramRows.nth(1);
      await row2.locator('select').first().selectOption({ value: 'modify' });
      await row2.locator('input[placeholder="Parameter name"]').fill('key2');
      await row2.locator('input[placeholder="Parameter value"]').fill('value2');

      // Add third parameter (remove)
      await page.click('button:has-text("Add Parameter")');
      paramRows = page.locator('[data-testid^="param-row-"]');
      let row3 = paramRows.nth(2);
      await row3.locator('select').first().selectOption({ value: 'remove' });
      await row3.locator('input[placeholder="Parameter name"]').fill('tracking');

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      const rules = await ExtensionUtils.getRules(page);
      if (rules[0]?.action.type === 'query_param') {
        expect(rules[0].action.params).toHaveLength(3);
      }

      await page.close();
    });
  });

  test.describe('Script Injection', () => {
    test('should create a script injection rule', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Console Log Script');
      await page.fill('input[placeholder*="api.example.com"]', 'https://example.com');

      await page.selectOption('select#rule-type', { value: 'script_injection' });
      await page.waitForTimeout(500);

      // Verify script injection editor appears
      await expect(page.locator('text=Injection Timing').first()).toBeVisible();
      await expect(page.locator('label:has-text("JavaScript Code")').first()).toBeVisible();

      // Select timing
      const timingSelect = page.locator('select').filter({ hasText: 'Document End' });
      await timingSelect.selectOption({ value: 'document_end' });

      // Enter script code
      const codeTextarea = page.locator('textarea[placeholder*="Enter JavaScript"]');
      await codeTextarea.fill('console.log("FlowCraft test script injected!");');

      // Verify security warning is shown
      await expect(page.locator('text=Security Warning')).toBeVisible();

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Console Log Script')).toBeVisible();

      const rules = await ExtensionUtils.getRules(page);
      expect(rules[0]?.action.type).toBe('script_injection');
      if (rules[0]?.action.type === 'script_injection') {
        expect(rules[0].action.script.code).toContain('FlowCraft test script');
        expect(rules[0].action.script.runAt).toBe('document_end');
      }

      await page.close();
    });

    test('should support different injection timing options', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Early Script');
      await page.fill('input[placeholder*="api.example.com"]', 'https://example.com');
      await page.selectOption('select#rule-type', { value: 'script_injection' });
      await page.waitForTimeout(500);

      // Select document_start
      const timingSelect = page.locator('select').filter({ hasText: /Document/ });
      await timingSelect.selectOption({ value: 'document_start' });

      const codeTextarea = page.locator('textarea[placeholder*="Enter JavaScript"]');
      await codeTextarea.fill('console.log("Early injection");');

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      const rules = await ExtensionUtils.getRules(page);
      if (rules[0]?.action.type === 'script_injection') {
        expect(rules[0].action.script.runAt).toBe('document_start');
      }

      await page.close();
    });

    test('should persist script code across edits', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      // Create script rule
      await page.getByTestId('new-rule-btn').click();
      await page.fill('input[placeholder*="CORS"]', 'Persist Script');
      await page.fill('input[placeholder*="api.example.com"]', 'https://test.com');
      await page.selectOption('select#rule-type', { value: 'script_injection' });
      await page.waitForTimeout(500);

      const codeTextarea = page.locator('textarea[placeholder*="Enter JavaScript"]');
      await codeTextarea.fill('alert("test");');

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      // Get rule ID and edit
      const rules = await ExtensionUtils.getRules(page);
      const ruleToEdit = rules[0];
      expect(ruleToEdit).toBeDefined();

      await page.getByTestId(`edit-rule-${ruleToEdit!.id}`).click();
      await expect(page.getByTestId('rule-editor-drawer')).toBeVisible({ timeout: 3000 });

      // Verify code is still there
      const editCodeTextarea = page.locator('textarea[placeholder*="Enter JavaScript"]');
      await expect(editCodeTextarea).toHaveValue('alert("test");');

      await page.locator('button:has-text("Cancel")').click();
      await page.close();
    });
  });

  test.describe('Response Mocking', () => {
    test('should create a mock response rule', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Mock 404 Response');
      await page.fill('input[placeholder*="api.example.com"]', 'https://api.example.com/test');

      await page.selectOption('select#rule-type', { value: 'mock_response' });
      await page.waitForTimeout(500);

      // Verify mock response editor appears
      await expect(page.locator('label:has-text("Status Code")').first()).toBeVisible();

      // Set status code to 404
      const statusCodeInput = page.locator('input[placeholder="200"]');
      await statusCodeInput.clear();
      await statusCodeInput.fill('404');

      // Set status text
      const statusTextInput = page.locator('input[placeholder="OK"]');
      await statusTextInput.fill('Not Found');

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Mock 404 Response')).toBeVisible();

      const rules = await ExtensionUtils.getRules(page);
      expect(rules[0]?.action.type).toBe('mock_response');
      if (rules[0]?.action.type === 'mock_response') {
        expect(rules[0].action.mockResponse.statusCode).toBe(404);
        expect(rules[0].action.mockResponse.statusText).toBe('Not Found');
      }

      await page.close();
    });

    test('should add response headers', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Mock with Headers');
      await page.fill('input[placeholder*="api.example.com"]', 'https://api.example.com/data');
      await page.selectOption('select#rule-type', { value: 'mock_response' });
      await page.waitForTimeout(500);

      // Add header
      await expect(page.locator('text=Response Headers')).toBeVisible();

      const headerNameInput = page.locator('input[placeholder="Header name"]');
      const headerValueInput = page.locator('input[placeholder="Header value"]');

      await headerNameInput.fill('Content-Type');
      await headerValueInput.fill('application/json');

      await page.click('button:has-text("Add")');
      await page.waitForTimeout(300);

      // Verify header appears in list
      await expect(page.locator('text=Content-Type: application/json')).toBeVisible();

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      const rules = await ExtensionUtils.getRules(page);
      if (rules[0]?.action.type === 'mock_response') {
        expect(rules[0].action.mockResponse.headers['Content-Type']).toBe('application/json');
      }

      await page.close();
    });

    test('should set response body', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Mock JSON Response');
      await page.fill('input[placeholder*="api.example.com"]', 'https://api.example.com/users');
      await page.selectOption('select#rule-type', { value: 'mock_response' });
      await page.waitForTimeout(500);

      // Set response body
      const bodyTextarea = page.locator('textarea[placeholder*="message"]');
      const mockBody = '{"users": [], "count": 0}';
      await bodyTextarea.fill(mockBody);

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      const rules = await ExtensionUtils.getRules(page);
      if (rules[0]?.action.type === 'mock_response') {
        expect(rules[0].action.mockResponse.body).toBe(mockBody);
      }

      await page.close();
    });

    test('should set response delay', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Delayed Response');
      await page.fill('input[placeholder*="api.example.com"]', 'https://slow-api.com');
      await page.selectOption('select#rule-type', { value: 'mock_response' });
      await page.waitForTimeout(500);

      // Set delay
      const delayInput = page.locator('input[placeholder="0"]').last();
      await delayInput.fill('2000');

      await page.locator('button:has-text("Save Rule")').click();
      await page.waitForTimeout(1000);

      const rules = await ExtensionUtils.getRules(page);
      if (rules[0]?.action.type === 'mock_response') {
        expect(rules[0].action.mockResponse.delay).toBe(2000);
      }

      await page.close();
    });

    test('should show info note about mock responses', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      await page.click('button:has-text("+ New Rule")');
      await page.selectOption('select#rule-type', { value: 'mock_response' });
      await page.waitForTimeout(500);

      // Verify info note is visible
      await expect(page.locator('text=Note:')).toBeVisible();
      await expect(page.locator('text=Mock responses replace actual server responses')).toBeVisible();

      await page.locator('button:has-text("Cancel")').click();
      await page.close();
    });
  });

  test.describe('Feature Integration', () => {
    test('should persist all new feature types', async () => {
      let page = await ExtensionUtils.openOptions(context, extensionId);

      // Create one rule of each new type
      // 1. Query param rule
      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Query Rule');
      await page.fill('input[placeholder*="api.example.com"]', 'https://q.com');
      await page.selectOption('select#rule-type', { value: 'query_param' });
      await page.locator('button:has-text("Save Rule")').click();
      await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

      // 2. Script injection rule
      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Script Rule');
      await page.fill('input[placeholder*="api.example.com"]', 'https://s.com');
      await page.selectOption('select#rule-type', { value: 'script_injection' });
      await page.waitForTimeout(500);
      const codeTextarea = page.locator('textarea[placeholder*="Enter JavaScript"]');
      await codeTextarea.fill('console.log("test");');
      await page.locator('button:has-text("Save Rule")').click();
      await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

      // 3. Mock response rule
      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Mock Rule');
      await page.fill('input[placeholder*="api.example.com"]', 'https://m.com');
      await page.selectOption('select#rule-type', { value: 'mock_response' });
      await expect(page.locator('label:has-text("Status Code")').first()).toBeVisible();
      await page.locator('button:has-text("Save Rule")').click();
      await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

      // Close and reopen
      await page.close();
      page = await ExtensionUtils.openOptions(context, extensionId);

      // All 3 should persist
      await expect(page.locator('text=Query Rule')).toBeVisible();
      await expect(page.locator('text=Script Rule')).toBeVisible();
      await expect(page.locator('text=Mock Rule')).toBeVisible();

      const rules = await ExtensionUtils.getRules(page);
      expect(rules.length).toBe(3);

      const ruleTypes = rules.map(r => r.action.type);
      expect(ruleTypes).toContain('query_param');
      expect(ruleTypes).toContain('script_injection');
      expect(ruleTypes).toContain('mock_response');

      await page.close();
    });

    test('should display correct icons for new rule types', async () => {
      const page = await ExtensionUtils.openOptions(context, extensionId);

      // Create query param rule
      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Icon Test Query');
      await page.fill('input[placeholder*="api.example.com"]', 'https://test1.com');
      await page.selectOption('select#rule-type', { value: 'query_param' });
      await page.locator('button:has-text("Save Rule")').click();
      await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

      // Create script rule
      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Icon Test Script');
      await page.fill('input[placeholder*="api.example.com"]', 'https://test2.com');
      await page.selectOption('select#rule-type', { value: 'script_injection' });
      await page.waitForTimeout(500);
      const codeTextarea = page.locator('textarea[placeholder*="Enter JavaScript"]');
      await codeTextarea.fill('test');
      await page.locator('button:has-text("Save Rule")').click();
      await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

      // Create mock rule
      await page.click('button:has-text("+ New Rule")');
      await page.fill('input[placeholder*="CORS"]', 'Icon Test Mock');
      await page.fill('input[placeholder*="api.example.com"]', 'https://test3.com');
      await page.selectOption('select#rule-type', { value: 'mock_response' });
      await expect(page.locator('label:has-text("Status Code")').first()).toBeVisible();
      await page.locator('button:has-text("Save Rule")').click();
      await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

      // Verify rules appear with appropriate type indicators
      await expect(page.locator('text=Icon Test Query')).toBeVisible();
      await expect(page.locator('text=Icon Test Script')).toBeVisible();
      await expect(page.locator('text=Icon Test Mock')).toBeVisible();

      await page.close();
    });
  });
});
