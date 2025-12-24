import { test, expect, chromium, BrowserContext } from '@playwright/test';
import { ExtensionUtils } from './extension-utils';
import { TestServer } from './test-server';
import path from 'path';

test.describe('FlowCraft - URL Pattern Matching', () => {
  let context: BrowserContext;
  let extensionId: string;
  let testServer: TestServer;
  let testAppUrl: string;

  test.beforeAll(async () => {
    testServer = new TestServer(3458);
    testAppUrl = await testServer.start();
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'url-matching');

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

  test('should match exact URL pattern', async () => {
    test.setTimeout(15000);
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    await optionsPage.getByTestId('new-rule-btn').click();
    await optionsPage.fill('input[placeholder*="CORS"]', 'Exact Match Test');
    await optionsPage.fill('input[placeholder*="api.example.com"]', `${testAppUrl}/data.json`);

    // Explicitly select exact pattern type
    await optionsPage.selectOption('select#pattern-type', { value: 'exact' });
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });
    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();
    await optionsPage.getByTestId('status-code-input').fill('200');
    await optionsPage.getByTestId('response-body-textarea').fill('{"matched":"exact"}');

    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();

    // Wait for rule to be fully saved and applied
    await optionsPage.waitForTimeout(1000);
    await optionsPage.close();

    // Test exact match
    const testPage = await context.newPage();
    await testPage.goto(testAppUrl);
    await testPage.waitForLoadState('domcontentloaded');
    await testPage.waitForTimeout(2000);

    await testPage.evaluate(() => window.testApp.fetchData());
    await testPage.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });
    const result = await testPage.evaluate(() => window.testResult);

    expect(result.data).toMatchObject({ matched: 'exact' });
    await testPage.close();
  });

  test('should match wildcard URL pattern', async () => {
    test.setTimeout(15000);
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    await optionsPage.getByTestId('new-rule-btn').click();
    await optionsPage.fill('input[placeholder*="CORS"]', 'Wildcard Match Test');
    await optionsPage.fill('input[placeholder*="api.example.com"]', '*/data.json');

    await optionsPage.selectOption('select#pattern-type', { value: 'wildcard' });
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });
    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();
    await optionsPage.getByTestId('status-code-input').fill('200');
    await optionsPage.getByTestId('response-body-textarea').fill('{"matched":"wildcard"}');

    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();
    await optionsPage.close();

    // Test wildcard match
    const testPage = await context.newPage();
    await testPage.goto(testAppUrl);
    await testPage.waitForLoadState('domcontentloaded');
    await testPage.waitForTimeout(1500);

    await testPage.evaluate(() => window.testApp.fetchData());
    await testPage.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });
    const result = await testPage.evaluate(() => window.testResult);

    expect(result.data).toMatchObject({ matched: 'wildcard' });
    await testPage.close();
  });

  test('should match regex URL pattern', async () => {
    test.setTimeout(15000);
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    await optionsPage.getByTestId('new-rule-btn').click();
    await optionsPage.fill('input[placeholder*="CORS"]', 'Regex Match Test');
    await optionsPage.fill('input[placeholder*="api.example.com"]', '.*/data\\.json$');

    await optionsPage.selectOption('select#pattern-type', { value: 'regex' });
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });
    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();
    await optionsPage.getByTestId('status-code-input').fill('200');
    await optionsPage.getByTestId('response-body-textarea').fill('{"matched":"regex"}');

    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();
    await optionsPage.close();

    // Test regex match
    const testPage = await context.newPage();
    await testPage.goto(testAppUrl);
    await testPage.waitForLoadState('domcontentloaded');
    await testPage.waitForTimeout(1500);

    await testPage.evaluate(() => window.testApp.fetchData());
    await testPage.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });
    const result = await testPage.evaluate(() => window.testResult);

    expect(result.data).toMatchObject({ matched: 'regex' });
    await testPage.close();
  });

  test('should not apply disabled rules', async () => {
    test.setTimeout(15000);
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    // Create rule
    await optionsPage.getByTestId('new-rule-btn').click();
    await optionsPage.fill('input[placeholder*="CORS"]', 'Disabled Rule');
    await optionsPage.fill('input[placeholder*="api.example.com"]', `${testAppUrl}/data.json`);
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });
    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();
    await optionsPage.getByTestId('status-code-input').fill('200');
    await optionsPage.getByTestId('response-body-textarea').fill('{"disabled":"true"}');
    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();

    // Disable the rule
    const ruleRow = optionsPage.locator('tr:has-text("Disabled Rule")');
    await expect(ruleRow).toBeVisible();
    const toggleButton = ruleRow.locator('button').first();
    await toggleButton.click();
    await optionsPage.waitForTimeout(500);

    await optionsPage.close();

    // Test that rule is not applied
    const testPage = await context.newPage();
    await testPage.goto(testAppUrl);
    await testPage.waitForLoadState('domcontentloaded');
    await testPage.waitForTimeout(1500);

    await testPage.evaluate(() => window.testApp.fetchData());
    await testPage.waitForFunction(() => window.testResult !== undefined, { timeout: 5000 });
    const result = await testPage.evaluate(() => window.testResult);

    // Should get real data, not mocked
    expect(result.data).toMatchObject({
      message: 'This is the REAL data from data.json',
      source: 'original-file'
    });
    await testPage.close();
  });
});
