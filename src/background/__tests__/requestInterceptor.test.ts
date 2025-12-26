/**
 * Request Interceptor tests - TDD approach
 * Tests conversion of FlowCraft rules to Chrome declarativeNetRequest rules
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestInterceptor } from '../requestInterceptor';
import {
  Rule,
  RuleType,

  HeaderOperation,
  ResourceType,
} from '@shared/types';
import Browser from 'webextension-polyfill';

describe('RequestInterceptor', () => {
  describe('convertToDeclarativeNetRequestRule', () => {
    describe('Header Modification', () => {
      it('should convert ADD header operation to Chrome format', () => {
        const rule: Rule = {
          id: 'test-1',
          name: 'Add Custom Header',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
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

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 1);

        expect(chromeRule).toEqual({
          id: 1,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                operation: 'set',
                header: 'X-Custom-Header',
                value: 'custom-value',
              },
            ],
          },
          condition: {
            urlFilter: 'https://api.example.com/users',
            resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'],
          },
        });
      });

      it('should convert REMOVE header operation to Chrome format', () => {
        const rule: Rule = {
          id: 'test-2',
          name: 'Remove Header',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
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

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 2);

        expect(chromeRule?.action).toEqual({
          type: 'modifyHeaders',
          requestHeaders: [
            {
              operation: 'remove',
              header: 'X-Remove-Me',
            },
          ],
        });
      });

      it('should handle multiple header modifications', () => {
        const rule: Rule = {
          id: 'test-3',
          name: 'Multiple Headers',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [
              {
                operation: HeaderOperation.ADD,
                name: 'X-Header-1',
                value: 'value1',
              },
              {
                operation: HeaderOperation.MODIFY,
                name: 'X-Header-2',
                value: 'value2',
              },
              {
                operation: HeaderOperation.REMOVE,
                name: 'X-Header-3',
              },
            ],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 3);

        expect(chromeRule?.action).toEqual({
          type: 'modifyHeaders',
          requestHeaders: [
            {
              operation: 'set',
              header: 'X-Header-1',
              value: 'value1',
            },
            {
              operation: 'set',
              header: 'X-Header-2',
              value: 'value2',
            },
            {
              operation: 'remove',
              header: 'X-Header-3',
            },
          ],
        });
      });
    });

    describe('URL Patterns', () => {
      it('should convert exact pattern to urlFilter', () => {
        const rule: Rule = {
          id: 'test-4',
          name: 'Exact Pattern',
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

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 4);

        expect(chromeRule?.condition.urlFilter).toBe('https://api.example.com/users');
      });

      it('should convert wildcard pattern to urlFilter', () => {
        const rule: Rule = {
          id: 'test-5',
          name: 'Wildcard Pattern',
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

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 5);

        expect(chromeRule?.condition.urlFilter).toBe('https://api.example.com/*');
      });

      it('should convert regex pattern to regexFilter', () => {
        const rule: Rule = {
          id: 'test-6',
          name: 'Regex Pattern',
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

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 6);

        expect(chromeRule?.condition).toEqual({
          regexFilter: '^https://api\\.example\\.com/users/\\d+$',
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'],
        });
      });
    });

    describe('Resource Types', () => {
      it('should include specified resource types', () => {
        const rule: Rule = {
          id: 'test-7',
          name: 'Specific Resource Types',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/data',
            resourceTypes: [ResourceType.XMLHTTPREQUEST, ResourceType.SCRIPT],
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 7);

        expect(chromeRule?.condition.resourceTypes).toEqual(['xmlhttprequest', 'script']);
      });

      it('should use default resource types if none specified', () => {
        const rule: Rule = {
          id: 'test-8',
          name: 'Default Resource Types',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/data',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 8);

        expect(chromeRule?.condition.resourceTypes).toEqual([
          'main_frame',
          'sub_frame',
          'xmlhttprequest',
        ]);
      });
    });

    describe('URL Redirect', () => {
      it('should convert redirect rule to Chrome format', () => {
        const rule: Rule = {
          id: 'test-9',
          name: 'Redirect Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://old.example.com/page',
          },
          action: {
            type: RuleType.URL_REDIRECT,
            redirectUrl: 'https://new.example.com/page',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 9);

        expect(chromeRule?.action).toEqual({
          type: 'redirect',
          redirect: {
            url: 'https://new.example.com/page',
          },
        });
      });
    });

    describe('Request Block', () => {
      it('should convert block rule to Chrome format', () => {
        const rule: Rule = {
          id: 'test-10',
          name: 'Block Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://tracker.example.com/*',
          },
          action: {
            type: RuleType.REQUEST_BLOCK,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 10);

        expect(chromeRule?.action).toEqual({
          type: 'block',
        });
      });
    });
  });

  describe('updateDynamicRules', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update Chrome dynamic rules when rules change', async () => {
      const rules: Rule[] = [
        {
          id: 'rule-1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
          action: {
            type: RuleType.HEADER_MODIFICATION,
            headers: [
              {
                operation: HeaderOperation.ADD,
                name: 'X-Custom',
                value: 'test',
              },
            ],
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Mock existing rules
      (Browser.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await RequestInterceptor.updateDynamicRules(rules);

      expect(Browser.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [],
        addRules: [
          expect.objectContaining({
            id: 1,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: [
                {
                  operation: 'set',
                  header: 'X-Custom',
                  value: 'test',
                },
              ],
            },
          }),
        ],
      });
    });

    it('should remove old rules before adding new ones', async () => {
      const rules: Rule[] = [];

      // Mock existing rules
      (Browser.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);

      await RequestInterceptor.updateDynamicRules(rules);

      expect(Browser.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [1, 2],
        addRules: [],
      });
    });

    it('should only include enabled rules', async () => {
      const rules: Rule[] = [
        {
          id: 'rule-1',
          name: 'Enabled Rule',
          enabled: true,
          priority: 1,
          matcher: { type: 'exact', pattern: 'https://example.com' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'rule-2',
          name: 'Disabled Rule',
          enabled: false,
          priority: 2,
          matcher: { type: 'exact', pattern: 'https://example.org' },
          action: { type: RuleType.HEADER_MODIFICATION, headers: [] },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (Browser.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await RequestInterceptor.updateDynamicRules(rules);

      const call = (Browser.declarativeNetRequest.updateDynamicRules as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call?.[0].addRules).toHaveLength(1);
    });
  });

  describe('Query Parameter Modification', () => {
    it('should convert add query param operation to Chrome format', () => {
      const rule: Rule = {
        id: 'test-qp-1',
        name: 'Add Query Param',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com/page',
        },
        action: {
          type: RuleType.QUERY_PARAM,
          params: [
            {
              operation: 'add',
              name: 'utm_source',
              value: 'google',
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 1);

      expect(chromeRule?.action).toEqual({
        type: 'redirect',
        redirect: {
          transform: {
            queryTransform: {
              addOrReplaceParams: [
                {
                  key: 'utm_source',
                  value: 'google',
                },
              ],
              removeParams: undefined,
            },
          },
        },
      });
    });

    it('should convert modify query param operation to Chrome format', () => {
      const rule: Rule = {
        id: 'test-qp-2',
        name: 'Modify Query Param',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com/page',
        },
        action: {
          type: RuleType.QUERY_PARAM,
          params: [
            {
              operation: 'modify',
              name: 'id',
              value: '123',
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 1);

      expect(chromeRule?.action).toEqual({
        type: 'redirect',
        redirect: {
          transform: {
            queryTransform: {
              addOrReplaceParams: [
                {
                  key: 'id',
                  value: '123',
                },
              ],
              removeParams: undefined,
            },
          },
        },
      });
    });

    it('should convert remove query param operation to Chrome format', () => {
      const rule: Rule = {
        id: 'test-qp-3',
        name: 'Remove Query Param',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com/page',
        },
        action: {
          type: RuleType.QUERY_PARAM,
          params: [
            {
              operation: 'remove',
              name: 'tracking_id',
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 1);

      expect(chromeRule?.action).toEqual({
        type: 'redirect',
        redirect: {
          transform: {
            queryTransform: {
              addOrReplaceParams: undefined,
              removeParams: ['tracking_id'],
            },
          },
        },
      });
    });

    it('should handle multiple query param operations', () => {
      const rule: Rule = {
        id: 'test-qp-4',
        name: 'Multiple Query Param Operations',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com/page',
        },
        action: {
          type: RuleType.QUERY_PARAM,
          params: [
            {
              operation: 'add',
              name: 'new_param',
              value: 'value1',
            },
            {
              operation: 'modify',
              name: 'existing_param',
              value: 'value2',
            },
            {
              operation: 'remove',
              name: 'old_param',
            },
          ],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 1);

      expect(chromeRule?.action).toEqual({
        type: 'redirect',
        redirect: {
          transform: {
            queryTransform: {
              addOrReplaceParams: [
                {
                  key: 'new_param',
                  value: 'value1',
                },
                {
                  key: 'existing_param',
                  value: 'value2',
                },
              ],
              removeParams: ['old_param'],
            },
          },
        },
      });
    });
  });

  describe('Mock Response and Script Injection', () => {
    it('should return null for MOCK_RESPONSE rule type', () => {
      const rule: Rule = {
        id: 'test-mock',
        name: 'Mock Response Rule',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://api.example.com/data',
        },
        action: {
          type: RuleType.MOCK_RESPONSE,
          mockResponse: {
            statusCode: 200,
            headers: {},
            body: '{"data": "mocked"}',
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 1);
      expect(chromeRule).toBeNull();
    });

    it('should return null for SCRIPT_INJECTION rule type', () => {
      const rule: Rule = {
        id: 'test-script',
        name: 'Script Injection Rule',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com',
        },
        action: {
          type: RuleType.SCRIPT_INJECTION,
          script: {
            code: 'console.log("injected");',
            runAt: 'document_end',
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const chromeRule = RequestInterceptor.convertToDeclarativeNetRequestRule(rule, 1);
      expect(chromeRule).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when buildHeaderModificationAction receives non-header rule', () => {
      const rule: Rule = {
        id: 'test-invalid',
        name: 'Invalid Rule',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com',
        },
        action: {
          type: RuleType.REQUEST_BLOCK,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Access private method through the class
      expect(() => {
        // @ts-expect-error Testing private method
        RequestInterceptor.buildHeaderModificationAction(rule);
      }).toThrow('Invalid rule type for header modification');
    });

    it('should throw error when buildQueryParamTransform receives non-query-param rule', () => {
      const rule: Rule = {
        id: 'test-invalid',
        name: 'Invalid Rule',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://example.com',
        },
        action: {
          type: RuleType.REQUEST_BLOCK,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(() => {
        // @ts-expect-error Testing private method
        RequestInterceptor.buildQueryParamTransform(rule);
      }).toThrow('Invalid rule type for query parameter modification');
    });

    it('should handle errors when updating dynamic rules', async () => {
      const rules: Rule[] = [
        {
          id: 'rule-1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.REQUEST_BLOCK,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Mock getDynamicRules to succeed
      (Browser.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      // Mock updateDynamicRules to fail
      (Browser.declarativeNetRequest.updateDynamicRules as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Failed to update rules')
      );

      await expect(RequestInterceptor.updateDynamicRules(rules)).rejects.toThrow('Failed to update rules');
    });
  });

  describe('getRuleByNumericId', () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      (Browser.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (Browser.declarativeNetRequest.updateDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    });

    it('should return rule by numeric ID after updateDynamicRules', async () => {
      const rules: Rule[] = [
        {
          id: 'flowcraft-rule-1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://example.com',
          },
          action: {
            type: RuleType.REQUEST_BLOCK,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await RequestInterceptor.updateDynamicRules(rules);

      const rule = RequestInterceptor.getRuleByNumericId(1);
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('flowcraft-rule-1');
      expect(rule?.name).toBe('Test Rule');
    });

    it('should return null for non-existent numeric ID', async () => {
      const rules: Rule[] = [];
      await RequestInterceptor.updateDynamicRules(rules);

      const rule = RequestInterceptor.getRuleByNumericId(999);
      expect(rule).toBeNull();
    });

    it('should return null when flowCraftId exists but rule not found', async () => {
      const rules: Rule[] = [
        {
          id: 'rule-1',
          name: 'Test Rule',
          enabled: true,
          priority: 1,
          matcher: { type: 'exact', pattern: 'https://example.com' },
          action: { type: RuleType.REQUEST_BLOCK },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await RequestInterceptor.updateDynamicRules(rules);

      // Manually corrupt the flowCraftRulesMap to simulate missing rule
      // @ts-expect-error Accessing private property for testing
      RequestInterceptor.flowCraftRulesMap.delete('rule-1');

      const rule = RequestInterceptor.getRuleByNumericId(1);
      expect(rule).toBeNull();
    });
  });

  describe('clearDynamicRules', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      (Browser.declarativeNetRequest.updateDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    });

    it('should clear all dynamic rules', async () => {
      // Mock existing rules
      (Browser.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);

      await RequestInterceptor.clearDynamicRules();

      expect(Browser.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [1, 2, 3],
        addRules: [],
      });
    });

    it('should handle clearing when no rules exist', async () => {
      (Browser.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await RequestInterceptor.clearDynamicRules();

      expect(Browser.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [],
        addRules: [],
      });
    });
  });
});
