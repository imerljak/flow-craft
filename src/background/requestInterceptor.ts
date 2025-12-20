/**
 * Request Interceptor - Converts FlowCraft rules to Chrome declarativeNetRequest format
 */

import { Rule, RuleType, HeaderOperation, ResourceType } from '@shared/types';

/**
 * Chrome declarativeNetRequest rule type
 */
type ChromeRule = chrome.declarativeNetRequest.Rule;

/**
 * Default resource types to intercept
 */
const DEFAULT_RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'xmlhttprequest',
] as chrome.declarativeNetRequest.ResourceType[];

/**
 * RequestInterceptor handles conversion of FlowCraft rules to Chrome's format
 * and manages dynamic rule updates
 */
export class RequestInterceptor {
  /**
   * Convert a FlowCraft rule to Chrome declarativeNetRequest format
   */
  static convertToDeclarativeNetRequestRule(rule: Rule, numericId: number): ChromeRule | null {
    const condition = this.buildCondition(rule);
    const action = this.buildAction(rule);

    if (!action) {
      return null;
    }

    return {
      id: numericId,
      priority: rule.priority,
      action,
      condition,
    };
  }

  /**
   * Build the condition part of a Chrome rule
   */
  private static buildCondition(
    rule: Rule
  ): chrome.declarativeNetRequest.RuleCondition {
    const condition: chrome.declarativeNetRequest.RuleCondition = {
      resourceTypes: this.getResourceTypes(rule),
    };

    // Handle different pattern types
    if (rule.matcher.type === 'regex') {
      condition.regexFilter = rule.matcher.pattern;
    } else {
      // For exact and wildcard, use urlFilter
      condition.urlFilter = rule.matcher.pattern;
    }

    return condition;
  }

  /**
   * Build the action part of a Chrome rule
   */
  private static buildAction(
    rule: Rule
  ): chrome.declarativeNetRequest.RuleAction | null {
    switch (rule.action.type) {
      case RuleType.HEADER_MODIFICATION:
        return this.buildHeaderModificationAction(rule);

      case RuleType.URL_REDIRECT:
        return {
          type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
          redirect: {
            url: rule.action.redirectUrl,
          },
        };

      case RuleType.REQUEST_BLOCK:
        return {
          type: 'block' as chrome.declarativeNetRequest.RuleActionType,
        };

      // Mock response and script injection are not supported by declarativeNetRequest
      // These will need to be handled differently (content scripts, webRequest API, etc.)
      case RuleType.MOCK_RESPONSE:
      case RuleType.SCRIPT_INJECTION:
      case RuleType.QUERY_PARAM:
        return null;

      default:
        return null;
    }
  }

  /**
   * Build header modification action
   */
  private static buildHeaderModificationAction(
    rule: Rule
  ): chrome.declarativeNetRequest.RuleAction {
    if (rule.action.type !== RuleType.HEADER_MODIFICATION) {
      throw new Error('Invalid rule type for header modification');
    }

    const requestHeaders: chrome.declarativeNetRequest.ModifyHeaderInfo[] = [];

    for (const header of rule.action.headers) {
      const chromeOperation = this.convertHeaderOperation(header.operation);

      const headerInfo: chrome.declarativeNetRequest.ModifyHeaderInfo = {
        operation: chromeOperation,
        header: header.name,
      };

      // Add value for set operations
      if (
        (header.operation === HeaderOperation.ADD ||
          header.operation === HeaderOperation.MODIFY) &&
        header.value !== undefined
      ) {
        headerInfo.value = header.value;
      }

      requestHeaders.push(headerInfo);
    }

    return {
      type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
      requestHeaders,
    };
  }

  /**
   * Convert FlowCraft header operation to Chrome operation
   */
  private static convertHeaderOperation(
    operation: HeaderOperation
  ): chrome.declarativeNetRequest.HeaderOperation {
    switch (operation) {
      case HeaderOperation.ADD:
      case HeaderOperation.MODIFY:
        return 'set' as chrome.declarativeNetRequest.HeaderOperation;
      case HeaderOperation.REMOVE:
        return 'remove' as chrome.declarativeNetRequest.HeaderOperation;
      default:
        return 'set' as chrome.declarativeNetRequest.HeaderOperation;
    }
  }

  /**
   * Get resource types from rule matcher
   */
  private static getResourceTypes(
    rule: Rule
  ): chrome.declarativeNetRequest.ResourceType[] {
    if (rule.matcher.resourceTypes && rule.matcher.resourceTypes.length > 0) {
      return rule.matcher.resourceTypes.map((type) =>
        this.convertResourceType(type)
      );
    }

    return DEFAULT_RESOURCE_TYPES;
  }

  /**
   * Convert FlowCraft resource type to Chrome resource type
   */
  private static convertResourceType(
    type: ResourceType
  ): chrome.declarativeNetRequest.ResourceType {
    // Most types are the same, just lowercase
    return type.toLowerCase() as chrome.declarativeNetRequest.ResourceType;
  }

  /**
   * Update Chrome's dynamic rules based on FlowCraft rules
   */
  static async updateDynamicRules(rules: Rule[]): Promise<void> {
    try {
      // Get existing dynamic rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map((rule) => rule.id);

      // Convert enabled FlowCraft rules to Chrome format
      const enabledRules = rules.filter((rule) => rule.enabled);
      const chromeRules: ChromeRule[] = [];

      for (let i = 0; i < enabledRules.length; i++) {
        const rule = enabledRules[i];
        if (rule) {
          const chromeRule = this.convertToDeclarativeNetRequestRule(rule, i + 1);
          if (chromeRule) {
            chromeRules.push(chromeRule);
          }
        }
      }

      // Update dynamic rules (remove old, add new)
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: chromeRules,
      });
    } catch (error) {
      console.error('Failed to update dynamic rules:', error);
      throw error;
    }
  }

  /**
   * Clear all dynamic rules
   */
  static async clearDynamicRules(): Promise<void> {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((rule) => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: [],
    });
  }
}
