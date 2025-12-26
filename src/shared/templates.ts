/**
 * Rule Templates Library
 * Provides pre-configured rules for common use cases
 */

import {
  RuleTemplate,
  TemplateCategory,
  RuleType,
  HeaderOperation,
} from './types';

export const RULE_TEMPLATES: RuleTemplate[] = [
  // Development Templates
  {
    id: 'dev-disable-cache',
    name: 'Disable Browser Cache',
    description: 'Prevent browser caching for development to always get fresh content',
    category: TemplateCategory.DEVELOPMENT,
    tags: ['development', 'debugging', 'cache'],
    rule: {
      name: 'Disable Cache',
      description: 'Forces no-cache for all requests to ensure fresh content during development',
      enabled: true,
      priority: 10,
      matcher: {
        type: 'wildcard',
        pattern: '*',
      },
      action: {
        type: RuleType.HEADER_MODIFICATION,
        headers: [
          {
            operation: HeaderOperation.ADD,
            name: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            operation: HeaderOperation.ADD,
            name: 'Pragma',
            value: 'no-cache',
          },
          {
            operation: HeaderOperation.ADD,
            name: 'Expires',
            value: '0',
          },
        ],
      },
    },
    customizable: {
      pattern: true,
    },
    examples: [
      'Customize pattern to specific domain: https://myapp.com/*',
      'Use for API endpoints: https://api.myapp.com/*',
    ],
  },

  {
    id: 'dev-local-redirect',
    name: 'Redirect Production to Local',
    description: 'Redirect production API calls to local development server',
    category: TemplateCategory.DEVELOPMENT,
    tags: ['development', 'localhost', 'redirect', 'api'],
    rule: {
      name: 'API to Localhost',
      description: 'Redirects production API to localhost for testing',
      enabled: true,
      priority: 20,
      matcher: {
        type: 'wildcard',
        pattern: 'https://api.production.com/*',
      },
      action: {
        type: RuleType.URL_REDIRECT,
        redirectUrl: 'http://localhost:3000',
      },
    },
    customizable: {
      pattern: true,
      redirectUrl: true,
    },
    examples: [
      'Change pattern to your production API URL',
      'Change redirectUrl to your local dev server port',
    ],
  },

  {
    id: 'dev-cors-headers',
    name: 'Add CORS Headers',
    description: 'Add CORS headers to bypass restrictions during development',
    category: TemplateCategory.CORS,
    tags: ['cors', 'development', 'headers'],
    rule: {
      name: 'Enable CORS',
      description: 'Adds permissive CORS headers to responses',
      enabled: true,
      priority: 15,
      matcher: {
        type: 'wildcard',
        pattern: '*',
      },
      action: {
        type: RuleType.HEADER_MODIFICATION,
        headers: [
          {
            operation: HeaderOperation.ADD,
            name: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            operation: HeaderOperation.ADD,
            name: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            operation: HeaderOperation.ADD,
            name: 'Access-Control-Allow-Headers',
            value: '*',
          },
        ],
      },
    },
    customizable: {
      pattern: true,
      headers: true,
    },
    examples: [
      'Restrict to specific domain: https://api.example.com/*',
      'Customize allowed origins for security',
    ],
  },

  // Privacy Templates
  {
    id: 'privacy-block-trackers',
    name: 'Block Analytics & Trackers',
    description: 'Block common analytics and tracking scripts',
    category: TemplateCategory.PRIVACY,
    tags: ['privacy', 'analytics', 'tracking', 'block'],
    rule: {
      name: 'Block Trackers',
      description: 'Blocks Google Analytics and similar tracking services',
      enabled: true,
      priority: 30,
      matcher: {
        type: 'wildcard',
        pattern: '*google-analytics.com/*',
      },
      action: {
        type: RuleType.REQUEST_BLOCK,
      },
    },
    customizable: {
      pattern: true,
    },
    examples: [
      'Add more tracker patterns: *facebook.com/tr/*',
      'Combine with: *doubleclick.net/*',
    ],
  },

  {
    id: 'privacy-remove-headers',
    name: 'Remove Tracking Headers',
    description: 'Remove headers that can be used for tracking',
    category: TemplateCategory.PRIVACY,
    tags: ['privacy', 'headers', 'tracking'],
    rule: {
      name: 'Remove Tracking Headers',
      description: 'Removes Referer and other tracking headers',
      enabled: true,
      priority: 25,
      matcher: {
        type: 'wildcard',
        pattern: '*',
      },
      action: {
        type: RuleType.HEADER_MODIFICATION,
        headers: [
          {
            operation: HeaderOperation.REMOVE,
            name: 'Referer',
          },
          {
            operation: HeaderOperation.REMOVE,
            name: 'X-Requested-With',
          },
        ],
      },
    },
    customizable: {
      pattern: true,
      headers: true,
    },
    examples: [
      'Apply to specific sites only',
      'Add more headers to remove',
    ],
  },

  // Testing Templates
  {
    id: 'test-mock-api',
    name: 'Mock API Response',
    description: 'Return mock data for API testing without backend',
    category: TemplateCategory.TESTING,
    tags: ['testing', 'mock', 'api', 'json'],
    rule: {
      name: 'Mock API',
      description: 'Returns predefined JSON response for testing',
      enabled: true,
      priority: 40,
      matcher: {
        type: 'wildcard',
        pattern: 'https://api.example.com/users',
      },
      action: {
        type: RuleType.MOCK_RESPONSE,
        mockResponse: {
          statusCode: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          ], null, 2),
          delay: 0,
        },
      },
    },
    customizable: {
      pattern: true,
      mockResponse: true,
    },
    examples: [
      'Change body to match your API structure',
      'Add delay to simulate slow responses',
    ],
  },

  {
    id: 'test-simulate-error',
    name: 'Simulate Server Error',
    description: 'Test error handling by returning 500 errors',
    category: TemplateCategory.TESTING,
    tags: ['testing', 'error', 'mock', '500'],
    rule: {
      name: 'Simulate 500 Error',
      description: 'Returns server error for testing error handling',
      enabled: true,
      priority: 45,
      matcher: {
        type: 'wildcard',
        pattern: 'https://api.example.com/*',
      },
      action: {
        type: RuleType.MOCK_RESPONSE,
        mockResponse: {
          statusCode: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Internal server error' }),
          delay: 0,
        },
      },
    },
    customizable: {
      pattern: true,
      mockResponse: true,
    },
    examples: [
      'Test 404: Change statusCode to 404',
      'Test timeout: Add large delay value',
    ],
  },

  // Performance Templates
  {
    id: 'perf-block-ads',
    name: 'Block Advertisements',
    description: 'Block ad scripts to improve page load performance',
    category: TemplateCategory.PERFORMANCE,
    tags: ['performance', 'ads', 'block'],
    rule: {
      name: 'Block Ads',
      description: 'Blocks common ad networks to speed up page loading',
      enabled: true,
      priority: 50,
      matcher: {
        type: 'wildcard',
        pattern: '*doubleclick.net/*',
      },
      action: {
        type: RuleType.REQUEST_BLOCK,
      },
    },
    customizable: {
      pattern: true,
    },
    examples: [
      'Add more ad networks: *googlesyndication.com/*',
      'Block specific ad domains',
    ],
  },

  // API Templates
  {
    id: 'api-add-auth',
    name: 'Add Authorization Header',
    description: 'Automatically add auth token to API requests',
    category: TemplateCategory.API,
    tags: ['api', 'auth', 'headers', 'token'],
    rule: {
      name: 'Add Auth Token',
      description: 'Adds Bearer token to all API requests',
      enabled: true,
      priority: 35,
      matcher: {
        type: 'wildcard',
        pattern: 'https://api.example.com/*',
      },
      action: {
        type: RuleType.HEADER_MODIFICATION,
        headers: [
          {
            operation: HeaderOperation.ADD,
            name: 'Authorization',
            value: 'Bearer YOUR_TOKEN_HERE',
          },
        ],
      },
    },
    customizable: {
      pattern: true,
      headers: true,
    },
    examples: [
      'Replace YOUR_TOKEN_HERE with actual token',
      'Use for testing authenticated endpoints',
    ],
  },

  {
    id: 'api-modify-query',
    name: 'Add Debug Query Parameter',
    description: 'Add debug=true to all API requests',
    category: TemplateCategory.API,
    tags: ['api', 'query', 'debug'],
    rule: {
      name: 'Add Debug Param',
      description: 'Adds debug query parameter to requests',
      enabled: true,
      priority: 38,
      matcher: {
        type: 'wildcard',
        pattern: 'https://api.example.com/*',
      },
      action: {
        type: RuleType.QUERY_PARAM,
        params: [
          {
            operation: 'add',
            name: 'debug',
            value: 'true',
          },
        ],
      },
    },
    customizable: {
      pattern: true,
      params: true,
    },
    examples: [
      'Add API key: Add key=YOUR_KEY param',
      'Override parameters for testing',
    ],
  },

  // Security Templates
  {
    id: 'security-hsts',
    name: 'Add HSTS Header',
    description: 'Force HTTPS with HTTP Strict Transport Security',
    category: TemplateCategory.SECURITY,
    tags: ['security', 'https', 'hsts'],
    rule: {
      name: 'Enable HSTS',
      description: 'Adds HSTS header to enforce HTTPS',
      enabled: true,
      priority: 55,
      matcher: {
        type: 'wildcard',
        pattern: 'https://*',
      },
      action: {
        type: RuleType.HEADER_MODIFICATION,
        headers: [
          {
            operation: HeaderOperation.ADD,
            name: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    },
    customizable: {
      pattern: true,
      headers: true,
    },
    examples: [
      'Apply to your domain only',
      'Adjust max-age value',
    ],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): RuleTemplate[] {
  return RULE_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Search templates by name, description, or tags
 */
export function searchTemplates(query: string): RuleTemplate[] {
  const lowerQuery = query.toLowerCase();
  return RULE_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): RuleTemplate | undefined {
  return RULE_TEMPLATES.find((template) => template.id === id);
}
