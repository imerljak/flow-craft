/**
 * Response Mocker - Handles mock HTTP responses for matched URLs
 */

import { Rule, RuleType } from '@shared/types';

/**
 * ResponseMocker manages mock response rules
 */
export class ResponseMocker {
  private static mockRules: Map<string, Rule> = new Map();

  /**
   * Update mock response rules
   */
  static async updateMockRules(rules: Rule[]): Promise<void> {
    // Clear existing rules
    this.mockRules.clear();

    // Add new mock response rules
    const mockRules = rules.filter(
      (rule) => rule.enabled && rule.action.type === RuleType.MOCK_RESPONSE
    );

    for (const rule of mockRules) {
      this.mockRules.set(rule.id, rule);
    }

    console.log(`Updated ${mockRules.length} mock response rules`);
  }

  /**
   * Check if a URL matches any mock response rules
   */
  static findMatchingRule(url: string): Rule | null {
    for (const rule of this.mockRules.values()) {
      if (this.matchesRule(rule, url)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Check if URL matches rule pattern
   */
  private static matchesRule(rule: Rule, url: string): boolean {
    const { matcher } = rule;

    try {
      switch (matcher.type) {
        case 'exact':
          return url === matcher.pattern;

        case 'wildcard': {
          const regexPattern = matcher.pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*');
          const regex = new RegExp(`^${regexPattern}$`);
          return regex.test(url);
        }

        case 'regex': {
          const regex = new RegExp(matcher.pattern);
          return regex.test(url);
        }

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error matching URL for rule ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Create a mock response for a matched rule
   */
  static createMockResponse(rule: Rule): Response {
    if (rule.action.type !== RuleType.MOCK_RESPONSE) {
      throw new Error('Invalid rule type for mock response');
    }

    const { mockResponse } = rule.action;

    // Create response options
    const responseOptions: ResponseInit = {
      status: mockResponse.statusCode,
      statusText: mockResponse.statusText || this.getDefaultStatusText(mockResponse.statusCode),
      headers: new Headers(mockResponse.headers),
    };

    // Create response body
    const body = mockResponse.body || '';

    return new Response(body, responseOptions);
  }

  /**
   * Get default status text for status code
   */
  private static getDefaultStatusText(statusCode: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };

    return statusTexts[statusCode] || 'Unknown';
  }

  /**
   * Apply delay to response if specified
   */
  static async applyDelay(rule: Rule): Promise<void> {
    if (rule.action.type !== RuleType.MOCK_RESPONSE) {
      return;
    }

    const delay = rule.action.mockResponse.delay;
    if (delay && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  /**
   * Clear all mock response rules
   */
  static clearMockRules(): void {
    this.mockRules.clear();
  }
}
