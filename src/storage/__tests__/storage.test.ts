/**
 * Storage layer tests - TDD approach
 */

import { Storage } from '../index';
import { Rule, RuleGroup, Settings, DEFAULT_SETTINGS, RuleType, HttpMethod } from '@shared/types';

describe('Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset chrome.storage mock
    (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
      callback?.({});
      return Promise.resolve({});
    });
    (chrome.storage.local.set as jest.Mock).mockImplementation((_items, callback) => {
      callback?.();
      return Promise.resolve();
    });
  });

  describe('initialize', () => {
    it('should initialize with default settings if no data exists', async () => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({});
        return Promise.resolve({});
      });

      await Storage.initialize();

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: DEFAULT_SETTINGS,
          rules: [],
          groups: [],
        }),
        expect.any(Function)
      );
    });

    it('should not overwrite existing data', async () => {
      const existingData = {
        settings: { ...DEFAULT_SETTINGS, theme: 'dark' as const },
        rules: [],
        groups: [],
      };

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.(existingData);
        return Promise.resolve(existingData);
      });

      await Storage.initialize();

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('getRules', () => {
    it('should return empty array if no rules exist', async () => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ rules: [] });
        return Promise.resolve({ rules: [] });
      });

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

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ rules: mockRules });
        return Promise.resolve({ rules: mockRules });
      });

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

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ rules: mockRules });
        return Promise.resolve({ rules: mockRules });
      });

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

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ rules: existingRules });
        return Promise.resolve({ rules: existingRules });
      });

      await Storage.saveRule(newRule);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { rules: [newRule] },
        expect.any(Function)
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

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ rules: [existingRule] });
        return Promise.resolve({ rules: [existingRule] });
      });

      await Storage.saveRule(updatedRule);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { rules: [updatedRule] },
        expect.any(Function)
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

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ rules });
        return Promise.resolve({ rules });
      });

      await Storage.deleteRule('1');

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { rules: [rules[1]] },
        expect.any(Function)
      );
    });

    it('should do nothing if rule does not exist', async () => {
      const rules: Rule[] = [];

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ rules });
        return Promise.resolve({ rules });
      });

      await Storage.deleteRule('non-existent');

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ rules: [] }, expect.any(Function));
    });
  });

  describe('getSettings', () => {
    it('should return default settings if none exist', async () => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({});
        return Promise.resolve({});
      });

      const settings = await Storage.getSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should return stored settings', async () => {
      const customSettings: Settings = {
        ...DEFAULT_SETTINGS,
        theme: 'dark',
      };

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ settings: customSettings });
        return Promise.resolve({ settings: customSettings });
      });

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

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { settings: newSettings },
        expect.any(Function)
      );
    });
  });

  describe('getGroups', () => {
    it('should return empty array if no groups exist', async () => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ groups: [] });
        return Promise.resolve({ groups: [] });
      });

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

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ groups: mockGroups });
        return Promise.resolve({ groups: mockGroups });
      });

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

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ groups: [] });
        return Promise.resolve({ groups: [] });
      });

      await Storage.saveGroup(newGroup);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { groups: [newGroup] },
        expect.any(Function)
      );
    });
  });

  describe('deleteGroup', () => {
    it('should remove a group by id', async () => {
      const groups: RuleGroup[] = [
        { id: '1', name: 'Group 1', createdAt: Date.now() },
        { id: '2', name: 'Group 2', createdAt: Date.now() },
      ];

      (chrome.storage.local.get as jest.Mock).mockImplementation((_keys, callback) => {
        callback?.({ groups });
        return Promise.resolve({ groups });
      });

      await Storage.deleteGroup('1');

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { groups: [groups[1]] },
        expect.any(Function)
      );
    });
  });
});
