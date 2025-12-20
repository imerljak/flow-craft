import { Page, BrowserContext } from '@playwright/test';
import { StorageSchema } from '../../src/shared/types';

/**
 * Extension testing utilities for Playwright E2E tests
 */
export class ExtensionUtils {
  /**
   * Gets the extension ID from the loaded extensions
   */
  static async getExtensionId(context: BrowserContext): Promise<string> {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    console.log("!!! SERVICE WORKER URL: ", background.url());
    const extensionId = background.url().split('/')[2];
    if (!extensionId) {
      throw new Error('Could not find extension ID from service worker URL');
    }

    return extensionId;
  }

  /**
   * Opens the extension popup
   */
  static async openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
    const popupUrl = `chrome-extension://${extensionId}/index.html`;
    const page = await context.newPage();

    // Debug logging
    page.on('console', msg => console.log(`[Popup Console]: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[Popup Error]: ${err.message}`));

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
        chrome.storage.local.get<Partial<StorageSchema>>(['rules'], (result) => {
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
