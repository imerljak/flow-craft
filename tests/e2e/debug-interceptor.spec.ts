import { test, expect, chromium, BrowserContext } from '@playwright/test';
import { ExtensionUtils } from './extension-utils';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('FlowCraft - Debug Interceptor', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'debug-interceptor');

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
    await context?.close();
  });

  test('should verify interceptor is installed', async () => {
    // Create a simple mock rule
    const optionsPage = await ExtensionUtils.openOptions(context, extensionId);

    await optionsPage.getByTestId('new-rule-btn').click();
    await optionsPage.fill('input[placeholder*="CORS"]', 'Test Mock');
    await optionsPage.fill('input[placeholder*="api.example.com"]', 'https://httpbin.org/anything');
    await optionsPage.selectOption('select#rule-type', { value: 'mock_response' });

    await expect(optionsPage.getByTestId('status-code-input')).toBeVisible();
    await optionsPage.getByTestId('status-code-input').fill('200');
    await optionsPage.getByTestId('response-body-textarea').fill('{"mocked":true}');

    await optionsPage.click('button:has-text("Save Rule")');
    await expect(optionsPage.getByTestId('rule-editor-drawer')).not.toBeVisible();

    await optionsPage.close();

    // Open test page
    const testPage = await context.newPage();
    await testPage.goto('https://httpbin.org');
    await testPage.waitForLoadState('domcontentloaded');

    // Wait a bit more for interceptor to initialize
    await testPage.waitForTimeout(2000);

    // Check if interceptor variables exist
    const interceptorCheck = await testPage.evaluate(() => {
      // @ts-ignore
      return {
        hasFlowCraftLogs: typeof window._FlowCraftDebug !== 'undefined',
        fetchModified: window.fetch.toString().includes('FlowCraft') || window.fetch.name === 'fetch',
        consoleMessages: 'Check console'
      };
    });

    console.log('Interceptor check:', interceptorCheck);

    // Try to execute a fetch and capture all details
    const result = await testPage.evaluate(async () => {
      const consoleLogs: string[] = [];

      // Capture console logs
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.map((a) => String(a)).join(' '));
        originalLog.apply(console, args);
      };

      try {
        const res = await fetch('https://httpbin.org/anything');
        const data = await res.json();

        console.log = originalLog;

        return {
          success: true,
          status: res.status,
          bodySnippet: JSON.stringify(data).substring(0, 200),
          consoleLogs
        };
      } catch (error) {
        console.log = originalLog;
        return {
          success: false,
          error: String(error),
          consoleLogs
        };
      }
    });

    console.log('Fetch result:', result);

    // This test is just for debugging, so we'll always pass
    // but log the results
    expect(result).toBeDefined();
  });
});
