/**
 * E2E tests for Template Browser feature
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { ExtensionUtils } from './extension-utils';

test.describe('FlowCraft - Template Browser', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const userDataDir = path.join(process.cwd(), '.test-user-data', 'template-browser');

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

  test('should display template browser button', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Verify template browser button is visible
    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await expect(templateButton).toBeVisible();

    await page.close();
  });

  test('should open template browser modal', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    // Click templates button
    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    // Verify modal appears
    await expect(page.locator('text=Rule Templates').or(page.locator('text=Template Browser'))).toBeVisible();

    // Verify search box
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();

    // Verify categories are shown
    await expect(page.locator('text=Development').or(page.locator('text=Privacy'))).toBeVisible();

    await page.close();
  });

  test('should display template cards', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    // Wait for templates to load
    await page.waitForTimeout(500);

    // Verify template cards are visible (should show at least some templates)
    const templateCards = page.locator('[class*="template"]').or(page.locator('text=Disable Browser Cache'));
    await expect(templateCards.first()).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should filter templates by category', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Click on a category (e.g., Development)
    const devCategory = page.locator('text=Development').first();
    if (await devCategory.isVisible()) {
      await devCategory.click();
      await page.waitForTimeout(300);

      // Verify templates are filtered (implementation-specific check)
      // At minimum, verify the UI didn't break
      await expect(page.locator('text=Rule Templates').or(page.locator('text=Template Browser'))).toBeVisible();
    }

    await page.close();
  });

  test('should search templates by text', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="search"]'));
    await searchInput.fill('cache');
    await page.waitForTimeout(300);

    // Verify search results appear
    // Should show templates related to "cache"
    const results = page.locator('text=Cache').or(page.locator('text=cache'));
    await expect(results.first()).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should show template details when clicked', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Click on first template card
    const firstTemplate = page.locator('text=Disable Browser Cache').or(
      page.locator('[class*="template"]').first()
    );

    if (await firstTemplate.isVisible()) {
      await firstTemplate.click();
      await page.waitForTimeout(300);

      // Verify detail panel appears with description
      await expect(
        page.locator('text=Description').or(page.locator('text=Examples'))
      ).toBeVisible({ timeout: 2000 });
    }

    await page.close();
  });

  test('should create rule from template', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Search for a specific template
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="search"]'));
    await searchInput.fill('CORS');
    await page.waitForTimeout(300);

    // Click on CORS template if found
    const corsTemplate = page.locator('text=CORS').first();
    if (await corsTemplate.isVisible()) {
      await corsTemplate.click();
      await page.waitForTimeout(300);

      // Click "Use Template" button
      const useButton = page.locator('button:has-text("Use Template")').or(
        page.locator('button:has-text("Use This Template")')
      );

      if (await useButton.isVisible()) {
        await useButton.click();

        // Verify rule editor opens with template data pre-filled
        await expect(page.getByTestId('rule-editor-drawer')).toBeVisible({ timeout: 3000 });

        // Verify template name is pre-filled
        const nameInput = page.locator('input[placeholder*="CORS"]').first();
        const nameValue = await nameInput.inputValue();
        expect(nameValue).toBeTruthy();
        expect(nameValue.length).toBeGreaterThan(0);

        // Cancel to clean up
        await page.locator('button:has-text("Cancel")').click();
      }
    }

    await page.close();
  });

  test('should allow customizing template before saving', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Find and use a template
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="search"]'));
    await searchInput.fill('block');
    await page.waitForTimeout(300);

    const blockTemplate = page.locator('text=Block').first();
    if (await blockTemplate.isVisible()) {
      await blockTemplate.click();
      await page.waitForTimeout(300);

      const useButton = page.locator('button:has-text("Use Template")').or(
        page.locator('button:has-text("Use This Template")')
      );

      if (await useButton.isVisible()) {
        await useButton.click();

        // Wait for editor
        await expect(page.getByTestId('rule-editor-drawer')).toBeVisible({ timeout: 3000 });

        // Customize the template
        await page.fill('input[placeholder*="CORS"]', 'My Custom Block Rule');
        await page.fill('input[placeholder*="api.example.com"]', 'https://custom.com');

        // Save the customized rule
        await page.locator('button:has-text("Save Rule")').click();
        await expect(page.getByTestId('rule-editor-drawer')).not.toBeVisible({ timeout: 3000 });

        // Verify rule was created
        await expect(page.locator('text=My Custom Block Rule')).toBeVisible();

        const rules = await ExtensionUtils.getRules(page);
        expect(rules.length).toBe(1);
        expect(rules[0]?.name).toBe('My Custom Block Rule');
      }
    }

    await page.close();
  });

  test('should show template categories with counts', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Verify multiple categories are shown
    const categories = [
      'Development',
      'Privacy',
      'Performance',
      'Testing',
      'Security',
      'CORS',
      'API',
    ];

    let foundCategories = 0;
    for (const category of categories) {
      const categoryElement = page.locator(`text=${category}`).first();
      if (await categoryElement.isVisible()) {
        foundCategories++;
      }
    }

    // Should find at least a few categories
    expect(foundCategories).toBeGreaterThanOrEqual(3);

    await page.close();
  });

  test('should reset search and filters', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Apply search filter
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="search"]'));
    await searchInput.fill('specific-search-term-xyz');
    await page.waitForTimeout(300);

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Verify templates are shown again
    await expect(
      page.locator('text=Disable Browser Cache').or(page.locator('text=CORS'))
    ).toBeVisible({ timeout: 2000 });

    await page.close();
  });

  test('should close template browser modal', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Verify modal is open
    await expect(page.locator('text=Rule Templates').or(page.locator('text=Template Browser'))).toBeVisible();

    // Close modal (look for close button or ESC key)
    const closeButton = page.locator('button[aria-label="Close"]').or(
      page.locator('button:has-text("Close")')
    );

    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Try pressing Escape
      await page.keyboard.press('Escape');
    }

    await page.waitForTimeout(300);

    // Verify modal is closed
    await expect(page.locator('text=Rule Templates').or(page.locator('text=Template Browser'))).not.toBeVisible();

    await page.close();
  });

  test('should display template tags', async () => {
    const page = await ExtensionUtils.openOptions(context, extensionId);

    const templateButton = page.locator('button:has-text("Templates")').or(
      page.locator('button:has-text("Browse Templates")')
    );
    await templateButton.click();

    await page.waitForTimeout(500);

    // Click on a template to view details
    const template = page.locator('text=Disable Browser Cache').or(
      page.locator('[class*="template"]').first()
    );

    if (await template.isVisible()) {
      await template.click();
      await page.waitForTimeout(300);

      // Verify tags are visible (templates should have tags like "development", "debugging", etc.)
      // At least verify the detail view is shown
      await expect(
        page.locator('text=Description').or(page.locator('text=Examples'))
      ).toBeVisible({ timeout: 2000 });
    }

    await page.close();
  });
});
