import { test, expect, chromium, BrowserContext } from '@playwright/test';
import { ExtensionUtils } from './extension-utils';
import { TestServer } from './test-server';
import path from 'path';

test.describe('FlowCraft - Mock Local File Test', () => {
  let context: BrowserContext;
  let extensionId: string;
  let testServer: TestServer;
  let testAppUrl: string;

  test.beforeAll(async () => {
    // Start HTTP server for test fixtures
    testServer = new TestServer(3456);
    testAppUrl = await testServer.start();
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'mock-local-file');

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
    await testServer.stop();
  });

  test.beforeEach(async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);
    await ExtensionUtils.clearStorage(page);
    await page.close();
  });

  test('should intercept local file fetch and return mock response', async () => {
    // Create mock rule for local data.json file
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    await optionsPage.getByTestId('new-rule-btn').click();

    // Fill in rule details - wildcard match for data.json (handles relative URLs)
    await optionsPage.fill('input[placeholder*="CORS"]', 'Mock Local Data File');
    await optionsPage.fill('input[placeholder*="api.example.com"]', '*/data.json');

    // Change to wildcard pattern to catch relative URLs like ./data.json
    await optionsPage.selectOption('select#pattern-type', { value: 'wildcard' });

    // Select mock response type
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });

    // Wait for mock response editor
    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();

    // Configure mock response
    await optionsPage.getByTestId('status-code-input').fill('200');

    const mockBody = JSON.stringify({
      message: 'This is MOCKED data from FlowCraft!',
      source: 'flowcraft-extension',
      mocked: true,
      items: ['intercepted', 'mocked', 'success']
    });
    await optionsPage.getByTestId('response-body-textarea').fill(mockBody);

    // Add Content-Type header
    await optionsPage.getByTestId('header-name-input').fill('Content-Type');
    await optionsPage.getByTestId('header-value-input').fill('application/json');
    await optionsPage.getByTestId('add-header-btn').click();

    // Save the rule
    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();

    // Verify rule was created
    await expect(optionsPage.locator('text=Mock Local Data File')).toBeVisible();

    await optionsPage.close();

    // Open the test app
    const testPage = await context.newPage();
    await testPage.goto(testAppUrl);
    await testPage.waitForLoadState('domcontentloaded');

    // Wait for interceptor to be ready
    await testPage.waitForTimeout(1000);

    // Test 1: Fetch API
    await testPage.evaluate(() => window.testApp.fetchData());

    // Wait for result to be stored
    await testPage.waitForFunction(() => window.testResult !== undefined);

    const fetchResult = await testPage.evaluate(() => window.testResult);

    // Verify the MOCKED response was returned
    expect(fetchResult.status).toBe(200);
    expect(fetchResult.data).toMatchObject({
      message: 'This is MOCKED data from FlowCraft!',
      source: 'flowcraft-extension',
      mocked: true
    });
    expect(fetchResult.data.items).toEqual(['intercepted', 'mocked', 'success']);

    // Test 2: XMLHttpRequest
    await testPage.evaluate(() => window.testApp.fetchDataXHR());

    // Wait for XHR result to be stored
    await testPage.waitForFunction(() => window.xhrTestResult !== undefined);

    const xhrResult = await testPage.evaluate(() => window.xhrTestResult);

    // Verify the MOCKED response was returned
    expect(xhrResult.status).toBe(200);
    expect(xhrResult.data).toMatchObject({
      message: 'This is MOCKED data from FlowCraft!',
      source: 'flowcraft-extension',
      mocked: true
    });
    expect(xhrResult.data.items).toEqual(['intercepted', 'mocked', 'success']);

    await testPage.close();
  });

  test('should return real file when mock rule is disabled', async () => {
    // Create a mock rule and then disable it
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    await optionsPage.getByTestId('new-rule-btn').click();

    await optionsPage.fill('input[placeholder*="CORS"]', 'Disabled Mock Rule');
    await optionsPage.fill('input[placeholder*="api.example.com"]', `${testAppUrl}/data.json`);
    // Pattern type defaults to 'exact'
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });

    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();
    await optionsPage.getByTestId('status-code-input').fill('200');
    await optionsPage.getByTestId('response-body-textarea').fill('{"mocked":true}');

    // Save the rule
    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();

    // Verify rule was created
    await expect(optionsPage.locator('text=Disabled Mock Rule')).toBeVisible();

    // Wait a moment for any animations/state updates
    await optionsPage.waitForTimeout(500);

    // Find the rule row and disable it via the toggle button
    const ruleRow = optionsPage.locator('tr:has-text("Disabled Mock Rule")');
    await expect(ruleRow).toBeVisible();

    // Click the toggle button (it's the first button in the row)
    const toggleButton = ruleRow.locator('button').first();
    await toggleButton.click();

    await optionsPage.close();

    // Open the test app
    const testPage = await context.newPage();
    await testPage.goto(testAppUrl);
    await testPage.waitForLoadState('domcontentloaded');

    await testPage.waitForTimeout(1000);

    // Fetch data
    await testPage.evaluate(() => window.testApp.fetchData());
    await testPage.waitForFunction(() => window.testResult !== undefined);

    const result = await testPage.evaluate(() => window.testResult);

    // Should get REAL data from the file
    expect(result.data).toMatchObject({
      message: 'This is the REAL data from data.json',
      source: 'original-file'
    });
    expect(result.data.items).toEqual(['apple', 'banana', 'cherry']);

    await testPage.close();
  });
});
