/**
 * Content Script - Request Interceptor
 * Injects interception code into the page's main world
 * Must run at document_start to intercept before page scripts
 */

/**
 * Inject the interceptor script into the page's main world
 * This is necessary because content scripts run in an isolated world
 * and can't intercept the page's fetch/XHR calls
 */
function injectInterceptor(): void {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      console.log('[FlowCraft] Injecting request interceptor into page context');

      // Store original fetch and XHR
      const originalFetch = window.fetch;
      const OriginalXHR = window.XMLHttpRequest;

      /**
       * Check if URL should be mocked
       */
      async function checkForMock(url) {
        return new Promise((resolve) => {
          // Send message to content script via custom event
          const requestId = Math.random().toString(36);

          const messageHandler = (event) => {
            if (event.detail && event.detail.requestId === requestId) {
              window.removeEventListener('flowcraft-mock-response', messageHandler);
              resolve(event.detail.mockResponse || null);
            }
          };

          window.addEventListener('flowcraft-mock-response', messageHandler);

          // Request mock rule from content script
          window.dispatchEvent(new CustomEvent('flowcraft-check-mock', {
            detail: { requestId, url }
          }));

          // Timeout after 1 second
          setTimeout(() => {
            window.removeEventListener('flowcraft-mock-response', messageHandler);
            resolve(null);
          }, 1000);
        });
      }

      /**
       * Intercept fetch API
       */
      window.fetch = async function(input, init) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        const mockResponse = await checkForMock(url);

        if (mockResponse) {
          console.log('[FlowCraft] Mocking fetch request:', url);

          // Apply delay
          if (mockResponse.delay && mockResponse.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
          }

          // Create mock response
          return new Response(mockResponse.body || '', {
            status: mockResponse.statusCode,
            statusText: mockResponse.statusText || getDefaultStatusText(mockResponse.statusCode),
            headers: new Headers(mockResponse.headers || {})
          });
        }

        // No mock, proceed with original fetch
        return originalFetch.call(this, input, init);
      };

      /**
       * Intercept XMLHttpRequest
       */
      window.XMLHttpRequest = function() {
        const xhr = new OriginalXHR();
        let requestUrl = '';
        let mockResponse = null;

        const originalOpen = xhr.open;
        const originalSend = xhr.send;

        xhr.open = function(...args) {
          const [_method, url] = args;
          requestUrl = typeof url === 'string' ? url : url.href;
          return originalOpen.apply(this, args);
        };

        xhr.send = async function(body) {
          mockResponse = await checkForMock(requestUrl);

          if (mockResponse) {
            console.log('[FlowCraft] Mocking XHR request:', requestUrl);

            // Apply delay
            if (mockResponse.delay && mockResponse.delay > 0) {
              await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
            }

            // Override properties
            Object.defineProperty(xhr, 'status', {
              get: () => mockResponse.statusCode
            });

            Object.defineProperty(xhr, 'statusText', {
              get: () => mockResponse.statusText || getDefaultStatusText(mockResponse.statusCode)
            });

            Object.defineProperty(xhr, 'response', {
              get: () => mockResponse.body || ''
            });

            Object.defineProperty(xhr, 'responseText', {
              get: () => mockResponse.body || ''
            });

            Object.defineProperty(xhr, 'readyState', {
              get: () => 4 // DONE
            });

            // Override header methods
            const originalGetResponseHeader = xhr.getResponseHeader;
            xhr.getResponseHeader = function(name) {
              if (mockResponse?.headers) {
                const headers = mockResponse.headers;
                return headers[name] || headers[name.toLowerCase()] || null;
              }
              return originalGetResponseHeader.call(this, name);
            };

            const originalGetAllResponseHeaders = xhr.getAllResponseHeaders;
            xhr.getAllResponseHeaders = function() {
              if (mockResponse?.headers) {
                return Object.entries(mockResponse.headers)
                  .map(([key, value]) => \`\${key}: \${value}\`)
                  .join('\\r\\n');
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

      /**
       * Get default status text for status code
       */
      function getDefaultStatusText(statusCode) {
        const statusTexts = {
          200: 'OK',
          201: 'Created',
          204: 'No Content',
          400: 'Bad Request',
          401: 'Unauthorized',
          403: 'Forbidden',
          404: 'Not Found',
          500: 'Internal Server Error',
          502: 'Bad Gateway',
          503: 'Service Unavailable'
        };
        return statusTexts[statusCode] || 'Unknown';
      }

      console.log('[FlowCraft] Request interceptor injected successfully');
    })();
  `;

  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

/**
 * Listen for mock check requests from the injected script
 */
window.addEventListener('flowcraft-check-mock', async (event: Event) => {
  const customEvent = event as CustomEvent;
  const { requestId, url } = customEvent.detail;

  console.log('[FlowCraft Content] Received mock check request:', url, requestId);

  try {
    // Ask background script for mock rule
    const response = await chrome.runtime.sendMessage({
      type: 'FIND_MOCK_RULE',
      url,
    });

    console.log('[FlowCraft Content] Background response:', response);

    // Send response back to injected script
    window.dispatchEvent(
      new CustomEvent('flowcraft-mock-response', {
        detail: {
          requestId,
          mockResponse: response?.success ? response.mockResponse : null,
        },
      })
    );
  } catch (error) {
    console.error('[FlowCraft Content] Error checking for mock rule:', error);
    // Send null response so the request doesn't hang
    window.dispatchEvent(
      new CustomEvent('flowcraft-mock-response', {
        detail: {
          requestId,
          mockResponse: null,
        },
      })
    );
  }
});

// Inject the interceptor immediately
console.log('[FlowCraft Content] Content script loaded, injecting interceptor...');
injectInterceptor();
