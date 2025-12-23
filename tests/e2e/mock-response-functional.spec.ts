import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ExtensionUtils } from './extension-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('FlowCraft - Mock Response Functional Test', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'mock-response-functional');

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

  test('should intercept fetch request and return mock response', async () => {
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    // Create a mock response rule for the coffee API
    await optionsPage.getByTestId('new-rule-btn').click();

    // Fill in rule details
    await optionsPage.fill('input[placeholder*="CORS"]', 'Mock Coffee API');
    await optionsPage.fill('input[placeholder*="api.example.com"]', 'https://api.sampleapis.com/coffee/hot');

    // Select mock response type
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });

    // Wait for mock response editor to appear
    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();

    // Set status code to 200
    await optionsPage.getByTestId('status-code-input').fill('200');

    // Set custom response body
    const mockBody = JSON.stringify({
      mocked: true,
      message: 'This is a mocked coffee response from FlowCraft',
      coffee: 'Espresso',
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
    await expect(optionsPage.locator('text=Mock Coffee API')).toBeVisible();

    // Close options page
    await optionsPage.close();

    // Open a new page to test the interception
    const testPage = await context.newPage();

    // Navigate to a test page (using httpbin.org as a simple test page)
    await testPage.goto('https://httpbin.org');
    await testPage.waitForLoadState('domcontentloaded');

    // Execute fetch in the page context and capture the response
    const response = await testPage.evaluate(async () => {
      try {
        const res = await fetch('https://api.sampleapis.com/coffee/hot');
        const data = await res.json();
        return {
          status: res.status,
          statusText: res.statusText,
          headers: {
            contentType: res.headers.get('Content-Type'),
          },
          body: data,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // Verify the mock response was returned
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mocked: true,
      message: 'This is a mocked coffee response from FlowCraft',
      coffee: 'Espresso',
    });
    expect(response.headers?.contentType).toBe('application/json');

    await testPage.close();
  });

  test('should intercept XMLHttpRequest and return mock response', async () => {
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    // Create a mock response rule
    await optionsPage.getByTestId('new-rule-btn').click();
    await optionsPage.fill('input[placeholder*="CORS"]', 'Mock XHR Coffee');
    await optionsPage.fill('input[placeholder*="api.example.com"]', 'https://api.sampleapis.com/coffee/hot');
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });

    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();

    await optionsPage.getByTestId('status-code-input').fill('404');
    await optionsPage.getByTestId('status-text-input').fill('Not Found');

    const mockBody = JSON.stringify({ error: 'Coffee not found' });
    await optionsPage.getByTestId('response-body-textarea').fill(mockBody);

    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();

    await optionsPage.close();

    // Test XHR
    const testPage = await context.newPage();
    await testPage.goto('https://httpbin.org');
    await testPage.waitForLoadState('domcontentloaded');

    const response = await testPage.evaluate(async () => {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.sampleapis.com/coffee/hot');

        xhr.onload = function () {
          resolve({
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
          });
        };

        xhr.onerror = function () {
          resolve({ error: 'XHR failed' });
        };

        xhr.send();
      });
    });

    // Verify the mock response
    expect(response).toMatchObject({
      status: 404,
      statusText: 'Not Found',
      responseText: JSON.stringify({ error: 'Coffee not found' }),
    });

    await testPage.close();
  });

  test('should respect delay in mock response', async () => {
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    // Create a mock response rule with delay
    await optionsPage.getByTestId('new-rule-btn').click();
    await optionsPage.fill('input[placeholder*="CORS"]', 'Delayed Mock');
    await optionsPage.fill('input[placeholder*="api.example.com"]', 'https://api.sampleapis.com/coffee/hot');
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });

    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();

    // Set delay to 2000ms
    await optionsPage.getByTestId('response-delay-input').fill('2000');
    await optionsPage.getByTestId('response-body-textarea').fill('{"delayed":true}');

    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();

    await optionsPage.close();

    // Test that the delay is respected
    const testPage = await context.newPage();
    await testPage.goto('https://httpbin.org');
    await testPage.waitForLoadState('domcontentloaded');

    const startTime = Date.now();
    await testPage.evaluate(async () => {
      await fetch('https://api.sampleapis.com/coffee/hot');
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify the request took at least 2000ms
    expect(duration).toBeGreaterThanOrEqual(1900); // Allow some margin

    await testPage.close();
  });

  test('should allow real request when rule is disabled', async () => {
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    // Create and then disable a mock rule
    await optionsPage.getByTestId('new-rule-btn').click();
    await optionsPage.fill('input[placeholder*="CORS"]', 'Disabled Mock');
    await optionsPage.fill('input[placeholder*="api.example.com"]', 'https://api.sampleapis.com/coffee/hot');
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });

    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();
    await optionsPage.getByTestId('response-body-textarea').fill('{"mocked":true}');

    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();

    // Disable the rule
    const ruleRow = optionsPage.locator('tr:has-text("Disabled Mock")');
    const toggleButton = ruleRow.locator('button').first();
    await toggleButton.click();

    await optionsPage.close();

    // Test that real API is called
    const testPage = await context.newPage();
    await testPage.goto('https://httpbin.org');
    await testPage.waitForLoadState('domcontentloaded');

    const response = await testPage.evaluate(async () => {
      try {
        const res = await fetch('https://api.sampleapis.com/coffee/hot');
        const data = await res.json();
        return {
          status: res.status,
          isArray: Array.isArray(data),
          hasMockedProperty: 'mocked' in data,
        };
      } catch (error) {
        return { error: String(error) };
      }
    });

    // Verify real API response (should be an array of coffee objects, not our mock)
    expect(response.status).toBe(200);
    expect(response.isArray).toBe(true);
    expect(response.hasMockedProperty).toBe(false);

    await testPage.close();
  });
});
