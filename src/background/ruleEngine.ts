/**
 * Rule Engine - Core logic for matching and applying rules
 */

import {
  Rule,
  RuleType,
  HttpMethod,
  ResourceType,
  HeaderOperation,
} from '@shared/types';

/**
 * Request information for rule matching
 */
export interface RequestInfo {
  url: string;
  method: HttpMethod;
  resourceType?: ResourceType;
}

/**
 * RuleEngine class provides methods for matching URLs and applying rules
 */
export class RuleEngine {
  /**
   * Check if a URL matches a rule's pattern
   */
  static matchesUrl(rule: Rule, url: string): boolean {
    const { type, pattern } = rule.matcher;

    switch (type) {
      case 'exact':
        return url === pattern;

      case 'wildcard':
        return this.matchWildcard(url, pattern);

      case 'regex':
        return this.matchRegex(url, pattern);

      default:
        return false;
    }
  }

  /**
   * Check if a request matches a rule (URL + method + resource type)
   */
  static matchesRequest(rule: Rule, request: RequestInfo): boolean {
    // First check if URL matches
    if (!this.matchesUrl(rule, request.url)) {
      return false;
    }

    // Check HTTP method if specified
    if (rule.matcher.methods && rule.matcher.methods.length > 0) {
      if (!rule.matcher.methods.includes(request.method)) {
        return false;
      }
    }

    // Check resource type if specified
    if (rule.matcher.resourceTypes && rule.matcher.resourceTypes.length > 0) {
      if (!request.resourceType) {
        return false;
      }
      if (!rule.matcher.resourceTypes.includes(request.resourceType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find all matching rules for a request, sorted by priority
   */
  static findMatchingRules(rules: Rule[], request: RequestInfo): Rule[] {
    return rules
      .filter((rule) => rule.enabled && this.matchesRequest(rule, request))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Apply header modifications from a rule
   */
  static applyHeaderModifications(
    headers: Record<string, string>,
    rule: Rule
  ): Record<string, string> {
    if (rule.action.type !== RuleType.HEADER_MODIFICATION) {
      return headers;
    }

    const modifiedHeaders = { ...headers };

    for (const modification of rule.action.headers) {
      switch (modification.operation) {
        case HeaderOperation.ADD:
          if (modification.value !== undefined) {
            modifiedHeaders[modification.name] = modification.value;
          }
          break;

        case HeaderOperation.MODIFY:
          if (modification.value !== undefined) {
            modifiedHeaders[modification.name] = modification.value;
          }
          break;

        case HeaderOperation.REMOVE:
          delete modifiedHeaders[modification.name];
          break;
      }
    }

    return modifiedHeaders;
  }

  /**
   * Match URL against wildcard pattern
   * Supports * as wildcard (matches any characters)
   */
  private static matchWildcard(url: string, pattern: string): boolean {
    // Escape special regex characters except *
    const escapedPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    const regex = new RegExp(`^${escapedPattern}$`);
    return regex.test(url);
  }

  /**
   * Match URL against regex pattern
   */
  private static matchRegex(url: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern);
      return regex.test(url);
    } catch (error) {
      // Invalid regex pattern
      console.error('Invalid regex pattern:', pattern, error);
      return false;
    }
  }

  /**
   * Detect conflicts between rules
   * Returns array of rule IDs that conflict with the given rule
   */
  static detectConflicts(rule: Rule, existingRules: Rule[]): string[] {
    const conflicts: string[] = [];

    for (const existingRule of existingRules) {
      if (existingRule.id === rule.id) {
        continue;
      }

      // Check if patterns overlap
      const patternsOverlap = this.patternsOverlap(
        rule.matcher.pattern,
        rule.matcher.type,
        existingRule.matcher.pattern,
        existingRule.matcher.type
      );

      if (patternsOverlap) {
        // Check if they have the same action type
        if (rule.action.type === existingRule.action.type) {
          conflicts.push(existingRule.id);
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two patterns overlap
   */
  private static patternsOverlap(
    pattern1: string,
    type1: 'exact' | 'wildcard' | 'regex',
    pattern2: string,
    type2: 'exact' | 'wildcard' | 'regex'
  ): boolean {
    // If both are exact, they overlap only if they're identical
    if (type1 === 'exact' && type2 === 'exact') {
      return pattern1 === pattern2;
    }

    // For wildcard and regex, we do a simplified check
    // In a production system, this would be more sophisticated
    if (type1 === 'wildcard' && type2 === 'exact') {
      return this.matchWildcard(pattern2, pattern1);
    }

    if (type1 === 'exact' && type2 === 'wildcard') {
      return this.matchWildcard(pattern1, pattern2);
    }

    if (type1 === 'wildcard' && type2 === 'wildcard') {
      // Check if patterns are similar (simplified check)
      return pattern1 === pattern2;
    }

    // For regex patterns, assume potential overlap
    // A more sophisticated check would require pattern analysis
    return false;
  }
}
