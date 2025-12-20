/**
 * Storage layer for FlowCraft
 * Provides abstraction over chrome.storage.local API
 */

import {
  Rule,
  RuleGroup,
  Settings,
  DEFAULT_SETTINGS,
  StorageSchema,
} from '@shared/types';

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
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const hasData = Object.keys(data).length > 0;

        if (!hasData) {
          const initialData: Partial<StorageSchema> = {
            rules: [],
            groups: [],
            settings: DEFAULT_SETTINGS,
          };

          chrome.storage.local.set(initialData, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get all rules, optionally filtered
   */
  static async getRules(filter?: RuleFilter): Promise<Rule[]> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.STORAGE_KEYS.RULES], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        let rules: Rule[] = data.rules || [];

        // Apply filters
        if (filter) {
          if (filter.enabled !== undefined) {
            rules = rules.filter((rule) => rule.enabled === filter.enabled);
          }
          if (filter.groupId !== undefined) {
            rules = rules.filter((rule) => rule.groupId === filter.groupId);
          }
        }

        resolve(rules);
      });
    });
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
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.STORAGE_KEYS.RULES], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const rules: Rule[] = data.rules || [];
        const existingIndex = rules.findIndex((r) => r.id === rule.id);

        if (existingIndex >= 0) {
          // Update existing rule
          rules[existingIndex] = rule;
        } else {
          // Add new rule
          rules.push(rule);
        }

        chrome.storage.local.set({ rules }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      });
    });
  }

  /**
   * Delete a rule by ID
   */
  static async deleteRule(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.STORAGE_KEYS.RULES], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const rules: Rule[] = data.rules || [];
        const filteredRules = rules.filter((rule) => rule.id !== id);

        chrome.storage.local.set({ rules: filteredRules }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      });
    });
  }

  /**
   * Get extension settings
   */
  static async getSettings(): Promise<Settings> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.STORAGE_KEYS.SETTINGS], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        resolve(data.settings || DEFAULT_SETTINGS);
      });
    });
  }

  /**
   * Save extension settings
   */
  static async saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ settings }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Get all rule groups
   */
  static async getGroups(): Promise<RuleGroup[]> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.STORAGE_KEYS.GROUPS], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        resolve(data.groups || []);
      });
    });
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
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.STORAGE_KEYS.GROUPS], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const groups: RuleGroup[] = data.groups || [];
        const existingIndex = groups.findIndex((g) => g.id === group.id);

        if (existingIndex >= 0) {
          groups[existingIndex] = group;
        } else {
          groups.push(group);
        }

        chrome.storage.local.set({ groups }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      });
    });
  }

  /**
   * Delete a group by ID
   */
  static async deleteGroup(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.STORAGE_KEYS.GROUPS], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const groups: RuleGroup[] = data.groups || [];
        const filteredGroups = groups.filter((group) => group.id !== id);

        chrome.storage.local.set({ groups: filteredGroups }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      });
    });
  }

  /**
   * Clear all storage (for testing or reset purposes)
   */
  static async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Export all data as JSON
   */
  static async exportData(): Promise<Partial<StorageSchema>> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(data);
      });
    });
  }

  /**
   * Import data from JSON
   */
  static async importData(data: Partial<StorageSchema>): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }
}
