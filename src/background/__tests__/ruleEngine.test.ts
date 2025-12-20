/**
 * Rule Engine tests - TDD approach
 */

import { RuleEngine } from '../ruleEngine';
import {
  Rule,
  RuleType,
  HttpMethod,
  ResourceType,
  HeaderOperation,
} from '@shared/types';

describe('RuleEngine', () => {
  describe('matchesUrl', () => {
    describe('exact matching', () => {
      it('should match exact URL patterns', () => {
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users')).toBe(true);
      });

      it('should not match different URLs with exact pattern', () => {
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/posts')).toBe(false);
        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users/1')).toBe(false);
      });
    });

    describe('wildcard matching', () => {
      it('should match wildcard patterns with *', () => {
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'wildcard',
            pattern: 'https://api.example.com/*',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users')).toBe(true);
        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/posts')).toBe(true);
        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users/1')).toBe(true);
        expect(RuleEngine.matchesUrl(rule, 'https://other.example.com/users')).toBe(false);
      });

      it('should match wildcard patterns with multiple *', () => {
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'wildcard',
            pattern: 'https://*.example.com/*/data',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users/data')).toBe(true);
        expect(RuleEngine.matchesUrl(rule, 'https://cdn.example.com/assets/data')).toBe(true);
        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users/info')).toBe(false);
      });
    });

    describe('regex matching', () => {
      it('should match regex patterns', () => {
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'regex',
            pattern: '^https://api\\.example\\.com/users/\\d+$',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users/1')).toBe(true);
        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users/123')).toBe(true);
        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users/abc')).toBe(false);
        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users')).toBe(false);
      });

      it('should handle invalid regex patterns gracefully', () => {
        // Suppress console.error for this intentional error case
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'regex',
            pattern: '[invalid(regex',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(RuleEngine.matchesUrl(rule, 'https://api.example.com/users')).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid regex pattern:',
          '[invalid(regex',
          expect.any(SyntaxError)
        );

        consoleErrorSpy.mockRestore();
      });
    });

    describe('method filtering', () => {
      it('should match only specified HTTP methods', () => {
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
            methods: [HttpMethod.GET, HttpMethod.POST],
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(
          RuleEngine.matchesRequest(rule, {
            url: 'https://api.example.com/users',
            method: HttpMethod.GET,
          })
        ).toBe(true);

        expect(
          RuleEngine.matchesRequest(rule, {
            url: 'https://api.example.com/users',
            method: HttpMethod.POST,
          })
        ).toBe(true);

        expect(
          RuleEngine.matchesRequest(rule, {
            url: 'https://api.example.com/users',
            method: HttpMethod.DELETE,
          })
        ).toBe(false);
      });

      it('should match all methods if none specified', () => {
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(
          RuleEngine.matchesRequest(rule, {
            url: 'https://api.example.com/users',
            method: HttpMethod.GET,
          })
        ).toBe(true);

        expect(
          RuleEngine.matchesRequest(rule, {
            url: 'https://api.example.com/users',
            method: HttpMethod.DELETE,
          })
        ).toBe(true);
      });
    });

    describe('resource type filtering', () => {
      it('should match only specified resource types', () => {
        const rule: Rule = {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/data',
            resourceTypes: [ResourceType.XMLHTTPREQUEST],
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        expect(
          RuleEngine.matchesRequest(rule, {
            url: 'https://api.example.com/data',
            method: HttpMethod.GET,
            resourceType: ResourceType.XMLHTTPREQUEST,
          })
        ).toBe(true);

        expect(
          RuleEngine.matchesRequest(rule, {
            url: 'https://api.example.com/data',
            method: HttpMethod.GET,
            resourceType: ResourceType.SCRIPT,
          })
        ).toBe(false);
      });
    });
  });

  describe('findMatchingRules', () => {
    it('should return only enabled rules that match', () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Enabled Rule',
          enabled: true,
          priority: 1,
          matcher: { type: 'exact', pattern: 'https://api.example.com/users' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'Disabled Rule',
          enabled: false,
          priority: 2,
          matcher: { type: 'exact', pattern: 'https://api.example.com/users' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          name: 'Non-matching Rule',
          enabled: true,
          priority: 3,
          matcher: { type: 'exact', pattern: 'https://api.example.com/posts' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const matchingRules = RuleEngine.findMatchingRules(rules, {
        url: 'https://api.example.com/users',
        method: HttpMethod.GET,
      });

      expect(matchingRules).toHaveLength(1);
      expect(matchingRules[0]?.id).toBe('1');
    });

    it('should sort matching rules by priority (lower number = higher priority)', () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Low Priority',
          enabled: true,
          priority: 10,
          matcher: { type: 'wildcard', pattern: 'https://api.example.com/*' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          name: 'High Priority',
          enabled: true,
          priority: 1,
          matcher: { type: 'wildcard', pattern: 'https://api.example.com/*' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          name: 'Medium Priority',
          enabled: true,
          priority: 5,
          matcher: { type: 'wildcard', pattern: 'https://api.example.com/*' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const matchingRules = RuleEngine.findMatchingRules(rules, {
        url: 'https://api.example.com/users',
        method: HttpMethod.GET,
      });

      expect(matchingRules).toHaveLength(3);
      expect(matchingRules[0]?.id).toBe('2'); // Priority 1
      expect(matchingRules[1]?.id).toBe('3'); // Priority 5
      expect(matchingRules[2]?.id).toBe('1'); // Priority 10
    });
  });

  describe('applyHeaderModifications', () => {
    it('should add new headers', () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const rule: Rule = {
        id: '1',
        name: 'Add Header',
        enabled: true,
        priority: 1,
        matcher: { type: 'exact', pattern: 'https://api.example.com/users' },
        action: {
          type: RuleType.HEADER_MODIFICATION,
          headers: [
            {
              operation: HeaderOperation.ADD,
              name: 'X-Custom-Header',
              value: 'custom-value',
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const modifiedHeaders = RuleEngine.applyHeaderModifications(headers, rule);

      expect(modifiedHeaders).toEqual({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      });
    });

    it('should modify existing headers', () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer old-token',
      };

      const rule: Rule = {
        id: '1',
        name: 'Modify Header',
        enabled: true,
        priority: 1,
        matcher: { type: 'exact', pattern: 'https://api.example.com/users' },
        action: {
          type: RuleType.HEADER_MODIFICATION,
          headers: [
            {
              operation: HeaderOperation.MODIFY,
              name: 'Authorization',
              value: 'Bearer new-token',
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const modifiedHeaders = RuleEngine.applyHeaderModifications(headers, rule);

      expect(modifiedHeaders).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer new-token',
      });
    });

    it('should remove headers', () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
        'X-Remove-Me': 'value',
      };

      const rule: Rule = {
        id: '1',
        name: 'Remove Header',
        enabled: true,
        priority: 1,
        matcher: { type: 'exact', pattern: 'https://api.example.com/users' },
        action: {
          type: RuleType.HEADER_MODIFICATION,
          headers: [
            {
              operation: HeaderOperation.REMOVE,
              name: 'X-Remove-Me',
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const modifiedHeaders = RuleEngine.applyHeaderModifications(headers, rule);

      expect(modifiedHeaders).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      });
    });

    it('should apply multiple header modifications', () => {
      const headers: Record<string, string> = {
        'Content-Type': 'text/plain',
      };

      const rule: Rule = {
        id: '1',
        name: 'Multiple Modifications',
        enabled: true,
        priority: 1,
        matcher: { type: 'exact', pattern: 'https://api.example.com/users' },
        action: {
          type: RuleType.HEADER_MODIFICATION,
          headers: [
            {
              operation: HeaderOperation.MODIFY,
              name: 'Content-Type',
              value: 'application/json',
            },
            {
              operation: HeaderOperation.ADD,
              name: 'Authorization',
              value: 'Bearer token',
            },
            {
              operation: HeaderOperation.ADD,
              name: 'X-Custom',
              value: 'value',
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const modifiedHeaders = RuleEngine.applyHeaderModifications(headers, rule);

      expect(modifiedHeaders).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
        'X-Custom': 'value',
      });
    });
  });
});
