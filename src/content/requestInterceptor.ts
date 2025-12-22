/**
 * Content Script - Request Interceptor
 * Intercepts fetch and XMLHttpRequest to provide mock responses
 * Must run at document_start to intercept before page scripts
 */

import { Rule, RuleType, MockResponse } from '@shared/types';

interface MockRule {
  id: string;
  mockResponse: MockResponse;
}

/**
 * Request Interceptor for mock responses
 * Runs in the page context to intercept network requests
 */
class RequestInterceptorContent {
  private mockRules: Map<string, MockRule> = new Map();
  private initialized = false;

  /**
   * Initialize the interceptor
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Get initial mock rules from background
    await this.syncMockRules();

    // Intercept fetch API
    this.interceptFetch();

    // Intercept XMLHttpRequest
    this.interceptXHR();

    // Listen for rule updates
    this.setupMessageListener();

    this.initialized = true;
    console.log('[FlowCraft] Request interceptor initialized');
  }

  /**
   * Sync mock rules from background script
   */
  private async syncMockRules(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_MOCK_RULES',
      });

      if (response?.success && response?.rules) {
        this.mockRules.clear();
        for (const rule of response.rules as Rule[]) {
          if (rule.enabled && rule.action.type === RuleType.MOCK_RESPONSE) {
            this.mockRules.set(rule.id, {
              id: rule.id,
              mockResponse: rule.action.mockResponse,
            });
          }
        }
      }
    } catch (error) {
      console.error('[FlowCraft] Failed to sync mock rules:', error);
    }
  }

  /**
   * Setup message listener for rule updates
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'SYNC_MOCK_RULES') {
        void this.syncMockRules().then(() => {
          sendResponse({ success: true });
        });
        return true; // Keep channel open for async response
      }
      return false; // Not handled by this listener
    });
  }

  /**
   * Find matching mock rule for URL
   */
  private async findMatchingRule(url: string): Promise<MockRule | null> {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FIND_MOCK_RULE',
        url,
      });

      if (response?.success && response?.mockResponse) {
        return {
          id: response.ruleId,
          mockResponse: response.mockResponse,
        };
      }
    } catch (error) {
      console.error('[FlowCraft] Error finding mock rule:', error);
    }

    return null;
  }

  /**
   * Intercept fetch API
   */
  private interceptFetch(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      // Check for matching mock rule
      const mockRule = await self.findMatchingRule(url);

      if (mockRule) {
        console.log('[FlowCraft] Mocking fetch request:', url);

        // Apply delay if specified
        if (mockRule.mockResponse.delay && mockRule.mockResponse.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, mockRule.mockResponse.delay));
        }

        // Create mock response
        const response = new Response(mockRule.mockResponse.body || '', {
          status: mockRule.mockResponse.statusCode,
          statusText:
            mockRule.mockResponse.statusText || self.getDefaultStatusText(mockRule.mockResponse.statusCode),
          headers: new Headers(mockRule.mockResponse.headers || {}),
        });

        return response;
      }

      // No mock rule, proceed with original fetch
      return originalFetch.call(this, input, init);
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  private interceptXHR(): void {
    const self = this;
    const OriginalXHR = window.XMLHttpRequest;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      let requestUrl = '';
      let mockRule: MockRule | null = null;

      // Store original methods
      const originalOpen = xhr.open;
      const originalSend = xhr.send;

      // Override open to capture URL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      xhr.open = function (...args: any[]): void {
        const [_method, url] = args;
        requestUrl = typeof url === 'string' ? url : url.href;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (originalOpen as any).apply(this, args);
      };

      // Override send to check for mock
      xhr.send = async function (body?: Document | XMLHttpRequestBodyInit | null) {
        // Check for matching mock rule
        mockRule = await self.findMatchingRule(requestUrl);

        if (mockRule) {
          console.log('[FlowCraft] Mocking XHR request:', requestUrl);

          // Capture mock response to avoid type narrowing issues
          const capturedMockResponse = mockRule.mockResponse;

          // Apply delay if specified
          if (capturedMockResponse.delay && capturedMockResponse.delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, capturedMockResponse.delay));
          }

          // Simulate successful response
          Object.defineProperty(xhr, 'status', {
            get: () => capturedMockResponse.statusCode,
          });

          Object.defineProperty(xhr, 'statusText', {
            get: () => capturedMockResponse.statusText || self.getDefaultStatusText(capturedMockResponse.statusCode),
          });

          Object.defineProperty(xhr, 'response', {
            get: () => capturedMockResponse.body || '',
          });

          Object.defineProperty(xhr, 'responseText', {
            get: () => capturedMockResponse.body || '',
          });

          Object.defineProperty(xhr, 'readyState', {
            get: () => 4, // DONE
          });

          // Set response headers
          const originalGetResponseHeader = xhr.getResponseHeader;
          xhr.getResponseHeader = function (name: string) {
            if (capturedMockResponse.headers) {
              const headers = capturedMockResponse.headers;
              const value = headers[name] || headers[name.toLowerCase()];
              return value || null;
            }
            return originalGetResponseHeader.call(this, name);
          };

          const originalGetAllResponseHeaders = xhr.getAllResponseHeaders;
          xhr.getAllResponseHeaders = function () {
            if (capturedMockResponse.headers) {
              return Object.entries(capturedMockResponse.headers)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\r\n');
            }
            return originalGetAllResponseHeaders.call(this);
          };

          // Trigger events
          setTimeout(() => {
            xhr.dispatchEvent(new Event('loadstart'));
            xhr.dispatchEvent(new Event('readystatechange'));
            xhr.dispatchEvent(new Event('load'));
            xhr.dispatchEvent(new Event('loadend'));
          }, 0);

          return;
        }

        // No mock rule, proceed with original send
        return originalSend.call(this, body);
      };

      return xhr;
    };

    // Copy static properties
    Object.setPrototypeOf((window as any).XMLHttpRequest, OriginalXHR);
    (window as any).XMLHttpRequest.prototype = OriginalXHR.prototype;
  }

  /**
   * Get default status text for status code
   */
  private getDefaultStatusText(statusCode: number): string {
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
}

// Initialize the interceptor
const interceptor = new RequestInterceptorContent();
void interceptor.initialize();
