/**
 * ResponseMocker tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseMocker } from '../responseMocker';
import { Rule, RuleType } from '@shared/types';

describe('ResponseMocker', () => {
  beforeEach(() => {
    ResponseMocker.clearMockRules();
  });

  describe('updateMockRules', () => {
    it('should store enabled mock response rules', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Mock Response',
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
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ResponseMocker.updateMockRules(rules);

      const matchingRule = ResponseMocker.findMatchingRule('https://api.example.com/data');
      expect(matchingRule).not.toBeNull();
      expect(matchingRule?.id).toBe('1');
    });

    it('should ignore disabled rules', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Disabled Mock',
          enabled: false,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/data',
          },
          action: {
            type: RuleType.MOCK_RESPONSE,
            mockResponse: {
              statusCode: 404,
              headers: {},
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ResponseMocker.updateMockRules(rules);

      const matchingRule = ResponseMocker.findMatchingRule('https://api.example.com/data');
      expect(matchingRule).toBeNull();
    });

    it('should ignore non-mock-response rules', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Header Rule',
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
        },
      ];

      await ResponseMocker.updateMockRules(rules);

      const matchingRule = ResponseMocker.findMatchingRule('https://api.example.com/data');
      expect(matchingRule).toBeNull();
    });
  });

  describe('findMatchingRule', () => {
    it('should find rule for exact URL match', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Mock',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
          action: {
            type: RuleType.MOCK_RESPONSE,
            mockResponse: {
              statusCode: 200,
              headers: {},
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ResponseMocker.updateMockRules(rules);

      const matchingRule = ResponseMocker.findMatchingRule('https://api.example.com/users');
      expect(matchingRule).not.toBeNull();
      expect(matchingRule?.id).toBe('1');
    });

    it('should find rule for wildcard URL match', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Mock',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'wildcard',
            pattern: 'https://api.example.com/*',
          },
          action: {
            type: RuleType.MOCK_RESPONSE,
            mockResponse: {
              statusCode: 200,
              headers: {},
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ResponseMocker.updateMockRules(rules);

      const matchingRule = ResponseMocker.findMatchingRule('https://api.example.com/any/path');
      expect(matchingRule).not.toBeNull();
    });

    it('should find rule for regex URL match', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Mock',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'regex',
            pattern: '^https://api\\.example\\.com/users/\\d+$',
          },
          action: {
            type: RuleType.MOCK_RESPONSE,
            mockResponse: {
              statusCode: 200,
              headers: {},
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ResponseMocker.updateMockRules(rules);

      const matchingRule = ResponseMocker.findMatchingRule('https://api.example.com/users/123');
      expect(matchingRule).not.toBeNull();
    });

    it('should return null for non-matching URL', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Mock',
          enabled: true,
          priority: 1,
          matcher: {
            type: 'exact',
            pattern: 'https://api.example.com/users',
          },
          action: {
            type: RuleType.MOCK_RESPONSE,
            mockResponse: {
              statusCode: 200,
              headers: {},
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ResponseMocker.updateMockRules(rules);

      const matchingRule = ResponseMocker.findMatchingRule('https://different.com');
      expect(matchingRule).toBeNull();
    });
  });

  describe('createMockResponse', () => {
    it('should create response with custom status code', () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Mock',
        enabled: true,
        priority: 1,
        matcher: {
          type: 'exact',
          pattern: 'https://api.example.com/data',
        },
        action: {
          type: RuleType.MOCK_RESPONSE,
          mockResponse: {
            statusCode: 404,
            headers: {},
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const response = ResponseMocker.createMockResponse(rule);

      expect(response.status).toBe(404);
    });

    it('should create response with custom status text', () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Mock',
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
            statusText: 'Custom Status',
            headers: {},
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const response = ResponseMocker.createMockResponse(rule);

      expect(response.statusText).toBe('Custom Status');
    });

    it('should use default status text when not provided', () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Mock',
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
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const response = ResponseMocker.createMockResponse(rule);

      expect(response.statusText).toBe('OK');
    });

    it('should create response with custom headers', () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Mock',
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
            headers: {
              'Content-Type': 'application/json',
              'X-Custom': 'value',
            },
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const response = ResponseMocker.createMockResponse(rule);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Custom')).toBe('value');
    });

    it('should create response with custom body', async () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Mock',
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
            body: '{"message": "test"}',
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const response = ResponseMocker.createMockResponse(rule);
      const body = await response.text();

      expect(body).toBe('{"message": "test"}');
    });
  });

  describe('applyDelay', () => {
    it('should apply delay when specified', async () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Mock',
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
            delay: 100,
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const startTime = Date.now();
      await ResponseMocker.applyDelay(rule);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow some timing tolerance
    });

    it('should not delay when delay is zero', async () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Mock',
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
            delay: 0,
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const startTime = Date.now();
      await ResponseMocker.applyDelay(rule);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(50); // Should be nearly instant
    });
  });

  describe('clearMockRules', () => {
    it('should clear all mock rules', async () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Mock',
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
            },
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      await ResponseMocker.updateMockRules(rules);
      ResponseMocker.clearMockRules();

      const matchingRule = ResponseMocker.findMatchingRule('https://api.example.com/data');
      expect(matchingRule).toBeNull();
    });
  });
});
