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
  ExportData,
  ImportOptions,
  ImportResult,
} from '@shared/types';
import Browser from 'webextension-polyfill';
import { v4 as uuidv4 } from 'uuid';
import { storageCache, CACHE_TTL } from './cache';

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
    // Try cache first
    const cacheKey = `rules_${JSON.stringify(filter || {})}`;
    const cached = storageCache.get<Rule[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from storage
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

    // Cache the result
    storageCache.set(cacheKey, rules, CACHE_TTL.RULES);

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

    // Invalidate rules cache
    storageCache.invalidatePattern(/^rules_/);
  }

  /**
   * Delete a rule by ID
   */
  static async deleteRule(id: string): Promise<void> {
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.RULES]);
    const rules: Rule[] = (data.rules || []) as Rule[];
    const filteredRules = rules.filter((rule) => rule.id !== id);

    await Browser.storage.local.set({ rules: filteredRules });

    // Invalidate rules cache
    storageCache.invalidatePattern(/^rules_/);
  }

  /**
   * Get extension settings
   */
  static async getSettings(): Promise<Settings> {
    // Try cache first
    const cached = storageCache.get<Settings>('settings');
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from storage
    const data = await Browser.storage.local.get([this.STORAGE_KEYS.SETTINGS]);
    const settings = (data.settings || DEFAULT_SETTINGS) as Settings;

    // Cache the result
    storageCache.set('settings', settings, CACHE_TTL.SETTINGS);

    return settings;
  }

  /**
   * Save extension settings
   */
  static async saveSettings(settings: Settings): Promise<void> {
    await Browser.storage.local.set({ settings });

    // Invalidate settings cache
    storageCache.invalidate('settings');
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
   * Export rules and optionally settings/groups in a structured format
   */
  static async exportRules(options: {
    includeSettings?: boolean;
    includeGroups?: boolean;
    ruleIds?: string[]; // Export specific rules only
  } = {}): Promise<ExportData> {
    const {
      includeSettings = false,
      includeGroups = true,
      ruleIds,
    } = options;

    const allRules = await this.getRules();
    const rules = ruleIds
      ? allRules.filter((rule) => ruleIds.includes(rule.id))
      : allRules;

    const groups = includeGroups ? await this.getGroups() : [];
    const settings = includeSettings ? await this.getSettings() : undefined;

    // Get extension version from manifest
    const manifest = Browser.runtime.getManifest();

    const exportData: ExportData = {
      version: manifest.version,
      exportDate: Date.now(),
      exportFormat: 1, // Current format version
      data: {
        rules,
        groups: includeGroups ? groups : undefined,
        settings: includeSettings ? settings : undefined,
      },
      metadata: {
        rulesCount: rules.length,
        groupsCount: groups.length,
        includesSettings: includeSettings,
      },
    };

    return exportData;
  }

  /**
   * Validate import data structure
   */
  private static validateImportData(data: unknown): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type guard
    if (typeof data !== 'object' || data === null) {
      errors.push('Invalid import data: not an object');
      return { valid: false, errors, warnings };
    }

    const exportData = data as Partial<ExportData>;

    // Check version
    if (!exportData.version) {
      warnings.push('Import data missing version information');
    }

    // Check format
    if (!exportData.exportFormat) {
      warnings.push('Import data missing format version, assuming legacy format');
    } else if (exportData.exportFormat > 1) {
      warnings.push(`Import data format version ${exportData.exportFormat} is newer than current version 1`);
    }

    // Check data structure
    if (!exportData.data) {
      errors.push('Import data missing "data" field');
      return { valid: false, errors, warnings };
    }

    if (!Array.isArray(exportData.data.rules)) {
      errors.push('Import data missing "rules" array');
      return { valid: false, errors, warnings };
    }

    // Validate each rule has required fields
    exportData.data.rules.forEach((rule, index) => {
      if (!rule.id) {
        warnings.push(`Rule at index ${index} missing ID, will generate new ID`);
      }
      if (!rule.name) {
        errors.push(`Rule at index ${index} missing name`);
      }
      if (!rule.matcher || !rule.matcher.pattern) {
        errors.push(`Rule at index ${index} missing matcher pattern`);
      }
      if (!rule.action || !rule.action.type) {
        errors.push(`Rule at index ${index} missing action type`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Import rules with validation and conflict resolution
   */
  static async importRules(
    data: unknown,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const {
      overwriteExisting = false,
      importSettings = false,
      importGroups = true,
      preserveIds = false,
    } = options;

    // Validate data
    const validation = this.validateImportData(data);
    if (!validation.valid) {
      return {
        success: false,
        rulesImported: 0,
        groupsImported: 0,
        settingsImported: false,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    const exportData = data as ExportData;
    const result: ImportResult = {
      success: true,
      rulesImported: 0,
      groupsImported: 0,
      settingsImported: false,
      errors: [],
      warnings: validation.warnings,
    };

    try {
      // Import groups first (if included and requested)
      if (importGroups && exportData.data.groups) {
        const existingGroups = await this.getGroups();
        const existingGroupIds = new Set(existingGroups.map((g) => g.id));

        for (const group of exportData.data.groups) {
          const groupToImport = { ...group };

          // Handle ID conflicts
          if (existingGroupIds.has(group.id)) {
            if (overwriteExisting) {
              await this.saveGroup(groupToImport);
              result.groupsImported++;
            } else if (!preserveIds) {
              // Generate new ID
              groupToImport.id = uuidv4();
              await this.saveGroup(groupToImport);
              result.groupsImported++;
              result.warnings.push(`Group "${group.name}" imported with new ID`);
            } else {
              result.warnings.push(`Group "${group.name}" skipped due to ID conflict`);
            }
          } else {
            await this.saveGroup(groupToImport);
            result.groupsImported++;
          }
        }
      }

      // Import rules
      const existingRules = await this.getRules();
      const existingRuleIds = new Set(existingRules.map((r) => r.id));

      for (const rule of exportData.data.rules) {
        const ruleToImport = { ...rule };

        // Ensure required fields
        if (!ruleToImport.id || !preserveIds || existingRuleIds.has(ruleToImport.id)) {
          if (existingRuleIds.has(ruleToImport.id) && !overwriteExisting && preserveIds) {
            result.warnings.push(`Rule "${rule.name}" skipped due to ID conflict`);
            continue;
          }
          // Generate new ID
          ruleToImport.id = uuidv4();
        }

        // Update timestamps
        ruleToImport.createdAt = Date.now();
        ruleToImport.updatedAt = Date.now();

        await this.saveRule(ruleToImport);
        result.rulesImported++;
      }

      // Import settings (if included and requested)
      if (importSettings && exportData.data.settings) {
        const currentSettings = await this.getSettings();
        const mergedSettings = {
          ...currentSettings,
          ...exportData.data.settings,
        };
        await this.saveSettings(mergedSettings);
        result.settingsImported = true;
      }
    } catch (error) {
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error during import'
      );
    }

    return result;
  }

  /**
   * Legacy export method for backwards compatibility
   */
  static async exportData(): Promise<Partial<StorageSchema>> {
    return await Browser.storage.local.get(null);
  }

  /**
   * Legacy import method for backwards compatibility
   */
  static async importData(data: Partial<StorageSchema>): Promise<void> {
    await Browser.storage.local.set(data);
  }
}
