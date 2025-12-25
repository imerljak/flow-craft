/**
 * Tests for Import/Export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Storage } from '../index';
import type {
  Rule,
  RuleGroup,
  Settings,
  ExportData,
  ImportOptions,
} from '@shared/types';
import { RuleType, HeaderOperation } from '@shared/types';
import Browser from 'webextension-polyfill';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        clear: vi.fn(),
      },
    },
    runtime: {
      getManifest: vi.fn(() => ({ version: '1.0.0' })),
    },
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'new-uuid-1234'),
}));

describe('Storage - Import/Export', () => {
  const mockRule1: Rule = {
    id: 'rule-1',
    name: 'Test Rule 1',
    description: 'First test rule',
    enabled: true,
    priority: 1,
    matcher: {
      type: 'wildcard',
      pattern: 'https://example.com/*',
    },
    action: {
      type: RuleType.HEADER_MODIFICATION,
      headers: [
        {
          operation: HeaderOperation.ADD,
          name: 'X-Custom',
          value: 'value',
        },
      ],
    },
    createdAt: 1000000,
    updatedAt: 1000000,
  };

  const mockRule2: Rule = {
    id: 'rule-2',
    name: 'Test Rule 2',
    description: 'Second test rule',
    enabled: false,
    priority: 2,
    matcher: {
      type: 'wildcard',
      pattern: 'https://api.example.com/*',
    },
    action: {
      type: RuleType.URL_REDIRECT,
      redirectUrl: 'https://redirect.example.com',
    },
    createdAt: 2000000,
    updatedAt: 2000000,
  };

  const mockGroup: RuleGroup = {
    id: 'group-1',
    name: 'Test Group',
    description: 'Test group description',
    createdAt: 1000000,
  };

  const mockSettings: Settings = {
    enabled: true,
    theme: 'dark',
    enableRequestHistory: false,
    maxHistorySize: 100,
    enableNotifications: true,
    autoEnableNewRules: true,
    logger: {
      enabled: true,
      maxLogSize: 500,
      captureHeaders: true,
      captureRequestBody: false,
      captureResponseBody: false,
      maxBodySize: 10240,
      preserveOnDisable: true,
      urlFilters: ['*://analytics.google.com/*'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock returns empty storage
    (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  describe('exportRules', () => {
    it('should export all rules with groups by default', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [mockRule1, mockRule2],
        groups: [mockGroup],
      });

      const result = await Storage.exportRules();

      expect(result.version).toBe('1.0.0');
      expect(result.exportFormat).toBe(1);
      expect(result.data.rules).toEqual([mockRule1, mockRule2]);
      expect(result.data.groups).toEqual([mockGroup]);
      expect(result.data.settings).toBeUndefined();
      expect(result.metadata?.rulesCount).toBe(2);
      expect(result.metadata?.groupsCount).toBe(1);
      expect(result.metadata?.includesSettings).toBe(false);
      expect(result.exportDate).toBeGreaterThan(0);
    });

    it('should export rules with settings when requested', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [mockRule1],
        groups: [],
        settings: mockSettings,
      });

      const result = await Storage.exportRules({ includeSettings: true });

      expect(result.data.settings).toEqual(mockSettings);
      expect(result.metadata?.includesSettings).toBe(true);
    });

    it('should export specific rules only when ruleIds provided', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [mockRule1, mockRule2],
        groups: [mockGroup],
      });

      const result = await Storage.exportRules({ ruleIds: ['rule-1'] });

      expect(result.data.rules).toEqual([mockRule1]);
      expect(result.metadata?.rulesCount).toBe(1);
    });

    it('should exclude groups when includeGroups is false', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [mockRule1],
        groups: [mockGroup],
      });

      const result = await Storage.exportRules({ includeGroups: false });

      expect(result.data.groups).toBeUndefined();
      expect(result.metadata?.groupsCount).toBe(0);
    });
  });

  describe('importRules - validation', () => {
    it('should reject invalid data (not an object)', async () => {
      const result = await Storage.importRules('invalid data');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid import data: not an object');
      expect(result.rulesImported).toBe(0);
    });

    it('should reject data missing "data" field', async () => {
      const result = await Storage.importRules({ version: '1.0.0' });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Import data missing "data" field');
    });

    it('should reject data missing "rules" array', async () => {
      const result = await Storage.importRules({ data: {} });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Import data missing "rules" array');
    });

    it('should reject rules missing required fields', async () => {
      const invalidExport: Partial<ExportData> = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [
            {
              id: 'rule-1',
              // Missing name
              enabled: true,
              priority: 1,
              matcher: { type: 'wildcard', pattern: '*' },
              action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
              createdAt: Date.now(),
              updatedAt: Date.now(),
            } as unknown as Rule,
          ],
        },
      };

      const result = await Storage.importRules(invalidExport);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes('missing name'))).toBe(true);
    });

    it('should warn about missing version', async () => {
      const exportData: Partial<ExportData> = {
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
        },
      };

      const result = await Storage.importRules(exportData);

      expect(result.warnings.some((w) => w.includes('missing version'))).toBe(true);
    });

    it('should warn about newer format version', async () => {
      const exportData: ExportData = {
        version: '2.0.0',
        exportDate: Date.now(),
        exportFormat: 2, // Future format
        data: {
          rules: [mockRule1],
        },
      };

      const result = await Storage.importRules(exportData);

      expect(result.warnings.some((w) => w.includes('newer than current'))).toBe(true);
    });
  });

  describe('importRules - successful import', () => {
    it('should import rules successfully', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
        groups: [],
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1, mockRule2],
        },
      };

      const result = await Storage.importRules(exportData);

      expect(result.success).toBe(true);
      expect(result.rulesImported).toBe(2);
      expect(result.groupsImported).toBe(0);
      expect(result.settingsImported).toBe(false);
      expect(Browser.storage.local.set).toHaveBeenCalledTimes(2); // Once for each rule
    });

    it('should import groups when included', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
        groups: [],
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
          groups: [mockGroup],
        },
      };

      const result = await Storage.importRules(exportData, { importGroups: true });

      expect(result.success).toBe(true);
      expect(result.rulesImported).toBe(1);
      expect(result.groupsImported).toBe(1);
    });

    it('should import settings when requested', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
        groups: [],
        settings: mockSettings,
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
          settings: { theme: 'light' as const },
        },
      };

      const result = await Storage.importRules(exportData, { importSettings: true });

      expect(result.success).toBe(true);
      expect(result.settingsImported).toBe(true);
      // Settings should be merged
      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({ theme: 'light' }),
        })
      );
    });

    it('should generate new IDs by default', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
        groups: [],
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
        },
      };

      await Storage.importRules(exportData, { preserveIds: false });

      // Should call saveRule with new ID
      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              id: 'new-uuid-1234', // Generated by mocked uuid
            }),
          ]),
        })
      );
    });

    it('should update timestamps on import', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
        },
      };

      const beforeImport = Date.now();
      await Storage.importRules(exportData);
      const afterImport = Date.now();

      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              createdAt: expect.any(Number),
              updatedAt: expect.any(Number),
            }),
          ]),
        })
      );

      // Timestamps should be recent
      const savedData = (Browser.storage.local.set as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(savedData).toBeDefined();
      const savedRule = savedData?.rules?.[0];
      expect(savedRule).toBeDefined();
      expect(savedRule?.createdAt).toBeGreaterThanOrEqual(beforeImport);
      expect(savedRule?.createdAt).toBeLessThanOrEqual(afterImport);
    });
  });

  describe('importRules - conflict resolution', () => {
    it('should skip existing rules when overwriteExisting is false and preserveIds is true', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [mockRule1], // Already exists
        groups: [],
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1, mockRule2], // Try to import both
        },
      };

      const result = await Storage.importRules(exportData, {
        overwriteExisting: false,
        preserveIds: true,
      });

      expect(result.success).toBe(true);
      expect(result.rulesImported).toBe(1); // Only rule-2 imported
      expect(result.warnings.some((w) => w.includes('skipped due to ID conflict'))).toBe(true);
    });

    it('should overwrite existing rules when overwriteExisting is true', async () => {
      const existingRule = { ...mockRule1, name: 'Old Name' };
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [existingRule],
        groups: [],
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1], // Same ID, different name
        },
      };

      const result = await Storage.importRules(exportData, {
        overwriteExisting: true,
        preserveIds: false,
      });

      expect(result.success).toBe(true);
      expect(result.rulesImported).toBe(1);
    });

    it('should handle group ID conflicts', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
        groups: [mockGroup], // Group already exists
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [],
          groups: [mockGroup],
        },
      };

      const result = await Storage.importRules(exportData, {
        importGroups: true,
        overwriteExisting: false,
        preserveIds: false,
      });

      expect(result.success).toBe(true);
      expect(result.groupsImported).toBe(1); // Imported with new ID
      expect(result.warnings.some((w) => w.includes('imported with new ID'))).toBe(true);
    });
  });

  describe('importRules - edge cases', () => {
    it('should handle rules missing IDs', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
      });

      const ruleWithoutId = { ...mockRule1 };
      delete (ruleWithoutId as Partial<Rule>).id;

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [ruleWithoutId as Rule],
        },
      };

      const result = await Storage.importRules(exportData);

      expect(result.success).toBe(true);
      expect(result.warnings.some((w) => w.includes('will generate new ID'))).toBe(true);
    });

    it('should handle empty rules array', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [],
        },
      };

      const result = await Storage.importRules(exportData);

      expect(result.success).toBe(true);
      expect(result.rulesImported).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle import errors gracefully', async () => {
      (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Storage quota exceeded')
      );

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
        },
      };

      const result = await Storage.importRules(exportData);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes('Storage quota exceeded'))).toBe(true);
    });
  });

  describe('importRules - options combinations', () => {
    it('should respect all import options together', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
        groups: [],
        settings: mockSettings,
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
          groups: [mockGroup],
          settings: { theme: 'light' as const },
        },
      };

      const options: ImportOptions = {
        overwriteExisting: true,
        importSettings: true,
        importGroups: true,
        preserveIds: false,
      };

      const result = await Storage.importRules(exportData, options);

      expect(result.success).toBe(true);
      expect(result.rulesImported).toBe(1);
      expect(result.groupsImported).toBe(1);
      expect(result.settingsImported).toBe(true);
    });

    it('should skip groups when importGroups is false even if included', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
        groups: [],
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
          groups: [mockGroup], // Included in export
        },
      };

      const result = await Storage.importRules(exportData, { importGroups: false });

      expect(result.success).toBe(true);
      expect(result.groupsImported).toBe(0); // Not imported
    });

    it('should skip settings when importSettings is false even if included', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        rules: [],
        settings: mockSettings,
      });

      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        exportFormat: 1,
        data: {
          rules: [mockRule1],
          settings: { theme: 'light' as const }, // Included in export
        },
      };

      const result = await Storage.importRules(exportData, { importSettings: false });

      expect(result.success).toBe(true);
      expect(result.settingsImported).toBe(false); // Not imported
    });
  });
});
