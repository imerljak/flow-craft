/**
 * Rule Conflict Detector
 * Analyzes rules for conflicts, overlaps, and potential issues
 */

import {
  Rule,
  RuleType,
  RuleConflict,
  ConflictType,
  ConflictSeverity,
  HeaderOperation,
} from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * ConflictDetector provides comprehensive rule conflict analysis
 */
export class ConflictDetector {
  /**
   * Detect all conflicts in a set of rules
   */
  static detectConflicts(rules: Rule[]): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    const enabledRules = rules.filter((r) => r.enabled);

    // Only check enabled rules for actual conflicts
    if (enabledRules.length < 2) {
      return conflicts;
    }

    // Check for pattern overlaps and shadowing
    conflicts.push(...this.detectPatternConflicts(enabledRules));

    // Check for action conflicts (incompatible actions on same URL)
    conflicts.push(...this.detectActionConflicts(enabledRules));

    // Check for priority conflicts
    conflicts.push(...this.detectPriorityConflicts(enabledRules));

    // Check for header conflicts
    conflicts.push(...this.detectHeaderConflicts(enabledRules));

    // Check for redundant rules
    conflicts.push(...this.detectRedundantRules(enabledRules));

    return conflicts;
  }

  /**
   * Detect conflicts for a specific rule against all others
   * Useful when editing/creating a rule
   */
  static detectConflictsForRule(rule: Rule, allRules: Rule[]): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    const otherEnabledRules = allRules.filter((r) => r.enabled && r.id !== rule.id);

    if (otherEnabledRules.length === 0) {
      return conflicts;
    }

    // Check against each other rule
    for (const otherRule of otherEnabledRules) {
      // Pattern overlap check
      if (this.patternsOverlap(rule, otherRule)) {
        // Check for action conflicts
        const actionConflict = this.checkActionConflict(rule, otherRule);
        if (actionConflict) {
          conflicts.push(actionConflict);
        }

        // Check for shadowing
        const shadowConflict = this.checkShadowing(rule, otherRule);
        if (shadowConflict) {
          conflicts.push(shadowConflict);
        }

        // Check for header conflicts
        const headerConflict = this.checkHeaderConflict(rule, otherRule);
        if (headerConflict) {
          conflicts.push(headerConflict);
        }
      }

      // Check for same priority
      if (rule.priority === otherRule.priority && this.patternsOverlap(rule, otherRule)) {
        conflicts.push(this.createPriorityConflict(rule, otherRule));
      }
    }

    return conflicts;
  }

  /**
   * Detect pattern overlaps and shadowing
   */
  private static detectPatternConflicts(rules: Rule[]): RuleConflict[] {
    const conflicts: RuleConflict[] = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        if (!rule1 || !rule2) continue;

        if (this.patternsOverlap(rule1, rule2)) {
          // Check for shadowing (higher priority completely overshadows lower)
          const shadowConflict = this.checkShadowing(rule1, rule2);
          if (shadowConflict) {
            conflicts.push(shadowConflict);
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect action conflicts (incompatible actions)
   */
  private static detectActionConflicts(rules: Rule[]): RuleConflict[] {
    const conflicts: RuleConflict[] = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        if (!rule1 || !rule2) continue;

        if (this.patternsOverlap(rule1, rule2)) {
          const conflict = this.checkActionConflict(rule1, rule2);
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect priority conflicts (same priority with overlapping patterns)
   */
  private static detectPriorityConflicts(rules: Rule[]): RuleConflict[] {
    const conflicts: RuleConflict[] = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        if (!rule1 || !rule2) continue;

        if (rule1.priority === rule2.priority && this.patternsOverlap(rule1, rule2)) {
          conflicts.push(this.createPriorityConflict(rule1, rule2));
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect header conflicts (multiple rules modifying same header)
   */
  private static detectHeaderConflicts(rules: Rule[]): RuleConflict[] {
    const conflicts: RuleConflict[] = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        if (!rule1 || !rule2) continue;

        if (this.patternsOverlap(rule1, rule2)) {
          const conflict = this.checkHeaderConflict(rule1, rule2);
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect redundant rules (duplicate or subset rules)
   */
  private static detectRedundantRules(rules: Rule[]): RuleConflict[] {
    const conflicts: RuleConflict[] = [];

    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        if (!rule1 || !rule2) continue;

        if (this.rulesAreRedundant(rule1, rule2)) {
          conflicts.push({
            id: uuidv4(),
            type: ConflictType.REDUNDANT,
            severity: ConflictSeverity.INFO,
            ruleIds: [rule1.id, rule2.id],
            message: `Rules "${rule1.name}" and "${rule2.name}" are redundant`,
            suggestion: 'Consider removing one of these rules or merging them',
            details: {
              overlappingPattern: rule1.matcher.pattern,
              conflictingActions: [rule1.action.type, rule2.action.type],
            },
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two patterns overlap
   */
  private static patternsOverlap(rule1: Rule, rule2: Rule): boolean {
    const pattern1 = rule1.matcher.pattern;
    const pattern2 = rule2.matcher.pattern;
    const type1 = rule1.matcher.type;
    const type2 = rule2.matcher.type;

    // Exact matches
    if (type1 === 'exact' && type2 === 'exact') {
      return pattern1 === pattern2;
    }

    // Wildcard patterns
    if (type1 === 'wildcard' || type2 === 'wildcard') {
      // Simple overlap detection for wildcards
      // This is a heuristic - full wildcard matching is complex
      const regex1 = this.wildcardToRegex(pattern1);
      const regex2 = this.wildcardToRegex(pattern2);

      // Test some common URLs to see if patterns overlap
      const testUrls = this.generateTestUrls(pattern1, pattern2);
      for (const url of testUrls) {
        if (regex1.test(url) && regex2.test(url)) {
          return true;
        }
      }
    }

    // Regex patterns - too complex to analyze, assume potential overlap
    if (type1 === 'regex' || type2 === 'regex') {
      // Conservative: if one is regex, assume potential overlap
      return true;
    }

    return false;
  }

  /**
   * Convert wildcard pattern to regex for testing
   */
  private static wildcardToRegex(pattern: string): RegExp {
    // Escape special regex characters except *
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Convert * to .*
    const regex = escaped.replace(/\*/g, '.*');
    return new RegExp(`^${regex}$`);
  }

  /**
   * Generate test URLs from patterns
   */
  private static generateTestUrls(pattern1: string, pattern2: string): string[] {
    const urls: string[] = [];

    // Extract domain/path from patterns
    const extractBase = (pattern: string): string => {
      return pattern.replace(/\*/g, 'example').replace(/\?.*/, '');
    };

    urls.push(extractBase(pattern1));
    urls.push(extractBase(pattern2));

    // Add common URL variations
    urls.push('https://example.com/api/users');
    urls.push('https://example.com/');
    urls.push('https://api.example.com/v1/data');

    return urls;
  }

  /**
   * Check for action conflicts between two rules
   */
  private static checkActionConflict(rule1: Rule, rule2: Rule): RuleConflict | null {
    const action1 = rule1.action.type;
    const action2 = rule2.action.type;

    // Incompatible action combinations
    const incompatibleActions: Array<[RuleType, RuleType]> = [
      [RuleType.REQUEST_BLOCK, RuleType.URL_REDIRECT],
      [RuleType.REQUEST_BLOCK, RuleType.MOCK_RESPONSE],
      [RuleType.REQUEST_BLOCK, RuleType.HEADER_MODIFICATION],
      [RuleType.REQUEST_BLOCK, RuleType.QUERY_PARAM],
      [RuleType.URL_REDIRECT, RuleType.MOCK_RESPONSE],
      [RuleType.MOCK_RESPONSE, RuleType.HEADER_MODIFICATION],
    ];

    for (const [type1, type2] of incompatibleActions) {
      if ((action1 === type1 && action2 === type2) || (action1 === type2 && action2 === type1)) {
        const higherPriorityRule = rule1.priority > rule2.priority ? rule1 : rule2;
        const lowerPriorityRule = rule1.priority > rule2.priority ? rule2 : rule1;

        return {
          id: uuidv4(),
          type: ConflictType.ACTION_CONFLICT,
          severity: ConflictSeverity.ERROR,
          ruleIds: [rule1.id, rule2.id],
          message: `Incompatible actions: "${higherPriorityRule.name}" (${action1}) conflicts with "${lowerPriorityRule.name}" (${action2})`,
          suggestion: `Only "${higherPriorityRule.name}" will apply due to higher priority. Consider adjusting patterns or priorities.`,
          details: {
            conflictingActions: [action1, action2],
            overlappingPattern: rule1.matcher.pattern,
          },
        };
      }
    }

    return null;
  }

  /**
   * Check for shadowing (higher priority rule makes lower one unreachable)
   */
  private static checkShadowing(rule1: Rule, rule2: Rule): RuleConflict | null {
    // Determine which rule has higher priority
    const higherRule = rule1.priority > rule2.priority ? rule1 : rule2;
    const lowerRule = rule1.priority > rule2.priority ? rule2 : rule1;

    // Check if higher priority rule completely shadows lower one
    // This happens when:
    // 1. Higher priority rule has same or broader pattern
    // 2. Higher priority rule has terminating action (block, redirect, mock)

    const terminatingActions = [
      RuleType.REQUEST_BLOCK,
      RuleType.URL_REDIRECT,
      RuleType.MOCK_RESPONSE,
    ];

    if (terminatingActions.includes(higherRule.action.type)) {
      // If patterns are identical or higher rule's pattern encompasses lower
      if (this.patternEncompasses(higherRule.matcher.pattern, lowerRule.matcher.pattern)) {
        return {
          id: uuidv4(),
          type: ConflictType.SHADOWING,
          severity: ConflictSeverity.WARNING,
          ruleIds: [higherRule.id, lowerRule.id],
          message: `Rule "${higherRule.name}" (priority ${higherRule.priority}) shadows "${lowerRule.name}" (priority ${lowerRule.priority})`,
          suggestion: `"${lowerRule.name}" will never execute. Consider removing it or adjusting priorities.`,
          details: {
            overlappingPattern: lowerRule.matcher.pattern,
            priority: higherRule.priority,
          },
        };
      }
    }

    return null;
  }

  /**
   * Check if pattern1 encompasses pattern2
   */
  private static patternEncompasses(pattern1: string, pattern2: string): boolean {
    // Simple heuristic: if pattern1 is broader (more wildcards or shorter)
    if (pattern1 === pattern2) return true;

    // If pattern1 is a prefix of pattern2 with wildcard
    if (pattern1.endsWith('*') && pattern2.startsWith(pattern1.slice(0, -1))) {
      return true;
    }

    return false;
  }

  /**
   * Check for header conflicts
   */
  private static checkHeaderConflict(rule1: Rule, rule2: Rule): RuleConflict | null {
    if (
      rule1.action.type !== RuleType.HEADER_MODIFICATION ||
      rule2.action.type !== RuleType.HEADER_MODIFICATION
    ) {
      return null;
    }

    const headers1 = rule1.action.headers;
    const headers2 = rule2.action.headers;

    // Find headers that both rules modify
    const conflictingHeaders: string[] = [];

    for (const h1 of headers1) {
      for (const h2 of headers2) {
        if (h1.name.toLowerCase() === h2.name.toLowerCase()) {
          // Same header being modified
          if (
            h1.operation !== HeaderOperation.REMOVE &&
            h2.operation !== HeaderOperation.REMOVE
          ) {
            conflictingHeaders.push(h1.name);
          }
        }
      }
    }

    if (conflictingHeaders.length > 0) {
      const higherRule = rule1.priority > rule2.priority ? rule1 : rule2;

      return {
        id: uuidv4(),
        type: ConflictType.HEADER_CONFLICT,
        severity: ConflictSeverity.WARNING,
        ruleIds: [rule1.id, rule2.id],
        message: `Both "${rule1.name}" and "${rule2.name}" modify the same headers: ${conflictingHeaders.join(', ')}`,
        suggestion: `"${higherRule.name}" will apply last. Consider merging rules or adjusting priorities.`,
        details: {
          conflictingHeaders,
          overlappingPattern: rule1.matcher.pattern,
          priority: higherRule.priority,
        },
      };
    }

    return null;
  }

  /**
   * Create priority conflict
   */
  private static createPriorityConflict(rule1: Rule, rule2: Rule): RuleConflict {
    return {
      id: uuidv4(),
      type: ConflictType.PRIORITY_CONFLICT,
      severity: ConflictSeverity.WARNING,
      ruleIds: [rule1.id, rule2.id],
      message: `Rules "${rule1.name}" and "${rule2.name}" have the same priority (${rule1.priority}) and overlapping patterns`,
      suggestion:
        'Execution order is undefined for rules with same priority. Consider assigning different priorities.',
      details: {
        priority: rule1.priority,
        overlappingPattern: rule1.matcher.pattern,
      },
    };
  }

  /**
   * Check if two rules are redundant
   */
  private static rulesAreRedundant(rule1: Rule, rule2: Rule): boolean {
    // Rules are redundant if they have:
    // 1. Same pattern and type
    // 2. Same action type
    // 3. Similar configuration

    if (
      rule1.matcher.pattern === rule2.matcher.pattern &&
      rule1.matcher.type === rule2.matcher.type &&
      rule1.action.type === rule2.action.type
    ) {
      // For simple actions like block, they're redundant
      if (rule1.action.type === RuleType.REQUEST_BLOCK) {
        return true;
      }

      // For redirects, check if same URL
      if (
        rule1.action.type === RuleType.URL_REDIRECT &&
        rule2.action.type === RuleType.URL_REDIRECT
      ) {
        return rule1.action.redirectUrl === rule2.action.redirectUrl;
      }

      // For other actions, assume not redundant (could have different configs)
      return false;
    }

    return false;
  }

  /**
   * Get conflict summary statistics
   */
  static getConflictSummary(conflicts: RuleConflict[]): {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    byType: Record<ConflictType, number>;
  } {
    const summary = {
      total: conflicts.length,
      errors: 0,
      warnings: 0,
      info: 0,
      byType: {
        [ConflictType.PATTERN_OVERLAP]: 0,
        [ConflictType.ACTION_CONFLICT]: 0,
        [ConflictType.PRIORITY_CONFLICT]: 0,
        [ConflictType.HEADER_CONFLICT]: 0,
        [ConflictType.SHADOWING]: 0,
        [ConflictType.REDUNDANT]: 0,
      },
    };

    for (const conflict of conflicts) {
      // Count by severity
      if (conflict.severity === ConflictSeverity.ERROR) summary.errors++;
      else if (conflict.severity === ConflictSeverity.WARNING) summary.warnings++;
      else if (conflict.severity === ConflictSeverity.INFO) summary.info++;

      // Count by type
      summary.byType[conflict.type]++;
    }

    return summary;
  }
}
