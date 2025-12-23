/**
 * MAIN World Interceptor
 * This script runs in the page's main JavaScript context
 * Injected via chrome.scripting.executeScript with world: 'MAIN'
 */

((): void => {
  console.log('[FlowCraft] Initializing MAIN world interceptor');

  // Store original fetch and XHR
  const originalFetch = window.fetch;
  const OriginalXHR = window.XMLHttpRequest;

  /**
   * Check if URL should be mocked
   */
  async function checkForMock(url: string): Promise<{
    statusCode: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: string;
    delay?: number;
  } | null> {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36);

      const messageHandler = (event: MessageEvent): void => {
        if (event.data?.type === 'FLOWCRAFT_MOCK_RESPONSE' && event.data.requestId === requestId) {
          window.removeEventListener('message', messageHandler);
          resolve(event.data.mockResponse);
        }
      };

      window.addEventListener('message', messageHandler);

      // Request mock rule from bridge
      window.postMessage(
        {
          type: 'FLOWCRAFT_CHECK_MOCK',
          requestId,
          url,
        },
        '*'
      );

      // Timeout after 1 second
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve(null);
      }, 1000);
    });
  }

  /**
   * Get default status text for status code
   */
  function getDefaultStatusText(statusCode: number): string {
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
   * Intercept fetch API
   */
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

    const mockResponse = await checkForMock(url);

    if (mockResponse) {
      console.log('[FlowCraft] Mocking fetch request:', url, mockResponse);

      // Apply delay
      if (mockResponse.delay && mockResponse.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, mockResponse.delay));
      }

      // Create mock response
      return new Response(mockResponse.body || '', {
        status: mockResponse.statusCode,
        statusText: mockResponse.statusText || getDefaultStatusText(mockResponse.statusCode),
        headers: new Headers(mockResponse.headers || {}),
      });
    }

    // No mock, proceed with original fetch
    return originalFetch.call(this, input, init);
  };

  /**
   * Intercept XMLHttpRequest
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).XMLHttpRequest = function (): XMLHttpRequest {
    const xhr = new OriginalXHR();
    let requestUrl = '';
    let mockResponse: Awaited<ReturnType<typeof checkForMock>> = null;

    const originalOpen = xhr.open;
    const originalSend = xhr.send;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    xhr.open = function (...args: any[]): void {
      const [, url] = args;
      requestUrl = typeof url === 'string' ? url : url.href;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (originalOpen as any).apply(this, args);
    };

    xhr.send = async function (body?: Document | XMLHttpRequestBodyInit | null): Promise<void> {
      mockResponse = await checkForMock(requestUrl);

      if (mockResponse) {
        console.log('[FlowCraft] Mocking XHR request:', requestUrl, mockResponse);

        const capturedMockResponse = mockResponse;

        // Apply delay
        if (capturedMockResponse.delay && capturedMockResponse.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, capturedMockResponse.delay));
        }

        // Override properties
        Object.defineProperty(xhr, 'status', {
          get: () => capturedMockResponse.statusCode,
        });

        Object.defineProperty(xhr, 'statusText', {
          get: () => capturedMockResponse.statusText || getDefaultStatusText(capturedMockResponse.statusCode),
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

        // Override header methods
        const originalGetResponseHeader = xhr.getResponseHeader;
        xhr.getResponseHeader = function (name: string): ReturnType<XMLHttpRequest["getResponseHeader"]> {
          if (capturedMockResponse.headers) {
            const headers = capturedMockResponse.headers;
            return headers[name] || headers[name.toLowerCase()] || null;
          }
          return originalGetResponseHeader.call(this, name);
        };

        const originalGetAllResponseHeaders = xhr.getAllResponseHeaders;
        xhr.getAllResponseHeaders = function (): ReturnType<XMLHttpRequest["getAllResponseHeaders"]> {
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

      // No mock, proceed with original send
      return originalSend.call(this, body);
    };

    return xhr;
  };

  // Copy static properties
  Object.setPrototypeOf(window.XMLHttpRequest, OriginalXHR);
  window.XMLHttpRequest.prototype = OriginalXHR.prototype;

  console.log('[FlowCraft] MAIN world interceptor ready');
})();
