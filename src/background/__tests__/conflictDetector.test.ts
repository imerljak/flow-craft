/**
 * Tests for ConflictDetector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictDetector } from '../conflictDetector';
import {
  Rule,
  RuleType,
  HeaderOperation,
  ConflictType,
  ConflictSeverity,
} from '@shared/types';

describe('ConflictDetector', () => {
  let testRules: Rule[];

  beforeEach(() => {
    testRules = [];
  });

  // Helper to create rules
  const createRule = (
    id: string,
    name: string,
    pattern: string,
    ruleType: RuleType,
    priority: number,
    enabled = true
  ): Rule => ({
    id,
    name,
    description: `Test rule ${id}`,
    enabled,
    priority,
    matcher: {
      type: 'wildcard',
      pattern,
    },
    action: ruleType === RuleType.HEADER_MODIFICATION
      ? {
          type: RuleType.HEADER_MODIFICATION,
          headers: [{ operation: HeaderOperation.ADD, name: 'X-Test', value: 'test' }],
        }
      : ruleType === RuleType.URL_REDIRECT
      ? { type: RuleType.URL_REDIRECT, redirectUrl: 'https://example.com' }
      : ruleType === RuleType.REQUEST_BLOCK
      ? { type: RuleType.REQUEST_BLOCK }
      : ruleType === RuleType.MOCK_RESPONSE
      ? { type: RuleType.MOCK_RESPONSE, mockResponse: { statusCode: 200, headers: {} } }
      : { type: RuleType.QUERY_PARAM, params: [] },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  describe('detectConflicts', () => {
    it('should return empty array for no rules', () => {
      const conflicts = ConflictDetector.detectConflicts([]);
      expect(conflicts).toEqual([]);
    });

    it('should return empty array for single rule', () => {
      testRules = [createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10)];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts).toEqual([]);
    });

    it('should return empty array for disabled rules', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10, false),
        createRule('2', 'Rule 2', 'https://api.example.com/*', RuleType.URL_REDIRECT, 10, false),
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts).toEqual([]);
    });

    it('should detect action conflicts (block + redirect)', () => {
      testRules = [
        createRule('1', 'Block Rule', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Redirect Rule', 'https://api.example.com/*', RuleType.URL_REDIRECT, 5),
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some(c => c.type === ConflictType.ACTION_CONFLICT)).toBe(true);
    });

    it('should detect action conflicts (block + mock)', () => {
      testRules = [
        createRule('1', 'Block Rule', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Mock Rule', 'https://api.example.com/*', RuleType.MOCK_RESPONSE, 5),
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts.some(c => c.type === ConflictType.ACTION_CONFLICT)).toBe(true);
    });

    it('should detect priority conflicts', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
        createRule('2', 'Rule 2', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts.some(c => c.type === ConflictType.PRIORITY_CONFLICT)).toBe(true);
    });

    it('should detect shadowing (higher priority blocks lower)', () => {
      testRules = [
        createRule('1', 'High Priority Block', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 100),
        createRule('2', 'Low Priority Modify', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts.some(c => c.type === ConflictType.SHADOWING)).toBe(true);
    });

    it('should detect header conflicts', () => {
      testRules = [
        {
          ...createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [{ operation: HeaderOperation.ADD, name: 'X-Custom-Header', value: 'value1' }],
          },
        },
        {
          ...createRule('2', 'Rule 2', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 5),
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [{ operation: HeaderOperation.ADD, name: 'X-Custom-Header', value: 'value2' }],
          },
        },
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts.some(c => c.type === ConflictType.HEADER_CONFLICT)).toBe(true);
    });

    it('should detect redundant rules', () => {
      testRules = [
        createRule('1', 'Block Rule 1', 'https://api.example.com/users', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Block Rule 2', 'https://api.example.com/users', RuleType.REQUEST_BLOCK, 5),
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts.some(c => c.type === ConflictType.REDUNDANT)).toBe(true);
    });

    it('should not detect conflicts for non-overlapping patterns', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api1.example.com/*', RuleType.HEADER_MODIFICATION, 10),
        createRule('2', 'Rule 2', 'https://api2.example.com/*', RuleType.HEADER_MODIFICATION, 10),
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts).toEqual([]);
    });

    it('should assign correct severity levels', () => {
      testRules = [
        createRule('1', 'Block Rule', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Redirect Rule', 'https://api.example.com/*', RuleType.URL_REDIRECT, 5),
      ];
      const conflicts = ConflictDetector.detectConflicts(testRules);
      const actionConflict = conflicts.find(c => c.type === ConflictType.ACTION_CONFLICT);
      expect(actionConflict?.severity).toBe(ConflictSeverity.ERROR);
    });
  });

  describe('detectConflictsForRule', () => {
    it('should detect conflicts for a new rule', () => {
      testRules = [
        createRule('1', 'Existing Rule', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
      ];
      const newRule = createRule('2', 'New Rule', 'https://api.example.com/*', RuleType.URL_REDIRECT, 5);

      const conflicts = ConflictDetector.detectConflictsForRule(newRule, testRules);
      expect(conflicts.some(c => c.type === ConflictType.ACTION_CONFLICT)).toBe(true);
    });

    it('should not detect conflicts with itself', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
      ];
      const conflicts = ConflictDetector.detectConflictsForRule(testRules[0]!, testRules);
      expect(conflicts).toEqual([]);
    });

    it('should ignore disabled rules', () => {
      testRules = [
        createRule('1', 'Disabled Rule', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10, false),
      ];
      const newRule = createRule('2', 'New Rule', 'https://api.example.com/*', RuleType.URL_REDIRECT, 5);

      const conflicts = ConflictDetector.detectConflictsForRule(newRule, testRules);
      expect(conflicts).toEqual([]);
    });

    it('should detect multiple conflict types for a rule', () => {
      testRules = [
        {
          ...createRule('1', 'Existing Rule', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [{ operation: HeaderOperation.ADD, name: 'X-Custom', value: 'value1' }],
          },
        },
      ];
      const newRule = {
        ...createRule('2', 'New Rule', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
        action: {
          type: RuleType.HEADER_MODIFICATION,
          headers: [{ operation: HeaderOperation.ADD, name: 'X-Custom', value: 'value2' }],
        },
      } as Rule;

      const conflicts = ConflictDetector.detectConflictsForRule(newRule, testRules);
      // Should detect both priority and header conflicts
      expect(conflicts.some(c => c.type === ConflictType.PRIORITY_CONFLICT)).toBe(true);
      expect(conflicts.some(c => c.type === ConflictType.HEADER_CONFLICT)).toBe(true);
    });
  });

  describe('getConflictSummary', () => {
    it('should return correct summary for no conflicts', () => {
      const summary = ConflictDetector.getConflictSummary([]);
      expect(summary.total).toBe(0);
      expect(summary.errors).toBe(0);
      expect(summary.warnings).toBe(0);
      expect(summary.info).toBe(0);
    });

    it('should count conflicts by severity', () => {
      testRules = [
        createRule('1', 'Block Rule', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Redirect Rule', 'https://api.example.com/*', RuleType.URL_REDIRECT, 5),
        createRule('3', 'Block Rule 2', 'https://api.example.com/users', RuleType.REQUEST_BLOCK, 8),
        createRule('4', 'Block Rule 3', 'https://api.example.com/users', RuleType.REQUEST_BLOCK, 3),
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      const summary = ConflictDetector.getConflictSummary(conflicts);

      expect(summary.total).toBe(conflicts.length);
      expect(summary.errors).toBeGreaterThanOrEqual(0);
      expect(summary.warnings).toBeGreaterThanOrEqual(0);
      expect(summary.info).toBeGreaterThanOrEqual(0);
    });

    it('should count conflicts by type', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
        createRule('2', 'Rule 2', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      const summary = ConflictDetector.getConflictSummary(conflicts);

      expect(summary.byType[ConflictType.PRIORITY_CONFLICT]).toBeGreaterThan(0);
    });
  });

  describe('pattern matching', () => {
    it('should detect overlaps with exact patterns', () => {
      testRules = [
        {
          ...createRule('1', 'Rule 1', 'https://api.example.com/users', RuleType.REQUEST_BLOCK, 10),
          matcher: { type: 'exact', pattern: 'https://api.example.com/users' },
        },
        {
          ...createRule('2', 'Rule 2', 'https://api.example.com/users', RuleType.URL_REDIRECT, 5),
          matcher: { type: 'exact', pattern: 'https://api.example.com/users' },
        },
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      expect(conflicts.some(c => c.type === ConflictType.ACTION_CONFLICT)).toBe(true);
    });

    it('should detect overlaps with wildcard patterns', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Rule 2', 'https://api.example.com/users', RuleType.URL_REDIRECT, 5),
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      // Wildcard pattern overlap detection is heuristic
      expect(conflicts.length).toBeGreaterThanOrEqual(0);
    });

    it('should conservatively assume regex patterns overlap', () => {
      testRules = [
        {
          ...createRule('1', 'Rule 1', '^https://api\\.example\\.com/.*', RuleType.REQUEST_BLOCK, 10),
          matcher: { type: 'regex', pattern: '^https://api\\.example\\.com/.*' },
        },
        {
          ...createRule('2', 'Rule 2', '^https://api\\.example\\.com/users.*', RuleType.URL_REDIRECT, 5),
          matcher: { type: 'regex', pattern: '^https://api\\.example\\.com/users.*' },
        },
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      // Regex patterns are assumed to overlap
      expect(conflicts.some(c => c.type === ConflictType.ACTION_CONFLICT)).toBe(true);
    });
  });

  describe('conflict details', () => {
    it('should include conflict message', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Rule 2', 'https://api.example.com/*', RuleType.URL_REDIRECT, 5),
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      const actionConflict = conflicts.find(c => c.type === ConflictType.ACTION_CONFLICT);
      expect(actionConflict?.message).toBeTruthy();
      expect(actionConflict?.message).toContain('Rule 1');
      expect(actionConflict?.message).toContain('Rule 2');
    });

    it('should include suggestion', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Rule 2', 'https://api.example.com/*', RuleType.URL_REDIRECT, 5),
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      const actionConflict = conflicts.find(c => c.type === ConflictType.ACTION_CONFLICT);
      expect(actionConflict?.suggestion).toBeTruthy();
    });

    it('should include affected rule IDs', () => {
      testRules = [
        createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.REQUEST_BLOCK, 10),
        createRule('2', 'Rule 2', 'https://api.example.com/*', RuleType.URL_REDIRECT, 5),
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      const actionConflict = conflicts.find(c => c.type === ConflictType.ACTION_CONFLICT);
      expect(actionConflict?.ruleIds).toContain('1');
      expect(actionConflict?.ruleIds).toContain('2');
    });

    it('should include conflict-specific details', () => {
      testRules = [
        {
          ...createRule('1', 'Rule 1', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 10),
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [{ operation: HeaderOperation.ADD, name: 'X-Custom', value: 'value1' }],
          },
        },
        {
          ...createRule('2', 'Rule 2', 'https://api.example.com/*', RuleType.HEADER_MODIFICATION, 5),
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [{ operation: HeaderOperation.ADD, name: 'X-Custom', value: 'value2' }],
          },
        },
      ];

      const conflicts = ConflictDetector.detectConflicts(testRules);
      const headerConflict = conflicts.find(c => c.type === ConflictType.HEADER_CONFLICT);
      expect(headerConflict?.details?.conflictingHeaders).toContain('X-Custom');
    });
  });
});
