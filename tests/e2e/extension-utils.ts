import { Page, BrowserContext } from '@playwright/test';

/**
 * Extension testing utilities for Playwright E2E tests
 */
export class ExtensionUtils {
  /**
   * Gets the extension ID from the loaded extensions
   */
  static async getExtensionId(context: BrowserContext): Promise<string> {
    // Navigate to chrome://extensions to find the extension ID
    const page = await context.newPage();
    await page.goto('chrome://extensions');

    // Enable developer mode if not already enabled
    await page.evaluate(() => {
      const toggle = document.querySelector('extensions-manager')
        ?.shadowRoot?.querySelector('extensions-toolbar')
        ?.shadowRoot?.querySelector('#devMode');
      if (toggle && !(toggle as HTMLInputElement).checked) {
        (toggle as HTMLElement).click();
      }
    });

    // Get the extension ID
    const extensionId = await page.evaluate(() => {
      const extensionsManager = document.querySelector('extensions-manager');
      const itemsList = extensionsManager?.shadowRoot?.querySelector('extensions-item-list');
      const items = itemsList?.shadowRoot?.querySelectorAll('extensions-item');

      for (const item of Array.from(items || [])) {
        const name = item.shadowRoot?.querySelector('#name')?.textContent;
        if (name?.includes('FlowCraft')) {
          return item.getAttribute('id');
        }
      }
      return null;
    });

    await page.close();

    if (!extensionId) {
      throw new Error('FlowCraft extension not found. Make sure the extension is loaded.');
    }

    return extensionId;
  }

  /**
   * Opens the extension popup
   */
  static async openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
    const popupUrl = `chrome-extension://${extensionId}/index.html`;
    const page = await context.newPage();
    await page.goto(popupUrl);
    await page.waitForLoadState('domcontentloaded');
    return page;
  }

  /**
   * Opens the extension options page
   */
  static async openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
    const optionsUrl = `chrome-extension://${extensionId}/options.html`;
    const page = await context.newPage();
    await page.goto(optionsUrl);
    await page.waitForLoadState('domcontentloaded');
    return page;
  }

  /**
   * Clears all extension storage
   */
  static async clearStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      return chrome.storage.local.clear();
    });
  }

  /**
   * Gets all rules from storage
   */
  static async getRules(page: Page): Promise<any[]> {
    return page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.get('rules', (result) => {
          resolve(result.rules || []);
        });
      });
    });
  }

  /**
   * Waits for a rule to be created
   */
  static async waitForRuleCount(page: Page, count: number, timeout = 5000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const rules = await this.getRules(page);
      if (rules.length === count) {
        return;
      }
      await page.waitForTimeout(100);
    }
    throw new Error(`Timeout waiting for ${count} rules`);
  }
}
