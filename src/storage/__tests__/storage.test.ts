/**
 * Storage layer tests - TDD approach
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Storage } from '../index';
import { Rule, RuleGroup, Settings, DEFAULT_SETTINGS, RuleType, HttpMethod } from '@shared/types';
import Browser from 'webextension-polyfill';

describe('Storage', () => {
  beforeEach(() => {
    // Clear Browser.runtime.lastError
    delete Browser.runtime.lastError;

    // Reset Browser.storage mocks to default behavior (promise-based API)
    (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockReset().mockResolvedValue({});
    (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Ensure Browser.runtime.lastError is cleaned up
    delete Browser.runtime.lastError;
  });

  describe('initialize', () => {
    it('should initialize with default settings if no data exists', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});

      await Storage.initialize();

      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: DEFAULT_SETTINGS,
          rules: [],
          groups: [],
        })
      );
    });

    it('should not overwrite existing data', async () => {
      const existingData = {
        settings: { ...DEFAULT_SETTINGS, theme: 'dark' as const },
        rules: [],
        groups: [],
      };

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue(existingData);

      await Storage.initialize();

      expect(Browser.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('getRules', () => {
    it('should return empty array if no rules exist', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules: [] });

      const rules = await Storage.getRules();

      expect(rules).toEqual([]);
    });

    it('should return all rules', async () => {
      const mockRules: Rule[] = [
        {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
            methods: [HttpMethod.GET],
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules: mockRules });

      const rules = await Storage.getRules();

      expect(rules).toEqual(mockRules);
    });

    it('should return only enabled rules when filter is applied', async () => {
      const mockRules: Rule[] = [
        {
          id: '1',
          name: 'Enabled Rule',
          enabled: true,
          priority: 1,
          matcher: { type: 'exact', pattern: 'https://example.com' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Disabled Rule',
          enabled: false,
          priority: 2,
          matcher: { type: 'exact', pattern: 'https://example.org' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules: mockRules });

      const enabledRules = await Storage.getRules({ enabled: true });

      expect(enabledRules).toHaveLength(1);
      expect(enabledRules[0]?.id).toBe('1');
    });
  });

  describe('saveRule', () => {
    it('should add a new rule', async () => {
      const existingRules: Rule[] = [];
      const newRule: Rule = {
        id: '1',
        name: 'New Rule',
        enabled: true,
        priority: 1,
        matcher: { type: 'exact', pattern: 'https://example.com' },
        action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules: existingRules });

      await Storage.saveRule(newRule);

      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        { rules: [newRule] }
      );
    });

    it('should update an existing rule', async () => {
      const existingRule: Rule = {
        id: '1',
        name: 'Old Name',
        enabled: true,
        priority: 1,
        matcher: { type: 'exact', pattern: 'https://example.com' },
        action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedRule: Rule = {
        ...existingRule,
        name: 'New Name',
        updatedAt: Date.now(),
      };

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules: [existingRule] });

      await Storage.saveRule(updatedRule);

      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        { rules: [updatedRule] }
      );
    });
  });

  describe('deleteRule', () => {
    it('should remove a rule by id', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Rule 1',
          enabled: true,
          priority: 1,
          matcher: { type: 'exact', pattern: 'https://example.com' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Rule 2',
          enabled: true,
          priority: 2,
          matcher: { type: 'exact', pattern: 'https://example.org' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules });

      await Storage.deleteRule('1');

      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        { rules: [rules[1]] }
      );
    });

    it('should do nothing if rule does not exist', async () => {
      const rules: Rule[] = [];

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules });

      await Storage.deleteRule('non-existent');

      expect(Browser.storage.local.set).toHaveBeenCalledWith({ rules: [] });
    });
  });

  describe('getSettings', () => {
    it('should return default settings if none exist', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const settings = await Storage.getSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should return stored settings', async () => {
      const customSettings: Settings = {
        ...DEFAULT_SETTINGS,
        theme: 'dark',
      };

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ settings: customSettings });

      const settings = await Storage.getSettings();

      expect(settings).toEqual(customSettings);
    });
  });

  describe('saveSettings', () => {
    it('should save settings', async () => {
      const newSettings: Settings = {
        ...DEFAULT_SETTINGS,
        theme: 'dark',
      };

      await Storage.saveSettings(newSettings);

      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        { settings: newSettings }
      );
    });
  });

  describe('getGroups', () => {
    it('should return empty array if no groups exist', async () => {
      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ groups: [] });

      const groups = await Storage.getGroups();

      expect(groups).toEqual([]);
    });

    it('should return all groups', async () => {
      const mockGroups: RuleGroup[] = [
        {
          id: '1',
          name: 'API Rules',
          description: 'Rules for API testing',
          color: '#3b82f6',
          createdAt: Date.now(),
        },
      ];

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ groups: mockGroups });

      const groups = await Storage.getGroups();

      expect(groups).toEqual(mockGroups);
    });
  });

  describe('saveGroup', () => {
    it('should add a new group', async () => {
      const newGroup: RuleGroup = {
        id: '1',
        name: 'Test Group',
        createdAt: Date.now(),
      };

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ groups: [] });

      await Storage.saveGroup(newGroup);

      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        { groups: [newGroup] }
      );
    });
  });

  describe('deleteGroup', () => {
    it('should remove a group by id', async () => {
      const groups: RuleGroup[] = [
        { id: '1', name: 'Group 1', createdAt: Date.now() },
        { id: '2', name: 'Group 2', createdAt: Date.now() },
      ];

      (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ groups });

      await Storage.deleteGroup('1');

      expect(Browser.storage.local.set).toHaveBeenCalledWith(
        { groups: [groups[1]] }
      );
    });
  });

  describe('Error Handling', () => {
    describe('initialize', () => {
      it('should reject if Browser.storage.local.get fails', async () => {
        const error = new Error('Storage get failed');
        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.initialize()).rejects.toEqual(error);
      });

      it('should reject if Browser.storage.local.set fails during initialization', async () => {
        const error = new Error('Storage set failed');
        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({});
        (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.initialize()).rejects.toEqual(error);
      });
    });

    describe('getRules', () => {
      it('should reject if Browser.storage.local.get fails', async () => {
        const error = new Error('Storage get failed');
        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.getRules()).rejects.toEqual(error);
      });
    });

    describe('saveRule', () => {
      it('should reject if Browser.storage.local.get fails', async () => {
        const error = new Error('Storage get failed');
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: { type: 'exact', pattern: 'https://example.com' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.saveRule(rule)).rejects.toEqual(error);
      });

      it('should reject if Browser.storage.local.set fails', async () => {
        const error = new Error('Storage set failed');
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: { type: 'exact', pattern: 'https://example.com' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules: [] });
        (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.saveRule(rule)).rejects.toEqual(error);
      });
    });

    describe('deleteRule', () => {
      it('should reject if Browser.storage.local.get fails', async () => {
        const error = new Error('Storage get failed');
        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.deleteRule('1')).rejects.toEqual(error);
      });

      it('should reject if Browser.storage.local.set fails', async () => {
        const error = new Error('Storage set failed');
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: { type: 'exact', pattern: 'https://example.com' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ rules: [rule] });
        (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.deleteRule('1')).rejects.toEqual(error);
      });
    });

    describe('getSettings', () => {
      it('should reject if Browser.storage.local.get fails', async () => {
        const error = new Error('Storage get failed');
        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.getSettings()).rejects.toEqual(error);

      });
    });

    describe('saveSettings', () => {
      it('should reject if Browser.storage.local.set fails', async () => {
        const error = new Error('Storage set failed');
        (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.saveSettings(DEFAULT_SETTINGS)).rejects.toEqual(error);
      });
    });

    describe('getGroups', () => {
      it('should reject if Browser.storage.local.get fails', async () => {
        const error = new Error('Storage get failed');
        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.getGroups()).rejects.toEqual(error);

      });
    });

    describe('saveGroup', () => {
      it('should reject if Browser.storage.local.get fails', async () => {
        const error = new Error('Storage get failed');
        const group: RuleGroup = {
          id: '1',
          name: 'Test Group',
          createdAt: Date.now(),
        };

        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.saveGroup(group)).rejects.toEqual(error);
      });

      it('should reject if Browser.storage.local.set fails', async () => {
        const error = new Error('Storage set failed');
        const group: RuleGroup = {
          id: '1',
          name: 'Test Group',
          createdAt: Date.now(),
        };

        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ groups: [] });
        (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.saveGroup(group)).rejects.toEqual(error);
      });
    });

    describe('deleteGroup', () => {
      it('should reject if Browser.storage.local.get fails', async () => {
        const error = new Error('Storage get failed');
        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.deleteGroup('1')).rejects.toEqual(error);
      });

      it('should reject if Browser.storage.local.set fails', async () => {
        const error = new Error('Storage set failed');
        const group: RuleGroup = {
          id: '1',
          name: 'Test Group',
          createdAt: Date.now(),
        };

        (Browser.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({ groups: [group] });
        (Browser.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(Storage.deleteGroup('1')).rejects.toEqual(error);
      });
    });
  });
});
