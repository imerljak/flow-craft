/**
 * Storage layer for FlowCraft
 * Provides abstraction over Browser.storage.local API
 */

import {
  Rule,
  RuleGroup,
  Settings,
  DEFAULT_SETTINGS,
  StorageSchema,
} from '@shared/types';
import Browser from 'webextension-polyfill';

/**
 * Filter options for querying rules
 */
interface RuleFilter {
  enabled?: boolean;
  groupId?: string;
}

/**
 * Storage class provides methods for persisting and retrieving extension data
 */
export class Storage {
  private static readonly STORAGE_KEYS = {
    RULES: 'rules',
    GROUPS: 'groups',
    SETTINGS: 'settings',
    REQUEST_HISTORY: 'requestHistory',
  } as const;

  /**
   * Initialize storage with default values if not already set
   */
  static async initialize(): Promise<void> {
    const data = await Browser.storage.local.get(null);
    const hasData = Object.keys(data).length > 0;

    if (!hasData) {
      const initialData: Partial<StorageSchema> = {
        rules: [],
        groups: [],
        settings: DEFAULT_SETTINGS,
      };

      await Browser.storage.local.set(initialData);
    }
  }

  /**
   * Get all rules, optionally filtered
   */
  static async getRules(filter?: RuleFilter): Promise<Rule[]> {
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.RULES]);
    let rules: Rule[] = data.rules as Rule[] || [];

    // Apply filters
    if (filter) {
      if (filter.enabled !== undefined) {
        rules = rules.filter((rule) => rule.enabled === filter.enabled);
      }
      if (filter.groupId !== undefined) {
        rules = rules.filter((rule) => rule.groupId === filter.groupId);
      }
    }

    return rules;
  }

  /**
   * Get a single rule by ID
   */
  static async getRule(id: string): Promise<Rule | null> {
    const rules = await this.getRules();
    return rules.find((rule) => rule.id === id) || null;
  }

  /**
   * Save a rule (create or update)
   */
  static async saveRule(rule: Rule): Promise<void> {
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.RULES]);
    const rules: Rule[] = data.rules as Rule[] || [];
    const existingIndex = rules.findIndex((r) => r.id === rule.id);

    if (existingIndex >= 0) {
      // Update existing rule
      rules[existingIndex] = rule;
    } else {
      // Add new rule
      rules.push(rule);
    }

    await Browser.storage.local.set({ rules });
  }

  /**
   * Delete a rule by ID
   */
  static async deleteRule(id: string): Promise<void> {
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.RULES]);
    const rules: Rule[] = (data.rules || []) as Rule[];
    const filteredRules = rules.filter((rule) => rule.id !== id);

    await Browser.storage.local.set({ rules: filteredRules });
  }

  /**
   * Get extension settings
   */
  static async getSettings(): Promise<Settings> {
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.SETTINGS]);
    return (data.settings || DEFAULT_SETTINGS) as Settings;
  }

  /**
   * Save extension settings
   */
  static async saveSettings(settings: Settings): Promise<void> {
    await Browser.storage.local.set({ settings });
  }

  /**
   * Get all rule groups
   */
  static async getGroups(): Promise<RuleGroup[]> {
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.GROUPS]);
    return (data.groups || []) as RuleGroup[];
  }

  /**
   * Get a single group by ID
   */
  static async getGroup(id: string): Promise<RuleGroup | null> {
    const groups = await this.getGroups();
    return groups.find((group) => group.id === id) || null;
  }

  /**
   * Save a group (create or update)
   */
  static async saveGroup(group: RuleGroup): Promise<void> {
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.GROUPS]);
    const groups: RuleGroup[] = (data.groups || []) as RuleGroup[];
    const existingIndex = groups.findIndex((g) => g.id === group.id);

    if (existingIndex >= 0) {
      groups[existingIndex] = group;
    } else {
      groups.push(group);
    }

    await Browser.storage.local.set({ groups });
  }

  /**
   * Delete a group by ID
   */
  static async deleteGroup(id: string): Promise<void> {
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.GROUPS]);
    const groups: RuleGroup[] = (data.groups || []) as RuleGroup[];
    const filteredGroups = groups.filter((group) => group.id !== id);

    await Browser.storage.local.set({ groups: filteredGroups });
  }

  /**
   * Clear all storage (for testing or reset purposes)
   */
  static async clear(): Promise<void> {
    await Browser.storage.local.clear();
  }

  /**
   * Export all data as JSON
   */
  static async exportData(): Promise<Partial<StorageSchema>> {
    return await Browser.storage.local.get(null);
  }

  /**
   * Import data from JSON
   */
  static async importData(data: Partial<StorageSchema>): Promise<void> {
    await Browser.storage.local.set(data);
  }
}
